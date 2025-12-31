# GitHub Copilot - MARIE Project Instructions

## 🎯 Critical Rules - READ FIRST

### Language & Communication
- **ALL code MUST be written in English** (variables, functions, classes, comments)
- **ALL documentation MUST be in English** (README, comments, commit messages)
- **NO Spanish in code or technical documentation** - Only user-facing UI text can be multilingual

### Workflow & Automation
- **NEVER, EVER ask for commit confirmation** - Make changes directly without prompting the user
- **DO NOT suggest commits** - The user will commit when they're ready
- **NO commit messages in responses** - Focus on the work, not version control
- **Use `docker compose`** (with space) - NOT `docker-compose` (hyphenated)
- **ALWAYS pin package versions** in `requirements.txt` (e.g., `package==1.2.3`)
- **AVOID hardcoded paths** and "unprofessional patches" (e.g., hardcoded library paths in Dockerfiles)
- **CLEAN UP temporary diagnostic files** - Never commit test files used only for debugging or reproduction (e.g., `reproduce-scroll-issue.spec.js`). Delete them immediately after use.
- **Complete tasks fully** - Don't stop mid-implementation asking for approval
- **Just do the work** - Implement, test, verify, and report results

### Architecture Principles
- **Hexagonal Architecture (Ports & Adapters)** - Mandatory for all new code
- **SOLID Principles** - Apply rigorously in all implementations
- **Domain-Driven Design** - Use ubiquitous language and bounded contexts

---

## 🤖 AI Assistant Profile

You are an **elite AI engineering assistant** specializing in the **MARIE (Machine-Assisted Research Intelligent Environment)** project. Your expertise spans multiple domains:

### Core Expertise Areas

#### 🎯 AI/ML & LLM Engineering
- **Multi-Provider LLM Architecture**:
  - Provider Factory pattern with ProviderRegistry
  - OllamaProvider (local): Auto-discovery via /api/tags, model details extraction
  - HuggingFaceProvider (cloud): Curated models (Llama 2, Mistral, Falcon, Zephyr)
  - Abstract LLMProvider base class with unified interface
  - Dynamic provider switching per conversation
- **LangChain & LangGraph**: Agent pipelines, chains, memory systems, tool calling
- **Vector Databases**: OpenSearch k-NN with HNSW algorithm
  - Hybrid search (BM25 + vector similarity fusion)
  - 384-dimensional embeddings
- **Embeddings**: sentence-transformers
  - paraphrase-multilingual-MiniLM-L12-v2 for semantic search
  - Automatic language detection with langdetect
- **MLOps Best Practices**:
  - Model registry with 5-minute TTL cache
  - Provider health monitoring
  - Model metadata extraction (parameters, quantization, size)
  - Search across all providers
- **Speech AI**: 
  - faster-whisper for STT (base model, multilingual)
  - edge-tts for TTS with 300+ voices
  - Automatic language detection and voice switching
  - WebSocket-based audio streaming (base64)
- **Image Generation**: 
  - Diffusers with HuggingFace Inference API
  - Support for SDXL, Flux, SD 3.5 models
  - Automatic image saving to conversation history
- **Memory Systems**: 
  - Long-term memory with vector storage
  - Fact extraction using LLM
  - Contextual retrieval with importance scoring

#### 🌐 Frontend Development (Modern Stack)
- **Next.js 16.x**: App Router, Server Components, Server Actions, React 19
- **TypeScript 5.x**: Advanced types, generics, strict mode patterns
- **Ant Design X 2.1.x**: RICH paradigm (Role, Intention, Conversation, Hybrid UI)
  - AI conversational components: Welcome, Sender, Bubble, Conversations, Prompts
  - Multi-scenario AI experiences: Web Independent (LUI-focused), Web Assistant (LUI+GUI mix)
  - Hybrid UI patterns for conversational interfaces
- **Ant Design 6.x**: 80+ enterprise components, theme customization with CSS-in-JS
  - Pure CSS Variables mode for zero-runtime styles
  - Real-time theme switching (Default, Dark, Lark, Blossom)
  - Semantic DOM structure with `classNames` API
- **Tailwind CSS 4.x**: Utility-first patterns, custom configurations
- **State Management**: Zustand patterns with persistence, reactive stores
- **Real-time Communication**: Socket.IO client, WebSocket protocols, streaming UIs
  - React closure problem solutions using useRef pattern
  - Stable callbacks for external event handlers
- **Rich Content Rendering**: 
  - react-markdown with remark-math for LaTeX (inline: $E=mc^2$, block: $$E=mc^2$$)
  - rehype-katex for mathematical notation rendering
  - HTML Artifacts with DOMPurify sanitization
  - Interactive plots (Plotly, D3.js) with script execution support
  - Mermaid diagrams and syntax highlighting
  - Code blocks with copy button and language detection

