#!/bin/bash

# Restore script for Social Network application

set -e

# Configuration
PROJECT_NAME="social-network"
BACKUP_DIR="backups"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    log_error "Please provide backup file or timestamp"
    echo "Usage: $0 <backup_file.tar.gz|timestamp>"
    echo ""
    echo "Available backups:"
    ls -la ${BACKUP_DIR}/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# If only timestamp is provided, add .tar.gz extension
if [[ ! "$BACKUP_FILE" =~ \.tar\.gz$ ]]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}.tar.gz"
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_info "Starting restore process from: $BACKUP_FILE"

# Extract backup
TEMP_DIR=$(mktemp -d)
log_info "Extracting backup to temporary directory..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Get backup directory name
BACKUP_CONTENT_DIR=$(ls "$TEMP_DIR")
FULL_BACKUP_PATH="$TEMP_DIR/$BACKUP_CONTENT_DIR"

# Stop services
log_info "Stopping services..."
docker-compose down

# Restore MongoDB
log_info "Restoring MongoDB..."
docker cp "$FULL_BACKUP_PATH/mongodb" mongo:/tmp/restore
docker exec mongo mongorestore --drop /tmp/restore

# Restore application data
log_info "Restoring application data..."
docker cp "$FULL_BACKUP_PATH/uploads" backend:/app/src/

# Restore configuration
log_info "Restoring configuration files..."
cp "$FULL_BACKUP_PATH/.env" .
cp "$FULL_BACKUP_PATH/docker-compose.yml" .
cp "$FULL_BACKUP_PATH/docker-compose.prod.yml" .

# Start services
log_info "Starting services..."
docker-compose up -d

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 30

# Health checks
log_info "Performing health checks..."
if curl -f http://localhost:5000/api/health; then
    log_success "Backend health check passed"
else
    log_error "Backend health check failed"
    exit 1
fi

if curl -f http://localhost; then
    log_success "Frontend health check passed"
else
    log_error "Frontend health check failed"
    exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Display restore info
if [ -f "$FULL_BACKUP_PATH/backup_info.txt" ]; then
    log_info "Restore information:"
    cat "$FULL_BACKUP_PATH/backup_info.txt"
fi

log_success "Restore completed successfully!"
