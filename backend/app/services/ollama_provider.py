"""Ollama LLM provider."""
from typing import AsyncGenerator, List, Dict, Any
import os
import httpx
from app.services.llm_provider import LLMProvider


class OllamaProvider(LLMProvider):
    """Ollama provider for LLM interactions."""
    
    def __init__(self, base_url: str = None):
        """Initialize Ollama provider."""
        self.base_url = base_url or os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')
    
    async def stream_chat(self, model: str, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        """Stream chat completion from Ollama.
        
        Args:
            model: Model name (e.g., 'llama3.2')
            messages: List of message dicts with 'role' and 'content'
            **kwargs: Additional parameters (temperature, etc.)
        
        Yields:
            Token chunks as strings
        """
        url = f"{self.base_url}/api/chat"
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": kwargs.get("temperature", 0.7),
                "num_predict": kwargs.get("max_tokens", -1),
            }
        }
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            import json
                            chunk_data = json.loads(line)
                            if "message" in chunk_data and "content" in chunk_data["message"]:
                                content = chunk_data["message"]["content"]
                                if content:
                                    yield content
                            # Check if done
                            if chunk_data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
    
    async def chat(self, model: str, messages: List[Dict[str, str]], **kwargs) -> str:
        """Non-streaming chat completion.
        
        Args:
            model: Model name
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
        """List available Ollama models.
        
        Returns:
            List of model names
        """
        url = f"{self.base_url}/api/tags"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                models = [model["name"] for model in data.get("models", [])]
                return models
        except Exception as e:
            print(f"Error listing Ollama models: {e}")
            return []
    
    def get_provider_name(self) -> str:
        """Get provider name."""
        return "ollama"

