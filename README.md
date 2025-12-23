<p align="center">
  <img src="imgs/marie_logo.png" alt="MARIE Logo" width="200">
</p>

# MARIE - Development Quick Start
> **Machine-Assisted Research Intelligent Environment (MARIE)**

## Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available for containers
- Ports 3000, 5000, 9200, 5601, 11434 available

## Tech Stack (v2.0)
- **Frontend:** Next.js 16.1.1, React 19.2.3, Ant Design 6.x, Ant Design X 2.1.1
- **Backend:** Flask 3.x, Python 3.12
- **Database:** OpenSearch 2.11
- **AI:** Ollama, HuggingFace, Faster-Whisper, Edge-TTS

## Quick Start

1. **Clone and navigate to the project**
```bash
cd marie_chat
```

2. **Start all services**
```bash
docker-compose up -d
```

This will start:
- Frontend (Next.js) on http://localhost:3000
- Backend (Flask) on http://localhost:5000
- OpenSearch on https://localhost:9200
- OpenSearch Dashboards on http://localhost:5601
- Ollama on http://localhost:11434

3. **Wait for services to be ready**
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

4. **Initialize Ollama models (optional)**
```bash
docker exec -it marie-ollama ollama pull llama3.2
docker exec -it marie-ollama ollama pull codellama
docker exec -it marie-ollama ollama pull mistral
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- OpenSearch Dashboards: http://localhost:5601

## Development Without Docker

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Run backend
python run.py
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your settings
nano .env.local

# Run frontend
npm run dev
```

### OpenSearch Setup (Manual)
You still need OpenSearch running. Either:
- Use Docker: `docker-compose up -d opensearch opensearch-dashboards`
- Or install OpenSearch locally from https://opensearch.org/downloads.html

## Environment Variables

### Backend (.env)
```
FLASK_ENV=development
OPENSEARCH_HOSTS=https://localhost:9200
OPENSEARCH_USER=admin
OPENSEARCH_PASSWORD=Marie_Chat_2024!
JWT_SECRET_KEY=your-secret-key
OLLAMA_BASE_URL=http://localhost:11434
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

## Testing Authentication

1. **Register a new user**
   - Go to http://localhost:3000/register
   - Fill in the form
   - Submit

2. **Login**
   - Go to http://localhost:3000/login
   - Use your credentials
   - You'll be redirected to /chat

## Troubleshooting

### OpenSearch connection issues
```bash
# Check if OpenSearch is running
curl -k -u admin:Marie_Chat_2024! https://localhost:9200

# Check OpenSearch logs
docker-compose logs opensearch
```

### Port conflicts
If ports are already in use, edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change frontend port
  - "5001:5000"  # Change backend port
```

### Reset everything
```bash
# Stop and remove containers, volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Next Steps

- ✅ Phase 1 Complete: Authentication working
- 🔄 Phase 2: Implement chat functionality with WebSocket streaming
- 🔄 Phase 3: Add LLM providers (Ollama, HuggingFace)
- 🔄 Phase 4: Advanced rendering (Markdown, code, LaTeX, diagrams)

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## API Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","full_name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```
