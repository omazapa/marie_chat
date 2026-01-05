from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

from app.config import settings
from app.middleware.logging_middleware import setup_logging_middleware
from app.utils.logger import get_logger, setup_logging

# Initialize extensions
jwt = JWTManager()
socketio = SocketIO(
    cors_allowed_origins=settings.CORS_ORIGINS,
    async_mode="threading",
    cors_credentials=True,
    logger=False,
    engineio_logger=False,
)


def create_app():
    """Application factory"""
    app = Flask(__name__)

    # Setup structured logging with file rotation
    log_level = "DEBUG" if settings.DEBUG else "INFO"
    setup_logging(
        app_name="marie",
        level=log_level,
        log_dir="logs",
        max_bytes=10485760,  # 10MB
        backup_count=5,
        console_output=True,
        file_output=True,
    )
    logger = get_logger(__name__)
    logger.info("🚀 Starting MARIE application", extra={"environment": settings.ENVIRONMENT})

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

    # Setup logging middleware (request/response logging)
    setup_logging_middleware(app)

    # Register blueprints
    from app.routes import (
        admin_bp,
        agent_config_bp,
        api_keys_bp,
        auth_bp,
        conversations_bp,
        files_bp,
        images_bp,
        models_bp,
        prompts_bp,
        settings_bp,
        speech_bp,
        user_settings_bp,
    )
    from app.routes.health import health_bp
    from app.routes.v1.chat import v1_chat_bp
    from app.routes.v1.conversations import v1_conversations_bp
    from app.routes.v1.docs import v1_docs_bp
    from app.routes.v1.search import v1_search_bp
    from app.routes.v1.settings import v1_settings_bp

    # Health checks (no prefix - top level)
    app.register_blueprint(health_bp)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(conversations_bp, url_prefix="/api/conversations")
    app.register_blueprint(models_bp, url_prefix="/api/models")
    app.register_blueprint(agent_config_bp, url_prefix="/api")
    app.register_blueprint(files_bp, url_prefix="/api/files")
    app.register_blueprint(speech_bp, url_prefix="/api/speech")
    app.register_blueprint(images_bp, url_prefix="/api/images")
    app.register_blueprint(api_keys_bp, url_prefix="/api/api-keys")
    app.register_blueprint(prompts_bp, url_prefix="/api/prompts")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")
    app.register_blueprint(user_settings_bp, url_prefix="/api/user")
    app.register_blueprint(v1_chat_bp, url_prefix="/api/v1/chat")
    app.register_blueprint(v1_conversations_bp, url_prefix="/api/v1/conversations")
    app.register_blueprint(v1_search_bp, url_prefix="/api/v1/search")
    app.register_blueprint(v1_settings_bp, url_prefix="/api/v1/settings")
    app.register_blueprint(v1_docs_bp, url_prefix="/api/v1/docs")

    # Register socket events
    from app.sockets import chat_events as _chat_events  # noqa: F401

    logger.info("✅ MARIE application initialized successfully")

    @app.route("/")
    def index():
        return {"message": "Marie API", "version": "1.0.0", "status": "running"}

    return app
