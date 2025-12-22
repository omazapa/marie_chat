"""
LLM Provider Factory and Model Registry
Central management for multiple LLM providers
"""
from typing import Dict, List, Optional, Any
from app.config import settings
from .llm_provider import LLMProvider, ModelInfo
from .ollama_provider import OllamaProvider
from .huggingface_provider import HuggingFaceProvider


class ProviderFactory:
    """Factory for creating and managing LLM providers"""
    
    def __init__(self):
        self._providers: Dict[str, LLMProvider] = {}
        self._configs: Dict[str, Dict[str, Any]] = {}
    
    def register_provider(self, name: str, provider_class: type, config: Optional[Dict[str, Any]] = None):
        """
        Register a provider with the factory
        
        Args:
            name: Provider name (e.g., 'ollama', 'huggingface')
            provider_class: Provider class
            config: Provider configuration
        """
        self._configs[name] = config or {}
        self._providers[name] = provider_class(config)
    
    def get_provider(self, name: str) -> Optional[LLMProvider]:
        """
        Get a provider by name
        
        Args:
            name: Provider name
            
        Returns:
            Provider instance or None
        """
        return self._providers.get(name)
    
    def list_providers(self) -> List[str]:
        """Get list of registered provider names"""
        return list(self._providers.keys())
    
    def get_all_health_status(self) -> Dict[str, Dict[str, Any]]:
        """Get health status of all providers"""
        health_status = {}
        for name, provider in self._providers.items():
            health_status[name] = provider.health_check()
        return health_status


class ModelRegistry:
    """Registry for tracking available models from all providers"""
    
    def __init__(self, provider_factory: ProviderFactory):
        self.provider_factory = provider_factory
        self._model_cache: Dict[str, List[ModelInfo]] = {}
        self._cache_ttl = 300  # 5 minutes
        self._last_refresh: Dict[str, float] = {}
    
    def list_all_models(self, force_refresh: bool = False) -> Dict[str, List[ModelInfo]]:
        """
        List all models from all providers
        
        Args:
            force_refresh: Force refresh of cached models
            
        Returns:
            Dictionary mapping provider name to list of ModelInfo
        """
        import time
        
        all_models = {}
        
        for provider_name in self.provider_factory.list_providers():
            # Check cache
            if not force_refresh and provider_name in self._model_cache:
                last_refresh = self._last_refresh.get(provider_name, 0)
                if time.time() - last_refresh < self._cache_ttl:
                    all_models[provider_name] = self._model_cache[provider_name]
                    continue
            
            # Fetch from provider
            provider = self.provider_factory.get_provider(provider_name)
            if provider:
                try:
                    models = provider.list_models()
                    self._model_cache[provider_name] = models
                    self._last_refresh[provider_name] = time.time()
                    all_models[provider_name] = models
                except Exception as e:
                    print(f"Error listing models from {provider_name}: {e}")
                    all_models[provider_name] = []
        
        return all_models
    
    def get_models_by_provider(self, provider_name: str, force_refresh: bool = False) -> List[ModelInfo]:
        """
        Get models from a specific provider
        
        Args:
            provider_name: Name of the provider
            force_refresh: Force refresh of cached models
            
        Returns:
            List of ModelInfo
        """
        all_models = self.list_all_models(force_refresh)
        return all_models.get(provider_name, [])
    
    def get_model_info(self, provider_name: str, model_id: str) -> Optional[ModelInfo]:
        """
        Get detailed information about a specific model
        
        Args:
            provider_name: Name of the provider
            model_id: Model identifier
            
        Returns:
            ModelInfo or None
        """
        provider = self.provider_factory.get_provider(provider_name)
        if provider:
            try:
                return provider.get_model_info(model_id)
            except Exception as e:
                print(f"Error getting model info for {provider_name}/{model_id}: {e}")
        return None
    
    def search_models(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for models across all providers
        
        Args:
            query: Search query
            
        Returns:
            List of matching models with provider information
        """
        all_models = self.list_all_models()
        results = []
        
        query_lower = query.lower()
        
        for provider_name, models in all_models.items():
            for model in models:
                # Search in model name, ID, and description
                if (query_lower in model.name.lower() or
                    query_lower in model.id.lower() or
                    (model.description and query_lower in model.description.lower())):
                    
                    results.append({
                        'provider': provider_name,
                        'model': model.to_dict()
                    })
        
        return results
    
    def clear_cache(self, provider_name: Optional[str] = None):
        """
        Clear model cache
        
        Args:
            provider_name: Specific provider to clear, or None for all
        """
        if provider_name:
            self._model_cache.pop(provider_name, None)
            self._last_refresh.pop(provider_name, None)
        else:
            self._model_cache.clear()
            self._last_refresh.clear()


# Global instances
provider_factory = ProviderFactory()
model_registry = ModelRegistry(provider_factory)


def initialize_providers():
    """Initialize default providers"""
    # Register Ollama provider
    provider_factory.register_provider('ollama', OllamaProvider, {
        'base_url': settings.OLLAMA_BASE_URL
    })
    
    # Register HuggingFace provider (requires API key)
    provider_factory.register_provider('huggingface', HuggingFaceProvider, {
        'api_key': settings.HUGGINGFACE_API_KEY
    })
    
    print("✅ LLM Providers initialized: ollama, huggingface")


# Initialize on import
initialize_providers()
