#!/bin/bash
# ============================================
# OpenProvena Backup Script
# Sauvegarde régulière de la base de données
# Usage: ./backup.sh [daily|weekly|monthly]
# ============================================

set -euo pipefail

# === Configuration ===
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
RETENTION_DAYS=30

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# === Fonctions utilitaires ===
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# === Création du répertoire de backup ===
create_backup_dir() {
    local backup_type=$1
    local dir="${BACKUP_DIR}/${backup_type}/${TIMESTAMP}"
    mkdir -p "$dir"
    echo "$dir"
}

# === Backup PostgreSQL ===
backup_postgres() {
    local backup_dir=$1
    local dump_file="${backup_dir}/postgres_dump.sql"
    
    log_info "Démarrage du backup PostgreSQL..."
    
    # Vérifie que le conteneur est accessible
    if docker exec openprovena-postgres pg_isready -U postgres > /dev/null 2>&1; then
        # Dump de la base
        docker exec openprovena-postgres pg_dump -U postgres -d openprovena > "$dump_file"
        
        # Compression
        gzip "$dump_file"
        log_info "Backup PostgreSQL terminé: ${dump_file}.gz"
    else
        log_warn "PostgreSQL n'est pas accessible, skipping..."
    fi
}

# === Backup Neo4j ===
backup_neo4j() {
    local backup_dir=$1
    local dump_file="${backup_dir}/neo4j_backup.tar.gz"
    
    log_info "Démarrage du backup Neo4j..."
    
    # Utilise la commande de backup Neo4j
    if docker exec openprovena-neo4j neo4j stop > /dev/null 2>&1; then
        docker cp openprovena-neo4j:/data/databases "$backup_dir/neo4j_databases" 2>/dev/null || true
        docker cp openprovena-neo4j:/data/logs "$backup_dir/neo4j_logs" 2>/dev/null || true
        
        # Compression
        tar -czf "$dump_file" -C "$backup_dir" neo4j_databases neo4j_logs 2>/dev/null || true
        rm -rf "${backup_dir}/neo4j_databases" "${backup_dir}/neo4j_logs"
        
        log_info "Backup Neo4j terminé: ${dump_file}"
    else
        log_warn "Neo4j n'est pas accessible, skipping..."
    fi
}

# === Backup Redis ===
backup_redis() {
    local backup_dir=$1
    local dump_file="${backup_dir}/redis_dump.rdb"
    
    log_info "Démarrage du backup Redis..."
    
    # Copie le fichier de dump Redis
    docker cp openprovena-redis:/data/dump.rdb "$dump_file" 2>/dev/null || true
    
    if [ -f "$dump_file" ]; then
        gzip "$dump_file"
        log_info "Backup Redis terminé: ${dump_file}.gz"
    else
        log_warn "Redis dump non trouvé, skipping..."
    fi
}

# === Backup Elasticsearch ===
backup_elasticsearch() {
    local backup_dir=$1
    
    log_info "Démarrage du backup Elasticsearch..."
    
    # Création d'un snapshot Elasticsearch
    curl -X PUT "http://localhost:9200/_snapshot/openprovena_backup/${TIMESTAMP}?wait_for_completion=true" \
        -H "Content-Type: application/json" \
        -d '{"type":"fs","settings":{"location":"'"${backup_dir}/elasticsearch"'"}}' \
        > /dev/null 2>&1 || true
    
    log_info "Backup Elasticsearch terminé"
}

# === Nettoyage des vieux backups ===
cleanup_old_backups() {
    local backup_type=$1
    
    log_info "Nettoyage des backups anciens (> ${RETENTION_DAYS} jours)..."
    
    find "${BACKUP_DIR}/${backup_type}" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} + 2>/dev/null || true
    
    log_info "Nettoyage terminé"
}

# === Upload vers stockage externe (optionnel) ===
upload_to_remote() {
    local backup_dir=$1
    local backup_type=$2
    
    # Exemple: Upload vers S3 ou un autre stockage
    # Décommentez et configurez selon vos besoins
    #
    # if [ -n "${AWS_S3_BUCKET:-}" ]; then
    #     log_info "Upload vers S3..."
    #     aws s3 sync "${backup_dir}" "s3://${AWS_S3_BUCKET}/openprovena/${backup_type}/${TIMESTAMP}/"
    # fi
    
    log_info "Upload remote (non configuré)"
}

# === Génération du rapport ===
generate_report() {
    local backup_dir=$1
    local backup_type=$2
    local report_file="${backup_dir}/backup_report.txt"
    
    {
        echo "=== OpenProvena Backup Report ==="
        echo "Date: $(date)"
        echo "Type: ${backup_type}"
        echo ""
        echo "Fichiers backupés:"
        ls -lh "$backup_dir"
        echo ""
        echo "Taille totale: $(du -sh "$backup_dir" | cut -f1)"
    } > "$report_file"
    
    log_info "Rapport généré: ${report_file}"
}

# === Main ===
main() {
    local backup_type=${1:-daily}
    
    log_info "=========================================="
    log_info "OpenProvena Backup - ${backup_type}"
    log_info "=========================================="
    
    # Vérifie que Docker est accessible
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker n'est pas accessible. Assurez-vous que les conteneurs sont en cours d'exécution."
        exit 1
    fi
    
    # Crée le répertoire de backup
    local backup_dir
    backup_dir=$(create_backup_dir "$backup_type")
    
    # Effectue les backups
    backup_postgres "$backup_dir"
    backup_neo4j "$backup_dir"
    backup_redis "$backup_dir"
    backup_elasticsearch "$backup_dir"
    
    # Génère le rapport
    generate_report "$backup_dir" "$backup_type"
    
    # Nettoie les vieux backups
    cleanup_old_backups "$backup_type"
    
    # Upload vers remote (si configuré)
    upload_to_remote "$backup_dir" "$backup_type"
    
    log_info "=========================================="
    log_info "Backup terminé avec succès!"
    log_info "Fichiers: ${backup_dir}"
    log_info "=========================================="
}

# Exécution
main "$@"