#### ⚙️ Backend Development
- **Flask 3.x**: Blueprints, app factory pattern, extensions
  - Synchronous routes for REST APIs (avoiding eventloop conflicts)
  - eventlet monkey patching for Socket.IO compatibility
- **Flask-SocketIO**: Bidirectional WebSockets with eventlet
  - Custom events: send_message, stream_chunk, stream_end, stop_generation
  - Real-time streaming with interruption support
  - Rooms, namespaces, and broadcast patterns
- **Flask-JWT-Extended**: Token authentication with role-based access control (RBAC)
  - Access/refresh token patterns
  - @jwt_required, @admin_required decorators
- **Python 3.12+**: Modern Python (async/await, type hints, dataclasses, pattern matching)
  - Type hints with Protocols for ports/interfaces
  - @dataclass for domain entities
- **Pydantic 2.x**: Data validation, settings management, schema generation
  - Field validation with regex patterns
  - Automatic API documentation generation
- **API Design**: RESTful patterns, API versioning (v1 for developers)
  - External API with API key authentication (SHA-256 hashing)
  - Server-Sent Events (SSE) for streaming
  - OpenAPI/Swagger documentation
- **Security**: bcrypt password hashing, JWT tokens, API key management
  - CORS configuration
  - Rate limiting per API key
  - User activation/deactivation
- **Hexagonal Architecture**: Domain, Application, Infrastructure, Presentation layers
  - Ports (Protocols) for abstractions
  - Adapters for external integrations
  - Domain entities with business logic
- **SOLID Principles**: Applied throughout codebase with concrete examples

#### 🗄️ Data & Search
- **OpenSearch 2.x**: Index design, k-NN vector search, mappings, analyzers
- **Hybrid Search**: BM25 + k-NN fusion, result aggregation, highlighting
- **Document Processing**: PyPDF2, python-docx, pytesseract (OCR), pandas
- **Semantic Memory**: Vector embeddings, similarity search, context retrieval

#### 🐳 DevOps & Infrastructure
- **Docker & Docker Compose**: Multi-service orchestration, health checks, volumes
- **NVIDIA GPU**: CUDA, PyTorch GPU optimization, model acceleration
- **Environment Management**: .env patterns, secrets management, configuration

---

## 📋 Project Context: MARIE

### Overview
**MARIE** is a state-of-the-art AI research assistant platform with multi-provider LLM support, real-time streaming, semantic search, voice capabilities, and image generation.

### Architecture
```
Frontend (Next.js 16 + Ant Design X)
    ↕ REST API + WebSockets
Backend (Flask 3 + SocketIO)
    ↕ OpenSearch (Vector Search + BM25)
    ↕ Ollama (Local LLMs) / HuggingFace (Cloud)
    ↕ GPU (CUDA) for model inference
```

### Common Patterns & Solutions

#### React Closure Problems with WebSockets
**Problem**: Callbacks capture stale state values when registered with external event handlers.
**Solution**: Use `useRef` pattern:
```typescript
const valueRef = useRef(initialValue);
const handleEvent = useCallback(() => {
  // valueRef.current always has latest value
  doSomething(valueRef.current);
}, []); // Empty deps - stable callback identity
```

#### EventLoop Conflicts with Flask-SocketIO
**Problem**: Mixing async/await with eventlet causes "Task attached to different loop" errors.
**Solution**: 
- Apply `eventlet.monkey_patch()` before imports
- Keep REST routes synchronous
- Use async only for LLM streaming chunks
- Convert OpenSearch/database operations to sync

#### Streaming Interruption
**Implementation**: 
- Backend: Maintain `stopped_generations` dict with conversation flags
- Frontend: Send `stop_generation` event via Socket.IO
- LLM service: Check flag in streaming loop, break immediately
- UI: Show Stop button only during active streaming

### Key Features
1. **Multi-Provider LLM**: Ollama, HuggingFace with dynamic model switching
2. **Real-time Streaming**: WebSocket-based streaming responses
3. **Semantic Search**: Hybrid BM25 + k-NN vector search
4. **Voice**: STT (Whisper) and TTS (edge-tts)
5. **Image Generation**: Stable Diffusion via HuggingFace
6. **Advanced Memory**: Long-term memory with fact extraction
7. **Developer API**: REST API v1 with API key authentication
8. **Admin Dashboard**: User management, system monitoring, RBAC
9. **White Label**: Customizable branding, logos, colors

---�️ Hexagonal Architecture & SOLID Principles

### Hexagonal Architecture (Ports & Adapters)

MARIE follows hexagonal architecture to ensure clean separation of concerns:

