"""HuggingFace LLM provider."""
from typing import AsyncGenerator, List, Dict, Any
import os
import httpx
from app.services.llm_provider import LLMProvider


class HuggingFaceProvider(LLMProvider):
    """HuggingFace provider for LLM interactions."""
    
    def __init__(self, api_key: str = None):
        """Initialize HuggingFace provider."""
        self.api_key = api_key or os.environ.get('HUGGINGFACE_API_KEY')
        if not self.api_key:
            raise ValueError("HUGGINGFACE_API_KEY is required")
        self.base_url = "https://api-inference.huggingface.co"
    
    async def stream_chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion from HuggingFace.
        
        Args:
            model: Model ID (e.g., 'meta-llama/Llama-3.2-3B-Instruct')
            messages: List of message dicts with 'role' and 'content'
            **kwargs: Additional parameters
        
        Yields:
            Token chunks as strings
        """
        url = f"{self.base_url}/models/{model}"
        
        # Format messages for HuggingFace
        # Convert to prompt format (simple concatenation for now)
        prompt = self._format_messages(messages)
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "temperature": kwargs.get("temperature", 0.7),
                "max_new_tokens": kwargs.get("max_tokens", 512),
                "return_full_text": False,
            },
            "options": {
                "wait_for_model": True,
            }
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                # HuggingFace returns full text, so we simulate streaming
                text = data[0].get("generated_text", "") if isinstance(data, list) else data.get("generated_text", "")
                
                # Simulate streaming by yielding chunks
                chunk_size = 10
                for i in range(0, len(text), chunk_size):
                    chunk = text[i:i + chunk_size]
                    if chunk:
                        yield chunk
        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.text}"
            print(f"HuggingFace API error: {error_msg}")
            yield f"[Error: {error_msg}]"
        except Exception as e:
            error_msg = str(e)
            print(f"HuggingFace error: {error_msg}")
            yield f"[Error: {error_msg}]"
    
    async def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> str:
        """Non-streaming chat completion.
        
        Args:
            model: Model ID
            messages: List of message dicts
            **kwargs: Additional parameters
        
        Returns:
            Complete response as string
        """
        full_response = ""
        async for chunk in self.stream_chat(model, messages, **kwargs):
            full_response += chunk
        return full_response
    
    async def list_models(self) -> List[str]:
        """List available HuggingFace models.
        
        Note: This is a simplified implementation.
        In production, you might want to use the HuggingFace Hub API.
        
        Returns:
            List of recommended model names
        """
        # Return some recommended models
        return [
            "meta-llama/Llama-3.2-3B-Instruct",
            "mistralai/Mistral-7B-Instruct-v0.2",
            "google/gemma-7b-it",
            "microsoft/Phi-3-mini-4k-instruct",
            "Qwen/Qwen2.5-7B-Instruct",
        ]
    
    def get_provider_name(self) -> str:
        """Get provider name."""
        return "huggingface"
    
    def _format_messages(self, messages: List[Dict[str, str]]) -> str:
        """Format messages into a prompt string.
        
        Args:
            messages: List of message dicts
        
        Returns:
            Formatted prompt string
        """
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
            elif role == "system":
                prompt_parts.append(f"System: {content}")
        
        return "\n\n".join(prompt_parts) + "\n\nAssistant:"

