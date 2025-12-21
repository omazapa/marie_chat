"""
Ollama LLM Provider
Handles communication with Ollama API for chat completions
"""
import httpx
from typing import AsyncGenerator, Dict, Any, Optional
import json
import os


class OllamaProvider:
    """Provider for Ollama LLM API"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv('OLLAMA_BASE_URL', 'http://ollama:11434')
        self.client = httpx.AsyncClient(timeout=300.0)
    
    async def list_models(self) -> list[Dict[str, Any]]:
        """List available models from Ollama"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            return data.get("models", [])
        except Exception as e:
            print(f"Error listing Ollama models: {e}")
            return []
    
    async def chat(
        self,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None] | Dict[str, Any]:
        """
        Send chat completion request to Ollama
        
        Args:
            model: Model name (e.g., "llama3.2", "mistral")
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            **kwargs: Additional Ollama-specific parameters
        
        Returns:
            AsyncGenerator if stream=True, Dict otherwise
        """
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                **kwargs
            }
        }
        
        if stream:
            return self._stream_chat(payload)
        else:
            return await self._non_stream_chat(payload)
    
    async def _non_stream_chat(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Non-streaming chat completion"""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/chat",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "content": data["message"]["content"],
                "role": data["message"]["role"],
                "model": data["model"],
                "tokens_used": data.get("eval_count", 0),
                "done": data.get("done", True)
            }
        except Exception as e:
            print(f"Error in Ollama chat: {e}")
            raise
    
    async def _stream_chat(self, payload: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
        """Streaming chat completion"""
        try:
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json=payload
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            
                            # Extract content from the message
                            if "message" in chunk and "content" in chunk["message"]:
                                content = chunk["message"]["content"]
                                
                                yield {
                                    "content": content,
                                    "role": chunk["message"].get("role", "assistant"),
                                    "model": chunk.get("model", ""),
                                    "done": chunk.get("done", False),
                                    "tokens_used": chunk.get("eval_count", 0)
                                }
                                
                                # Stop if done
                                if chunk.get("done", False):
                                    break
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            print(f"Error in streaming chat: {e}")
            raise
    
    async def generate(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None] | Dict[str, Any]:
        """
        Generate completion (non-chat mode)
        
        Args:
            model: Model name
            prompt: Text prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            **kwargs: Additional parameters
        
        Returns:
            AsyncGenerator if stream=True, Dict otherwise
        """
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                **kwargs
            }
        }
        
        if stream:
            return self._stream_generate(payload)
        else:
            return await self._non_stream_generate(payload)
    
    async def _non_stream_generate(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Non-streaming generation"""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "content": data.get("response", ""),
                "model": data.get("model", ""),
                "tokens_used": data.get("eval_count", 0),
                "done": data.get("done", True)
            }
        except Exception as e:
            print(f"Error in Ollama generate: {e}")
            raise
    
    async def _stream_generate(self, payload: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
        """Streaming generation"""
        try:
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/generate",
                json=payload
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            
                            yield {
                                "content": chunk.get("response", ""),
                                "model": chunk.get("model", ""),
                                "done": chunk.get("done", False),
                                "tokens_used": chunk.get("eval_count", 0)
                            }
                            
                            if chunk.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            print(f"Error in streaming generate: {e}")
            raise
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Global instance
ollama_provider = OllamaProvider()
