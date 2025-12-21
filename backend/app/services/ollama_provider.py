"""
Ollama LLM Provider
Handles communication with Ollama API for chat completions
"""
import httpx
from typing import AsyncGenerator, Dict, Any, Optional, List
import json
import os
from .llm_provider import LLMProvider, ModelInfo, ChatMessage, ChatCompletionChunk


class OllamaProvider(LLMProvider):
    """Provider for Ollama LLM API"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.base_url = config.get('base_url') if config else None
        self.base_url = self.base_url or os.getenv('OLLAMA_BASE_URL', 'http://ollama:11434')
        self._client = None  # Lazy init
        self.provider_name = 'ollama'
    
    @property
    def client(self):
        """Lazy-initialize httpx client to ensure it's created in the correct event loop"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=300.0)
        return self._client
    
    async def list_models(self) -> List[ModelInfo]:
        """List available models from Ollama"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            models = data.get("models", [])
            
            # Convert to ModelInfo objects
            model_infos = []
            for model in models:
                model_info = ModelInfo(
                    id=model.get('name', ''),
                    name=model.get('name', ''),
                    provider='ollama',
                    description=f"Ollama model: {model.get('name', '')}",
                    size=self._format_size(model.get('size', 0)),
                    parameters=self._extract_parameters(model.get('name', '')),
                    quantization=self._extract_quantization(model.get('details', {}).get('quantization_level', '')),
                    capabilities=['chat', 'completion'],
                    metadata={
                        'family': model.get('details', {}).get('family', ''),
                        'parameter_size': model.get('details', {}).get('parameter_size', ''),
                        'format': model.get('details', {}).get('format', ''),
                        'modified_at': model.get('modified_at', ''),
                        'digest': model.get('digest', '')
                    }
                )
                model_infos.append(model_info)
            
            return model_infos
        except Exception as e:
            print(f"Error listing Ollama models: {e}")
            return []
    
    async def get_model_info(self, model_id: str) -> Optional[ModelInfo]:
        """Get detailed information about a specific model"""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/show",
                json={"name": model_id}
            )
            response.raise_for_status()
            data = response.json()
            
            return ModelInfo(
                id=model_id,
                name=model_id,
                provider='ollama',
                description=data.get('modelfile', '').split('\n')[0] if data.get('modelfile') else None,
                parameters=self._extract_parameters(model_id),
                quantization=self._extract_quantization(data.get('details', {}).get('quantization_level', '')),
                size=self._format_size(data.get('size', 0)),
                capabilities=['chat', 'completion'],
                metadata={
                    'family': data.get('details', {}).get('family', ''),
                    'parameter_size': data.get('details', {}).get('parameter_size', ''),
                    'format': data.get('details', {}).get('format', ''),
                    'license': data.get('license', ''),
                    'modelfile': data.get('modelfile', '')
                }
            )
        except Exception as e:
            print(f"Error getting Ollama model info for {model_id}: {e}")
            return None
    
    async def chat_completion(
        self,
        model: str,
        messages: List[ChatMessage],
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """Generate chat completion (streaming or non-streaming)"""
        # Convert ChatMessage objects to dicts
        message_dicts = [msg.to_dict() for msg in messages]
        
        payload = {
            "model": model,
            "messages": message_dicts,
            "stream": stream,
            "options": {
                "temperature": temperature,
                **({"num_predict": max_tokens} if max_tokens else {}),
                **kwargs
            }
        }
        
        if stream:
            async for chunk in self._stream_chat(payload):
                yield ChatCompletionChunk(
                    content=chunk['content'],
                    done=chunk['done'],
                    model=chunk.get('model'),
                    tokens_used=chunk.get('tokens_used'),
                    metadata=chunk
                )
        else:
            result = await self._non_stream_chat(payload)
            yield ChatCompletionChunk(
                content=result['content'],
                done=True,
                model=result.get('model'),
                tokens_used=result.get('tokens_used'),
                metadata=result
            )
    
    async def validate_connection(self) -> bool:
        """Validate that Ollama is accessible"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except Exception:
            return False
    
    def _format_size(self, size_bytes: int) -> str:
        """Format size in bytes to human-readable string"""
        if size_bytes == 0:
            return "Unknown"
        
        units = ['B', 'KB', 'MB', 'GB', 'TB']
        unit_index = 0
        size = float(size_bytes)
        
        while size >= 1024 and unit_index < len(units) - 1:
            size /= 1024
            unit_index += 1
        
        return f"{size:.1f}{units[unit_index]}"
    
    def _extract_parameters(self, model_name: str) -> Optional[str]:
        """Extract parameter count from model name (e.g., 'llama3.2' -> '3.2B')"""
        # Common patterns: llama3.2:latest, mistral:7b, etc.
        import re
        
        # Try to find patterns like :7b, :13b, :70b
        match = re.search(r':(\d+)b', model_name.lower())
        if match:
            return f"{match.group(1)}B"
        
        # Try to find version numbers that might indicate parameters
        match = re.search(r'(\d+\.?\d*)(?:b)?', model_name.lower())
        if match:
            num = match.group(1)
            # Assume it's parameters if it looks like a reasonable number
            if float(num) < 100:
                return f"{num}B"
        
        return None
    
    def _extract_quantization(self, quant_level: str) -> Optional[str]:
        """Extract quantization level"""
        if quant_level:
            return quant_level
        return None
    
    # Keep legacy methods for backward compatibility
    async def list_models_legacy(self) -> list[Dict[str, Any]]:
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
        print(f"[OLLAMA] Starting stream chat with model: {payload.get('model')}")
        try:
            print(f"[OLLAMA] Creating HTTP stream request")
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json=payload
            ) as response:
                print(f"[OLLAMA] Got response status: {response.status_code}")
                response.raise_for_status()
                
                print(f"[OLLAMA] Starting to iterate lines")
                async for line in response.aiter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            
                            # Extract content from the message
                            if "message" in chunk and "content" in chunk["message"]:
                                content = chunk["message"]["content"]
                                print(f"[OLLAMA] Got chunk: {content[:50]}...")
                                
                                yield {
                                    "content": content,
                                    "role": chunk["message"].get("role", "assistant"),
                                    "model": chunk.get("model", ""),
                                    "done": chunk.get("done", False),
                                    "tokens_used": chunk.get("eval_count", 0)
                                }
                                
                                # Stop if done
                                if chunk.get("done", False):
                                    print(f"[OLLAMA] Stream completed")
                                    break
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            print(f"Error in streaming chat: {e}")
            import traceback
            traceback.print_exc()
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


# Legacy compatibility - will be removed in future versions
# Use provider_factory.get_provider('ollama') instead
