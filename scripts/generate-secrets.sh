#!/bin/sh
# OpenProvena — Génération des secrets

set -e
SECRETS_DIR="$(dirname "$0")/../secrets"
mkdir -p "$SECRETS_DIR"

generate() {
  file="$SECRETS_DIR/$1"
  if [ -f "$file" ] && [ -s "$file" ]; then
    echo "⏭  $1 existe déjà — conservé"
    return
  fi
  openssl rand -hex 32 > "$file"
  # 644 : lisible par le process dans le container Docker
  # (Docker Compose standalone monte les secrets avec les perms du fichier source)
  chmod 644 "$file"
  echo "✓  $1 généré"
}

echo "==> Génération des secrets..."
generate "secret_key.txt"
generate "postgres_password.txt"
generate "redis_password.txt"
generate "rabbitmq_password.txt"
generate "grafana_password.txt"

# Corriger les permissions si des secrets existants sont en 600
for f in "$SECRETS_DIR"/*.txt; do
  [ -f "$f" ] || continue
  chmod 644 "$f"
done

echo ""
echo "✓ Secrets prêts dans $SECRETS_DIR"
echo "  (permissions 644 pour lecture dans les containers Docker)"
echo ""
echo "IMPORTANT : ne jamais commiter ces fichiers dans git"