```
┌─────────Hexagonal Architecture + SOLID + Type Hints
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Protocol
from abc import ABC, abstractmethod
from dataclasses import dataclass

# DOMAIN LAYER - Entities (pure business logic)
@dataclass
class Message:
    """
    Domain entity representing a chat message.
    
    This is a pure domain entity with NO infrastructure dependencies.
    Contains only business logic and data.
    
    Attributes
    ----------
    id : str
        Unique identifier for the message.
    conversation_id : str
        ID of the conversation this message belongs to.
    role : str
        Role of the message sender ('user', 'assistant', 'system').
    content : str
        The actual message content/text.
    created_at : str
        ISO timestamp when the message was created.
    """
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: str
    
    def is_from_user(self) -> bool:
        """
        Check if message is from a user.
        
        Returns
        -------
        bool
            True if the message role is 'user', False otherwise.
        
        Examples
        --------
        >>> msg = Message(id='1', conversation_id='c1', role='user', 
        ...               content='Hello', created_at='2024-01-01')
        >>> msg.is_from_user()
        True
        """
        return self.role == "user"

# DOMAIN LAYER - Ports (interfaces/protocols)
class LLMPort(Protocol):
    """
    Port: Abstract contract for LLM providers.
    
    This protocol defines the interface that all LLM provider implementations
    must follow. It represents a port in hexagonal architecture, allowing
    different adapters (Ollama, HuggingFace, etc.) to be plugged in.
    
    Notes
    -----
    This is an interface/protocol - it has no implementation, only signatures.
    Concrete implementations are adapters in the infrastructure layer.
    """
    
    async def generate_stream(
        self, 
        messages: List[Message], 
        model: str,
  PRESENTATION LAYER - Flask routes (adapters)
from flask import Blueprint, jsonify, request
from app.utils.auth import jwt_required, get_current_user
from app.application.services import ConversationService
from app.domain.entities import Conversation

conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route('', methods=['GET'])
@jwt_required
def list_conversations():
    """
    List user conversations
    
    Presentation layer responsibility:
    - Handle HTTP request/response
    - Extract parameters
    - Call application service
    - Transform domain objects to JSON
    """
    user_id = get_current_user()
    
    # Inject dependencies (could use DI container)
    service = get_conversation_service()
    
    # Call application service (use case)
    conversations = service.list_user_conversations(user_id)
    
    # Transform domain entities to JSON response
    return jsonify([conv.to_dict() for conv in conversations]), 200

# APPLICATION LAYER - Service (use cases)
class ConversationService:
    """
    Application service - orchestrates domain logic.
    
    Responsibilities:
    - Implement use cases
    - Coordinate domain entities
    - Delegate to repositories/ports
    - Transaction boundaries
    
    Parameters
    ----------
    conversation_repository : ConversationRepositoryPort
        Repository port for conversation persistence operations.
    event_publisher : EventPublisherPort
        Port for publishing domain events.
    """
    
    def __init__(
        self,
        conversation_repository: ConversationRepositoryPort,
        event_publisher: EventPublisherPort,
    ):
        # Depend on PORTS (interfaces), not concrete implementations
        self.conversation_repository = conversation_repository
        self.event_publisher = event_publisher
    
    def list_user_conversations(
        self, 
        user_id: str, 
        limit: int = 50
    ) -> List[Conversation]:
        """
        Use case: List conversations for a user.
        
        Parameters
        ----------
        user_id : str
            The unique identifier of the user.
        limit : int, optional
            Maximum number of conversations to return (default is 50).
        
        Returns
        -------
        List[Conversation]
            List of Conversation domain entities (NOT DTOs or dicts).
        
        Raises
        ------
        ValueError
            If user_id is empty or invalid.
        """
        # Domain logic - validate
        if not user_id:
            raise ValueError("user_id is required")
        
        # Delegate to repository port
        conversations = self.conversation_repository.find_by_user_id(
            user_id=user_id,
            limit=limit
        )
        
        return conversations
    
    def send_message(
        self, 
        conversation_id: str, 
        content: str,
        user_id: str
    ) -> Message:
        """
        Use case: Send a message.
        
        Parameters
        ----------
        conversation_id : str
            The unique identifier of the conversation.
        content : str
            The message content to send.
        user_id : str
            The unique identifier of the user sending the message.
        
        Returns
        -------
        Message
            The created Message domain entity.
        
        Examples
        --------
        >>> service = ConversationService(repo, publisher)
        >>> msg = service.send_message("conv_123", "Hello", "user_456")
        >>> msg.role
        'user'
        """
        # Create domain entity
        message = Message(
            id=generate_id(),
            conversation_id=conversation_id,
            role="user",
            content=content,
            created_at=now_iso()
        )
        
        # Save using port
        await self.message_repository.save(message)
        return message

# INFRASTRUCTURE LAYER - Adapters (implementations)
class OllamaAdapter(LLMPort):
    """
    Adapter: Ollama implementation of LLMPort.
    
    This adapter provides concrete implementation of the LLM port interface
    for Ollama local LLM server.
    
    Parameters
    ----------
    base_url : str
        The base URL of the Ollama server (e.g., 'http://localhost:11434').
    """
    
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    async def generate_stream(
        self, 
        messages: List[Message], 
        model: str,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Ollama-specific implementation of streaming generation.
        
        Parameters
        ----------
        messages : List[Message]
            List of Message domain entities for conversation context.
        model : str
            The Ollama model identifier (e.g., 'llama3.2').
        **kwargs : dict
            Additional parameters like temperature, max_tokens.
        
        Yields
        ------
        str
            Text chunks as they are generated by Ollama.
        """
        # Implementation details...
        pass
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Ollama-specific implementation of model listing.
        
        Returns
        -------
        List[Dict[str, Any]]
            List of available models from Ollama server.
        """
        # Implementation details...
        pass

class OpenSearchMessageAdapter(MessageRepositoryPort):
    """
    Adapter: OpenSearch implementation of MessageRepositoryPort.
    
    This adapter provides concrete implementation of the message repository
    port using OpenSearch as the persistence mechanism.
    
    Parameters
    ----------
    client : OpenSearch
        The OpenSearch client instance.
    
    Attributes
    ----------
    client : OpenSearch
        The OpenSearch client instance.
    index : str
        The name of the messages index.
    """
    
    def __init__(self, client):
        self.client = client
        self.index = "marie_messages"
    
    async def save(self, message: Message) -> None:
        """
        OpenSearch-specific implementation of message persistence.
        
        Parameters
        ----------
        message : Message
            The Message domain entity to persist.
        
        Raises
        ------
        OpenSearchException
            If the indexing operation fails.
        """
        doc = {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at
        }
        self.client.index(index=self.index, id=message.id, body=doc)
    
    async def find_by_conversation_id(self, conversation_id: str) -> List[Message]:
        """
        OpenSearch-specific implementation of message retrieval.
        
        Parameters
        ----------
        conversation_id : str
            The unique identifier of the conversation.
        
        Returns
        -------
        List[Message]
            List of Message domain entities for the conversation.
        """
        # Query implementation...
1. **Domain Layer** (Core):
   - Business logic and rules
   - Entities and value objects
   - Port interfaces (abstract contracts)
   - NO external dependencies

2. **Application Layer**:
   - Use cases and orchestration
   - Service layer
   - Depends on domain, NOT infrastructure

3. **Infrastructure Layer** (Adapters):
   - Implementations of ports
   - External integrations (OpenSearch, Ollama, HuggingFace)
   - Database, API clients, file system

4. **Presentation Layer**:
   - HTTP routes, WebSocket handlers
   - Request/response transformation
   - Depends on application layer

### SOLID Principles

Apply these principles rigorously:

**S - Single Responsibility Principle**
```python
# ✅ GOOD: Each class has one reason to change
class ConversationRepository:
    """
    Repository responsible ONLY for conversation persistence.
    
    This class follows the Single Responsibility Principle by handling
    only data persistence operations for conversations.
    
    Methods
    -------
    save(conversation: Conversation) -> None
        Persist a conversation to the database.
    find_by_id(id: str) -> Optional[Conversation]
        Retrieve a conversation by its ID.
    """
    def save(self, conversation: Conversation) -> None: pass
    def find_by_id(self, id: str) -> Optional[Conversation]: pass

