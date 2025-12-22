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
import threading
import uuid
from datetime import datetime


# Store active connections
active_connections = {}

# Global event loop for async operations (runs in dedicated thread)
_async_loop = None
_loop_thread = None

def get_async_loop():
    """Get or create the global async event loop"""
    global _async_loop, _loop_thread
    if _async_loop is None or not _async_loop.is_running():
        def run_loop(loop):
            asyncio.set_event_loop(loop)
            loop.run_forever()
        
        _async_loop = asyncio.new_event_loop()
        _loop_thread = threading.Thread(target=run_loop, args=(_async_loop,), daemon=True)
        _loop_thread.start()
    return _async_loop


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
def handle_disconnect(*args, **kwargs):
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
    
    # Ensure client is in the conversation room before processing
    join_room(conversation_id)
    print(f"[AUTOJOIN] Ensured client {request.sid} is in conversation room {conversation_id}")
    
    # Acknowledge message received
    emit('message_received', {
        'conversation_id': conversation_id,
        'message': message
    })
    
    print(f"[TASK] Starting background task for conversation {conversation_id}")
    
    # Process message in background task
    socketio.start_background_task(
        process_chat_message_wrapper,
        user_id=user_id,
        conversation_id=conversation_id,
        message=message,
        stream=stream,
        sid=request.sid
    )
    
    print(f"[STARTED] Background task started for conversation {conversation_id}")


def process_chat_message_wrapper(
    user_id: str,
    conversation_id: str,
    message: str,
    stream: bool,
    sid: str
):
    """Wrapper to run async function in dedicated event loop"""
    print(f"[WRAPPER] Started for conversation {conversation_id}")
    try:
        loop = get_async_loop()
        print(f"[LOOP] Got event loop for conversation {conversation_id}")
        # Schedule coroutine in the dedicated loop
        future = asyncio.run_coroutine_threadsafe(
            process_chat_message_async(user_id, conversation_id, message, stream, sid),
            loop
        )
        print(f"[WAIT] Waiting for coroutine completion for conversation {conversation_id}")
        # Wait for completion
        result = future.result(timeout=300)  # 5 minute timeout
        print(f"[COMPLETE] Wrapper completed for conversation {conversation_id}")
    except Exception as e:
        print(f"❌ Background task error in wrapper: {e}")
        import traceback
        traceback.print_exc()
        socketio.emit('error', {
            'message': f'Error processing message: {str(e)}'
        }, room=sid)


async def process_chat_message_async(
    user_id: str,
    conversation_id: str,
    message: str,
    stream: bool,
    sid: str
):
    """Process chat message and emit responses (async version)"""
    print(f"[ASYNC] Function started for conversation {conversation_id}")
    try:
        if stream:
            # Streaming response
            print(f"[STREAM] Starting stream for conversation {conversation_id}")
            # Emit to conversation room instead of individual sid
            socketio.emit('stream_start', {
                'conversation_id': conversation_id
            }, room=conversation_id)
            print(f"[EMIT] stream_start emitted to conversation room {conversation_id}")
            
            print(f"[LLM] Calling LLM service for conversation {conversation_id}")
            # Stream messages
            full_content = ""
            print(f"[ITER] Starting iteration over LLM chunks")
            # Get the generator first (chat_completion is async and returns a generator)
            generator = await llm_service.chat_completion(
                conversation_id=conversation_id,
                user_id=user_id,
                user_message=message,
                stream=True
            )
            print(f"[ITER] Got generator, starting iteration")
            # Now iterate over the generator
            async for chunk in generator:
                print(f"[CHUNK] Got chunk: {chunk.get('content', '')[:50]}...")
                full_content += chunk['content']
                # Emit each chunk to the client
                print(f"[EMIT] Emitting stream_chunk to conversation room {conversation_id}")
                socketio.emit('stream_chunk', {
                    'conversation_id': conversation_id,
                    'content': chunk['content'],
                    'done': chunk.get('done', False)
                }, room=conversation_id)
                print(f"[EMIT] stream_chunk emitted")
            
            # Fetch the saved message from DB to get complete message object
            # We search for the last assistant message in this conversation
            all_messages = await llm_service.get_messages(
                conversation_id, user_id, limit=50
            )
            
            last_message = None
            if all_messages:
                # Find the most recent assistant message
                for msg in reversed(all_messages):
                    if msg['role'] == 'assistant':
                        last_message = msg
                        break
            
            if not last_message and full_content:
                # Fallback: if message wasn't saved for some reason but we have content
                print(f"⚠️ Warning: Assistant message not found in DB, using fallback")
                last_message = {
                    'id': f'fallback-{uuid.uuid4()}',
                    'conversation_id': conversation_id,
                    'role': 'assistant',
                    'content': full_content,
                    'created_at': datetime.utcnow().isoformat()
                }

            socketio.emit('stream_end', {
                'conversation_id': conversation_id,
                'message': last_message
            }, room=conversation_id)
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
            }, room=conversation_id)
    
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        import traceback
        traceback.print_exc()
        socketio.emit('error', {
            'message': f'Error processing message: {str(e)}'
        }, room=conversation_id)


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

