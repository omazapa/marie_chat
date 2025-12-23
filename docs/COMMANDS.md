# 🛠️ MARIE - Useful Commands
> **Machine-Assisted Research Intelligent Environment (MARIE)**

Quick reference guide for development, debugging, and Docker operations.

---

## 🚀 Startup and Shutdown

### Start all services
```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Using the startup script (recommended)
./start.sh           # Linux/MacOS
start.bat            # Windows
```

### Stop services
```bash
# Stop without removing containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (⚠️ deletes data)
docker-compose down -v
```

### Restart specific service
```bash
docker-compose restart frontend
docker-compose restart backend
docker-compose restart opensearch
```

---

## 📊 Service Status

### View status of all containers
```bash
docker-compose ps
```

### View resource usage
```bash
docker stats
```

### View logs
```bash
# All services
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f opensearch

# Last N lines
docker-compose logs --tail=100 backend
```

---

## 🔧 Development

### Rebuild containers after changes
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build frontend
docker-compose build backend

# Rebuild and start
docker-compose up --build
```

### Access container shell
```bash
# Backend (Python)
docker-compose exec backend bash
docker-compose exec backend python

# Create Admin User
docker-compose exec backend python create_admin_user.py --email admin@marie.com --password admin123 --name "System Admin"

# Frontend (Node)
docker-compose exec frontend sh

# OpenSearch
docker-compose exec opensearch bash
```

### Run commands in containers
```bash
# Install Python package
docker-compose exec backend pip install package_name

# Install Node package
docker-compose exec frontend npm install package-name
```

---

## 🗄️ OpenSearch

### Access OpenSearch
```bash
# Check health
curl -k -u admin:Marie_Chat_2024! https://localhost:9200/_cluster/health?pretty

# List indices
curl -k -u admin:Marie_Chat_2024! https://localhost:9200/_cat/indices?v

# Search all users
curl -k -u admin:Marie_Chat_2024! https://localhost:9200/marie_users/_search?pretty

# Search all conversations
curl -k -u admin:Marie_Chat_2024! https://localhost:9200/marie_conversations/_search?pretty

# Delete index (⚠️ careful!)
curl -k -u admin:Marie_Chat_2024! -X DELETE https://localhost:9200/marie_users
```

### OpenSearch Dashboards
```
URL: http://localhost:5601
User: admin
Password: Marie_Chat_2024!
```

### Dev Tools Console
```
GET _cluster/health

GET _cat/indices?v

GET marie_users/_search
{
  "query": {
    "match_all": {}
  }
}

GET marie_conversations/_search
{
  "query": {
    "term": {
      "user_id": "user_uuid_here"
    }
  }
}

GET marie_messages/_search
{
  "query": {
    "term": {
      "conversation_id": "conversation_uuid_here"
    }
  }
}
```

---

## 🧪 API Testing

### Health check
```bash
curl http://localhost:5000/health
```

### Register user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get current user (requires token)
```bash
TOKEN="your_access_token_here"

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Create conversation
```bash
TOKEN="your_access_token_here"

curl -X POST http://localhost:5000/api/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Conversation",
    "model": "llama2",
    "provider": "ollama"
  }'
```

### List conversations
```bash
TOKEN="your_access_token_here"

curl -X GET http://localhost:5000/api/conversations \
  -H "Authorization: Bearer $TOKEN"
```

### Get conversation
```bash
TOKEN="your_access_token_here"
CONV_ID="conversation_id_here"

curl -X GET http://localhost:5000/api/conversations/$CONV_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Update conversation
```bash
TOKEN="your_access_token_here"
CONV_ID="conversation_id_here"

curl -X PUT http://localhost:5000/api/conversations/$CONV_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title"
  }'
```

### Delete conversation
```bash
TOKEN="your_access_token_here"
CONV_ID="conversation_id_here"

curl -X DELETE http://localhost:5000/api/conversations/$CONV_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🤖 Ollama

