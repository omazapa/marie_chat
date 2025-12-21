from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.opensearch_service import OpenSearchService


conversations_bp = Blueprint('conversations', __name__)
opensearch_service = OpenSearchService()


@conversations_bp.route('', methods=['GET'])
@jwt_required()
async def get_conversations():
    """Get user's conversations"""
    user_id = get_jwt_identity()
    
    try:
        conversations = await opensearch_service.get_user_conversations(user_id)
        return jsonify(conversations), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch conversations', 'details': str(e)}), 500


@conversations_bp.route('', methods=['POST'])
@jwt_required()
async def create_conversation():
    """Create a new conversation"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        conversation = await opensearch_service.create_conversation(
            user_id=user_id,
            model=data.get('model', 'llama3.2'),
            provider=data.get('provider', 'ollama'),
            title=data.get('title', 'Nueva conversación'),
            system_prompt=data.get('system_prompt')
        )
        return jsonify(conversation), 201
    except Exception as e:
        return jsonify({'error': 'Failed to create conversation', 'details': str(e)}), 500


@conversations_bp.route('/<conversation_id>', methods=['GET'])
@jwt_required()
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    user_id = get_jwt_identity()
    
    try:
        conversation = await opensearch_service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Verify ownership
        if conversation['user_id'] != user_id:
            return jsonify({'error': 'Forbidden'}), 403
        
        return jsonify(conversation), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch conversation', 'details': str(e)}), 500


@conversations_bp.route('/<conversation_id>', methods=['PUT'])
@jwt_required()
async def update_conversation(conversation_id: str):
    """Update a conversation"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        conversation = await opensearch_service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Verify ownership
        if conversation['user_id'] != user_id:
            return jsonify({'error': 'Forbidden'}), 403
        
        # Update
        await opensearch_service.update_conversation(conversation_id, data)
        
        # Get updated conversation
        updated = await opensearch_service.get_conversation(conversation_id)
        return jsonify(updated), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update conversation', 'details': str(e)}), 500


@conversations_bp.route('/<conversation_id>', methods=['DELETE'])
@jwt_required()
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    user_id = get_jwt_identity()
    
    try:
        conversation = await opensearch_service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Verify ownership
        if conversation['user_id'] != user_id:
            return jsonify({'error': 'Forbidden'}), 403
        
        # Delete
        await opensearch_service.delete_conversation(conversation_id)
        
        return jsonify({'message': 'Conversation deleted'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete conversation', 'details': str(e)}), 500


@conversations_bp.route('/<conversation_id>/messages', methods=['GET'])
@jwt_required()
async def get_conversation_messages(conversation_id: str):
    """Get messages from a conversation"""
    user_id = get_jwt_identity()
    
    try:
        conversation = await opensearch_service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Verify ownership
        if conversation['user_id'] != user_id:
            return jsonify({'error': 'Forbidden'}), 403
        
        # Get messages
        messages = await opensearch_service.get_conversation_messages(conversation_id)
        
        return jsonify(messages), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch messages', 'details': str(e)}), 500
