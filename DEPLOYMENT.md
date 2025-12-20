# Deployment Guide - Marie Chat

This guide explains how to deploy Marie Chat to production.

## Prerequisites

- Docker and Docker Compose installed
- OpenSearch running (or accessible)
- Ollama server running (optional, for LLM)
- Node.js 20+ (for local frontend build)
- Python 3.12+ (for local backend)

## Quick Start with Docker Compose

1. **Clone and setup:**
```bash
git clone <repository-url>
cd marie_chat
cp .env.example .env
# Edit .env with your configuration
```

2. **Configure environment variables:**
Edit `.env` file with your settings:
- OpenSearch credentials
- JWT secret key (use a strong random key in production)
- Ollama URL if using external instance

3. **Start services:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

4. **Initialize OpenSearch indices:**
```bash
docker-compose exec backend python scripts/init_opensearch.py
```

5. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- OpenSearch: https://localhost:9200
- OpenSearch Dashboards: http://localhost:5601

## Production Deployment

### 1. Environment Variables

Create a `.env` file with production values:

```bash
# Application
FLASK_ENV=production
FLASK_DEBUG=false
FLASK_SECRET_KEY=<strong-random-key>
JWT_SECRET_KEY=<strong-random-key>

# OpenSearch
OPENSEARCH_HOSTS=https://your-opensearch:9200
OPENSEARCH_USER=admin
OPENSEARCH_PASSWORD=<secure-password>
OPENSEARCH_USE_SSL=true
OPENSEARCH_VERIFY_CERTS=true

# Ollama
OLLAMA_BASE_URL=http://your-ollama:11434

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# CORS
CORS_ORIGINS=https://yourdomain.com
```

### 2. Build Production Images

```bash
# Build frontend
cd frontend
npm run build

# Build backend (if using Docker)
docker build -f ../docker/Dockerfile.backend -t marie-chat-backend .
docker build -f ../docker/Dockerfile.frontend -t marie-chat-frontend .
```

### 3. Run with Docker Compose

Update `docker-compose.yml` for production and run:

```bash
docker-compose up -d
```

### 4. Initialize Database

```bash
docker-compose exec backend python scripts/init_opensearch.py
```

### 5. Create Admin User

You can create an admin user via the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure-password",
    "full_name": "Admin User"
  }'
```

Then update the user role to admin via OpenSearch or add an admin creation script.

## Architecture

```
┌─────────────┐
│   Client    │ → Frontend (Next.js) on port 3000
└──────┬──────┘
       │ HTTP/WebSocket
       ↓
┌─────────────┐
│   Backend   │ → Flask API on port 5000
└──────┬──────┘
       │
       ├─→ OpenSearch (port 9200)
       └─→ Ollama (port 11434)
```

## Health Checks

- Backend health: `GET http://localhost:5000/api/health`
- OpenSearch: `curl -k https://localhost:9200/_cluster/health`

## Troubleshooting

### OpenSearch Connection Issues

- Check SSL certificates if using HTTPS
- Verify credentials in `.env`
- Check network connectivity

### WebSocket Connection Issues

- Ensure CORS is configured correctly
- Check that WebSocket port is accessible
- Verify JWT token is valid

### Ollama Not Responding

- Check if Ollama service is running
- Verify OLLAMA_BASE_URL is correct
- Check network connectivity

## Security Checklist

- [ ] Use strong JWT secret keys
- [ ] Enable SSL/TLS for all services
- [ ] Set CORS_ORIGINS to your domain only
- [ ] Use secure passwords for OpenSearch
- [ ] Keep dependencies updated
- [ ] Configure firewall rules
- [ ] Enable rate limiting (TODO)
- [ ] Set up monitoring and logging

## Next Steps

- Set up reverse proxy (Nginx/Traefik)
- Configure SSL certificates (Let's Encrypt)
- Set up monitoring (Prometheus, Grafana)
- Configure backups for OpenSearch
- Set up CI/CD pipeline
- Add rate limiting
- Configure logging aggregation

