"""
V1 Chat Routes
External REST API for chat completions using API Key authentication
"""
import json
import asyncio
from flask import Blueprint, request, jsonify, Response, stream_with_context
from app.utils.auth import api_key_required
from app.services.llm_service import llm_service

v1_chat_bp = Blueprint('v1_chat', __name__)

@v1_chat_bp.route('/completions', methods=['POST'])
@api_key_required
def chat_completions():
    """
    External API endpoint for chat completions
    Expects: { "messages": [...], "model": "...", "stream": bool }
    """
    user_id = request.user_id
    data = request.get_json()
    
    if not data or 'messages' not in data:
        return jsonify({'error': 'Messages are required'}), 400
        
    messages = data.get('messages')
    model = data.get('model', 'llama3.2')
    stream = data.get('stream', False)
    
    # Get the last user message
    user_message = ""
    for msg in reversed(messages):
        if msg.get('role') == 'user':
            user_message = msg.get('content', '')
            break
            
    if not user_message:
        return jsonify({'error': 'No user message found in messages history'}), 400

    # Create or get conversation
    conversation_id = data.get('conversation_id')
    if not conversation_id:
        conv = llm_service.create_conversation(
            user_id=user_id,
            title=f"API: {user_message[:30]}...",
            model=model
        )
        conversation_id = conv['id']

    # Handle async in sync Flask
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        if not stream:
            # Non-streaming
            result = loop.run_until_complete(llm_service.chat_completion(
                conversation_id=conversation_id,
                user_id=user_id,
                user_message=user_message,
                stream=False
            ))
            return jsonify(result)
        else:
            # Streaming (SSE)
            def generate():
                # New loop for the generator thread
                gen_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(gen_loop)
                try:
                    gen = llm_service.chat_completion(
                        conversation_id=conversation_id,
                        user_id=user_id,
                        user_message=user_message,
                        stream=True
                    )
                    
                    while True:
                        try:
                            chunk = gen_loop.run_until_complete(gen.__anext__())
                            yield f"data: {json.dumps(chunk)}\n\n"
                            if chunk.get('done'):
                                break
                        except StopAsyncIteration:
                            break
                        except Exception as e:
                            yield f"data: {json.dumps({'error': str(e)})}\n\n"
                            break
                finally:
                    gen_loop.close()
                    
            return Response(stream_with_context(generate()), mimetype='text/event-stream')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if not stream:
            loop.close()
