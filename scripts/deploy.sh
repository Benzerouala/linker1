#!/bin/bash

# Social Network Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="social-network"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f ".env" ]; then
        log_warning ".env file not found, copying from .env.example"
        cp .env.example .env
        log_warning "Please update .env file with your configuration"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

setup_environment() {
    log_info "Setting up environment..."
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p nginx/ssl
    mkdir -p backups
    
    # Set proper permissions
    chmod +x scripts/*.sh
    
    # Create SSL certificates for development (self-signed)
    if [ ! -f "nginx/ssl/cert.pem" ]; then
        log_info "Creating self-signed SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=MA/ST=Rabat/L=Rabat/O=JobInTech/OU=IT/CN=localhost"
    fi
    
    log_success "Environment setup completed"
}

build_images() {
    log_info "Building Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t ${PROJECT_NAME}/backend:latest ${BACKEND_DIR}
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -t ${PROJECT_NAME}/frontend:latest ${FRONTEND_DIR}
    
    log_success "Docker images built successfully"
}

run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    log_info "Running backend tests..."
    cd ${BACKEND_DIR}
    npm ci
    npm run test || log_warning "Backend tests failed"
    cd ..
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd ${FRONTEND_DIR}
    npm ci
    npm run test || log_warning "Frontend tests failed"
    cd ..
    
    log_success "Tests completed"
}

deploy_development() {
    log_info "Deploying to development environment..."
    
    # Stop existing containers
    docker-compose down
    
    # Build and start services
    docker-compose up -d --build
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health checks
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
    
    log_success "Development deployment completed"
}

deploy_production() {
    log_info "Deploying to production environment..."
    
    # Backup current deployment
    log_info "Creating backup..."
    ./scripts/backup.sh
    
    # Stop existing containers
    docker-compose -f ${PROD_COMPOSE_FILE} down
    
    # Pull latest images
    docker pull ${PROJECT_NAME}/backend:latest
    docker pull ${PROJECT_NAME}/frontend:latest
    
    # Deploy production
    docker-compose -f ${PROD_COMPOSE_FILE} up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 60
    
    # Health checks
    if curl -f ${PROD_URL}/api/health; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        log_error "Rolling back..."
        rollback
        exit 1
    fi
    
    if curl -f ${PROD_URL}; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        log_error "Rolling back..."
        rollback
        exit 1
    fi
    
    log_success "Production deployment completed"
}

rollback() {
    log_info "Rolling back to previous version..."
    
    # Restore from backup
    ./scripts/restore.sh
    
    # Restart with backup images
    docker-compose -f ${PROD_COMPOSE_FILE} down
    docker-compose -f ${PROD_COMPOSE_FILE} up -d
    
    log_success "Rollback completed"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Clean up old logs
    find logs -name "*.log" -mtime +30 -delete
    
    log_success "Cleanup completed"
}

show_logs() {
    log_info "Showing logs..."
    
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f $1
    fi
}

show_status() {
    log_info "Showing service status..."
    
    docker-compose ps
    
    # Show resource usage
    log_info "Resource usage:"
    docker stats --no-stream
}

backup_data() {
    log_info "Backing up data..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="backups/${TIMESTAMP}"
    
    mkdir -p ${BACKUP_DIR}
    
    # Backup MongoDB
    docker exec mongo mongodump --out /tmp/backup
    docker cp mongo:/tmp/backup ${BACKUP_DIR}/mongodb
    
    # Backup uploads
    docker cp backend:/app/src/uploads ${BACKUP_DIR}/uploads
    
    # Backup configuration
    cp .env ${BACKUP_DIR}/
    cp docker-compose.yml ${BACKUP_DIR}/
    
    log_success "Backup completed: ${BACKUP_DIR}"
}

restore_data() {
    log_info "Restoring data..."
    
    if [ -z "$1" ]; then
        log_error "Please specify backup directory"
        exit 1
    fi
    
    BACKUP_DIR="backups/$1"
    
    if [ ! -d "${BACKUP_DIR}" ]; then
        log_error "Backup directory not found: ${BACKUP_DIR}"
        exit 1
    fi
    
    # Restore MongoDB
    docker cp ${BACKUP_DIR}/mongodb mongo:/tmp/restore
    docker exec mongo mongorestore /tmp/restore
    
    # Restore uploads
    docker cp ${BACKUP_DIR}/uploads backend:/app/src/
    
    log_success "Restore completed"
}

update_dependencies() {
    log_info "Updating dependencies..."
    
    # Update backend dependencies
    cd ${BACKEND_DIR}
    npm update
    cd ..
    
    # Update frontend dependencies
    cd ${FRONTEND_DIR}
    npm update
    cd ..
    
    log_success "Dependencies updated"
}

security_scan() {
    log_info "Running security scan..."
    
    # Scan backend for vulnerabilities
    cd ${BACKEND_DIR}
    npm audit
    cd ..
    
    # Scan frontend for vulnerabilities
    cd ${FRONTEND_DIR}
    npm audit
    cd ..
    
    # Scan Docker images
    docker scan ${PROJECT_NAME}/backend:latest
    docker scan ${PROJECT_NAME}/frontend:latest
    
    log_success "Security scan completed"
}

# Main script logic
case "$1" in
    "setup")
        check_prerequisites
        setup_environment
        ;;
    "build")
        check_prerequisites
        build_images
        ;;
    "test")
        check_prerequisites
        run_tests
        ;;
    "deploy-dev")
        check_prerequisites
        deploy_development
        ;;
    "deploy-prod")
        check_prerequisites
        deploy_production
        ;;
    "rollback")
        rollback
        ;;
    "cleanup")
        cleanup
        ;;
    "logs")
        show_logs $2
        ;;
    "status")
        show_status
        ;;
    "backup")
        backup_data
        ;;
    "restore")
        restore_data $2
        ;;
    "update")
        update_dependencies
        ;;
    "security")
        security_scan
        ;;
    "all")
        check_prerequisites
        setup_environment
        run_tests
        build_images
        deploy_development
        ;;
    *)
        echo "Usage: $0 {setup|build|test|deploy-dev|deploy-prod|rollback|cleanup|logs|status|backup|restore|update|security|all}"
        echo ""
        echo "Commands:"
        echo "  setup        - Setup environment and prerequisites"
        echo "  build        - Build Docker images"
        echo "  test         - Run tests"
        echo "  deploy-dev   - Deploy to development environment"
        echo "  deploy-prod  - Deploy to production environment"
        echo "  rollback     - Rollback to previous version"
        echo "  cleanup      - Clean up unused resources"
        echo "  logs [service] - Show logs for all or specific service"
        echo "  status       - Show service status"
        echo "  backup       - Backup data"
        echo "  restore [dir] - Restore data from backup"
        echo "  update       - Update dependencies"
        echo "  security     - Run security scan"
        echo "  all          - Run complete setup and deployment"
        exit 1
        ;;
esac

log_success "Script completed successfully!"
