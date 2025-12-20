"""Conversation routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.conversation_service import ConversationService
from app.services.opensearch_service import OpenSearchService
from app.config import Config

conversations_bp = Blueprint('conversations', __name__, url_prefix='/api/conversations')


def get_conversation_service() -> ConversationService:
    """Get ConversationService instance."""
    config = Config()
    opensearch_service = OpenSearchService(
        hosts=config.OPENSEARCH_HOSTS,
        auth=(config.OPENSEARCH_USER, config.OPENSEARCH_PASSWORD),
        use_ssl=config.OPENSEARCH_USE_SSL,
        verify_certs=config.OPENSEARCH_VERIFY_CERTS
    )
    return ConversationService(opensearch_service)


@conversations_bp.route('', methods=['GET'])
@jwt_required()
def list_conversations():
    """List user conversations."""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        service = get_conversation_service()
        conversations = service.get_user_conversations(user_id, limit=limit, offset=offset)
        
        return jsonify({
            "conversations": conversations,
            "total": len(conversations)
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@conversations_bp.route('', methods=['POST'])
@jwt_required()
def create_conversation():
    """Create a new conversation."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        title = data.get('title')
        model = data.get('model', 'llama3.2')
        provider = data.get('provider', 'ollama')
        system_prompt = data.get('system_prompt')
        
        service = get_conversation_service()
        conversation = service.create_conversation(
            user_id=user_id,
            model=model,
            provider=provider,
            title=title,
            system_prompt=system_prompt
        )
        
        return jsonify({"conversation": conversation}), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@conversations_bp.route('/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id: str):
    """Get conversation by ID."""
    try:
        user_id = get_jwt_identity()
        service = get_conversation_service()
        conversation = service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Check ownership
        if conversation.get('user_id') != user_id:
            return jsonify({"error": "Forbidden"}), 403
        
        return jsonify({"conversation": conversation}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@conversations_bp.route('/<conversation_id>', methods=['PUT'])
@jwt_required()
def update_conversation(conversation_id: str):
    """Update conversation."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        service = get_conversation_service()
        conversation = service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Check ownership
        if conversation.get('user_id') != user_id:
            return jsonify({"error": "Forbidden"}), 403
        
        # Update conversation
        updates = {}
        if 'title' in data:
            updates['title'] = data['title']
        if 'model' in data:
            updates['model'] = data['model']
        if 'provider' in data:
            updates['provider'] = data['provider']
        if 'system_prompt' in data:
            updates['system_prompt'] = data['system_prompt']
        
        if updates:
            service.update_conversation(conversation_id, updates)
            conversation = service.get_conversation(conversation_id)
        
        return jsonify({"conversation": conversation}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@conversations_bp.route('/<conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id: str):
    """Delete conversation."""
    try:
        user_id = get_jwt_identity()
        service = get_conversation_service()
        conversation = service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Check ownership
        if conversation.get('user_id') != user_id:
            return jsonify({"error": "Forbidden"}), 403
        
        service.delete_conversation(conversation_id)
        return jsonify({"message": "Conversation deleted"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@conversations_bp.route('/<conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id: str):
    """Get messages for a conversation."""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Verify conversation ownership
        service = get_conversation_service()
        conversation = service.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        if conversation.get('user_id') != user_id:
            return jsonify({"error": "Forbidden"}), 403
        
        # Get messages
        from app.services.message_service import MessageService
        from app.services.opensearch_service import OpenSearchService
        
        config = Config()
        opensearch_service = OpenSearchService(
            hosts=config.OPENSEARCH_HOSTS,
            auth=(config.OPENSEARCH_USER, config.OPENSEARCH_PASSWORD),
            use_ssl=config.OPENSEARCH_USE_SSL,
            verify_certs=config.OPENSEARCH_VERIFY_CERTS
        )
        
        message_service = MessageService(opensearch_service)
        messages = message_service.get_conversation_messages(
            conversation_id,
            limit=limit,
            offset=offset
        )
        
        return jsonify({
            "messages": messages,
            "total": len(messages)
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

