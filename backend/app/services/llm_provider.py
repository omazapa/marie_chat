"""
LLM Provider Base Class
Abstract base class for implementing different LLM providers
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any

from app.domain.entities.chat import ChatCompletionChunk, ChatMessage, ModelInfo


class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    Implementations: OllamaProvider, HuggingFaceProvider, OpenAIProvider, etc.
    """

    def __init__(self, config: dict[str, Any] | None = None):
        """
        Initialize provider with configuration

        Args:
            config: Provider-specific configuration (API keys, endpoints, etc.)
        """
        self.config = config or {}
        self.provider_name = self.__class__.__name__.replace("Provider", "").lower()

    @abstractmethod
    def list_models(self) -> list[ModelInfo]:
        """
        List all available models from this provider

        Returns:
            List of ModelInfo objects
        """
        pass

    @abstractmethod
    def get_model_info(self, model_id: str) -> ModelInfo | None:
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
        messages: list[ChatMessage],
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
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
        if False:
            yield ChatCompletionChunk(content="")

    @abstractmethod
    def chat_completion_sync(
        self,
        model: str,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> ChatCompletionChunk:
        """
        Generate chat completion synchronously (non-streaming)

        Args:
            model: Model identifier
            messages: List of chat messages
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters

        Returns:
            ChatCompletionChunk object
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

    def get_default_model(self) -> str | None:
        """Get the default model for this provider"""
        return self.config.get("default_model")

    def health_check(self) -> dict[str, Any]:
        """
        Perform health check on provider

        Returns:
            Dictionary with health status information
        """
        try:
            is_valid = self.validate_connection()
            models = self.list_models() if is_valid else []

            return {
                "provider": self.provider_name,
                "status": "healthy" if is_valid else "unhealthy",
                "available": is_valid,
                "models_count": len(models),
                "supports_streaming": self.supports_streaming(),
                "supports_embeddings": self.supports_embeddings(),
                "default_model": self.get_default_model(),
            }
        except Exception as e:
            return {
                "provider": self.provider_name,
                "status": "error",
                "available": False,
                "error": str(e),
            }
