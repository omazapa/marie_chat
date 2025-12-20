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

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd marie_chat
```

2. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start services with Docker Compose:
```bash
docker-compose -f docker-compose.dev.yml up
```

Or run locally:

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

## Documentation

See [SPECIFICATIONS.md](./SPECIFICATIONS.md) for complete technical specifications.

## Development

This project follows the development plan outlined in SPECIFICATIONS.md. Current phase: **Phase 1 - Fundamentals**.

## License

[Your License Here]

## Contact

CoLaV - University of Antioquia  
Contact: grupocolav@udea.edu.co

