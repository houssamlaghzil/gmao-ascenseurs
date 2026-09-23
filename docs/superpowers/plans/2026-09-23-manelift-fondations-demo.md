# Fondations de la démonstration Manei-Lift — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe case à cocher (`- [ ]`) pour le suivi.

**Goal:** Rendre le socle de données de démonstration (déjà partagé entre Web et `/mobile` via `data/store.ts`) fiable pour une démo longue durée : horloge de démonstration unique, action de réinitialisation qui restaure aussi la fraîcheur des scénarios sensibles au temps, garde-fou testé sur l'indépendance des dates contractuelles de maintenance, bandeau global rappelant qu'il s'agit d'une maquette, et bouton de bascule Web ⇄ Android rendant enfin découvrable la maquette mobile déjà existante.

**Architecture:** Un seul point d'entrée pour « l'heure actuelle de la démo » (`getDateDemo()` dans `data/store.ts`), consommé par tous les calculs dérivés qui dépendent du temps (SLA, retards, urgences, risque). Une seule fonction de réinitialisation (`reinitialiserDonneesDemo()`) qui restaure les tableaux mutables à leur état initial ET recale les scénarios sensibles à la fraîcheur (ex. alertes « personne bloquée »). Aucun nouveau magasin de données, aucune session par visiteur : le magasin reste global au process, tel qu'il est aujourd'hui.

**Tech Stack:** Next.js 14 (App Router), TypeScript strict, Vitest, Tailwind CSS, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-23-manelift-maquette-etoffement-cahier-des-charges.md` (sections 1 et 4). Feuille de route : `docs/superpowers/plans/2026-09-23-manelift-maquette-etoffement-roadmap.md` (Phase 1).

## Global Constraints

- `domain/` reste pur : aucun import de `data/store` ni de `next/*` dans `domain/business-logic.ts` ou `domain/risk-scoring.ts`. Toute dépendance au temps y passe par un paramètre `maintenant: Date` optionnel, jamais par un import direct de l'horloge de démo.
- Aucune fonction exportée de `lib/derived/*.ts` ne doit changer de comportement observable pour les mêmes entrées et le même instant — seule la *source* de « l'heure actuelle » change (de `new Date()` codé en dur vers `getDateDemo()`), pas la logique.
- Le magasin de données (`data/store.ts`) est global au process Node, partagé par tous les visiteurs de la démo publique — pas de session par navigateur. `reinitialiserDonneesDemo()` remet tout le monde à zéro simultanément ; c'est un choix assumé (cahier des charges section 4.1 : « L'agent peut employer le mécanisme de persistance déjà utilisé par le projet »), pas un oubli.
- Suite de tests existante doit rester intégralement verte (`npx vitest run` — **jamais** `npm test` seul : le script `test` de `package.json` est `vitest` sans `run`, qui démarre le mode watch interactif et ne se termine jamais tout seul en session non interactive) sans modification d'un test existant, sauf ajout strictement additif si un mock doit être étendu.
- `npm run lint` et `npx tsc --noEmit` doivent rester sans erreur après chaque tâche.
- Les composants purement présentatifs de ce plan (bandeau, bouton de bascule) suivent la convention déjà en vigueur dans ce dépôt : `Navigation.tsx`, `AppShell.tsx`, `Card.tsx` n'ont aucun test unitaire (`vitest.config.ts` tourne en environnement `node`, sans DOM), donc ces tâches ne créent pas de test — une vérification manuelle (`npm run dev`) suffit, en plus du lint/typecheck.
- Attribution des commits : `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Review Focus

- Un calcul dérivé qui obtient encore son « maintenant » d'un `new Date()` oublié (au lieu de `getDateDemo()`) rendrait la réinitialisation partiellement inefficace sans qu'aucune erreur ne se déclare — la Tâche 3 se termine donc par une vérification `grep` exhaustive, pas seulement par la relecture des fichiers listés.
- Une réinitialisation appelée pendant qu'un autre visiteur a une page ouverte avec un formulaire en cours de saisie ne doit pas planter cette page : `reinitialiserDonneesDemo()` remplace des références de tableaux, elle ne mute rien en place (cohérent avec le reste de `data/store.ts`).
- Le cache `cacheEtapesIntervention` (chronologie d'intervention, déjà présent dans `data/store.ts`) doit être vidé par la réinitialisation, sinon une intervention restaurée à son état initial garderait une chronologie calculée avant reset — un oubli facile puisque ce cache n'est pas dans la liste des tableaux `let` évidents.
- Le bouton de bascule Android ne doit pas laisser un visiteur bloqué sur `/mobile` sans façon évidente de revenir au Web (symétrie de la Tâche 6).
- La date par défaut des paramètres `maintenant: Date = new Date()` dans `domain/risk-scoring.ts` doit rester `new Date()` (pas `getDateDemo()`) pour ne pas violer la pureté du domaine — c'est le *code appelant* dans `data/store.ts` qui doit passer `getDateDemo()` explicitement.

---

## Task 1: Bandeau de démonstration global

**Dimensionnement recommandé : Sonnet 5** (composant présentatif isolé, aucune logique).

**Files:**
- Create: `app/components/BandeauMaquette.tsx`
- Modify: `app/components/AppShell.tsx`

**Interfaces:**
- Produces : `export default function BandeauMaquette(): JSX.Element` — sans props pour l'instant (la Tâche 4 lui ajoutera le bouton de réinitialisation, dans ce même fichier).
- Consumes : rien.

- [ ] **Step 1 : Créer le composant**

```tsx
// app/components/BandeauMaquette.tsx
/**
 * Bandeau global rappelant qu'il s'agit d'une maquette (cahier des charges,
 * section 1) : aucune action de cet écran n'a d'effet réel sur un système
 * externe, même quand le libellé emploie un verbe métier ("valider",
 * "envoyer"...).
 */
