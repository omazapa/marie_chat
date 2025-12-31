"""
WebSocket Chat Events
Handles real-time chat communication via Socket.IO
"""
from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app import socketio
from app.services.llm_service import llm_service
from app.services.speech_service import speech_service
import asyncio
import threading
import uuid
from datetime import datetime


# Store active connections
active_connections = {}

# Store stopped generations
stopped_generations = set()

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
    
    # Debug: list rooms for this client
    from flask_socketio import rooms
    print(f"🔍 Client {request.sid} is now in rooms: {rooms()}")
    
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
    attachments = data.get('attachments', [])
    referenced_conv_ids = data.get('referenced_conv_ids', [])
    referenced_msg_ids = data.get('referenced_msg_ids', [])
    regenerate = data.get('regenerate', False)
    
    if not conversation_id or (not message and not attachments and not regenerate):
        emit('error', {'message': 'conversation_id and message (or attachments) are required'})
        return
    
    # If message is empty but we have attachments, provide a default message
    if not message and attachments:
        message = "I have uploaded some files. Please analyze them."
    
    print(f"💬 Message from {user_id} in conversation {conversation_id}: {message[:50]}...")
    if regenerate:
        print(f"🔄 Regenerating response")
    if attachments:
        print(f"📎 With {len(attachments)} attachments")
    if referenced_conv_ids:
        print(f"🔗 Referencing {len(referenced_conv_ids)} conversations")
    if referenced_msg_ids:
        print(f"📍 Referencing {len(referenced_msg_ids)} specific messages")
    
    # Ensure client is in the conversation room before processing
    join_room(conversation_id)
    print(f"[AUTOJOIN] Ensured client {request.sid} is in conversation room {conversation_id}")
    
    # Acknowledge message received
    emit('message_received', {
        'conversation_id': conversation_id,
        'message': message,
        'attachments': attachments,
        'referenced_conv_ids': referenced_conv_ids,
        'referenced_msg_ids': referenced_msg_ids
    })
    
    print(f"[TASK] Starting background task for conversation {conversation_id}")
    
    # Process message in background task
    socketio.start_background_task(
        process_chat_message_wrapper,
        user_id=user_id,
        conversation_id=conversation_id,
        message=message,
        stream=stream,
        sid=request.sid,
        attachments=attachments,
        referenced_conv_ids=referenced_conv_ids,
        referenced_msg_ids=referenced_msg_ids,
        regenerate=regenerate
    )
    
    print(f"[STARTED] Background task started for conversation {conversation_id}")


