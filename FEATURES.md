# 🚀 Nouvelles Fonctionnalités GMAO Ascenseurs

## ✨ Présentation

Application complète de gestion de maintenance pour parcs d'ascenseurs avec des fonctionnalités avancées :

- 🎯 **Interface de gestion innovante** avec drag & drop
- 💾 **Sauvegarde automatique** sans bouton
- 🤖 **Rapports journaliers IA** générés par OpenAI

---

## 📋 Fonctionnalités Détaillées

### 1. Page de Gestion (`/gestion`)

#### 🏢 Gestion des Parcs
- **Ajouter un parc** : Modal intuitive avec tous les champs nécessaires
- **Modifier un parc** : Cliquez sur l'icône d'édition
- **Supprimer un parc** : Avec confirmation si le parc contient des ascenseurs
- **Champs disponibles** :
  - Nom du parc (requis)
  - Description
  - Ville (requis)
  - Adresse

#### 🛗 Gestion des Ascenseurs
- **Ajouter un ascenseur** : Via le bouton "Nouvel Ascenseur" ou depuis une carte de parc
- **Modifier un ascenseur** : Cliquez sur l'icône d'édition
- **Supprimer un ascenseur** : Avec confirmation
- **Déplacer par Drag & Drop** : 
  - Glissez un ascenseur d'un parc à un autre
  - Zone de dépôt visuelle avec feedback
  - Sauvegarde automatique du changement
- **Champs disponibles** :
  - Nom de l'ascenseur (requis)
  - Référence technique
  - Parc d'appartenance (requis)

#### 💾 Auto-Save (Sauvegarde Automatique)
- **Sans bouton** : Toutes les modifications sont sauvegardées automatiquement
- **Debouncing** : Attente de 1 seconde après la dernière modification
- **Indicateur visuel** :
  - 🟡 Jaune : Sauvegarde en cours (clignotant)
  - 🟢 Vert : Sauvegardé
  - ⚪ Gris : En attente
- **Gestion d'erreur** : Rechargement automatique en cas d'échec

#### 🎨 Interface Innovante
- **Design moderne** : Cartes avec gradients et ombres
- **Responsive** : S'adapte à tous les écrans
- **Grille flexible** : Jusqu'à 3 colonnes sur grand écran
- **Badge de statut** : Visualisation rapide de l'état des ascenseurs
- **Animations fluides** : Transitions et effets visuels

---

### 2. Page Rapports IA (`/rapports`)

#### 🤖 Génération Automatique
- **Intelligence artificielle** : Utilise GPT-4o-mini d'OpenAI
- **Sélection de date** : Choisissez n'importe quelle date
- **Génération rapide** : Environ 5-10 secondes

#### 📊 Contenu du Rapport
Le rapport IA contient automatiquement :
1. **Résumé exécutif** : Vue d'ensemble de la journée
2. **Analyse de performance** : Évaluation globale des parcs
3. **Points d'attention** : Alertes et situations critiques
4. **Recommandations** : Actions à entreprendre
5. **Conclusion** : Synthèse et perspectives

#### 📈 Données Analysées
- Nombre total de parcs
- Nombre total d'ascenseurs
- Statistiques par état (fonctionnel, en panne, en réparation)
- Événements du jour avec détails
- Statistiques détaillées par parc

#### 💾 Export
- **Téléchargement Markdown** : Format `.md` pour archivage
- **Nom de fichier** : `rapport-YYYY-MM-DD.md`
- **Réutilisable** : Peut être converti en PDF ou autre format

#### 🎨 Affichage
- **Markdown formaté** : Rendu professionnel avec react-markdown
- **En-tête visuel** : Statistiques clés en un coup d'œil
- **Badge IA** : Indication claire de la génération automatique
- **Design responsive** : Lecture confortable sur tous les appareils

---

## 🛠️ Configuration

### 1. Installation des Dépendances

```bash
npm install
```

Nouvelles dépendances ajoutées :
- `@dnd-kit/core` : Gestion du drag & drop
- `@dnd-kit/sortable` : Fonctionnalités de tri
- `@dnd-kit/utilities` : Utilitaires pour dnd-kit
- `openai` : SDK OpenAI pour les rapports IA
- `react-markdown` : Rendu des rapports Markdown

### 2. Configuration OpenAI

