@echo off
REM Marie Chat - Quick Start Script for Windows

echo.
echo 🚀 Marie Chat - Starting Development Environment
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running
    echo    Please start Docker and try again
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo ❌ Error: docker-compose.yml not found
    echo    Please run this script from the project root directory
    exit /b 1
)

echo 📦 Starting services with Docker Compose...
docker-compose up -d

echo.
echo ⏳ Waiting for services to be ready...
echo.

REM Wait for services (simplified for Windows)
timeout /t 30 /nobreak >nul

echo.
echo 🎉 Services should be running now!
echo.
echo 📍 Access points:
echo    Frontend:              http://localhost:3000
echo    Backend API:           http://localhost:5000
echo    OpenSearch:            https://localhost:9200
echo    OpenSearch Dashboards: http://localhost:5601
echo    Ollama:                http://localhost:11434
echo.
echo 🔐 OpenSearch credentials:
echo    Username: admin
echo    Password: Marie_Chat_2024!
echo.
echo 💡 Next steps:
echo    1. Open http://localhost:3000 in your browser
echo    2. Register a new account
echo    3. Start chatting!
echo.
echo 📝 Useful commands:
echo    View logs:        docker-compose logs -f
echo    Stop services:    docker-compose down
echo    Restart:          docker-compose restart
echo.