### Check Ollama status
```bash
curl http://localhost:11434/api/tags
```

### Download model
```bash
docker-compose exec ollama ollama pull llama2
docker-compose exec ollama ollama pull mistral
docker-compose exec ollama ollama pull codellama
```

### List installed models
```bash
docker-compose exec ollama ollama list
```

### Test model
```bash
docker-compose exec ollama ollama run llama2 "Hello, how are you?"
```

### Delete model
```bash
docker-compose exec ollama ollama rm llama2
```

---

## 🐛 Debugging

### View backend logs
```bash
docker-compose logs -f backend
```

### View frontend logs
```bash
docker-compose logs -f frontend
```

### Check environment variables
```bash
# Backend
docker-compose exec backend env | grep FLASK
docker-compose exec backend env | grep OPENSEARCH

# Frontend
docker-compose exec frontend env | grep NEXT
```

### Restart service with rebuild
```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Clean everything and start fresh (⚠️ deletes all data)
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Check port conflicts
```bash
# Linux/MacOS
lsof -i :3000
lsof -i :5000
lsof -i :9200

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :9200
```

---

## 📦 Package Management

### Backend (Python)
```bash
# Install package
docker-compose exec backend pip install package_name

# Update requirements.txt
docker-compose exec backend pip freeze > backend/requirements.txt

# Install from requirements.txt
docker-compose exec backend pip install -r requirements.txt
```

### Frontend (Node.js)
```bash
# Install package
docker-compose exec frontend npm install package-name

# Install as dev dependency
docker-compose exec frontend npm install -D package-name

# Update dependencies
docker-compose exec frontend npm update
```

---

## 🗂️ Database Backups

### Export OpenSearch index
```bash
# Export users
curl -k -u admin:Marie_Chat_2024! \
  https://localhost:9200/marie_users/_search?pretty > backup_users.json

# Export conversations
curl -k -u admin:Marie_Chat_2024! \
  https://localhost:9200/marie_conversations/_search?pretty > backup_conversations.json
```

### Create OpenSearch snapshot (recommended)
```bash
# Coming in Phase 8: Production Features
```

---

## 🔍 Useful Queries

### Count documents
```bash
# Users
curl -k -u admin:Marie_Chat_2024! \
  https://localhost:9200/marie_users/_count

# Conversations
curl -k -u admin:Marie_Chat_2024! \
  https://localhost:9200/marie_conversations/_count

# Messages
curl -k -u admin:Marie_Chat_2024! \
  https://localhost:9200/marie_messages/_count
```

### Search by field
```bash
# Find user by email
curl -k -u admin:Marie_Chat_2024! https://localhost:9200/marie_users/_search?pretty \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "term": {
        "email": "test@example.com"
      }
    }
  }'
```

---

## 🎨 Frontend Development

### Run Next.js outside Docker (optional)
```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:3000
```

### Build production
```bash
cd frontend
npm run build
npm run start
```

### Lint
```bash
cd frontend
npm run lint
```

---

## 🔧 Backend Development

### Run Flask outside Docker (optional)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/MacOS
# or
venv\Scripts\activate     # Windows

pip install -r requirements.txt
python run.py
# Opens on http://localhost:5000
```

### Run tests
```bash
# Coming in Phase 9: Testing & Quality
```

---

## 📝 Git

### Initial commit
```bash
git add .
git commit -m "feat: Phase 1 - Fundamentals complete"
git push
```

### Create branch for Phase 2
```bash
git checkout -b phase-2-chat-core
```

---

## 💡 Tips

### Quick reset (when things break)
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```

### See what's consuming space
```bash
docker system df
```

### Clean unused Docker resources
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Clean everything (⚠️ careful!)
docker system prune -a --volumes
```

### Hot reload not working?
```bash
# Rebuild with no cache
docker-compose build --no-cache

# Restart with volume mount check
docker-compose down
docker-compose up -d
```

---

**Last Update:** December 21, 2024  
**Phase:** 1/10  
**Status:** ✅ Operational
