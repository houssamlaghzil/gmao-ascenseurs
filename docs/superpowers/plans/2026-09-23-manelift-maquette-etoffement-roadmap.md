# Étoffement de la maquette Manei-Lift (Web + Android) — Feuille de route

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe case à cocher (`- [ ]`) pour le suivi.
>
> Ce document est une **feuille de route**, pas un plan bite-sized : chaque phase pointe vers un plan détaillé dédié (format standard `writing-plans`, avec tests et code réels), rédigé au moment d'attaquer la phase — pas maintenant — pour rester ancré dans l'état réel du dépôt après les phases précédentes plutôt que d'inventer des détails sur un code qui aura changé. La phase 1 fait exception : son plan détaillé existe déjà (voir la table des phases).

**Goal:** Faire évoluer la maquette GMAO ascenseurs Manei-Lift (déjà substantielle côté Web ET Android) vers une démonstration bout-en-bout des parcours quotidiens (dispatch, affectation, maintenance, absences, pièces, validation de rapport) cohérente entre Web et Android, plus un hub et des études d'intégration externes — sans jamais présenter une simulation comme un service réellement branché.

**Architecture:** Un seul magasin de données en mémoire (`data/store.ts`) déjà partagé par le Web et par `app/mobile/**` — le socle de cohérence Web/Android demandé par le cahier des charges (section 4.1) est donc **déjà acquis par construction**, pas à reconstruire. Le travail consiste à (1) fiabiliser ce socle pour une démo longue durée (horloge, réinitialisation, fraîcheur des scénarios), (2) compléter les parcours Web priorité 1 sur les routes existantes, (3) rendre la maquette Android déjà présente **découvrable** et combler ses écarts avec la spec écran par écran, (4) ajouter le hub, la super-administration et les études externes en périphérie, sans toucher au cœur GMAO.

**Tech Stack:** Next.js 14 (App Router) / React 18 / TypeScript strict, Tailwind CSS, Vitest, npm. Aucune base de données — génération procédurale en mémoire (voir `data/mockData.ts`, `data/store.ts`).

