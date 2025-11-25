# Dockerfile multi-stage pour Next.js en mode standalone
# Optimisé pour production avec taille d'image minimale

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les dépendances depuis le stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build Next.js en mode standalone
RUN npm run build

# Stage 3: Runner (image finale)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier uniquement ce qui est nécessaire depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copier les fichiers de données (store JSON)
COPY --from=builder /app/data ./data

# Changer les permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Démarrer Next.js
CMD ["node", "server.js"]