def process_chat_message_wrapper(
    user_id: str,
    conversation_id: str,
    message: str,
    stream: bool,
    sid: str,
    attachments: list = None,
    referenced_conv_ids: list = None,
    referenced_msg_ids: list = None,
    regenerate: bool = False
):
    """Wrapper to run async function in dedicated event loop"""
    print(f"[WRAPPER] Started for conversation {conversation_id}")
    try:
        loop = get_async_loop()
        print(f"[LOOP] Got event loop for conversation {conversation_id}")
        # Schedule coroutine in the dedicated loop
        future = asyncio.run_coroutine_threadsafe(
            process_chat_message_async(
                user_id, conversation_id, message, stream, sid, 
                attachments, referenced_conv_ids, referenced_msg_ids, regenerate
            ),
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
    sid: str,
    attachments: list = None,
    referenced_conv_ids: list = None,
    referenced_msg_ids: list = None,
    regenerate: bool = False
):
    """Process chat message and emit responses (async version)"""
    print(f"[ASYNC] Function started for conversation {conversation_id}")
    try:
        # Ensure it's not in stopped set at start
        stopped_generations.discard(conversation_id)
        
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
                stream=True,
                attachments=attachments,
                referenced_conv_ids=referenced_conv_ids,
                referenced_msg_ids=referenced_msg_ids,
                regenerate=regenerate
            )
            print(f"[ITER] Got generator, starting iteration")
            # Now iterate over the generator
            async for chunk in generator:
                # Check if generation was stopped
                if conversation_id in stopped_generations:
                    print(f"[STOP] Generation stopped for conversation {conversation_id}")
                    break
                
                print(f"[CHUNK] Got chunk: {chunk.get('content', '')[:50]}...")
                full_content += chunk['content']
                # Emit each chunk to the client
                print(f"[EMIT] Emitting stream_chunk to conversation room {conversation_id}")
                socketio.emit('stream_chunk', {
                    'conversation_id': conversation_id,
                    'content': chunk.get('content', ''),
                    'done': chunk.get('done', False),
                    'follow_ups': chunk.get('follow_ups')
                }, room=conversation_id)
                print(f"[EMIT] stream_chunk emitted")
            
            # Fetch the saved message from DB to get complete message object
            # We search for the last assistant message in this conversation
            all_messages = llm_service.get_messages(
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
                stream=False,
                attachments=attachments,
                referenced_conv_ids=referenced_conv_ids,
                referenced_msg_ids=referenced_msg_ids,
                regenerate=regenerate
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
    finally:
        # Cleanup stopped set
        stopped_generations.discard(conversation_id)


@socketio.on('stop_generation')
def handle_stop_generation(data):
    """Stop an ongoing generation"""
    conversation_id = data.get('conversation_id')
    if conversation_id:
        print(f"🛑 Stop requested for conversation {conversation_id}")
        stopped_generations.add(conversation_id)
        # Emit confirmation
        emit('generation_stopped', {'conversation_id': conversation_id}, room=conversation_id)


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


@socketio.on('transcribe_audio')
def handle_transcribe_audio(data):
    """Transcribe audio data to text"""
    if request.sid not in active_connections:
        emit('error', {'message': 'Not authenticated'})
        return
    
    audio_data = data.get('audio')
    language = data.get('language') # Optional language hint
    
    if not audio_data:
        emit('error', {'message': 'Audio data is required'})
        return
    
    print(f"🎙️ Transcribing audio from {request.sid} (language hint: {language or 'auto'})")
    
    sid = request.sid
    
    def process_transcription(target_sid):
        try:
            text = speech_service.transcribe_base64(audio_data, language=language)
            socketio.emit('transcription_result', {'text': text}, room=target_sid)
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            socketio.emit('error', {'message': f'Transcription error: {str(e)}'}, room=target_sid)
    
    # Run in a separate thread to avoid blocking the event loop
    threading.Thread(target=process_transcription, args=(sid,)).start()


@socketio.on('text_to_speech')
def handle_text_to_speech(data):
    """Convert text to speech"""
    if request.sid not in active_connections:
        emit('error', {'message': 'Not authenticated'})
        return
    
    text = data.get('text')
    voice = data.get('voice', 'es-CO-GonzaloNeural')
    message_id = data.get('message_id') # To identify which message this audio belongs to
    
    if not text:
        emit('error', {'message': 'Text is required'})
        return
    
    print(f"🔊 Converting text to speech for {request.sid}")
    
    sid = request.sid
    
    async def process_tts(target_sid):
        try:
            audio_base64 = await speech_service.text_to_speech_base64(text, voice)
            socketio.emit('tts_result', {
                'audio': audio_base64,
                'message_id': message_id
            }, room=target_sid)
        except Exception as e:
            print(f"❌ TTS error: {e}")
            socketio.emit('error', {'message': f'TTS error: {str(e)}'}, room=target_sid)
    
    # Run in the global async loop
    loop = get_async_loop()
    asyncio.run_coroutine_threadsafe(process_tts(sid), loop)


# Error handler
@socketio.on_error_default
def default_error_handler(e):
    """Handle Socket.IO errors"""
    print(f"❌ Socket.IO error: {e}")
    emit('error', {'message': 'An error occurred'})

