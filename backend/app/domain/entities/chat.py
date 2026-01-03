from dataclasses import dataclass
from typing import Any


@dataclass
class ModelInfo:
    """Information about an LLM model"""

    id: str
    name: str
    provider: str
    description: str | None = None
    context_length: int | None = None
    max_tokens: int | None = None
    parameters: str | None = None  # e.g., "7B", "13B", "70B"
    quantization: str | None = None  # e.g., "Q4_K_M", "Q8_0"
    size: str | None = None  # e.g., "4.1GB", "7.3GB"
    capabilities: list[str] | None = None  # e.g., ["chat", "completion", "embeddings"]
    metadata: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "provider": self.provider,
            "description": self.description,
            "context_length": self.context_length,
            "max_tokens": self.max_tokens,
            "parameters": self.parameters,
            "quantization": self.quantization,
            "size": self.size,
            "capabilities": self.capabilities or [],
            "metadata": self.metadata or {},
        }


@dataclass
class ChatMessage:
    """Chat message entity"""

    role: str  # 'system', 'user', 'assistant'
    content: str

    def to_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


@dataclass
class ChatCompletionChunk:
    """Streaming chunk from chat completion"""

    content: str
    done: bool = False
    model: str | None = None
    tokens_used: int | None = None
    metadata: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "content": self.content,
            "done": self.done,
            "model": self.model,
            "tokens_used": self.tokens_used,
            "metadata": self.metadata or {},
        }
