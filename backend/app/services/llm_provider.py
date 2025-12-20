"""Base LLM provider interface."""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any, Optional


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion.
        
        Args:
            model: Model name/identifier
            messages: List of message dicts with 'role' and 'content'
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
        
        Yields:
            Token chunks as strings
        """
        pass
    
    @abstractmethod
    async def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> str:
        """Non-streaming chat completion.
        
        Args:
            model: Model name/identifier
            messages: List of message dicts
            **kwargs: Additional parameters
        
        Returns:
            Complete response as string
        """
        pass
    
    @abstractmethod
    async def list_models(self) -> List[str]:
        """List available models.
        
        Returns:
            List of model names
        """
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Get provider name.
        
        Returns:
            Provider name (e.g., 'ollama', 'huggingface')
        """
        pass

