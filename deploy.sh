#!/bin/bash

# IntelliLab GC Deployment Script
# Usage: ./deploy.sh [dev|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is specified
if [ $# -eq 0 ]; then
    print_error "Please specify environment: dev or prod"
    echo "Usage: ./deploy.sh [dev|prod]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    print_error "Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

print_status "Starting IntelliLab GC deployment for $ENVIRONMENT environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp env.example .env
    print_warning "Please update .env file with your configuration before continuing."
    exit 1
fi

# Load environment variables
source .env

# Function to check service health
check_service_health() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Checking $service health..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.yml ps $service | grep -q "Up"; then
            print_status "$service is healthy"
            return 0
        fi
        
        print_status "Waiting for $service... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to start"
    return 1
}

# Function to deploy development environment
deploy_dev() {
    print_status "Deploying development environment..."
    
    # Stop existing containers
    docker-compose -f docker-compose.dev.yml down
    
    # Build and start services
    docker-compose -f docker-compose.dev.yml up -d --build
    
    # Check service health
    check_service_health "postgres-dev" || exit 1
    check_service_health "redis-dev" || exit 1
    check_service_health "backend-dev" || exit 1
    check_service_health "frontend-dev" || exit 1
    
    print_status "Development environment deployed successfully!"
    print_status "Access the application at: http://localhost:8080"
    print_status "Backend API at: http://localhost:8001"
    print_status "Frontend dev server at: http://localhost:3001"
}

# Function to deploy production environment
deploy_prod() {
    print_status "Deploying production environment..."
    
    # Stop existing containers
    docker-compose down
    
    # Build and start services
    docker-compose up -d --build
    
    # Check service health
    check_service_health "postgres" || exit 1
    check_service_health "redis" || exit 1
    check_service_health "backend" || exit 1
    check_service_health "frontend" || exit 1
    
    print_status "Production environment deployed successfully!"
    print_status "Access the application at: http://localhost"
    print_status "Monitoring dashboard at: http://localhost:3000 (Grafana)"
    print_status "Metrics at: http://localhost:9090 (Prometheus)"
}

# Function to show logs
show_logs() {
    print_status "Showing logs for $ENVIRONMENT environment..."
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose logs -f
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping $ENVIRONMENT services..."
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml down
    else
        docker-compose down
    fi
    
    print_status "Services stopped"
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    
    BACKUP_DIR="./backups"
    BACKUP_FILE="intellilab_gc_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p $BACKUP_DIR
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml exec -T postgres-dev pg_dump -U intellilab intellilab_gc_dev > "$BACKUP_DIR/$BACKUP_FILE"
    else
        docker-compose exec -T postgres pg_dump -U intellilab intellilab_gc > "$BACKUP_DIR/$BACKUP_FILE"
    fi
    
    print_status "Backup created: $BACKUP_DIR/$BACKUP_FILE"
}

# Main deployment logic
case $ENVIRONMENT in
    "dev")
        deploy_dev
        ;;
    "prod")
        deploy_prod
        ;;
esac

# Show deployment status
print_status "Deployment completed successfully!"
print_status "To view logs: ./deploy.sh logs $ENVIRONMENT"
print_status "To stop services: ./deploy.sh stop $ENVIRONMENT"
print_status "To backup database: ./deploy.sh backup $ENVIRONMENT"

# Handle additional commands
if [ $# -gt 1 ]; then
    case $2 in
        "logs")
            show_logs
            ;;
        "stop")
            stop_services
            ;;
        "backup")
            backup_database
            ;;
        *)
            print_error "Unknown command: $2"
            echo "Available commands: logs, stop, backup"
            exit 1
            ;;
    esac
fi 