#!/usr/bin/env python3
"""
Marie Backend Server - FastAPI with Uvicorn
Migrated from Flask + Flask-SocketIO + eventlet to FastAPI + native WebSockets
"""

import os

import uvicorn

from app.services.opensearch_init import init_opensearch_indices


def init_app():
    """Initialize application"""
    print("🚀 Initializing Marie Backend (FastAPI)...")

    # Initialize OpenSearch indices
    try:
        init_opensearch_indices()
        print("✅ OpenSearch indices initialized")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize OpenSearch indices: {e}")
        print("   Make sure OpenSearch is running and accessible")

    print("✅ Initialization complete")


if __name__ == "__main__":
    init_app()

    # Run with Uvicorn
    port = int(os.getenv("PORT", 5000))

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Hot reload for development
        log_level="info",
        access_log=True,
        ws_ping_interval=20,  # WebSocket ping interval
        ws_ping_timeout=20,  # WebSocket ping timeout
    )
