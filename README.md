<p align="center">
  <img src="imgs/marie_logo.png" alt="MARIE Logo" width="200">
</p>

# MARIE: Machine-Assisted Research Intelligent Environment

**MARIE** is a state-of-the-art research assistant platform designed to provide an intelligent, extensible, and user-friendly environment for researchers and developers. It leverages the latest advancements in Large Language Models (LLMs), vector databases, and real-time communication to deliver a seamless research experience.

---

## 🌟 Key Capabilities

### 🧠 Intelligent Conversational Interface
Experience a modern chat environment built with **Next.js 16** and **Ant Design X**, featuring:
- **Real-time Streaming**: Instant responses powered by WebSockets for a fluid conversation.
- **Context-Aware History**: Intelligent conversation management with automatic titling and hybrid search (text + vector).
- **Rich Content Rendering**: Native support for **LaTeX** equations, **Markdown**, syntax-highlighted **Code Blocks**, and **HTML Artifacts** (interactive plots, SVG, etc.).

### 🛠️ Multi-Model & Multi-Modal Ecosystem
MARIE is provider-agnostic, allowing you to switch between local and cloud models effortlessly:
- **Local Execution**: Deep integration with **Ollama** for private and fast local inference.
- **Cloud Power**: Support for **HuggingFace** and other external providers.
- **Voice Integration**: Advanced **Speech-to-Text (STT)** using `faster-whisper` and **Text-to-Speech (TTS)** with `edge-tts`.
- **Visual Intelligence**: Integrated **Image Generation** capabilities using diffusion models.

### 🔌 Developer-First API (v1)
A robust REST API designed for seamless integration into external workflows:
- **Secure Access**: SHA-256 hashed API keys for secure authentication.
- **Interactive Docs**: Full **Swagger/OpenAPI** documentation available at `/api/v1/docs`.
- **Extensible Architecture**: Easily build custom tools and agents on top of the MARIE core.

### ⚙️ Enterprise-Grade Admin Console
Complete control over the environment with a powerful administration suite:
- **White Labeling**: Customize branding, logos, colors, and welcome messages dynamically.
- **Model Management**: Real-time configuration of LLM providers and default system models.
- **User & Security**: Comprehensive user management, role-based access control, and system health monitoring.

---

## 🏗️ Technical Architecture

MARIE is built on a modern, scalable stack:
- **Frontend**: Next.js 16 (React 19), TypeScript, Ant Design X, Tailwind CSS.
- **Backend**: Flask 3, Socket.IO (Eventlet), Python 3.12.
- **Database**: OpenSearch 2.11 with k-NN vector search for semantic memory.
- **Infrastructure**: Fully containerized with Docker for easy deployment.

---

## 📄 Documentation

For detailed technical information, please refer to:
- [Technical Specifications](SPECIFICATIONS.md)
- [Project Status](PROJECT_STATUS.md)

---
Developed by **Omar Zapata**.

