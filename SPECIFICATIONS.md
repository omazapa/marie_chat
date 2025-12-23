# 📘 Marie - Technical Specifications

> **Machine-Assisted Research Intelligent Environment (MARIE)**  
> Developed by ImpactU

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Technology Stack](#-technology-stack)
3. [System Architecture](#-system-architecture)
4. [Functional Requirements](#-functional-requirements)
5. [Design and Branding](#-design-and-branding)
6. [Project Structure](#-project-structure)
7. [LLM Configuration](#-llm-configuration)
8. [Database](#-database)
9. [Authentication](#-authentication)
10. [API Endpoints](#-api-endpoints)
11. [Development Plan](#-development-plan)
12. [Deployment](#-deployment)

---

## 🎯 Overview

**Marie** is a modern conversational research environment designed to interact with language models through multiple providers (Ollama, HuggingFace) and intelligent pipelines built with LangGraph/LangChain.

### Main Objectives

- ✅ Real-time conversational chat with streaming via WebSockets
- ✅ Multi-provider LLM support (Ollama, HuggingFace, custom pipelines)
- ✅ Advanced Markdown, code, LaTeX, diagram, and HTML artifacts rendering (plots, charts)
- ✅ Conversation persistence in OpenSearch
- ✅ Hybrid search (text + vectorial) over history
- ✅ **Speech-to-Text (STT)**: Microphone input with Whisper
- ✅ **Text-to-Speech (TTS)**: Assistant response reading
- ✅ **Image Generation**: Support for generating images with diffusion models (Stable Diffusion, etc.)
- ✅ User authentication and role-based access control
- ✅ Modern interface based on Ant Design X (RICH paradigm)
- ✅ Consistent branding with ImpactU/CoLaV

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.x | Fullstack framework (includes React 19) |
| **TypeScript** | 5.x | Static typing |
| **Ant Design X** | 2.1.x | AI chat components (RICH paradigm) |
| **Ant Design** | 6.x | Base UI components |
| **Tailwind CSS** | 4.x | Utility styles |
| **Socket.io Client** | 4.x | WebSockets for streaming |
| **react-markdown** | latest | Markdown rendering |
| **react-syntax-highlighter** | latest | Code highlighting |
| **rehype-katex** | latest | LaTeX rendering |
| **rehype-raw** | latest | HTML rendering in Markdown |
| **mermaid** | latest | Diagrams |
| **react-plotly.js** | latest | Plotly charts rendering |
| **plotly.js** | latest | Plotly core library |
| **dompurify** | latest | HTML sanitization for security |
| **zustand** | latest | Global state |

#### Voice (TTS/STT)

| Technology | Purpose |
|------------|---------|
| **Web Speech API** | Native browser STT (fallback) |
| **MediaRecorder API** | Audio recording to send to Whisper |

> **Note**: Next.js 16.1 is the latest stable version (December 2025) and includes React 19 with Server Components, Server Actions, and the new App Router.

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.12+ | Runtime |
| **Flask** | 3.x | Web framework |
| **Flask-SocketIO** | 5.x | Bidirectional WebSockets |
| **Flask-CORS** | 4.x | CORS handling |
| **Flask-JWT-Extended** | 4.x | JWT authentication |
| **opensearch-py** | 2.x | OpenSearch client |
| **opensearch-dsl** | latest | DSL for OpenSearch queries |
| **Pydantic** | 2.x | Data validation |
| **python-dotenv** | latest | Environment variables |
| **bcrypt** | latest | Password hashing |
| **nest_asyncio** | latest | Async support for OpenSearch in Flask |

#### Voice (TTS/STT)

| Technology | Version | Purpose |
|------------|---------|---------|
| **faster-whisper** | latest | Local STT (Speech-to-Text) |
| **openai-whisper** | latest | Alternative STT (more accurate) |
| **TTS** (coqui) | latest | Local Text-to-Speech |
| **pyttsx3** | latest | TTS fallback (offline) |
| **edge-tts** | latest | TTS via Microsoft Edge (free, high quality) |

#### Image Generation (Diffusion Models)

| Technology | Version | Purpose |
|------------|---------|---------|
| **diffusers** | latest | Library for diffusion models (Stable Diffusion, etc.) |
| **torch** | latest | Deep learning framework |
| **accelerate** | latest | Optimization for model loading and inference |
| **transformers** | latest | Model utilities |

#### Memory and Embeddings

| Technology | Version | Purpose |
|------------|---------|---------|
| **sentence-transformers** | latest | Multilingual embedding models |
| **langdetect** | latest | Language detection |
| **paraphrase-multilingual-MiniLM-L12-v2** | - | Multilingual embedding model |

#### File Processing

| Technology | Version | Purpose |
|------------|---------|---------|
| **PyPDF2** | latest | PDF text extraction |
| **python-docx** | latest | Word text extraction |
| **openpyxl** | latest | Excel file reading |
| **pandas** | latest | CSV and Excel processing |
| **Pillow (PIL)** | latest | Image processing |
| **pytesseract** | latest | OCR to extract text from images |
| **python-pptx** | latest | PowerPoint text extraction |
| **langchain** | 0.3.x | Document loaders for various formats |

### LLM & AI

| Technology | Version | Purpose |
|------------|---------|---------|
| **LangChain** | 0.3.x | LLM framework |
| **LangGraph** | 0.2.x | Pipelines and agents |
| **langchain-ollama** | latest | Ollama integration |
| **langchain-huggingface** | latest | HuggingFace integration |
| **ollama** | latest | Ollama Python client |
| **huggingface-hub** | latest | Model hub |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **OpenSearch** | Main database + vector search |
| **OpenSearch Dashboards** | Visualization and monitoring (optional) |
| **Docker** | Containers |
| **Docker Compose** | Local orchestration |
| **Ollama** | Local LLM server |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Next.js 16.1                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │  Ant Design │  │  Ant Design │  │    Tailwind CSS     │  │    │
│  │  │      X      │  │      5      │  │         4           │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │    │
│  │  ┌─────────────────────────────────────────────────────────┐│    │
│  │  │              Socket.io Client (WebSockets)              ││    │
│  │  └─────────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ WebSocket + REST
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVER                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Flask + SocketIO                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │    Auth     │  │    Chat     │  │   Conversations     │  │    │
│  │  │   (JWT)     │  │  Endpoints  │  │     Endpoints       │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      LLM Service Layer                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │   Ollama    │  │ HuggingFace │  │  LangGraph Agents   │  │    │
│  │  │  Provider   │  │  Provider   │  │     & Pipelines     │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      OpenSearch                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │users (index)│  │conversations│  │messages (+ vectors)│  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │    │
│  │                                                              │    │
│  │  Capabilities: Full-text search, k-NN vectors, Aggregations │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        LLM PROVIDERS                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────┐   │
│  │     Ollama      │  │   HuggingFace   │  │  Custom Pipelines  │   │
│  │  (Local LLMs)   │  │   Inference API │  │    (LangGraph)     │   │
│  └─────────────────┘  └─────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### WebSocket Communication Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │                    │   LLM    │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │──── connect() ───────────────>│                               │
     │<─── connected ────────────────│                               │
     │                               │                               │
     │──── send_message ────────────>│                               │
     │     {content, conv_id}        │                               │
     │                               │──── stream_chat() ───────────>│
     │                               │                               │
     │<─── message_chunk ────────────│<─── token ────────────────────│
     │     {chunk: "Hello"}          │                               │
     │                               │                               │
     │<─── message_chunk ────────────│<─── token ────────────────────│
     │     {chunk: " World"}         │                               │
     │                               │                               │
     │<─── message_complete ─────────│<─── done ─────────────────────│
     │     {message_id, full_text}   │                               │
     │                               │                               │
```

---

## 📝 Functional Requirements

### RF01 - Conversational Chat

| ID | Requirement | Priority |
|----|-------------|----------|
| RF01.1 | Send text messages to LLM | High |
| RF01.2 | Receive streaming responses (WebSocket) | High |
| RF01.3 | Display "typing..." indicator | High |
| RF01.4 | Cancel response generation | Medium |
| RF01.5 | Regenerate last response | Medium |
| RF01.6 | Edit sent messages | Low |
| RF01.7 | Attach files to messages | High |
| RF01.8 | Process and extract file content | High |
| RF01.9 | Display attached files in messages | High |
| RF01.10 | Reference previous conversations | High |
| RF01.11 | Include context from referenced conversations | High |
| RF01.12 | Search conversations to reference | Medium |
| RF01.13 | Generate images using diffusion models | Medium |
| RF01.13 | Conversation follow-up (follow-up questions) | High |
| RF01.14 | Persistent conversational memory | High |
| RF01.15 | Multilingual support in memory | High |

### RF02 - Conversation Management

| ID | Requirement | Priority |
|----|-------------|----------|
| RF02.1 | Create new conversation | High |
| RF02.2 | List user conversations | High |
| RF02.3 | Load conversation history | High |
| RF02.4 | Rename conversation | Medium |
| RF02.5 | Delete conversation | Medium |
| RF02.6 | Search conversations (full-text) | High |
| RF02.7 | Semantic search in history | Medium |
| RF02.8 | Reference conversations in new conversations | High |
| RF02.9 | View references to conversations | Medium |
| RF02.10 | View complete conversation history | High |
| RF02.11 | Navigate history (infinite scroll, pagination) | Medium |
| RF02.12 | History filters and sorting | Medium |

### RF03 - Content Rendering

| ID | Requirement | Priority |
|----|-------------|----------|
| RF03.1 | Render basic Markdown | High |
| RF03.2 | Code syntax highlighting | High |
| RF03.3 | Copy code button | High |
| RF03.4 | Render LaTeX formulas | Medium |
| RF03.5 | Render Mermaid diagrams | Medium |
| RF03.6 | Render interactive tables | Medium |
| RF03.7 | Render HTML artifacts (plots, charts, visualizations) | High |

### RF04 - Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| RF04.1 | User registration (can be disabled by admin) | High |
| RF04.2 | Login with email/password | High |
| RF04.3 | Logout | High |
| RF04.4 | JWT token refresh | High |
| RF04.5 | Password recovery | Medium |
| RF04.6 | Role system (admin, user) | High |
| RF04.7 | Role-based authorization | High |

### RF09 - Administration

| ID | Requirement | Priority |
|----|-------------|----------|
| RF09.1 | Administration panel | High |
| RF09.2 | User management (list, edit, delete) | High |
| RF09.3 | Activate/deactivate users | High |
| RF09.4 | Assign/remove roles | High |
| RF09.5 | General system configuration (White Label, Registration) | High |
| RF09.6 | Manage available LLM models | High |
| RF09.7 | Configure limits (rate limits, storage) | Medium |
| RF09.8 | System statistics and metrics | Medium |
| RF09.9 | Logs and audit | Medium |
| RF09.10 | Backup and restore | Low |
| RF09.11 | Configure embedding models | High |
| RF09.12 | Configure TTS/STT models | High |
| RF09.13 | View complete user chat history | High |
| RF09.14 | Generate API keys for users | High |
| RF09.15 | Generate API keys for developers | High |

### RF05 - Configuration

| ID | Requirement | Priority |
|----|-------------|----------|
| RF05.1 | Select LLM model | High |
| RF05.2 | Select provider (Ollama/HF) | High |
| RF05.3 | Configure temperature | Medium |
| RF05.4 | Configure max tokens | Medium |
| RF05.5 | Custom system prompt | Medium |

### RF06 - Voice (TTS/STT)

| ID | Requirement | Priority |
|----|-------------|----------|
| RF06.1 | Microphone button for voice input | High |
| RF06.2 | Real-time transcription (STT) | High |
| RF06.3 | Visual recording indicator | High |
| RF06.4 | Play assistant responses (TTS) | High |
| RF06.5 | Play/pause button on each message | Medium |
| RF06.6 | Voice/language selection for TTS | Medium |
| RF06.7 | Playback speed control | Low |
| RF06.8 | "Continuous conversation" mode (auto-listen) | Low |

### RF08 - Image Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| RF08.1 | Generate images from text prompts | Medium |
| RF08.2 | Select image generation model | Medium |
| RF08.3 | Configure image parameters (size, steps, etc.) | Low |
| RF08.4 | Display generated images in chat | High |
| RF08.5 | Download generated images | Medium |

### RF07 - Advanced UX

| ID | Requirement | Priority |
|----|-------------|----------|
| RF07.1 | Welcome screen with suggestions | High |
| RF07.2 | Quick commands / suggested prompts | Medium |
| RF07.3 | Light/dark theme | Medium |
| RF07.4 | Responsive design (mobile) | High |
| RF07.5 | Keyboard shortcuts | Low |

---

## 🎨 Design and Branding

### Color Palette (Based on ImpactU/CoLaV)

```css
:root {
  /* Colores Primarios - Inspirados en ImpactU */
  --color-primary: #1B4B73;        /* Azul institucional oscuro */
  --color-primary-light: #2D6A9F;  /* Azul primario */
  --color-primary-dark: #0F2D47;   /* Azul muy oscuro */
  
  /* Colores Secundarios */
  --color-secondary: #17A589;      /* Verde/Teal CoLaV */
  --color-secondary-light: #48C9B0;
  --color-secondary-dark: #0E6655;
  
  /* Colores de Acento */
  --color-accent: #F39C12;         /* Naranja/Dorado para highlights */
  --color-accent-alt: #E74C3C;     /* Rojo para alertas */
  
  /* Neutrales */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F8FAFC;
  --color-bg-tertiary: #EEF2F7;
  --color-text-primary: #1A202C;
  --color-text-secondary: #4A5568;
  --color-text-muted: #718096;
  --color-border: #E2E8F0;
  
  /* Dark Theme */
  --color-dark-bg-primary: #0F172A;
  --color-dark-bg-secondary: #1E293B;
  --color-dark-bg-tertiary: #334155;
  --color-dark-text-primary: #F1F5F9;
  --color-dark-text-secondary: #CBD5E1;
  --color-dark-border: #475569;
  
  /* Chat Specific */
  --color-user-bubble: #1B4B73;
  --color-assistant-bubble: #F8FAFC;
  --color-code-bg: #1E293B;
}
```

### Typography

```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-heading: 'Plus Jakarta Sans', var(--font-primary);
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
}
```

### Chat Components (Ant Design X - RICH Paradigm)

| Component | Usage in Marie |
|-----------|---------------------|
| **Bubble** | Message bubbles (user/assistant) |
| **Sender** | Message input with actions |
| **Conversations** | Conversation list in sidebar |
| **Welcome** | Welcome screen |
| **Prompts** | Prompt suggestions |
| **Attachments** | File attachments |
| **ThoughtChain** | Reasoning visualization |

### Layout Design

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────────┐                                                        │
│  │ LOGO    │  Marie                   [Theme] [User ▼]             │
│  └─────────┘                                                        │
├─────────────────┬───────────────────────────────────────────────────┤
│                 │                                                   │
│  SIDEBAR        │              CHAT AREA                            │
│                 │                                                   │
│  [+ Nueva]      │  ┌─────────────────────────────────────────────┐ │
│                 │  │                                             │ │
│  Conversaciones │  │           WELCOME SCREEN                    │ │
│  ─────────────  │  │         (cuando está vacío)                 │ │
│  📝 Conv 1      │  │                                             │ │
│  📝 Conv 2      │  │    🤖 ¡Hola! Soy Marie                      │ │
│  📝 Conv 3      │  │    Tu asistente de investigación            │ │
│  📝 Conv 4      │  │                                             │ │
│                 │  │    [Sugerencia 1] [Sugerencia 2]            │ │
│  ─────────────  │  │    [Sugerencia 3] [Sugerencia 4]            │ │
│                 │  │                                             │ │
│  CONFIGURACIÓN  │  └─────────────────────────────────────────────┘ │
│  ─────────────  │                                                   │
│  Modelo: [▼]    │  ┌─────────────────────────────────────────────┐ │
│  Provider: [▼]  │  │ 💬 Escribe tu mensaje...           [Send]  │ │
│                 │  └─────────────────────────────────────────────┘ │
│                 │                                                   │
└─────────────────┴───────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
marie_chat/
│
├── 📁 frontend/                      # Next.js 16 Application
│   ├── 📁 app/
│   │   ├── 📁 (auth)/               # Rutas de autenticación
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── 📁 (chat)/               # Rutas principales de chat
│   │   │   ├── page.tsx             # Chat principal
│   │   │   ├── [conversationId]/
│   │   │   │   └── page.tsx         # Conversación específica
│   │   │   └── layout.tsx
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Estilos globales + variables
│   │   └── providers.tsx            # Context providers
│   │
│   ├── 📁 components/
│   │   ├── 📁 chat/
│   │   │   ├── ChatContainer.tsx    # Contenedor principal
│   │   │   ├── MessageList.tsx      # Lista de mensajes
│   │   │   ├── MessageBubble.tsx    # Burbuja individual
│   │   │   ├── ChatInput.tsx        # Input con Sender de AntX
│   │   │   ├── WelcomeScreen.tsx    # Pantalla inicial
│   │   │   ├── TypingIndicator.tsx  # Indicador escribiendo
│   │   │   ├── VoiceButton.tsx      # Botón micrófono (STT)
│   │   │   ├── SpeakButton.tsx      # Botón reproducir (TTS)
│   │   │   ├── FileUpload.tsx       # Componente de carga de archivos
│   │   │   └── FilePreview.tsx      # Preview de archivos adjuntos
│   │   ├── 📁 sidebar/
│   │   │   ├── Sidebar.tsx          # Sidebar completo
│   │   │   ├── ConversationList.tsx # Lista de conversaciones
│   │   │   ├── ConversationItem.tsx # Item individual
│   │   │   └── ModelSelector.tsx    # Selector de modelo
│   │   ├── 📁 markdown/
│   │   │   ├── MarkdownRenderer.tsx # Renderizador MD
│   │   │   ├── CodeBlock.tsx        # Bloque de código
│   │   │   ├── MermaidDiagram.tsx   # Diagramas
│   │   │   ├── LatexRenderer.tsx    # Fórmulas LaTeX
│   │   │   └── HTMLArtifact.tsx     # HTML artifacts (plots, charts)
│   │   ├── 📁 auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   └── 📁 ui/
│   │       ├── Header.tsx
│   │       ├── Logo.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── UserMenu.tsx
│   │
│   ├── 📁 hooks/
│   │   ├── useSocket.ts             # WebSocket hook
│   │   ├── useChat.ts               # Lógica de chat
│   │   ├── useConversations.ts      # CRUD conversaciones
│   │   ├── useAuth.ts               # Autenticación
│   │   ├── useModels.ts             # Lista de modelos
│   │   └── useSpeech.ts             # TTS/STT hook
│   │
│   ├── 📁 lib/
│   │   ├── api.ts                   # Cliente API REST
│   │   ├── socket.ts                # Configuración Socket.io
│   │   ├── types.ts                 # TypeScript types
│   │   └── constants.ts             # Constantes
│   │
│   ├── 📁 stores/
│   │   ├── authStore.ts             # Estado autenticación
│   │   ├── chatStore.ts             # Estado del chat
│   │   └── settingsStore.ts         # Configuración
│   │
│   ├── 📁 public/
│   │   ├── logo.svg
│   │   ├── favicon.ico
│   │   └── 📁 fonts/
│   │
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.local.example
│
├── 📁 backend/                       # Flask Application
│   ├── 📁 app/
│   │   ├── __init__.py              # App factory
│   │   ├── config.py                # Configuración
│   │   ├── extensions.py            # Flask extensions
│   │   │
│   │   ├── 📁 routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # /api/auth/*
│   │   │   ├── chat.py              # /api/chat/*
│   │   │   ├── conversations.py     # /api/conversations/*
│   │   │   ├── models.py            # /api/models/*
│   │   │   ├── speech.py            # /api/speech/*
│   │   │   ├── files.py             # /api/files/*
│   │   │   └── admin.py             # /api/admin/* (solo admins)
│   │   │   └── 📁 v1/               # API de Desarrolladores
│   │   │       ├── __init__.py
│   │   │       ├── chat.py          # /api/v1/chat/*
│   │   │       ├── conversations.py # /api/v1/conversations/*
│   │   │       ├── messages.py       # /api/v1/messages/*
│   │   │       ├── models.py        # /api/v1/models/*
│   │   │       ├── search.py        # /api/v1/search/*
│   │   │       ├── speech.py        # /api/v1/speech/*
│   │   │       ├── files.py         # /api/v1/files/*
│   │   │       ├── api_keys.py      # /api/v1/keys/*
│   │   │       └── docs.py          # /api/v1/docs (OpenAPI/Swagger)
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── __init__.py
│   │   │   ├── opensearch_service.py    # Cliente OpenSearch
│   │   │   ├── opensearch_init.py       # Inicialización índices
│   │   │   ├── embedding_service.py     # Generación de embeddings
│   │   │   ├── speech_service.py        # TTS/STT (Whisper + Edge TTS)
│   │   │   ├── image_service.py         # Image generation service
│   │   │   ├── llm_service.py           # Abstracción LLM
│   │   │   ├── ollama_provider.py       # Proveedor Ollama
│   │   │   ├── diffusion_provider.py    # Proveedor Diffusion (Stable Diffusion)
│   │   │   ├── huggingface_provider.py  # Proveedor HF
│   │   │   ├── langgraph_pipeline.py    # Pipelines LangGraph
│   │   │   ├── auth_service.py          # Lógica de auth
│   │   │   ├── api_key_service.py       # Gestión de API keys
│   │   │   ├── rate_limit_service.py    # Rate limiting para API keys
│   │   │   ├── file_service.py          # Procesamiento de archivos
│   │   │   ├── vision_service.py        # Análisis de imágenes (opcional)
│   │   │   └── reference_service.py      # Gestión de referencias a conversaciones
│   │   │
│   │   ├── 📁 models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # Pydantic model User
│   │   │   ├── conversation.py      # Pydantic model Conversation
│   │   │   └── message.py           # Pydantic model Message
│   │   │
│   │   ├── 📁 schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Schemas Pydantic auth
│   │   │   ├── chat.py              # Schemas chat
│   │   │   └── conversation.py      # Schemas conversation
│   │   │
│   │   ├── 📁 sockets/
│   │   │   ├── __init__.py
│   │   │   └── chat_socket.py       # WebSocket handlers
│   │   │
│   │   └── 📁 utils/
│   │       ├── __init__.py
│   │       ├── security.py          # Helpers seguridad
│   │       ├── validators.py        # Validadores
│   │       └── decorators.py        # Decoradores (rate_limit, api_key_auth)
│   │
│   ├── 📁 tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   └── test_chat.py
│   │
│   ├── run.py                       # Entry point
│   ├── requirements.txt
│   └── .env.example
│
├── 📁 docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── README.md
└── SPECIFICATIONS.md                 # Este documento
```

---

## 🤖 LLM Configuration

### Proveedores Soportados

#### 1. Ollama (Local)

```python
# backend/app/services/ollama_provider.py
from langchain_ollama import ChatOllama

class OllamaProvider:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
    
    async def stream_chat(self, model: str, messages: list, **kwargs):
        llm = ChatOllama(
            model=model,
            base_url=self.base_url,
            temperature=kwargs.get("temperature", 0.7),
        )
        async for chunk in llm.astream(messages):
            yield chunk.content
```

**Modelos Recomendados:**
- `llama3.2` - General purpose
- `codellama` - Código
- `mistral` - Eficiente
- `qwen2.5` - Multilingüe

#### 2. HuggingFace Inference API

```python
# backend/app/services/huggingface_provider.py
from langchain_huggingface import HuggingFaceEndpoint

class HuggingFaceProvider:
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def stream_chat(self, model: str, messages: list, **kwargs):
        llm = HuggingFaceEndpoint(
            repo_id=model,
            huggingfacehub_api_token=self.api_key,
            temperature=kwargs.get("temperature", 0.7),
        )
        async for chunk in llm.astream(messages):
            yield chunk
```

**Modelos Recomendados:**
- `meta-llama/Llama-3.2-3B-Instruct`
- `mistralai/Mistral-7B-Instruct-v0.3`
- `Qwen/Qwen2.5-7B-Instruct`

#### 3. LangGraph Pipelines

```python
# backend/app/services/langgraph_pipeline.py
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage

class ResearchAssistantPipeline:
    """Pipeline para asistente de investigación con múltiples pasos"""
    
    def __init__(self, llm):
        self.llm = llm
        self.graph = self._build_graph()
    
    def _build_graph(self):
        workflow = StateGraph(AgentState)
        
        # Nodos
        workflow.add_node("analyze", self.analyze_query)
        workflow.add_node("search", self.search_knowledge)
        workflow.add_node("generate", self.generate_response)
        
        # Edges
        workflow.set_entry_point("analyze")
        workflow.add_edge("analyze", "search")
        workflow.add_edge("search", "generate")
        workflow.add_edge("generate", END)
        
        return workflow.compile()
    
    async def run(self, query: str):
        async for event in self.graph.astream({"query": query}):
            yield event
```

### Configuración de Modelos

```yaml
# Ejemplo de configuración
models:
  ollama:
    - id: "llama3.2"
      name: "Llama 3.2"
      provider: "ollama"
      context_length: 8192
    - id: "codellama"
      name: "Code Llama"
      provider: "ollama"
      context_length: 16384
  
  huggingface:
    - id: "meta-llama/Llama-3.2-3B-Instruct"
      name: "Llama 3.2 3B (HF)"
      provider: "huggingface"
      context_length: 8192
  
  pipelines:
    - id: "research-assistant"
      name: "Asistente de Investigación"
      provider: "langgraph"
      description: "Pipeline especializado para investigación"
```

---

## 🎤 Voice: Text-to-Speech & Speech-to-Text

### Arquitectura de Voz

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     Entrada de Voz (STT)                     │    │
│  │  ┌─────────────────┐      ┌─────────────────────────────┐   │    │
│  │  │   Micrófono     │──────│  MediaRecorder API          │   │    │
│  │  │   [🎤 Botón]    │      │  (grabación audio WebM/WAV) │   │    │
│  │  └─────────────────┘      └──────────────┬──────────────┘   │    │
│  │                                          │ audio blob       │    │
│  │                                          ▼                  │    │
│  │                           ┌──────────────────────────────┐  │    │
│  │                           │  POST /api/speech/transcribe │  │    │
│  │                           └──────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     Salida de Voz (TTS)                      │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │  GET /api/speech/synthesize?text=...                │    │    │
│  │  └──────────────────────────┬──────────────────────────┘    │    │
│  │                             │ audio stream                  │    │
│  │                             ▼                               │    │
│  │  ┌─────────────────┐   ┌─────────────────────────────┐     │    │
│  │  │  [▶️ Play]       │───│  Audio API / HTMLAudioElement│     │    │
│  │  │  [⏸️ Pause]      │   │  (reproducción streaming)   │     │    │
│  │  └─────────────────┘   └─────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR (Flask)                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      STT Service                             │    │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐   │    │
│  │  │ faster-whisper  │  │  Whisper large-v3 (opcional)    │   │    │
│  │  │ (local, rápido) │  │  (más preciso, más lento)       │   │    │
│  │  └─────────────────┘  └─────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      TTS Service                             │    │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐   │    │
│  │  │    edge-tts     │  │  Coqui TTS (local, offline)     │   │    │
│  │  │ (Microsoft, HD) │  │  (más lento, sin internet)      │   │    │
│  │  └─────────────────┘  └─────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Proveedores de STT (Speech-to-Text)

| Proveedor | Tipo | Latencia | Precisión | Idiomas |
|-----------|------|----------|-----------|---------|
| **faster-whisper** | Local | ~1-3s | Alta | 99+ |
| **openai-whisper** | Local | ~3-8s | Muy Alta | 99+ |
| **Web Speech API** | Browser | Real-time | Media | Limitados |

**Recomendación**: `faster-whisper` con modelo `base` o `small` para balance velocidad/precisión.

### Proveedores de TTS (Text-to-Speech)

| Proveedor | Tipo | Calidad | Voces | Costo |
|-----------|------|---------|-------|-------|
| **edge-tts** | Cloud (MS) | HD | 300+ | Gratis |
| **Coqui TTS** | Local | Alta | Customizable | Gratis |
| **pyttsx3** | Local | Media | Sistema | Gratis |

**Recomendación**: `edge-tts` para producción (alta calidad, gratis, muchas voces).

### Servicio de Voz (Backend)

```python
# backend/app/services/speech_service.py
from faster_whisper import WhisperModel
import edge_tts
import asyncio
from io import BytesIO

class SpeechService:
    def __init__(self):
        # STT: Cargar modelo Whisper
        self.whisper_model = WhisperModel(
            "base",  # opciones: tiny, base, small, medium, large-v3
            device="cuda",  # o "cpu"
            compute_type="float16"  # o "int8" para CPU
        )
        
        # TTS: Voces por defecto
        self.default_voice = "es-CO-GonzaloNeural"  # Voz colombiana
        self.voices = {
            "es-CO": ["es-CO-GonzaloNeural", "es-CO-SalomeNeural"],
            "es-ES": ["es-ES-AlvaroNeural", "es-ES-ElviraNeural"],
            "en-US": ["en-US-GuyNeural", "en-US-JennyNeural"],
        }
    
    # ==================== STT ====================
    
    async def transcribe(self, audio_bytes: bytes, language: str = "es") -> dict:
        """Transcribir audio a texto usando Whisper"""
        # Guardar temporalmente el audio
        audio_file = BytesIO(audio_bytes)
        
        # Transcribir
        segments, info = self.whisper_model.transcribe(
            audio_file,
            language=language,
            beam_size=5,
            vad_filter=True  # Filtrar silencios
        )
        
        # Concatenar segmentos
        text = " ".join([segment.text for segment in segments])
        
        return {
            "text": text.strip(),
            "language": info.language,
            "confidence": info.language_probability,
            "duration": info.duration
        }
    
    # ==================== TTS ====================
    
    async def synthesize(self, text: str, voice: str = None) -> bytes:
        """Convertir texto a audio usando Edge TTS"""
        voice = voice or self.default_voice
        
        communicate = edge_tts.Communicate(text, voice)
        audio_data = BytesIO()
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.write(chunk["data"])
        
        return audio_data.getvalue()
    
    async def synthesize_stream(self, text: str, voice: str = None):
        """Stream de audio para reproducción progresiva"""
        voice = voice or self.default_voice
        communicate = edge_tts.Communicate(text, voice)
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]
    
    def get_available_voices(self, language: str = None) -> list:
        """Obtener voces disponibles"""
        if language:
            return self.voices.get(language, [])
        return self.voices
```

### Endpoints de Voz

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/speech/transcribe` | Audio → Texto (STT) |
| GET | `/api/speech/synthesize` | Texto → Audio stream (TTS) |
| GET | `/api/speech/voices` | Listar voces disponibles |

### Componentes Frontend

```typescript
// frontend/hooks/useSpeech.ts
import { useState, useRef, useCallback } from 'react';

export function useSpeech() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ==================== STT ====================
  
  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData
      });
      const { text } = await response.json();
      // Usar el texto transcrito...
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  // ==================== TTS ====================
  
  const speak = useCallback(async (text: string, voice?: string) => {
    const url = `/api/speech/synthesize?text=${encodeURIComponent(text)}&voice=${voice || ''}`;
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    audioRef.current.src = url;
    audioRef.current.onended = () => setIsPlaying(false);
    await audioRef.current.play();
    setIsPlaying(true);
  }, []);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  return {
    isRecording,
    isPlaying,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking
  };
}
```

### Voces Disponibles (Edge TTS - Español)

| Código | Nombre | Género | País |
|--------|--------|--------|------|
| `es-CO-GonzaloNeural` | Gonzalo | Masculino | 🇨🇴 Colombia |
| `es-CO-SalomeNeural` | Salomé | Femenino | 🇨🇴 Colombia |
| `es-MX-DaliaNeural` | Dalia | Femenino | 🇲🇽 México |
| `es-MX-JorgeNeural` | Jorge | Masculino | 🇲🇽 México |
| `es-ES-ElviraNeural` | Elvira | Femenino | 🇪🇸 España |
| `es-ES-AlvaroNeural` | Álvaro | Masculino | 🇪🇸 España |
| `es-AR-ElenaNeural` | Elena | Femenino | 🇦🇷 Argentina |

---

## 📊 HTML Artifacts Rendering (Plots & Charts)

Marie supports rendering HTML artifacts generated by LLMs, particularly for data visualizations, plots, and interactive charts. This is essential for displaying outputs from code execution, especially Python scripts that generate matplotlib, Plotly, Bokeh, or other visualization libraries.

### Use Cases

1. **Data Visualization**: Display plots generated by Python code (matplotlib, Plotly, seaborn)
2. **Interactive Charts**: Render interactive Plotly charts embedded in HTML
3. **Custom Visualizations**: Support any HTML-based visualization artifact
4. **Code Execution Results**: Show visual outputs from executed code blocks

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Message Content (Markdown + HTML)               │    │
│  │  ┌─────────────────┐      ┌─────────────────────────────┐   │    │
│  │  │  Markdown        │──────│  HTML Artifact Detection     │   │    │
│  │  │  Renderer        │      │  - Detect <div> with plots   │   │    │
│  │  └─────────────────┘      │  - Extract Plotly JSON       │   │    │
│  │                           │  - Sanitize HTML              │   │    │
│  │                           └──────────────┬──────────────┘   │    │
│  │                                          │                  │    │
│  │                                          ▼                  │    │
│  │                           ┌──────────────────────────────┐  │    │
│  │                           │  HTMLArtifact Component      │  │    │
│  │                           │  - DOMPurify sanitization    │  │    │
│  │                           │  - Plotly rendering          │  │    │
│  │                           │  - Responsive container       │  │    │
│  │                           └──────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation

#### Frontend Component: HTMLArtifact.tsx

```typescript
// frontend/components/markdown/HTMLArtifact.tsx
import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import Plotly from 'plotly.js-dist-min';
import { createRoot } from 'react-dom/client';

interface HTMLArtifactProps {
  html: string;
  className?: string;
}

export function HTMLArtifact({ html, className }: HTMLArtifactProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Sanitize HTML to prevent XSS attacks
    const sanitizedHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'div', 'span', 'svg', 'canvas', 'script',
        'style', 'img', 'figure', 'figcaption'
      ],
      ALLOWED_ATTR: [
        'id', 'class', 'style', 'data-*', 'src', 'alt',
        'width', 'height', 'type', 'data-plotly'
      ],
      ALLOW_DATA_ATTR: true,
      KEEP_CONTENT: true,
    });

    // Set sanitized HTML
    containerRef.current.innerHTML = sanitizedHTML;

    // Find and render Plotly charts
    const plotlyDivs = containerRef.current.querySelectorAll('[data-plotly]');
    plotlyDivs.forEach((div) => {
      try {
        const plotlyData = JSON.parse(div.getAttribute('data-plotly') || '{}');
        if (plotlyData.data && plotlyData.layout) {
          Plotly.newPlot(div as HTMLElement, plotlyData.data, plotlyData.layout, {
            responsive: true,
            displayModeBar: true,
          });
        }
      } catch (error) {
        console.error('Error rendering Plotly chart:', error);
      }
    });

    // Cleanup on unmount
    return () => {
      if (containerRef.current) {
        const plots = containerRef.current.querySelectorAll('.js-plotly-plot');
        plots.forEach((plot) => {
          Plotly.purge(plot as HTMLElement);
        });
      }
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`html-artifact ${className || ''}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        margin: '1rem 0',
      }}
    />
  );
}
```

#### Integration with MarkdownRenderer

```typescript
// frontend/components/markdown/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { HTMLArtifact } from './HTMLArtifact';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Detect HTML artifacts in markdown
  const detectHTMLArtifacts = (text: string) => {
    // Pattern to detect HTML divs with plots or visualizations
    const artifactPattern = /<div[^>]*(?:data-plotly|class=["'][^"']*plot|class=["'][^"']*chart)[^>]*>[\s\S]*?<\/div>/gi;
    return artifactPattern.test(text);
  };

  // Process content to extract HTML artifacts
  const processContent = (text: string) => {
    const parts: Array<{ type: 'markdown' | 'html'; content: string }> = [];
    let lastIndex = 0;
    const artifactPattern = /<div[^>]*(?:data-plotly|class=["'][^"']*plot|class=["'][^"']*chart)[^>]*>[\s\S]*?<\/div>/gi;
    let match;

    while ((match = artifactPattern.exec(text)) !== null) {
      // Add markdown before artifact
      if (match.index > lastIndex) {
        parts.push({
          type: 'markdown',
          content: text.slice(lastIndex, match.index),
        });
      }
      // Add HTML artifact
      parts.push({
        type: 'html',
        content: match[0],
      });
      lastIndex = artifactPattern.lastIndex;
    }

    // Add remaining markdown
    if (lastIndex < text.length) {
      parts.push({
        type: 'markdown',
        content: text.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'markdown', content: text }];
  };

  const processedParts = processContent(content);

  return (
    <div className="markdown-content">
      {processedParts.map((part, index) => {
        if (part.type === 'html') {
          return <HTMLArtifact key={index} html={part.content} />;
        }
        return (
          <ReactMarkdown
            key={index}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              // Custom components for code, tables, etc.
            }}
          >
            {part.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
```

### Supported Visualization Libraries

| Library | Format | Support |
|---------|--------|---------|
| **Plotly** | HTML + JSON | ✅ Full support (interactive) |
| **Matplotlib** | Base64 PNG/SVG | ✅ Via HTML img tags |
| **Bokeh** | HTML + JavaScript | ✅ Full support |
| **Seaborn** | PNG/SVG | ✅ Via HTML img tags |
| **D3.js** | HTML + SVG | ✅ Full support |
| **Chart.js** | Canvas/HTML | ✅ Full support |
| **Custom HTML** | Any HTML | ✅ With sanitization |

### Security Considerations

1. **HTML Sanitization**: All HTML artifacts are sanitized using DOMPurify to prevent XSS attacks
2. **Allowed Tags**: Only safe HTML tags are allowed (div, svg, canvas, img, etc.)
3. **Script Execution**: JavaScript in artifacts is blocked unless explicitly whitelisted
4. **Data Attributes**: Plotly data is extracted from `data-plotly` attributes only
5. **Content Security Policy**: CSP headers should be configured to prevent inline script execution

### Example: Plotly Chart in Response

```html
<!-- LLM generates this HTML artifact -->
<div class="plotly-chart" data-plotly='{"data":[{"x":[1,2,3,4],"y":[10,11,12,13],"type":"scatter"}],"layout":{"title":"Sample Plot"}}'>
</div>
```

The component will:
1. Sanitize the HTML
2. Extract Plotly JSON from `data-plotly` attribute
3. Render interactive Plotly chart
4. Make it responsive

### CSS Styling

```css
/* frontend/styles/html-artifact.css */
.html-artifact {
  width: 100%;
  max-width: 100%;
  margin: 1rem 0;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  overflow: auto;
}

.html-artifact .js-plotly-plot {
  width: 100% !important;
  height: auto !important;
}

.html-artifact img {
  max-width: 100%;
  height: auto;
}

.html-artifact svg {
  max-width: 100%;
  height: auto;
}
```

---

## 📎 File Handling

Marie soporta la carga y procesamiento de archivos para incluirlos en el contexto de las conversaciones. Los archivos se procesan, se extrae su contenido y se incluye en el prompt enviado al LLM.

### Tipos de Archivos Soportados

| Tipo | Extensiones | Procesamiento |
|------|-------------|---------------|
| **Documentos** | `.pdf`, `.docx`, `.doc`, `.odt` | Extracción de texto con PyPDF2, python-docx |
| **Texto** | `.txt`, `.md`, `.csv` | Lectura directa |
| **Código** | `.py`, `.js`, `.ts`, `.java`, `.cpp`, `.c`, `.go`, `.rs`, `.rb`, `.php`, `.html`, `.css`, `.json`, `.xml`, `.yaml`, `.yml` | Lectura con syntax highlighting |
| **Imágenes** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp` | OCR con Tesseract + análisis con visión (CLIP, GPT-4V) |
| **Hojas de Cálculo** | `.xlsx`, `.xls`, `.ods` | Extracción con openpyxl, pandas |
| **Presentaciones** | `.pptx`, `.ppt` | Extracción de texto de slides |
| **Archivos Comprimidos** | `.zip`, `.tar`, `.gz` | Descompresión y procesamiento recursivo |

### Arquitectura de Procesamiento de Archivos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Carga de Archivos                         │    │
│  │  ┌─────────────────┐      ┌─────────────────────────────┐   │    │
│  │  │   File Input     │──────│  Validación (tipo, tamaño)   │   │    │
│  │  │   [📎 Botón]     │      │  Preview / Thumbnail         │   │    │
│  │  └─────────────────┘      └──────────────┬──────────────┘   │    │
│  │                                          │ FormData          │    │
│  │                                          ▼                  │    │
│  │                           ┌──────────────────────────────┐  │    │
│  │                           │  POST /api/files/upload      │  │    │
│  │                           └──────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Envío de Mensaje con Archivos                  │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │  send_message {                                      │    │    │
│  │  │    content: "Analiza este documento",              │    │    │
│  │  │    file_ids: ["file_123", "file_456"]               │    │    │
│  │  │  }                                                   │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR (Flask)                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    File Upload Service                      │    │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐   │    │
│  │  │  Validación     │  │  Almacenamiento (local/S3)     │   │    │
│  │  │  (tipo, tamaño) │  │  Generación de metadatos       │   │    │
│  │  └─────────────────┘  └─────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  File Processing Service                    │    │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐   │    │
│  │  │  PDF Parser     │  │  Image OCR (Tesseract)        │   │    │
│  │  │  Docx Parser    │  │  Vision Analysis (CLIP/GPT-4V)│   │    │
│  │  │  Text Extractor │  │  Code Parser                  │   │    │
│  │  │  Excel Parser   │  │  Metadata Extractor           │   │    │
│  │  └─────────────────┘  └─────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    LLM Context Builder                       │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │  Incluir contenido extraído en el prompt            │    │    │
│  │  │  Formato: "Archivo: {filename}\n{extracted_text}"  │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ALMACENAMIENTO                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Local Storage: /backend/media/uploads/{user_id}/{file_id}  │    │
│  │  OpenSearch: Índice marie_files (metadatos + embeddings)   │    │
│  │  Opcional: S3/MinIO para producción                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Servicio de Procesamiento de Archivos

```python
# backend/app/services/file_service.py
from pathlib import Path
import PyPDF2
from docx import Document
import pandas as pd
from PIL import Image
import pytesseract
from langchain.document_loaders import TextLoader
import openpyxl
import zipfile
import shutil
from typing import Optional, Dict, List

class FileService:
    def __init__(self, upload_dir: str = "media/uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        self.allowed_extensions = {
            # Documentos
            '.pdf', '.docx', '.doc', '.odt',
            # Texto
            '.txt', '.md', '.csv',
            # Código
            '.py', '.js', '.ts', '.java', '.cpp', '.c', '.go', '.rs', 
            '.rb', '.php', '.html', '.css', '.json', '.xml', '.yaml', '.yml',
            # Imágenes
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
            # Hojas de cálculo
            '.xlsx', '.xls', '.ods',
            # Presentaciones
            '.pptx', '.ppt',
            # Comprimidos
            '.zip', '.tar', '.gz'
        }
    
    async def save_file(self, file, user_id: str) -> Dict:
        """Guardar archivo y retornar metadatos"""
        # Validar
        if not self._is_allowed(file.filename):
            raise ValueError(f"Tipo de archivo no permitido: {file.filename}")
        
        if file.content_length > self.max_file_size:
            raise ValueError(f"Archivo muy grande: {file.content_length} bytes")
        
        # Generar ID único
        file_id = f"file_{uuid.uuid4().hex[:16]}"
        file_ext = Path(file.filename).suffix
        user_dir = self.upload_dir / user_id
        user_dir.mkdir(exist_ok=True)
        
        # Guardar archivo
        file_path = user_dir / f"{file_id}{file_ext}"
        file.save(str(file_path))
        
        # Procesar y extraer contenido
        content = await self.extract_content(file_path, file_ext)
        
        return {
            "id": file_id,
            "filename": file.filename,
            "file_path": str(file_path),
            "file_size": file_path.stat().st_size,
            "file_type": file_ext[1:],  # Sin el punto
            "content": content,
            "content_length": len(content) if content else 0,
            "created_at": datetime.utcnow().isoformat()
        }
    
    async def extract_content(self, file_path: Path, file_ext: str) -> str:
        """Extraer contenido de archivo según su tipo"""
        try:
            if file_ext == '.pdf':
                return self._extract_pdf(file_path)
            elif file_ext in ['.docx', '.doc']:
                return self._extract_docx(file_path)
            elif file_ext in ['.txt', '.md']:
                return self._extract_text(file_path)
            elif file_ext == '.csv':
                return self._extract_csv(file_path)
            elif file_ext in ['.xlsx', '.xls']:
                return self._extract_excel(file_path)
            elif file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']:
                return await self._extract_image(file_path)
            elif file_ext in ['.py', '.js', '.ts', '.java', '.cpp', '.c', '.go', 
                             '.rs', '.rb', '.php', '.html', '.css', '.json', 
                             '.xml', '.yaml', '.yml']:
                return self._extract_code(file_path)
            elif file_ext == '.zip':
                return self._extract_zip(file_path)
            else:
                return f"[Archivo {file_ext} no procesable]"
        except Exception as e:
            return f"[Error al procesar archivo: {str(e)}]"
    
    def _extract_pdf(self, file_path: Path) -> str:
        """Extraer texto de PDF"""
        text = []
        with open(file_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            for page in pdf_reader.pages:
                text.append(page.extract_text())
        return "\n".join(text)
    
    def _extract_docx(self, file_path: Path) -> str:
        """Extraer texto de Word"""
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    
    def _extract_text(self, file_path: Path) -> str:
        """Extraer texto plano"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def _extract_csv(self, file_path: Path) -> str:
        """Extraer CSV como texto formateado"""
        df = pd.read_csv(file_path)
        return df.to_string()
    
    def _extract_excel(self, file_path: Path) -> str:
        """Extraer Excel como texto"""
        df = pd.read_excel(file_path)
        return df.to_string()
    
    async def _extract_image(self, file_path: Path) -> str:
        """Extraer texto de imagen con OCR"""
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image, lang='spa+eng')
        return text if text.strip() else f"[Imagen: {file_path.name} - Sin texto detectado]"
    
    def _extract_code(self, file_path: Path) -> str:
        """Extraer código fuente"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def _extract_zip(self, file_path: Path) -> str:
        """Extraer archivos comprimidos"""
        extracted_texts = []
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            temp_dir = file_path.parent / f"{file_path.stem}_extracted"
            zip_ref.extractall(temp_dir)
            
            # Procesar archivos extraídos recursivamente
            for extracted_file in temp_dir.rglob('*'):
                if extracted_file.is_file():
                    ext = extracted_file.suffix
                    if ext in self.allowed_extensions:
                        content = await self.extract_content(extracted_file, ext)
                        extracted_texts.append(f"--- {extracted_file.name} ---\n{content}")
            
            # Limpiar
            shutil.rmtree(temp_dir)
        
        return "\n\n".join(extracted_texts)
    
    def _is_allowed(self, filename: str) -> bool:
        """Verificar si el archivo está permitido"""
        ext = Path(filename).suffix.lower()
        return ext in self.allowed_extensions
    
    def build_prompt_with_files(self, message: str, files: List[Dict]) -> str:
        """Construir prompt incluyendo contenido de archivos"""
        prompt_parts = [message]
        
        for file in files:
            prompt_parts.append(f"\n\n--- Archivo: {file['filename']} ---")
            prompt_parts.append(file['content'])
            prompt_parts.append("--- Fin del archivo ---")
        
        return "\n".join(prompt_parts)
```

### Índice OpenSearch para Archivos

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "filename": { 
        "type": "text",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "file_path": { "type": "keyword", "index": false },
      "file_size": { "type": "long" },
      "file_type": { "type": "keyword" },
      "content": { 
        "type": "text",
        "analyzer": "standard"
      },
      "content_vector": {
        "type": "knn_vector",
        "dimension": 384,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil",
          "engine": "lucene"
        }
      },
      "mime_type": { "type": "keyword" },
      "message_ids": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

### Endpoints de Archivos

#### API de Usuario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/files/upload` | Subir archivo |
| GET | `/api/files/:id` | Obtener información de archivo |
| GET | `/api/files/:id/download` | Descargar archivo |
| DELETE | `/api/files/:id` | Eliminar archivo |
| GET | `/api/files` | Listar archivos del usuario |

#### API de Desarrolladores

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/files/upload` | Subir archivo |
| GET | `/api/v1/files/:id` | Obtener información de archivo |
| GET | `/api/v1/files/:id/download` | Descargar archivo |
| DELETE | `/api/v1/files/:id` | Eliminar archivo |
| GET | `/api/v1/files` | Listar archivos del usuario |

### Componentes Frontend

```typescript
// frontend/components/chat/FileUpload.tsx
import { Upload, FileText, Image, FileCode } from '@ant-design/icons';
import { Upload as AntUpload, message } from 'antd';

interface FileUploadProps {
  onFileUploaded: (fileId: string) => void;
  maxFiles?: number;
}

export function FileUpload({ onFileUploaded, maxFiles = 5 }: FileUploadProps) {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });
      
      const data = await response.json();
      onFileUploaded(data.id);
      message.success(`${file.name} subido correctamente`);
    } catch (error) {
      message.error('Error al subir archivo');
    }
    
    return false; // Prevenir upload automático
  };

  return (
    <AntUpload
      beforeUpload={handleUpload}
      showUploadList={false}
      accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.jpg,.png,.py,.js,.ts"
      maxCount={maxFiles}
    >
      <Button icon={<Upload />}>Adjuntar archivo</Button>
    </AntUpload>
  );
}

// frontend/components/chat/FilePreview.tsx
export function FilePreview({ file }: { file: FileMetadata }) {
  const getIcon = () => {
    if (file.file_type.startsWith('image/')) return <Image />;
    if (['pdf', 'docx', 'doc'].includes(file.file_type)) return <FileText />;
    if (['py', 'js', 'ts', 'java'].includes(file.file_type)) return <FileCode />;
    return <FileText />;
  };

  return (
    <div className="file-preview">
      {getIcon()}
      <span>{file.filename}</span>
      <span className="file-size">({formatFileSize(file.file_size)})</span>
    </div>
  );
}
```

### Integración con Chat

```typescript
// frontend/hooks/useChat.ts - Actualizado
export function useChat() {
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  
  const sendMessage = async (content: string, files?: string[]) => {
    const payload = {
      content,
      conversation_id: currentConversationId,
      file_ids: files || attachedFiles,
      model: selectedModel,
      provider: selectedProvider
    };
    
    socket.emit('send_message', payload);
    setAttachedFiles([]);
  };
  
  return {
    sendMessage,
    attachedFiles,
    setAttachedFiles
  };
}
```

### Límites y Configuración

- **Tamaño máximo por archivo**: 50MB
- **Tamaño máximo total por mensaje**: 100MB
- **Número máximo de archivos por mensaje**: 10
- **Almacenamiento por usuario**: 1GB (configurable)
- **Retención**: Archivos se mantienen mientras exista la conversación

### Procesamiento de Imágenes con Visión

Para análisis avanzado de imágenes, se puede integrar con modelos de visión:

```python
# backend/app/services/vision_service.py
from langchain_community.llms import Ollama
from langchain_core.messages import HumanMessage

class VisionService:
    def __init__(self):
        self.vision_model = Ollama(model="llava")  # Modelo con visión
    
    async def analyze_image(self, image_path: Path, question: str = None) -> str:
        """Analizar imagen con modelo de visión"""
        prompt = question or "Describe esta imagen en detalle"
        
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": str(image_path)}
            ]
        )
        
        response = await self.vision_model.ainvoke([message])
        return response.content
```

---

## 🔗 Referenciar Conversaciones

Marie allows referencing previous conversations in new conversations, allowing the LLM to have context from previous conversations without needing to copy and paste content manually.

### Use Cases

1. **Continue a previous conversation**: "Based on our conversation about Python, how would I implement...?"
2. **Compare results**: "Compare this solution with the one we discussed in the 'Query Optimization' conversation"
3. **Reference previous knowledge**: "Use the context from the 'Data Analysis' conversation to answer"
4. **Topic tracking**: Link related conversations about the same topic

### Arquitectura de Referencias

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Selección de Conversaciones                        │    │
│  │  ┌─────────────────┐      ┌─────────────────────────────┐   │    │
│  │  │  Botón "Referir"│──────│  Modal de búsqueda           │   │    │
│  │  │  [🔗]           │      │  - Búsqueda por título        │   │    │
│  │  └─────────────────┘      │  - Lista de conversaciones    │   │    │
│  │                           │  - Preview de mensajes        │   │    │
│  │                           └──────────────┬──────────────┘   │    │
│  │                                          │ selected_ids     │    │
│  │                                          ▼                  │    │
│  │                           ┌──────────────────────────────┐  │    │
│  │                           │  Envío con referencias      │  │    │
│  │                           │  {                           │  │    │
│  │                           │    content: "...",           │  │    │
│  │                           │    referenced_conv_ids: [...] │  │    │
│  │                           │  }                           │  │    │
│  │                           └──────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR (Flask)                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Reference Service                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐   │    │
│  │  │  Obtener        │  │  Construir contexto             │   │    │
│  │  │  conversaciones │  │  - Mensajes de convs ref        │   │    │
│  │  │  referenciadas   │  │  - Resumen inteligente           │   │    │
│  │  └─────────────────┘  └─────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Context Builder                                  │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │  Prompt con contexto:                                 │    │    │
│  │  │  "Referencias de conversaciones anteriores:           │    │    │
│  │  │   [Conversación 1: título]                            │    │    │
│  │  │   {mensajes relevantes}                                │    │    │
│  │  │   ...                                                  │    │    │
│  │  │   Mensaje actual: {content}"                           │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Servicio de Referencias

```python
# backend/app/services/reference_service.py
from typing import List, Dict, Optional
from opensearchpy import OpenSearch
from datetime import datetime

class ReferenceService:
    def __init__(self, opensearch_service):
        self.opensearch = opensearch_service
    
    async def get_referenced_conversations(
        self, 
        conversation_ids: List[str],
        user_id: str,
        max_messages_per_conv: int = 20
    ) -> List[Dict]:
        """Obtener conversaciones referenciadas con sus mensajes"""
        referenced_convs = []
        
        for conv_id in conversation_ids:
            # Verificar que la conversación pertenece al usuario
            conv = await self.opensearch.get_conversation(conv_id)
            if not conv or conv["user_id"] != user_id:
                continue
            
            # Obtener mensajes de la conversación
            messages = await self.opensearch.get_conversation_messages(
                conv_id, 
                limit=max_messages_per_conv
            )
            
            referenced_convs.append({
                "id": conv_id,
                "title": conv.get("title", "Untitled"),
                "created_at": conv.get("created_at"),
                "messages": messages,
                "message_count": len(messages)
            })
        
        return referenced_convs
    
    async def build_context_with_references(
        self,
        user_message: str,
        referenced_conv_ids: List[str],
        user_id: str,
        include_full_history: bool = False
    ) -> str:
        """Construir prompt incluyendo contexto de conversaciones referenciadas"""
        if not referenced_conv_ids:
            return user_message
        
        referenced_convs = await self.get_referenced_conversations(
            referenced_conv_ids,
            user_id,
            max_messages_per_conv=50 if include_full_history else 20
        )
        
        if not referenced_convs:
            return user_message
        
        context_parts = [
            "=== CONTEXTO DE CONVERSACIONES ANTERIORES ===\n"
        ]
        
        for conv in referenced_convs:
            context_parts.append(f"\n--- Conversación: {conv['title']} ---")
            context_parts.append(f"(ID: {conv['id']}, {conv['message_count']} mensajes)\n")
            
            # Incluir mensajes relevantes
            for msg in conv["messages"]:
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                
                if role == "user":
                    context_parts.append(f"Usuario: {content}")
                elif role == "assistant":
                    context_parts.append(f"Asistente: {content}")
            
            context_parts.append("--- Fin de conversación ---\n")
        
        context_parts.append("\n=== FIN DEL CONTEXTO ===\n")
        context_parts.append(f"\nMensaje actual del usuario: {user_message}")
        
        return "\n".join(context_parts)
    
    async def get_conversation_summary(
        self,
        conversation_id: str,
        user_id: str
    ) -> Optional[Dict]:
        """Obtener resumen de una conversación para preview"""
        conv = await self.opensearch.get_conversation(conversation_id)
        if not conv or conv["user_id"] != user_id:
            return None
        
        # Obtener primeros y últimos mensajes
        messages = await self.opensearch.get_conversation_messages(
            conversation_id,
            limit=5
        )
        
        return {
            "id": conversation_id,
            "title": conv.get("title", "Untitled"),
            "message_count": conv.get("message_count", 0),
            "created_at": conv.get("created_at"),
            "last_message_at": conv.get("last_message_at"),
            "preview_messages": messages[:3],  # Primeros 3 mensajes
            "model": conv.get("model"),
            "provider": conv.get("provider")
        }
    
    async def search_conversations_for_reference(
        self,
        user_id: str,
        query: str,
        limit: int = 10
    ) -> List[Dict]:
        """Buscar conversaciones para referenciar"""
        # Búsqueda full-text en títulos y mensajes
        conversations = await self.opensearch.search_conversations(
            user_id=user_id,
            query=query,
            limit=limit
        )
        
        # Enriquecer con preview
        results = []
        for conv in conversations:
            summary = await self.get_conversation_summary(conv["id"], user_id)
            if summary:
                results.append(summary)
        
        return results
```

### Actualización del Modelo de Mensajes

```python
# backend/app/models/message.py
from pydantic import BaseModel
from typing import Optional, List

class Message(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    role: str  # "user" | "assistant"
    content: str
    referenced_conversation_ids: Optional[List[str]] = None  # Nuevo campo
    file_ids: Optional[List[str]] = None
    tokens_used: Optional[int] = None
    metadata: Optional[dict] = None
    created_at: str
```

### Actualización del Índice de Mensajes

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "conversation_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "role": { "type": "keyword" },
      "content": { 
        "type": "text",
        "analyzer": "standard"
      },
      "referenced_conversation_ids": { 
        "type": "keyword"  // Array de IDs de conversaciones referenciadas
      },
      "file_ids": { "type": "keyword" },
      "content_vector": {
        "type": "knn_vector",
        "dimension": 384
      },
      "tokens_used": { "type": "integer" },
      "metadata": { "type": "object", "enabled": true },
      "created_at": { "type": "date" }
    }
  }
}
```

### Endpoints de API

#### API de Usuario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/conversations/search` | Buscar conversaciones para referenciar |
| GET | `/api/conversations/:id/summary` | Obtener resumen de conversación |
| GET | `/api/conversations/:id/preview` | Preview de mensajes de conversación |

#### API de Desarrolladores

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/conversations/search` | Buscar conversaciones para referenciar |
| GET | `/api/v1/conversations/:id/summary` | Obtener resumen de conversación |
| GET | `/api/v1/conversations/:id/preview` | Preview de mensajes de conversación |

### Componentes Frontend

```typescript
// frontend/components/chat/ConversationReference.tsx
import { useState } from 'react';
import { Modal, Input, List, Button, Tag } from 'antd';
import { LinkOutlined, SearchOutlined } from '@ant-design/icons';

interface ConversationReferenceProps {
  onSelect: (conversationIds: string[]) => void;
  selectedIds: string[];
}

export function ConversationReference({ 
  onSelect, 
  selectedIds 
}: ConversationReferenceProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setConversations([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        }
      );
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error searching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (convId: string) => {
    if (selectedIds.includes(convId)) {
      onSelect(selectedIds.filter(id => id !== convId));
    } else {
      onSelect([...selectedIds, convId]);
    }
  };

  return (
    <>
      <Button
        icon={<LinkOutlined />}
        onClick={() => setVisible(true)}
        type="dashed"
      >
        Referenciar conversación
      </Button>

      <Modal
        title="Referenciar conversaciones"
        open={visible}
        onCancel={() => setVisible(false)}
        onOk={() => setVisible(false)}
        width={800}
      >
        <Input
          placeholder="Buscar conversaciones..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <List
          loading={loading}
          dataSource={conversations}
          renderItem={(conv) => (
            <List.Item
              onClick={() => handleSelect(conv.id)}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedIds.includes(conv.id) 
                  ? '#e6f7ff' 
                  : 'transparent'
              }}
            >
              <List.Item.Meta
                title={
                  <div>
                    {conv.title}
                    {selectedIds.includes(conv.id) && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        Seleccionada
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div>
                    <div>{conv.message_count} mensajes</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {conv.preview_messages?.[0]?.content?.substring(0, 100)}...
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
}

// frontend/components/chat/ReferenceBadge.tsx
export function ReferenceBadge({ 
  conversationId, 
  title 
}: { 
  conversationId: string; 
  title: string;
}) {
  return (
    <Tag
      icon={<LinkOutlined />}
      color="blue"
      style={{ cursor: 'pointer' }}
      onClick={() => {
        // Navegar a la conversación referenciada
        window.location.href = `/chat/${conversationId}`;
      }}
    >
      {title}
    </Tag>
  );
}

// frontend/components/chat/MessageBubble.tsx - Actualizado
export function MessageBubble({ message }: { message: Message }) {
  return (
    <div className="message-bubble">
      <div className="message-content">
        {message.content}
      </div>
      
      {message.referenced_conversation_ids && 
       message.referenced_conversation_ids.length > 0 && (
        <div className="message-references">
          <div className="references-label">Referencias:</div>
          {message.referenced_conversation_ids.map((convId) => (
            <ReferenceBadge
              key={convId}
              conversationId={convId}
              title={getConversationTitle(convId)}
            />
          ))}
        </div>
      )}
      
      {message.file_ids && message.file_ids.length > 0 && (
        <FilePreview files={message.file_ids} />
      )}
    </div>
  );
}
```

### Integración con Chat

```typescript
// frontend/hooks/useChat.ts - Actualizado
export function useChat() {
  const [referencedConversations, setReferencedConversations] = useState<string[]>([]);
  
  const sendMessage = async (
    content: string, 
    files?: string[],
    referencedConvs?: string[]
  ) => {
    const payload = {
      content,
      conversation_id: currentConversationId,
      file_ids: files || [],
      referenced_conversation_ids: referencedConvs || referencedConversations,
      model: selectedModel,
      provider: selectedProvider
    };
    
    socket.emit('send_message', payload);
    setReferencedConversations([]);
  };
  
  return {
    sendMessage,
    referencedConversations,
    setReferencedConversations
  };
}
```

### Actualización de WebSocket

```typescript
// El evento send_message ahora incluye referenced_conversation_ids
{
  "conversation_id": "conv_123",
  "content": "Basándote en nuestra conversación anterior...",
  "model": "llama3.2",
  "provider": "ollama",
  "file_ids": ["file_123"],
  "referenced_conversation_ids": ["conv_456", "conv_789"]  // Nuevo campo
}
```

### Ejemplo de Uso en API de Desarrolladores

```bash
POST /api/v1/chat/completions
X-API-Key: mc_abc123...
Content-Type: application/json

{
  "message": "Compara esta solución con la que discutimos antes",
  "conversation_id": "conv_123",
  "model": "llama3.2",
  "provider": "ollama",
  "referenced_conversation_ids": ["conv_456", "conv_789"]
}
```

### Límites y Configuración

- **Máximo de conversaciones referenciadas por mensaje**: 5
- **Máximo de mensajes por conversación referenciada**: 50 (configurable)
- **Búsqueda**: Hasta 20 resultados por búsqueda
- **Caché**: Las conversaciones referenciadas se cachean por 5 minutos

### Optimizaciones

1. **Resumen inteligente**: Para conversaciones muy largas, generar un resumen en lugar de incluir todos los mensajes
2. **Relevancia**: Incluir solo mensajes relevantes usando búsqueda semántica
3. **Caché**: Cachear conversaciones frecuentemente referenciadas
4. **Lazy loading**: Cargar mensajes de conversaciones referenciadas solo cuando se necesiten

---

## 🧠 Memoria Conversacional y Multilingüe

Marie implementa un sistema de memoria conversacional que permite recordar información importante sobre el usuario y las conversaciones, manteniendo contexto entre sesiones y soportando múltiples idiomas.

### Arquitectura de Memoria

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MEMORIA CONVERSACIONAL                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Extracción de Información                                    │   │
│  │  - Preferencias del usuario                                   │   │
│  │  - Hechos y datos importantes                                 │   │
│  │  - Contexto de conversaciones                                 │   │
│  │  - Detección de idioma                                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Almacenamiento (OpenSearch: marie_memory)                   │   │
│  │  - Memoria persistente por usuario                           │   │
│  │  - Embeddings multilingües                                   │   │
│  │  - Metadata (fecha, fuente, importancia)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Recuperación Contextual                                      │   │
│  │  - Búsqueda semántica relevante                              │   │
│  │  - Contexto de conversación actual                           │   │
│  │  - Resumen de información importante                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Tipos de Memoria

1. **Memoria de Usuario**: Preferencias, datos personales, contexto general
2. **Memoria de Conversación**: Información específica de una conversación
3. **Memoria de Sesión**: Contexto temporal durante una sesión activa
4. **Memoria de Hechos**: Información factual extraída de conversaciones

### Índice OpenSearch para Memoria

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "conversation_id": { "type": "keyword" },
      "memory_type": { 
        "type": "keyword"  // "user", "conversation", "session", "fact"
      },
      "content": { 
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "content_vector": {
        "type": "knn_vector",
        "dimension": 384,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil",
          "engine": "lucene"
        }
      },
      "language": { "type": "keyword" },  // "es", "en", "fr", etc.
      "category": { "type": "keyword" },  // "preference", "fact", "context", etc.
      "importance": { "type": "float" },  // 0.0 - 1.0
      "source_message_id": { "type": "keyword" },
      "extracted_at": { "type": "date" },
      "last_accessed_at": { "type": "date" },
      "access_count": { "type": "integer" },
      "metadata": { "type": "object", "enabled": true },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

### Servicio de Memoria

```python
# backend/app/services/memory_service.py
from typing import List, Dict, Optional
from opensearchpy import OpenSearch
from langdetect import detect
from datetime import datetime
import uuid

class MemoryService:
    def __init__(self, opensearch_service, embedding_service):
        self.opensearch = opensearch_service
        self.embedding_service = embedding_service
        self.index = "marie_memory"
    
    async def extract_memory(
        self,
        user_id: str,
        conversation_id: str,
        message_content: str,
        memory_type: str = "fact"
    ) -> Optional[Dict]:
        """Extraer información importante de un mensaje"""
        # Detectar idioma
        try:
            language = detect(message_content)
        except:
            language = "es"  # Default
        
        # Usar LLM para extraer información importante
        extraction_prompt = f"""
        Extrae información importante de este mensaje que debería recordarse:
        
        Mensaje: {message_content}
        
        Extrae:
        1. Preferencias del usuario
        2. Hechos importantes
        3. Contexto relevante
        4. Información personal
        
        Formato JSON:
        {{
            "content": "resumen de la información",
            "category": "preference|fact|context|personal",
            "importance": 0.0-1.0,
            "key_points": ["punto1", "punto2"]
        }}
        """
        
        # Llamar a LLM para extracción (simplificado)
        extracted_info = await self._call_extraction_llm(extraction_prompt)
        
        if not extracted_info or extracted_info.get("importance", 0) < 0.3:
            return None
        
        # Generar embedding
        content = extracted_info.get("content", message_content)
        embedding = await self.embedding_service.generate_embedding(content, language)
        
        # Guardar en memoria
        memory_id = str(uuid.uuid4())
        memory_doc = {
            "id": memory_id,
            "user_id": user_id,
            "conversation_id": conversation_id,
            "memory_type": memory_type,
            "content": content,
            "content_vector": embedding,
            "language": language,
            "category": extracted_info.get("category", "fact"),
            "importance": extracted_info.get("importance", 0.5),
            "key_points": extracted_info.get("key_points", []),
            "source_message_id": message_content[:50],  # Simplificado
            "extracted_at": datetime.utcnow().isoformat(),
            "last_accessed_at": datetime.utcnow().isoformat(),
            "access_count": 0,
            "metadata": {},
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self.opensearch.client.index(
            index=self.index,
            id=memory_id,
            body=memory_doc
        )
        
        return memory_doc
    
    async def retrieve_relevant_memory(
        self,
        user_id: str,
        query: str,
        conversation_id: str = None,
        language: str = None,
        limit: int = 5
    ) -> List[Dict]:
        """Recuperar memoria relevante para una consulta"""
        # Detectar idioma si no se proporciona
        if not language:
            try:
                language = detect(query)
            except:
                language = "es"
        
        # Generar embedding de la consulta
        query_embedding = await self.embedding_service.generate_embedding(query, language)
        
        # Construir query de búsqueda
        bool_query = {
            "must": [
                {
                    "knn": {
                        "content_vector": {
                            "vector": query_embedding,
                            "k": limit * 2  # Buscar más para filtrar
                        }
                    }
                }
            ],
            "filter": [
                {"term": {"user_id": user_id}},
                {"range": {"importance": {"gte": 0.3}}}  # Solo memoria importante
            ]
        }
        
        if conversation_id:
            # Incluir memoria de la conversación actual
            bool_query["should"] = [
                {"term": {"conversation_id": conversation_id}},
                {"term": {"memory_type": "user"}}  # Siempre incluir memoria de usuario
            ]
            bool_query["minimum_should_match"] = 1
        
        query_body = {
            "query": {"bool": bool_query},
            "size": limit,
            "sort": [
                {"importance": {"order": "desc"}},
                {"last_accessed_at": {"order": "desc"}}
            ]
        }
        
        result = self.opensearch.client.search(index=self.index, body=query_body)
        
        memories = []
        for hit in result["hits"]["hits"]:
            memory = hit["_source"]
            # Actualizar acceso
            self._update_access(memory["id"])
            memories.append(memory)
        
        return memories
    
    async def build_context_with_memory(
        self,
        user_id: str,
        current_message: str,
        conversation_id: str = None
    ) -> str:
        """Construir contexto incluyendo memoria relevante"""
        # Recuperar memoria relevante
        memories = await self.retrieve_relevant_memory(
            user_id=user_id,
            query=current_message,
            conversation_id=conversation_id
        )
        
        if not memories:
            return current_message
        
        # Construir contexto
        context_parts = ["=== INFORMACIÓN RECORDADA ===\n"]
        
        for memory in memories:
            lang_info = f" (Idioma: {memory.get('language', 'es')})" if memory.get('language') != 'es' else ""
            context_parts.append(f"[{memory.get('category', 'fact').upper()}] {memory['content']}{lang_info}")
            if memory.get('key_points'):
                for point in memory['key_points']:
                    context_parts.append(f"  - {point}")
        
        context_parts.append("\n=== FIN DE INFORMACIÓN RECORDADA ===\n")
        context_parts.append(f"\nMensaje actual: {current_message}")
        
        return "\n".join(context_parts)
    
    def _update_access(self, memory_id: str):
        """Actualizar estadísticas de acceso"""
        self.opensearch.client.update(
            index=self.index,
            id=memory_id,
            body={
                "script": {
                    "source": "ctx._source.last_accessed_at = params.now; ctx._source.access_count += 1",
                    "params": {"now": datetime.utcnow().isoformat()}
                }
            }
        )
    
    async def _call_extraction_llm(self, prompt: str) -> Dict:
        """Llamar a LLM para extracción (simplificado)"""
        # Implementar llamada real a LLM
        # Por ahora retornar estructura básica
        return {
            "content": "Información extraída",
            "category": "fact",
            "importance": 0.5,
            "key_points": []
        }
```

### Soporte Multilingüe

```python
# backend/app/services/embedding_service.py - Actualizado
from sentence_transformers import SentenceTransformer
import langdetect

class EmbeddingService:
    def __init__(self):
        # Modelo multilingüe
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    
    async def generate_embedding(self, text: str, language: str = None) -> List[float]:
        """Generar embedding multilingüe"""
        # Detectar idioma si no se proporciona
        if not language:
            try:
                language = langdetect.detect(text)
            except:
                language = "es"
        
        # El modelo multilingüe maneja múltiples idiomas automáticamente
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
```

---

## 💬 Follow-Up Questions (Preguntas de Seguimiento)

Marie genera automáticamente preguntas de seguimiento relevantes después de cada respuesta del asistente, permitiendo que el usuario continúe la conversación de manera natural.

### Arquitectura de Follow-Up

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GENERACIÓN DE FOLLOW-UP                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Respuesta del Asistente                                      │   │
│  │  + Contexto de conversación                                   │   │
│  │  + Memoria relevante                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  LLM Generación de Follow-Up                                  │   │
│  │  - Analizar respuesta                                         │   │
│  │  - Identificar puntos de profundización                       │   │
│  │  - Generar 3-5 preguntas relevantes                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Filtrado y Ranking                                           │   │
│  │  - Eliminar duplicados                                        │   │
│  │  - Priorizar preguntas relevantes                             │   │
│  │  - Formatear para UI                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Servicio de Follow-Up

```python
# backend/app/services/followup_service.py
from typing import List, Dict
from langchain.prompts import PromptTemplate

class FollowUpService:
    def __init__(self, llm_service):
        self.llm_service = llm_service
        self.followup_prompt = PromptTemplate(
            input_variables=["assistant_response", "conversation_context", "memory_context"],
            template="""
Basándote en la siguiente respuesta del asistente y el contexto de la conversación, 
genera 3-5 preguntas de seguimiento relevantes que el usuario podría querer hacer.

Respuesta del asistente:
{assistant_response}

Contexto de conversación:
{conversation_context}

Memoria relevante:
{memory_context}

Genera preguntas que:
1. Profundicen en el tema discutido
2. Exploren aspectos relacionados
3. Sean naturales y conversacionales
4. Estén en el mismo idioma que la conversación

Formato JSON:
{{
    "questions": [
        "¿pregunta 1?",
        "¿pregunta 2?",
        "¿pregunta 3?",
        "¿pregunta 4?",
        "¿pregunta 5?"
    ],
    "language": "es|en|fr|..."
}}

Solo retorna el JSON, sin texto adicional.
"""
        )
    
    async def generate_followup_questions(
        self,
        assistant_response: str,
        conversation_context: str = "",
        memory_context: str = "",
        language: str = "es"
    ) -> List[str]:
        """Generar preguntas de seguimiento"""
        prompt = self.followup_prompt.format(
            assistant_response=assistant_response,
            conversation_context=conversation_context,
            memory_context=memory_context
        )
        
        # Llamar a LLM
        response = await self.llm_service.generate(
            prompt=prompt,
            temperature=0.7,
            max_tokens=200
        )
        
        # Parsear respuesta JSON
        try:
            import json
            # Limpiar respuesta (puede tener markdown code blocks)
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            parsed = json.loads(response_text)
            questions = parsed.get("questions", [])
            
            # Validar y filtrar
            valid_questions = [
                q for q in questions 
                if q and len(q.strip()) > 10 and len(q.strip()) < 200
            ]
            
            return valid_questions[:5]  # Máximo 5 preguntas
        except Exception as e:
            print(f"Error parsing follow-up questions: {e}")
            return []
    
    async def generate_contextual_followups(
        self,
        user_id: str,
        conversation_id: str,
        assistant_response: str,
        last_messages: List[Dict]
    ) -> List[str]:
        """Generar follow-ups con contexto completo"""
        # Construir contexto de conversación
        conversation_context = "\n".join([
            f"{msg.get('role', 'unknown')}: {msg.get('content', '')[:200]}"
            for msg in last_messages[-5:]  # Últimos 5 mensajes
        ])
        
        # Obtener memoria relevante
        memory_service = MemoryService(...)  # Inyectar
        memories = await memory_service.retrieve_relevant_memory(
            user_id=user_id,
            query=assistant_response,
            conversation_id=conversation_id,
            limit=3
        )
        
        memory_context = "\n".join([
            mem.get("content", "") for mem in memories
        ])
        
        # Detectar idioma
        try:
            from langdetect import detect
            language = detect(assistant_response)
        except:
            language = "es"
        
        # Generar follow-ups
        followups = await self.generate_followup_questions(
            assistant_response=assistant_response,
            conversation_context=conversation_context,
            memory_context=memory_context,
            language=language
        )
        
        return followups
```

---

## 📋 Historial de Conversaciones

Marie mantiene un historial completo y navegable de todas las conversaciones, permitiendo a los usuarios revisar, buscar y navegar fácilmente por sus chats anteriores.

### Visualización de Historial

```typescript
// frontend/components/chat/ConversationHistory.tsx
import { useState, useEffect, useRef } from 'react';
import { List, Button, Spin, Empty } from 'antd';
import { MessageBubble } from './MessageBubble';

interface ConversationHistoryProps {
  conversationId: string;
  onLoadMore?: () => void;
}

export function ConversationHistory({ 
  conversationId, 
  onLoadMore 
}: ConversationHistoryProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMessages = async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?page=${pageNum}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        }
      );
      
      const data = await response.json();
      const newMessages = data.messages || [];
      
      if (append) {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      } else {
        setMessages(newMessages.reverse());
      }
      
      setHasMore(data.has_more || false);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(1);
  }, [conversationId]);

  // Scroll infinito - cargar más al llegar al top
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadMessages(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, page]);

  // Scroll a último mensaje cuando se agrega nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="conversation-history">
      {hasMore && (
        <div id="load-more-trigger" style={{ height: '1px' }} />
      )}
      
      {loading && messages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      )}
      
      {messages.length === 0 && !loading && (
        <Empty description="No hay mensajes en esta conversación" />
      )}
      
      <List
        dataSource={messages}
        renderItem={(message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            showFollowUps={index === messages.length - 1}
          />
        )}
      />
      
      <div ref={messagesEndRef} />
    </div>
  );
}
```

### Filtros y Ordenamiento

```typescript
// frontend/components/chat/HistoryFilters.tsx
import { Select, DatePicker, Space } from 'antd';

