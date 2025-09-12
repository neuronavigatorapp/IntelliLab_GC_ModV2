# IntelliLab GC - Docker Deployment Guide

## 🐳 **Production-Ready Containerization**

This guide covers the complete Docker deployment setup for IntelliLab GC, including development and production environments.

---

## 📋 **Prerequisites**

### **Required Software**
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### **System Requirements**
- **Minimum**: 4GB RAM, 2 CPU cores, 20GB storage
- **Recommended**: 8GB RAM, 4 CPU cores, 50GB storage
- **Production**: 16GB RAM, 8 CPU cores, 100GB storage

---

## 🚀 **Quick Start**

### **1. Clone and Setup**
```bash
# Clone the repository
git clone <repository-url>
cd IntelliLab_GC_ModV2

# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

### **2. Configure Environment**
Edit `.env` file with your settings:
```bash
# Required: AI API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Database
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password

# Security
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
```

### **3. Deploy Application**
```bash
# Development environment
./deploy.sh dev

# Production environment
./deploy.sh prod
```

---

## 🏗️ **Architecture Overview**

### **Container Services**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React PWA)   │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)  │
│   Nginx         │    │   AI Services   │    │   Redis Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Service Details**
- **Frontend**: React PWA with Nginx
- **Backend**: FastAPI with AI services
- **Database**: PostgreSQL with Redis cache
- **Monitoring**: Prometheus + Grafana
- **Proxy**: Nginx with SSL termination

---

## 🔧 **Development Environment**

### **Features**
- Hot reloading for both frontend and backend
- Development database with sample data
- Debug logging enabled
- Local development ports

### **Deployment**
```bash
# Start development environment
./deploy.sh dev

# Access services
Frontend: http://localhost:3001
Backend:  http://localhost:8001
Proxy:    http://localhost:8080
```

### **Development Commands**
```bash
# View logs
./deploy.sh logs dev

# Stop services
./deploy.sh stop dev

# Restart with rebuild
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 🏭 **Production Environment**

### **Features**
- Optimized production builds
- SSL/TLS termination
- Load balancing
- Monitoring and alerting
- Automated backups
- Health checks

### **Deployment**
```bash
# Start production environment
./deploy.sh prod

# Access services
Application: http://localhost
Grafana:    http://localhost:3000
Prometheus: http://localhost:9090
```

### **Production Commands**
```bash
# View logs
./deploy.sh logs prod

# Stop services
./deploy.sh stop prod

# Backup database
./deploy.sh backup prod

# Scale services
docker-compose up -d --scale backend=3
```

---

## 📊 **Monitoring & Observability**

### **Grafana Dashboards**
- **Application Metrics**: Request rates, response times, error rates
- **Database Performance**: Query performance, connection pools
- **System Resources**: CPU, memory, disk usage
- **AI Service Metrics**: API calls, response times, costs

### **Prometheus Metrics**
- **Application**: Custom metrics for GC calculations
- **Infrastructure**: System and container metrics
- **Business**: User activity and feature usage

### **Alerting**
- High error rates
- Service unavailability
- Resource exhaustion
- Database performance issues

---

## 🔒 **Security Features**

### **Container Security**
- Non-root user execution
- Minimal attack surface
- Regular security updates
- Image scanning

### **Network Security**
- Internal service communication
- SSL/TLS encryption
- Rate limiting
- Security headers

### **Data Security**
- Encrypted database connections
- Secure credential management
- Audit logging
- Backup encryption

---

## 📈 **Scaling & Performance**

### **Horizontal Scaling**
```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose up -d --scale backend=5 --scale frontend=2
```

### **Performance Optimization**
- **Caching**: Redis for API responses
- **CDN**: Static asset delivery
- **Database**: Connection pooling
- **Monitoring**: Performance tracking

### **Resource Management**
- **CPU Limits**: Per-service allocation
- **Memory Limits**: Prevent OOM issues
- **Storage**: Optimized volumes
- **Networking**: Bandwidth management

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Service Won't Start**
```bash
# Check logs
./deploy.sh logs prod

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

#### **Database Connection Issues**
```bash
# Check database health
docker-compose exec postgres pg_isready

# Reset database
docker-compose down -v
docker-compose up -d
```

#### **Performance Issues**
```bash
# Check resource usage
docker stats

# Monitor logs
docker-compose logs -f backend

# Check metrics
curl http://localhost:9090/metrics
```

### **Debug Commands**
```bash
# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# View service logs
docker-compose logs backend
docker-compose logs frontend

# Check network connectivity
docker-compose exec backend ping postgres
```

---

## 🔄 **Backup & Recovery**

### **Automated Backups**
```bash
# Manual backup
./deploy.sh backup prod

# Automated backup (cron)
0 2 * * * /path/to/deploy.sh backup prod
```

### **Recovery Process**
```bash
# Stop services
./deploy.sh stop prod

# Restore database
docker-compose exec postgres psql -U intellilab -d intellilab_gc < backup.sql

# Restart services
./deploy.sh prod
```

---

## 📝 **Configuration Files**

### **Docker Compose Files**
- `docker-compose.yml`: Production environment
- `docker-compose.dev.yml`: Development environment

### **Dockerfiles**
- `Dockerfile.backend`: Backend production build
- `Dockerfile.frontend`: Frontend production build
- `Dockerfile.backend.dev`: Backend development
- `Dockerfile.frontend.dev`: Frontend development

### **Nginx Configurations**
- `nginx.conf`: Production nginx config
- `nginx.dev.conf`: Development nginx config

---

## 🎯 **Best Practices**

### **Development**
- Use development environment for testing
- Enable debug logging
- Use hot reloading
- Test with sample data

### **Production**
- Use production environment
- Enable monitoring
- Set up automated backups
- Configure SSL/TLS
- Implement health checks

### **Security**
- Use strong passwords
- Enable SSL/TLS
- Regular security updates
- Monitor access logs
- Implement rate limiting

---

## 📞 **Support**

### **Documentation**
- [API Documentation](http://localhost:8000/docs)
- [Grafana Dashboards](http://localhost:3000)
- [Prometheus Metrics](http://localhost:9090)

### **Logs & Monitoring**
- Application logs: `./deploy.sh logs prod`
- System metrics: Grafana dashboards
- Performance: Prometheus metrics
- Alerts: Email notifications

---

**Status**: ✅ **Docker Containerization Complete**
**Next**: 🎯 **Phase 5.2: User Authentication & Authorization** 