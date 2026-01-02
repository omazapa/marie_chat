"""
OpenAI LLM Provider
Handles communication with OpenAI-compatible APIs
"""

import os
from collections.abc import AsyncGenerator
from typing import Any

from openai import AsyncOpenAI, OpenAI

from .llm_provider import ChatCompletionChunk, ChatMessage, LLMProvider, ModelInfo


class OpenAIProvider(LLMProvider):
    """Provider for OpenAI-compatible LLM APIs"""

    def __init__(self, config: dict[str, Any] | None = None):
        super().__init__(config)
        self.api_key = config.get("api_key") if config else None
        self.api_key = self.api_key or os.getenv("OPENAI_API_KEY", "")

        self.base_url = config.get("base_url") if config else None
        self.base_url = self.base_url or os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

        self.provider_name = "openai"
        self._async_client: AsyncOpenAI | None = None
        self._sync_client: OpenAI | None = None

    @property
    def async_client(self) -> AsyncOpenAI:
        """Lazy-initialize async OpenAI client"""
        if self._async_client is None:
            self._async_client = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
        return self._async_client

    @property
    def sync_client(self) -> OpenAI:
        """Lazy-initialize sync OpenAI client"""
        if self._sync_client is None:
            self._sync_client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        return self._sync_client

    def list_models(self) -> list[ModelInfo]:
        """List available models from OpenAI-compatible API"""
        try:
            # Use sync client for listing models
            models = self.sync_client.models.list()

            model_infos = []
            for model in models.data:
                model_info = ModelInfo(
                    id=model.id,
                    name=model.id,
                    provider="openai",
                    description=f"OpenAI-compatible model: {model.id}",
                    capabilities=["chat", "completion"],
                    metadata={
                        "created": model.created,
                        "owned_by": model.owned_by,
                    },
                )
                model_infos.append(model_info)

            return model_infos
        except Exception as e:
            print(f"Error listing OpenAI models: {e}")
            # Return a default model if listing fails but we have a default configured
            default_model = os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4o")
            if default_model:
                return [
                    ModelInfo(
                        id=default_model,
                        name=default_model,
                        provider="openai",
                        description="Default OpenAI model (listing failed)",
                        capabilities=["chat", "completion"],
                    )
                ]
            return []

    def get_model_info(self, model_id: str) -> ModelInfo | None:
        """Get detailed information about a specific model"""
        try:
            model = self.sync_client.models.retrieve(model_id)
            return ModelInfo(
                id=model.id,
                name=model.id,
                provider="openai",
                description=f"OpenAI-compatible model: {model.id}",
                capabilities=["chat", "completion"],
                metadata={
                    "created": model.created,
                    "owned_by": model.owned_by,
                },
            )
        except Exception as e:
            print(f"Error getting OpenAI model info for {model_id}: {e}")
            return None

    async def chat_completion(
        self,
        model: str,
        messages: list[ChatMessage],
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """Generate chat completion (streaming or non-streaming)"""
        message_dicts = [msg.to_dict() for msg in messages]

        try:
            if stream:
                response = await self.async_client.chat.completions.create(
                    model=model,
                    messages=message_dicts,
                    stream=True,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs,
                )

                async for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield ChatCompletionChunk(
                            content=chunk.choices[0].delta.content,
                            done=False,
                            model=model,
                            metadata=chunk.model_dump(),
                        )

                yield ChatCompletionChunk(content="", done=True, model=model)
            else:
                response = await self.async_client.chat.completions.create(
                    model=model,
                    messages=message_dicts,
                    stream=False,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs,
                )

                yield ChatCompletionChunk(
                    content=response.choices[0].message.content or "",
                    done=True,
                    model=model,
                    tokens_used=response.usage.total_tokens if response.usage else None,
                    metadata=response.model_dump(),
                )
        except Exception as e:
            print(f"Error in OpenAI chat completion: {e}")
            yield ChatCompletionChunk(content=f"Error: {str(e)}", done=True, model=model)

    def chat_completion_sync(
        self,
        model: str,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> ChatCompletionChunk:
        """Generate chat completion synchronously"""
        message_dicts = [msg.to_dict() for msg in messages]

        try:
            response = self.sync_client.chat.completions.create(
                model=model,
                messages=message_dicts,
                stream=False,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            )

            return ChatCompletionChunk(
                content=response.choices[0].message.content or "",
                done=True,
                model=model,
                tokens_used=response.usage.total_tokens if response.usage else None,
                metadata=response.model_dump(),
            )
        except Exception as e:
            print(f"Error in OpenAI sync chat: {e}")
            raise

    def validate_connection(self) -> bool:
        """Validate that OpenAI-compatible API is accessible"""
        try:
            # Try to list models as a simple connectivity test
            self.sync_client.models.list()
            return True
        except Exception:
            return False

    def supports_embeddings(self) -> bool:
        """OpenAI-compatible APIs usually support embeddings"""
        return True
