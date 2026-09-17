# Cache de calcul et cache de rendu — Approche 1

**Statut** : approuvé par l'utilisateur le 2026-09-17. Implémentation autorisée sans nouvelle relecture de ce document (carte blanche donnée explicitement).

## Contexte

Le magasin de données (`data/store.ts`) est désormais indexé (Map par id/clé étrangère, tranche précédente) et `lib/derived/dashboard.ts` fait un seul passage partagé par requête au lieu de plusieurs. Mesuré en production : Speed Index Lighthouse 4,0s→2,9s (score 0,1→0,29). Jugé encore insuffisant.

Cause restante : l'application est en Next.js 14 App Router avec `export const dynamic = 'force-dynamic'` sur 35 routes, ce qui force un recalcul ET un re-rendu complets à **chaque requête HTTP**, alors que les données ne changent qu'à la marge (mutations rares, via formulaires, exclusivement à travers 39 fonctions nommées de `data/store.ts` appelées par 12 fichiers Server Actions). Un compteur de version existe déjà pour invalider les index bruts à chaque mutation, mais rien ne met en cache les résultats CALCULÉS (KPI, scores de risque, agrégats) au-delà de la durée d'une seule requête — `cache()` de React ne dédoublonne que DANS une requête, jamais ENTRE deux requêtes.

Goulot d'étranglement précis, non résolu par la tranche précédente (exclu comme agrégat, pas un simple `getXById`/`getXByY`) : `getRiskScoreForAscenseur` (`data/store.ts:1028`) passe le tableau complet des 4050 interventions à `computeFullRiskScore`, pour CHAQUE appareil — 4348 appareils × 4050 interventions ≈ 17,6M itérations à chaque appel de `getAscenseursAvecRisque()`. Vérifié dans `domain/risk-scoring.ts` : chaque usage du tableau `interventions` y filtre immédiatement par `ascenseurId` — aucun besoin de vue flotte entière, la correction est sûre.

