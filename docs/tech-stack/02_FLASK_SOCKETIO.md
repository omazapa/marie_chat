# Flask-SocketIO + Eventlet - Complete Reference Guide

> **Last Updated:** January 3, 2026
> **Versions:** Flask-SocketIO 5.x | Flask 3.x | Eventlet 0.35.x
> **MARIE Project Context**

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Event Handling](#event-handling)
4. [Rooms & Broadcasting](#rooms--broadcasting)
5. [Connection Management](#connection-management)
6. [Streaming Patterns](#streaming-patterns)
7. [Error Handling](#error-handling)
8. [Performance & Scalability](#performance--scalability)
9. [Testing WebSockets](#testing-websockets)
10. [Production Deployment](#production-deployment)

---

## Overview

### What is Flask-SocketIO?

Flask-SocketIO enables **real-time bidirectional communication** between Flask backend and clients using WebSockets. It provides:

- **Full-duplex communication** - Both client and server can initiate messages
- **Event-based architecture** - Custom events for different message types
- **Room support** - Group clients for targeted broadcasting
- **Namespace support** - Logical separation of socket connections
- **Automatic fallback** - Falls back to long-polling if WebSocket unavailable

### Why Eventlet?

```python
# CRITICAL: Must be first line in run.py
import eventlet
eventlet.monkey_patch()

# Why? Eventlet provides:
# 1. Green threads (cooperative multitasking)
# 2. Non-blocking I/O
# 3. Support for thousands of concurrent connections
# 4. Compatible with Flask-SocketIO's async mode
```

**Eventlet Benefits:**
- **High Concurrency**: Handle 10,000+ concurrent WebSocket connections
- **Low Memory**: Each green thread uses ~4KB (vs 2MB+ for OS threads)
- **Cooperative**: No race conditions, no need for locks
- **Simple**: Synchronous programming style with async performance

---

## Architecture

### MARIE's WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Socket.IO Client (browser)                          │  │
│  │  - Manages connection                                 │  │
│  │  - Emits events                                       │  │
│  │  - Listens for responses                             │  │
│  └────────────────┬─────────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────────┘
                    │ WebSocket / Long-polling
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Flask-SocketIO                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Eventlet WSGI Server                          │  │  │
│  │  │  - Green thread pool                           │  │  │
│  │  │  - Non-blocking I/O                            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Socket Handlers                                │  │  │
│  │  │  - on_connect                                   │  │  │
│  │  │  - on_disconnect                                │  │  │
│  │  │  - on_send_message                              │  │  │
│  │  │  - on_stream_chunk (streaming)                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  Background Tasks (Eventlet Greenlets)                │  │
│  │  - LLM streaming                                      │  │
│  │  - Image generation                                   │  │
│  │  - Speech processing                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Initialization Pattern

```python
# backend/app/__init__.py
from flask import Flask
from flask_socketio import SocketIO
import eventlet

# Initialize SocketIO with eventlet
socketio = SocketIO(
    cors_allowed_origins="*",  # Configure for your domain
    async_mode="eventlet",     # CRITICAL: Must match monkey_patch
    logger=True,
    engineio_logger=True,
    ping_timeout=60,           # Client must respond within 60s
    ping_interval=25,          # Server pings client every 25s
    max_http_buffer_size=1e8,  # 100MB for large file uploads
)

def create_app():
    app = Flask(__name__)
    # ... configure app ...

    # Initialize SocketIO
    socketio.init_app(app)

    # Register socket events
    from app.sockets import chat_events

    return app

# backend/run.py
import eventlet
eventlet.monkey_patch()  # MUST BE FIRST!

from app import create_app, socketio

app = create_app()

if __name__ == '__main__':
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True,
        log_output=True
    )
```

---

## Event Handling

### Basic Event Structure

```python
# backend/app/sockets/chat_events.py
from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import get_jwt_identity, decode_token
from flask import request

from app import socketio

@socketio.on('connect')
def handle_connect():
    """
    Called when client connects
    - Validate authentication
    - Set up user session
    """
    print(f'[CONNECT] Client connected: {request.sid}')

    # Get token from query params
    token = request.args.get('token')

    try:
        # Validate JWT
        decoded = decode_token(token)
        user_id = decoded['sub']

        # Store user info in session
        request.sid_to_user_id = {request.sid: user_id}

        emit('connected', {
            'status': 'connected',
            'sid': request.sid
        })

        return True  # Accept connection

    except Exception as e:
        print(f'[CONNECT] Authentication failed: {e}')
        return False  # Reject connection

@socketio.on('disconnect')
def handle_disconnect():
    """
    Called when client disconnects
    - Clean up resources
    - Leave all rooms
    """
    print(f'[DISCONNECT] Client disconnected: {request.sid}')
    # Cleanup happens automatically

@socketio.on('join_conversation')
def handle_join_conversation(data):
    """
    Join a conversation room for targeted messages
    """
    conversation_id = data.get('conversation_id')
    user_id = get_user_id_from_session(request.sid)

    # Verify user has access
    if not has_access(user_id, conversation_id):
        emit('error', {'message': 'Access denied'})
        return

    # Join room
    join_room(conversation_id)
    print(f'[JOIN] {request.sid} joined room {conversation_id}')

    emit('joined', {
        'conversation_id': conversation_id,
        'status': 'joined'
    })

@socketio.on('send_message')
def handle_send_message(data):
    """
    Handle incoming message from client
    """
    conversation_id = data.get('conversation_id')
    message = data.get('message')
    stream = data.get('stream', True)

    print(f'[MESSAGE] Received in {conversation_id}: {message[:50]}...')

    # Start streaming response
    if stream:
        socketio.start_background_task(
            stream_response,
            request.sid,
            conversation_id,
            message
        )
    else:
        # Synchronous response
        response = generate_response(message)
        emit('message_response', {
            'conversation_id': conversation_id,
            'message': response
        }, room=conversation_id)
```

### Event with Acknowledgment

```python
@socketio.on('send_message_with_ack')
def handle_message_with_ack(data):
    """
    Client can receive acknowledgment
    """
    conversation_id = data['conversation_id']
    message = data['message']

    try:
        # Process message
        result = process_message(conversation_id, message)

        # Return acknowledgment
        return {
            'status': 'success',
            'message_id': result['id']
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

# Client side (JavaScript):
// socket.emit('send_message_with_ack', data, (response) => {
//   console.log('Acknowledgment:', response);
// });
```

---

## Rooms & Broadcasting

### Room Patterns in MARIE

```python
# Pattern 1: One-to-One (Private Conversation)
@socketio.on('join_conversation')
def join_conversation(data):
    conversation_id = data['conversation_id']
    user_id = get_current_user_id()

    # Room name = conversation_id
    join_room(conversation_id)

    # Only this user sees messages in this room
    emit('joined', {'conversation_id': conversation_id})

# Pattern 2: Broadcast to Room
def send_stream_chunk(conversation_id, chunk):
    """
    Send chunk to everyone in the conversation room
    """
    socketio.emit(
        'stream_chunk',
        {
            'conversation_id': conversation_id,
            'content': chunk,
            'done': False
        },
        room=conversation_id  # Only to this room
    )

# Pattern 3: Broadcast to All
@socketio.on('system_announcement')
def handle_announcement(data):
    """
    Admin broadcasts to everyone
    """
    if not is_admin(get_current_user_id()):
        return

    socketio.emit(
        'announcement',
        {'message': data['message']},
        broadcast=True  # To all connected clients
    )

# Pattern 4: Targeted Emit (Specific Client)
def send_to_specific_client(sid, event, data):
    """
    Send to one specific client by session ID
    """
    socketio.emit(event, data, room=sid)
```

### Room Management Best Practices

```python
from collections import defaultdict
from threading import Lock

# Track active rooms and users
active_rooms = defaultdict(set)
rooms_lock = Lock()

@socketio.on('join_conversation')
def join_conversation(data):
    conversation_id = data['conversation_id']
    user_id = get_current_user_id()

    with rooms_lock:
        active_rooms[conversation_id].add(request.sid)

    join_room(conversation_id)

    # Notify others in room
    emit('user_joined', {
        'user_id': user_id,
        'conversation_id': conversation_id
    }, room=conversation_id, skip_sid=request.sid)

@socketio.on('leave_conversation')
def leave_conversation(data):
    conversation_id = data['conversation_id']
    user_id = get_current_user_id()

    with rooms_lock:
        active_rooms[conversation_id].discard(request.sid)

    leave_room(conversation_id)

    # Notify others
    emit('user_left', {
        'user_id': user_id,
        'conversation_id': conversation_id
    }, room=conversation_id)

@socketio.on('disconnect')
def handle_disconnect():
    # Auto-cleanup: leave all rooms
    with rooms_lock:
        for room, members in list(active_rooms.items()):
            if request.sid in members:
                members.remove(request.sid)
                emit('user_left', {
                    'sid': request.sid
                }, room=room)
```

---

## Connection Management

### Heartbeat & Keepalive

```python
# Configure in socketio initialization
socketio = SocketIO(
    ping_timeout=60,    # Disconnect if no response in 60s
    ping_interval=25,   # Ping every 25s
)

# Client-side heartbeat (JavaScript)
// socket.on('ping', () => {
//   socket.emit('pong');
// });
```

### Reconnection Handling

```python
from flask import session

@socketio.on('connect')
def handle_connect():
    """
    Handle reconnection scenarios
    """
    # Check if this is a reconnection
    previous_sid = request.args.get('previous_sid')

    if previous_sid:
        # Migrate data from old session
        migrate_session_data(previous_sid, request.sid)

        emit('reconnected', {
            'message': 'Successfully reconnected',
            'restored': True
        })
    else:
        emit('connected', {
            'message': 'New connection established'
        })

def migrate_session_data(old_sid, new_sid):
    """
    Transfer state from old session to new
    """
    # Example: transfer conversation subscriptions
    for room in get_user_rooms(old_sid):
        join_room(room, sid=new_sid)
        leave_room(room, sid=old_sid)
```

### Connection State Management

```python
from enum import Enum
from dataclasses import dataclass
from datetime import datetime

class ConnectionState(Enum):
    CONNECTING = "connecting"
    CONNECTED = "connected"
    DISCONNECTING = "disconnecting"
    DISCONNECTED = "disconnected"

@dataclass
class ClientSession:
    sid: str
    user_id: str
    state: ConnectionState
    connected_at: datetime
    last_activity: datetime
    subscribed_rooms: set[str]

# Global session store
sessions: dict[str, ClientSession] = {}

@socketio.on('connect')
def handle_connect():
    token = request.args.get('token')
    user_id = validate_token(token)

    sessions[request.sid] = ClientSession(
        sid=request.sid,
        user_id=user_id,
        state=ConnectionState.CONNECTED,
        connected_at=datetime.utcnow(),
        last_activity=datetime.utcnow(),
        subscribed_rooms=set()
    )

    print(f'[SESSION] Created session for {user_id}')

@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in sessions:
        sessions[request.sid].state = ConnectionState.DISCONNECTED
        del sessions[request.sid]

    print(f'[SESSION] Deleted session {request.sid}')

# Periodic cleanup of stale sessions
import eventlet

def cleanup_stale_sessions():
    while True:
        eventlet.sleep(60)  # Every minute

        now = datetime.utcnow()
        stale = [
            sid for sid, session in sessions.items()
            if (now - session.last_activity).seconds > 300  # 5 min
        ]

        for sid in stale:
            print(f'[CLEANUP] Removing stale session {sid}')
            disconnect(sid=sid)
            del sessions[sid]

# Start cleanup task
socketio.start_background_task(cleanup_stale_sessions)
```

---

## Streaming Patterns

### LLM Streaming Implementation

```python
@socketio.on('send_message')
def handle_send_message(data):
    """
    Stream LLM response in real-time
    """
    conversation_id = data['conversation_id']
    user_message = data['message']

    # Start background task for streaming
    socketio.start_background_task(
        stream_llm_response,
        request.sid,
        conversation_id,
        user_message
    )

    # Immediate acknowledgment
    emit('stream_start', {
        'conversation_id': conversation_id,
        'status': 'streaming'
    })

def stream_llm_response(sid, conversation_id, message):
    """
    Background task that streams LLM response
    """
    try:
        # Notify start
        socketio.emit(
            'stream_start',
            {'conversation_id': conversation_id},
            room=conversation_id
        )

        # Get LLM provider
        from app.services.llm_service import llm_service

        # Stream chunks
        full_content = ""
        async for chunk in llm_service.chat_completion(
            conversation_id=conversation_id,
            user_message=message,
            stream=True
        ):
            # Emit each chunk
            socketio.emit(
                'stream_chunk',
                {
                    'conversation_id': conversation_id,
                    'content': chunk.content,
                    'done': chunk.done,
                    'tokens_used': chunk.tokens_used
                },
                room=conversation_id
            )

            full_content += chunk.content

            if chunk.done:
                break

            # Allow other greenlets to run
            eventlet.sleep(0)

        # Stream complete
        socketio.emit(
            'stream_end',
            {
                'conversation_id': conversation_id,
                'full_content': full_content,
                'status': 'complete'
            },
            room=conversation_id
        )

    except Exception as e:
        # Error handling
        socketio.emit(
            'stream_error',
            {
                'conversation_id': conversation_id,
                'error': str(e)
            },
            room=conversation_id
        )
```

### Backpressure Handling

```python
from collections import deque
import eventlet

class StreamBuffer:
    """
    Buffer to handle backpressure in streaming
    """
    def __init__(self, max_size=100):
        self.buffer = deque(maxlen=max_size)
        self.lock = eventlet.semaphore.Semaphore()

    def add(self, chunk):
        with self.lock:
            if len(self.buffer) >= self.buffer.maxlen:
                # Buffer full, drop oldest or wait
                self.buffer.popleft()
            self.buffer.append(chunk)

    def get_all(self):
        with self.lock:
            items = list(self.buffer)
            self.buffer.clear()
            return items

# Usage in streaming
stream_buffers = {}

def stream_with_backpressure(conversation_id, sid):
    buffer = StreamBuffer(max_size=50)
    stream_buffers[sid] = buffer

    try:
        # Producer: Generate chunks
        for chunk in generate_chunks():
            buffer.add(chunk)

            # Yield control to consumer
            eventlet.sleep(0.01)

        # Consumer: Send buffered chunks
        while True:
            chunks = buffer.get_all()
            if not chunks:
                break

            for chunk in chunks:
                socketio.emit('stream_chunk', chunk, room=conversation_id)
                eventlet.sleep(0.001)

    finally:
        del stream_buffers[sid]
```

---

## Error Handling

### Global Error Handler

```python
@socketio.on_error()
def error_handler(e):
    """
    Catch all errors in socket handlers
    """
    print(f'[ERROR] Socket error: {e}')
    emit('error', {
        'message': 'An error occurred',
        'details': str(e) if app.debug else None
    })

@socketio.on_error_default
def default_error_handler(e):
    """
    Fallback error handler
    """
    print(f'[ERROR] Unhandled socket error: {e}')
    emit('error', {
        'message': 'Internal server error'
    })
```

### Namespace-Specific Error Handling

```python
from flask_socketio import Namespace, emit

class ChatNamespace(Namespace):
    def on_connect(self):
        print('[CHAT] Client connected')

    def on_disconnect(self):
        print('[CHAT] Client disconnected')

    def on_send_message(self, data):
        try:
            # Handle message
            pass
        except ValidationError as e:
            emit('validation_error', {'message': str(e)})
        except PermissionError as e:
            emit('permission_error', {'message': str(e)})
        except Exception as e:
            emit('error', {'message': 'Internal error'})
            raise  # Re-raise for logging

# Register namespace
socketio.on_namespace(ChatNamespace('/chat'))
```

### Graceful Degradation

```python
@socketio.on('send_message')
def handle_send_message(data):
    """
    Fallback to HTTP if WebSocket fails
    """
    try:
        # Try WebSocket streaming
        stream_response(data)
    except ConnectionError:
        # Fallback to HTTP
        emit('fallback_to_http', {
            'message': 'WebSocket unavailable, use HTTP API',
            'api_url': '/api/chat/send'
        })
```

---

## Performance & Scalability

### Monitoring Active Connections

```python
from prometheus_client import Gauge

# Metrics
active_connections = Gauge(
    'marie_websocket_connections',
    'Number of active WebSocket connections'
)

active_rooms = Gauge(
    'marie_websocket_rooms',
    'Number of active rooms'
)

@socketio.on('connect')
def handle_connect():
    active_connections.inc()

@socketio.on('disconnect')
def handle_disconnect():
    active_connections.dec()
```

### Load Testing

```python
# tests/load/websocket_load_test.py
from locust import User, task, between
from socketio import SimpleClient

class WebSocketUser(User):
    wait_time = between(1, 3)

    def on_start(self):
        self.client = SimpleClient()
        self.client.connect(
            'http://localhost:5000',
            auth={'token': self.get_token()}
        )
        self.client.emit('join_conversation', {
            'conversation_id': 'test-conv'
        })

    @task
    def send_message(self):
        self.client.emit('send_message', {
            'conversation_id': 'test-conv',
            'message': 'Hello, AI!'
        })

    def on_stop(self):
        self.client.disconnect()
```

---

## Testing WebSockets

### Unit Testing

```python
# tests/unit/test_socket_events.py
import pytest
from app import create_app, socketio

@pytest.fixture
def socket_client():
    app = create_app('testing')
    client = socketio.test_client(app)
    yield client
    client.disconnect()

def test_connect(socket_client):
    assert socket_client.is_connected()

def test_join_conversation(socket_client):
    socket_client.emit('join_conversation', {
        'conversation_id': 'test-123'
    })

    received = socket_client.get_received()
    assert len(received) > 0
    assert received[0]['name'] == 'joined'

def test_send_message(socket_client):
    # Join room first
    socket_client.emit('join_conversation', {
        'conversation_id': 'test-123'
    })

    # Send message
    socket_client.emit('send_message', {
        'conversation_id': 'test-123',
        'message': 'Hello!'
    })

    # Check for stream events
    received = socket_client.get_received()
    stream_events = [r for r in received if r['name'] == 'stream_chunk']
    assert len(stream_events) > 0
```

---

## Production Deployment

### Gunicorn Configuration

```python
# gunicorn.conf.py
import multiprocessing

# Don't use multiple workers with eventlet!
workers = 1
worker_class = 'eventlet'
worker_connections = 1000

bind = '0.0.0.0:5000'
timeout = 120
keepalive = 5

# Logging
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/marie
upstream marie_backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name marie.example.com;

    location /socket.io {
        proxy_pass http://marie_backend/socket.io;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://marie_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Key Takeaways for MARIE

1. **Always `monkey_patch()` first** - Before any imports
2. **Use rooms for isolation** - Each conversation = one room
3. **Background tasks for streaming** - Don't block socket handlers
4. **Implement heartbeat** - Detect dead connections
5. **Handle reconnection** - Restore state gracefully
6. **Emit with room** - Target specific conversations
7. **Add error handlers** - Global and per-namespace
8. **Monitor connections** - Track active sockets and rooms
9. **Test thoroughly** - Unit and load testing
10. **Single worker in production** - With eventlet

---

**Document Version:** 1.0
**Author:** AI Expert (Claude)
