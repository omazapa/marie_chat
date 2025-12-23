from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from app.config import settings


# Initialize extensions
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins=settings.CORS_ORIGINS, async_mode='eventlet')


def create_app():
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    app.config['SECRET_KEY'] = settings.SECRET_KEY
    app.config['JWT_SECRET_KEY'] = settings.JWT_SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = settings.JWT_ACCESS_TOKEN_EXPIRES
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = settings.JWT_REFRESH_TOKEN_EXPIRES
    app.config['JWT_TOKEN_LOCATION'] = settings.JWT_TOKEN_LOCATION
    app.config['JWT_HEADER_NAME'] = settings.JWT_HEADER_NAME
    app.config['JWT_HEADER_TYPE'] = settings.JWT_HEADER_TYPE
    
    # Initialize extensions
    CORS(app, origins=settings.CORS_ORIGINS, supports_credentials=True)
    jwt.init_app(app)
    socketio.init_app(app)
    
    # Register blueprints
    from app.routes import auth_bp, conversations_bp, models_bp, files_bp, speech_bp, images_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(conversations_bp, url_prefix='/api/conversations')
    app.register_blueprint(models_bp, url_prefix='/api/models')
    app.register_blueprint(files_bp, url_prefix='/api/files')
    app.register_blueprint(speech_bp, url_prefix='/api/speech')
    app.register_blueprint(images_bp, url_prefix='/api/images')
    
    # Register socket events
    from app.sockets import chat_events
    
    @app.route('/')
    def index():
        return {'message': 'Marie Chat API', 'version': '1.0.0', 'status': 'running'}
    
    @app.route('/health')
    def health():
        return {'status': 'healthy'}
    
    return app
