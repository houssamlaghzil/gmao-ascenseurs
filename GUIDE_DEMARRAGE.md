# Guide de Démarrage Rapide - GMAO Ascenseurs

## 🚀 Lancer l'application en 3 étapes

### 1. Installer les dépendances (première fois uniquement)

```bash
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

### 3. Ouvrir l'application

Ouvrez votre navigateur et accédez à : **http://localhost:3000**

---

## 📱 Première Visite - Que Faire ?

### Dashboard (Page d'accueil)

Vous arriverez sur le **Dashboard** qui affiche :

- 📊 **4 cartes de statistiques** en haut : Total ascenseurs, Fonctionnels, En panne, En réparation
- 🏢 **Liste des 3 parcs** à gauche avec leurs statistiques détaillées
- 🔔 **Panneau de notifications** à droite avec les derniers événements

**Action suggérée** : Cliquez sur l'un des parcs pour voir ses détails.

---

### Page Détail d'un Parc

Vous verrez :

- **Statistiques du parc** en haut
- **2 onglets** :
  - **Ascenseurs** : Liste de tous les ascenseurs du parc avec filtres (Tous, Fonctionnels, En panne, En réparation)
  - **Techniciens** : Liste des techniciens associés au parc avec leur disponibilité

**Action suggérée** : Cliquez sur "Voir détails" d'un ascenseur.

---

### Page Détail d'un Ascenseur

C'est ici que la magie opère ! Vous verrez :

- **Badge de statut** (vert/rouge/jaune) indiquant l'état actuel
- **Panneau d'actions** à gauche selon l'état de l'ascenseur
- **Historique complet** à droite sous forme de timeline

---

## 🎮 Scénario de Test Complet

### Tester le workflow de gestion d'une panne

1. **Dashboard** → Cliquez sur "Parc Centre Ville"

2. **Parc Centre Ville** → Onglet "Ascenseurs" → Trouvez "Ascenseur A1" (Fonctionnel) → Cliquez "Voir détails"

3. **Ascenseur A1** → Dans le panneau d'actions :
   - Tapez un commentaire : "Problème de portes automatiques"
   - Cliquez sur **"Déclarer une panne"**
   - ✅ L'ascenseur passe en état "En panne - Non attribué"

4. **Attribuer un technicien** :
   - Sélectionnez un technicien dans la liste déroulante (ex: "Jean Dupont")
   - Cliquez sur **"Attribuer au technicien"**
   - ✅ L'ascenseur passe en état "En panne - Attribué"

5. **Démarrer la réparation** :
   - Cliquez sur **"Démarrer la réparation"**
   - ✅ L'ascenseur passe en état "En cours de réparation"

6. **Clôturer la réparation** :
   - (Optionnel) Ajoutez un commentaire de clôture
   - Cliquez sur **"Clôturer et remettre en service"**
   - ✅ L'ascenseur redevient "Fonctionnel"

7. **Vérifier l'historique** :
   - Regardez la timeline à droite
   - Vous verrez tous les événements que vous venez de créer !

---

## 🔍 Explorer les Données Pré-remplies

L'application contient déjà des données pour la démonstration :

### Parcs
- **Parc Centre Ville** (Lyon)
- **Parc Résidentiel** (Lyon)
- **Parc Tertiaire** (Villeurbanne)

### Ascenseurs avec historique
- **Ascenseur A1** : A un historique de réparation terminée il y a 7 jours
- **Ascenseur A2** : En panne, non attribué (déclarée il y a 2h)
- **Ascenseur B1** : En panne, attribué à Marie Martin
- **Ascenseur C1** : En cours de réparation par Jean Dupont
- Et 11 autres ascenseurs...

### Techniciens
7 techniciens avec différentes spécialités :
- Jean Dupont (Ascenseurs hydrauliques)
- Marie Martin (Ascenseurs électriques)
- Pierre Durand (Tous types d'ascenseurs)
- etc.

---

## 🎨 Filtres et Navigation

### Dashboard
- Cliquez sur un parc pour voir ses détails
- Le panneau de notifications affiche les pannes récentes en rouge

### Page Parc
- **Onglet Ascenseurs** : Utilisez les filtres en haut pour voir :
  - Tous
  - Fonctionnels uniquement
  - En panne uniquement
  - En réparation uniquement

- **Onglet Techniciens** : Voir tous les techniciens du parc avec :
  - Icône verte (disponible) ou rouge (occupé)
  - Nombre de réparations en cours

### Navigation
- Utilisez le **breadcrumb** en haut pour revenir en arrière
- Cliquez sur **"Dashboard"** dans le header pour revenir à l'accueil

---

## ⚠️ Points Importants

### Données en Mémoire
Les données sont **mockées en mémoire**. Elles se réinitialisent quand vous :
- Redémarrez le serveur (`Ctrl+C` puis `npm run dev`)
- Rechargez la page après avoir arrêté le serveur

### Règles Métier
L'application respecte des règles strictes :
- ✅ Vous **pouvez** déclarer une panne sur un ascenseur fonctionnel
- ❌ Vous **ne pouvez pas** démarrer une réparation sans avoir attribué un technicien
- ❌ Vous **ne pouvez pas** clôturer un ascenseur qui n'est pas en cours de réparation
- Toutes les transitions sont validées côté serveur

### Performance
- Les pages se rechargent automatiquement après chaque action
- L'historique est mis à jour en temps réel
- Les statistiques sont recalculées automatiquement

---

## 🧪 Lancer les Tests

```bash
# Tests unitaires
npm test

# Tests avec interface UI
npm run test:ui
```

Les tests vérifient la logique métier et les transitions d'état.

---

## 🛑 Arrêter le Serveur

Appuyez sur `Ctrl+C` dans le terminal où le serveur tourne.

---

## 📞 En Cas de Problème

### Le serveur ne démarre pas
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install
npm run dev
```

### Port 3000 déjà utilisé
```bash
# Lancer sur un autre port
PORT=3001 npm run dev
```

### Erreur TypeScript
- Vérifiez que vous utilisez Node.js 18+
- Vérifiez que TypeScript est installé : `npm install -D typescript`

---

## 🎯 Objectifs de la Démo

Cette application démontre :
- ✅ Architecture Next.js 14 avec App Router
- ✅ TypeScript strict avec types métier
- ✅ Gestion d'état avec workflow de maintenance
- ✅ API Routes pour la logique serveur
- ✅ Composants réutilisables bien structurés
- ✅ Tests unitaires de la logique métier
- ✅ UX professionnelle pour utilisateur métier

---

**Bon test ! 🚀**
