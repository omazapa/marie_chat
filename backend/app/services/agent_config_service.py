"""
Agent Configuration Service
Manages agent configurations using OpenSearch for persistence
"""

import uuid
from datetime import datetime
from typing import Any, Literal

from opensearchpy import OpenSearch

from app.db import opensearch_client
from app.domain.entities.agent_config import AgentConfig


class AgentConfigService:
    """
    Service for managing agent configurations.

    Stores and retrieves configuration values per user and scope (global or conversation).
    Uses OpenSearch following MARIE's data persistence patterns.
    """

    INDEX_NAME = "marie_chat_agent_configs"

    def __init__(self):
        self.client: OpenSearch = opensearch_client.client
        self._ensure_index()

    def _ensure_index(self):
        """Ensure the agent configs index exists with proper mapping"""
        if not self.client.indices.exists(index=self.INDEX_NAME):
            mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "user_id": {"type": "keyword"},
                        "provider": {"type": "keyword"},
                        "model_id": {"type": "keyword"},
                        "scope": {"type": "keyword"},
                        "conversation_id": {"type": "keyword"},
                        "config_values": {"type": "object", "enabled": True},
                        "created_at": {"type": "date"},
                        "updated_at": {"type": "date"},
                    }
                }
            }
            self.client.indices.create(index=self.INDEX_NAME, body=mapping)

    async def save_config(
        self,
        user_id: str,
        provider: str,
        model_id: str,
        config_values: dict[str, Any],
        scope: Literal["global", "conversation"] = "global",
        conversation_id: str | None = None,
    ) -> AgentConfig:
        """
        Save agent configuration.

        Args:
            user_id: ID of the user
            provider: Provider name (e.g., 'agent')
            model_id: Model/agent identifier
            config_values: Configuration key-value pairs
            scope: 'global' or 'conversation'
            conversation_id: Required if scope is 'conversation'

        Returns:
            AgentConfig: The saved configuration

        Raises:
            ValueError: If conversation_id is missing when scope is 'conversation'
        """
        if scope == "conversation" and not conversation_id:
            raise ValueError("conversation_id required when scope is 'conversation'")

        # Check if config already exists
        existing = self._find_config(user_id, provider, model_id, scope, conversation_id)

        if existing:
            # Update existing
            config_id = existing["id"]
            update_doc = {
                "config_values": config_values,
                "updated_at": datetime.utcnow().isoformat(),
            }
            self.client.update(
                index=self.INDEX_NAME,
                id=config_id,
                body={"doc": update_doc},
                retry_on_conflict=3,
                refresh=True,
            )
        else:
            # Create new
            config_id = str(uuid.uuid4())
            doc: dict[str, Any] = {
                "id": config_id,
                "user_id": user_id,
                "provider": provider,
                "model_id": model_id,
                "scope": scope,
                "conversation_id": conversation_id,
                "config_values": config_values,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            self.client.index(index=self.INDEX_NAME, id=config_id, body=doc, refresh=True)

        # Fetch and return complete config
        result = self.client.get(index=self.INDEX_NAME, id=config_id)
        return AgentConfig(**result["_source"])

    async def load_config(
        self,
        user_id: str,
        provider: str,
        model_id: str,
        conversation_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Load configuration values.

        Priority: conversation-specific > user global > system defaults > empty dict

        Args:
            user_id: ID of the user
            provider: Provider name
            model_id: Model/agent identifier
            conversation_id: Optional conversation ID

        Returns:
            dict: Configuration values (empty dict if none found)
        """
        # Try conversation-specific first if conversation_id provided
        if conversation_id:
            conv_config = self._find_config(
                user_id, provider, model_id, "conversation", conversation_id
            )
            if conv_config:
                return conv_config.get("config_values", {})

        # Fall back to user's global config
        global_config = self._find_config(user_id, provider, model_id, "global", None)
        if global_config:
            return global_config.get("config_values", {})

        # Fall back to system defaults (configured by admin in settings)
        system_config = await self._load_system_defaults(provider, model_id)
        if system_config:
            return system_config

        return {}

    async def _load_system_defaults(self, provider: str, model_id: str) -> dict[str, Any]:
        """
        Load system-wide default configuration from settings.

        Args:
            provider: Provider name
            model_id: Model ID

        Returns:
            dict: System default config or empty dict
        """
        try:
            response = self.client.get(
                index="marie_chat_settings",
                id="system_config",
            )
            settings = response["_source"]
            llm_config = settings.get("llm", {})

            # Check if this is the default agent
            if (
                llm_config.get("default_provider_type") == provider
                and llm_config.get("default_model") == model_id
            ):
                # Return agent_config if present
                return llm_config.get("agent_config", {})

        except Exception as e:
            print(f"Error loading system defaults: {e}")

        return {}

    async def get_config(
        self,
        user_id: str,
        provider: str,
        model_id: str,
        scope: Literal["global", "conversation"] = "global",
        conversation_id: str | None = None,
    ) -> AgentConfig | None:
        """
        Get a specific configuration object.

        Args:
            user_id: User ID
            provider: Provider name
            model_id: Model ID
            scope: Configuration scope
            conversation_id: Conversation ID (if scope is 'conversation')

        Returns:
            AgentConfig or None if not found
        """
        config = self._find_config(user_id, provider, model_id, scope, conversation_id)
        if config:
            return AgentConfig(**config)
        return None

    async def delete_config(
        self,
        user_id: str,
        provider: str,
        model_id: str,
        scope: Literal["global", "conversation"] = "global",
        conversation_id: str | None = None,
    ) -> bool:
        """
        Delete a configuration.

        Args:
            user_id: User ID
            provider: Provider name
            model_id: Model ID
            scope: Configuration scope
            conversation_id: Conversation ID (if scope is 'conversation')

        Returns:
            bool: True if deleted, False if not found
        """
        config = self._find_config(user_id, provider, model_id, scope, conversation_id)
        if config:
            self.client.delete(index=self.INDEX_NAME, id=config["id"], refresh=True)
            return True
        return False

    async def list_user_configs(
        self, user_id: str, provider: str | None = None
    ) -> list[AgentConfig]:
        """
        List all configurations for a user.

        Args:
            user_id: User ID
            provider: Optional provider filter

        Returns:
            List of AgentConfig objects
        """
        must_clauses = [{"term": {"user_id": user_id}}]
        if provider:
            must_clauses.append({"term": {"provider": provider}})

        query: dict[str, Any] = {"query": {"bool": {"must": must_clauses}}, "size": 100}

        result = self.client.search(index=self.INDEX_NAME, body=query)
        return [AgentConfig(**hit["_source"]) for hit in result["hits"]["hits"]]

    def _find_config(
        self,
        user_id: str,
        provider: str,
        model_id: str,
        scope: str,
        conversation_id: str | None,
    ) -> dict[str, Any] | None:
        """
        Internal method to find a configuration document.

        Returns:
            dict or None if not found
        """
        must_clauses = [
            {"term": {"user_id": user_id}},
            {"term": {"provider": provider}},
            {"term": {"model_id": model_id}},
            {"term": {"scope": scope}},
        ]

        if conversation_id:
            must_clauses.append({"term": {"conversation_id": conversation_id}})
        else:
            # Ensure conversation_id is null for global scope
            must_clauses.append({"bool": {"must_not": {"exists": {"field": "conversation_id"}}}})  # type: ignore[dict-item]

        query: dict[str, Any] = {"query": {"bool": {"must": must_clauses}}, "size": 1}

        result = self.client.search(index=self.INDEX_NAME, body=query)
        hits = result["hits"]["hits"]

        if hits:
            return hits[0]["_source"]
        return None
