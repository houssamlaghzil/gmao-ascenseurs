# 🚀 Guide de Démarrage Rapide - GMAO Ascenseurs

## ⚡ Installation Express (3 minutes)

### 1️⃣ Vérifier que tout est installé
```bash
npm install
```

### 2️⃣ Configurer OpenAI (optionnel pour les rapports IA)

Créez un fichier `.env.local` :
```bash
copy .env.example .env.local
```

Modifiez `.env.local` et ajoutez votre clé API OpenAI :
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
OPENAI_API_KEY=sk-votre-cle-ici
```

> 💡 **Astuce** : Obtenez une clé gratuite sur [platform.openai.com](https://platform.openai.com)

### 3️⃣ Lancer l'application
```bash
npm run dev
```

### 4️⃣ Ouvrir dans le navigateur
http://localhost:3000

---

## 🎯 Premier Pas - Créer Votre Premier Parc

### Via l'interface web

1. **Accédez à la page Gestion**
   - Cliquez sur "Gestion" dans la barre de navigation
   - Ou allez sur http://localhost:3000/gestion

2. **Créez un parc**
   - Cliquez sur le bouton bleu "Nouveau Parc"
   - Remplissez :
     - Nom : "Mon Premier Parc"
     - Ville : "Paris"
     - Description : "Parc de test"
     - Adresse : "123 Rue Example"
   - Cliquez sur "Créer"

3. **Ajoutez des ascenseurs**
   - Dans la carte du parc, cliquez sur "Ajouter"
   - Nom : "Ascenseur A"
   - Référence : "ASC-001"
   - Cliquez sur "Créer"
   - Répétez pour créer "Ascenseur B" et "Ascenseur C"

4. **Testez le Drag & Drop**
   - Créez un second parc "Parc Test 2"
   - Glissez-déposez un ascenseur du premier parc vers le second
   - 💾 Observez l'indicateur de sauvegarde automatique !

---

## 📊 Générer Votre Premier Rapport IA

1. **Accédez aux Rapports**
   - Cliquez sur "Rapports IA" dans la navigation
   - Ou allez sur http://localhost:3000/rapports

2. **Configurez la date**
   - Sélectionnez la date d'aujourd'hui (ou une autre)

3. **Générez**
   - Cliquez sur "Générer le rapport"
   - ⏳ Attendez 5-10 secondes
   - ✅ Le rapport IA apparaît avec une analyse complète !

4. **Téléchargez (optionnel)**
   - Cliquez sur "Télécharger"
   - Le fichier `.md` est sauvegardé

---

## 🎮 Fonctionnalités Clés à Tester

### ✅ Interface Drag & Drop
- [x] Glisser un ascenseur d'un parc à l'autre
- [x] Voir la zone de dépôt s'illuminer
- [x] Sauvegarde automatique sans bouton

### ✅ Gestion Complète
- [x] Ajouter/modifier/supprimer un parc
- [x] Ajouter/modifier/supprimer un ascenseur
- [x] Voir les statistiques en temps réel

### ✅ Auto-Save
- [x] Observer l'indicateur de sauvegarde
  - 🟡 Jaune clignotant = sauvegarde en cours
  - 🟢 Vert = sauvegardé
- [x] Pas besoin de cliquer sur "Sauvegarder"

### ✅ Rapports IA
- [x] Génération automatique avec OpenAI
- [x] Analyse intelligente des données
- [x] Recommandations d'actions
- [x] Export en Markdown

---

## 🔗 Pages Disponibles

| Page | URL | Description |
|------|-----|-------------|
| **Dashboard** | `/` | Vue d'ensemble, statistiques globales |
| **Détail Parc** | `/parcs/[id]` | Gestion d'un parc spécifique |
| **Détail Ascenseur** | `/ascenseurs/[id]` | Suivi et actions sur un ascenseur |
| **Gestion** | `/gestion` | Interface drag & drop pour tout gérer |
| **Rapports IA** | `/rapports` | Génération de rapports automatisés |

---

## 🛠️ Dépannage Rapide

### ❌ Erreur : Module not found
```bash
# Réinstallez les dépendances
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erreur OpenAI : Invalid API Key
1. Vérifiez que `.env.local` existe
2. Vérifiez que la clé commence par `sk-`
3. Redémarrez le serveur : `Ctrl+C` puis `npm run dev`

### ❌ Le drag & drop ne fonctionne pas
- Vérifiez que vous utilisez la souris/trackpad
- Essayez de glisser depuis l'icône de grip (≡)
- Rechargez la page

### ❌ L'auto-save ne se déclenche pas
- C'est normal ! Il attend 1 seconde après votre dernière action
- Observez l'indicateur en haut à droite
- Les modifications sont bien sauvegardées même si l'indicateur n'est pas vert

---

## 📚 Ressources

- **Documentation complète** : Voir `FEATURES.md`
- **Guide original** : Voir `GUIDE_DEMARRAGE.md`
- **Code source** : Explorez les dossiers `/app` et `/components`

---

## 🎯 Prochaines Étapes

### Niveau Débutant
1. ✅ Créez 3 parcs différents
2. ✅ Ajoutez 5 ascenseurs dans chaque parc
3. ✅ Testez le drag & drop entre parcs
4. ✅ Générez votre premier rapport IA

### Niveau Intermédiaire
1. ✅ Déclarez une panne sur un ascenseur (Dashboard)
2. ✅ Attribuez un technicien
3. ✅ Suivez le cycle de vie complet
4. ✅ Comparez les rapports de différents jours

### Niveau Avancé
1. ✅ Explorez le code source
2. ✅ Modifiez les prompts OpenAI
3. ✅ Ajoutez vos propres fonctionnalités
4. ✅ Connectez à une vraie base de données

---

## 💡 Astuces Pro

### 🎨 Personnalisation
- Les couleurs sont dans `tailwind.config.ts`
- Les types sont dans `domain/types.ts`
- Les données de démo dans `data/mockData.ts`

### ⚡ Performance
- L'auto-save utilise un debounce de 1 seconde
- Le drag & drop est optimisé avec `@dnd-kit`
- Les rapports utilisent GPT-4o-mini (rapide et économique)

### 🔒 Sécurité
- Ne commitez JAMAIS votre `.env.local`
- Gardez votre clé OpenAI secrète
- En production, utilisez des variables d'environnement sécurisées

---

## 🎉 Félicitations !

Vous êtes maintenant prêt à utiliser toutes les fonctionnalités de GMAO Ascenseurs !

**Amusez-vous bien ! 🚀**

---

## 📞 Besoin d'Aide ?

- **Bugs** : Vérifiez la console (F12) et les logs serveur
- **Questions** : Consultez `FEATURES.md` pour plus de détails
- **Améliorations** : N'hésitez pas à modifier le code !

---

**Dernière mise à jour** : Novembre 2024
