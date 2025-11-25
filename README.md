# GMAO Ascenseurs - Application de Gestion de Parcs

Application web complète de GMAO (Gestion de Maintenance Assistée par Ordinateur) spécialisée dans la gestion de parcs d'ascenseurs.

## 🎯 Objectif

Démo fonctionnelle permettant de gérer plusieurs parcs d'ascenseurs, leurs équipements et les techniciens associés. L'application simule un environnement professionnel de gestion de maintenance avec un workflow complet de gestion des pannes.

## 🛠️ Stack Technique

- **Frontend**: React 18 avec TypeScript
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icônes**: Lucide React
- **Base de données**: Mock en mémoire (données réinitialisées à chaque redémarrage)
- **Tests**: Vitest

## 📋 Fonctionnalités

### Entités Principales

1. **Parcs d'Ascenseurs**
   - Gestion de plusieurs parcs avec localisation
   - Statistiques en temps réel par parc
   
2. **Ascenseurs**
   - États : Fonctionnel, En panne, En cours de réparation
   - Sous-états de panne : En cours d'attribution, Attribué
   - Historique complet des événements
   
3. **Techniciens**
   - Association many-to-many avec les parcs
   - Suivi de la disponibilité
   - Compteur de réparations en cours

4. **Historique d'Événements**
   - Timeline complète par ascenseur
   - Types : Panne déclarée, Panne attribuée, Début réparation, Fin réparation, Retour fonctionnel

### Workflow de Gestion des Pannes

```
Fonctionnel 
    ↓ [Déclarer une panne]
En Panne (En cours d'attribution)
    ↓ [Attribuer un technicien]
En Panne (Attribué)
    ↓ [Démarrer la réparation]
En Cours de Réparation
    ↓ [Clôturer la réparation]
Fonctionnel
```

### Pages et Navigation

- **Dashboard** : Vue d'ensemble de tous les parcs avec statistiques globales et notifications
- **Détail d'un Parc** : Onglets Ascenseurs et Techniciens avec filtres
- **Détail d'un Ascenseur** : Fiche complète avec actions contextuelles et historique

## 🚀 Installation et Lancement

### Prérequis

- Node.js 18+ 
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install
```

### Lancement en développement

```bash
# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build de production

```bash
# Créer le build optimisé
npm run build

# Lancer la version de production
npm start
```

### Tests

```bash
# Lancer les tests unitaires
npm test

# Lancer les tests avec l'interface UI
npm run test:ui
```

## 📁 Structure du Projet

```
gmao-ascenseurs/
├── app/                          # Pages et routes Next.js (App Router)
│   ├── api/                      # API Routes
│   │   ├── parcs/               # Endpoints parcs
│   │   ├── ascenseurs/          # Endpoints ascenseurs
│   │   └── evenements/          # Endpoints événements
│   ├── parcs/[id]/              # Page détail parc
│   ├── ascenseurs/[id]/         # Page détail ascenseur
│   ├── components/              # Composants spécifiques aux pages
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Dashboard
│   └── globals.css              # Styles globaux
├── components/                   # Composants UI réutilisables
│   ├── StatusBadge.tsx          # Badge de statut
│   ├── EvenementBadge.tsx       # Badge d'événement
│   ├── Card.tsx                 # Composant carte
│   ├── StatCard.tsx             # Carte de statistiques
│   ├── Timeline.tsx             # Chronologie d'événements
│   ├── LoadingSpinner.tsx       # Indicateur de chargement
│   └── ErrorMessage.tsx         # Message d'erreur
├── domain/                       # Logique métier
│   ├── types.ts                 # Types et énumérations
│   ├── business-logic.ts        # Règles métier et transitions
│   └── business-logic.test.ts   # Tests unitaires
├── data/                         # Données mockées
│   ├── mockData.ts              # Données initiales
│   └── store.ts                 # Store en mémoire
├── lib/                          # Utilitaires
│   └── utils.ts                 # Fonctions helper
└── README.md                     # Ce fichier
```

## 🎨 Design et UX

### Palette de Couleurs

- **Fonctionnel** : Vert (#10b981)
- **En panne** : Rouge (#ef4444)
- **En réparation** : Jaune/Orange (#f59e0b)
- **Primaire** : Bleu (#0ea5e9)

### Principes UX

- Interface épurée et professionnelle
- Navigation claire avec breadcrumbs
- Actions contextuelles selon l'état
- Retours visuels immédiats
- Messages d'aide et tooltips
- Responsive (desktop first, tablette compatible)

## 🔍 Exploration de la Démo

### Scénario de démonstration suggéré

1. **Consulter le Dashboard**
   - Observer les statistiques globales
   - Consulter le panneau de notifications à droite
   - Identifier les pannes récentes non attribuées (badge rouge)

2. **Explorer un Parc**
   - Cliquer sur un parc depuis le dashboard
   - Observer les statistiques du parc
   - Utiliser les filtres dans l'onglet Ascenseurs
   - Consulter les techniciens associés

3. **Gérer une Panne**
   - Sélectionner un ascenseur fonctionnel
   - Déclarer une panne avec un commentaire
   - Attribuer un technicien
   - Démarrer la réparation
   - Clôturer et remettre en service
   - Observer l'historique complet

4. **Consulter l'Historique**
   - Ouvrir un ascenseur qui a déjà un historique
   - Observer la timeline des événements
   - Noter les informations de temps relatif

## 🧪 Tests

Les tests unitaires couvrent la logique métier critique :

- ✅ Déclaration de panne
- ✅ Attribution de technicien
- ✅ Démarrage de réparation
- ✅ Clôture de réparation
- ✅ Transitions impossibles
- ✅ Scénario complet end-to-end

Lancer les tests avec `npm test`

## 💾 Données Mockées

L'application contient des données préremplies :

- **3 parcs** : Centre Ville, Résidentiel, Tertiaire
- **15 ascenseurs** répartis sur les 3 parcs avec des états variés
- **7 techniciens** avec spécialités différentes
- **Historique** prérempli pour certains ascenseurs

Les données sont en mémoire et se réinitialisent à chaque redémarrage du serveur.

## 🔒 Règles Métier

Les transitions d'état sont strictement contrôlées :

- Un ascenseur fonctionnel peut passer en panne
- Une panne doit être attribuée avant de démarrer une réparation
- Seul un ascenseur en cours de réparation peut être clôturé
- Impossible de passer directement de fonctionnel à en réparation

Toutes les règles sont testées et documentées dans `domain/business-logic.ts`

## 🎯 Points d'Attention

### Qualité du Code

- **TypeScript strict** : Typage complet sans `any`
- **Organisation modulaire** : Séparation claire des responsabilités
- **Commentaires** : Documentation des fonctions et règles métier importantes
- **Tests** : Couverture des fonctions critiques

### Performance

- Server Components Next.js pour un rendu optimal
- Client Components uniquement pour l'interactivité
- Refresh sélectif avec `router.refresh()`

### Accessibilité

- Structure sémantique HTML
- Labels et ARIA attributes
- Contraste de couleurs respecté

## 📝 Améliorations Futures Possibles

- Persistance réelle avec base de données
- Authentification et gestion des rôles
- Filtres avancés et recherche
- Export de rapports
- Notifications push en temps réel
- Version mobile native
- Graphiques de statistiques avancés

## 📄 Licence

Application de démonstration - 2024

---

**Développé avec Next.js 14, React 18 et TypeScript**
