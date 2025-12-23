from typing import Dict, Any, Optional
from datetime import datetime
from app.services.opensearch_service import OpenSearchService
from app.config import settings as app_settings

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
            self.update_settings({
                "llm": {
                    "default_provider": app_settings.DEFAULT_LLM_PROVIDER,
                    "default_model": app_settings.DEFAULT_LLM_MODEL,
                },
                "image": {
                    "default_model": "stabilityai/stable-diffusion-3.5-large",
                    "use_local": False
                },
                "stt": {
                    "model_size": app_settings.WHISPER_MODEL,
                },
                "tts": {
                    "default_voices": {
                        'es': 'es-CO-GonzaloNeural',
                        'en': 'en-US-AndrewNeural',
                        'fr': 'fr-FR-HenriNeural',
                        'de': 'de-DE-ConradNeural',
                        'it': 'it-IT-DiegoNeural',
                        'pt': 'pt-BR-AntonioNeural'
                    }
                },
                "white_label": {
                    "app_name": "Marie",
                    "app_logo": "/imgs/marie_logo.png",
                    "app_icon": "/imgs/marie_icon.png",
                    "primary_color": "#1B4B73",
                    "welcome_title": "Marie",
                    "welcome_subtitle": "Intelligent Research Assistant"
                },
                "updated_at": datetime.utcnow().isoformat()
            })

    def get_settings(self) -> Dict[str, Any]:
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
                    "welcome_subtitle": "Intelligent Research Assistant"
                }
            return settings
        except Exception:
            # Return defaults if not found
            return {
                "llm": {
                    "default_provider": app_settings.DEFAULT_LLM_PROVIDER,
                    "default_model": app_settings.DEFAULT_LLM_MODEL,
                },
                "image": {
                    "default_model": "stabilityai/stable-diffusion-3.5-large",
                    "use_local": False
                },
                "stt": {
                    "model_size": app_settings.WHISPER_MODEL,
                },
                "tts": {
                    "default_voices": {
                        'es': 'es-CO-GonzaloNeural',
                        'en': 'en-US-AndrewNeural',
                        'fr': 'fr-FR-HenriNeural',
                        'de': 'de-DE-ConradNeural',
                        'it': 'it-IT-DiegoNeural',
                        'pt': 'pt-BR-AntonioNeural'
                    }
                },
                "white_label": {
                    "app_name": "Marie",
                    "app_logo": "/imgs/marie_logo.png",
                    "app_icon": "/imgs/marie_icon.png",
                    "primary_color": "#1B4B73",
                    "welcome_title": "Marie",
                    "welcome_subtitle": "Intelligent Research Assistant"
                }
            }

    def update_settings(self, new_settings: Dict[str, Any]) -> bool:
        """Update system-wide settings"""
        try:
            new_settings["updated_at"] = datetime.utcnow().isoformat()
            self.client.index(
                index=self.index_name,
                id="system_config",
                body=new_settings,
                refresh=True
            )
            return True
        except Exception as e:
            print(f"Error updating settings: {e}")
            return False

settings_service = SettingsService()
