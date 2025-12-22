"""
LLM Provider Base Class
Abstract base class for implementing different LLM providers
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class ModelInfo:
    """Information about an LLM model"""
    id: str
    name: str
    provider: str
    description: Optional[str] = None
    context_length: Optional[int] = None
    max_tokens: Optional[int] = None
    parameters: Optional[str] = None  # e.g., "7B", "13B", "70B"
    quantization: Optional[str] = None  # e.g., "Q4_K_M", "Q8_0"
    size: Optional[str] = None  # e.g., "4.1GB", "7.3GB"
    capabilities: Optional[List[str]] = None  # e.g., ["chat", "completion", "embeddings"]
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'provider': self.provider,
            'description': self.description,
            'context_length': self.context_length,
            'max_tokens': self.max_tokens,
            'parameters': self.parameters,
            'quantization': self.quantization,
            'size': self.size,
            'capabilities': self.capabilities or [],
            'metadata': self.metadata or {}
        }


@dataclass
class ChatMessage:
    """Chat message"""
    role: str  # 'system', 'user', 'assistant'
    content: str
    
    def to_dict(self) -> Dict[str, str]:
        return {'role': self.role, 'content': self.content}


@dataclass
class ChatCompletionChunk:
    """Streaming chunk from chat completion"""
    content: str
    done: bool = False
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'content': self.content,
            'done': self.done,
            'model': self.model,
            'tokens_used': self.tokens_used,
            'metadata': self.metadata or {}
        }


class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    Implementations: OllamaProvider, HuggingFaceProvider, OpenAIProvider, etc.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize provider with configuration
        
        Args:
            config: Provider-specific configuration (API keys, endpoints, etc.)
        """
        self.config = config or {}
        self.provider_name = self.__class__.__name__.replace('Provider', '').lower()
    
    @abstractmethod
    def list_models(self) -> List[ModelInfo]:
        """
        List all available models from this provider
        
        Returns:
            List of ModelInfo objects
        """
        pass
    
    @abstractmethod
    def get_model_info(self, model_id: str) -> Optional[ModelInfo]:
        """
        Get detailed information about a specific model
        
        Args:
            model_id: Model identifier
            
        Returns:
            ModelInfo object or None if model not found
        """
        pass
    
    @abstractmethod
    async def chat_completion(
        self,
        model: str,
        messages: List[ChatMessage],
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """
        Generate chat completion (streaming or non-streaming)
        
        Args:
            model: Model identifier
            messages: List of chat messages
            stream: Whether to stream the response
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters
            
        Yields:
            ChatCompletionChunk objects
        """
        pass
    
    @abstractmethod
    def validate_connection(self) -> bool:
        """
        Validate that the provider is accessible and configured correctly
        
        Returns:
            True if connection is valid, False otherwise
        """
        pass
    
    def get_provider_name(self) -> str:
        """Get the provider name"""
        return self.provider_name
    
    def supports_streaming(self) -> bool:
        """Check if provider supports streaming responses"""
        return True  # Default to True, override if not supported
    
    def supports_embeddings(self) -> bool:
        """Check if provider supports embeddings"""
        return False  # Default to False, override if supported
    
    def get_default_model(self) -> Optional[str]:
        """Get the default model for this provider"""
        return self.config.get('default_model')
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on provider
        
        Returns:
            Dictionary with health status information
        """
        try:
            is_valid = self.validate_connection()
            models = self.list_models() if is_valid else []
            
            return {
                'provider': self.provider_name,
                'status': 'healthy' if is_valid else 'unhealthy',
                'available': is_valid,
                'models_count': len(models),
                'supports_streaming': self.supports_streaming(),
                'supports_embeddings': self.supports_embeddings(),
                'default_model': self.get_default_model()
            }
        except Exception as e:
            return {
                'provider': self.provider_name,
                'status': 'error',
                'available': False,
                'error': str(e)
            }
