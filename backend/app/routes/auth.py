"""Authentication routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime
from app.services.auth_service import AuthService
from app.services.opensearch_service import OpenSearchService
from app.config import Config

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def get_auth_service() -> AuthService:
    """Get AuthService instance."""
    config = Config()
    opensearch_service = OpenSearchService(
        hosts=config.OPENSEARCH_HOSTS,
        auth=(config.OPENSEARCH_USER, config.OPENSEARCH_PASSWORD),
        use_ssl=config.OPENSEARCH_USE_SSL,
        verify_certs=config.OPENSEARCH_VERIFY_CERTS
    )
    return AuthService(opensearch_service)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data.get('email').strip().lower()
        password = data.get('password')
        full_name = data.get('full_name', '').strip()
        
        # Validate email format
        if '@' not in email:
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        # Create user
        auth_service = get_auth_service()
        user_id = auth_service.create_user(email, password, full_name)
        
        if not user_id:
            return jsonify({"error": "User already exists"}), 409
        
        # Get created user
        user = auth_service.get_user_by_id(user_id)
        
        # Create tokens
        access_token = create_access_token(identity=user_id)
        refresh_token = create_refresh_token(identity=user_id)
        
        return jsonify({
            "message": "User created successfully",
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user."""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data.get('email').strip().lower()
        password = data.get('password')
        
        # Authenticate user
        auth_service = get_auth_service()
        user = auth_service.authenticate_user(email, password)
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Create tokens
        access_token = create_access_token(identity=user['id'])
        refresh_token = create_refresh_token(identity=user['id'])
        
        return jsonify({
            "message": "Login successful",
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    try:
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            "access_token": access_token
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user."""
    try:
        user_id = get_jwt_identity()
        auth_service = get_auth_service()
        user = auth_service.get_user_by_id(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"user": user}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)."""
    return jsonify({"message": "Logged out successfully"}), 200

