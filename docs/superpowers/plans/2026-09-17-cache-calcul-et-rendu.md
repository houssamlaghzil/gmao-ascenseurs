# Cache de calcul et de rendu — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire en sorte que les pages de Manei-Lift ne recalculent leurs agrégats (KPI, scores de risque...) qu'une fois par changement de données réel, et que les routes qui le permettent soient servies depuis le cache de rendu Next.js plutôt que recalculées à chaque requête HTTP.

**Architecture:** Deux caches empilés, un seul déclencheur d'invalidation (le compteur de version déjà présent dans `data/store.ts`, incrémenté par les 39 mutateurs). (1) Un cache de calcul maison (`lib/derived/cache-calcul.ts`, deux primitives de mémoïsation) enveloppe les fonctions coûteuses de `lib/derived/dashboard.ts`. (2) `force-dynamic` est retiré des 14 routes qui ne lisent ni `searchParams` ni `cookies()`/`headers()`, et `invaliderIndexes()` déclenche `revalidatePath('/', 'layout')` pour que Next.js régénère ces routes uniquement quand les données changent réellement.

**Tech Stack:** Next.js 14 App Router, TypeScript, Vitest, Playwright MCP pour la vérification visuelle finale.

**Spec:** `docs/superpowers/specs/2026-09-17-cache-calcul-et-rendu-design.md`

## Global Constraints