export default function BandeauMaquette() {
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs font-medium text-amber-800">
      <span>Maquette — données fictives et actions simulées</span>
    </div>
  );
}
```

- [ ] **Step 2 : Monter le bandeau dans les deux branches de `AppShell`**

Dans `app/components/AppShell.tsx`, remplacer le fichier entier par :

```tsx
'use client';

/**
 * Coquille de l'application : barre latérale + contenu pour les pages Web,
 * plein écran neutre pour les pages sous /mobile (simulation de l'app
 * technicien, rendue dans un cadre téléphone par app/mobile/layout.tsx).
 */

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import BandeauMaquette from './BandeauMaquette';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobileSimulation = pathname?.startsWith('/mobile');

  if (isMobileSimulation) {
    return (
      <div className="min-h-screen bg-gray-100">
        <BandeauMaquette />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="md:pl-60">
        <BandeauMaquette />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
```

Remarque : le bandeau est placé à l'intérieur de `<main>` (pas au-dessus de `<Navigation>`) pour ne pas perturber le positionnement `md:fixed md:inset-y-0` de la barre latérale — modifier cette classe sort du périmètre de cette tâche.

- [ ] **Step 3 : Vérification manuelle (pas de test automatisé — voir Global Constraints)**

Run : `npx tsc --noEmit && npm run lint`
Expected : aucune erreur.

Puis `npm run dev`, ouvrir `/` et `/mobile/connexion` : le bandeau ambre doit apparaître en haut des deux, sans chevaucher la barre latérale ni le cadre téléphone.

- [ ] **Step 4 : Commit**

```bash
git add app/components/BandeauMaquette.tsx app/components/AppShell.tsx
git commit -m "$(cat <<'EOF'
Ajoute le bandeau global de maquette (Web + Android)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Horloge de démonstration (`getDateDemo`)

**Dimensionnement recommandé : Sonnet 5** (fonction unique, entièrement spécifiée).

**Files:**
- Modify: `data/store.ts`
- Test: `data/store.test.ts` (nouveau fichier)

**Interfaces:**
- Produces (consommé par les Tâches 3 et 4) :
  ```ts
  export function getDateDemo(): Date;
  ```
- Consumes : rien.

- [ ] **Step 1 : Écrire le test (il échoue, `getDateDemo` n'existe pas encore)**

```ts
// data/store.test.ts
import { describe, expect, it } from 'vitest';
import { getDateDemo } from './store';

describe('getDateDemo', () => {
  it("renvoie une date proche de l'heure réelle courante", () => {
    const avant = Date.now();
    const date = getDateDemo();
    const apres = Date.now();

    expect(date.getTime()).toBeGreaterThanOrEqual(avant);
    expect(date.getTime()).toBeLessThanOrEqual(apres);
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

Run: `npx vitest run data/store.test.ts`
Expected: FAIL — `getDateDemo` is not exported / not a function.

- [ ] **Step 3 : Implémenter**

Dans `data/store.ts`, juste après le bloc `// CACHE D'INDEX...` (après la fonction `obtenirIndexes`, avant la section `// 1. APPAREILS & PARC`), ajouter :

```ts
// ============================================================================
// HORLOGE DE DÉMONSTRATION
// ============================================================================
//
// Heure "actuelle" de la démonstration — seam unique utilisé par tous les
// calculs dérivés qui dépendent de l'heure courante (retards, SLA, urgences,
// score de risque). Vaut l'heure réelle aujourd'hui ; conservé comme fonction
// (et non un accès direct à `Date`) pour qu'une future figure du temps de
// démonstration n'ait qu'un seul endroit à modifier plutôt que les ~15 points
// de lecture qui en dépendent (voir
// docs/superpowers/plans/2026-09-23-manelift-fondations-demo.md).

export function getDateDemo(): Date {
  return new Date();
}
```

- [ ] **Step 4 : Lancer le test, vérifier qu'il passe**

Run: `npx vitest run data/store.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add data/store.ts data/store.test.ts
git commit -m "$(cat <<'EOF'
Ajoute l'horloge de démonstration getDateDemo()

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Basculer tous les calculs dépendant du temps sur `getDateDemo()`

**Dimensionnement recommandé : Opus 5.5** (mécanique mais transversal à ~15 fichiers ; une erreur ici se propage à toute la feuille de route — voir Review Focus).

**Files:**
- Modify: `domain/risk-scoring.ts`
- Modify: `data/store.ts` (fonction `getRiskScoreForAscenseur`)
- Modify: `lib/derived/parc-liste.ts`, `lib/derived/carte.ts`, `lib/derived/reserves-ctq-liste.ts`, `lib/derived/dashboard.ts`, `lib/derived/maintenances-liste.ts`, `lib/derived/maintenances-appareil.ts`, `lib/derived/accueil-technicien.ts`, `lib/derived/tournee-mobile.ts`, `lib/derived/disponibilite.ts`, `lib/derived/planning.ts`, `lib/derived/conformite-contractuelle.ts`, `lib/derived/sla.ts`
- Modify: `app/techniciens/[id]/page.tsx`, `app/maintenances/page.tsx`, `app/planning/page.tsx`, `app/mobile/maintenances/page.tsx`

**Interfaces:**
- Consumes : `getDateDemo()` de la Tâche 2 (`@/data/store`).
- Produces : aucune nouvelle interface publique — seules les valeurs par défaut/instanciations internes de `new Date()` changent de source.

Cette tâche remplace **toute** instanciation de « maintenant » qui alimente un calcul de retard/SLA/urgence/risque par `getDateDemo()`, à trois endroits distincts selon le cas :

- **(A) Points d'entrée explicites** dans des Server Components (`app/**/page.tsx`) qui font `const maintenant = new Date();` puis le passent en argument à une fonction de `lib/derived/*`.
- **(B) Instanciations internes non paramétrées**, cachées à l'intérieur d'une fonction exportée de `lib/derived/*` (pas de callers à corriger, il faut changer la source).
- **(C) Valeurs par défaut** `maintenant: Date = new Date()` sur des fonctions exportées de `lib/derived/*` — à corriger par défense en profondeur, que l'on ait ou non identifié tous les appelants qui s'appuient sur ce défaut.
- **(D) `domain/risk-scoring.ts` reste pur** : on y **ajoute un paramètre** `maintenant: Date = new Date()` (le défaut y reste `new Date()`, jamais `getDateDemo()` — voir Global Constraints), et c'est l'appelant dans `data/store.ts` qui passe `getDateDemo()` explicitement.

- [ ] **Step 1 : (D) `domain/risk-scoring.ts` — enfiler un paramètre `maintenant` sans importer `data/store`**

Remplacer :

```ts
function countInterventionsRecentes(
  interventions: Intervention[],
  ascenseurId: string,
  nbJours: number
): number {
  const seuil = new Date();
  seuil.setDate(seuil.getDate() - nbJours);

  return interventions.filter(
    (i) => i.ascenseurId === ascenseurId && new Date(i.dateCreation) >= seuil
  ).length;
}
```

par :

```ts
function countInterventionsRecentes(
  interventions: Intervention[],
  ascenseurId: string,
  nbJours: number,
  maintenant: Date = new Date()
): number {
  const seuil = new Date(maintenant);
  seuil.setDate(seuil.getDate() - nbJours);

  return interventions.filter(
    (i) => i.ascenseurId === ascenseurId && new Date(i.dateCreation) >= seuil
  ).length;
}
```

Remplacer :

```ts
function joursDepuisDerniereIntervention(
  interventions: Intervention[],
  ascenseurId: string
): number {
  const derniere = getDerniereInterventionCloturee(interventions, ascenseurId);
  if (!derniere) return 365; // Aucune intervention clôturée = considéré comme ancien

  const maintenant = new Date();
  const diff = maintenant.getTime() - derniere.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
```

par :

```ts
function joursDepuisDerniereIntervention(
  interventions: Intervention[],
  ascenseurId: string,
  maintenant: Date = new Date()
): number {
  const derniere = getDerniereInterventionCloturee(interventions, ascenseurId);
  if (!derniere) return 365; // Aucune intervention clôturée = considéré comme ancien

  const diff = maintenant.getTime() - derniere.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
```

Remplacer la signature et le corps de `computeRiskScore` :

```ts
export function computeRiskScore(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs
): number {
  const interventionsRecentes = countInterventionsRecentes(interventions, ascenseur.id, 30);
  const scoreInterventions = interventionsRecentes * 15;

  const joursDepuis = joursDepuisDerniereIntervention(interventions, ascenseur.id);
```

par :

```ts
export function computeRiskScore(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs,
  maintenant: Date = new Date()
): number {
  const interventionsRecentes = countInterventionsRecentes(interventions, ascenseur.id, 30, maintenant);
  const scoreInterventions = interventionsRecentes * 15;

  const joursDepuis = joursDepuisDerniereIntervention(interventions, ascenseur.id, maintenant);
```

(le reste du corps de `computeRiskScore` ne change pas).

Remplacer la signature et les deux premières lignes de `generateRiskExplanation` :

```ts
export function generateRiskExplanation(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs,
  score: number
): string {
  const interventionsRecentes = countInterventionsRecentes(interventions, ascenseur.id, 30);
  const joursDepuis = joursDepuisDerniereIntervention(interventions, ascenseur.id);
```

par :

```ts
export function generateRiskExplanation(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs,
  score: number,
  maintenant: Date = new Date()
): string {
  const interventionsRecentes = countInterventionsRecentes(interventions, ascenseur.id, 30, maintenant);
  const joursDepuis = joursDepuisDerniereIntervention(interventions, ascenseur.id, maintenant);
```

Remplacer `computeFullRiskScore` :

```ts
export function computeFullRiskScore(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs
): RiskScore {
  const score = computeRiskScore(ascenseur, interventions, parc);
  const level = getRiskLevel(score);
  const explication = generateRiskExplanation(ascenseur, interventions, parc, score);

  return { score, level, explication };
}
```

par :

```ts
export function computeFullRiskScore(
  ascenseur: Ascenseur,
  interventions: Intervention[],
  parc: ParcAscenseurs,
  maintenant: Date = new Date()
): RiskScore {
  const score = computeRiskScore(ascenseur, interventions, parc, maintenant);
  const level = getRiskLevel(score);
  const explication = generateRiskExplanation(ascenseur, interventions, parc, score, maintenant);

  return { score, level, explication };
}
```

- [ ] **Step 2 : `data/store.ts` — passer `getDateDemo()` explicitement à `computeFullRiskScore`**

Remplacer :

```ts
export function getRiskScoreForAscenseur(ascenseurId: string): RiskScore | null {
  const ascenseur = getAscenseurById(ascenseurId);
  if (!ascenseur) return null;
  const parc = getParcById(ascenseur.parcId);
  if (!parc) return null;
  return computeFullRiskScore(ascenseur, getInterventionsByAscenseurId(ascenseurId), parc);
}
```

par :

```ts
export function getRiskScoreForAscenseur(ascenseurId: string): RiskScore | null {
  const ascenseur = getAscenseurById(ascenseurId);
  if (!ascenseur) return null;
  const parc = getParcById(ascenseur.parcId);
  if (!parc) return null;
  return computeFullRiskScore(ascenseur, getInterventionsByAscenseurId(ascenseurId), parc, getDateDemo());
}
```

- [ ] **Step 3 : (B) Instanciations internes non paramétrées dans `lib/derived/*`**

Dans `lib/derived/parc-liste.ts` ligne 163, remplacer `const maintenant = new Date();` par `const maintenant = getDateDemo();`, et ajouter `getDateDemo` à l'import existant de `'@/data/store'` en tête de fichier (déjà présent pour `getAllAscenseurs`, etc.).

Dans `lib/derived/carte.ts` ligne 209, même remplacement `const maintenant = new Date();` → `const maintenant = getDateDemo();`. Si ce fichier n'importe pas encore `'@/data/store'`, ajouter `import { getDateDemo } from '@/data/store';` en tête de fichier ; s'il l'importe déjà, ajouter `getDateDemo` à la liste importée.

Dans `lib/derived/reserves-ctq-liste.ts` ligne 75, remplacer :

```ts
export const getLignesReservesCTQ = cache((): LigneReserveCTQListe[] => {
  const maintenant = new Date();
```

par :

```ts
export const getLignesReservesCTQ = cache((): LigneReserveCTQListe[] => {
  const maintenant = getDateDemo();
```

et ajouter `getDateDemo` à l'import déjà présent de `'@/data/store'` en tête de ce fichier (`import { getAllReservesCTQ, getAscenseurById, getClientById, getControleCTQById, getTechnicienById } from '@/data/store';`).

Dans `lib/derived/dashboard.ts`, remplacer les deux occurrences internes non paramétrées :
- ligne 358 : `const aujourdhui = new Date();` (dans `getActiviteParJourImpl`) → `const aujourdhui = getDateDemo();`
- ligne 617 : `const aujourdhui = new Date();` → `const aujourdhui = getDateDemo();`

et ajouter `getDateDemo` à l'import de `'@/data/store'` en tête de `dashboard.ts` (l'ajouter s'il n'existe pas déjà).

- [ ] **Step 4 : (C) Valeurs par défaut `maintenant: Date = new Date()` dans `lib/derived/*` — défense en profondeur**

Pour chacun des fichiers suivants, remplacer, sur la ou les lignes indiquées, `new Date()` par `getDateDemo()` dans la signature par défaut, et s'assurer que le fichier importe `getDateDemo` depuis `'@/data/store'` (ajouter l'import s'il est absent) :

- `lib/derived/dashboard.ts:248` et `:261` (`getKpisTableauDeBordImpl`) et `:668` (`getUrgences`)
- `lib/derived/maintenances-liste.ts:54` (`construireGroupesPriorite`)
- `lib/derived/maintenances-appareil.ts:18` (`enrichirMaintenance`), `:40` (`estMaintenanceEnRetard`), `:52` (`trouverProchaineMaintenancePlanifiee`) — ce fichier n'importe actuellement que `@/domain/types` ; ajouter `import { getDateDemo } from '@/data/store';`
- `lib/derived/accueil-technicien.ts:78` (`construireBlocsAccueilTechnicien`)
- `lib/derived/tournee-mobile.ts:85` (`getArretsTourneeTechnicien`)
- `lib/derived/disponibilite.ts:32`
- `lib/derived/planning.ts:139`, `:175`, `:284` (`construireLignesAbsences`)
- `lib/derived/conformite-contractuelle.ts:354`
- `lib/derived/sla.ts:29` (`calculerEtatSLA`), `:75` (`estInterventionHorsSLA`), `:80` (`calculerTauxRespectSLA`)

Ne pas toucher `domain/business-logic.ts:689` (`estReserveEnRetard`) : ce fichier est dans `domain/`, doit rester pur, et son unique appelant (`lib/derived/reserves-ctq-liste.ts`, déjà corrigé au Step 3) lui passe déjà un `maintenant` explicite issu de `getDateDemo()` — le défaut `new Date()` de `estReserveEnRetard` ne sera donc jamais utilisé en pratique, mais reste correct à conserver tel quel (cohérence avec la Task 3D).

- [ ] **Step 5 : (A) Points d'entrée explicites dans les pages**

Dans chacun des 4 fichiers suivants, remplacer `const maintenant = new Date();` par `const maintenant = getDateDemo();`, en ajoutant `getDateDemo` à l'import déjà présent de `'@/data/store'` (ces Server Components importent déjà des fonctions de `data/store` pour lire leurs données) :

- `app/techniciens/[id]/page.tsx:62`
- `app/maintenances/page.tsx:76`
- `app/planning/page.tsx:93`
- `app/mobile/maintenances/page.tsx:106`

- [ ] **Step 6 : Vérification exhaustive**

Run :
```bash
grep -rn "new Date()" lib/derived domain app --include=*.tsx --include=*.ts | grep -v ".test.ts" | grep -v "toISOString()"
```

Expected : la seule occurrence restante en dehors de `domain/` doit être celle des valeurs par défaut volontairement laissées (aucune, après le Step 4 — toutes les valeurs par défaut de `lib/derived` ont été basculées). Dans `domain/`, seules les lignes de `risk-scoring.ts` avec `maintenant: Date = new Date()` (Step 1, défauts intentionnellement réels) et `domain/business-logic.ts:689` (`estReserveEnRetard`, Step 4) doivent apparaître.

Run : `npx vitest run`
Expected : tous les tests existants passent toujours (aucun test ne fixe une valeur d'horloge en dur qui dépendrait de l'ancien comportement — `getDateDemo()` renvoie `new Date()` exactement comme avant).

Run : `npx tsc --noEmit && npm run lint`
Expected : aucune erreur (en particulier, vérifier qu'aucun import `'@/data/store'` n'a été dupliqué dans un fichier qui l'avait déjà).

- [ ] **Step 7 : Commit**

```bash
git add domain/risk-scoring.ts data/store.ts lib/derived app/techniciens/[id]/page.tsx app/maintenances/page.tsx app/planning/page.tsx app/mobile/maintenances/page.tsx
git commit -m "$(cat <<'EOF'
Fait dépendre tous les calculs temporels de l'horloge de démonstration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Réinitialisation de la démonstration

**Dimensionnement recommandé : Opus 5.5** (touche l'intégralité du magasin de données partagé ; une régression ici casse toute démo en cours).

**Files:**
- Modify: `data/store.ts`
- Modify: `data/store.test.ts`
- Create: `app/components/demo-actions.ts`
- Modify: `app/components/BandeauMaquette.tsx`

**Interfaces:**
- Consumes : `getDateDemo()` (Tâche 2).
- Produces (consommé par `app/components/demo-actions.ts`) :
  ```ts
  export function reinitialiserDonneesDemo(): void;
  export function rafraichirFraicheurScenarios(): void; // exporté pour être testé isolément
  ```

- [ ] **Step 1 : Écrire les tests (ils échouent, les fonctions n'existent pas encore)**

Ajouter à `data/store.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import {
  getDateDemo,
  getAllInterventions,
  updateIntervention,
  getAllEvenementsReserve,
  addEvenementReserve,
  reinitialiserDonneesDemo,
  rafraichirFraicheurScenarios,
} from './store';
import { StatutIntervention, MotifIntervention } from '@/domain/types';

describe('reinitialiserDonneesDemo', () => {
  it('restaure une intervention mutée à son état initial', () => {
    const [premiere] = getAllInterventions();
    const statutOriginal = premiere.statut;
    const autreStatut =
      statutOriginal === StatutIntervention.CLOTURE ? StatutIntervention.A_AFFECTER : StatutIntervention.CLOTURE;

    updateIntervention({ ...premiere, statut: autreStatut });
    expect(getAllInterventions().find((i) => i.id === premiere.id)?.statut).toBe(autreStatut);

    reinitialiserDonneesDemo();
    expect(getAllInterventions().find((i) => i.id === premiere.id)?.statut).toBe(statutOriginal);
  });
});

describe('rafraichirFraicheurScenarios', () => {
  it("rafraîchit les interventions « personne bloquée » non clôturées pour qu'elles restent récentes", () => {
    reinitialiserDonneesDemo();
    const maintenant = getDateDemo();
    const uneHeureMs = 60 * 60 * 1000;

    const personnesBloqueesActives = getAllInterventions().filter(
      (i) => i.motif === MotifIntervention.PERSONNE_BLOQUEE && i.statut !== StatutIntervention.CLOTURE
    );

    expect(personnesBloqueesActives.length).toBeGreaterThan(0);
    for (const intervention of personnesBloqueesActives) {
      expect(maintenant.getTime() - new Date(intervention.dateCreation).getTime()).toBeLessThan(uneHeureMs);
    }
  });

  it('ramène à l\'heure de démonstration tout événement de réserve daté dans le futur', () => {
    const [existant] = getAllEvenementsReserve();
    const futur = new Date(getDateDemo().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    addEvenementReserve({ ...existant, id: 'evt-test-futur', dateHeure: futur });

    rafraichirFraicheurScenarios();

    const evenement = getAllEvenementsReserve().find((e) => e.id === 'evt-test-futur');
    expect(evenement).toBeDefined();
    expect(new Date(evenement!.dateHeure).getTime()).toBeLessThanOrEqual(getDateDemo().getTime());
  });
});
```

- [ ] **Step 2 : Lancer les tests, vérifier qu'ils échouent**

Run: `npx vitest run data/store.test.ts`
Expected: FAIL — `reinitialiserDonneesDemo`/`rafraichirFraicheurScenarios` non exportées.

- [ ] **Step 3 : Implémenter dans `data/store.ts`**

Ajouter `MotifIntervention` à l'import existant depuis `'@/domain/types'` en tête de fichier (à côté de `StatutIntervention` déjà importé).

Ajouter, après la section `// 10. AGRÉGATS EXPLICITEMENT DEMANDÉS...` (fin de fichier) :

```ts
// ============================================================================
// 11. DÉMONSTRATION — RÉINITIALISATION
// ============================================================================
//
// Le magasin est global au process (pas de session par visiteur) : cette
// fonction remet TOUT le monde à zéro simultanément. Prévue pour un usage
// volontaire et rare (entre deux ateliers), jamais appelée automatiquement.

export function reinitialiserDonneesDemo(): void {
  secteursGeographiques = [...initialSecteursGeographiques];
  techniciens = [...initialTechniciens];
  tournees = [...initialTournees];
  definitionsSLA = [...initialDefinitionsSLA];
  clients = [...initialClients];
  contrats = [...initialContrats];
  parcs = [...initialParcs];
  ascenseurs = [...initialAscenseurs];
  entreesJournalModification = [...initialEntreesJournalModification];
  utilisateurs = [...initialUtilisateurs];
  typesMaintenanceRef = [...initialTypesMaintenanceRef];
  causesPanneRef = [...initialCausesPanneRef];
  maintenances = [...initialMaintenances];
  interventions = [...initialInterventions];
  tickets = [...initialTickets];
  reaffectations = [...initialReaffectations];
  absencesTechnicien = [...initialAbsencesTechnicien];
  photosRapport = [...initialPhotosRapport];
  rapports = [...initialRapports];
  bureauxEtudes = [...initialBureauxEtudes];
  controlesCTQ = [...initialControlesCTQ];
  reservesCTQ = [...initialReservesCTQ];
  evenementsReserve = [...initialEvenementsReserve];
  sessionsTechnicien = [...initialSessionsTechnicien];
  elementsFileSynchronisation = [...initialElementsFileSynchronisation];
  appareilsTelechargesLocalement = [...initialAppareilsTelechargesLocalement];
  etatsPTITechnicien = [...initialEtatsPTITechnicien];
  positionsTechnicien = [...initialPositionsTechnicien];
  zonesGeographiques = [...initialZonesGeographiques];
  tourneesDuJour = [...initialTourneesDuJour];
  tachesAsynchrones = [...initialTachesAsynchrones];
  notifications = [...initialNotifications];
  entreesAudit = [...initialEntreesAudit];
  integrationsExternes = [...initialIntegrationsExternes];
  journalEchangesIntegration = [...initialJournalEchangesIntegration];

  rafraichirFraicheurScenarios();
  cacheEtapesIntervention.clear();
  invaliderIndexes();
}

/**
 * Recale dans le temps les données sensibles à la fraîcheur (cahier des
 * charges maquette, section 4.3) : sans ce recalage, un process resté
 * plusieurs jours en vie affiche des urgences "personne bloquée" vieilles de
 * plusieurs semaines, ou des événements de réserve datés dans le futur.
 * Exportée pour être testée isolément (voir data/store.test.ts).
 */
export function rafraichirFraicheurScenarios(): void {
  const maintenant = getDateDemo();
  let rang = 0;

  interventions = interventions.map((intervention) => {
    if (intervention.motif !== MotifIntervention.PERSONNE_BLOQUEE) return intervention;
    if (intervention.statut === StatutIntervention.CLOTURE) return intervention;
    const ancienneteMinutes = 5 + ((rang++ * 7) % 40); // étalées entre 5 et 44 minutes, de façon déterministe
    return { ...intervention, dateCreation: new Date(maintenant.getTime() - ancienneteMinutes * 60_000).toISOString() };
  });

  evenementsReserve = evenementsReserve.map((evenement) =>
    new Date(evenement.dateHeure).getTime() > maintenant.getTime()
      ? { ...evenement, dateHeure: maintenant.toISOString() }
      : evenement
  );
}
```

- [ ] **Step 4 : Lancer les tests, vérifier qu'ils passent**

Run: `npx vitest run data/store.test.ts`
Expected: PASS (4 tests : `getDateDemo`, restauration, fraîcheur personne-bloquée, clamping réserve future).

- [ ] **Step 5 : Server Action dédiée, séparée des actions métier**

```ts
// app/components/demo-actions.ts
'use server';

import { reinitialiserDonneesDemo } from '@/data/store';

/** Action de maquette uniquement — jamais appelée par un parcours métier. */
export async function reinitialiserDemonstrationAction(): Promise<void> {
  reinitialiserDonneesDemo();
}
```

- [ ] **Step 6 : Bouton de réinitialisation dans le bandeau**

Remplacer le contenu de `app/components/BandeauMaquette.tsx` par :

```tsx
'use client';

/**
 * Bandeau global rappelant qu'il s'agit d'une maquette (cahier des charges,
 * section 1) : aucune action de cet écran n'a d'effet réel sur un système
 * externe, même quand le libellé emploie un verbe métier ("valider",
 * "envoyer"...).
 *
 * Le bouton de réinitialisation utilise une confirmation navigateur native
 * plutôt qu'une modale dédiée : le dépôt n'a pas de composant de modale
 * générique (cf. conventions UI), et cette action est rare et à haut risque
 * (elle affecte tous les visiteurs actuels de la démo publique) — une
 * confirmation native, bloquante, est suffisante et évite d'introduire un
 * premier composant de modale pour ce seul usage.
 */

import { useState, useTransition } from 'react';
import { RotateCcw } from 'lucide-react';
import { reinitialiserDemonstrationAction } from './demo-actions';

export default function BandeauMaquette() {
  const [isPending, startTransition] = useTransition();
  const [dernierReset, setDernierReset] = useState<string | null>(null);

  const handleReset = () => {
    const confirme = window.confirm(
      "Réinitialiser la démonstration ? Cette action remet TOUTES les données à leur état initial pour TOUS les visiteurs actuels de la maquette, sans possibilité d'annulation."
    );
    if (!confirme) return;

    startTransition(async () => {
      await reinitialiserDemonstrationAction();
      setDernierReset(new Date().toLocaleTimeString('fr-FR'));
    });
  };

  return (
    <div className="flex items-center justify-between gap-2 bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs font-medium text-amber-800">
      <span>Maquette — données fictives et actions simulées</span>
      <button
        type="button"
        onClick={handleReset}
        disabled={isPending}
        className="flex items-center gap-1 text-amber-700 hover:text-amber-900 disabled:opacity-50"
      >
        <RotateCcw className="h-3 w-3" />
        {isPending ? 'Réinitialisation…' : dernierReset ? `Réinitialisé à ${dernierReset}` : 'Réinitialiser la démonstration'}
      </button>
    </div>
  );
}
```

- [ ] **Step 7 : Vérification**

Run: `npx vitest run data/store.test.ts && npx tsc --noEmit && npm run lint`
Expected: tout passe.

Vérification manuelle : `npm run dev`, ouvrir `/interventions`, réattribuer une intervention, cliquer « Réinitialiser la démonstration » dans le bandeau, confirmer, recharger `/interventions` : la réattribution a disparu.

- [ ] **Step 8 : Commit**

```bash
git add data/store.ts data/store.test.ts app/components/demo-actions.ts app/components/BandeauMaquette.tsx
git commit -m "$(cat <<'EOF'
Ajoute la réinitialisation de la démonstration avec recalage de fraîcheur

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Test de non-régression — indépendance des dates contractuelles de maintenance

**Dimensionnement recommandé : Sonnet 5** (test isolé sur des fonctions pures déjà écrites, aucune nouvelle logique).

**Files:**
- Create: `lib/derived/maintenances-appareil.test.ts`

**Interfaces:**
- Consumes : `enrichirMaintenance`, `estMaintenanceEnRetard`, `trouverDerniereMaintenanceRealisee`, `trouverProchaineMaintenancePlanifiee` (déjà exportées par `lib/derived/maintenances-appareil.ts`, inchangées par ce plan).

- [ ] **Step 1 : Écrire le test**

```ts
// lib/derived/maintenances-appareil.test.ts
import { describe, expect, it } from 'vitest';
import { CategorieMaintenance, StatutMaintenance, type Maintenance } from '@/domain/types';
import {
  estMaintenanceEnRetard,
  trouverDerniereMaintenanceRealisee,
  trouverProchaineMaintenancePlanifiee,
} from './maintenances-appareil';

function creerMaintenance(overrides: Partial<Maintenance> & Pick<Maintenance, 'id' | 'categories' | 'datePrevue' | 'statut'>): Maintenance {
  return {
    numero: 'MNT-2026-TEST',
    ascenseurId: 'asc-test',
    seuilDureeMinimaleMinutes: 15,
    avertissementDureeInsuffisante: false,
    ...overrides,
  };
}

describe('trouverProchaineMaintenancePlanifiee / trouverDerniereMaintenanceRealisee', () => {
  it(
    "ne recalcule jamais la date d'une maintenance encore planifiée à partir d'une autre catégorie déjà réalisée plus tard (règle capitale, domain/types.ts)",
    () => {
      const planifieeEnRetard = creerMaintenance({
        id: 'mnt-cable',
        categories: [CategorieMaintenance.CABLE],
        datePrevue: '2026-02-21T00:00:00.000Z',
        statut: StatutMaintenance.PLANIFIEE,
      });
      const realiseePlusTard = creerMaintenance({
        id: 'mnt-periodique',
        categories: [CategorieMaintenance.PERIODIQUE],
        datePrevue: '2026-02-01T00:00:00.000Z',
        dateRealisee: '2026-03-15T00:00:00.000Z',
        statut: StatutMaintenance.REALISEE,
      });

      const maintenances = [planifieeEnRetard, realiseePlusTard];
      const maintenant = new Date('2026-03-20T00:00:00.000Z');
      const prochaine = trouverProchaineMaintenancePlanifiee(maintenances, maintenant);
      const derniereRealisee = trouverDerniereMaintenanceRealisee(maintenances);

      // La maintenance "câble" reste la prochaine planifiée, avec sa date
      // d'origine inchangée, même si une autre catégorie a déjà été réalisée
      // après elle : ce test fige ce comportement voulu pour ne pas le
      // régresser en l'outillant par erreur (ex. un futur "recalcul de la
      // prochaine visite depuis la dernière réalisée" — précisément ce que le
      // commentaire "RÈGLE CAPITALE" de domain/types.ts interdit).
      expect(prochaine?.id).toBe('mnt-cable');
      expect(prochaine?.datePrevue).toBe('2026-02-21T00:00:00.000Z');
      expect(derniereRealisee?.id).toBe('mnt-periodique');
      expect(estMaintenanceEnRetard(planifieeEnRetard, maintenant)).toBe(true);
    }
  );
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il passe déjà (caractérisation, pas correction de bug)**

Run: `npx vitest run lib/derived/maintenances-appareil.test.ts`
Expected: PASS — ce test documente et fige un comportement déjà correct ; s'il échouait, ce serait la preuve d'une vraie régression à corriger avant de continuer, pas un test à assouplir.

- [ ] **Step 3 : Commit**

```bash
git add lib/derived/maintenances-appareil.test.ts
git commit -m "$(cat <<'EOF'
Fige par un test l'indépendance des dates contractuelles de maintenance

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Bascule Web ⇄ Android dans la navigation

**Dimensionnement recommandé : Sonnet 5** (composant présentatif, deux fichiers).

**Files:**
- Modify: `app/components/Navigation.tsx`
- Modify: `app/mobile/components/PhoneFrame.tsx`

**Interfaces:** aucune (présentatif).

- [ ] **Step 1 : Ajouter l'entrée « Vue technicien (Android) » dans la barre latérale Web**

Dans `app/components/Navigation.tsx`, ajouter `Smartphone` à l'import `lucide-react` existant (à côté de `Building2`, `LayoutDashboard`, etc.).

Remplacer :

```tsx
      <div className="p-3 border-t border-gray-200 shrink-0">
        <Link href="/taches" className="flex items-center gap-2 px-3 py-2 mb-1 text-sm text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-colors"><ListTodo className="h-3.5 w-3.5" />Tâches</Link>
```

par :

```tsx
      <div className="p-3 border-t border-gray-200 shrink-0">
        <Link
          href="/mobile"
          className="flex items-center justify-center gap-2 px-3 py-2 mb-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
        >
          <Smartphone className="h-3.5 w-3.5" />
          Vue technicien (Android)
        </Link>
        <Link href="/taches" className="flex items-center gap-2 px-3 py-2 mb-1 text-sm text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-colors"><ListTodo className="h-3.5 w-3.5" />Tâches</Link>
```

`/mobile` redirige déjà automatiquement (`app/mobile/page.tsx`) vers `/mobile/accueil` ou `/mobile/connexion` selon la présence du cookie technicien — pas de logique supplémentaire nécessaire ici.

- [ ] **Step 2 : Ajouter le retour vers le Web depuis le cadre téléphone**

Dans `app/mobile/components/PhoneFrame.tsx`, ajouter l'import `Link` depuis `'next/link'`.

Remplacer :

```tsx
        <p className="text-sm text-gray-500">Aperçu — application mobile technicien</p>
```

par :

```tsx
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">Aperçu — application mobile technicien</p>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800 underline">
            Retour à la vue Web
          </Link>
        </div>
```

- [ ] **Step 3 : Vérification manuelle (pas de test automatisé — voir Global Constraints)**

Run: `npx tsc --noEmit && npm run lint`
Expected: aucune erreur.

Puis `npm run dev` : depuis `/`, cliquer « Vue technicien (Android) » → arrivée sur `/mobile/connexion` (ou `/mobile/accueil` si un cookie technicien existe déjà) ; depuis là, cliquer « Retour à la vue Web » → retour sur `/`.

- [ ] **Step 4 : Commit**

```bash
git add app/components/Navigation.tsx app/mobile/components/PhoneFrame.tsx
git commit -m "$(cat <<'EOF'
Rend la maquette Android découvrable depuis la navigation Web

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Vérification globale et mise à jour du README

**Dimensionnement recommandé : Sonnet 5.**

**Files:**
- Modify: `README.md`

- [ ] **Step 1 : Vérification complète**

Run:
```bash
npx vitest run
npx tsc --noEmit
npm run lint
npm run build
```
Expected: les quatre commandes réussissent sans erreur.

- [ ] **Step 2 : Documenter les nouveautés dans le README**

Dans `README.md`, dans la section `## Limites connues de la maquette`, ajouter une puce :

```markdown
- **Horloge de démonstration et réinitialisation** : un bandeau global (« Maquette — données fictives et actions simulées ») permet de réinitialiser toutes les données à leur état initial. Le magasin de données étant global au process serveur (pas de session par visiteur), cette réinitialisation affecte immédiatement tous les visiteurs actuels de la démo publique.
```

Dans la section `## Écrans` → `### Mobile (simulation)`, ajouter en tête de paragraphe :

```markdown
Accessible depuis la barre latérale Web via le bouton « Vue technicien (Android) », et inversement via « Retour à la vue Web » depuis le cadre téléphone.
```

- [ ] **Step 3 : Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
Documente l'horloge de démo, la réinitialisation et la bascule Android

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
