#!/bin/bash
# OpenProvena — Installation production
# openprovena.org | Debian 12 | Docker
#
# Usage (depuis le dossier décompressé) :
#   bash install.sh
#
# Le site s'installe dans le dossier courant.

set -euo pipefail

# ── Dossier d'installation = dossier où se trouve ce script ──────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE="docker compose -f $APP_DIR/docker-compose.prod.yml"
DOMAIN="openprovena.org"
EMAIL="pilotsheets@proton.me"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }
info() { echo -e "${BLUE}[→]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         OpenProvena — Installation Production            ║"
echo "║                  openprovena.org                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
info "Dossier d'installation : $APP_DIR"
echo ""

# ── Vérifications ─────────────────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || err "Lancer en root : sudo bash install.sh"
[ -f "$APP_DIR/docker-compose.prod.yml" ] || \
  err "docker-compose.prod.yml introuvable dans $APP_DIR"

. /etc/os-release 2>/dev/null
[ "$ID" = "debian" ] || [ "$ID" = "ubuntu" ] || \
  warn "OS non testé ($ID) — conçu pour Debian/Ubuntu"

info "Vérification des ports 80 et 443..."
ss -tlnp | grep -qE ':80\s|:443\s' && \
  warn "Les ports 80/443 sont occupés — libérez-les avant de continuer" || true

# ── 1. Système ────────────────────────────────────────────────────────────────
info "Mise à jour système..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip openssl ufw fail2ban \
  ca-certificates gnupg lsb-release
log "Système mis à jour"

# ── 2. Pare-feu ───────────────────────────────────────────────────────────────
info "Configuration UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw --force enable
log "UFW : SSH, HTTP, HTTPS uniquement"

# ── 3. fail2ban ───────────────────────────────────────────────────────────────
info "Configuration fail2ban..."
cat > /etc/fail2ban/jail.local << 'F2B'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
backend  = systemd

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s

[nginx-limit-req]
enabled  = true
filter   = nginx-limit-req
logpath  = /var/log/nginx/error.log
maxretry = 10
F2B
systemctl enable fail2ban --quiet
systemctl restart fail2ban
log "fail2ban activé"

# ── 4. Docker ─────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Installation Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) \
    signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker --quiet
  systemctl start docker
  log "Docker installé"
else
  log "Docker déjà installé"
fi

# ── 5. Secrets ────────────────────────────────────────────────────────────────
info "Génération des secrets..."
mkdir -p "$APP_DIR/secrets"
for secret in secret_key postgres_password redis_password rabbitmq_password; do
  f="$APP_DIR/secrets/${secret}.txt"
  if [ ! -f "$f" ] || [ ! -s "$f" ]; then
    openssl rand -hex 32 > "$f"
    # 644 : lisible par les process dans les containers Docker
    chmod 644 "$f"
    log "  secrets/${secret}.txt généré"
  else
    chmod 644 "$f"   # corriger si ancienne install avait 600
    warn "  secrets/${secret}.txt existant — conservé"
  fi
done

# ── 6. Certificat temporaire (pour démarrer Nginx avant Let's Encrypt) ────────
info "Certificat TLS temporaire..."
mkdir -p /etc/letsencrypt/live/$DOMAIN
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out    /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj   "/CN=$DOMAIN" 2>/dev/null
  log "Certificat temporaire créé"
fi

if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  curl -fsSLo /etc/letsencrypt/options-ssl-nginx.conf \
    https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/_internal/tls_configs/options-ssl-nginx.conf \
    2>/dev/null || \
  cat > /etc/letsencrypt/options-ssl-nginx.conf << 'SSLCONF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384";
SSLCONF
fi

if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  info "Génération DH params (1-2 min)..."
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048 2>/dev/null
  log "DH params générés"
fi

# Pré-peupler le volume certbot avec les fichiers de l'hôte
docker volume create provena_certbot_conf >/dev/null 2>&1 || true
docker run --rm \
  -v /etc/letsencrypt:/src:ro \
  -v provena_certbot_conf:/dst \
  alpine sh -c "cp -r /src/. /dst/" 2>/dev/null || true

# ── 7. Build et démarrage ─────────────────────────────────────────────────────
info "Build des images Docker..."
cd "$APP_DIR"
$COMPOSE build --no-cache 2>&1 | grep -E "^#|ERROR|error" || true

info "Démarrage des bases de données..."
$COMPOSE up -d postgres redis rabbitmq
sleep 20

info "Démarrage complet..."
$COMPOSE up -d
sleep 15

# ── 8. Let's Encrypt ──────────────────────────────────────────────────────────
info "Obtention certificat Let's Encrypt..."
docker run --rm \
  -v provena_certbot_conf:/etc/letsencrypt \
  -v provena_certbot_www:/var/www/certbot \
  certbot/certbot certonly \
    --webroot --webroot-path /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "api.$DOMAIN" \
    --force-renewal 2>&1 | tail -5 && \
  log "Certificat Let's Encrypt obtenu" || \
  warn "Let's Encrypt échoué — le site tourne avec le certificat temporaire"

$COMPOSE exec nginx nginx -s reload 2>/dev/null || true

# ── 9. Cron ───────────────────────────────────────────────────────────────────
info "Configuration cron..."
cat > /etc/cron.d/openprovena << CRON
# Backup quotidien 3h
0 3 * * * $(whoami) $APP_DIR/scripts/backup.sh >> $APP_DIR/logs/backup.log 2>&1
# Reload Nginx après renouvellement TLS
0 4 * * * $(whoami) $COMPOSE exec nginx nginx -s reload >> $APP_DIR/logs/tls.log 2>&1
CRON
chmod 644 /etc/cron.d/openprovena
mkdir -p "$APP_DIR/logs"
log "Cron configuré"

# ── 10. Aliases ───────────────────────────────────────────────────────────────
ALIAS_FILE="$APP_DIR/scripts/aliases.sh"
cat > "$ALIAS_FILE" << ALIAS
#!/bin/sh
# Aliases OpenProvena — source ce fichier pour les activer
# Ajouter dans ~/.bashrc : . $ALIAS_FILE
APP_DIR="$APP_DIR"
alias dcp='docker compose -f \$APP_DIR/docker-compose.prod.yml'
alias dcp-ps='docker compose -f \$APP_DIR/docker-compose.prod.yml ps'
alias dcp-logs='docker compose -f \$APP_DIR/docker-compose.prod.yml logs -f'
alias dcp-restart='docker compose -f \$APP_DIR/docker-compose.prod.yml restart'
alias dcp-down='docker compose -f \$APP_DIR/docker-compose.prod.yml down'
echo "✓ Aliases OpenProvena chargés (APP_DIR=\$APP_DIR)"
ALIAS
chmod +x "$ALIAS_FILE"

# Ajouter au .bashrc de l'utilisateur qui a lancé sudo
SUDO_USER="${SUDO_USER:-root}"
BASHRC="/home/$SUDO_USER/.bashrc"
[ "$SUDO_USER" = "root" ] && BASHRC="/root/.bashrc"
if [ -f "$BASHRC" ] && ! grep -q "aliases.sh" "$BASHRC"; then
  echo ". $ALIAS_FILE" >> "$BASHRC"
  log "Aliases ajoutés dans $BASHRC"
fi

# ── 11. Résumé ────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║             ✓ OpenProvena installé                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
printf "║  Dossier  : %-44s║\n" "$APP_DIR"
echo "║  Site     : https://openprovena.org                     ║"
echo "║  API      : https://api.openprovena.org/health          ║"
echo "║  Contact  : pilotsheets@proton.me                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Commandes (recharger le shell d'abord) :               ║"
echo "║    dcp ps            # état des containers              ║"
echo "║    dcp logs -f api   # logs API                         ║"
echo "║    dcp restart api   # redémarrer l'API                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Rechargez le shell : source ~/.bashrc"
echo ""
