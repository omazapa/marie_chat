# MARIE Tech Stack - Complete Reference

> **Comprehensive documentation for all technologies used in MARIE**
> **Last Updated:** January 3, 2026

---

## 📚 Documentation Structure

This directory contains in-depth technical documentation for each core technology in the MARIE stack. Each document provides:

- **Core concepts** and architecture
- **Best practices** and patterns
- **Code examples** specific to MARIE
- **Performance optimization** techniques
- **Common pitfalls** and solutions

---

## 🗂️ Available Documents

### 1. [Next.js 16 + React 19](./01_NEXTJS_REACT.md)
**Frontend Framework & UI Library**

**Topics Covered:**
- React 19 new features (Compiler, Actions, useOptimistic, use())
- Next.js 16 App Router architecture
- Server Components vs Client Components
- Data fetching patterns
- Caching strategies
- Performance optimization
- Code splitting & lazy loading
- Image and font optimization

**Key for MARIE:**
- Server Components for initial data loading
- Client Components for WebSocket integration
- Streaming with Suspense for progressive rendering
- Smart caching for conversations and messages

**Read this when:**
- Building new pages or components
- Optimizing frontend performance
- Implementing data fetching
- Working with forms and actions

---

### 2. [Flask-SocketIO + Eventlet](./02_FLASK_SOCKETIO.md)
**Real-time Communication Backend**

**Topics Covered:**
- Flask-SocketIO architecture
- Eventlet green threads and async I/O
- Event handling patterns
- Room management and broadcasting
- Connection lifecycle
- Streaming implementations
- Error handling
- Performance tuning
- Production deployment

**Key for MARIE:**
- LLM response streaming
- Real-time message delivery
- Conversation room isolation
- Reconnection handling
- Backpressure management

**Read this when:**
- Working with WebSocket communication
- Implementing streaming responses
- Debugging connection issues
- Scaling real-time features
- Deploying to production

---

### 3. [OpenSearch 2.11](./03_OPENSEARCH.md)
**Search & Analytics Engine**

**Topics Covered:**
- OpenSearch architecture
- Index design and mappings
- Vector search (k-NN) with HNSW
- Hybrid search (text + vector)
- Query DSL and optimization
- Aggregations and analytics
- Performance tuning
- Monitoring and maintenance

**Key for MARIE:**
- Semantic search for conversations
- Message history retrieval
- Vector embeddings with sentence-transformers
- Hybrid search for best results
- Conversation analytics

**Read this when:**
- Implementing search features
- Working with embeddings
- Optimizing query performance
- Designing new indices
- Troubleshooting search issues

---

### 4. [Ant Design X 2.1](./04_ANT_DESIGN_X.md)
**AI-Native UI Components**

**Topics Covered:**
- RICH design paradigm (Role, Intention, Conversation, Hybrid UI)
- Conversations component
- Bubble component variants
- Prompts and suggestions
- Attachments handling
- Streaming UI patterns
- Theming and customization
- Accessibility best practices

**Key for MARIE:**
- Chat interface components
- Message rendering with rich content
- Context-aware suggestions
- File upload and preview
- Smooth streaming updates
- Consistent branding

**Read this when:**
- Building chat UI components
- Implementing message displays
- Adding interactive features
- Customizing appearance
- Improving UX

---

## 🎯 Quick Reference by Task

### **Building a New Feature**

