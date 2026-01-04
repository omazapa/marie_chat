import uuid
from datetime import datetime

from flask import Flask, g, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

from app.config import settings
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

    # Setup structured logging
    setup_logging(app_name="marie", level="INFO")
    logger = get_logger(__name__)
    logger.info("Starting MARIE application")

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
    app.register_blueprint(files_bp, url_prefix="/api/files")
    app.register_blueprint(speech_bp, url_prefix="/api/speech")
    app.register_blueprint(images_bp, url_prefix="/api/images")
    app.register_blueprint(api_keys_bp, url_prefix="/api/api-keys")
    app.register_blueprint(prompts_bp, url_prefix="/api/prompts")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")
    app.register_blueprint(v1_chat_bp, url_prefix="/api/v1/chat")
    app.register_blueprint(v1_conversations_bp, url_prefix="/api/v1/conversations")
    app.register_blueprint(v1_search_bp, url_prefix="/api/v1/search")
    app.register_blueprint(v1_settings_bp, url_prefix="/api/v1/settings")
    app.register_blueprint(v1_docs_bp, url_prefix="/api/v1/docs")

    # Request tracking middleware
    @app.before_request
    def before_request():
        """Track request start time and generate request ID"""
        g.request_id = str(uuid.uuid4())
        g.start_time = datetime.utcnow()
        request.id = g.request_id

    @app.after_request
    def after_request(response):
        """Log request completion"""
        if hasattr(g, "start_time"):
            duration_ms = (datetime.utcnow() - g.start_time).total_seconds() * 1000

            # Skip logging for health checks to reduce noise
            if not request.path.startswith("/health"):
                logger.info(
                    "Request completed",
                    extra={
                        "request_id": g.request_id,
                        "method": request.method,
                        "path": request.path,
                        "status_code": response.status_code,
                        "duration_ms": round(duration_ms, 2),
                    },
                )
        return response

    # Register socket events
    from app.sockets import chat_events as _chat_events  # noqa: F401

    @app.route("/")
    def index():
        return {"message": "Marie API", "version": "1.0.0", "status": "running"}

    return app
