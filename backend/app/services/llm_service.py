"""LLM service to manage multiple providers."""
from typing import Optional, Dict, Any, List
from app.services.llm_provider import LLMProvider
from app.services.ollama_provider import OllamaProvider
from app.services.huggingface_provider import HuggingFaceProvider
import os


class LLMService:
    """Service to manage LLM providers."""
    
    def __init__(self):
        """Initialize LLM service with available providers."""
        self.providers: Dict[str, LLMProvider] = {}
        
        # Initialize Ollama provider
        try:
            self.providers["ollama"] = OllamaProvider()
        except Exception as e:
            print(f"Warning: Could not initialize Ollama provider: {e}")
        
        # Initialize HuggingFace provider if API key is available
        hf_api_key = os.environ.get('HUGGINGFACE_API_KEY')
        if hf_api_key:
            try:
                self.providers["huggingface"] = HuggingFaceProvider(api_key=hf_api_key)
            except Exception as e:
                print(f"Warning: Could not initialize HuggingFace provider: {e}")
    
    def get_provider(self, provider_name: str) -> Optional[LLMProvider]:
        """Get a provider by name.
        
        Args:
            provider_name: Name of the provider ('ollama' or 'huggingface')
        
        Returns:
            LLMProvider instance or None if not found
        """
        return self.providers.get(provider_name)
    
    def get_available_providers(self) -> List[str]:
        """Get list of available provider names.
        
        Returns:
            List of provider names
        """
        return list(self.providers.keys())
    
    def get_default_provider(self) -> Optional[str]:
        """Get default provider name.
        
        Returns:
            Provider name or None
        """
        # Prefer Ollama if available, otherwise HuggingFace
        if "ollama" in self.providers:
            return "ollama"
        elif "huggingface" in self.providers:
            return "huggingface"
        return None
    
    async def get_available_models(self, provider: Optional[str] = None) -> Dict[str, List[str]]:
        """Get available models from providers.
        
        Args:
            provider: Specific provider name, or None for all providers
        
        Returns:
            Dictionary mapping provider names to lists of model names
        """
        result = {}
        
        if provider:
            provider_instance = self.get_provider(provider)
            if provider_instance:
                models = await provider_instance.list_models()
                result[provider] = models
        else:
            # Get models from all providers
            for provider_name, provider_instance in self.providers.items():
                try:
                    models = await provider_instance.list_models()
                    result[provider_name] = models
                except Exception as e:
                    print(f"Error getting models from {provider_name}: {e}")
                    result[provider_name] = []
        
        return result