**Spec:** `docs/superpowers/specs/2026-09-23-manelift-maquette-etoffement-cahier-des-charges.md` (inclut un addenda sur l'écart Android constaté).

## Constat de cadrage — ce qui existe déjà (2026-09-23)

Une exploration du dépôt (4 agents en parallèle + lecture directe de `data/store.ts`, `lib/derived/*`, `app/components/{Navigation,AppShell}.tsx`, `app/mobile/**`, `README.md`) montre que la maquette est **beaucoup plus avancée** que ce que la seule consultation du site public laissait supposer :

- **Toutes les routes Web listées section 2 du cahier des charges existent déjà**, avec un niveau de détail réel (ex. `/interventions/:id` a déjà chronologie, tickets regroupés, SLA, réattribution ; `/planning` a déjà le glisser-déposer). Les écarts réels sont précis et documentés dans la spec (ex. `/maintenances` n'a pas encore de fiche `[id]` ouvrable).
- **Une maquette Android complète existe déjà** sous `app/mobile/**` (connexion, accueil, tournée, fiche appareil, recherche, wizards démarrage/diagnostic/clôture, maintenance avec checklist + test téléalarme, CTQ, rapport isolé, synchronisation, PTI/DATI) — voir l'addenda de la spec. Elle n'est simplement reliée nulle part depuis la navigation Web.
- Le magasin de données (`data/store.ts`) est **global au process serveur, pas par session** : une mutation est visible par tous les visiteurs de la démo publique immédiatement. Pas de compte à rebours ni de reset existant. Beaucoup de fonctions de `lib/derived/*` acceptent déjà un paramètre optionnel `maintenant: Date = new Date()` (pattern d'injection déjà en place, ex. `lib/derived/sla.ts`, `maintenances-appareil.ts`) — un point d'ancrage propre pour une horloge de démonstration contrôlée.
- Convention de plan déjà établie dans ce dépôt : voir `docs/superpowers/plans/2026-09-17-cache-calcul-et-rendu.md` (dimensionnement Sonnet/Opus par tâche, contraintes globales explicites). Les plans détaillés de ce projet suivent la même forme.

## Global Constraints (s'appliquent à toutes les phases)

- **Bandeau de démonstration.** Ne jamais afficher « connecté », « temps réel », « prédictif », « synchronisé » comme une capacité livrée quand il s'agit d'une simulation. Un bandeau global « Maquette — données fictives et actions simulées » (posé en phase 1) doit rester visible sur toutes les nouvelles pages, Web et Android.
- **Étiquetage de certitude.** Toute nouvelle fonctionnalité touchant une intégration externe (Sérénité, Getraline, FunBIM, DATI, SAP) porte une étiquette visible parmi : Démonstration / À valider au cadrage / API à vérifier / Hors première phase (cahier des charges, section 1).
- **Ne pas casser l'existant.** Toutes les URLs et écrans actuels (Web et `/mobile`) restent fonctionnels. Un écran amélioré remplace en place, il ne duplique pas un parcours concurrent (ex. réattribution : un seul formulaire, déjà existant, à réutiliser).
- **Respect des couches.** `domain/` reste pur (aucun import de `data/` ni de `lib/derived/`, aucune dépendance à l'horloge système autre qu'un paramètre injecté). `lib/derived/` peut importer `data/store` mais ne fait aucune mutation. Les mutations passent par des Server Actions (`app/**/actions.ts`) qui appellent `data/store.ts`, jamais l'inverse.
- **Le socle de données est déjà partagé** entre Web et `/mobile` (même `data/store.ts`) — ne pas introduire de second magasin ni de duplication de données pour l'Android.
- **Français partout** dans l'UI, les identifiants métier et les commentaires de code, conformément au reste du dépôt.
- **Vérifications avant toute clôture de tâche :** `npm run lint`, `npx tsc --noEmit`, `npm test` (Vitest) doivent rester verts. Un test existant ne se modifie que si son mock doit être étendu (nouvel export), jamais pour masquer une régression.
- **Attribution des commits :** `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- **Dimensionnement des sous-agents :** chaque tâche des plans détaillés porte une ligne « Dimensionnement recommandé ». Par défaut, **Opus 5.5** (`claude-opus-5-5`) pour les tâches qui touchent la logique métier partagée, l'architecture de données, ou plusieurs écrans à la fois (risque de régression large) ; **Sonnet 5** (`claude-sonnet-5`) pour les tâches mécaniques, répétitives ou strictement locales à un composant/écran. Toujours faire correspondre le niveau de réflexion (effort) à la difficulté réelle de la tâche, pas au tarif.

## Review Focus (feuille de route — voir aussi la section dédiée de chaque plan détaillé)

- Une démo publique multi-visiteurs partage un seul magasin de données : une action de reset ou de mutation faite par une personne pendant l'atelier d'une autre doit rester compréhensible (horodatage clair, pas de perte silencieuse).
- Une maintenance déjà réalisée ne doit jamais faire reculer ou avancer la date contractuelle d'une autre maintenance (règle déjà documentée dans `domain/types.ts`, à ne pas régresser en l'outillant).
- Un scénario rejoué deux fois de suite (bouton « Réinitialiser la démonstration ») ne doit produire ni doublon d'ID ni état orphelin visible sur un écran qui n'a pas été rechargé.
- Toute nouvelle route/action doit avoir un état vide, un état d'erreur et un état de succès — un bouton de démonstration qui mène à une page blanche est un échec de recette (critère section 11 de la spec).
- L'ajout du sélecteur Web/Android ne doit pas rendre `/mobile` incohérent quand on y arrive avec des filtres ou un contexte Web actif (ex. depuis la fiche d'un appareil précis) — clarifier explicitement si le bouton bascule vers le contexte du technicien courant ou vers l'accueil générique.

## Phases

- [ ] **Phase 1 — Fondations : horloge de démo, réinitialisation, cohérence, découvrabilité Android.**
  Plan détaillé : `docs/superpowers/plans/2026-09-23-manelift-fondations-demo.md` (rédigé, prêt à exécuter).
  Portée : bandeau maquette global, horloge de démonstration (`getDateDemo()`), action « Réinitialiser la démonstration » (y compris rafraîchissement des scénarios sensibles au temps, ex. alertes « personne bloquée » vieillies par un process longue durée), test de non-régression sur l'indépendance des dates contractuelles de maintenance, et bouton de bascule Web ⇄ Android dans la navigation.
  Définition de faite : `npm test`/`lint`/`tsc --noEmit` verts ; le bandeau est visible sur `/` et `/mobile/accueil` ; cliquer « Réinitialiser la démonstration » restaure le jeu de données et rafraîchit les alertes « personne bloquée » à moins d'une heure ; `/mobile` est atteignable en un clic depuis la barre latérale Web, et inversement.
  Dimensionnement dominant : Opus 5.5 (le magasin de données est un point de convergence partagé par tout le reste de la feuille de route — une erreur ici se propage à toutes les phases suivantes).

- [ ] **Phase 2 — GMAO Web prioritaire (WEB-01 à WEB-07).**
  Plan détaillé à rédiger avant de démarrer cette phase (voir note ci-dessous), une fois la phase 1 mergée.
  Portée (dans l'ordre imposé par la spec, section 10) : file de dispatch sur `/` (WEB-01) ; création/rapprochement de signalement (WEB-02) ; affectation initiale + chronologie enrichie sur `/interventions/:id` (WEB-03) ; fiche `/maintenances/:id` ouvrable + rattrapage (WEB-04) ; transfert de tâches lors d'une absence sur `/planning` (WEB-05) ; nouvelle entité « Demande de pièce » + module `/pieces` (WEB-06) ; file « Rapports à valider » (WEB-07).
  Points d'ancrage déjà identifiés : `app/interventions/actions.ts` (réattribution existante à étendre, pas dupliquer), `app/planning/actions.ts`, absence de route `app/maintenances/[id]/`, absence de type `DemandePiece` dans `domain/types.ts`.
  Définition de faite : les 7 critères de recette correspondants de la spec (section 11) sont vérifiables manuellement ; aucune route existante cassée.
  Dimensionnement dominant : un sous-agent Opus 5.5 par sous-tâche touchant `domain/types.ts` ou `data/store.ts` (nouvelles entités/mutateurs), Sonnet 5 pour les écrans et formulaires une fois les types et actions posés.

- [ ] **Phase 3 — Compléter la maquette Android (M-01 à M-12, S1–S5).**
  Plan détaillé à rédiger avant de démarrer cette phase, une fois les phases 1 et 2 mergées (la phase 2 crée des objets — demandes de pièces, dispatch — que l'Android doit pouvoir consommer).
  Portée : **audit d'abord** (comparer chaque écran M-01–M-12 de la spec à l'état réel de `app/mobile/**`, écran par écran — probablement déjà 70–80% couvert), puis combler uniquement les écarts réels (ex. écran d'arbitrage de conflit de réattribution hors ligne, file de synchronisation avec erreurs/relance sans doublon, branche « pas d'accès » courte si absente). Rejouer les scénarios S1 à S5 de bout en bout Web ⇄ Android.
  Ne pas recréer ce qui existe déjà (`PhoneFrame.tsx`, les wizards de démarrage/diagnostic/clôture, la session technicien par cookie) : l'essentiel de ce chantier est un audit + des compléments ciblés, pas une reconstruction.
  Définition de faite : les 5 scénarios S1–S5 sont rejouables intégralement et réinitialisables ; aucune duplication de rapport/ticket après une relance de synchronisation.
  Dimensionnement dominant : Sonnet 5 pour l'audit écran par écran (tâche de lecture/comparaison), Opus 5.5 pour les écrans de conflit/synchronisation qui touchent l'état partagé.

- [ ] **Phase 4 — Hub, super-administration et études externes (WEB-08 à WEB-13, S6, QR public).**
  Plan détaillé à rédiger avant de démarrer cette phase.
  Portée : `/hub` (tuiles Maintenance / Cockpit Travaux), onglet « Applications et accès » dans `/administration` avec sélecteur de rôle de démonstration, `/travaux` (synthèse seule, renvoi FunBIM), `/alertes-dati`, panneau « Origine et suivi externe » sur les interventions, vue d'écarts Getraline/GMAO dans `/integrations`, page QR publique, statuts de faisabilité sur les 6 cartes d'intégration existantes.
  Définition de faite : chaque intégration externe porte un statut de faisabilité visible ; la page QR ne fuite aucune donnée privée (test explicite) ; le cockpit Travaux ne duplique aucun formulaire détaillé de FunBIM.
  Dimensionnement dominant : Sonnet 5 (essentiellement des écrans de lecture/synthèse et des libellés de statut), sauf le sélecteur de rôle de démonstration (Opus 5.5, car il touche la logique de garde d'accès transverse).

- [ ] **Phase 5 — Revue métier et polish final.**
  Pas un plan bite-sized classique : session de revue avec technicien(s) et assistant(s) d'exploitation réels, à partir des scénarios S1–S6 rejoués en direct. Consigner chaque libellé, étape ou droit contesté comme point « à valider au cadrage » plutôt que de le figer. Passe finale d'accessibilité/responsive (bureau + cadre Android) et de cohérence visuelle.
  Définition de faite : les 9 critères de recette de la spec (section 11) sont tous vérifiés manuellement et listés avec leur résultat.

## Pourquoi une feuille de route plutôt qu'un plan unique

Le cahier des charges couvre des sous-systèmes indépendants (fondations de données, 7 parcours Web, 12 écrans Android, hub/intégrations) dont chacun doit produire un logiciel testable et livrable seul — c'est le découpage que `superpowers:writing-plans` demande pour un périmètre de cette taille. Rédiger dès maintenant le détail bite-sized des phases 2 à 5 obligerait à deviner des chemins de fichiers et des signatures qui n'existeront qu'après la phase 1 (ex. `getDateDemo()`, le type `DemandePiece`) — au prix d'un plan truffé d'hypothèses non vérifiées. Chaque plan détaillé sera donc écrit avec ce même niveau d'exigence (aucun code d'exemple inventé, chemins de fichiers réels, tests avant implémentation) juste avant d'attaquer sa phase.

## Execution Handoff

Phase 1 a déjà son plan détaillé, prêt à exécuter : `docs/superpowers/plans/2026-09-23-manelift-fondations-demo.md`.

Étant donné la préférence exprimée pour des sous-agents bien dimensionnés (Opus 5.5 pour les tâches lourdes, Sonnet 5 pour les tâches légères), l'approche recommandée est **subagent-driven-development** : un sous-agent frais implémente chaque tâche, un relecteur frais la valide avant la suivante, puis une revue de branche complète en fin de phase. C'est plus coûteux en tokens qu'une exécution native, mais adapté à un travail qui va s'étaler sur 5 phases indépendantes avec des risques de régression croisée (le magasin de données de la phase 1 est consommé par toutes les phases suivantes).

Merci de relire ce plan et le plan détaillé de la phase 1. Confirmez :
1. Que l'ordre des phases (fidèle à la section 10 de la spec) convient, ou si un réordonnancement est souhaité (ex. avancer la phase 3 Android avant la phase 2 Web, puisque l'Android existe déjà largement).
2. Que l'approche subagent-driven-development est bien celle voulue pour l'exécution.