export function HistoryFilters({ 
  onFilterChange 
}: { 
  onFilterChange: (filters: any) => void;
}) {
  return (
    <Space>
      <Select
        placeholder="Ordenar por"
        defaultValue="newest"
        onChange={(value) => onFilterChange({ sort: value })}
        options={[
          { label: 'Más recientes', value: 'newest' },
          { label: 'Más antiguos', value: 'oldest' },
          { label: 'Por relevancia', value: 'relevance' }
        ]}
      />
      
      <DatePicker
        placeholder="Filtrar por fecha"
        onChange={(date) => onFilterChange({ date: date?.toISOString() })}
      />
      
      <Select
        placeholder="Tipo de mensaje"
        mode="multiple"
        onChange={(value) => onFilterChange({ messageTypes: value })}
        options={[
          { label: 'Usuario', value: 'user' },
          { label: 'Asistente', value: 'assistant' },
          { label: 'Con archivos', value: 'with_files' }
        ]}
      />
    </Space>
  );
}
```

---

## 🎯 Sugerencias de Preguntas al Inicio

Marie muestra sugerencias de preguntas al inicio de cada conversación, ayudando a los usuarios a comenzar de manera productiva.

### Componente de Sugerencias

```typescript
// frontend/components/chat/WelcomeScreen.tsx
import { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Tag } from 'antd';
import { BulbOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface WelcomeScreenProps {
  onQuestionSelect: (question: string) => void;
  userHistory?: any[];
}

export function WelcomeScreen({ 
  onQuestionSelect, 
  userHistory 
}: WelcomeScreenProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Sugerencias predeterminadas
  const defaultSuggestions = {
    es: [
      "¿Cómo puedo mejorar mi código Python?",
      "Explícame conceptos de machine learning",
      "Ayúdame a diseñar una base de datos",
      "Revisa este error en mi código",
      "Genera ideas para mi proyecto"
    ],
    en: [
      "How can I improve my Python code?",
      "Explain machine learning concepts",
      "Help me design a database",
      "Review this error in my code",
      "Generate ideas for my project"
    ]
  };

  useEffect(() => {
    loadSuggestions();
  }, [userHistory]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      // Obtener sugerencias contextuales del backend
      const response = await fetch('/api/suggestions/questions', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        // Usar sugerencias por defecto según idioma detectado
        const language = navigator.language.split('-')[0] || 'es';
        setSuggestions(defaultSuggestions[language] || defaultSuggestions.es);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      const language = navigator.language.split('-')[0] || 'es';
      setSuggestions(defaultSuggestions[language] || defaultSuggestions.es);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-header">
        <Title level={2}>
          <BulbOutlined /> ¡Hola! Soy Marie
        </Title>
        <Text type="secondary">
          Tu asistente de IA para investigación y desarrollo. 
          ¿En qué puedo ayudarte hoy?
        </Text>
      </div>

      <div className="suggestions-section">
        <Title level={4}>
          <ThunderboltOutlined /> Sugerencias para comenzar
        </Title>
        
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              hoverable
              onClick={() => onQuestionSelect(suggestion)}
              style={{ cursor: 'pointer' }}
            >
              <Text>{suggestion}</Text>
            </Card>
          ))}
        </Space>
      </div>

      {userHistory && userHistory.length > 0 && (
        <div className="recent-conversations">
          <Title level={4}>Conversaciones recientes</Title>
          <Space wrap>
            {userHistory.slice(0, 3).map((conv) => (
              <Tag
                key={conv.id}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => window.location.href = `/chat/${conv.id}`}
              >
                {conv.title}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
}
```

### Servicio de Sugerencias

```python
# backend/app/services/suggestion_service.py
from typing import List, Dict
from opensearchpy import OpenSearch

class SuggestionService:
    def __init__(self, opensearch_service, memory_service):
        self.opensearch = opensearch_service
        self.memory_service = memory_service
    
    async def get_contextual_suggestions(
        self,
        user_id: str,
        language: str = "es"
    ) -> List[str]:
        """Generar sugerencias contextuales basadas en historial y memoria"""
        # Obtener conversaciones recientes
        recent_convs = await self.opensearch.get_user_conversations(
            user_id=user_id,
            limit=5
        )
        
        # Obtener memoria relevante
        memories = await self.memory_service.retrieve_relevant_memory(
            user_id=user_id,
            query="",  # Sin query específica, obtener memoria general
            limit=5
        )
        
        # Generar sugerencias basadas en contexto
        suggestions = []
        
        # Sugerencias basadas en conversaciones recientes
        if recent_convs:
            topics = [conv.get("title", "") for conv in recent_convs]
            suggestions.extend([
                f"Continúa el tema: {topic}" for topic in topics[:2]
            ])
        
        # Sugerencias basadas en memoria
        if memories:
            for memory in memories[:2]:
                if memory.get("category") == "preference":
                    suggestions.append(f"Basándote en mi preferencia: {memory.get('content', '')[:50]}...")
        
        # Sugerencias por defecto según idioma
        default_suggestions = self._get_default_suggestions(language)
        suggestions.extend(default_suggestions)
        
        # Retornar máximo 5 sugerencias únicas
        return list(dict.fromkeys(suggestions))[:5]
    
    def _get_default_suggestions(self, language: str) -> List[str]:
        """Obtener sugerencias por defecto según idioma"""
        suggestions = {
            "es": [
                "¿Cómo puedo mejorar mi código?",
                "Explícame conceptos avanzados",
                "Ayúdame a resolver un problema",
                "Genera ideas para mi proyecto"
            ],
            "en": [
                "How can I improve my code?",
                "Explain advanced concepts",
                "Help me solve a problem",
                "Generate ideas for my project"
            ],
            "fr": [
                "Comment puis-je améliorer mon code?",
                "Expliquez-moi des concepts avancés",
                "Aidez-moi à résoudre un problème",
                "Générez des idées pour mon projet"
            ]
        }
        return suggestions.get(language, suggestions["es"])
```

### Configuración de Modelos de Embedding, TTS y STT

El panel de administración permite configurar los modelos de HuggingFace utilizados para embeddings, texto a voz (TTS) y voz a texto (STT).

#### Default Embedding Models (HuggingFace)

| Model | Dimension | Description |
|-------|-----------|-------------|
| `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | 384 | **Recommended** - Multilingual, fast, good quality |
| `sentence-transformers/all-MiniLM-L6-v2` | 384 | English, very fast |
| `sentence-transformers/paraphrase-multilingual-mpnet-base-v2` | 768 | Multilingual, high quality, slower |
| `intfloat/multilingual-e5-base` | 768 | Multilingual, excellent quality |

#### Default TTS Models (HuggingFace)

| Model | Language | Description |
|-------|----------|-------------|
| `coqui/XTTS-v2` | Multilingual | **Recommended** - High quality, multiple languages |
| `microsoft/speecht5_tts` | Multilingual | Microsoft SpeechT5 |
| `facebook/mms-tts-spa` | Spanish | Facebook MMS for Spanish |
| `facebook/fastspeech2-en-ljspeech` | English | FastSpeech2 for English |

#### Default STT Models (HuggingFace)

| Model | Language | Description |
|-------|----------|-------------|
| `openai/whisper-base` | Multilingual | **Recommended** - Speed/accuracy balance |
| `openai/whisper-small` | Multilingual | Higher accuracy than base |
| `openai/whisper-medium` | Multilingual | High accuracy, slower |
| `facebook/wav2vec2-base-960h` | English | Facebook Wav2Vec2 base |
| `facebook/wav2vec2-large-960h-lv60-self` | English | Wav2Vec2 large, high accuracy |

### View User Chat History

Administrators can view the complete history of conversations and messages from any user, including model responses.

**Endpoints:**
- `GET /api/admin/users/:id/conversations` - List conversations of a user
- `GET /api/admin/conversations/:id/messages` - View messages of a conversation

**Features:**
- Complete conversation visualization
- Filter by user
- Message visualization with model information used
- Tokens used per message
- Dates and timestamps

### API Key Generation System

The administration panel allows generating API keys for both end users and developers.

**API Key Types:**
1. **User API Key**: For access to the user API (limited)
2. **Developer API Key**: For full access to the developer API

**Features:**
- Generation with descriptive name
- Expiration configuration (optional)
- Configurable rate limits
- Usage and statistics visualization
- Key revocation

**Endpoints:**
- `GET /api/admin/api-keys` - Listar todas las API keys
- `POST /api/admin/api-keys` - Crear nueva API key
- `DELETE /api/admin/api-keys/:id` - Eliminar API key

---

## 🗄️ Database (OpenSearch)

### ¿Por qué OpenSearch?

| Característica | Beneficio para Marie |
|----------------|---------------------------|
| **Búsqueda Full-Text** | Buscar en historial de conversaciones con relevancia |
| **Búsqueda Vectorial (k-NN)** | RAG y semantic search sobre mensajes |
| **Escalabilidad** | Clusters distribuidos para alta disponibilidad |
| **Aggregations** | Analytics sobre uso de chat |
| **Flexibilidad** | Schema-less, fácil evolución de datos |

### Índices de OpenSearch

#### Índice: `marie_users`

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "email": { "type": "keyword" },
      "password_hash": { "type": "keyword", "index": false },
      "full_name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "avatar_url": { "type": "keyword", "index": false },
      "is_active": { "type": "boolean" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  },
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  }
}
```

#### Índice: `marie_conversations`

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "title": { 
        "type": "text",
        "analyzer": "standard",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "model": { "type": "keyword" },
      "provider": { "type": "keyword" },
      "system_prompt": { "type": "text" },
      "settings": { "type": "object", "enabled": true },
      "message_count": { "type": "integer" },
      "last_message_at": { "type": "date" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  },
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1
  }
}
```

#### Índice: `marie_messages` (con vectores para RAG)

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "conversation_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "role": { "type": "keyword" },
      "content": { 
        "type": "text",
        "analyzer": "standard",
        "fields": { 
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "content_vector": {
        "type": "knn_vector",
        "dimension": 384,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil",
          "engine": "lucene",
          "parameters": {
            "ef_construction": 128,
            "m": 16
          }
        }
      },
      "tokens_used": { "type": "integer" },
      "metadata": { "type": "object", "enabled": true },
      "created_at": { "type": "date" }
    }
  },
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "index.knn": true
  }
}
```

#### Índice: `marie_api_keys`

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "name": { 
        "type": "text",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "key_hash": { "type": "keyword" },
      "is_active": { "type": "boolean" },
      "last_used_at": { "type": "date" },
      "usage_count": { "type": "integer" },
      "expires_at": { "type": "date" },
      "rate_limit": { "type": "integer" },
      "created_at": { "type": "date" }
    }
  },
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  }
}
```

