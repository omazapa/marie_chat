"""Flask application factory."""
from flask import Flask
from app.config import config
from app.extensions import cors, jwt, socketio


def create_app(config_name='default'):
    """Create and configure Flask application."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    cors.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins=app.config['CORS_ORIGINS'])
    
    # Register blueprints
    from app.routes import auth, conversations, models
    app.register_blueprint(auth.auth_bp)
    app.register_blueprint(conversations.conversations_bp)
    app.register_blueprint(models.models_bp)
    
    # Register socket handlers
    from app.sockets import chat_socket  # noqa: F401
    
    @app.route('/api/health')
    def health():
        """Health check endpoint."""
        return {'status': 'ok', 'message': 'Marie Chat API is running'}
    
    return app