- Aucune fonction exportée de `lib/derived/dashboard.ts` ne doit changer de signature (nom, paramètres, type de retour) ni de valeur retournée pour les mêmes entrées — comportement observable strictement inchangé.
- Les mutateurs de `data/store.ts` remplacent déjà la référence de l'objet muté (jamais de mutation en place) — propriété à préserver, ne pas introduire de mutation en place en cours de route.
- Pas de dépendance à `unstable_cache` (angles morts documentés en `output: 'standalone'`, notre configuration).
- Suite de tests existante (80 tests au moment d'écrire ce plan) doit rester intégralement verte sans modification d'un test existant, sauf ajout strictement additif si un mock doit être étendu (nouvel export à mocker).
- Attribution des commits : `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` (ou `Claude Opus 5 (1M context)` pour la tâche C, dimensionnée Opus).

---

## Task A: `lib/derived/cache-calcul.ts` — primitives de mémoïsation

**Dimensionnement recommandé : Sonnet** (code entièrement spécifié ci-dessous, tâche mécanique).

**Files:**
- Create: `lib/derived/cache-calcul.ts`
- Test: `lib/derived/cache-calcul.test.ts`

**Interfaces:**
- Produces (consommé par la Task C) :
  ```ts
  export function memoiserSurVersion<A extends unknown[], R>(
    obtenirVersion: () => number,
    calcul: (...args: A) => R,
    cleArgs?: (...args: A) => string
  ): (...args: A) => R;

  export function memoiserSurVersionEtMinute<A extends unknown[], R>(
    obtenirVersion: () => number,
    calcul: (...args: A) => R,
    cleArgs?: (...args: A) => string
  ): (...args: A) => R;
  ```
- Consumes: rien (les primitives reçoivent `obtenirVersion` en paramètre injecté — pas d'import de `@/data/store`, testable en isolation).

- [ ] **Step 1: Écrire les tests (ils échoueront, le module n'existe pas encore)**

```ts
// lib/derived/cache-calcul.test.ts
import { describe, expect, it, vi } from 'vitest';
import { memoiserSurVersion, memoiserSurVersionEtMinute } from './cache-calcul';

describe('memoiserSurVersion', () => {
  it('ne recalcule pas tant que la version ne change pas', () => {
    let version = 1;
    const calcul = vi.fn(() => Math.random());
    const memoise = memoiserSurVersion(() => version, calcul);

    const premier = memoise();
    const second = memoise();

    expect(second).toBe(premier);
    expect(calcul).toHaveBeenCalledTimes(1);
  });

  it('recalcule quand la version change', () => {
    let version = 1;
    const calcul = vi.fn((n: number) => n * version);
    const memoise = memoiserSurVersion(() => version, calcul, (n) => String(n));

    const premier = memoise(2);
    version = 2;
    const second = memoise(2);

    expect(premier).toBe(2);
    expect(second).toBe(4);
    expect(calcul).toHaveBeenCalledTimes(2);
  });

  it('distingue deux jeux d\'arguments via cleArgs, sans se marcher dessus', () => {
    let version = 1;
    const calcul = vi.fn((limit: number) => `resultat-${limit}`);
    const memoise = memoiserSurVersion(() => version, calcul, (limit) => String(limit));

    expect(memoise(5)).toBe('resultat-5');
    expect(memoise(8)).toBe('resultat-8');
    expect(memoise(5)).toBe('resultat-5');
    expect(calcul).toHaveBeenCalledTimes(2);
  });

  it('sans cleArgs, tous les appels partagent la même entrée de cache', () => {
    let version = 1;
    const calcul = vi.fn(() => 'valeur');
    const memoise = memoiserSurVersion(() => version, calcul);

    memoise();
    memoise();

    expect(calcul).toHaveBeenCalledTimes(1);
  });
});

describe('memoiserSurVersionEtMinute', () => {
  it('ne recalcule pas dans la même minute et la même version', () => {
    const version = 1;
    const calcul = vi.fn(() => 'valeur');
    const memoise = memoiserSurVersionEtMinute(() => version, calcul);

    memoise();
    memoise();

    expect(calcul).toHaveBeenCalledTimes(1);
  });

  it('recalcule quand la version change, même dans la même minute', () => {
    let version = 1;
    const calcul = vi.fn(() => version);
    const memoise = memoiserSurVersionEtMinute(() => version, calcul);

    const premier = memoise();
    version = 2;
    const second = memoise();

    expect(premier).toBe(1);
    expect(second).toBe(2);
    expect(calcul).toHaveBeenCalledTimes(2);
  });

  it('recalcule quand la minute change, même à version inchangée', () => {
    const version = 1;
    let maintenant = 0;
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => maintenant);
    const calcul = vi.fn(() => 'valeur');
    const memoise = memoiserSurVersionEtMinute(() => version, calcul);

    memoise();
    maintenant = 61_000; // +61s : minute suivante
    memoise();

    expect(calcul).toHaveBeenCalledTimes(2);
    dateSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run: `npx vitest run lib/derived/cache-calcul.test.ts`
Expected: FAIL — `Cannot find module './cache-calcul'`

- [ ] **Step 3: Implémenter le module**

```ts
// lib/derived/cache-calcul.ts
/**
 * Cache de calcul entre requêtes — complète le `cache()` de React (qui ne
 * dédoublonne QUE dans une requête) par une mémoïsation qui survit ENTRE les
 * requêtes, tant que la version des données n'a pas changé. Purement du
 * JavaScript (Map + compteur), sans dépendance à `unstable_cache` — voir
 * docs/superpowers/specs/2026-09-17-cache-calcul-et-rendu-design.md.
 *
 * `obtenirVersion` est injecté (pas d'import de data/store ici) : chaque
 * primitive est testable isolément, sans mock du magasin de données.
 */

interface EntreeVersion<R> {
  version: number;
  valeur: R;
}

interface EntreeVersionEtMinute<R> extends EntreeVersion<R> {
  minute: number;
}

const CLE_PAR_DEFAUT = (): string => '';

/**
 * Mémoïse `calcul` tant que `obtenirVersion()` ne change pas. À utiliser pour
 * tout résultat qui ne dépend QUE des données du magasin (pas de l'heure
 * courante).
 */
export function memoiserSurVersion<A extends unknown[], R>(
  obtenirVersion: () => number,
  calcul: (...args: A) => R,
  cleArgs: (...args: A) => string = CLE_PAR_DEFAUT as (...args: A) => string
): (...args: A) => R {
  const cache = new Map<string, EntreeVersion<R>>();
  return (...args: A): R => {
    const version = obtenirVersion();
    const cle = cleArgs(...args);
    const entree = cache.get(cle);
    if (entree && entree.version === version) return entree.valeur;
    const valeur = calcul(...args);
    cache.set(cle, { version, valeur });
    return valeur;
  };
}

/**
 * Identique à `memoiserSurVersion`, avec en plus une granularité d'une
 * minute : à utiliser pour tout résultat qui dépend aussi de l'heure
 * courante (ex. dépassement de SLA, fenêtre glissante « 30 derniers jours »
 * du score de risque). Sans incidence perceptible sur une démo — réduit déjà
 * le recalcul d'« à chaque requête » à « au plus une fois par minute ».
 */
export function memoiserSurVersionEtMinute<A extends unknown[], R>(
  obtenirVersion: () => number,
  calcul: (...args: A) => R,
  cleArgs: (...args: A) => string = CLE_PAR_DEFAUT as (...args: A) => string
): (...args: A) => R {
  const cache = new Map<string, EntreeVersionEtMinute<R>>();
  return (...args: A): R => {
    const version = obtenirVersion();
    const minute = Math.floor(Date.now() / 60_000);
    const cle = cleArgs(...args);
    const entree = cache.get(cle);
    if (entree && entree.version === version && entree.minute === minute) return entree.valeur;
    const valeur = calcul(...args);
    cache.set(cle, { version, minute, valeur });
    return valeur;
  };
}
```

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run: `npx vitest run lib/derived/cache-calcul.test.ts`
Expected: PASS — 7 tests verts.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: zéro erreur touchant `lib/derived/cache-calcul.ts`.

- [ ] **Step 6: Commit**

```bash
git add lib/derived/cache-calcul.ts lib/derived/cache-calcul.test.ts
git commit -m "Ajoute le cache de calcul entre requêtes (mémoïsation par version + minute)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task B: `data/store.ts` — version exposée, revalidation centralisée, correction du score de risque

**Dimensionnement recommandé : Sonnet** (trois modifications entièrement spécifiées, sur un fichier déjà connu de la tranche précédente).

**Files:**
- Modify: `data/store.ts`

**Interfaces:**
- Produces (consommé par la Task C) : `export function getVersionDonnees(): number`
- Consumes: rien de nouveau (utilise `getInterventionsByAscenseurId`, déjà exporté).

- [ ] **Step 1: Localiser le compteur de version et la fonction `invaliderIndexes`**

```bash
grep -n "versionIndexes\|function invaliderIndexes\|function obtenirIndexes" data/store.ts
```

Ces éléments existent déjà (tranche précédente) — ne pas les recréer, les étendre.

- [ ] **Step 2: Exposer la version des données**

Juste après la déclaration de `versionIndexes` (variable privée existante), ajouter :

```ts
/** Version courante des données — s'incrémente à chaque mutation. Sert de clé au cache de calcul entre requêtes (lib/derived/cache-calcul.ts). */
export function getVersionDonnees(): number {
  return versionIndexes;
}
```

- [ ] **Step 3: Ajouter l'import de `revalidatePath` et la revalidation centralisée**

En haut du fichier, avec les autres imports :

```ts
import { revalidatePath } from 'next/cache';
```

Dans `invaliderIndexes()`, ajouter l'appel à `revalidatePath` **dans un `try/catch`** — `revalidatePath` lève une erreur si appelée hors d'un contexte de requête Next.js (scripts, tests Vitest, génération statique au build) ; le compteur de version, lui, doit toujours s'incrémenter même dans ces contextes :

```ts
function invaliderIndexes(): void {
  versionIndexes++;
  try {
    revalidatePath('/', 'layout');
  } catch {
    // Hors contexte de requête Next.js (tests, scripts, build) : la
    // revalidation du cache de rendu ne s'applique pas, seul le compteur de
    // version compte alors — voir le cache de calcul (lib/derived/cache-calcul.ts).
  }
}
```

- [ ] **Step 4: Corriger `getRiskScoreForAscenseur`**

```bash
grep -n "export function getRiskScoreForAscenseur" -A 6 data/store.ts
```

Remplacer :

```ts
export function getRiskScoreForAscenseur(ascenseurId: string): RiskScore | null {
  const ascenseur = getAscenseurById(ascenseurId);
  if (!ascenseur) return null;
  const parc = getParcById(ascenseur.parcId);
  if (!parc) return null;
  return computeFullRiskScore(ascenseur, interventions, parc);
}
```

par :

```ts
export function getRiskScoreForAscenseur(ascenseurId: string): RiskScore | null {
  const ascenseur = getAscenseurById(ascenseurId);
  if (!ascenseur) return null;
  const parc = getParcById(ascenseur.parcId);
  if (!parc) return null;
  return computeFullRiskScore(ascenseur, getInterventionsByAscenseurId(ascenseurId), parc);
}
```

(`getInterventionsByAscenseurId` est déjà exporté par ce même fichier depuis la tranche précédente — vérifié dans `domain/risk-scoring.ts` : chaque usage du tableau `interventions` y filtre immédiatement par `ascenseurId`, donc lui passer directement la liste déjà filtrée est un changement de comportement neutre, uniquement plus rapide : O(k) au lieu de O(n) par appareil.)

- [ ] **Step 5: Typecheck et suite de tests complète**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: zéro erreur.

Run: `npx vitest run`
Expected: tous les tests existants toujours verts (aucun fichier de test ne doit nécessiter de modification pour cette tâche — `getRiskScoreForAscenseur` et `invaliderIndexes` ne changent pas de signature, seulement d'implémentation interne).

- [ ] **Step 6: Vérifier que le compteur d'invalidations dans les mutateurs n'a pas changé**

```bash
grep -c "invaliderIndexes();" data/store.ts
```

Expected: même nombre qu'avant cette tâche (39 + les 2 `delete`, soit 41) — cette tâche ne touche PAS le nombre d'appels, seulement le corps de la fonction appelée.

- [ ] **Step 7: Commit**

```bash
git add data/store.ts
git commit -m "Expose la version des données, revalide le rendu Next.js à chaque mutation, corrige le score de risque

getVersionDonnees() sert de clé au nouveau cache de calcul entre requêtes.
invaliderIndexes() déclenche désormais revalidatePath('/', 'layout') en plus
du compteur de version existant — un seul point d'invalidation pour les deux
caches. getRiskScoreForAscenseur utilise l'index getInterventionsByAscenseurId
au lieu de scanner les 4050 interventions à chaque appareil (17,6M itérations
au total sur getAscenseursAvecRisque, ramenées à ~4050).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task C: `lib/derived/dashboard.ts` — appliquer le cache de calcul

**Dimensionnement recommandé : Opus** (dix décisions de mise en cache, dont deux dépendances temporelles cachées à préserver correctement — enjeu de correction sur la page la plus consultée de l'app).

**Dépend de :** Task A (primitives) et Task B (`getVersionDonnees`) — à exécuter après leur complétion.

**Files:**
- Modify: `lib/derived/dashboard.ts`

**Interfaces:**
- Consumes : `memoiserSurVersion`/`memoiserSurVersionEtMinute` (Task A, `./cache-calcul`), `getVersionDonnees` (Task B, `@/data/store`).
- Produces : aucune interface nouvelle — les 13 fonctions déjà exportées gardent EXACTEMENT leur signature actuelle.

**Contexte détaillé (issu de la lecture complète du fichier actuel) :**

Le fichier a déjà été consolidé lors de la tranche précédente (agrégats partagés `agregatsParc`/`agregatsInterventions`/`agregatsMaintenances`/`compteurInterventionsHorsSLA`, mémoïsés via `cache()` de React — qui ne dédoublonne QUE dans une requête). Cette tâche ajoute un DEUXIÈME niveau, entre requêtes, en enveloppant les fonctions EXPORTÉES elles-mêmes.

Répartition exacte, fonction par fonction :

| Fonction | Primitive | `cleArgs` | Pourquoi |
|---|---|---|---|
| `getKpisTableauDeBord` | `memoiserSurVersionEtMinute` | défaut (aucune) | Le paramètre `maintenant` n'a qu'un seul point d'appel réel (`app/page.tsx`, sans argument) ; la granularité minute couvre déjà le besoin de fraîcheur temporelle. |
| `getActiviteParJour` | `memoiserSurVersionEtMinute` | défaut | Dépend de « aujourd'hui » (`new Date()`) ; le paramètre `_nbJoursIgnore` est déjà sans effet. |
| `getTauxDisponibiliteParc` | `memoiserSurVersion` | défaut | Ne lit que `agregatsParc()`, aucune dépendance temporelle. |
| `getRepartitionInterventions` | `memoiserSurVersion` | défaut | Ne lit que `agregatsInterventions()`. |
| `getRepartitionMaintenances` | `memoiserSurVersion` | défaut | Ne lit que `agregatsMaintenances()`. |
| `getRepartitionCausesPanne` | `memoiserSurVersion` | défaut | Ne lit que `agregatsInterventions()`. |
| `getTauxRespectSLAGlobal` | `memoiserSurVersionEtMinute` | défaut | Utilise `Date.now()` en interne (dépassement de SLA). |
| `getChargeTechniciens` | `memoiserSurVersion` | `(limit) => String(limit)` | Dépend de `limit` (plusieurs valeurs possibles selon l'appelant) mais d'aucune notion de temps (les statuts vérifiés ne comparent aucune date). |
| `getAscenseursAvecRisque` | `memoiserSurVersionEtMinute` | défaut | **Piège à ne pas manquer** : `domain/risk-scoring.ts` (`countInterventionsRecentes`) calcule une fenêtre glissante « 30 derniers jours » via `new Date()` — le score dépend donc aussi du temps, pas seulement des données. Utiliser `memoiserSurVersion` (sans minute) serait un bug silencieux : le score resterait figé indéfiniment entre deux mutations, même si des jours passent. |
| `getActiviteRecente` | `memoiserSurVersion` | `(limit) => String(limit)` | Trie par récence des horodatages des DONNÉES elles-mêmes (`plusRecents`), ne compare à aucune heure courante — dépend de `limit` uniquement. |

Volontairement PAS enveloppées (laisser telles quelles) :
- `getPrioriteAffichageMaintenance` : helper par élément, appelé en boucle à l'intérieur de `getKpisTableauDeBord` — pas un agrégat de premier niveau.
- `getTopAscenseursRisque` : une fois `getAscenseursAvecRisque()` mis en cache, son propre coût (tri de ~4348 éléments + quelques lectures indexées pour le top N) est négligeable.
- `getUrgences` : un seul passage sur ~4050 interventions, déjà bon marché ; la mettre en cache correctement demanderait de gérer sa dépendance à un argument tableau (`ascenseursAvecRisque`) sans bénéfice mesurable.

**Mécanique de l'enveloppe** (identique pour chacune des 10 fonctions du tableau) : renommer l'implémentation actuelle en fonction privée (suffixe `Impl`), et exporter le résultat de `memoiserSurVersion(getVersionDonnees, ...)` ou `memoiserSurVersionEtMinute(getVersionDonnees, ...)` sous le nom d'origine. Exemple complet pour `getChargeTechniciens` (le seul avec un `cleArgs` non trivial ET un paramètre par défaut à préserver) :

```ts
// avant
export function getChargeTechniciens(limit = 8): ChargeTechnicien[] {
  return getAllTechniciens()
    .filter((t) => t.actif)
    // ... corps inchangé
}

// après
function getChargeTechniciensImpl(limit = 8): ChargeTechnicien[] {
  return getAllTechniciens()
    .filter((t) => t.actif)
    // ... corps strictement identique, aucun changement de logique
}

export const getChargeTechniciens = memoiserSurVersion(
  getVersionDonnees,
  getChargeTechniciensImpl,
  (limit) => String(limit)
);
```

Pour les fonctions sans `cleArgs` explicite (ex. `getTauxDisponibiliteParc`), omettre le troisième argument :

```ts
function getTauxDisponibiliteParcImpl(): number {
  // corps inchangé
}
export const getTauxDisponibiliteParc = memoiserSurVersion(getVersionDonnees, getTauxDisponibiliteParcImpl);
```

**Important** : le paramètre par défaut (`= new Date()`, `= 8`, `= 15`...) reste sur la fonction `...Impl` — ne PAS le dupliquer ni le déplacer sur le wrapper. Un appel sans argument (`getChargeTechniciens()`) traverse le wrapper avec `args = []`, et `calcul(...args)` déclenche alors normalement le défaut de `getChargeTechniciensImpl`.

- [ ] **Step 1: Ajouter les imports**

```ts
import { getVersionDonnees } from '@/data/store'; // ajouté à l'import existant depuis '@/data/store'
import { memoiserSurVersion, memoiserSurVersionEtMinute } from './cache-calcul';
```

- [ ] **Step 2: Appliquer les 10 enveloppes du tableau ci-dessus**

Suivre exactement la mécanique décrite : renommer chaque implémentation en `...Impl`, exporter le résultat de la primitive correspondante sous le nom d'origine. Ne modifier AUCUNE ligne de logique interne des 10 fonctions — seul le nom de la déclaration et l'ajout du wrapper changent.

- [ ] **Step 3: Mettre à jour le commentaire d'en-tête du fichier**

La phrase « [...] recalculée à chaque rendu (pages `force-dynamic`) » (lignes 7-8 actuelles) devient fausse. La remplacer par :

```
 * Simples ne veut pas dire répétés : le tableau de bord est la page la plus
 * consultée, et ses treize fonctions exportées lisaient chacune les mêmes
 * tableaux bruts pour leur propre compte. Les compteurs globaux passent donc
 * par les agrégats partagés ci-dessous (un seul parcours par tableau, mémoïsé
 * pour la durée de la requête), les lectures par clé étrangère par les accès
 * indexés du store (`getXByY`) plutôt que par un `filter()` maison, et dix des
 * treize fonctions exportées par un cache de calcul ENTRE les requêtes
 * (lib/derived/cache-calcul.ts, clé = version des données ± minute courante) —
 * voir docs/superpowers/specs/2026-09-17-cache-calcul-et-rendu-design.md pour
 * le détail architectural. Chaque fonction exportée rend exactement les mêmes
 * valeurs qu'avant.
```

- [ ] **Step 4: Lancer la suite de tests de ce fichier**

Run: `npx vitest run lib/derived/dashboard.test.ts`
Expected: les 19 tests existants restent verts SANS modification. Si un test échoue, la cause la plus probable est une primitive appliquée à la mauvaise fonction (ex. `memoiserSurVersion` au lieu de `memoiserSurVersionEtMinute` sur une fonction time-sensitive) — comparer au tableau ci-dessus avant toute autre hypothèse.

- [ ] **Step 5: Vérifier qu'aucune valeur ne change entre deux appels à version identique**

Ajouter temporairement (ou en test dédié si jugé utile) une vérification manuelle : appeler deux fois de suite `getKpisTableauDeBord()` dans le même processus sans mutation entre les deux appels, confirmer `toEqual` — preuve que le cache sert bien la même valeur plutôt que d'en recalculer une différente par erreur d'implémentation.

- [ ] **Step 6: Typecheck et suite complète**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: zéro erreur.

Run: `npx vitest run`
Expected: tous les tests verts.

- [ ] **Step 7: Commit**

```bash
git add lib/derived/dashboard.ts
git commit -m "Met en cache les agrégats du tableau de bord entre les requêtes

10 des 13 fonctions exportées passent par le nouveau cache de calcul
(lib/derived/cache-calcul.ts), mémoïsées par version des données (et par
minute pour celles qui dépendent aussi de l'heure courante, dont
getAscenseursAvecRisque — fenêtre glissante 30 jours du score de risque).
Comportement observable strictement inchangé, vérifié par la suite de
tests existante sans modification.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task D: Retirer `force-dynamic` des 14 routes éligibles

**Dimensionnement recommandé : Sonnet** (édition mécanique, un fichier à la fois, aucune ambiguïté).

**Files:**
- Modify (retirer la ligne `export const dynamic = 'force-dynamic';` et, si présente juste avant/après, la ligne vide en trop) :
  - `app/administration/page.tsx`
  - `app/appareils/[id]/page.tsx`
  - `app/contrats/page.tsx`
  - `app/contrats/[id]/page.tsx`
  - `app/ctq/[id]/page.tsx`
  - `app/integrations/page.tsx`
  - `app/interventions/[id]/page.tsx`
  - `app/mobile/appareils/[id]/page.tsx`
  - `app/mobile/maintenances/[id]/page.tsx`
  - `app/mobile/synchronisation/page.tsx`
  - `app/page.tsx`
  - `app/parc/[id]/page.tsx`
  - `app/rapports/[id]/page.tsx`
  - `app/rapports/[id]/pdf/page.tsx`
  - `app/taches/page.tsx`

**Interfaces:** aucune — modification purement locale à chaque fichier, aucun autre fichier n'en dépend.

- [ ] **Step 1: Confirmer la liste exacte avant modification**

```bash
grep -rl "export const dynamic = 'force-dynamic'" app --include="*.tsx" | wc -l
```

Expected: 35 (état actuel, avant cette tâche).

- [ ] **Step 2: Retirer la ligne dans chacun des 14 fichiers listés ci-dessus**

Pour chaque fichier, supprimer uniquement la ligne `export const dynamic = 'force-dynamic';` (et une éventuelle ligne vide devenue surnuméraire juste autour). Ne toucher à aucune autre ligne.

- [ ] **Step 3: Vérifier le compte final**

```bash
grep -rl "export const dynamic = 'force-dynamic'" app --include="*.tsx" | wc -l
```

Expected: 21 (35 − 14).

- [ ] **Step 4: Vérifier qu'aucun des 14 fichiers ne lit `searchParams`, `cookies()` ou `headers()`**

```bash
grep -lE "searchParams|cookies\(\)|headers\(\)" app/administration/page.tsx app/appareils/\[id\]/page.tsx app/contrats/page.tsx app/contrats/\[id\]/page.tsx app/ctq/\[id\]/page.tsx app/integrations/page.tsx app/interventions/\[id\]/page.tsx app/mobile/appareils/\[id\]/page.tsx app/mobile/maintenances/\[id\]/page.tsx app/mobile/synchronisation/page.tsx app/page.tsx app/parc/\[id\]/page.tsx app/rapports/\[id\]/page.tsx app/rapports/\[id\]/pdf/page.tsx app/taches/page.tsx
```

Expected: aucune sortie (déjà vérifié pendant le brainstorming, cette étape est une re-confirmation avant modification, pas une découverte).

- [ ] **Step 5: Build complet**

Run: `npx next build`
Expected: succès, 0 erreur. Noter dans le rapport final quelles routes parmi les 14 apparaissent désormais marquées statiques (`○`) plutôt que dynamiques (`ƒ`) dans le tableau de sortie du build — certaines resteront `ƒ` si elles dépendent d'un paramètre de route dynamique (`[id]`) même sans `force-dynamic`, ce qui est normal (Next.js les pré-rendra à la demande, pas au build).

- [ ] **Step 6: Commit**

```bash
git add app/administration/page.tsx "app/appareils/[id]/page.tsx" app/contrats/page.tsx "app/contrats/[id]/page.tsx" "app/ctq/[id]/page.tsx" app/integrations/page.tsx "app/interventions/[id]/page.tsx" "app/mobile/appareils/[id]/page.tsx" "app/mobile/maintenances/[id]/page.tsx" app/mobile/synchronisation/page.tsx app/page.tsx "app/parc/[id]/page.tsx" "app/rapports/[id]/page.tsx" "app/rapports/[id]/pdf/page.tsx" app/taches/page.tsx
git commit -m "Retire force-dynamic des 14 routes sans searchParams/cookies/headers

Ces routes peuvent désormais être servies depuis le cache de rendu
Next.js, invalidé uniquement quand une mutation change réellement les
données (revalidatePath centralisé dans data/store.ts, tranche
précédente de ce même effort). Vérifié : aucune ne lit searchParams,
cookies() ni headers() — pas de personnalisation par visiteur qui
rendrait un cache partagé incorrect.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task E: Intégration finale, vérification visuelle, déploiement

**Ne PAS déléguer** — exécutée directement en session principale (nécessite la coordination des 4 tâches précédentes, l'accès Playwright et Dokploy, et le jugement final avant mise en production).

**Dépend de :** Tasks A, B, C, D — toutes complétées.

- [ ] **Step 1: Vérification complète post-intégration**

```bash
npx tsc --noEmit -p tsconfig.json
npx vitest run
npx next build
```

Expected: zéro erreur, tous les tests verts, build réussi.

- [ ] **Step 2: Démarrer le serveur en mode production locale**

```bash
npm run start
```

- [ ] **Step 3: Vérification visuelle Playwright — état initial**

Capturer une capture d'écran du tableau de bord (`/`), d'une route `[id]` (ex. `/appareils/<un-id-reel>`), et d'une route `searchParams` (ex. `/interventions?sla=depasse`). Confirmer visuellement l'absence de régression (mêmes sections, mêmes données cohérentes qu'avant cette tranche).

- [ ] **Step 4: Vérification de bout en bout de la fraîcheur (le test qui compte vraiment)**

C'est ici que se vérifie l'hypothèse technique centrale du design : que `revalidatePath` appelé depuis l'intérieur de `invaliderIndexes()` (donc en profondeur d'appel, pas à la racine d'une Server Action) revalide bien le cache de rendu.

1. Noter une valeur affichée sur `/` qui dépend des données (ex. le nombre d'« Interventions ouvertes »).
2. Effectuer une mutation réelle via l'interface (ex. changer le statut d'une intervention depuis `/interventions/[id]`) qui doit faire varier cette valeur.
3. Recharger `/` SANS redémarrer le serveur.
4. Confirmer par capture d'écran que la valeur a changé — preuve que la revalidation fonctionne malgré le retrait de `force-dynamic`.

**Si la valeur ne change PAS** (cache resté périmé) : c'est le signal que l'hypothèse de conception a échoué à cet endroit précis. Repli documenté dans la spec : ajouter un appel explicite à `revalidatePath('/', 'layout')` dans chacun des 12 fichiers Server Actions existants (`grep -rl "revalidatePath" app --include="*.ts"` en donne la liste), juste après l'appel au mutateur de `data/store.ts`, en plus du mécanisme centralisé (qui reste en place pour les mutations non couvertes par ces 12 fichiers). Reprendre ce Step 4 après application du repli.

- [ ] **Step 5: Commit final si Step 4 a nécessité le repli**

Uniquement si le repli du Step 4 a été appliqué :

```bash
git add app/
git commit -m "Ajoute revalidatePath explicite dans les Server Actions (repli)

La revalidation centralisée depuis invaliderIndexes() ne suffisait pas
seule en profondeur d'appel — ajout explicite en complément dans les
Server Actions existantes.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Push direct sur master**

```bash
git push origin master
```

- [ ] **Step 7: Déploiement Dokploy**

Utiliser `mcp__dokploy__compose-deploy` avec `composeId: nT8EII3aI-SpIGuzHMbxH`. Puis surveiller via `mcp__dokploy__deployment-allByCompose` et `mcp__dokploy__deployment-readLogs` jusqu'à `status: "done"` (pas de grep approximatif sur le HTML — statut d'API strict, comme établi précédemment dans cette session).

- [ ] **Step 8: Vérification finale en production**

Capture d'écran de `/` en production, confirmation HTTP 200 et présence du contenu attendu (comparaison de chaînes strictes, pas de regex large). Optionnel mais utile : re-mesure Lighthouse ou timing direct pour quantifier le gain par rapport aux 2,9s de Speed Index mesurés avant cette tranche.

- [ ] **Step 9: Rapport à l'utilisateur**

Présenter les captures d'écran (avant/après si pertinent), confirmer que le déploiement est fonctionnel, résumer les gains mesurés.