### Servicio OpenSearch (Python)

```python
# backend/app/services/opensearch_service.py
from opensearchpy import OpenSearch, helpers
from datetime import datetime
import uuid

class OpenSearchService:
    def __init__(self, hosts: list, auth: tuple = None):
        self.client = OpenSearch(
            hosts=hosts,
            http_auth=auth,
            use_ssl=True,
            verify_certs=False,
            ssl_show_warn=False
        )
    
    # ==================== USERS ====================
    
    async def create_user(
        self, 
        email: str, 
        password_hash: str, 
        full_name: str = None,
        role: str = "user",
        created_by: str = None
    ) -> dict:
        user_id = str(uuid.uuid4())
        roles = [role] if role else ["user"]
        permissions = self._get_default_permissions(role)
        
        doc = {
            "id": user_id,
            "email": email,
            "password_hash": password_hash,
            "full_name": full_name,
            "role": role,
            "roles": roles,
            "permissions": permissions,
            "is_active": True,
            "is_email_verified": False,
            "last_login_at": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": created_by,
            "metadata": {}
        }
        self.client.index(index="marie_users", id=user_id, body=doc)
        return doc
    
    def _get_default_permissions(self, role: str) -> dict:
        """Obtener permisos por defecto según rol"""
        if role == "admin":
            return {
                "can_create_users": True,
                "can_manage_system": True,
                "can_view_logs": True,
                "can_manage_models": True
            }
        else:
            return {
                "can_create_users": False,
                "can_manage_system": False,
                "can_view_logs": False,
                "can_manage_models": False
            }
    
    async def get_user_by_email(self, email: str) -> dict | None:
        query = {"query": {"term": {"email": email}}}
        result = self.client.search(index="marie_users", body=query)
        hits = result["hits"]["hits"]
        return hits[0]["_source"] if hits else None
    
    # ==================== CONVERSATIONS ====================
    
    async def create_conversation(self, user_id: str, model: str, provider: str, 
                                   title: str = None, system_prompt: str = None) -> dict:
        conv_id = str(uuid.uuid4())
        doc = {
            "id": conv_id,
            "user_id": user_id,
            "title": title or "New Conversation",
            "model": model,
            "provider": provider,
            "system_prompt": system_prompt,
            "settings": {},
            "message_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        self.client.index(index="marie_conversations", id=conv_id, body=doc)
        return doc
    
    async def get_user_conversations(self, user_id: str, limit: int = 50) -> list:
        query = {
            "query": {"term": {"user_id": user_id}},
            "sort": [{"updated_at": {"order": "desc"}}],
            "size": limit
        }
        result = self.client.search(index="marie_conversations", body=query)
        return [hit["_source"] for hit in result["hits"]["hits"]]
    
    # ==================== MESSAGES ====================
    
    async def create_message(self, conversation_id: str, user_id: str, 
                              role: str, content: str, 
                              content_vector: list = None,
                              tokens_used: int = None) -> dict:
        msg_id = str(uuid.uuid4())
        doc = {
            "id": msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "tokens_used": tokens_used,
            "metadata": {},
            "created_at": datetime.utcnow().isoformat()
        }
        if content_vector:
            doc["content_vector"] = content_vector
        
        self.client.index(index="marie_messages", id=msg_id, body=doc)
        
        # Actualizar contador en conversación
        self.client.update(
            index="marie_conversations",
            id=conversation_id,
            body={
                "script": {
                    "source": "ctx._source.message_count += 1; ctx._source.updated_at = params.now; ctx._source.last_message_at = params.now",
                    "params": {"now": datetime.utcnow().isoformat()}
                }
            }
        )
        return doc
    
    async def get_conversation_messages(self, conversation_id: str) -> list:
        query = {
            "query": {"term": {"conversation_id": conversation_id}},
            "sort": [{"created_at": {"order": "asc"}}],
            "size": 1000
        }
        result = self.client.search(index="marie_messages", body=query)
        return [hit["_source"] for hit in result["hits"]["hits"]]
    
    # ==================== BÚSQUEDA ====================
    
    async def search_messages(self, user_id: str, query_text: str, limit: int = 20) -> list:
        """Búsqueda full-text en mensajes del usuario"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"content": query_text}}
                    ],
                    "filter": [
                        {"term": {"user_id": user_id}}
                    ]
                }
            },
            "highlight": {
                "fields": {"content": {}}
            },
            "size": limit
        }
        result = self.client.search(index="marie_messages", body=query)
        return [
            {**hit["_source"], "highlights": hit.get("highlight", {})}
            for hit in result["hits"]["hits"]
        ]
    
    async def semantic_search(self, user_id: str, query_vector: list, limit: int = 10) -> list:
        """Búsqueda semántica por vectores (RAG)"""
        query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "knn": {
                                "content_vector": {
                                    "vector": query_vector,
                                    "k": limit
                                }
                            }
                        }
                    ],
                    "filter": [
                        {"term": {"user_id": user_id}}
                    ]
                }
            },
            "size": limit
        }
        result = self.client.search(index="marie_messages", body=query)
        return [hit["_source"] for hit in result["hits"]["hits"]]
    
    async def hybrid_search(self, user_id: str, query_text: str, 
                            query_vector: list, limit: int = 10) -> list:
        """Búsqueda híbrida: texto + vectores"""
        query = {
            "query": {
                "bool": {
                    "should": [
                        {"match": {"content": {"query": query_text, "boost": 0.3}}},
                        {
                            "knn": {
                                "content_vector": {
                                    "vector": query_vector,
                                    "k": limit
                                }
                            }
                        }
                    ],
                    "filter": [
                        {"term": {"user_id": user_id}}
                    ],
                    "minimum_should_match": 1
                }
            },
            "size": limit
        }
        result = self.client.search(index="marie_messages", body=query)
        return [hit["_source"] for hit in result["hits"]["hits"]]
    
    # ==================== API KEYS ====================
    
    async def create_api_key(self, user_id: str, name: str, key_hash: str,
                            expires_at: str = None, rate_limit: int = 1000) -> dict:
        """Crear nueva API key"""
        api_key_id = f"mc_{uuid.uuid4().hex[:16]}"
        doc = {
            "id": api_key_id,
            "user_id": user_id,
            "name": name,
            "key_hash": key_hash,
            "is_active": True,
            "last_used_at": None,
            "usage_count": 0,
            "expires_at": expires_at,
            "rate_limit": rate_limit,
            "created_at": datetime.utcnow().isoformat()
        }
        self.client.index(index="marie_api_keys", id=api_key_id, body=doc)
        return doc
    
    async def get_api_key_by_hash(self, key_hash: str) -> dict | None:
        """Obtener API key por hash"""
        query = {"query": {"term": {"key_hash": key_hash}}}
        result = self.client.search(index="marie_api_keys", body=query)
        hits = result["hits"]["hits"]
        return hits[0]["_source"] if hits else None
    
    async def get_user_api_keys(self, user_id: str) -> list:
        """Listar API keys de un usuario"""
        query = {
            "query": {"term": {"user_id": user_id}},
            "sort": [{"created_at": {"order": "desc"}}]
        }
        result = self.client.search(index="marie_api_keys", body=query)
        return [hit["_source"] for hit in result["hits"]["hits"]]
    
    async def update_api_key_usage(self, api_key_id: str):
        """Actualizar estadísticas de uso de API key"""
        self.client.update(
            index="marie_api_keys",
            id=api_key_id,
            body={
                "script": {
                    "source": "ctx._source.last_used_at = params.now; ctx._source.usage_count += 1",
                    "params": {"now": datetime.utcnow().isoformat()}
                }
            }
        )
    
    async def revoke_api_key(self, api_key_id: str, user_id: str) -> bool:
        """Revocar (desactivar) API key"""
        # Verificar que la key pertenece al usuario
        key_doc = self.client.get(index="marie_api_keys", id=api_key_id)
        if key_doc["_source"]["user_id"] != user_id:
            return False
        
        self.client.update(
            index="marie_api_keys",
            id=api_key_id,
            body={"doc": {"is_active": False}}
        )
        return True
```