1. **Frontend**: Start with [Next.js + React](./01_NEXTJS_REACT.md#common-patterns)
2. **Backend API**: See [Flask-SocketIO](./02_FLASK_SOCKETIO.md#event-handling) if real-time, else REST
3. **Search/Data**: Check [OpenSearch](./03_OPENSEARCH.md#index-management)
4. **UI Components**: Use [Ant Design X](./04_ANT_DESIGN_X.md#core-components)

### **Performance Optimization**

1. **Frontend**: [Next.js Performance](./01_NEXTJS_REACT.md#performance-optimization)
2. **Backend**: [Flask-SocketIO Scalability](./02_FLASK_SOCKETIO.md#performance--scalability)
3. **Database**: [OpenSearch Tuning](./03_OPENSEARCH.md#performance-tuning)
4. **UI**: [Ant Design X Optimization](./04_ANT_DESIGN_X.md#best-practices-for-marie)

### **Implementing Search**

1. Read: [OpenSearch Vector Search](./03_OPENSEARCH.md#vector-search-k-nn)
2. Then: [Hybrid Search Patterns](./03_OPENSEARCH.md#hybrid-search)
3. Frontend: [Search UI with Ant Design X](./04_ANT_DESIGN_X.md#prompts--suggestions)

### **Real-time Features**

1. Backend: [WebSocket Streaming](./02_FLASK_SOCKETIO.md#streaming-patterns)
2. Frontend: [Client WebSocket Handling](./01_NEXTJS_REACT.md#client-components)
3. UI: [Streaming Updates](./04_ANT_DESIGN_X.md#streaming--real-time-updates)

### **Debugging Issues**

| Issue Type | Check Document |
|------------|----------------|
| Frontend rendering | [Next.js](./01_NEXTJS_REACT.md#common-patterns) |
| WebSocket disconnects | [Flask-SocketIO](./02_FLASK_SOCKETIO.md#connection-management) |
| Search not returning results | [OpenSearch](./03_OPENSEARCH.md#query-optimization) |
| UI not updating | [Ant Design X](./04_ANT_DESIGN_X.md#streaming--real-time-updates) |
| Slow performance | All docs have "Performance" sections |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MARIE ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────── FRONTEND ────────────────┐
│  Next.js 16 + React 19                   │
│  ├── Server Components (data fetching)   │
│  ├── Client Components (interactivity)   │
│  └── Ant Design X (UI components)        │
│                                           │
│  Rendering:                               │
│  • SSR for SEO                            │
│  • Streaming with Suspense                │
│  • Client hydration                       │
└────────────────┬──────────────────────────┘
                 │ HTTP + WebSocket
                 ▼
┌──────────────── BACKEND ─────────────────┐
│  Flask 3 + Python 3.12                   │
│  ├── REST API (synchronous)              │
│  ├── Flask-SocketIO (real-time)          │
│  └── Eventlet (async I/O)                │
│                                           │
│  Features:                                │
│  • JWT authentication                     │
│  • LLM streaming                          │
│  • File processing                        │
└────────────────┬──────────────────────────┘
                 │ opensearch-py
                 ▼
┌──────────────── DATA ────────────────────┐
│  OpenSearch 2.11                         │
│  ├── Full-text search                    │
│  ├── Vector search (k-NN)                │
│  └── Hybrid search                        │
│                                           │
│  Indices:                                 │
│  • marie_users                            │
│  • marie_conversations                    │
│  • marie_messages (with vectors)          │
└───────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### For New Developers

1. **Read these docs in order:**
   - [Next.js + React](./01_NEXTJS_REACT.md) - Understand frontend structure
   - [Ant Design X](./04_ANT_DESIGN_X.md) - Learn UI components
   - [Flask-SocketIO](./02_FLASK_SOCKETIO.md) - Backend real-time
   - [OpenSearch](./03_OPENSEARCH.md) - Data layer

2. **Then explore the codebase:**
   - `frontend/` - Next.js application
   - `backend/` - Flask application
   - `docs/` - Additional documentation

3. **Try these tasks:**
   - Add a new page in Next.js
   - Create a WebSocket event handler
   - Implement a search feature
   - Customize a UI component

### For Experienced Developers

Jump directly to relevant sections:
- Architecture patterns: Each doc has "Architecture" section
- Performance: Look for "Performance" sections
- Best practices: "Best Practices for MARIE" sections
- Common issues: Check "Common Patterns" and troubleshooting

---

## 📊 Version Compatibility Matrix

| Technology | Version | Required | Tested With |
|------------|---------|----------|-------------|
| **Frontend** |
| Next.js | 16.1.x | ✅ Yes | 16.1.1 |
| React | 19.2.x | ✅ Yes | 19.2.3 |
| Ant Design | 6.x | ✅ Yes | 6.1.3 |
| Ant Design X | 2.1.x | ✅ Yes | 2.1.2 |
| TypeScript | 5.x | ✅ Yes | 5.9.3 |
| **Backend** |
| Python | 3.12+ | ✅ Yes | 3.12.0 |
| Flask | 3.x | ✅ Yes | 3.0.0 |
| Flask-SocketIO | 5.x | ✅ Yes | 5.3.6 |
| Eventlet | 0.35+ | ✅ Yes | 0.35.2 |
| **Data** |
| OpenSearch | 2.11.x | ✅ Yes | 2.11.1 |
| opensearch-py | 2.x | ✅ Yes | 2.4.2 |
| **AI/ML** |
| sentence-transformers | Latest | ⚠️ Optional | 2.2.2 |
| faster-whisper | Latest | ⚠️ Optional | 1.0.1 |

---

## 🔄 Update Schedule

These documents are updated:
- **Major versions**: When new major versions are released
- **Best practices**: As patterns evolve in MARIE
- **Bug fixes**: When issues are discovered and resolved
- **Community feedback**: Based on developer questions

**Last major update**: January 3, 2026
**Next review**: March 2026

---

## 💡 Contributing

Found an issue or have suggestions?

1. Check if it's already documented
2. Test your solution in MARIE
3. Submit a PR with updates
4. Include code examples
5. Update version information

---

## 📞 Support

- **GitHub Issues**: Technical problems
- **Discussions**: Questions and ideas
- **Documentation**: These guides
- **Code Comments**: Inline explanations

---

## 🎓 Additional Resources

### Official Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Flask-SocketIO Docs](https://flask-socketio.readthedocs.io/)
- [OpenSearch Docs](https://opensearch.org/docs/)
- [Ant Design X Docs](https://x.ant.design/)

### MARIE-Specific
- [Project README](../../README.md)
- [Specifications](../SPECIFICATIONS.md)
- [Project Status](../PROJECT_STATUS.md)
- [Improvement Plan](../IMPROVEMENT_PLAN.md)

### Learning Resources
- [Next.js Learn](https://nextjs.org/learn)
- [React Foundations](https://react.dev/learn)
- [WebSocket Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [OpenSearch Workshop](https://github.com/opensearch-project/workshop)

---

**Last Updated**: January 3, 2026
**Maintainer**: MARIE Development Team