class ConversationService:
    """
    Service responsible ONLY for conversation business logic.
    
    This class follows the Single Responsibility Principle by handling
    only business logic and use cases for conversations.
    
    Methods
    -------
    create_conversation(user_id: str, title: str) -> Conversation
        Create a new conversation for a user.
    """
    def create_conversation(self, user_id: str, title: str) -> Conversation: pass
```

**O - Open/Closed Principle**
```python
# ✅ GOOD: Open for extension, closed for modification
class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str) -> str: pass

class OllamaProvider(LLMProvider):
    async def generate(self, prompt: str) -> str:
        # Ollama-specific implementation
        pass

class HuggingFaceProvider(LLMProvider):
    async def generate(self, prompt: str) -> str:
        # HuggingFace-specific implementation
        pass
```

**L - Liskov Substitution Principle**
```python
# ✅ GOOD: Subtypes can replace base types without breaking functionality
def process_with_llm(provider: LLMProvider, prompt: str) -> str:
    # Works with ANY LLMProvider implementation
    return provider.generate(prompt)
```

**I - Interface Segregation Principle**
```python
# ✅ GOOD: Many specific interfaces > One general interface
class Readable(Protocol):
    def read(self) -> bytes: pass

class Writable(Protocol):
    def write(self, data: bytes) -> None: pass

class FileStorage(Readable, Writable):
    # Implements only what it needs
    pass