### Inicialización de Índices

```python
# backend/app/services/opensearch_init.py

INDICES = {
    "marie_users": { ... },  # Mapping definido arriba
    "marie_conversations": { ... },
    "marie_messages": { ... },
    "marie_api_keys": { ... }  # Mapping definido arriba
}

async def init_opensearch_indices(client: OpenSearch):
    """Crear índices si no existen"""
    for index_name, mapping in INDICES.items():
        if not client.indices.exists(index=index_name):
            client.indices.create(index=index_name, body=mapping)
            print(f"✅ Índice '{index_name}' creado")
        else:
            print(f"ℹ️ Índice '{index_name}' ya existe")
```

---

## 🔐 Authentication

### Tipos de Autenticación

Marie soporta dos tipos de autenticación según el tipo de API:

1. **Autenticación JWT** - Para usuarios finales (API de Usuario)
2. **Autenticación API Key** - Para desarrolladores (API de Desarrolladores)

### Flujo JWT (API de Usuario)

```
┌──────────┐                          ┌──────────┐
│  Client  │                          │  Server  │
└────┬─────┘                          └────┬─────┘
     │                                     │
     │──── POST /api/auth/login ──────────>│
     │      {email, password}              │
     │                                     │
     │<─── 200 OK ─────────────────────────│
     │      {access_token, refresh_token}  │
     │                                     │
     │──── GET /api/conversations ────────>│
     │      Authorization: Bearer {token}  │
     │                                     │
     │<─── 200 OK ─────────────────────────│
     │      [conversations...]             │
     │                                     │
     │──── POST /api/auth/refresh ────────>│
     │      {refresh_token}                │
     │                                     │
     │<─── 200 OK ─────────────────────────│
     │      {access_token}                 │
     │                                     │
```