1. Obtenez une clé API sur [platform.openai.com](https://platform.openai.com)
2. Copiez `.env.example` vers `.env.local`
3. Ajoutez votre clé API :

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

⚠️ **Important** : Ne partagez jamais votre clé API et ne la commitez pas dans Git !

### 3. Lancement

```bash
npm run dev
```

Accédez à :
- Dashboard : http://localhost:3000
- Gestion : http://localhost:3000/gestion
- Rapports : http://localhost:3000/rapports

---

## 📡 API Routes

### Parcs

#### `GET /api/parcs`
Récupère tous les parcs avec leurs statistiques

#### `POST /api/parcs`
Crée un nouveau parc
```json
{
  "nom": "Parc Centre",
  "description": "Parc du centre-ville",
  "ville": "Paris",
  "adresse": "123 Rue Example"
}
```

#### `PUT /api/parcs`
Met à jour un parc existant
```json
{
  "id": "parc-123",
  "nom": "Parc Centre Modifié",
  "description": "Nouvelle description",
  "ville": "Paris",
  "adresse": "456 Rue Example"
}
```

#### `DELETE /api/parcs?id={parcId}`
Supprime un parc et tous ses ascenseurs

### Ascenseurs

#### `GET /api/ascenseurs`
Récupère tous les ascenseurs

#### `POST /api/ascenseurs`
Crée un nouvel ascenseur
```json
{
  "nom": "Ascenseur A",
  "referenceTechnique": "ASC-001",
  "parcId": "parc-123"
}
```

#### `PUT /api/ascenseurs`
Met à jour ou déplace un ascenseur
```json
{
  "id": "asc-456",
  "nom": "Ascenseur A Modifié",
  "referenceTechnique": "ASC-001-V2",
  "parcId": "parc-789"
}
```

Pour un simple déplacement (drag & drop) :
```json
{
  "id": "asc-456",
  "parcId": "parc-789",
  "action": "move"
}
```

#### `DELETE /api/ascenseurs?id={ascenseurId}`
Supprime un ascenseur et son historique

### Rapports

#### `POST /api/rapports/daily`
Génère un rapport journalier avec IA
```json
{
  "date": "2024-11-24"  // Optionnel, par défaut aujourd'hui
}
```

Réponse :
```json
{
  "success": true,
  "data": {
    "date": "2024-11-24",
    "rapport": "# Rapport journalier\n\n...",
    "statistiques": {
      "totalAscenseurs": 15,
      "nombreFonctionnels": 12,
      "nombreEnPanne": 2,
      "nombreEnReparation": 1
    },
    "evenementsCount": 8
  }
}
```

---

## 🎯 Utilisation

### Scénario 1 : Créer un nouveau parc

1. Allez sur `/gestion`
2. Cliquez sur "Nouveau Parc"
3. Remplissez le formulaire
4. Cliquez sur "Créer"
5. ✅ Le parc apparaît immédiatement

### Scénario 2 : Ajouter des ascenseurs

1. Sur une carte de parc, cliquez sur "Ajouter"
2. Remplissez le nom et la référence
3. Cliquez sur "Créer"
4. ✅ L'ascenseur apparaît dans le parc

### Scénario 3 : Réorganiser avec Drag & Drop

1. Cliquez et maintenez sur un ascenseur (icône de grip)
2. Glissez-le vers un autre parc
3. Relâchez
4. ✅ L'ascenseur change de parc automatiquement
5. 💾 Sauvegarde automatique en arrière-plan

### Scénario 4 : Générer un rapport IA

1. Allez sur `/rapports`
2. Sélectionnez une date
3. Cliquez sur "Générer le rapport"
4. ⏳ Attendez 5-10 secondes
5. ✅ Le rapport apparaît avec analyse complète
6. 📥 Téléchargez en Markdown si besoin

---

## 🔧 Architecture Technique

### Frontend
- **Next.js 14** : App Router avec Server Components
- **React 18** : Hooks modernes
- **TypeScript** : Type safety complet
- **Tailwind CSS** : Styling utilitaire
- **dnd-kit** : Drag & drop moderne et accessible
- **Lucide React** : Icônes SVG

### Backend
- **Next.js API Routes** : API REST intégrée
- **OpenAI SDK** : Intégration GPT-4o-mini
- **In-memory Store** : Simulation de base de données

### Patterns
- **Auto-save avec debouncing** : useEffect + setTimeout
- **Optimistic UI** : Mise à jour locale immédiate
- **Error handling** : Try/catch avec rollback
- **Client/Server separation** : 'use client' où nécessaire

---

## 🎨 Design System

### Couleurs
- **Primary** : Bleu (#2563eb)
- **Success** : Vert (#10b981)
- **Warning** : Jaune (#f59e0b)
- **Danger** : Rouge (#ef4444)
- **Purple** : Violet (#9333ea) - IA

### Composants
- **Cartes** : Arrondies avec bordures et ombres
- **Modals** : Centrées avec overlay
- **Badges** : État avec couleurs sémantiques
- **Boutons** : Primary, secondary, danger
- **Inputs** : Focus ring bleu

---

## 📝 Notes Importantes

### Sauvegarde Automatique
- Les données sont en mémoire et seront perdues au redémarrage
- Pour une production, utilisez une vraie base de données
- Le debouncing évite les sauvegardes excessives

### API OpenAI
- Coût : ~$0.0001 par rapport (très faible)
- Rate limits : Respectez les limites de votre plan
- Timeout : 30 secondes max par défaut
- Erreurs : Vérifiez votre clé API et votre crédit

### Performance
- Drag & drop optimisé pour 100+ ascenseurs
- Rapports générés en 5-10 secondes
- Auto-save avec debounce de 1 seconde
- Pas de rechargements de page inutiles

---

## 🚀 Prochaines Améliorations Possibles

- [ ] Base de données persistante (PostgreSQL/MongoDB)
- [ ] Authentification utilisateur
- [ ] Export PDF des rapports
- [ ] Notifications en temps réel
- [ ] Graphiques et analytics
- [ ] Mode hors ligne (PWA)
- [ ] Rapports hebdomadaires/mensuels
- [ ] Prédictions IA pour la maintenance

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez que toutes les dépendances sont installées
2. Assurez-vous que la clé OpenAI est correcte
3. Consultez les logs de la console navigateur et serveur
4. Redémarrez le serveur si nécessaire

---

**Fait avec ❤️ pour une meilleure gestion de maintenance**
