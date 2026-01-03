# GitHub Copilot - MARIE Project Instructions

## 🎯 Critical Rules - READ FIRST

### Language & Communication
- **ALL code MUST be written in English** (variables, functions, classes, comments).
- **ALL documentation MUST be in English** (README, comments, commit messages).
- **NO Spanish in code or technical documentation** - Only user-facing UI text can be multilingual.

### Workflow & Automation
- **Git Operations**: ONLY perform git commits or version control operations if the user EXPLICITLY requests it. Otherwise, the user handles all git commands manually.
- **CRITICAL: NEVER ask for commit confirmation** - Make changes directly to files.
- **CRITICAL: DO NOT suggest commits** - The user will commit when ready.
- **NO commit messages in responses** - Focus on the implementation.
- **Git Commit Workflow** - BEFORE making ANY commit:
  1. **MANDATORY**: Run `pre-commit run --all-files` to check all files
  2. If there are errors, fix them (formatting, linting, etc.)
  3. Add all files including fixes: `git add -A`
  4. Run pre-commit again to verify all checks pass
  5. Only then proceed with `git commit`
- **Use `docker compose`** (with space) - NOT `docker-compose` (hyphenated).
- **ALWAYS pin package versions** in `requirements.txt` (e.g., `package==1.2.3`).
- **CLEAN UP temporary diagnostic files** immediately after use.
- **CRITICAL: Test files policy** - You CAN create temporary test files (e.g., `test_*.py`, `*.test.ts`) for debugging/validation, but MUST delete them immediately after use. Never commit test files to the repository.
- **CRITICAL: ALWAYS verify the current working directory** before executing any terminal command. Use `pwd` or check the tool output to avoid running commands in the wrong folder (e.g., running `npm` in the root instead of `frontend/`).
- **Complete tasks fully** - Implement, test, verify, and report results.

### Visual Verification (MCP Browser)
- **MANDATORY: ALWAYS use MCP snapshots for visual verification** when making UI/layout changes.
- **NEVER claim "fixed" without taking a snapshot** - Visual confirmation is required.
- **Test multiple resolutions** (1920x900, 1366x768, 1280x900) for responsive layouts.
- **Check for content cutoff** - Verify nothing is cut off on edges (left, right, top, bottom).
- **Procedure**: Make changes → Take snapshot → Verify visually → Report actual visual state.

### Playwright MCP UI/UX Verification
- **Use Playwright MCP for UI/UX checks**: drive the page, scroll through all sections, and capture snapshots at each critical viewport.
- **Snapshot discipline**: capture before/after for changed components, include scrolled states (top, mid, bottom) to ensure lazy or offscreen elements render correctly.
- **Component coverage**: verify chat bubbles, sidebars, modals, hover/pressed states, and dynamic lists while scrolling.
- **Report**: attach the snapshot set you inspected and explicitly list which components were validated in each image.
- **Scrollable containers**: if a component lives inside a scrollable area, scroll it fully (top → bottom) and snapshot the states where relevant content appears; do not assume folded content is correct without visual proof.

### Architecture Principles
- **Hexagonal Architecture (Ports & Adapters)**: Mandatory for all new code.
  - **Domain**: Entities and Ports (Protocols) in `backend/app/domain/`. No external dependencies.
  - **Application**: Services and DTOs in `backend/app/application/services/`.
  - **Infrastructure**: Adapters (Ollama, OpenSearch) in `backend/app/infrastructure/adapters/`.
  - **Presentation**: Flask routes and WebSocket handlers in `backend/app/presentation/`.
- **SOLID & DDD**: Apply rigorously. Use ubiquitous language.

---

## 🤖 Tech Stack & Expertise

### Backend (Flask 3 + Python 3.12)
- **Real-time**: `Flask-SocketIO` with `eventlet`.
- **Critical**: `eventlet.monkey_patch()` MUST be the first line in `run.py`.
- **Concurrency**: Keep REST routes synchronous. Use async ONLY for LLM streaming chunks.
- **Search**: OpenSearch 2.11 (k-NN vector search).
- **Auth**: Flask-JWT-Extended (RBAC).

### Frontend (Next.js 16 + React 19)
- **UI Framework**: Ant Design 6 + Ant Design X 2.1 (RICH paradigm).
- **Styling**: Tailwind CSS 4.
- **State**: Zustand for global state, `useRef` for WebSocket-related state to avoid closure staleness.
- **Content**: LaTeX (KaTeX), Markdown, and HTML Artifacts (sanitized with DOMPurify).

---

## 📋 Common Patterns & Solutions

### React Closure Problems with WebSockets
Use `useRef` for state accessed in callbacks:
```typescript
const valueRef = useRef(initialValue);
const handleEvent = useCallback(() => {
  doSomething(valueRef.current);
}, []);
```

### Ant Design 6 Deprecations
- **Collapse**: Use `expandIconPlacement` instead of `expandIconPosition`.
- **Space**: Use `orientation` instead of `direction`.
- **Notification**: Use `title` instead of `message`.

### Naming Conventions
- **Ports**: `*_port.py` (e.g., `llm_port.py`).
- **Adapters**: `*_adapter.py` (e.g., `ollama_adapter.py`).
- **Services**: `*_service.py`.
- **Hooks**: `usePrefix` (e.g., `useChat`).

---

## 🛠️ Developer Workflows

### Commands
- **Start Environment**: `docker compose up -d`
- **Run Tests**: `npx playwright test` (Playwright tests in `tests/`)
- **Backend Dev**: `python run.py` (inside `backend/`)
- **Frontend Dev**: `npm run dev` (inside `frontend/`)

### Integration Points
- **Developer API (v1)**: Routes in `backend/app/routes/v1/`.
- **Swagger Docs**: Available at `http://localhost:5000/api/v1/docs`.
- **Ollama**: Local LLM provider on port `11434`.

---

## 📂 Key Files & Directories
- `backend/run.py`: Entry point, contains `eventlet.monkey_patch()`.
- `backend/app/routes/v1/`: Developer API implementation.
- `frontend/hooks/useChat.ts`: Core chat logic and WebSocket integration.
- `frontend/components/chat/ChatContainer.tsx`: Main chat UI component.
- `tests/`: Playwright E2E tests.

---

## 🎨 Code Style
- **Python**: NumPy-style docstrings (MANDATORY). Strict type hints with Pydantic 2.
- **TypeScript**: Strict types, NO `any`. PascalCase for components, camelCase for variables.
- **Security**: Use environment variables for secrets. Validate all inputs.

---

## 🛠️ Implementation Workflow

1. **Domain**: Define entities and ports in \`domain/\`.
2. **Application**: Create services in \`application/services/\`.
3. **Infrastructure**: Implement adapters in \`infrastructure/adapters/\`.
4. **Presentation**: Add routes/sockets in \`presentation/\`.
5. **Frontend**: Create components, hooks, and update types.
6. **Testing**: Unit tests for domain, integration for adapters, E2E for flows.

**Version**: 2.1.0 (Reduced)
**Last Updated**: December 31, 2025
