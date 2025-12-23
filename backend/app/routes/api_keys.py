"""
API Key Routes
REST API endpoints for managing developer API keys
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.api_key_service import api_key_service

api_keys_bp = Blueprint('api_keys', __name__)

@api_keys_bp.route('', methods=['POST'])
@jwt_required()
def create_key():
    """Create a new API key"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Name is required'}), 400
        
    expires_in_days = data.get('expires_in_days', 365)
    
    key_info = api_key_service.create_api_key(
        user_id=user_id,
        name=name,
        expires_in_days=expires_in_days
    )
    
    return jsonify(key_info), 201

@api_keys_bp.route('', methods=['GET'])
@jwt_required()
def list_keys():
    """List user's API keys"""
    user_id = get_jwt_identity()
    keys = api_key_service.list_api_keys(user_id)
    return jsonify({'keys': keys}), 200

@api_keys_bp.route('/<key_id>', methods=['DELETE'])
@jwt_required()
def revoke_key(key_id):
    """Revoke an API key"""
    user_id = get_jwt_identity()
    success = api_key_service.revoke_api_key(key_id, user_id)
    
    if not success:
        return jsonify({'error': 'Key not found or access denied'}), 404
        
    return jsonify({'message': 'API key revoked'}), 200
