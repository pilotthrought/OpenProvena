#!/bin/sh
# OpenProvena — Déploiement PRODUCTION

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DC="docker compose -f docker-compose.prod.yml --env-file .env.production"

echo "═══════════════════════════════════════════════════════════"
echo "  OpenProvena — Déploiement Production"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── 1. Vérifier .env.production ──────────────────────────────────────────
if [ ! -f ".env.production" ]; then
  echo "✗ .env.production introuvable."
  echo "  → cp .env.production.example .env.production && éditez-le"
  exit 1
fi

# Sourcer le fichier pour avoir les variables disponibles dans ce shell
set -a
. "./.env.production"
set +a

if [ -z "$DOMAIN" ]; then
  echo "✗ DOMAIN vide dans .env.production"
  exit 1
fi
if [ -z "$ACME_EMAIL" ]; then
  echo "✗ ACME_EMAIL vide dans .env.production"
  exit 1
fi
echo "✓ Domaine : $DOMAIN"
echo "✓ Email   : $ACME_EMAIL"

# ── 2. Vérifier les secrets ───────────────────────────────────────────────
REQUIRED_SECRETS="secret_key.txt postgres_password.txt neo4j_password.txt rabbitmq_password.txt grafana_password.txt"
MISSING=""
for s in $REQUIRED_SECRETS; do
  f="secrets/$s"
  if [ ! -f "$f" ] || [ ! -s "$f" ]; then
    MISSING="$MISSING $s"
  fi
done

if [ -n "$MISSING" ]; then
  echo "✗ Secrets manquants :$MISSING"
  echo "  → ./scripts/generate-secrets.sh"
  exit 1
fi
echo "✓ Secrets présents"

# ── 3. Permissions secrets ────────────────────────────────────────────────
for f in secrets/*.txt; do
  [ -f "$f" ] || continue
  chmod 600 "$f"
done
echo "✓ Permissions secrets : 600"

# ── 4. Espace disque ─────────────────────────────────────────────────────
AVAIL_KB=$(df -Pk . | tail -1 | awk '{print $4}')
AVAIL_GB=$((AVAIL_KB / 1024 / 1024))
if [ "$AVAIL_GB" -lt 5 ]; then
  echo "⚠  Espace disque faible : ${AVAIL_GB} Go disponibles"
  printf "Continuer quand même ? [y/N] "
  read -r CONFIRM
  [ "$CONFIRM" = "y" ] || exit 1
else
  echo "✓ Espace disque : ${AVAIL_GB} Go"
fi

# ── 5. Confirmation DNS ───────────────────────────────────────────────────
echo ""
echo "Les enregistrements DNS suivants doivent pointer vers ce serveur :"
echo "  $DOMAIN"
echo "  api.$DOMAIN"
echo "  grafana.$DOMAIN"
echo "  flower.$DOMAIN"
echo ""
printf "DNS configuré et propagé ? [y/N] "
read -r DNS_OK
[ "$DNS_OK" = "y" ] || { echo "Relancez ce script une fois le DNS propagé."; exit 1; }

# ── 6. Build ──────────────────────────────────────────────────────────────
echo ""
echo "==> Build des images..."
$DC build --no-cache

# ── 7. Démarrage des infras d'abord ──────────────────────────────────────
echo ""
echo "==> Démarrage postgres, redis, rabbitmq..."
$DC up -d postgres redis rabbitmq

echo "==> Attente 15s que les bases soient prêtes..."
sleep 15

# ── 8. Démarrage complet ──────────────────────────────────────────────────
echo ""
echo "==> Démarrage de tous les services..."
$DC up -d

# ── 9. Attente healthcheck API ────────────────────────────────────────────
echo ""
echo "==> Attente API healthy (max 120s)..."
for i in $(seq 1 24); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' provena_api 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "✓ API healthy."
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "✗ API non healthy après 120s."
    echo "  → $DC logs api --tail=50"
    exit 1
  fi
  printf "  ... (%ds)\n" "$((i*5))"
  sleep 5
done

# ── 10. Résumé ────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✓ OpenProvena déployé"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Frontend : https://$DOMAIN"
echo "  API      : https://api.$DOMAIN"
echo "  Grafana  : https://grafana.$DOMAIN"
echo "  Flower   : https://flower.$DOMAIN"
echo ""
echo "  Logs : $DC logs -f"
echo ""
echo "  Alias pratique à ajouter dans ~/.bashrc :"
echo "    alias dcp='docker compose -f $ROOT/docker-compose.prod.yml --env-file $ROOT/.env.production'"
echo ""