### Flujo API Key (API de Desarrolladores)

```
┌──────────┐                          ┌──────────┐
│ Developer│                          │  Server  │
│   App    │                          └────┬─────┘
└────┬─────┘                               │
     │                                     │
     │──── POST /api/v1/chat/completions ─>│
     │      X-API-Key: {api_key}           │
     │      {message, conversation_id}     │
     │                                     │
     │<─── 200 OK ─────────────────────────│
     │      {response, message_id}         │
     │                                     │
```

### Configuración JWT

```python
# backend/app/config.py
class Config:
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
```

### Gestión de API Keys

```python
# backend/app/services/api_key_service.py
from opensearchpy import OpenSearch
import secrets
from datetime import datetime, timedelta

class APIKeyService:
    def __init__(self, opensearch_client: OpenSearch):
        self.client = opensearch_client
        self.index = "marie_api_keys"
    
    async def create_api_key(self, user_id: str, name: str, 
                            expires_in_days: int = None) -> dict:
        """Crear nueva API key para un usuario"""
        api_key = f"mc_{secrets.token_urlsafe(32)}"
        expires_at = None
        if expires_in_days:
            expires_at = (datetime.utcnow() + timedelta(days=expires_in_days)).isoformat()
        
        doc = {
            "id": api_key,
            "user_id": user_id,
            "name": name,
            "key_hash": self._hash_key(api_key),
            "is_active": True,
            "last_used_at": None,
            "usage_count": 0,
            "expires_at": expires_at,
            "created_at": datetime.utcnow().isoformat()
        }
        
        self.client.index(index=self.index, id=api_key, body=doc)
        return {"api_key": api_key, **doc}
    
    async def validate_api_key(self, api_key: str) -> dict | None:
        """Validar API key y retornar información del usuario"""
        key_hash = self._hash_key(api_key)
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"key_hash": key_hash}},
                        {"term": {"is_active": True}}
                    ]
                }
            }
        }
        result = self.client.search(index=self.index, body=query)
        if not result["hits"]["hits"]:
            return None
        
        key_doc = result["hits"]["hits"][0]["_source"]
        
        # Verificar expiración
        if key_doc.get("expires_at"):
            if datetime.fromisoformat(key_doc["expires_at"]) < datetime.utcnow():
                return None
        
        # Actualizar último uso
        self.client.update(
            index=self.index,
            id=key_doc["id"],
            body={
                "script": {
                    "source": "ctx._source.last_used_at = params.now; ctx._source.usage_count += 1",
                    "params": {"now": datetime.utcnow().isoformat()}
                }
            }
        )
        
        return key_doc
    
    def _hash_key(self, api_key: str) -> str:
        """Hash de la API key para almacenamiento seguro"""
        import hashlib
        return hashlib.sha256(api_key.encode()).hexdigest()
```

