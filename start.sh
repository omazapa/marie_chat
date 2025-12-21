#!/bin/bash

# Marie Chat - Quick Start Script

echo "🚀 Marie Chat - Starting Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "   Please start Docker and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

echo "📦 Starting services with Docker Compose..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for OpenSearch
echo "Waiting for OpenSearch..."
until curl -k -u admin:Marie_Chat_2024! https://localhost:9200/_cluster/health > /dev/null 2>&1; do
    printf "."
    sleep 2
done
echo " ✅ OpenSearch is ready"

# Wait for Backend
echo "Waiting for Backend..."
until curl http://localhost:5000/health > /dev/null 2>&1; do
    printf "."
    sleep 2
done
echo " ✅ Backend is ready"

# Wait for Frontend
echo "Waiting for Frontend..."
until curl http://localhost:3000 > /dev/null 2>&1; do
    printf "."
    sleep 2
done
echo " ✅ Frontend is ready"

echo ""
echo "🎉 All services are running!"
echo ""
echo "📍 Access points:"
echo "   Frontend:              http://localhost:3000"
echo "   Backend API:           http://localhost:5000"
echo "   OpenSearch:            https://localhost:9200"
echo "   OpenSearch Dashboards: http://localhost:5601"
echo "   Ollama:                http://localhost:11434"
echo ""
echo "🔐 OpenSearch credentials:"
echo "   Username: admin"
echo "   Password: Marie_Chat_2024!"
echo ""
echo "💡 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Register a new account"
echo "   3. Start chatting!"
echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo "   Pull Ollama model: docker exec -it marie-ollama ollama pull llama3.2"
echo ""
