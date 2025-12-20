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
    
    # Register blueprints (will be added later)
    # from app.routes import auth_bp, chat_bp
    # app.register_blueprint(auth_bp)
    # app.register_blueprint(chat_bp)
    
    @app.route('/api/health')
    def health():
        """Health check endpoint."""
        return {'status': 'ok', 'message': 'Marie Chat API is running'}
    
    return app

