#!/bin/bash

# Script de déploiement automatisé pour GMAO Ascenseurs
# Compatible Debian/Ubuntu/macOS avec Docker et Docker Compose

set -e

# Configuration
PROJECT_NAME="gmao-ascenseurs"
APP_PORT=3000
COMPOSE_FILE="docker-compose.yml"
BRANCH="main"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonctions utilitaires
say() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

die() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

require_file() {
    [ -f "$1" ] || die "Fichier requis manquant: $1"
}

# Banner
echo "========================================="
echo "  Déploiement GMAO Ascenseurs"
echo "========================================="
echo ""

# 1. Vérifier les fichiers requis
say "Vérification des fichiers requis..."
require_file "$COMPOSE_FILE"
require_file "Dockerfile"
require_file "package.json"

# 2. Installer Docker si absent
if ! command -v docker &> /dev/null; then
    warn "Docker n'est pas installé. Installation..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Installation Docker sur Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        # Ajouter l'utilisateur au groupe docker
        sudo usermod -aG docker $USER
        say "Docker installé ! Vous devrez peut-être vous reconnecter pour utiliser Docker sans sudo."
    else
        die "Veuillez installer Docker manuellement depuis https://docs.docker.com/get-docker/"
    fi
else
    say "Docker déjà installé ($(docker --version))"
fi

# 3. Vérifier Docker Compose
if ! docker compose version &> /dev/null; then
    die "Docker Compose plugin n'est pas installé. Installez-le avec: sudo apt-get install docker-compose-plugin"
else
    say "Docker Compose disponible ($(docker compose version))"
fi

# 4. Git pull
if [ -d ".git" ]; then
    say "Mise à jour du code depuis Git..."
    git fetch origin
    git reset --hard origin/$BRANCH
    git pull origin $BRANCH
else
    warn "Pas de dépôt Git détecté, skip git pull"
fi

# 5. Arrêter et supprimer les anciens conteneurs
say "Arrêt des anciens conteneurs..."
docker compose down --remove-orphans || true

# 6. Build et démarrage
say "Build de l'image Docker..."
docker compose build --no-cache

say "Démarrage du conteneur..."
docker compose up -d

# 7. Attendre que le conteneur soit prêt
say "Attente du démarrage (healthcheck)..."
sleep 5

# 8. Vérifier l'état
say "État des conteneurs:"
docker compose ps

# 9. Test HTTP (si curl disponible)
if command -v curl &> /dev/null; then
    say "Test de santé de l'application..."
    sleep 3
    if curl -f http://localhost:$APP_PORT/api/health > /dev/null 2>&1; then
        say "${GREEN}✓${NC} Application démarrée avec succès!"
    else
        warn "L'endpoint /api/health ne répond pas encore (peut être normal au démarrage)"
    fi
fi

# 10. Afficher les logs
say "Dernières lignes des logs:"
docker compose logs --tail=20 web

echo ""
echo "========================================="
echo "  Déploiement terminé !"
echo "========================================="
echo "Application accessible sur: http://localhost:$APP_PORT"
echo ""
echo "Commandes utiles:"
echo "  npm run logs        - Voir les logs en temps réel"
echo "  npm run maj         - Mise à jour rapide"
echo "  npm run maj:hard    - Mise à jour complète (rebuild)"
echo "  docker compose down - Arrêter l'application"
echo ""
