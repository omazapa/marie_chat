from app.routes.admin import admin_bp
from app.routes.agent_config import agent_config_bp
from app.routes.api_keys import api_keys_bp
from app.routes.auth import auth_bp
from app.routes.conversations import conversations_bp
from app.routes.files import files_bp
from app.routes.images import images_bp
from app.routes.models import models_bp
from app.routes.prompts import prompts_bp
from app.routes.settings import settings_bp
from app.routes.speech import speech_bp

__all__ = [
    "auth_bp",
    "conversations_bp",
    "models_bp",
    "files_bp",
    "speech_bp",
    "images_bp",
    "api_keys_bp",
    "prompts_bp",
    "admin_bp",
    "settings_bp",
    "agent_config_bp",
]
