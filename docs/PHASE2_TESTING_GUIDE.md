# Phase 2 Testing Guide

## Quick Start

### 1. Complete Backend Build (if not finished)

Wait for the backend build to complete, then:

```bash
cd /home/ozapatam/Projects/Colav/marie_chat

# Check if build completed
docker compose images

# Restart services with new backend
docker compose down
docker compose up -d

# Watch logs
docker compose logs -f backend frontend
```

### 2. Initialize Database Indices

```bash
# Create OpenSearch indices for conversations and messages
docker compose exec backend python -c "from app.services.opensearch_init import init_opensearch_indices; init_opensearch_indices()"
```

### 3. Verify Services

```bash
# Check all services are running
docker compose ps

# Expected output: All services UP
# - frontend (port 3000)
# - backend (port 5000)
# - opensearch (port 9200)
# - ollama (port 11434)
```

### 4. Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Check Ollama connectivity
curl http://localhost:5000/api/models
```

### 5. Test Frontend

Open browser: http://localhost:3000

- Register new user
- Should auto-login and redirect to /chat
- Verify WebSocket connection (green dot)
- Click "Start New Chat"
- Send a test message
- Watch for streaming response

## Run Playwright Tests

### All Phase 2 Tests

```bash
# Run all chat tests
npx playwright test tests/phase2-chat.spec.js

# Run with UI mode (recommended)
npx playwright test tests/phase2-chat.spec.js --ui

# Run with headed browser
npx playwright test tests/phase2-chat.spec.js --headed
```

### Run All Tests

```bash
# Run complete test suite
npx playwright test

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

## Troubleshooting

### Backend Build Issues

If build is stuck or fails:

```bash
# Kill the build process
docker compose down

# Try building without cache again
docker compose build --no-cache backend

# If still issues, build with progress output
BUILDKIT_PROGRESS=plain docker compose build backend 2>&1 | tee build.log
```

### WebSocket Connection Issues

```bash
# Check backend logs for websocket events
docker compose logs -f backend | grep -i "socket\|websocket"

# Restart backend if needed
docker compose restart backend
```

### OpenSearch Issues

```bash
# Check OpenSearch health
curl http://localhost:9200/_cluster/health?pretty

# Recreate indices if needed
docker compose exec backend python -m app.services.opensearch_init
```

### Ollama Not Responding

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Pull a model if needed
docker compose exec ollama ollama pull llama3.2

# List available models
docker compose exec ollama ollama list
```

## Expected Test Results

### Phase 2 Tests (tests/phase2-chat.spec.js)

- ✅ should display chat interface when authenticated
- ✅ should create a new conversation via API
- ✅ should list conversations
- ✅ should update conversation title
- ✅ should create conversation from UI
- ✅ should check WebSocket connection
- ✅ should display welcome screen when no conversation selected
- ✅ should send message and receive streaming response
- ✅ should display message history
- ✅ should handle conversation deletion
- ✅ should check Ollama integration
- ✅ should handle unauthorized access

**Expected: 12/12 tests passing** ✅

## Manual Testing Checklist

### Authentication Flow
- [ ] Register new user
- [ ] Auto-login after registration
- [ ] Access chat page when authenticated
- [ ] Redirect to login when not authenticated

### Chat Interface
- [ ] Welcome screen displays
- [ ] "Start New Chat" button works
- [ ] Connection status shows "Connected" (green)
- [ ] Sidebar shows conversation list
- [ ] Can create new conversations

### Messaging
- [ ] Can type in chat input
- [ ] Send button works
- [ ] Message appears immediately
- [ ] Assistant response streams in real-time
- [ ] Complete message saved to history

### Conversation Management
- [ ] Can rename conversations (right-click menu)
- [ ] Can delete conversations (right-click menu)
- [ ] Conversation list updates correctly
- [ ] Selecting conversation loads messages

### WebSocket
- [ ] Connection indicator shows status
- [ ] Reconnects after backend restart
- [ ] Streaming works smoothly
- [ ] No console errors

## Performance Testing

### Load Test Messages

```bash
# Create conversation and send multiple messages
curl -X POST http://localhost:5000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Load Test","model":"llama3.2"}'

# Check response time
time curl http://localhost:5000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitor Resources

```bash
# Watch container resource usage
docker stats

# Check logs for errors
docker compose logs -f | grep -i "error\|warning"
```

## Next Steps

Once all tests pass:

1. **Phase 3**: Implement markdown rendering, code highlighting
2. **Phase 4**: Add voice features (STT/TTS)
3. **Phase 5**: Implement file uploads and processing
4. **Phase 6**: Multi-model support and provider abstraction

## Getting Help

If tests fail or features don't work:

1. Check logs: `docker compose logs -f backend`
2. Verify services: `docker compose ps`
3. Test API directly: `curl http://localhost:5000/health`
4. Check OpenSearch: `curl http://localhost:9200/_cat/indices`
5. Review error messages in browser console

## Success Indicators

✅ All 12 Phase 2 tests pass
✅ Can send messages and see streaming responses
✅ Conversations persist in OpenSearch
✅ WebSocket connection stable
✅ No errors in backend/frontend logs
✅ UI responsive and functional

**Ready to move to Phase 3!** 🚀
