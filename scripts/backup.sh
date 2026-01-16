#!/bin/bash

# Backup script for Social Network application

set -e

# Configuration
PROJECT_NAME="social-network"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CURRENT_BACKUP_DIR="${BACKUP_DIR}/${TIMESTAMP}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Create backup directory
mkdir -p ${CURRENT_BACKUP_DIR}

log_info "Starting backup process..."

# Backup MongoDB
log_info "Backing up MongoDB..."
docker exec mongo mongodump --out /tmp/backup
docker cp mongo:/tmp/backup ${CURRENT_BACKUP_DIR}/mongodb

# Backup application data
log_info "Backing up application data..."
docker cp backend:/app/src/uploads ${CURRENT_BACKUP_DIR}/uploads

# Backup configuration files
log_info "Backing up configuration..."
cp .env ${CURRENT_BACKUP_DIR}/
cp docker-compose.yml ${CURRENT_BACKUP_DIR}/
cp docker-compose.prod.yml ${CURRENT_BACKUP_DIR}/

# Create backup info file
cat > ${CURRENT_BACKUP_DIR}/backup_info.txt << EOF
Backup created: $(date)
Project: ${PROJECT_NAME}
Git commit: $(git rev-parse HEAD)
Git branch: $(git branch --show-current)
Docker images:
- Backend: $(docker images -q ${PROJECT_NAME}/backend:latest)
- Frontend: $(docker images -q ${PROJECT_NAME}/frontend:latest)
EOF

# Compress backup
log_info "Compressing backup..."
cd ${BACKUP_DIR}
tar -czf ${TIMESTAMP}.tar.gz ${TIMESTAMP}
rm -rf ${TIMESTAMP}
cd ..

# Keep only last 7 days of backups
log_info "Cleaning old backups..."
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete

log_success "Backup completed: ${BACKUP_DIR}/${TIMESTAMP}.tar.gz"
