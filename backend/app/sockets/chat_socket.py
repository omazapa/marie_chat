"""WebSocket handlers for chat."""
from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.extensions import socketio
from app.services.conversation_service import ConversationService
from app.services.message_service import MessageService
from app.services.ollama_provider import OllamaProvider
from app.services.opensearch_service import OpenSearchService
from app.config import Config
from datetime import datetime
import json


def get_services():
    """Get service instances."""
    config = Config()
    opensearch_service = OpenSearchService(
        hosts=config.OPENSEARCH_HOSTS,
        auth=(config.OPENSEARCH_USER, config.OPENSEARCH_PASSWORD),
        use_ssl=config.OPENSEARCH_USE_SSL,
        verify_certs=config.OPENSEARCH_VERIFY_CERTS
    )
    conversation_service = ConversationService(opensearch_service)
    message_service = MessageService(opensearch_service)
    ollama_provider = OllamaProvider()
    
    return conversation_service, message_service, ollama_provider


@socketio.on('connect')
def handle_connect(auth):
    """Handle WebSocket connection."""
    try:
        # Verify JWT token
        if not auth or 'token' not in auth:
            return False
        
        token = auth['token']
        # Set token in request context for jwt verification
        request.headers = {'Authorization': f'Bearer {token}'}
        verify_jwt_in_request()
        
        user_id = get_jwt_identity()
        print(f"Client connected: {user_id}")
        return True
    except Exception as e:
        print(f"Connection error: {e}")
        return False


@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection."""
    print("Client disconnected")


@socketio.on('send_message')
async def handle_send_message(data):
    """Handle incoming chat message."""
    try:
        user_id = get_jwt_identity()
        conversation_id = data.get('conversation_id')
        content = data.get('content', '').strip()
        model = data.get('model', 'llama3.2')
        provider = data.get('provider', 'ollama')
        
        if not content:
            socketio.emit('error', {'message': 'Content is required'}, room=request.sid)
            return
        
        # Get services
        conversation_service, message_service, ollama_provider = get_services()
        
        # Verify conversation exists and belongs to user
        if conversation_id:
            conversation = conversation_service.get_conversation(conversation_id)
            if not conversation or conversation.get('user_id') != user_id:
                socketio.emit('error', {'message': 'Conversation not found'}, room=request.sid)
                return
        else:
            # Create new conversation
            conversation = conversation_service.create_conversation(
                user_id=user_id,
                model=model,
                provider=provider
            )
            conversation_id = conversation['id']
        
        # Save user message
        user_message = message_service.create_message(
            conversation_id=conversation_id,
            user_id=user_id,
            role='user',
            content=content
        )
        conversation_service.increment_message_count(conversation_id)
        
        socketio.emit('message_sent', {
            'message': user_message,
            'conversation_id': conversation_id
        }, room=request.sid)
        
        # Get conversation history for context
        messages = message_service.get_conversation_messages(conversation_id, limit=50)
        
        # Format messages for LLM
        llm_messages = []
        for msg in messages:
            llm_messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
        
        # Stream response from LLM
        full_response = ""
        socketio.emit('typing_start', {}, room=request.sid)
        
        async for chunk in ollama_provider.stream_chat(model, llm_messages):
            full_response += chunk
            socketio.emit('message_chunk', {
                'chunk': chunk,
                'conversation_id': conversation_id
            }, room=request.sid)
        
        socketio.emit('typing_stop', {}, room=request.sid)
        
        # Save assistant message
        assistant_message = message_service.create_message(
            conversation_id=conversation_id,
            user_id=user_id,
            role='assistant',
            content=full_response
        )
        conversation_service.increment_message_count(conversation_id)
        
        socketio.emit('message_complete', {
            'message': assistant_message,
            'conversation_id': conversation_id
        }, room=request.sid)
    
    except Exception as e:
        print(f"Error in send_message: {e}")
        socketio.emit('error', {'message': str(e)}, room=request.sid)