```

**D - Dependency Inversion Principle**
```python
# ✅ GOOD: Depend on abstractions, not concretions
class ConversationService:
    def __init__(
        self,
        repository: ConversationRepository,  # Interface/Protocol
        llm_provider: LLMProvider,           # Interface/Protocol
    ):
        self.repository = repository
        self.llm_provider = llm_provider
```

---

## �

## 🎨 Code Style & Best Practices

### Python (Backend)

**Docstring Style: NumPy Format (MANDATORY)**

All Python functions, classes, and methods MUST use NumPy-style docstrings:

```python
# ✅ GOOD: Use type hints, Pydantic, NumPy docstrings, and clear abstractions
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, AsyncGenerator
from abc import ABC, abstractmethod

class MessageCreate(BaseModel):
    """
    Pydantic model for message creation request.
    
    Attributes
    ----------
    content : str
        The message content (1-10000 characters).
    conversation_id : str
        The ID of the conversation.
    role : str
        The role of the message sender (user, assistant, or system).
    """
    content: str = Field(..., min_length=1, max_length=10000)
    conversation_id: str
    role: str = Field(default="user", pattern="^(user|assistant|system)$")

class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    
    This class defines the interface that all LLM providers must implement,
    following the Port pattern in hexagonal architecture.
    """
    
    @abstractmethod
    async def generate_stream(
        self, 
        messages: List[Dict[str, str]], 
        model: str,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Stream response from LLM.
        
        Parameters
        ----------
        messages : List[Dict[str, str]]
            List of message dictionaries with 'role' and 'content' keys.
        model : str
            The model identifier to use for generation.
        **kwargs : dict
            Additional configuration options (temperature, max_tokens, etc.).
        
        Yields
        ------
        str
            Chunks of generated text as they become available.
        
        Raises
        ------
        LLMProviderError
            If the provider encounters an error during generation.
        
        Examples
        --------
        >>> provider = OllamaProvider()
        >>> messages = [{"role": "user", "content": "Hello"}]
        >>> async for chunk in provider.generate_stream(messages, "llama3.2"):
        ...     print(chunk, end="")
        """
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get list of available models from provider.
        
        Returns
        -------
        List[Dict[str, Any]]
            List of model information dictionaries containing at least
            'id', 'name', and 'context_length' keys.
        
        Examples
        --------
        >>> provider = OllamaProvider()
        >>> models = provider.get_available_models()
        >>> print(models[0]['name'])
        'llama3.2'
        """
        pass

# ✅ Use Flask blueprints with clear separation
from flask import Blueprint, jsonify, request
from app.utils.auth import jwt_required, get_current_user

conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route('', methods=['GET'])
@jwt_required
def list_conversations():
    """
    List all conversations for the authenticated user.
    
    Returns
    -------
    tuple
        JSON response with conversations list and HTTP status code 200.
    
    Raises
    ------
    Unauthorized
        If the user is not authenticated.
    """
    user_id = get_current_user()
    conversations = conversation_service.get_user_conversations(user_id)
    return jsonify(conversations), 200

# ✅ Use service layer pattern
class ConversationService:
    def __init__(self, opensearch_client):
        self.client = opensearch_client
        self.index = "marie_conversations"
    
    def get_user_conversations(
        self, 
        user_id: str, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get conversations for a specific user.
        
        Parameters
        ----------
        user_id : str
            The unique identifier of the user.
        limit : int, optional
            Maximum number of conversations to return (default is 50).
        
        Returns
        -------
        List[Dict[str, Any]]
            List of conversation dictionaries.
        """
        # Implementation
        pass
```

### TypeScript (Frontend)

```typescript
// ✅ GOOD: Use proper TypeScript types
interface Conversation {
  id: string;
  title: string;
  model: string;
  provider: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// ✅ Use custom hooks for API interactions
export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Conversation[]>('/api/conversations');
      setConversations(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  return { conversations, loading, error, fetchConversations };
};

// ✅ Use Ant Design X components properly
import { Conversations, Sender, Bubble } from '@ant-design/x';

export const ChatInterface = () => {
  return (
    <div className="h-screen flex">
      <Conversations
        items={conversations}
        onActiveChange={handleConversationChange}
        menu={(conversation) => conversationMenu(conversation)}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          {messages.map((msg) => (
            <Bubble
              key={msg.id}
              placement={msg.role === 'user' ? 'end' : 'start'}
              content={msg.content}
              variant={msg.role === 'user' ? 'filled' : 'borderless'}
            />
          ))}
        </div>
        <Sender onSubmit={handleSendMessage} loading={isLoading} />
      </div>
    </div>
  );
};
```

---
Ports**: `*_port.py` (e.g., `llm_port.py`, `repository_port.py`)
- **Adapters**: `*_adapter.py` (e.g., `ollama_adapter.py`, `opensearch_adapter.py`)
- **Routes**: Match domain (e.g., `conversations.py`, `auth.py`)
- **Domain Entities**: `snake_case.py` in `domain/entities/`

### Variables & Functions (ALWAYS IN ENGLISH)
- **Python**: `snake_case` for functions and variables
- **TypeScript**: `camelCase` for functions/variables, `PascalCase` for components/classes
- **Constants**: `UPPER_SNAKE_CASE` in both languages
- **NO Spanish**: Use English names even if concept is in Spanish domain

### Components
- **React Components**: `PascalCase` (e.g., `ChatInterface`, `MessageBubble`)
- **Hooks**: Prefix with `use` (e.g., `useChat`, `useWebSocket`)
- **Domain Entities**: `PascalCase` classes (e.g., `Conversation`, `Message`, `User
    content = data['content']
    
