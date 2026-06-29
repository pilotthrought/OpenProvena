#!/bin/sh
# OpenProvena — Backup automatisé
# À planifier via cron : 0 3 * * * /path/to/openprovena/scripts/backup.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "==> Backup OpenProvena — $TIMESTAMP"

# ── PostgreSQL ────────────────────────────────────────────────────────────
echo "==> Dump PostgreSQL..."
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_dump -U provena openprovena | gzip > "$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"
echo "✓ PostgreSQL : $BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"

# ── Neo4j ─────────────────────────────────────────────────────────────────
echo "==> Dump Neo4j..."
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T neo4j \
  neo4j-admin database dump neo4j --to-stdout > "$BACKUP_DIR/neo4j_${TIMESTAMP}.dump" 2>/dev/null \
  || echo "⚠  Neo4j dump échoué (non bloquant)"

# ── Secrets (chiffré) ─────────────────────────────────────────────────────
echo "==> Archive des secrets..."
tar czf - secrets/ | gpg --symmetric --cipher-algo AES256 --batch --passphrase-file secrets/secret_key.txt \
  > "$BACKUP_DIR/secrets_${TIMESTAMP}.tar.gz.gpg" 2>/dev/null \
  || echo "⚠  Chiffrement des secrets échoué (gpg requis) — backup secrets ignoré"

# ── Nettoyage des anciens backups ─────────────────────────────────────────
echo "==> Nettoyage des backups de plus de ${RETENTION_DAYS} jours..."
find "$BACKUP_DIR" -name "*.gz" -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "*.dump" -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "*.gpg" -mtime +${RETENTION_DAYS} -delete

echo ""
echo "✓ Backup terminé : $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -5

echo ""
echo "RECOMMANDATION : synchronisez $BACKUP_DIR vers un stockage hors-site"
echo "  (S3, Backblaze B2, etc.) — un backup local seul ne protège pas"
echo "  contre la perte du serveur."
