"""
WebSocket Chat Events
Handles real-time chat communication via Socket.IO
"""
from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app import socketio
from app.services.llm_service import llm_service
import asyncio


# Store active connections
active_connections = {}


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    # Get token from auth header or query params
    token = request.args.get('token')
    
    if not token:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
    
    if not token:
        print("❌ Connection rejected: No token provided")
        return False
    
    try:
        # Decode JWT token
        decoded = decode_token(token)
        user_id = decoded['sub']
        
        # Store connection
        active_connections[request.sid] = {
            'user_id': user_id,
            'token': token
        }
        
        print(f"✅ Client connected: {request.sid} (user: {user_id})")
        emit('connected', {'message': 'Connected successfully', 'user_id': user_id})
        return True
    except Exception as e:
        print(f"❌ Connection rejected: {e}")
        return False


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    if request.sid in active_connections:
        user_id = active_connections[request.sid]['user_id']
        del active_connections[request.sid]
        print(f"👋 Client disconnected: {request.sid} (user: {user_id})")


@socketio.on('join_conversation')
def handle_join_conversation(data):
    """Join a conversation room"""
    conversation_id = data.get('conversation_id')
    
    if not conversation_id:
        emit('error', {'message': 'conversation_id is required'})
        return
    
    if request.sid not in active_connections:
        emit('error', {'message': 'Not authenticated'})
        return
    
    join_room(conversation_id)
    print(f"📥 Client {request.sid} joined conversation {conversation_id}")
    emit('joined_conversation', {'conversation_id': conversation_id})


@socketio.on('leave_conversation')
def handle_leave_conversation(data):
    """Leave a conversation room"""
    conversation_id = data.get('conversation_id')
    
    if not conversation_id:
        emit('error', {'message': 'conversation_id is required'})
        return
    
    leave_room(conversation_id)
    print(f"📤 Client {request.sid} left conversation {conversation_id}")
    emit('left_conversation', {'conversation_id': conversation_id})


@socketio.on('send_message')
def handle_send_message(data):
    """Handle incoming chat message with streaming response"""
    if request.sid not in active_connections:
        emit('error', {'message': 'Not authenticated'})
        return
    
    user_id = active_connections[request.sid]['user_id']
    conversation_id = data.get('conversation_id')
    message = data.get('message')
    stream = data.get('stream', True)
    
    if not conversation_id or not message:
        emit('error', {'message': 'conversation_id and message are required'})
        return
    
    print(f"💬 Message from {user_id} in conversation {conversation_id}: {message[:50]}...")
    
    # Acknowledge message received
    emit('message_received', {
        'conversation_id': conversation_id,
        'message': message
    })
    
    # Process message asynchronously
    asyncio.run(process_chat_message(
        user_id=user_id,
        conversation_id=conversation_id,
        message=message,
        stream=stream,
        sid=request.sid
    ))


async def process_chat_message(
    user_id: str,
    conversation_id: str,
    message: str,
    stream: bool,
    sid: str
):
    """Process chat message and emit responses"""
    try:
        if stream:
            # Streaming response
            socketio.emit('stream_start', {
                'conversation_id': conversation_id
            }, room=sid)
            
            async for chunk in await llm_service.chat_completion(
                conversation_id=conversation_id,
                user_id=user_id,
                user_message=message,
                stream=True
            ):
                # Emit each chunk to the client
                socketio.emit('stream_chunk', {
                    'conversation_id': conversation_id,
                    'content': chunk['content'],
                    'done': chunk.get('done', False)
                }, room=sid)
            
            socketio.emit('stream_end', {
                'conversation_id': conversation_id
            }, room=sid)
        else:
            # Non-streaming response
            result = await llm_service.chat_completion(
                conversation_id=conversation_id,
                user_id=user_id,
                user_message=message,
                stream=False
            )
            
            socketio.emit('message_response', {
                'conversation_id': conversation_id,
                'message': result
            }, room=sid)
    
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        socketio.emit('error', {
            'message': f'Error processing message: {str(e)}'
        }, room=sid)


@socketio.on('typing')
def handle_typing(data):
    """Handle typing indicator"""
    if request.sid not in active_connections:
        return
    
    conversation_id = data.get('conversation_id')
    is_typing = data.get('is_typing', False)
    
    if conversation_id:
        # Broadcast typing status to conversation room (except sender)
        emit('user_typing', {
            'conversation_id': conversation_id,
            'user_id': active_connections[request.sid]['user_id'],
            'is_typing': is_typing
        }, room=conversation_id, skip_sid=request.sid)


# Error handler
@socketio.on_error_default
def default_error_handler(e):
    """Handle Socket.IO errors"""
    print(f"❌ Socket.IO error: {e}")
    emit('error', {'message': 'An error occurred'})

