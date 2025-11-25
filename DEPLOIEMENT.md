# 🚀 Guide de Déploiement - GMAO Ascenseurs

Ce guide détaille le déploiement de l'application GMAO Ascenseurs avec Docker.

## 📋 Prérequis

### Environnement Local (Développement)
- Node.js 20+ 
- npm ou yarn
- Git

### Environnement Production
- Docker Engine 24+
- Docker Compose plugin v2+
- Git
- Port 3000 disponible (ou configurable)

## 🏗️ Architecture Docker

L'application utilise une architecture Docker optimisée avec Next.js en mode standalone :

```
┌─────────────────────────────────────┐
│    Container: gmao-ascenseurs       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Next.js Server          │   │
│  │  (Frontend + API Routes)    │   │
│  │        Port: 3000           │   │
│  └─────────────────────────────┘   │
│                                     │
│  Données: /app/data (JSON store)   │
└─────────────────────────────────────┘
         ↓
    Host Port: 3000
```

### Multi-stage Build
1. **Stage deps** : Installation des dépendances
2. **Stage builder** : Build Next.js standalone
3. **Stage runner** : Image finale optimisée (Alpine ~150MB)

## 🚀 Déploiement Rapide

### Première Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd gmao-ascenseurs

# 2. Déploiement automatique (installe Docker si nécessaire)
npm run deploy
```

Le script `deploy.sh` va :
- ✅ Vérifier/installer Docker
- ✅ Vérifier Docker Compose
- ✅ Faire un git pull
- ✅ Builder l'image Docker
- ✅ Démarrer le conteneur
- ✅ Tester l'application

### Mises à Jour

```bash
# Mise à jour rapide (build incrémental)
npm run maj

# Mise à jour complète (rebuild sans cache)
npm run maj:hard
```

## 📝 Commandes Disponibles

### Développement Local (sans Docker)

```bash
npm run dev         # Démarrer en mode développement
npm run build       # Build pour production
npm run start       # Démarrer en mode production
npm run lint        # Linter le code
npm test            # Lancer les tests
```

### Docker - Gestion

```bash
# Build
npm run docker:build    # Builder l'image Docker

# Démarrage/Arrêt
npm run docker:up       # Démarrer le conteneur
npm run docker:down     # Arrêter et supprimer le conteneur
npm run docker:restart  # Redémarrer le conteneur

# Logs
npm run docker:logs     # Voir les logs en temps réel
npm run logs            # Alias pour les logs
```

### Docker - Déploiement

```bash
# Déploiement complet
npm run deploy          # Script automatisé (installation + build + start)

# Mises à jour
npm run maj             # Git pull + rebuild + redémarrage
npm run maj:hard        # Git pull + nettoyage + rebuild complet
```

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env.local` (local) ou `.env` (production) :

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# OpenAI (pour les rapports IA)
OPENAI_API_KEY=sk-...

# Node Environment
NODE_ENV=production
```

⚠️ **Important** : Les fichiers `.env*.local` sont ignorés par Git (sécurité).

### Ports

Par défaut, l'application écoute sur le port `3000`.

Pour changer le port :

```yaml
# docker-compose.yml
services:
  web:
    ports:
      - "8080:3000"  # Host:Container
```

## 🏥 Monitoring et Santé

### Healthcheck

L'application expose un endpoint de santé :

```bash
curl http://localhost:3000/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2024-11-25T14:30:00.000Z",
  "uptime": 123.45
}
```

### Vérifier l'État

```bash
# État des conteneurs
docker compose ps

# Logs en direct
npm run logs

# Logs des dernières 50 lignes
docker compose logs --tail=50 web

# Statistiques de ressources
docker stats gmao-ascenseurs
```

## 🐛 Dépannage

### Le conteneur ne démarre pas

```bash
# Voir les logs d'erreur
docker compose logs web

# Reconstruire complètement
npm run maj:hard
```

### Port déjà utilisé

```bash
# Trouver qui utilise le port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Changer le port dans docker-compose.yml
ports:
  - "8080:3000"
```

### Problème de permissions

```bash
# Sur Linux, ajouter votre user au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Puis relancer
npm run docker:up
```

### Build échoue (out of memory)

```bash
# Augmenter la mémoire Docker (Docker Desktop)
# Settings → Resources → Memory → 4GB minimum

# Ou builder sans cache
docker compose build --no-cache
```

## 📊 Performance

### Taille de l'Image

```bash
docker images | grep gmao-ascenseurs
```

Taille attendue : **~150-200 MB** (optimisé avec Alpine + standalone)

### Optimisations Appliquées

- ✅ Multi-stage build (dépendances de dev exclues)
- ✅ Next.js standalone mode (40% plus petit)
- ✅ Alpine Linux (base minimale)
- ✅ .dockerignore (exclut node_modules, .next, etc.)
- ✅ User non-root (sécurité)

## 🔐 Sécurité

### Bonnes Pratiques Appliquées

1. **User non-root** : Le conteneur tourne avec `nextjs:nodejs` (UID 1001)
2. **Secrets** : Variables sensibles dans `.env` (non versionnées)
3. **Healthcheck** : Redémarrage automatique si l'app crash
4. **Multi-stage** : Pas d'outils de build en production

### Recommandations Production

```bash
# 1. Utiliser des secrets Docker pour les clés sensibles
docker secret create openai_key ./openai.key

# 2. Activer le firewall
sudo ufw allow 3000/tcp

# 3. Reverse proxy Nginx (optionnel)
# Voir: NGINX_SETUP.md (à créer si besoin)
```

## 📦 Structure des Fichiers Docker

```
gmao-ascenseurs/
├── Dockerfile              # Build multi-stage Next.js
├── .dockerignore          # Fichiers exclus du build
├── docker-compose.yml     # Orchestration
├── scripts/
│   └── deploy.sh          # Script de déploiement auto
├── next.config.mjs        # Config Next.js (standalone mode)
└── app/
    └── api/
        └── health/
            └── route.ts   # Endpoint healthcheck
```

## 🌐 Déploiement sur Serveur Distant

### Via SSH

```bash
# 1. Se connecter au serveur
ssh user@serveur.com

# 2. Cloner le projet
git clone <repo-url>
cd gmao-ascenseurs

# 3. Déployer
npm run deploy

# 4. Vérifier
curl http://localhost:3000/api/health
```

### Avec CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          ssh user@serveur.com 'cd gmao-ascenseurs && npm run maj'
```

## 📚 Ressources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose](https://docs.docker.com/compose/)

### Logs et Monitoring
```bash
# Logs en temps réel
npm run logs

# Logs spécifiques à une période
docker compose logs --since 2h web

# Sauvegarder les logs
docker compose logs web > logs_$(date +%Y%m%d).txt
```

## ✅ Checklist de Production

Avant de déployer en production :

- [ ] Variables d'environnement configurées
- [ ] OPENAI_API_KEY définie (si rapports IA utilisés)
- [ ] Port 3000 accessible (ou reverse proxy configuré)
- [ ] Firewall configuré
- [ ] Healthcheck fonctionne
- [ ] Logs accessibles
- [ ] Backup des données `/app/data` si nécessaire
- [ ] Tests de charge effectués
- [ ] Plan de rollback en place

## 🆘 Support

En cas de problème :

1. Vérifier les logs : `npm run logs`
2. Tester le healthcheck : `curl http://localhost:3000/api/health`
3. Reconstruire : `npm run maj:hard`
4. Consulter la documentation Docker : `docker compose --help`

---

**Version** : 1.0.0  
**Dernière mise à jour** : Novembre 2025
