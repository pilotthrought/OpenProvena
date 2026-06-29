#!/bin/sh
# OpenProvena — Génération des secrets de production
# Génère des secrets aléatoires forts dans ./secrets/, jamais commités dans git.

set -e

SECRETS_DIR="$(dirname "$0")/../secrets"
mkdir -p "$SECRETS_DIR"

generate() {
  file="$SECRETS_DIR/$1"
  if [ -f "$file" ]; then
    echo "⏭  $1 existe déjà — ignoré (supprimez le fichier pour régénérer)"
    return
  fi
  openssl rand -hex 32 > "$file"
  chmod 600 "$file"
  echo "✓  $1 généré"
}

echo "==> Génération des secrets dans $SECRETS_DIR"
echo ""

generate "secret_key.txt"
generate "postgres_password.txt"
generate "neo4j_password.txt"
generate "rabbitmq_password.txt"
generate "grafana_password.txt"

# htpasswd pour Flower (basic auth) — nécessite l'utilitaire htpasswd
if command -v htpasswd >/dev/null 2>&1; then
  if [ ! -f "$SECRETS_DIR/traefik_htpasswd" ]; then
    echo ""
    echo "==> Configuration de l'accès Flower (basic auth)"
    printf "Nom d'utilisateur Flower [admin]: "
    read -r FLOWER_USER
    FLOWER_USER=${FLOWER_USER:-admin}
    htpasswd -cb "$SECRETS_DIR/traefik_htpasswd" "$FLOWER_USER" "$(openssl rand -hex 16)"
    chmod 600 "$SECRETS_DIR/traefik_htpasswd"
    echo "✓  traefik_htpasswd généré pour l'utilisateur '$FLOWER_USER'"
    echo "   Mot de passe dans : $SECRETS_DIR/traefik_htpasswd (hashé)"
  fi
else
  echo "⚠  htpasswd non trouvé — installez apache2-utils pour protéger Flower"
fi

echo ""
echo "✓ Tous les secrets sont prêts."
echo ""
echo "IMPORTANT :"
echo "  - Le dossier ./secrets/ ne doit JAMAIS être commité dans git"
echo "  - Vérifiez qu'il est bien listé dans .gitignore"
echo "  - Sauvegardez ces fichiers dans un coffre-fort (1Password, Vault, etc.)"
echo "  - La perte de secret_key.txt invalide tous les tokens JWT émis"
