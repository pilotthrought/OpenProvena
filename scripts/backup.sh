#!/bin/sh
# OpenProvena — Backup automatique

set -e

# Dossier = parent du dossier scripts/
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$APP_DIR/backups"
LOGS_DIR="$APP_DIR/logs"
TS=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR" "$LOGS_DIR"

DC="docker compose -f $APP_DIR/docker-compose.prod.yml"

echo "[$TS] Backup OpenProvena (APP_DIR=$APP_DIR)..."

# PostgreSQL
docker exec provena_postgres pg_dump -U provena openprovena \
  | gzip > "$BACKUP_DIR/postgres_${TS}.sql.gz"
echo "  ✓ PostgreSQL → postgres_${TS}.sql.gz"

# Secrets chiffrés
tar czf - -C "$APP_DIR" secrets/ 2>/dev/null \
  | openssl enc -aes-256-cbc -pbkdf2 \
      -pass file:"$APP_DIR/secrets/secret_key.txt" \
  > "$BACKUP_DIR/secrets_${TS}.tar.gz.enc"
echo "  ✓ Secrets → secrets_${TS}.tar.gz.enc"

# Nettoyage
find "$BACKUP_DIR" -name "*.gz" -mtime +$KEEP_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.enc" -mtime +$KEEP_DAYS -delete 2>/dev/null || true
echo "  ✓ Nettoyage backups > ${KEEP_DAYS}j"
echo "  Taille : $(du -sh $BACKUP_DIR | cut -f1)"