Contexte de déploiement : `output: 'standalone'` (Docker, auto-hébergé sur Dokploy, hôte mutualisé à forte contention CPU). `unstable_cache` (l'API de cache de données de Next.js) a des angles morts documentés en auto-hébergé avec cette configuration — écarté comme mécanisme principal.

## Décision

**Approche 1** (sur 3 présentées) : cache de calcul maison (JavaScript pur, sans dépendance à une API instable) + retrait de `force-dynamic` sur les routes qui le permettent + revalidation Next.js centralisée et volontairement large, greffée au même point que l'invalidation de version déjà existante.

Approches écartées :
- **Revalidation fine par mutateur** : l'audit des 12 fichiers Server Actions existants montre que ce mode laisse déjà des trous (chaque `revalidatePath` ne vise que sa propre route, jamais les pages transverses comme `/` ou `/explorer` qui affichent pourtant les mêmes données) — très probablement la raison d'être de `force-dynamic` à l'origine. Risque de régression de fraîcheur trop élevé sur une application aussi transversale.
- **Tout via `unstable_cache`** : angles morts connus en `output: 'standalone'`, risque de bugs de fraîcheur difficiles à diagnostiquer sur les chiffres les plus visibles de la démo.

## Architecture — deux caches empilés

```
Requête HTTP
    │
    ▼
Cache de rendu Next.js (route entière, HTML/RSC)
    │ hit → réponse immédiate, aucun code serveur ne s'exécute
    │ miss (searchParams, ou 1ère lecture après mutation)
    ▼
Rendu de la page → appelle lib/derived/*.ts
    │
    ▼
Cache de calcul (par fonction, maison, dans data/store.ts + lib/derived/cache-calcul.ts)
    │ hit → résultat déjà calculé, retourné en O(1)
    │ miss → calcul réel, puis mise en cache
    ▼
Résultat

Mutation (Server Action)
    │
    ▼
Mutateur (39 fonctions déjà identifiées) → invaliderIndexes()
    │
    ├─→ incrémente le compteur de version (existant)
    └─→ revalidatePath('/', 'layout')  [NOUVEAU]
```

Les deux caches partagent le même déclencheur d'invalidation : le compteur de version déjà en place dans `data/store.ts`. Une seule mutation, une seule invalidation, propagée aux deux niveaux.

## Composants

### 1. `data/store.ts` — exposer la version, corriger le score de risque

```ts
export function getVersionDonnees(): number { return versionIndexes; }
```

Correction de `getRiskScoreForAscenseur` :

```ts
// avant : computeFullRiskScore(ascenseur, interventions, parc)                        // scanne 4050 lignes
// après : computeFullRiskScore(ascenseur, getInterventionsByAscenseurId(ascenseurId), parc) // O(k)
```

### 2. `lib/derived/cache-calcul.ts` (nouveau module partagé)

Deux primitives de mémoïsation :

```ts
export function memoiserSurVersion<A extends unknown[], R>(calcul: (...a: A) => R): (...a: A) => R
export function memoiserSurVersionEtMinute<A extends unknown[], R>(calcul: (...a: A) => R): (...a: A) => R
```

- `memoiserSurVersion` : clé = `(getVersionDonnees(), arguments)`. Pour toute fonction dont le résultat ne dépend QUE des données (la majorité : KPI de comptage, répartitions, disponibilité, score de risque agrégé).
- `memoiserSurVersionEtMinute` : clé = `(getVersionDonnees(), minute courante, arguments)`. Pour les fonctions qui dépendent aussi de l'instant présent (dépassement de SLA, maintenances « en retard »/« cette semaine ») — granularité d'une minute, sans incidence perceptible sur une démo, réduit déjà le recalcul d'« à chaque requête » à « au plus une fois par minute ».

Portée mémoire : clé = `(version, arguments)`, combinaisons d'arguments bornées par les points d'appel fixes dans le code (jamais de valeur arbitraire côté utilisateur) — pas de croissance non bornée.

### 3. Application aux fonctions dérivées

`lib/derived/dashboard.ts` et tout autre module `lib/derived/*.ts` exposant des agrégats coûteux : chaque fonction exportée est enveloppée par l'une des deux primitives selon sa dépendance ou non à l'heure courante. `getAscenseursAvecRisque()` (point d'appel réel du score de risque, un seul calcul pour les 4348 appareils) devient mis en cache par version.

### 4. Retrait de `force-dynamic`

Sur les 14 routes qui ne lisent pas `searchParams` (dont `app/page.tsx`) : `app/administration`, `app/appareils/[id]`, `app/contrats`, `app/contrats/[id]`, `app/ctq/[id]`, `app/integrations`, `app/interventions/[id]`, `app/mobile/appareils/[id]`, `app/mobile/maintenances/[id]`, `app/mobile/synchronisation`, `app/page.tsx`, `app/parc/[id]`, `app/rapports/[id]`, `app/rapports/[id]/pdf`, `app/taches`.

Vérifié : aucune de ces 14 routes ne lit `cookies()`/`headers()` — pas de personnalisation par visiteur qui rendrait un cache partagé incorrect.

Les 20 routes pilotées par `searchParams` restent dynamiques (comportement Next.js par défaut dès lecture de `searchParams`) mais profitent pleinement du cache de calcul.

### 5. Revalidation centralisée

Point d'invalidation unique, greffé au même endroit que `invaliderIndexes()` dans `data/store.ts` :

```ts
function invaliderIndexes(): void {
  versionIndexes++;
  // + déclenchement de la revalidation Next.js (revalidatePath('/', 'layout'))
}
```

**À valider en tout premier lors de l'implémentation** (quelques minutes, avant le reste) : que `revalidatePath` fonctionne correctement appelé depuis l'intérieur de `invaliderIndexes()` (profondeur d'appel, toujours dans le contexte d'exécution d'une Server Action) plutôt que directement à la racine d'une fonction `'use server'`. Si ce n'est pas le cas : repli sur un appel explicite ajouté dans chacun des 12 fichiers Server Actions existants (`grep -rl "revalidatePath" app --include="*.ts"` donne la liste exacte).

Les appels `revalidatePath` déjà présents dans ces 12 fichiers restent tels quels (redondants mais inoffensifs avec la revalidation large) — aucune modification nécessaire si la validation ci-dessus réussit.

## Risques couverts

- **Cohérence** : les mutateurs remplacent déjà la référence de l'objet (`ascenseurs[index] = ascenseur`), jamais de mutation en place (vérifié sur `updateAscenseur`/`updateIntervention`) → aucune fuite d'état entre versions de cache.
- **Concurrence** : calculs synchrones en Node.js (mono-thread JS) → pas de « cache stampede » possible entre requêtes concurrentes.
- **`unstable_cache` évité** : le cache de calcul reste du JavaScript pur (Map + compteur), sans dépendance à cette API instable, cohérent avec `output: 'standalone'`.

## Vérification

- Suite de tests existante (80 tests) doit rester verte sans modification de test existant (comportement observable inchangé).
- Nouveaux tests unitaires pour `memoiserSurVersion`/`memoiserSurVersionEtMinute` (hit/miss selon version, granularité minute, pas de fuite entre arguments distincts).
- Vérification manuelle post-déploiement : captures d'écran de l'app fonctionnelle, mesure de temps de réponse avant/après sur `/`, nouveau test Lighthouse.

## Hors périmètre

- Migration de `lib/derived/explorer.ts`, `parc-liste.ts`, `conformite-contractuelle.ts`, `carte.ts` vers le cache de calcul, sauf si leurs fonctions sont déjà identifiées comme coûteuses pendant l'implémentation (jugement à l'exécution, cohérent avec l'esprit de la tranche précédente).
- Toute action sur l'infrastructure partagée (contention CPU de l'hôte Dokploy) — cause déjà diagnostiquée, non actionnable depuis ce dépôt.
