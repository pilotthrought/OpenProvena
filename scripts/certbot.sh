#!/bin/bash
# OpenProvena — Génération/Renouvellement certificats Let's Encrypt
# Usage: ./scripts/certbot.sh [commande]
#   commande: certonly | renew | status | help

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

DC="docker compose -f docker-compose.prod.yml"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [commande]"
    echo ""
    echo "Commandes disponibles:"
    echo "  certonly   Générer de nouveaux certificats Let's Encrypt"
    echo "  renew      Renouveler les certificats existants"
    echo "  status     Vérifier l'état des certificats"
    echo "  help       Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 certonly          # Générer les certificats"
    echo "  $0 renew             # Renouveler les certificats"
    echo "  $0 status            # Voir l'état des certificats"
}

check_prerequisites() {
    echo -e "${YELLOW}=== Vérification des prérequis ===${NC}"

    # Vérifier que docker est disponible
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker n'est pas installé${NC}"
        exit 1
    fi

    # Vérifier que les volumes sont montés
    if [ ! -d "secrets/letsencrypt" ]; then
        echo -e "${RED}✗ Répertoire secrets/letsencrypt introuvable${NC}"
        exit 1
    fi

    # Vérifier le DNS (résolution)
    echo "Vérification DNS pour openprovena.org..."
    if host openprovena.org &> /dev/null || nslookup openprovena.org &> /dev/null || dig +short openprovena.org &> /dev/null; then
        echo -e "${GREEN}✓ DNS configuré${NC}"
    else
        echo -e "${RED}✗ Vérification DNS échouée — vérifiez que openprovena.org pointe vers ce serveur${NC}"
        echo "  IP attendue: $(curl -s ifconfig.me 2>/dev/null || echo 'inconnue')"
    fi

    echo ""
}

cert_status() {
    echo -e "${YELLOW}=== État des certificats ===${NC}"

    CERT_DIR="secrets/letsencrypt/live/openprovena.org"

    if [ -f "$CERT_DIR/fullchain.pem" ]; then
        echo -e "${GREEN}✓ Certificat trouvé${NC}"

        # Date d'expiration
        EXPIRY=$(openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
        echo "  Expire le: $EXPIRY"

        # Jours restants
        EXPIRY_DATE=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null)
        NOW=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_DATE - NOW) / 86400 ))

        if [ "$DAYS_LEFT" -lt 0 ]; then
            echo -e "${RED}  ⚠ Certificat expiré depuis $((DAYS_LEFT * -1)) jour(s)${NC}"
        elif [ "$DAYS_LEFT" -lt 30 ]; then
            echo -e "${YELLOW}  ⚠ Expiration dans $DAYS_LEFT jour(s)${NC}"
        else
            echo -e "${GREEN}  ✓ Expiration dans $DAYS_LEFT jour(s)${NC}"
        fi

        # Vérifier si auto-signé
        ISSUER=$(openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -issuer 2>/dev/null)
        if echo "$ISSUER" | grep -q "issuer=Self-Signed\|CN=openprovena.org"; then
            echo -e "${YELLOW}  ⚠ Certificat auto-signé (non valide par les navigateurs)${NC}"
        elif echo "$ISSUER" | grep -q "Let's Encrypt"; then
            echo -e "${GREEN}  ✓ Certificat Let's Encrypt valide${NC}"
        fi
    else
        echo -e "${RED}✗ Aucun certificat trouvé${NC}"
        echo "  Lancez: $0 certonly"
    fi

    echo ""
}

certonly() {
    check_prerequisites

    echo -e "${YELLOW}=== Génération des certificats Let's Encrypt ===${NC}"
    echo ""
    echo "Cette opération va:"
    echo "  1. Arrêter nginx (si actif)"
    echo "  2. Vérifier que le port 80 est accessible"
    echo "  3. Générer les certificats"
    echo "  4. Redémarrer nginx"
    echo ""

    read -p "Continuer? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Annulé."
        exit 0
    fi

    # Vérifier le port 80
    echo ""
    echo "Vérification du port 80..."
    if command -v nc &> /dev/null; then
        if nc -z localhost 80 2>/dev/null; then
            echo "Le port 80 est occupé. Arrêt des services..."
            $DC stop nginx certbot 2>/dev/null || true
        fi
    fi

    # Pause pour laisser nginx s'arrêter
    sleep 2

    echo ""
    echo -e "${YELLOW}Génération des certificats...${NC}"
    echo ""

    # Générer les certificats
    $DC run --rm \
        -v "$(pwd)/secrets/letsencrypt:/etc/letsencrypt" \
        -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro" \
        certbot certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d openprovena.org \
        -d api.openprovena.org \
        --email "${ACME_EMAIL:-admin@openprovena.org}" \
        --agree-tos \
        --non-interactive \
        --force-renewal

    # Vérifier le résultat
    if [ -f "secrets/letsencrypt/live/openprovena.org/fullchain.pem" ]; then
        echo ""
        echo -e "${GREEN}✓ Certificats générés avec succès!${NC}"
        cert_status

        echo "Redémarrage de nginx..."
        $DC up -d nginx

        echo ""
        echo -e "${GREEN}=== Terminé ===${NC}"
        echo "Votre site est maintenant accessible en HTTPS avec un vrai certificat!"
    else
        echo ""
        echo -e "${RED}✗ Échec de la génération des certificats${NC}"
        echo ""
        echo "Causes possibles:"
        echo "  - Le port 80 n'est pas accessible depuis Internet"
        echo "  - Le DNS de openprovena.org ne pointe pas vers ce serveur"
        echo "  - Un firewall bloque le port 80"
        echo ""
        echo "Vérifiez avec: curl -s http://openprovena.org/.well-known/acme-challenge/test"
        exit 1
    fi
}

renew() {
    echo -e "${YELLOW}=== Renouvellement des certificats ===${NC}"
    echo ""

    # Le conteneur certbot tourne déjà en boucle avec sleep 12h
    # On peut aussi forcer un renouvellement manuel

    echo "Lancement du renouvellement manuel..."
    $DC run --rm \
        -v "$(pwd)/secrets/letsencrypt:/etc/letsencrypt" \
        certbot renew \
        --webroot \
        -w /var/www/certbot \
        --quiet

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Certificats renouvelés avec succès${NC}"

        # Recharger nginx
        echo "Rechargement de nginx..."
        $DC exec nginx nginx -s reload

        cert_status
    else
        echo -e "${YELLOW}Aucun certificat à renouveler (pas encore expirés)${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

COMMAND="${1:-help}"

case "$COMMAND" in
    certonly)
        certonly
        ;;
    renew)
        renew
        ;;
    status)
        cert_status
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Commande inconnue: $COMMAND${NC}"
        echo ""
        usage
        exit 1
        ;;
esac
