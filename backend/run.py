#!/usr/bin/env python3
"""
Marie Backend Server
"""

import eventlet

eventlet.monkey_patch()

import os  # noqa: E402

from app import create_app, socketio  # noqa: E402
from app.services.opensearch_init import init_opensearch_indices  # noqa: E402

# Create Flask app
app = create_app()


def init_app():
    """Initialize application"""
    print("🚀 Initializing Marie Backend...")

    # Initialize OpenSearch indices
    try:
        init_opensearch_indices()
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize OpenSearch indices: {e}")
        print("   Make sure OpenSearch is running and accessible")

    print("✅ Initialization complete")


if __name__ == "__main__":
    init_app()

    # Run with SocketIO
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=True, allow_unsafe_werkzeug=True)
