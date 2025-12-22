from app.routes.auth import auth_bp
from app.routes.conversations import conversations_bp
from app.routes.models import models_bp
from app.routes.files import files_bp

__all__ = ['auth_bp', 'conversations_bp', 'models_bp', 'files_bp']
