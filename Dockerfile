# =============================================================================
# Dockerfile multi-stage pour Next.js en mode standalone
# Optimisé pour production avec taille d'image minimale
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies - Installation des dépendances
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# -----------------------------------------------------------------------------
# Stage 2: Builder - Build de l'application Next.js
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Désactiver la télémétrie Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Variables d'environnement pour le build (peuvent être overridées)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner - Image finale de production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copier le dossier public s'il existe (optionnel)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public 2>/dev/null || true

# Copier les fichiers de données (store JSON)
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Définir les permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck intégré
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["node", "server.js"]