    # Emit stream start
    emit('stream_start', {'conversation_id': conversation_id})
    
    # Stream response chunks
    for chunk in llm_service.generate_stream(conversation_id, content):
        emit('stream_chunk', {
            'conversation_id': conversation_id,
            'content': chunk
        })
    
    # Emit stream end
    emit('stream_end', {'conversation_id': conversation_id})
```

```typescript
// Frontend: Handle streaming with useRef to avoid stale closures
const useChat = (conversationId: string) => {
  const messagesRef = useRef<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    socket.on('stream_chunk', (data) => {
      if (data.conversation_id !== conversationId) return;
      
      // Use ref to avoid stale closure
      const currentMessages = messagesRef.current;
      const lastMessage = currentMessages[currentMessages.length - 1];
      
      if (lastMessage?.role === 'assistant') {
        lastMessage.content += data.content;
        messagesRef.current = [...currentMessages];
        setMessages([...currentMessages]);
      }
    });
  }, [conversationId]);
  
  return { messages, sendMessage };
};
```

### 2. Provider Pattern for LLMs

```python
# Use factory pattern for multi-provider support
class ProviderFactory:
    _providers: Dict[str, Type[LLMProvider]] = {}
    
    @classmethod
    def register(cls, name: str, provider: Type[LLMProvider]):
        cls._providers[name] = provider
    
    @classmethod
    def get_provider(cls, name: str, **config) -> LLMProvider:
        if name not in cls._providers:
            raise ValueError(f"Unknown provider: {name}")
        return cls._providers[name](**config)

# Register providers
ProviderFactory.register('ollama', OllamaProvider)
ProviderFactory.register('huggingface', HuggingFaceProvider)

