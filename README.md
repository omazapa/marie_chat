# Marie Chat

**Intelligent Conversational Chat Web UI**  
Developed by CoLaV - University of Antioquia

## Overview

Marie Chat is a modern conversational chat interface designed to interact with language models through multiple providers (Ollama, HuggingFace) and intelligent pipelines built with LangGraph/LangChain.

## Features

- ✅ Real-time conversational chat with streaming via WebSockets
- ✅ Multi-provider LLM support (Ollama, HuggingFace, custom pipelines)
- ✅ Advanced Markdown, code, LaTeX, diagram, and HTML artifacts rendering (plots, charts)
- ✅ Conversation persistence in OpenSearch
- ✅ Hybrid search (text + vectorial) over history
- ✅ Speech-to-Text (STT) and Text-to-Speech (TTS)
- ✅ User authentication with JWT
- ✅ Modern interface based on Ant Design X
- ✅ File upload and processing
- ✅ Conversation referencing
- ✅ Multilingual conversational memory
- ✅ Follow-up questions
- ✅ Admin panel

## Technology Stack

### Frontend
- Next.js 15.1 (React 19)
- TypeScript
- Ant Design X & Ant Design 5
- Tailwind CSS 4
- Socket.io Client
- Zustand

### Backend
- Python 3.12+
- Flask 3.x
- Flask-SocketIO
- Flask-JWT-Extended
- OpenSearch
- Pydantic

## Getting Started

### Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 20+ (for local development)
- Python 3.12+ (for local development)

### Quick Start with Docker

1. **Clone and setup:**
```bash
git clone <repository-url>
cd marie_chat
cp .env.example .env
# Edit .env with your configuration
```

2. **Start all services:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

3. **Initialize OpenSearch indices:**
```bash
docker-compose exec backend python scripts/init_opensearch.py
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- OpenSearch: https://localhost:9200
- OpenSearch Dashboards: http://localhost:5601

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Note:** For local development, you'll need to run OpenSearch and Ollama separately, or use Docker Compose.

### First Steps

1. Register a new user at http://localhost:3000/register
2. Login and start chatting
3. The first message will create a new conversation automatically

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Documentation

See [SPECIFICATIONS.md](./SPECIFICATIONS.md) for complete technical specifications.

## Development

This project follows the development plan outlined in SPECIFICATIONS.md. Current phase: **Phase 1 - Fundamentals**.

## License

[Your License Here]

## Contact

CoLaV - University of Antioquia  
Contact: grupocolav@udea.edu.co

