#!/bin/sh
# OpenProvena — Aliases (généré par install.sh, ne pas éditer)
# Usage : . ~/openprovena/scripts/aliases.sh

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
alias dcp="docker compose -f $APP_DIR/docker-compose.prod.yml"
alias dcp-ps="docker compose -f $APP_DIR/docker-compose.prod.yml ps"
alias dcp-logs="docker compose -f $APP_DIR/docker-compose.prod.yml logs -f"
alias dcp-restart="docker compose -f $APP_DIR/docker-compose.prod.yml restart"
alias dcp-down="docker compose -f $APP_DIR/docker-compose.prod.yml down"
echo "✓ Aliases OpenProvena (APP_DIR=$APP_DIR)"
