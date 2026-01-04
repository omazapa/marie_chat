from datetime import datetime
from typing import Any

from app.config import settings as app_settings
from app.services.opensearch_service import OpenSearchService


class SettingsService:
    def __init__(self):
        self.opensearch = OpenSearchService()
        self.client = self.opensearch.client
        self.index_name = "marie_settings"
        self._ensure_index()

    def _ensure_index(self):
        """Ensure the settings index exists"""
        if not self.client.indices.exists(index=self.index_name):
            self.client.indices.create(index=self.index_name)
            # Initialize with default settings
            self.update_settings(
                {
                    "llm": {
                        "default_provider": app_settings.DEFAULT_LLM_PROVIDER,
                        "default_model": app_settings.DEFAULT_LLM_MODEL,
                        "default_system_prompt": "You are Marie, a Machine-Assisted Research Intelligent Environment. You are a helpful, precise, and creative AI assistant designed to help with research, coding, and general tasks.",
                    },
                    "providers": {
                        "openai": {
                            "api_key": app_settings.OPENAI_API_KEY,
                            "base_url": app_settings.OPENAI_BASE_URL,
                        },
                        "huggingface": {
                            "api_key": app_settings.HUGGINGFACE_API_KEY,
                        },
                        "ollama": {
                            "base_url": app_settings.OLLAMA_BASE_URL,
                        },
                        "agent": {
                            "base_url": app_settings.REMOTE_AGENT_URL,
                            "api_key": app_settings.REMOTE_AGENT_KEY,
                        },
                    },
                    "image": {
                        "default_model": "stabilityai/stable-diffusion-3.5-large",
                        "use_local": False,
                    },
                    "stt": {
                        "model_size": app_settings.WHISPER_MODEL,
                    },
                    "tts": {
                        "default_voices": {
                            "es": "es-CO-GonzaloNeural",
                            "en": "en-US-AndrewNeural",
                            "fr": "fr-FR-HenriNeural",
                            "de": "de-DE-ConradNeural",
                            "it": "it-IT-DiegoNeural",
                            "pt": "pt-BR-AntonioNeural",
                        }
                    },
                    "white_label": {
                        "app_name": "Marie",
                        "app_logo": "/imgs/marie_logo.png",
                        "app_icon": "/imgs/marie_icon.png",
                        "primary_color": "#1B4B73",
                        "welcome_title": "Marie",
                        "welcome_subtitle": "Machine-Assisted Research Intelligent Environment",
                        "registration_enabled": False,
                        "suggested_prompts": [
                            "What is ImpactU?",
                            "How to analyze research data?",
                            "Explain RAG technology",
                            "How to use references in Marie?",
                        ],
                    },
                    "updated_at": datetime.utcnow().isoformat(),
                }
            )

    def get_settings(self) -> dict[str, Any]:
        """Get system-wide settings"""
        try:
            res = self.client.get(index=self.index_name, id="system_config")
            settings = res["_source"]
            # Ensure white_label exists for older configs
            if "white_label" not in settings:
                settings["white_label"] = {
                    "app_name": "Marie",
                    "app_logo": "/imgs/marie_logo.png",
                    "app_icon": "/imgs/marie_icon.png",
                    "primary_color": "#1B4B73",
                    "welcome_title": "Marie",
                    "welcome_subtitle": "Machine-Assisted Research Intelligent Environment",
                    "registration_enabled": False,
                    "suggested_prompts": [
                        "What is ImpactU?",
                        "How to analyze research data?",
                        "Explain RAG technology",
                        "How to use references in Marie?",
                    ],
                }
            elif "registration_enabled" not in settings["white_label"]:
                settings["white_label"]["registration_enabled"] = False

            # Ensure providers exists for older configs
            if "providers" not in settings:
                settings["providers"] = {}

            # Ensure all providers exist in providers dict
            if "openai" not in settings["providers"]:
                settings["providers"]["openai"] = {
                    "api_key": app_settings.OPENAI_API_KEY,
                    "base_url": app_settings.OPENAI_BASE_URL,
                }
            if "huggingface" not in settings["providers"]:
                settings["providers"]["huggingface"] = {
                    "api_key": app_settings.HUGGINGFACE_API_KEY,
                }
            if "ollama" not in settings["providers"]:
                settings["providers"]["ollama"] = {
                    "base_url": app_settings.OLLAMA_BASE_URL,
                }
            if "agent" not in settings["providers"]:
                settings["providers"]["agent"] = {
                    "base_url": app_settings.REMOTE_AGENT_URL,
                    "api_key": app_settings.REMOTE_AGENT_KEY,
                }

            return settings
        except Exception:
            # Return defaults if not found
            return {
                "llm": {
                    "default_provider": app_settings.DEFAULT_LLM_PROVIDER,
                    "default_model": app_settings.DEFAULT_LLM_MODEL,
                    "default_system_prompt": "You are Marie, a Machine-Assisted Research Intelligent Environment. You are a helpful, precise, and creative AI assistant designed to help with research, coding, and general tasks.",
                },
                "image": {
                    "default_model": "stabilityai/stable-diffusion-3.5-large",
                    "use_local": False,
                },
                "stt": {
                    "model_size": app_settings.WHISPER_MODEL,
                },
                "tts": {
                    "default_voices": {
                        "es": "es-CO-GonzaloNeural",
                        "en": "en-US-AndrewNeural",
                        "fr": "fr-FR-HenriNeural",
                        "de": "de-DE-ConradNeural",
                        "it": "it-IT-DiegoNeural",
                        "pt": "pt-BR-AntonioNeural",
                    }
                },
                "white_label": {
                    "app_name": "Marie",
                    "app_logo": "/imgs/marie_logo.png",
                    "app_icon": "/imgs/marie_icon.png",
                    "primary_color": "#1B4B73",
                    "welcome_title": "Marie",
                    "welcome_subtitle": "Machine-Assisted Research Intelligent Environment",
                    "registration_enabled": False,
                },
            }

    def update_settings(self, new_settings: dict[str, Any]) -> bool:
        """Update system-wide settings"""
        try:
            # Get existing settings to merge with new ones
            existing_settings = self.get_settings()

            # Deep merge: update existing with new settings
            updated = self._deep_merge(existing_settings, new_settings)
            updated["updated_at"] = datetime.utcnow().isoformat()

            self.client.index(index=self.index_name, id="system_config", body=updated, refresh=True)
            return True
        except Exception as e:
            print(f"Error updating settings: {e}")
            return False

    def _deep_merge(self, base: dict[str, Any], update: dict[str, Any]) -> dict[str, Any]:
        """Deep merge two dictionaries"""
        result = base.copy()
        for key, value in update.items():
            if isinstance(value, dict) and key in result and isinstance(result[key], dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result


settings_service = SettingsService()