### Índice OpenSearch para API Keys

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "name": { "type": "text" },
      "key_hash": { "type": "keyword" },
      "is_active": { "type": "boolean" },
      "last_used_at": { "type": "date" },
      "usage_count": { "type": "integer" },
      "expires_at": { "type": "date" },
      "created_at": { "type": "date" }
    }
  }
}
```

---

## 🔌 API Endpoints

Marie ofrece dos tipos de APIs:

1. **API de Usuario** (`/api/*`) - Para usuarios finales usando la interfaz web
2. **API de Desarrolladores** (`/api/v1/*`) - Para integraciones externas con API keys

---

## 👤 API de Usuario

La API de Usuario está diseñada para ser consumida por el frontend de Marie. Utiliza autenticación JWT y WebSockets para streaming en tiempo real.

### Base URL
```
http://localhost:5000/api
```

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/refresh` | Renovar access token |
| GET | `/api/auth/me` | Obtener usuario actual |

**Headers requeridos:**
```
Authorization: Bearer {jwt_token}
```

### Conversaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/conversations` | Listar conversaciones del usuario |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/:id` | Obtener conversación específica |
| PUT | `/api/conversations/:id` | Actualizar conversación (renombrar, etc.) |
| DELETE | `/api/conversations/:id` | Eliminar conversación |
| GET | `/api/conversations/:id/messages` | Obtener mensajes de una conversación |
| GET | `/api/conversations/search` | Buscar conversaciones para referenciar |
| GET | `/api/conversations/:id/summary` | Obtener resumen de conversación |
| GET | `/api/conversations/:id/preview` | Preview de mensajes de conversación |

### Modelos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/models` | Listar modelos disponibles |
| GET | `/api/models/ollama` | Modelos Ollama disponibles |
| GET | `/api/models/huggingface` | Modelos HuggingFace disponibles |

### Chat (WebSocket)

| Evento | Dirección | Payload |
|--------|-----------|---------|
| `connect` | Client → Server | `{token}` |
| `send_message` | Client → Server | `{conversation_id, content, model, provider, file_ids?, referenced_conversation_ids?}` |
| `message_chunk` | Server → Client | `{chunk, message_id}` |
| `message_complete` | Server → Client | `{message_id, full_content, tokens}` |
| `error` | Server → Client | `{code, message}` |
| `typing_start` | Server → Client | `{}` |
| `typing_stop` | Server → Client | `{}` |

**Nota**: `file_ids` es un array opcional de IDs de archivos previamente subidos que se incluirán en el contexto del mensaje.

### Voz

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/speech/transcribe` | Transcribir audio a texto (STT) |
| GET | `/api/speech/synthesize` | Sintetizar texto a audio (TTS) |
| GET | `/api/speech/voices` | Listar voces disponibles |

### Archivos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/files/upload` | Subir archivo |
| GET | `/api/files` | Listar archivos del usuario |
| GET | `/api/files/:id` | Obtener información de archivo |
| GET | `/api/files/:id/download` | Descargar archivo |
| DELETE | `/api/files/:id` | Eliminar archivo |

---

## 🛠️ API de Desarrolladores

La API de Desarrolladores es una API REST pública diseñada para integraciones externas. Utiliza autenticación por API Key y sigue estándares RESTful.

### Base URL
```
http://localhost:5000/api/v1
```

### Autenticación

**Header requerido:**
```
X-API-Key: {api_key}
```

### Gestión de API Keys

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/keys` | Listar API keys del usuario | JWT |
| POST | `/api/v1/keys` | Crear nueva API key | JWT |
| DELETE | `/api/v1/keys/:id` | Revocar API key | JWT |
| GET | `/api/v1/keys/:id/usage` | Estadísticas de uso | JWT |

**Ejemplo de creación de API key:**
```bash
POST /api/v1/keys
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Mi App de Producción",
  "expires_in_days": 365
}

# Respuesta:
{
  "api_key": "mc_abc123...",
  "id": "mc_abc123...",
  "name": "Mi App de Producción",
  "created_at": "2024-12-01T10:00:00Z",
  "expires_at": "2025-12-01T10:00:00Z"
}
```

### Chat Completions

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/chat/completions` | Enviar mensaje y recibir respuesta completa |
| POST | `/api/v1/chat/completions/stream` | Enviar mensaje y recibir respuesta en streaming (SSE) |

**Ejemplo de chat completion:**
```bash
POST /api/v1/chat/completions
X-API-Key: mc_abc123...
Content-Type: application/json

{
  "message": "¿Qué es la inteligencia artificial?",
  "conversation_id": "optional-conversation-id",
  "model": "llama3.2",
  "provider": "ollama",
  "temperature": 0.7,
  "max_tokens": 1000,
  "file_ids": ["file_123", "file_456"]
}

# Respuesta:
{
  "id": "msg_123",
  "conversation_id": "conv_456",
  "message": "La inteligencia artificial es...",
  "model": "llama3.2",
  "provider": "ollama",
  "tokens_used": 150,
  "created_at": "2024-12-01T10:00:00Z"
}
```

**Ejemplo de streaming (SSE):**
```bash
POST /api/v1/chat/completions/stream
X-API-Key: mc_abc123...
Content-Type: application/json

{
  "message": "Explica qué es Python",
  "model": "llama3.2",
  "provider": "ollama"
}

# Respuesta (Server-Sent Events):
data: {"chunk": "Python", "message_id": "msg_123"}
data: {"chunk": " es", "message_id": "msg_123"}
data: {"chunk": " un", "message_id": "msg_123"}
...
data: {"type": "complete", "message_id": "msg_123", "tokens_used": 200}
```

### Conversaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/conversations` | Listar conversaciones del usuario |
| POST | `/api/v1/conversations` | Create new conversation |
| GET | `/api/v1/conversations/:id` | Obtener conversación |
| PUT | `/api/v1/conversations/:id` | Actualizar conversación |
| DELETE | `/api/v1/conversations/:id` | Eliminar conversación |
| GET | `/api/v1/conversations/:id/messages` | Obtener mensajes de conversación |

### Mensajes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/messages/:id` | Obtener mensaje específico |
| DELETE | `/api/v1/messages/:id` | Eliminar mensaje |

### Modelos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/models` | Listar modelos disponibles |
| GET | `/api/v1/models/:id` | Obtener información de un modelo |

### Búsqueda

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/search` | Búsqueda full-text en historial |
| POST | `/api/v1/search/semantic` | Búsqueda semántica (vectorial) |
| POST | `/api/v1/search/hybrid` | Búsqueda híbrida (texto + vectorial) |

**Ejemplo de búsqueda:**
```bash
GET /api/v1/search?q=inteligencia+artificial&limit=10
X-API-Key: mc_abc123...

# Respuesta:
{
  "results": [
    {
      "message_id": "msg_123",
      "conversation_id": "conv_456",
      "content": "La inteligencia artificial...",
      "highlight": "La <em>inteligencia artificial</em>...",
      "score": 0.95,
      "created_at": "2024-11-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Voz (TTS/STT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/speech/transcribe` | Transcribir audio a texto |
| POST | `/api/v1/speech/synthesize` | Sintetizar texto a audio |
| GET | `/api/v1/speech/voices` | Listar voces disponibles |

### Archivos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/files/upload` | Subir archivo |
| GET | `/api/v1/files` | Listar archivos del usuario |
| GET | `/api/v1/files/:id` | Obtener información de archivo |
| GET | `/api/v1/files/:id/download` | Descargar archivo |
| DELETE | `/api/v1/files/:id` | Eliminar archivo |

### Rate Limiting

La API de Desarrolladores implementa rate limiting por API key:

- **Límite por defecto**: 1000 requests/hora
- **Límite de streaming**: 100 requests/hora
- **Headers de respuesta:**
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1701432000
  ```

### Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 400 | Solicitud inválida |
| 401 | No autenticado (API key inválida) |
| 403 | Prohibido (API key inactiva o expirada) |
| 404 | No encontrado |
| 429 | Rate limit excedido |
| 500 | Error del servidor |

### Documentación OpenAPI/Swagger

La API de Desarrolladores incluye documentación OpenAPI 3.0:

- **Swagger UI**: `http://localhost:5000/api/v1/docs`
- **OpenAPI JSON**: `http://localhost:5000/api/v1/openapi.json`
- **ReDoc**: `http://localhost:5000/api/v1/redoc`

### Ejemplo de Integración (Python)

```python
import requests

class MarieChatClient:
    def __init__(self, api_key: str, base_url: str = "http://localhost:5000/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
    
    def chat(self, message: str, model: str = "llama3.2", 
             provider: str = "ollama", conversation_id: str = None):
        """Enviar mensaje y recibir respuesta"""
        payload = {
            "message": message,
            "model": model,
            "provider": provider
        }
        if conversation_id:
            payload["conversation_id"] = conversation_id
        
        response = requests.post(
            f"{self.base_url}/chat/completions",
            json=payload,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def chat_stream(self, message: str, model: str = "llama3.2"):
        """Enviar mensaje y recibir respuesta en streaming"""
        payload = {
            "message": message,
            "model": model,
            "provider": "ollama"
        }
        
        response = requests.post(
            f"{self.base_url}/chat/completions/stream",
            json=payload,
            headers=self.headers,
            stream=True
        )
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                data = line.decode('utf-8')
                if data.startswith('data: '):
                    import json
                    yield json.loads(data[6:])

# Uso
client = MarieChatClient(api_key="mc_abc123...")
response = client.chat("Hola, ¿cómo estás?")
print(response["message"])

# Streaming
for chunk in client.chat_stream("Explica Python"):
    if chunk.get("type") == "complete":
        break
    print(chunk.get("chunk", ""), end="", flush=True)
```

### Ejemplo de Integración (JavaScript/TypeScript)

```typescript
class MarieChatClient {
  constructor(
    private apiKey: string,
    private baseUrl: string = "http://localhost:5000/api/v1"
  ) {}

  async chat(
    message: string,
    model: string = "llama3.2",
    provider: string = "ollama",
    conversationId?: string
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        model,
        provider,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async *chatStream(
    message: string,
    model: string = "llama3.2"
  ): AsyncGenerator<any> {
    const response = await fetch(`${this.baseUrl}/chat/completions/stream`, {
      method: "POST",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, model, provider: "ollama" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            yield JSON.parse(line.slice(6));
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
      }
    }
  }
}

// Uso
const client = new MarieChatClient("mc_abc123...");
const response = await client.chat("Hola, ¿cómo estás?");
console.log(response.message);

// Streaming
for await (const chunk of client.chatStream("Explica Python")) {
  if (chunk.type === "complete") break;
  process.stdout.write(chunk.chunk || "");
}
```

---

## 📅 Development Plan

### Phase 1: Fundamentals (Days 1-2)
- [x] **Project Setup**
  - [x] Initialize Next.js 16 with TypeScript
  - [x] Configure Tailwind CSS 4
  - [x] Install and configure Ant Design X
  - [x] Create frontend folder structure
  - [x] Initialize Flask with modular structure
  - [x] Configure OpenSearch (indices and mappings)
  - [x] Setup Docker Compose with OpenSearch

- [x] **Basic Authentication**
  - [x] OpenSearch service for Users
  - [x] register/login/logout endpoints
  - [x] JWT setup with Flask-JWT-Extended
  - [x] login/register forms in frontend
  - [x] AuthGuard and route protection

### Phase 2: Chat Core (Days 3-4)
- [x] **Backend Chat**
  - [x] OpenSearch indices: conversations, messages
  - [x] Conversation CRUD with OpenSearch
  - [x] Basic integration with Ollama
  - [x] WebSocket with Flask-SocketIO
  - [x] Response streaming

- [x] **Frontend Chat**
  - [x] ChatContainer with Ant Design X
  - [x] MessageList and MessageBubble
  - [x] ChatInput with Sender component
  - [x] WebSocket connection (socket.io-client)
  - [x] Streaming visualization

### Phase 3: Multi-Provider & Pipelines (Days 5-6)
- [x] **LLM Providers**
  - [x] LLMProvider abstraction
  - [x] Complete OllamaProvider
  - [x] HuggingFaceProvider
  - [x] Model selector in frontend

- [x] **LangGraph Pipelines**
  - [x] Basic chat pipeline
  - [x] Research pipeline
  - [x] UI integration

### Phase 4: Advanced Rendering (Day 7)
- [x] **Markdown Rendering**
  - [x] MarkdownRenderer with react-markdown
  - [x] CodeBlock with syntax highlighting
  - [x] Copy code button
  - [x] LaTeX rendering
  - [x] Mermaid diagrams
  - [x] HTML artifacts rendering (plots, charts, visualizations)
  - [x] Plotly integration for interactive charts
  - [x] Safe HTML sanitization with DOMPurify

### Phase 5: Voice TTS/STT (Days 8-9)
- [x] **Backend Voice**
  - [x] Configure faster-whisper for STT
  - [x] Configure edge-tts for TTS
  - [x] Endpoints /api/speech/*
  - [x] Audio streaming

- [x] **Frontend Voice**
  - [x] useSpeech() hook
  - [x] Microphone button in ChatInput
  - [x] Recording indicator
  - [x] Play button on assistant messages
  - [x] Voice selector

### Phase 6: UX & Polish (Days 10-11)
- [x] **UX Improvements**
  - [x] WelcomeScreen with suggestions
  - [x] Quick commands
  - [x] Light/dark theme
  - [x] Responsive design
  - [x] Loading states and animations

- [x] **Sidebar**
  - [x] Conversation list
  - [x] Search
  - [x] Rename/delete
  - [x] Model configuration

### Phase 7: Advanced Search with OpenSearch (Day 12)
- [x] **Full-Text Search**
  - [x] Search in conversation history
  - [x] Result highlighting
  - [x] Search UI in sidebar

- [ ] **Vector Search (RAG)**
  - [ ] Integration with embedding model
  - [ ] Vector generation when saving messages
  - [ ] Semantic search
  - [ ] Hybrid search (text + vectors)

### Phase 8: Developer API (Days 13-14)
- [x] **Backend API v1**
  - [x] API key management service
  - [x] OpenSearch index for API keys
  - [x] API key management endpoints (/api/v1/keys)
  - [x] API key authentication middleware
  - [x] Rate limiting per API key
  - [x] REST endpoints for chat completions
  - [x] Streaming endpoint with SSE
  - [x] Conversation and message endpoints
  - [x] Search endpoints
  - [x] OpenAPI/Swagger documentation

- [x] **Frontend API Keys Management**
  - [x] UI to create/revoke API keys
  - [x] API keys list with statistics
  - [x] Usage and rate limits visualization

### Phase 9: Administration Panel (Days 15-16)
- [x] **Backend Admin**
  - [x] Update user model with roles and permissions
  - [x] OpenSearch indices: marie_system_config, marie_audit_logs
  - [x] Administration service (AdminService)
  - [x] Authorization middleware (admin_required, permission_required)
  - [x] Endpoints /api/admin/* (users, config, stats, logs)
  - [x] Audit logs system
  - [x] General system configuration

- [x] **Frontend Admin**
  - [x] Administration page (/admin)
  - [x] UsersManagement component
  - [x] SystemConfig component
  - [x] SystemStats component
  - [x] AuditLogs component
  - [x] Admin route protection
  - [x] Visual indicators for admin role

### Phase 10: Testing & Deploy (Day 17+)
- [x] **Testing**
  - [x] Backend unit tests
  - [x] OpenSearch integration tests
  - [x] Developer API tests
  - [x] Basic E2E tests

- [ ] **Deployment**
  - [ ] Complete Dockerization
  - [ ] OpenSearch cluster configuration (production)
  - [ ] Production environment variables
  - [ ] Complete documentation (User API + Developer API)

### Phase 11: Prompt Engineering Assistant (Days 18-19)
- [x] **Backend Prompt Assistant**
  - [x] Prompt Engineering Service (`PromptService`)
  - [x] Library of prompt techniques (Chain of Thought, Few-Shot, Tree of Thoughts, etc.)
  - [x] Endpoint `/api/prompts/optimize` to refine user prompts
  - [x] Integration with LLM to generate optimized prompts
- [x] **Frontend Prompt Widget**
  - [x] `PromptOptimizer` component (floating widget or sidebar tool)
  - [x] Interactive wizard to guide the user through prompt creation
  - [x] Templates for different use cases (Creative, Technical, Academic)
  - [x] One-click "Apply to Chat" functionality

---

## 🐳 Deployment

### Docker Compose (Desarrollo)

```yaml
# docker-compose.dev.yml
version: '3.9'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000
      - NEXT_PUBLIC_WS_URL=ws://localhost:5000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
    environment:
      - FLASK_ENV=development
      - OPENSEARCH_HOSTS=https://opensearch:9200
      - OPENSEARCH_USER=admin
      - OPENSEARCH_PASSWORD=Marie_Chat_2024!
      - JWT_SECRET_KEY=dev-secret-key-change-in-production
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      opensearch:
        condition: service_healthy
      ollama:
        condition: service_started

  opensearch:
    image: opensearchproject/opensearch:2.11.1
    container_name: marie-opensearch
    environment:
      - cluster.name=marie-cluster
      - node.name=marie-node-1
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g
      - OPENSEARCH_INITIAL_ADMIN_PASSWORD=Marie_Chat_2024!
      - plugins.security.ssl.http.enabled=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - opensearch_data:/usr/share/opensearch/data
    ports:
      - "9200:9200"
      - "9600:9600"
    healthcheck:
      test: ["CMD-SHELL", "curl -k -u admin:Marie_Chat_2024! https://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.11.1
    container_name: marie-dashboards
    ports:
      - "5601:5601"
    environment:
      - OPENSEARCH_HOSTS=["https://opensearch:9200"]
      - OPENSEARCH_USERNAME=admin
      - OPENSEARCH_PASSWORD=Marie_Chat_2024!
    depends_on:
      opensearch:
        condition: service_healthy

  ollama:
    image: ollama/ollama:latest
    container_name: marie-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  opensearch_data:
  ollama_data:
```

### Variables de Entorno

```bash
# .env.example

# OpenSearch
OPENSEARCH_HOSTS=https://localhost:9200
OPENSEARCH_USER=admin
OPENSEARCH_PASSWORD=your-secure-password-here
OPENSEARCH_USE_SSL=true
OPENSEARCH_VERIFY_CERTS=false

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-this

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# HuggingFace
HUGGINGFACE_API_KEY=hf_your_api_key

# Embeddings (para búsqueda vectorial)
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

---

## 📚 Referencias

- [Ant Design X Documentation](https://x.ant.design/)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [OpenSearch Python Client](https://opensearch.org/docs/latest/clients/python-low-level/)
- [OpenSearch k-NN Plugin](https://opensearch.org/docs/latest/search-plugins/knn/)
- [LangChain Documentation](https://python.langchain.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Ollama Documentation](https://ollama.ai/)
- [ImpactU - CoLaV](https://impactu.colav.co/)

---

## 👥 Team

**Developed by:** CoLaV - University of Antioquia  
**Contact:** grupocolav@udea.edu.co

---

*Last updated: December 2025*