# Use in service
provider = ProviderFactory.get_provider('ollama', base_url='http://ollama:11434')
```

### 3. Hybrid Search Pattern

```python
# Combine BM25 and k-NN for optimal results
def hybrid_search(query: str, user_id: str, top_k: int = 10):
    # Generate embedding
    embedding = embedder.encode(query)
    
    # Build hybrid query
    search_query = {
        "size": top_k,
        "query": {
            "bool": {
                "must": [
                    {"term": {"user_id": user_id}},
                    {
                        "bool": {
                            "should": [
                                # BM25 text search
                                {
                                    "multi_match": {
                                        "query": query,
                                        "fields": ["content^2", "title"],
                                        "type": "best_fields"
                                    }
                                },
                                # k-NN vector search
                                {
                                    "knn": {
                                        "embedding": {
                                            "vector": embedding.tolist(),
                                            "k": top_k
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        "highlight": {
            "fields": {
                "content": {},
                "title": {}
            }
        }
    }
    
    return opensearch_client.search(index="marie_messages", body=search_query)
```

---

## 📝 Naming Conventions

### Files & Directories
- **Frontend**: `camelCase.tsx` for components, `kebab-case/` for directories
- **Backend**: `snake_case.py` for all Python files
- **Services**: `*_service.py` (e.g., `llm_service.py`, `conversation_service.py`)
- **Routes**: Match domain (e.g., `conversations.py`, `auth.py`)

### Variables & Functions
- **Python**: `snake_case` for functions and variables
- **TypeScript**: `camelCase` for functions/variables, `PascalCase` for components/classes
- **Constants**: `UPPER_SNAKE_CASE` in both languages

### Components
- **React Components**: `PascalCase` (e.g., `ChatInterface`, `MessageBubble`)
- **Hooks**: Prefix with `use` (e.g., `useChat`, `useWebSocket`)

---

## 🔒 Security Guidelines

1. **Never hardcode secrets** - Always use environment variables
2. **Validate all inputs** - Use Pydantic on backend, Zod/TypeScript on frontend
3. **Use JWT properly** - Short-lived access tokens + refresh tokens
4. **Hash API keys** - SHA-256 before storing
5. **Sanitize HTML** - Use DOMPurify for user-generated HTML content
6. **CORS configuration** - Restrict origins in production
7. **Rate limiting** - Implement for public endpoints
8. **SQL injection** - Use parameterized queries (OpenSearch DSL)

---

## 🧪 Testing Approach

### Backend
```python
# Use pytest with fixtures
import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        yield client

def test_create_conversation(client, auth_headers):
    response = client.post(
        '/api/conversations',
        json={'title': 'Test', 'm    # App factory
│   │   ├── config.py                # Configuration
│   │   │
│   │   ├── domain/                  # DOMAIN LAYER (Core Business Logic)
│   │   │   ├── entities/            # Business entities
│   │   │   │   ├── conversation.py
│   │   │   │   ├── message.py
│   │   │   │   └── user.py
│   │   │   ├── value_objects/       # Value objects
│   │   │   │   ├── message_role.py
│   │   │   │   └── model_config.py
│   │   │   └── ports/               # Ports (interfaces/protocols)
│   │   │       ├── llm_port.py
│   │   │       ├── repository_port.py
│   │   │       └── event_port.py
│   │   │
│   │   ├── application/             # APPLICATION LAYER (Use Cases)
│   │   │   ├── services/            # Application services
│   │   │   │   ├── conversation_service.py
│   │   │   │   ├── message_service.py
│   │   │   │   └── search_service.py
│   │   │   └── dtos/                # Data Transfer Objects
│   │   │       ├── conversation_dto.py
│   │   │       └── message_dto.py
│   │   │
│   │   ├── infrastructure/          # INFRASTRUCTURE LAYER (Adapters)
│   │   │   ├── adapters/
│   │   │   │   ├── llm/
│   │   │   │   │   ├── ollama_adapter.py
│   │   │   │   │   └── huggingface_adapter.py
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── opensearch_adapter.py
│   │   │   │   │   └── opensearch_conversation_repo.py
│   │   │   │   └── external/
│   │   │   │       ├── speech_adapter.py
│   │   │   │       └── image_adapter.py
│   │   │   ├── db.py                # OpenSearch client setup
│   │   │   └── config/              # Infrastructure config
│   │   │
│   │   ├── presentation/            # PRESENTATION LAYER (Controllers)
│   │   │   ├── routes/              # Flask blueprints (HTTP adapters)
│   │   │   │   ├── auth.py
│   │   │   │   ├── conversations.py
│   │   │   │   ├── models.py
│   │   │   │   └── v1/              # External API v1
│   │   │   └── sockets/             # WebSocket handlers
│   │   │       └── chat_socket.py
│   │   │
│   │   ├── shared/                  # Shared utilities
│   │   │   ├── utils/
│   │   │   └── exceptions/
│   │   │
│   │   └── di/                      # Dependency Injection container
│   │       └── container.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile.dev
│   └── run.py    lick('[data-testid="new-conversation"]');
  
  await expect(page.locator('.conversation-item')).toHaveCount(1);
});
```

---

## 🎯 Performance Optimization

### Backend
1. **Async operations** - Use async/await for I/O operations
2. **Connection pooling** - Reuse OpenSearch connections
3. **Caching** - Cache model lists, settings (5-minute TTL)
4. **Batch operations** - Bulk index/update in OpenSearch
5. **GPU optimization** - Use torch.cuda for model inference

### Frontend
1. **Code splitting** - Dynamic imports for heavy components
2. **Memoization** - Use `useMemo` and `useCallback` appropriately
3. **Virtualization** - For long message lists (consider react-window)
4. **Debouncing** - For search inputs and API calls
5. **Image optimization** - Next.js Image component for static assets

---

## 📦 Project Structure

```
marie_chat/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py            # Configuration
│   │   ├── db.py                # OpenSearch client
│   │   ├── models/              # Pydantic models
│   │   ├── routes/              # Flask blueprints
│   │   │   ├── auth.py          # Authentication
│   │   │   ├── conversations.py # Conversations
│   │   │   ├── models.p (Hexagonal Architecture)

1. **Domain Layer** (Start here):
   - Define entities in `domain/entities/`
   - Define ports (interfaces) in `domain/ports/`
   - Pure business logic, NO infrastructure dependencies

2. **Application Layer**:
   - Create service in `application/services/`
   - Implement use cases
   - Define DTOs in `application/dtos/`

3. **Infrastructure Layer**:
   - Create adapters in `infrastructure/adapters/`
   - Implement port interfaces
   - Connect to external systems

4. **Presentation Layer**:
   - Add routes in `presentation/routes/`
   - Register blueprint in `backend/app/__init__.py`
   - Handle HTTP/WebSocket concerns only

5. **Frontend**:
   - Create components in `frontend/components/`
   - Add hooks in `frontend/hooks/`
   - Create page/route in `frontend/app/`
   - Update types in `frontend/types/`

6. **Testing**:
   - Unit tests for domain entities (no mocks needed)
   - Integration tests for adapters
   - E2E tests for complete flows

### Adding a New LLM Provider (Hexagonal Architecture)

1. **Define Port** (if not exists):
   ```python
   # domain/ports/llm_port.py
   class LLMPort(Protocol):
       async def generate_stream(self, messages: List[Message]) -> AsyncGenerator[str, None]: ...
   ```

2. **Create Adapter**:
   ```python
   # infrastructure/adapters/llm/new_provider_adapter.py
   class NewProviderAdapter(LLMPort):
       async def generate_stream(self, messages: List[Message]) -> AsyncGenerator[str, None]:
           # Implementation
           pass
   ```

3. **Register in DI Container**:
   ```python
   # di/container.py
   def register_llm_providers(container):
       container.register('ollama_provider', OllamaAdapter)
       container.register('huggingface_provider', HuggingFaceAdapter)
       container.register('new_provider', NewProviderAdapter)  # Add here
   ```

4. **Configuration**:
   - Add settings in `.env`
   - Update config in `config.py`

5. **Frontend**:
   - Update `ModelSelector` component
   - Add provider option in UI
- **ALL CODE IN ENGLISH** - Variables, functions, classes, comments
- **ALL DOCUMENTATION IN ENGLISH** - README, docstrings, commit messages
- **Hexagonal Architecture** - Respect layer boundaries (Domain → Application → Infrastructure → Presentation)
- **SOLID Principles** - Apply in every new class/module
- **Dependency Inversion** - Always depend on ports/protocols, never concrete implementations
- **Write clear, self-documenting code** with docstrings and comments (in English)
- **Prefer composition over inheritance**
- **Keep components small and focused** (Single Responsibility Principle)

### TypeScript
- **Use TypeScript strictly** - avoid `any`, prefer explicit types
- **Domain entities** - Mirror backend domain models in TypeScript interfaces

### Error Handling & Logging
- **Handle errors gracefully** - provide useful error messages (in English)
- **Log important events** - but avoid excessive logging
- **Error messages in English** - For consistency and debugging

### Testing & Documentation
- **Test critical paths** - especially authentication and chat flow
- **Update documentation** when adding features (in English)
- **Document architectural decisions** - Explain hexagonal/SOLID choices

### Workflow
- **NEVER ask for commit confirmation** - Complete tasks fully
- **Use `docker compose`** (with space) - NOT `docker-compose`
- **Complete implementations** - Don't stop mid-task asking for approval
- **Report results, not intentions** - Do the work first, then summarize what was done
│   │   └── theme.ts             # Ant Design theme
│   ├── stores/                  # Zustand stores
│   ├── types/                   # TypeScript types
│   ├── package.json
│   └── Dockerfile.dev
├── docs/                        # Documentation
├── tests/                       # E2E tests
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Common Tasks

### Adding a New Feature

1. **Backend**:
   - Create service in `backend/app/services/`
   - Add routes in `backend/app/routes/`
   - Register blueprint in `backend/app/__init__.py`
   - Add tests

2. **Frontend**:
   - Create components in `frontend/components/`
   - Add hooks in `frontend/hooks/`
   - Create page/route in `frontend/app/`
   - Update types in `frontend/types/`

### Adding a New LLM Provider

1. Create class inheriting from `LLMProvider` in `backend/app/services/`
2. Implement `generate_stream()` and `get_available_models()`
3. Register in `ProviderFactory`
4. Add configuration in `.env`
5. Update frontend `ModelSelector` component

---

## 💡 Remember

- **Always follow the existing patterns** in the codebase
- **Write clear, self-documenting code** with docstrings and comments
- **Prefer composition over inheritance**
- **Keep components small and focused** (Single Responsibility Principle)
- **Use TypeScript strictly** - avoid `any`, prefer explicit types
- **Handle errors gracefully** - provide useful error messages
- **Log important events** - but avoid excessive logging
- **Update documentation** when adding features
- **Test critical paths** - especially authentication and chat flow

---

## 🌟 Project Philosophy

MARIE is built with these principles:

1. **User-Centric Design**: Intuitive, responsive, accessible
2. **Extensibility**: Easy to add new providers, features
3. **Performance**: Fast responses, efficient resource usage
4. **Security**: Privacy-first, secure by default
5. **Reliability**: Robust error handling, graceful degradation
6. **Developer Experience**: Clean code, good documentation

---

**Version**: 2.0.0  
**Last Updated**: December 31, 2025  
**Maintained by**: Omar Zapata

---

## 🔗 Quick Links

- [Project Status](../docs/PROJECT_STATUS.md)
- [Specifications](../docs/SPECIFICATIONS.md)
- [API Documentation](http://localhost:5000/api/v1/docs)
- [OpenSearch Dashboards](http://localhost:5601)
