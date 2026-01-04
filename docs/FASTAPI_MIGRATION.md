# FastAPI Migration Plan for MARIE Backend

## Status: IN PROGRESS
**Started:** January 3, 2026
**Estimated Time:** 4-6 hours
**Complexity:** HIGH

## Migration Overview

### From:
- Flask 3.1.2
- Flask-SocketIO 5.6.0
- Flask-JWT-Extended 4.7.1
- Flask-CORS 6.0.2
- eventlet 0.40.4

### To:
- FastAPI 0.115.5
- Uvicorn[standard] 0.34.0
- python-jose 3.3.0
- Native WebSockets
- Native async/await

## Benefits
1. **Modern async/await** - No more eventlet monkey patching
2. **Better performance** - Native async, less overhead
3. **Auto documentation** - OpenAPI/Swagger built-in
4. **Type safety** - Full Pydantic validation
5. **WebSocket native** - No external dependencies
6. **Easier testing** - Better test client
7. **Active development** - FastAPI is modern and maintained

## Migration Steps

### Phase 1: Core Infrastructure ✅
- [x] Update requirements.txt
- [x] Create FastAPI app factory
- [x] Create JWT auth utilities (python-jose)
- [x] Create health check router (example)
- [x] Update run.py for uvicorn

### Phase 2: REST API Routes (20 files) 🔄
Convert Flask Blueprints to FastAPI Routers:

#### Main API Routes
- [ ] `routes/auth.py` - Login, register, token refresh
- [ ] `routes/conversations.py` - CRUD conversations
- [ ] `routes/models.py` - List models, providers
- [ ] `routes/files.py` - File uploads, management
- [ ] `routes/speech.py` - TTS, STT endpoints
- [ ] `routes/images.py` - Image generation
- [ ] `routes/api_keys.py` - API key management
- [ ] `routes/prompts.py` - Prompt templates
- [ ] `routes/admin.py` - Admin operations
- [ ] `routes/settings.py` - System settings

#### V1 API Routes (Developer API)
- [ ] `routes/v1/chat.py` - Chat completions
- [ ] `routes/v1/conversations.py` - Conversations CRUD
- [ ] `routes/v1/search.py` - Vector search
- [ ] `routes/v1/settings.py` - Settings API
- [ ] `routes/v1/docs.py` - API documentation

### Phase 3: WebSocket Handlers (1 file) ⏳
- [ ] `sockets/chat_events.py` - Convert to FastAPI WebSocket endpoint
  - handle_connect → WebSocket endpoint
  - handle_disconnect → WebSocket close
  - handle_message → WebSocket receive
  - Streaming → async generators

### Phase 4: Update Dependencies 🔄
- [ ] Remove Flask decorators from utils
- [ ] Update `utils/auth.py` → use FastAPI dependencies
- [ ] Update error handlers
- [ ] Update middleware

### Phase 5: Testing & Fixes ⏳
- [ ] Run all unit tests
- [ ] Run Playwright tests
- [ ] Fix any broken endpoints
- [ ] Test WebSocket connections
- [ ] Test streaming chat
- [ ] Test file uploads
- [ ] Test authentication flow

### Phase 6: Deployment Updates ⏳
- [ ] Update Dockerfile
- [ ] Update docker-compose.yml
- [ ] Update environment variables
- [ ] Update documentation
- [ ] Update CI/CD if any

## Key Differences to Handle

### 1. Request/Response Objects
```python
# Flask
from flask import request, jsonify
data = request.get_json()
return jsonify({"result": data}), 200

# FastAPI
from fastapi import Request
from pydantic import BaseModel
data = await request.json()  # or use Pydantic model
return {"result": data}  # Auto-serialization
```

### 2. Authentication
```python
# Flask-JWT-Extended
from flask_jwt_extended import jwt_required, get_jwt_identity
@jwt_required()
def protected():
    user_id = get_jwt_identity()

# FastAPI
from app.utils.auth_fastapi import get_current_user
async def protected(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
```

### 3. WebSockets
```python
# Flask-SocketIO
@socketio.on('message')
def handle_message(data):
    emit('response', {'data': 'received'})

# FastAPI
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    data = await websocket.receive_json()
    await websocket.send_json({"data": "received"})
```

### 4. Background Tasks
```python
# Flask (with eventlet)
socketio.start_background_task(my_function, arg1, arg2)

# FastAPI
from fastapi import BackgroundTasks
async def endpoint(background_tasks: BackgroundTasks):
    background_tasks.add_task(my_function, arg1, arg2)
```

### 5. File Uploads
```python
# Flask
from werkzeug.utils import secure_filename
file = request.files['file']
filename = secure_filename(file.filename)

# FastAPI
from fastapi import UploadFile
async def upload(file: UploadFile):
    contents = await file.read()
```

## Migration Strategy

### Incremental Approach (RECOMMENDED)
1. Keep both Flask and FastAPI apps running
2. Migrate routes one by one
3. Test each route individually
4. Once all migrated, remove Flask

### Big Bang Approach (CURRENT)
1. Migrate all at once
2. Test everything together
3. Fix issues in batch
4. Deploy new version

## Rollback Plan
If migration fails:
1. Revert `requirements.txt`
2. Revert `__init__.py` and `run.py`
3. Rebuild Docker container
4. Restart with Flask version

## Testing Checklist
- [ ] All health checks work
- [ ] Login/register works
- [ ] JWT tokens work
- [ ] WebSocket connection works
- [ ] Chat streaming works
- [ ] File upload works
- [ ] Image generation works
- [ ] Speech synthesis works
- [ ] Admin panel works
- [ ] Settings persist
- [ ] All API v1 endpoints work

## Performance Benchmarks
TODO: Compare before/after:
- Request latency
- WebSocket latency
- Streaming performance
- Memory usage
- CPU usage

## Documentation Updates
- [ ] Update README.md
- [ ] Update API documentation
- [ ] Update deployment guide
- [ ] Update development setup

## Next Steps
1. Continue migrating REST routes (auth.py first)
2. Test each route as it's migrated
3. Migrate WebSocket handler
4. Run full test suite
5. Update Docker configuration
6. Deploy and monitor

---

**Note:** This is a major architectural change. Take time to test thoroughly.
All frontend code will continue to work as API contracts are maintained.
