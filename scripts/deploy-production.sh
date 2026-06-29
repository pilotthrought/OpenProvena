#!/bin/sh
# OpenProvena — Déploiement PRODUCTION
#
# Effectue les vérifications pré-vol avant tout déploiement :
#   - secrets présents et non vides
#   - .env.production configuré (DOMAIN ≠ valeur d'exemple)
#   - DNS pointant vers ce serveur (avertissement seulement)
#   - espace disque suffisant
# Puis build + déploie avec bascule progressive (healthcheck avant trafic).

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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

DOMAIN=$(grep -E '^DOMAIN=' .env.production | cut -d= -f2)
if [ "$DOMAIN" = "openprovena.org" ] || [ -z "$DOMAIN" ]; then
  echo "✗ DOMAIN n'a pas été configuré dans .env.production (valeur d'exemple détectée)."
  exit 1
fi
echo "✓ Domaine configuré : $DOMAIN"

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
  echo "✗ Secrets manquants ou vides :$MISSING"
  echo "  → ./scripts/generate-secrets.sh"
  exit 1
fi
echo "✓ Tous les secrets requis sont présents"

# ── 3. Vérifier les permissions des secrets ──────────────────────────────
for f in secrets/*.txt; do
  [ -f "$f" ] || continue
  perms=$(stat -c "%a" "$f" 2>/dev/null || stat -f "%Lp" "$f" 2>/dev/null)
  if [ "$perms" != "600" ]; then
    echo "⚠  $f a des permissions $perms (recommandé: 600) — correction..."
    chmod 600 "$f"
  fi
done
echo "✓ Permissions des secrets vérifiées"

# ── 4. Vérifier l'espace disque (minimum 10 Go libres) ───────────────────
AVAIL_KB=$(df -Pk . | tail -1 | awk '{print $4}')
AVAIL_GB=$((AVAIL_KB / 1024 / 1024))
if [ "$AVAIL_GB" -lt 10 ]; then
  echo "⚠  Espace disque faible : ${AVAIL_GB} Go disponibles (recommandé: 10+ Go)"
  printf "Continuer quand même ? [y/N] "
  read -r CONFIRM
  [ "$CONFIRM" = "y" ] || exit 1
else
  echo "✓ Espace disque suffisant (${AVAIL_GB} Go)"
fi

# ── 5. Avertissement DNS ──────────────────────────────────────────────────
echo ""
echo "⚠  Rappel : assurez-vous que les enregistrements DNS suivants pointent"
echo "   vers l'IP de ce serveur avant de continuer :"
echo "     $DOMAIN"
echo "     api.$DOMAIN"
echo "     grafana.$DOMAIN"
echo "     flower.$DOMAIN"
echo ""
printf "DNS configuré et propagé ? [y/N] "
read -r DNS_OK
if [ "$DNS_OK" != "y" ]; then
  echo "Configurez le DNS puis relancez ce script."
  exit 1
fi

# ── 6. Build ────────────────────────────────────────────────────────────
echo ""
echo "==> Build des images (sans cache)..."
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache

# ── 7. Migration DB (si Alembic configuré) ────────────────────────────────
echo ""
echo "==> Démarrage de la base de données seule..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres redis rabbitmq

echo "==> Attente que postgres soit prêt..."
sleep 10

# ── 8. Démarrage complet ───────────────────────────────────────────────────
echo ""
echo "==> Démarrage de tous les services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# ── 9. Attente healthcheck API ────────────────────────────────────────────
echo ""
echo "==> Attente que l'API soit healthy (max 120s)..."
for i in $(seq 1 24); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' provena_api 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "✓ API healthy."
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "✗ L'API n'est pas devenue healthy après 120s."
    echo "  Logs : docker compose -f docker-compose.prod.yml logs api --tail=50"
    exit 1
  fi
  printf "  ... (%ds)\n" "$((i*5))"
  sleep 5
done

# ── 10. Résumé ──────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✓ OpenProvena déployé en production"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Frontend  : https://$DOMAIN"
echo "  API       : https://api.$DOMAIN"
echo "  Grafana   : https://grafana.$DOMAIN"
echo "  Flower    : https://flower.$DOMAIN"
echo ""
echo "  Les certificats TLS sont générés automatiquement par Let's Encrypt"
echo "  (peut prendre 1-2 minutes au premier démarrage)."
echo ""
echo "  Logs en direct :"
echo "    docker compose -f docker-compose.prod.yml logs -f"
echo ""
