"""
Logging Middleware for Flask

Automatically logs all HTTP requests and responses with timing information.
"""

import time
import uuid
from functools import wraps

from flask import Flask, g, request
from flask_jwt_extended import get_jwt_identity

from app.utils.logger import clear_context, get_logger, set_context

logger = get_logger(__name__)


def setup_logging_middleware(app: Flask):
    """
    Setup logging middleware for Flask app

    Args:
        app: Flask application instance
    """

    @app.before_request
    def before_request():
        """Execute before each request"""
        # Skip WebSocket and Socket.IO connections completely
        if (
            request.path.startswith("/socket.io")
            or request.environ.get("HTTP_UPGRADE") == "websocket"
        ):
            return None

        # Generate unique request ID
        request.id = str(uuid.uuid4())  # type: ignore[attr-defined]
        g.start_time = time.time()

        # Try to get user_id from JWT
        try:
            user_id = get_jwt_identity()
            if user_id:
                set_context(user_id=user_id, request_id=request.id)  # type: ignore[attr-defined]
        except Exception:
            # No JWT or invalid JWT
            set_context(request_id=request.id)  # type: ignore[attr-defined]

        # Log request (skip health checks and static files to reduce noise)
        if not request.path.startswith(("/health", "/static")):
            logger.info(
                f"Request started: {request.method} {request.path}",
                extra={
                    "request_id": request.id,  # type: ignore[attr-defined]
                    "method": request.method,
                    "path": request.path,
                    "remote_addr": request.remote_addr,
                },
            )

    @app.after_request
    def after_request(response):
        """Execute after each request"""
        # Skip WebSocket and Socket.IO connections completely
        if (
            request.path.startswith("/socket.io")
            or request.environ.get("HTTP_UPGRADE") == "websocket"
        ):
            return response

        # Calculate request duration
        if hasattr(g, "start_time"):
            duration_ms = (time.time() - g.start_time) * 1000
            request.duration_ms = duration_ms  # type: ignore[attr-defined]

            # Log response (skip health checks and static files)
            if not request.path.startswith(("/health", "/static")):
                level = "info" if response.status_code < 400 else "warning"
                log_func = getattr(logger, level)

                log_func(
                    f"Request completed: {request.method} {request.path}",
                    extra={
                        "request_id": getattr(request, "id", None),
                        "method": request.method,
                        "path": request.path,
                        "status_code": response.status_code,
                        "duration_ms": round(duration_ms, 2),
                    },
                )

        # Clear context
        clear_context()

        return response

    @app.teardown_request
    def teardown_request(exception=None):
        """Execute at the end of request, even if exception occurred"""
        # Skip WebSocket and Socket.IO connections completely
        if request.path.startswith("/socket.io"):
            return

        if exception:
            logger.error(
                f"Request failed with exception: {str(exception)}",
                extra={
                    "request_id": getattr(request, "id", None),
                    "method": request.method,
                    "path": request.path,
                    "error": str(exception),
                },
                exc_info=True,
            )
        clear_context()

    # Register error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        logger.warning(
            f"404 Not Found: {request.path}",
            extra={
                "request_id": getattr(request, "id", None),
                "method": request.method,
                "path": request.path,
                "status_code": 404,
            },
        )
        return {"error": "Resource not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(
            f"500 Internal Server Error: {str(error)}",
            extra={
                "request_id": getattr(request, "id", None),
                "method": request.method,
                "path": request.path,
                "status_code": 500,
                "error": str(error),
            },
            exc_info=True,
        )
        return {"error": "Internal server error"}, 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        """Handle uncaught exceptions"""
        logger.error(
            f"Unhandled exception: {str(error)}",
            extra={
                "request_id": getattr(request, "id", None),
                "method": request.method if hasattr(request, "method") else None,
                "path": request.path if hasattr(request, "path") else None,
                "error": str(error),
            },
            exc_info=True,
        )
        return {"error": "An unexpected error occurred"}, 500


def log_operation(operation_name: str):
    """
    Decorator to log function execution

    Usage:
        @log_operation("create_user")
        def create_user(email):
            ...
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            logger.info(f"Starting operation: {operation_name}")

            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                logger.info(
                    f"Operation completed: {operation_name}",
                    extra={"operation": operation_name, "duration_ms": round(duration_ms, 2)},
                )
                return result
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                logger.error(
                    f"Operation failed: {operation_name}",
                    extra={
                        "operation": operation_name,
                        "duration_ms": round(duration_ms, 2),
                        "error": str(e),
                    },
                    exc_info=True,
                )
                raise

        return wrapper

    return decorator
