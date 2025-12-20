"""Flask extensions initialization."""
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

# Initialize extensions (will be initialized in app factory)
cors = CORS()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")

