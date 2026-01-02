"""
HuggingFace LLM Provider
Handles communication with HuggingFace Inference API
"""

import os
from collections.abc import AsyncGenerator
from typing import Any

import requests
from huggingface_hub import AsyncInferenceClient

from .llm_provider import ChatCompletionChunk, ChatMessage, LLMProvider, ModelInfo


class HuggingFaceProvider(LLMProvider):
    """Provider for HuggingFace Inference API using huggingface_hub"""

    def __init__(self, config: dict[str, Any] | None = None):
        super().__init__(config)
        self.api_key = config.get("api_key") if config else None
        self.api_key = self.api_key or os.getenv("HUGGINGFACE_API_KEY")
        self.provider_name = "huggingface"
        self._client: AsyncInferenceClient | None = None

        # Popular models for quick listing
        self._popular_models = [
            {
                "id": "meta-llama/Llama-3.1-8B-Instruct",
                "name": "Llama 3.1 8B Instruct",
                "parameters": "8B",
                "description": "Meta's Llama 3.1 8B optimized for chat",
            },
            {
                "id": "mistralai/Mistral-7B-Instruct-v0.3",
                "name": "Mistral 7B Instruct v0.3",
                "parameters": "7B",
                "description": "Mistral AI's 7B instruct model",
            },
            {
                "id": "microsoft/Phi-3-mini-4k-instruct",
                "name": "Phi-3 Mini",
                "parameters": "3.8B",
                "description": "Microsoft's lightweight Phi-3 model",
            },
            {
                "id": "google/gemma-2-2b-it",
                "name": "Gemma 2 2B IT",
                "parameters": "2B",
                "description": "Google's Gemma 2 2B instruct model",
            },
            {
                "id": "HuggingFaceH4/zephyr-7b-beta",
                "name": "Zephyr 7B",
                "parameters": "7B",
                "description": "HuggingFace's Zephyr 7B chat model",
            },
        ]

    @property
    def client(self) -> AsyncInferenceClient:
        """Lazy-initialize InferenceClient"""
        if self._client is None:
            self._client = AsyncInferenceClient(token=self.api_key)
        return self._client

    def list_models(self) -> list[ModelInfo]:
        """List available models from HuggingFace"""
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

        # If not found in popular, return a generic one
        return ModelInfo(
            id=model_id,
            name=model_id,
            provider="huggingface",
            description="HuggingFace model",
            capabilities=["chat", "completion"],
            metadata={
                "hub_url": f"https://huggingface.co/{model_id}",
                "requires_api_key": True,
            },
        )

    async def chat_completion(
        self,
        model: str,
        messages: list[ChatMessage],
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """Generate chat completion using HuggingFace InferenceClient"""
        if not self.api_key:
            raise ValueError("HuggingFace API key is required.")

        # Convert messages to dict format for InferenceClient
        hf_messages = [{"role": m.role, "content": m.content} for m in messages]

        try:
            if stream:
                async for chunk in await self.client.chat_completion(
                    model=model,
                    messages=hf_messages,
                    stream=True,
                    temperature=temperature,
                    max_tokens=max_tokens or 1024,
                    **kwargs,
                ):
                    if chunk.choices[0].delta.content:
                        yield ChatCompletionChunk(
                            content=chunk.choices[0].delta.content,
                            done=False,
                            model=model,
                        )
                yield ChatCompletionChunk(content="", done=True, model=model)
            else:
                response = await self.client.chat_completion(
                    model=model,
                    messages=hf_messages,
                    stream=False,
                    temperature=temperature,
                    max_tokens=max_tokens or 1024,
                    **kwargs,
                )
                yield ChatCompletionChunk(
                    content=response.choices[0].message.content,
                    done=True,
                    model=model,
                )
        except Exception as e:
            print(f"Error in HuggingFace chat completion: {e}")
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
        if not self.api_key:
            raise ValueError("HuggingFace API key is required.")

        prompt = self._messages_to_prompt(messages)
        headers = {"Authorization": f"Bearer {self.api_key}"}
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
            response = requests.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers=headers,
                json=payload,
                timeout=120,
            )
            response.raise_for_status()
            data = response.json()

            content = ""
            if isinstance(data, list) and len(data) > 0:
                content = data[0].get("generated_text", "")
            elif isinstance(data, dict):
                content = data.get("generated_text", "")

            return ChatCompletionChunk(content=content, done=True, model=model)
        except Exception as e:
            print(f"Error in HuggingFace sync chat: {e}")
            raise

    def validate_connection(self) -> bool:
        """Validate connection using whoami API"""
        if not self.api_key:
            return False
        try:
            response = requests.get(
                "https://huggingface.co/api/whoami-v2",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10,
            )
            return response.status_code == 200
        except Exception as e:
            print(f"HuggingFace validation error: {e}")
            return False

    def _messages_to_prompt(self, messages: list[ChatMessage]) -> str:
        """Simple fallback for prompt generation"""
        prompt = ""
        for msg in messages:
            prompt += f"{msg.role}: {msg.content}\n"
        prompt += "assistant: "
        return prompt

    def supports_streaming(self) -> bool:
        return True

    async def close(self):
        """Close the client if needed"""
        self._client = None


# Global instance
huggingface_provider = HuggingFaceProvider()
