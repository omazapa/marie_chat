from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from pydantic import ValidationError
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshTokenRequest, UserResponse, LoginResponse
from app.services.opensearch_service import OpenSearchService


auth_bp = Blueprint('auth', __name__)
opensearch_service = OpenSearchService()


@auth_bp.route('/register', methods=['POST'])
async def register():
    """Register a new user"""
    try:
        data = RegisterRequest(**request.get_json())
    except ValidationError as e:
        return jsonify({'error': 'Invalid request', 'details': e.errors()}), 400
    
    # Check if user already exists
    existing_user = await opensearch_service.get_user_by_email(data.email)
    if existing_user:
        return jsonify({'error': 'User already exists'}), 409
    
    # Create user
    try:
        user = await opensearch_service.create_user(
            email=data.email,
            password=data.password,
            full_name=data.full_name
        )
        
        # Create tokens
        access_token = create_access_token(identity=user['id'])
        refresh_token = create_refresh_token(identity=user['id'])
        
        # Update last login
        await opensearch_service.update_last_login(user['id'])
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserResponse(**user).model_dump()
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Failed to create user', 'details': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
async def login():
    """Login user"""
    try:
        data = LoginRequest(**request.get_json())
    except ValidationError as e:
        return jsonify({'error': 'Invalid request', 'details': e.errors()}), 400
    
    # Get user
    user = await opensearch_service.get_user_by_email(data.email)
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Verify password
    password_hash = user.get('password_hash')
    if not await opensearch_service.verify_password(data.password, password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check if user is active
    if not user.get('is_active', True):
        return jsonify({'error': 'Account is inactive'}), 403
    
    # Create tokens
    access_token = create_access_token(identity=user['id'])
    refresh_token = create_refresh_token(identity=user['id'])
    
    # Update last login
    await opensearch_service.update_last_login(user['id'])
    
    # Remove password_hash from response
    user.pop('password_hash', None)
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': UserResponse(**user).model_dump()
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
async def refresh():
    """Refresh access token"""
    identity = get_jwt_identity()
    
    # Create new access token
    access_token = create_access_token(identity=identity)
    
    return jsonify({
        'access_token': access_token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
async def logout():
    """Logout user"""
    # In a stateless JWT setup, logout is handled on the client side
    # For a more secure implementation, you could maintain a blocklist
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
async def get_current_user():
    """Get current user info"""
    user_id = get_jwt_identity()
    
    user = await opensearch_service.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Remove password_hash
    user.pop('password_hash', None)
    
    return jsonify(UserResponse(**user).model_dump()), 200
