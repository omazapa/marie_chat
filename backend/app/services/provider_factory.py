"""
LLM Provider Factory and Model Registry
Central management for multiple LLM providers
"""

import concurrent.futures
from typing import Any

from app.config import settings

from .agent_provider import AgentProvider
from .huggingface_provider import HuggingFaceProvider
from .llm_provider import LLMProvider, ModelInfo
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAIProvider


class ProviderFactory:
    """Factory for creating and managing LLM providers"""

    def __init__(self):
        self._providers: dict[str, LLMProvider] = {}
        self._configs: dict[str, dict[str, Any]] = {}

    def register_provider(
        self, name: str, provider_class: type, config: dict[str, Any] | None = None
    ):
        """
        Register a provider with the factory

        Args:
            name: Provider name (e.g., 'ollama', 'huggingface')
            provider_class: Provider class
            config: Provider configuration
        """
        self._configs[name] = config or {}
        self._providers[name] = provider_class(config)

    def get_provider(self, name: str) -> LLMProvider | None:
        """
        Get a provider by name

        Args:
            name: Provider name

        Returns:
            Provider instance or None
        """
        return self._providers.get(name)

    def list_providers(self) -> list[str]:
        """Get list of registered provider names"""
        return list(self._providers.keys())

    def get_all_health_status(self) -> dict[str, dict[str, Any]]:
        """Get health status of all providers in parallel"""
        health_status = {}

        with concurrent.futures.ThreadPoolExecutor(
            max_workers=len(self._providers) or 1
        ) as executor:
            # Create a map of future to provider name
            future_to_name = {
                executor.submit(provider.health_check): name
                for name, provider in self._providers.items()
            }

            for future in concurrent.futures.as_completed(future_to_name):
                name = future_to_name[future]
                try:
                    health_status[name] = future.result()
                except Exception as e:
                    health_status[name] = {
                        "provider": name,
                        "status": "error",
                        "available": False,
                        "error": str(e),
                    }

        return health_status


class ModelRegistry:
    """Registry for tracking available models from all providers"""

    def __init__(self, provider_factory: ProviderFactory):
        self.provider_factory = provider_factory
        self._model_cache: dict[str, list[ModelInfo]] = {}
        self._cache_ttl = 300  # 5 minutes
        self._last_refresh: dict[str, float] = {}

    def list_all_models(self, force_refresh: bool = False) -> dict[str, list[ModelInfo]]:
        """
        List all models from all providers in parallel

        Args:
            force_refresh: Force refresh of cached models

        Returns:
            Dictionary mapping provider name to list of ModelInfo
        """
        import time

        all_models = {}
        providers_to_fetch = []

        # Check cache first
        for provider_name in self.provider_factory.list_providers():
            if not force_refresh and provider_name in self._model_cache:
                last_refresh = self._last_refresh.get(provider_name, 0)
                if time.time() - last_refresh < self._cache_ttl:
                    all_models[provider_name] = self._model_cache[provider_name]
                    continue

            providers_to_fetch.append(provider_name)

        if not providers_to_fetch:
            return all_models

        # Fetch remaining providers in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(providers_to_fetch)) as executor:
            future_to_name = {}
            for name in providers_to_fetch:
                provider = self.provider_factory.get_provider(name)
                if provider:
                    future_to_name[executor.submit(provider.list_models)] = name

            for future in concurrent.futures.as_completed(future_to_name):
                name = future_to_name[future]
                try:
                    models = future.result()
                    self._model_cache[name] = models
                    self._last_refresh[name] = time.time()
                    all_models[name] = models
                except Exception as e:
                    print(f"Error listing models from {name}: {e}")
                    all_models[name] = []

        return all_models

    def get_models_by_provider(
        self, provider_name: str, force_refresh: bool = False
    ) -> list[ModelInfo]:
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

    def get_model_info(self, provider_name: str, model_id: str) -> ModelInfo | None:
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

    def search_models(self, query: str) -> list[dict[str, Any]]:
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
                if (
                    query_lower in model.name.lower()
                    or query_lower in model.id.lower()
                    or (model.description and query_lower in model.description.lower())
                ):
                    results.append({"provider": provider_name, "model": model.to_dict()})

        return results

    def clear_cache(self, provider_name: str | None = None):
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
    """Initialize providers dynamically from database settings"""
    from app.services.settings_service import settings_service

    try:
        db_settings = settings_service.get_settings()
        providers_list = db_settings.get("providers", [])

        # Clear existing providers
        provider_factory._providers.clear()
        provider_factory._configs.clear()

        # Provider class mapping
        provider_classes = {
            "ollama": OllamaProvider,
            "huggingface": HuggingFaceProvider,
            "openai": OpenAIProvider,
            "agent": AgentProvider,
        }

        # Register each enabled provider from settings
        registered_count = 0
        for provider_data in providers_list:
            if not provider_data.get("enabled", True):
                continue  # Skip disabled providers

            provider_type = provider_data.get("type")
            provider_id = provider_data.get("id")
            provider_config = provider_data.get("config", {})

            if provider_type not in provider_classes:
                print(f"⚠️ Unknown provider type: {provider_type}")
                continue

            if not provider_id:
                print(f"⚠️ Provider missing ID: {provider_data}")
                continue

            # Register provider using ID as key (supports multiple providers of same type)
            provider_factory.register_provider(
                provider_id,
                provider_classes[provider_type],
                provider_config,
            )
            registered_count += 1

        # Clear model cache to force refresh with new configs
        model_registry.clear_cache()

        print(f"✅ {registered_count} LLM Provider(s) initialized from database")
    except Exception as e:
        print(f"⚠️ Error initializing providers from database: {e}. Using defaults.")
        # Fallback to defaults
        provider_factory.register_provider(
            "ollama", OllamaProvider, {"base_url": settings.OLLAMA_BASE_URL}
        )
        provider_factory.register_provider(
            "huggingface", HuggingFaceProvider, {"api_key": settings.HUGGINGFACE_API_KEY}
        )
        provider_factory.register_provider(
            "openai",
            OpenAIProvider,
            {"api_key": settings.OPENAI_API_KEY, "base_url": settings.OPENAI_BASE_URL},
        )
        provider_factory.register_provider(
            "agent",
            AgentProvider,
            {"api_key": settings.REMOTE_AGENT_KEY, "base_url": settings.REMOTE_AGENT_URL},
        )


# Initialize on import
initialize_providers()
