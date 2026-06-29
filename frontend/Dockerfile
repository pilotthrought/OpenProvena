# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Manifestes
COPY package.json package-lock.json* ./

# Cache npm offline embarqué — pas d'accès réseau nécessaire
COPY npm-offline-cache/ /tmp/npm-cache/

# npm ci avec le cache local — résout les modules pour Alpine x86_64
# --prefer-offline : utilise le cache, ne contacte le réseau qu'en dernier recours
# --cache : pointe vers notre cache embarqué
RUN npm ci --prefer-offline --cache /tmp/npm-cache

# Config
COPY next.config.js tsconfig.json postcss.config.js tailwind.config.js ./

# Sources
COPY src/ ./src/
COPY public/ ./public/

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public/         ./public/

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
