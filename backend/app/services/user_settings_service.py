"""User settings service for managing user preferences and profile."""

from datetime import datetime
from typing import Any

import bcrypt
from opensearchpy import OpenSearch

from app.db import opensearch_client


class UserSettingsService:
    """Service for managing user settings and preferences."""

    def __init__(self):
        self.client: OpenSearch = opensearch_client.client

    # ==================== PROFILE MANAGEMENT ====================

    def get_user_profile(self, user_id: str) -> dict[str, Any] | None:
        """Get user profile by ID."""
        try:
            result = self.client.get(index="marie_users", id=user_id)
            user = result["_source"]
            user["id"] = user_id
            # Remove sensitive data
            user.pop("password_hash", None)
            user.pop("hashed_password", None)
            return user
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None

    def update_user_profile(
        self, user_id: str, full_name: str | None = None, email: str | None = None
    ) -> dict[str, Any] | None:
        """Update user profile (name and/or email)."""
        try:
            update_doc: dict[str, Any] = {"updated_at": datetime.utcnow().isoformat()}

            if full_name is not None:
                update_doc["full_name"] = full_name

            if email is not None:
                # Check if email is already taken by another user
                existing = self.client.search(
                    index="marie_users",
                    body={"query": {"term": {"email.keyword": email}}},
                    size=1,
                )
                if existing["hits"]["total"]["value"] > 0:
                    existing_user_id = existing["hits"]["hits"][0]["_id"]
                    if existing_user_id != user_id:
                        return None  # Email already taken

                update_doc["email"] = email

            self.client.update(
                index="marie_users",
                id=user_id,
                body={"doc": update_doc},
                retry_on_conflict=3,
            )

            return self.get_user_profile(user_id)
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return None

    def change_user_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password after verifying current password."""
        try:
            # Get user
            result = self.client.get(index="marie_users", id=user_id)
            user = result["_source"]
            password_hash = user.get("password_hash")

            if not password_hash:
                return False

            # Verify current password
            if not bcrypt.checkpw(current_password.encode("utf-8"), password_hash.encode("utf-8")):
                return False

            # Hash new password
            new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            # Update password
            self.client.update(
                index="marie_users",
                id=user_id,
                body={
                    "doc": {
                        "password_hash": new_hash,
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                },
                retry_on_conflict=3,
            )

            return True
        except Exception as e:
            print(f"Error changing password: {e}")
            return False

    # ==================== PREFERENCES MANAGEMENT ====================

    def get_user_preferences(self, user_id: str) -> dict[str, Any]:
        """Get all user preferences."""
        try:
            result = self.client.get(index="marie_user_preferences", id=user_id)
            preferences = result["_source"]
            preferences["user_id"] = user_id
            return preferences
        except Exception:
            # Return default preferences if not found
            return {
                "user_id": user_id,
                "agent_preferences": {
                    "default_provider": None,
                    "default_provider_id": None,
                    "default_model": None,
                    "system_prompt": None,
                    "parameters": {
                        "temperature": 0.7,
                        "max_tokens": 2048,
                        "top_p": 1.0,
                        "frequency_penalty": 0.0,
                        "presence_penalty": 0.0,
                    },
                    "response_mode": "detailed",
                },
                "interface_preferences": {
                    "theme": "dark",
                    "language": "en",
                    "tts_voice": "en-US-EmmaNeural",
                    "stt_language": "en-US",
                    "message_density": "comfortable",
                    "show_timestamps": True,
                    "enable_markdown": True,
                    "enable_code_highlighting": True,
                },
                "privacy_preferences": {
                    "conversation_retention_days": -1,  # -1 = forever
                    "auto_delete_enabled": False,
                    "share_usage_data": False,
                },
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

    def update_agent_preferences(self, user_id: str, preferences: dict[str, Any]) -> dict[str, Any]:
        """Update agent/LLM preferences."""
        try:
            # Get current preferences
            current_prefs = self.get_user_preferences(user_id)

            # Update agent preferences
            current_prefs["agent_preferences"].update(preferences)
            current_prefs["updated_at"] = datetime.utcnow().isoformat()

            # Upsert to OpenSearch
            self.client.index(index="marie_user_preferences", id=user_id, body=current_prefs)

            return current_prefs
        except Exception as e:
            print(f"Error updating agent preferences: {e}")
            raise

    def update_interface_preferences(
        self, user_id: str, preferences: dict[str, Any]
    ) -> dict[str, Any]:
        """Update interface preferences."""
        try:
            current_prefs = self.get_user_preferences(user_id)
            current_prefs["interface_preferences"].update(preferences)
            current_prefs["updated_at"] = datetime.utcnow().isoformat()

            self.client.index(index="marie_user_preferences", id=user_id, body=current_prefs)

            return current_prefs
        except Exception as e:
            print(f"Error updating interface preferences: {e}")
            raise

    def update_privacy_preferences(
        self, user_id: str, preferences: dict[str, Any]
    ) -> dict[str, Any]:
        """Update privacy preferences."""
        try:
            current_prefs = self.get_user_preferences(user_id)
            current_prefs["privacy_preferences"].update(preferences)
            current_prefs["updated_at"] = datetime.utcnow().isoformat()

            self.client.index(index="marie_user_preferences", id=user_id, body=current_prefs)

            return current_prefs
        except Exception as e:
            print(f"Error updating privacy preferences: {e}")
            raise

    # ==================== CONVERSATION MANAGEMENT ====================

    def delete_all_user_conversations(self, user_id: str) -> int:
        """Delete all conversations for a user."""
        try:
            # Delete conversations
            result = self.client.delete_by_query(
                index="marie_conversations",
                body={"query": {"term": {"user_id": user_id}}},
            )

            deleted_count = result.get("deleted", 0)

            # Also delete messages
            self.client.delete_by_query(
                index="marie_messages", body={"query": {"term": {"user_id": user_id}}}
            )

            return deleted_count
        except Exception as e:
            print(f"Error deleting conversations: {e}")
            return 0


# Singleton instance
user_settings_service = UserSettingsService()
