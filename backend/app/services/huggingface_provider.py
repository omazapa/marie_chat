"""
HuggingFace LLM Provider
Handles communication with HuggingFace Inference API
"""

import json
import os
from collections.abc import AsyncGenerator
from typing import Any

import httpx
import requests

from .llm_provider import ChatCompletionChunk, ChatMessage, LLMProvider, ModelInfo


class HuggingFaceProvider(LLMProvider):
    """Provider for HuggingFace Inference API"""

    def __init__(self, config: dict[str, Any] | None = None):
        super().__init__(config)
        self.api_key = config.get("api_key") if config else None
        self.api_key = self.api_key or os.getenv("HUGGINGFACE_API_KEY")
        self.base_url = config.get("base_url") if config else None
        self.base_url = self.base_url or "https://router.huggingface.co/hf-inference/models"
        self._client: httpx.AsyncClient | None = None  # Lazy init
        self._sync_client: httpx.Client | None = None  # Lazy init
        self.provider_name = "huggingface"

        # Popular models for quick listing
        self._popular_models = [
            {
                "id": "meta-llama/Llama-2-7b-chat-hf",
                "name": "Llama 2 7B Chat",
                "parameters": "7B",
                "description": "Meta's Llama 2 7B optimized for chat",
            },
            {
                "id": "meta-llama/Llama-2-13b-chat-hf",
                "name": "Llama 2 13B Chat",
                "parameters": "13B",
                "description": "Meta's Llama 2 13B optimized for chat",
            },
            {
                "id": "mistralai/Mistral-7B-Instruct-v0.2",
                "name": "Mistral 7B Instruct",
                "parameters": "7B",
                "description": "Mistral AI's 7B instruct model",
            },
            {
                "id": "tiiuae/falcon-7b-instruct",
                "name": "Falcon 7B Instruct",
                "parameters": "7B",
                "description": "TII's Falcon 7B instruct model",
            },
            {
                "id": "HuggingFaceH4/zephyr-7b-beta",
                "name": "Zephyr 7B",
                "parameters": "7B",
                "description": "HuggingFace's Zephyr 7B chat model",
            },
        ]

    @property
    def client(self):
        """Lazy-initialize httpx client to ensure it's created in the correct event loop"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=300.0)
        return self._client

    @property
    def sync_client(self):
        """Lazy-initialize synchronous httpx client"""
        if self._sync_client is None:
            self._sync_client = httpx.Client(timeout=300.0)
        return self._sync_client

    def list_models(self) -> list[ModelInfo]:
        """List available models from HuggingFace"""
        # For HuggingFace, we return a curated list of popular models
        # In production, you might want to query the HuggingFace Hub API
        model_infos = []

        for model in self._popular_models:
            model_info = ModelInfo(
                id=model["id"],
                name=model["name"],
                provider="huggingface",
                description=model["description"],
                parameters=model.get("parameters"),
                capabilities=["chat", "completion"],
                metadata={
                    "hub_url": f"https://huggingface.co/{model['id']}",
                    "requires_api_key": True,
                },
            )
            model_infos.append(model_info)

        return model_infos

    def get_model_info(self, model_id: str) -> ModelInfo | None:
        """Get detailed information about a specific model"""
        # Check if it's in our popular models list
        for model in self._popular_models:
            if model["id"] == model_id:
                return ModelInfo(
                    id=model["id"],
                    name=model["name"],
                    provider="huggingface",
                    description=model["description"],
                    parameters=model.get("parameters"),
                    capabilities=["chat", "completion"],
                    metadata={
                        "hub_url": f"https://huggingface.co/{model['id']}",
                        "requires_api_key": True,
                    },
                )

        # If not found, try to query the HuggingFace API
        try:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            response = requests.get(
                f"https://huggingface.co/api/models/{model_id}", headers=headers, timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                return ModelInfo(
                    id=model_id,
                    name=data.get("id", model_id),
                    provider="huggingface",
                    description=data.get("description", ""),
                    capabilities=["chat", "completion"],
                    metadata={
                        "hub_url": f"https://huggingface.co/{model_id}",
                        "requires_api_key": True,
                        "downloads": data.get("downloads", 0),
                        "likes": data.get("likes", 0),
                        "tags": data.get("tags", []),
                    },
                )
        except Exception as e:
            print(f"Error getting HuggingFace model info for {model_id}: {e}")

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
        """Generate chat completion using HuggingFace Inference API"""

        if not self.api_key:
            raise ValueError(
                "HuggingFace API key is required. Set HUGGINGFACE_API_KEY environment variable."
            )

        # Convert messages to prompt format
        prompt = self._messages_to_prompt(messages)

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        payload: dict[str, Any] = {
            "inputs": prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens or 1024,
                "return_full_text": False,
                **kwargs,
            },
        }

        if stream:
            # HuggingFace Inference API doesn't support streaming by default
            # We'll simulate streaming by yielding the full response in chunks
            payload["parameters"]["stream"] = True

        try:
            url = f"{self.base_url}/{model}"

            if stream:
                # Attempt streaming if model supports it
                try:
                    async with self.client.stream(
                        "POST", url, headers=headers, json=payload
                    ) as response:
                        if response.status_code == 200:
                            buffer = ""
                            async for line in response.aiter_lines():
                                if line:
                                    try:
                                        data = json.loads(line)
                                        if "generated_text" in data:
                                            text = data["generated_text"]
                                            new_content = text[len(buffer) :]
                                            buffer = text

                                            if new_content:
                                                yield ChatCompletionChunk(
                                                    content=new_content,
                                                    done=False,
                                                    model=model,
                                                    metadata=data,
                                                )
                                    except json.JSONDecodeError:
                                        continue

                            # Final chunk
                            yield ChatCompletionChunk(content="", done=True, model=model)
                            return
                except Exception as stream_error:
                    print(f"Streaming not supported, falling back to non-streaming: {stream_error}")

            # Non-streaming or fallback
            response = await self.client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

            # Handle different response formats
            if isinstance(data, list) and len(data) > 0:
                content = data[0].get("generated_text", "")
            elif isinstance(data, dict):
                content = data.get("generated_text", data.get("content", ""))
            else:
                content = str(data)

            if stream:
                # Simulate streaming by yielding in chunks
                chunk_size = 50
                for i in range(0, len(content), chunk_size):
                    chunk = content[i : i + chunk_size]
                    yield ChatCompletionChunk(
                        content=chunk, done=(i + chunk_size >= len(content)), model=model
                    )
            else:
                yield ChatCompletionChunk(content=content, done=True, model=model)

        except httpx.HTTPStatusError as e:
            error_msg = f"HuggingFace API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('error', '')}"
            except Exception:
                pass

            yield ChatCompletionChunk(content=f"Error: {error_msg}", done=True, model=model)
        except Exception as e:
            yield ChatCompletionChunk(content=f"Error: {str(e)}", done=True, model=model)

    def chat_completion_sync(
        self,
        model: str,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> ChatCompletionChunk:
        """Generate chat completion synchronously using HuggingFace Inference API"""
        if not self.api_key:
            raise ValueError(
                "HuggingFace API key is required. Set HUGGINGFACE_API_KEY environment variable."
            )

        prompt = self._messages_to_prompt(messages)

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        payload = {
            "inputs": prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens or 1024,
                "return_full_text": False,
                **kwargs,
            },
        }

        try:
            url = f"{self.base_url}/{model}"
            response = requests.post(url, headers=headers, json=payload, timeout=300.0)
            response.raise_for_status()
            data = response.json()

            content = ""
            if isinstance(data, list) and len(data) > 0:
                content = data[0].get("generated_text", "")
            elif isinstance(data, dict):
                content = data.get("generated_text", "")

            return ChatCompletionChunk(content=content, done=True, model=model, metadata=data)
        except Exception as e:
            print(f"Error in HuggingFace sync chat: {e}")
            raise

    def validate_connection(self) -> bool:
        """Validate that HuggingFace API is accessible"""
        if not self.api_key:
            return False

        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            # Use a simple model endpoint to test connectivity
            response = self.sync_client.get("https://huggingface.co/api/whoami-v2", headers=headers)
            return response.status_code == 200
        except Exception:
            return False

    def _messages_to_prompt(self, messages: list[ChatMessage]) -> str:
        """Convert chat messages to prompt format"""
        prompt_parts = []

        for msg in messages:
            role = msg.role
            content = msg.content

            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")

        # Add final assistant prompt
        prompt_parts.append("Assistant:")

        return "\n\n".join(prompt_parts)

    def supports_streaming(self) -> bool:
        """HuggingFace Inference API has limited streaming support"""
        return True  # We simulate streaming

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Global instance (requires API key to be set)
huggingface_provider = HuggingFaceProvider()
