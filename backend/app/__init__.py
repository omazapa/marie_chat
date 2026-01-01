from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

from app.config import settings

# Initialize extensions
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins=settings.CORS_ORIGINS, async_mode="eventlet")


def create_app():
    """Application factory"""
    app = Flask(__name__)

    # Load configuration
    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = settings.JWT_ACCESS_TOKEN_EXPIRES
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = settings.JWT_REFRESH_TOKEN_EXPIRES
    app.config["JWT_TOKEN_LOCATION"] = settings.JWT_TOKEN_LOCATION
    app.config["JWT_HEADER_NAME"] = settings.JWT_HEADER_NAME
    app.config["JWT_HEADER_TYPE"] = settings.JWT_HEADER_TYPE

    # Initialize extensions
    CORS(app, origins=settings.CORS_ORIGINS, supports_credentials=True)
    jwt.init_app(app)
    socketio.init_app(app)

    # Register blueprints
    from app.routes import (
        admin_bp,
        api_keys_bp,
        auth_bp,
        conversations_bp,
        files_bp,
        images_bp,
        models_bp,
        prompts_bp,
        settings_bp,
        speech_bp,
    )
    from app.routes.v1.chat import v1_chat_bp
    from app.routes.v1.conversations import v1_conversations_bp
    from app.routes.v1.docs import v1_docs_bp
    from app.routes.v1.search import v1_search_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(conversations_bp, url_prefix="/api/conversations")
    app.register_blueprint(models_bp, url_prefix="/api/models")
    app.register_blueprint(files_bp, url_prefix="/api/files")
    app.register_blueprint(speech_bp, url_prefix="/api/speech")
    app.register_blueprint(images_bp, url_prefix="/api/images")
    app.register_blueprint(api_keys_bp, url_prefix="/api/api-keys")
    app.register_blueprint(prompts_bp, url_prefix="/api/prompts")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(settings_bp, url_prefix="/api/admin/settings")
    app.register_blueprint(v1_chat_bp, url_prefix="/api/v1/chat")
    app.register_blueprint(v1_conversations_bp, url_prefix="/api/v1/conversations")
    app.register_blueprint(v1_search_bp, url_prefix="/api/v1/search")
    app.register_blueprint(v1_docs_bp, url_prefix="/api/v1/docs")

    # Register socket events
    from app.sockets import chat_events as _chat_events  # noqa: F401

    @app.route("/")
    def index():
        return {"message": "Marie API", "version": "1.0.0", "status": "running"}

    @app.route("/health")
    def health():
        return {"status": "healthy"}

    return app
