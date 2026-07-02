#!/bin/sh
# Aliases OpenProvena — source ce fichier pour les activer
# Ajouter dans ~/.bashrc : . /home/debian/openprovena-main/scripts/aliases.sh
APP_DIR="/home/debian/openprovena-main"
alias dcp='docker compose -f $APP_DIR/docker-compose.prod.yml'
alias dcp-ps='docker compose -f $APP_DIR/docker-compose.prod.yml ps'
alias dcp-logs='docker compose -f $APP_DIR/docker-compose.prod.yml logs -f'
alias dcp-restart='docker compose -f $APP_DIR/docker-compose.prod.yml restart'
alias dcp-down='docker compose -f $APP_DIR/docker-compose.prod.yml down'
echo "✓ Aliases OpenProvena chargés (APP_DIR=$APP_DIR)"
