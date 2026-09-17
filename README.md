# Manei-Lift — Maquette GMAO Ascenseurs

Maquette fonctionnelle d'une future GMAO (Gestion de Maintenance Assistée par Ordinateur) pour un parc d'ascenseurs. L'objectif de cette maquette est de démontrer une interface moderne, rapide et structurée autour des urgences terrain, à l'opposé d'un outil legacy : pilotage du parc, interventions, maintenances contractuelles, contrôles quinquennaux (CTQ), planning technicien, et une simulation de l'application mobile utilisée sur le terrain.

Ce n'est **pas** un produit final : les données sont générées en mémoire, il n'y a pas de vraie authentification, et l'application mobile est simulée par des écrans web dans un cadre téléphone plutôt qu'une véritable app Android.

## Stack technique

- **Next.js 14** (App Router) / **React 18** / **TypeScript strict**
- **Tailwind CSS** pour le style
- **@dnd-kit** pour le drag & drop (planning)
- **cmdk** pour la palette de commandes (Ctrl/Cmd+K, recherche globale)
- **OpenAI (gpt-4o-mini)** pour la génération du rapport journalier en langage naturel
- **Vitest** pour les tests unitaires du domaine métier
- Aucune base de données : les données sont générées une fois en mémoire au démarrage du serveur (voir plus bas)

## Architecture

```
domain/            Modèle de données (types.ts) et logique métier (business-logic.ts,
                    risk-scoring.ts) : deux machines à états indépendantes — le statut
                    de l'appareil et le cycle de vie d'une intervention — plus les
                    transitions des réserves CTQ. Aucune UI ni accès aux données ici.

data/
  mockData.ts       Génération procédurale du jeu de données (PRNG déterministe) +
                     une couche de scénarios curés à la main pour la démonstration.
  store.ts          Accès en lecture/écriture au jeu de données (getAllX/getXById/...).

lib/
  derived/          Calculs dérivés propres à un écran (SLA, planning, cartographie,
                     libellés...) : jamais dans domain/ ou data/, pour que ces deux
                     couches restent la source de vérité stable.
  mobile-session.ts Résolution du technicien "connecté" côté mobile (cookie, sans
                     vraie authentification).

app/
  <section>/        Un dossier par section de la navigation (parc, interventions,
                     maintenances, ctq, planning, techniciens, contrats, integrations,
                     administration, taches, rapports), Server Components lisant
                     data/store directement, Server Actions pour les mutations.
  mobile/           Simulation de l'application technicien, rendue dans un cadre
                     téléphone (app/mobile/layout.tsx + components/PhoneFrame.tsx).
  api/              Seulement ce qui a vraiment besoin d'une route HTTP : health
                     check, génération du rapport IA, recherche globale.

components/         Composants UI réutilisables (badges de statut, Card, Timeline
                     générique, graphiques, palette de commandes...).
```

## Navigation

Barre latérale à 11 sections : **Tableau de bord**, **Parc**, **Maintenances**, **Interventions**, **Rapports**, **CTQ / Réserves**, **Planning**, **Techniciens**, **Contrats**, **Intégrations**, **Administration** — plus un accès discret au **Centre de tâches asynchrones** en bas de la barre.

## Écrans

### Web
Dashboard (KPI, urgences, activité récente, maintenance prédictive), Parc (liste filtrable/paginée + fiche appareil à 7 onglets), Maintenances (calendrier + vue prioritaire), Interventions (liste + détail avec chronologie, tickets regroupés, SLA, réattribution), Rapports (liste + détail + aperçu façon PDF, rapport journalier généré par IA), CTQ/Réserves, Planning (vue technicien + réaffectation par glisser-déposer) et Techniciens, Contrats, Intégrations, Administration, Cartographie (plan schématique SVG — aucune tuile cartographique externe), Centre de tâches asynchrones.

