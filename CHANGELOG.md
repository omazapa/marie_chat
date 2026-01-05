# Changelog

All notable changes to MARIE (Machine-Assisted Research Intelligent Environment) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions CI/CD workflows
- Automated version bumping system
- Comprehensive MCP (Model Context Protocol) integration specification

## [1.1.0] - 2026-01-04

### Added
- **Multi-Provider Management System**
  - Dynamic provider CRUD operations (Add/Edit/Delete/Test)
  - Cascading selection: Provider Type → Instance → Model
  - Provider name display in chat header
  - Unlimited providers of any type (Ollama, OpenAI, HuggingFace, Agent)
  - Enable/disable providers without deleting
  - Backward compatibility with legacy configurations

- **MCP Integration Specification**
  - Complete documentation for Model Context Protocol support
  - Architecture for filesystem, database, GitHub, and custom tool integrations
  - Security and permission models
  - Implementation guidelines for backend and frontend

### Improved
- Unified UI/UX across admin panel and chat interface
- Better provider identification with visual tags
- State synchronization with database for all provider operations

### Fixed
- React key uniqueness warnings in provider selection
- Provider state consistency between frontend and backend

## [1.0.0] - 2025-12-XX

### Added
- **Multi-Provider Management System**
  - Dynamic provider CRUD operations (Add/Edit/Delete/Test)
  - Cascading selection: Provider Type → Instance → Model
  - Provider name display in chat header
  - Unlimited providers of any type (Ollama, OpenAI, HuggingFace, Agent)
  - Enable/disable providers without deleting

- **Core Features**
  - Real-time conversational chat with streaming via WebSockets
  - Multi-provider LLM support (Ollama, HuggingFace, custom agents)
  - Advanced Markdown, code, LaTeX, diagram, and HTML artifacts rendering
  - Conversation persistence in OpenSearch
  - Hybrid search (text + vectorial) over history

- **Voice Features**
  - Speech-to-Text (STT) with Whisper
  - Text-to-Speech (TTS) with multiple voices
  - Audio recording and transcription

- **Rich Content**
  - Image generation with Stable Diffusion
  - Interactive plots with Plotly
  - Mermaid diagrams
  - KaTeX math rendering
  - Syntax highlighting for code

- **Authentication & Security**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - API key management
  - Admin panel for system configuration

### Technical Stack
- **Frontend**: Next.js 16.1, React 19, TypeScript, Ant Design X 2.1, Tailwind CSS 4
- **Backend**: Python 3.12, Flask 3, Flask-SocketIO, Pydantic 2
- **Database**: OpenSearch 2.11 with k-NN vector search
- **AI**: LangChain 0.3.x, LangGraph 0.2.x, Ollama, HuggingFace
- **Infrastructure**: Docker, Docker Compose

### Security
- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration
- Input validation with Pydantic
- HTML sanitization with DOMPurify

## [Unreleased]

### Planned Features
- Model Context Protocol (MCP) integration
- Advanced RAG with multiple embedding models
- Conversation templates
- Export conversations (PDF, Markdown)
- Mobile-responsive optimizations
- Dark mode improvements
- Prompt library management

---

[1.0.0]: https://github.com/omazapa/marie_chat/releases/tag/v1.0.0