### Mobile (simulation)
Sous `/mobile` : connexion (choix d'un technicien de démonstration), accueil, ma tournée, fiche appareil, recherche, démarrage d'intervention (accès / état initial), diagnostic progressif en 6 étapes, clôture (état, mode dégradé, compte-rendu, photos, signatures), rapport isolé, maintenance (checklist, test téléalarme), CTQ/missions, centre de synchronisation, et un indicateur PTI/DATI.

Le technicien "connecté" est déterminé par un simple cookie posé depuis `/mobile/connexion` (aucune authentification réelle). Six comptes illustrent des scénarios figés rejouables à volonté : technicien par défaut, hors ligne, synchronisation en cours, PTI en réactivation, PTI en mode intégration tierce, réaffectation née hors ligne.

## Données de démonstration

Générées de façon procédurale (PRNG à seed fixe, reproductible à chaque redémarrage) avec une couche de scénarios curés pour la démonstration :

| Entité | Volume |
|---|---|
| Appareils | 4 348 |
| Parcs (sites) | 500 |
| Clients | 50 |
| Contrats | 65 |
| Techniciens | 70 |
| Comptes utilisateurs | 132 |
| Interventions | 4 050 |
| Tickets | ~5 500 |
| Maintenances (année en cours) | ~31 600 |
| Contrôles CTQ | 650 |
| Réserves CTQ | 1 474 |
| Rapports détaillés / cumulés | 340 en mémoire, sur 348 214 cumulés (compteur agrégé, jamais matérialisés en masse) |

## Installation et lancement

### En local

```bash
npm install
npm run dev
# http://localhost:3000 (ou le port configuré, voir ci-dessous)
```

```bash
npm run build && npm start   # build de production
npm test                     # tests unitaires du domaine métier
```

### Variables d'environnement

| Variable | Requise | Usage |
|---|---|---|
| `OPENAI_API_KEY` | Non | Génération du rapport journalier IA (`/rapports/journalier`). Sans elle, cette seule fonctionnalité renvoie une erreur explicite, le reste de l'application fonctionne normalement. |

### Docker

```bash
docker compose up -d --build
```

Le conteneur écoute sur le port interne 3000, mais `docker-compose.yml` ne publie **aucun** port sur l'hôte : sur une plateforme qui gère son propre reverse proxy (Dokploy, Traefik...), c'est elle qui route un domaine vers ce port via le réseau Docker interne, sans jamais réserver le port sur l'hôte — c'est ce qui évite l'erreur `port is already allocated` dès qu'un autre service partage le même hôte.

Pour un accès direct en local (sans plateforme de routage), ajoute un `docker-compose.override.yml` :

```yaml
services:
  web:
    ports:
      - "3000:3000"
```

## Limites connues de la maquette

- **Pas de persistance réelle** : toutes les données sont régénérées en mémoire à chaque redémarrage du serveur.
- **Pas de vraie authentification** ni de contrôle d'accès (l'écran Administration montre des rôles/permissions, mais rien n'est réellement appliqué ; la connexion mobile est un simple choix de technicien).
- **Cartographie schématique** : positions dérivées de la ville de chaque site (jitter déterministe), pas de vraies coordonnées ni de tuiles cartographiques.
- **Dictée vocale et signature** simulées visuellement (pas de reconnaissance vocale ni de capture de tracé réelle).
- **PTI/DATI** simulé (les deux options du cahier des charges sont représentées, sans intégration à un vrai service tiers).

## Scénario de démonstration conseillé

**Web** : tableau de bord → repérer un appareil à l'arrêt ou une intervention urgente → ouvrir l'intervention (remarquer les tickets multiples regroupés, le SLA, la réattribution) → fiche appareil (onglets Maintenances/CTQ/Historique) → planning (glisser-déposer une tâche).

**Mobile** : `/mobile/connexion` en tant que technicien par défaut → accueil (urgences, tournée du jour) → ouvrir une intervention depuis l'accueil → démarrage (accès, état initial) → diagnostic progressif → clôture (photos, signatures) → `/mobile/synchronisation` pour voir le scénario canonique de synchronisation (rapport synchronisé, photo en attente, intervention en cours d'envoi, rapport en échec avec "Réessayer").
