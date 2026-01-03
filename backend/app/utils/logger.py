"""
Structured Logging for MARIE Backend

Provides JSON-formatted logs with contextual information for better debugging
and monitoring in production environments.

Usage:
    from app.utils.logger import get_logger, log_with_context

    logger = get_logger(__name__)

    # Basic logging
    logger.info("User logged in", extra={"user_id": user_id})

    # With context decorator
    @log_with_context(user_id=user_id, conversation_id=conv_id)
    def process_message():
        logger.info("Processing message")  # Automatically includes context
"""

import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime
from functools import wraps

from flask import has_request_context, request

# Context variables for request-scoped data
request_context: ContextVar[dict] = ContextVar("request_context", default=None)  # type: ignore[arg-type]


class JSONFormatter(logging.Formatter):
    """
    Custom formatter that outputs logs in JSON format with structured data
    """

    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as JSON

        Args:
            record: Log record to format

        Returns:
            JSON string with log data
        """
        # Base log object
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request context if available
        if has_request_context():
            log_obj["request"] = {
                "method": request.method,
                "path": request.path,
                "remote_addr": request.remote_addr,
                "user_agent": request.headers.get("User-Agent", ""),
            }

            # Add request ID if available
            if hasattr(request, "id"):
                log_obj["request_id"] = request.id

        # Add context variables
        ctx = request_context.get()
        if ctx:
            log_obj["context"] = ctx

        # Add extra fields from record
        if hasattr(record, "user_id"):
            log_obj["user_id"] = record.user_id
        if hasattr(record, "conversation_id"):
            log_obj["conversation_id"] = record.conversation_id
        if hasattr(record, "message_id"):
            log_obj["message_id"] = record.message_id
        if hasattr(record, "duration_ms"):
            log_obj["duration_ms"] = record.duration_ms
        if hasattr(record, "provider"):
            log_obj["provider"] = record.provider
        if hasattr(record, "model"):
            log_obj["model"] = record.model
        if hasattr(record, "tokens"):
            log_obj["tokens"] = record.tokens
        if hasattr(record, "error"):
            log_obj["error"] = record.error
        if hasattr(record, "status_code"):
            log_obj["status_code"] = record.status_code

        # Add exception info if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        # Add stack info if present
        if record.stack_info:
            log_obj["stack_info"] = self.formatStack(record.stack_info)

        return json.dumps(log_obj)


def setup_logging(app_name: str = "marie", level: str = "INFO") -> logging.Logger:
    """
    Configure logging for the application

    Args:
        app_name: Name of the application
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    root_logger.addHandler(handler)

    # Create app logger
    logger = logging.getLogger(app_name)
    logger.setLevel(getattr(logging, level.upper()))

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance

    Args:
        name: Logger name (typically __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def set_context(**kwargs):
    """
    Set context variables for current request

    Usage:
        set_context(user_id="user123", conversation_id="conv456")
    """
    ctx = request_context.get()
    ctx.update(kwargs)
    request_context.set(ctx)


def clear_context():
    """Clear context variables"""
    request_context.set({})


def log_with_context(**context_kwargs):
    """
    Decorator to automatically add context to logs within a function

    Usage:
        @log_with_context(user_id=user_id, conversation_id=conv_id)
        def process_message():
            logger.info("Processing")  # Includes context automatically
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            set_context(**context_kwargs)
            try:
                return func(*args, **kwargs)
            finally:
                clear_context()

        return wrapper

    return decorator


class LogTimer:
    """
    Context manager for timing operations

    Usage:
        with LogTimer(logger, "database_query", user_id=user_id):
            result = db.query()
    """

    def __init__(self, logger: logging.Logger, operation: str, level: int = logging.INFO, **extra):
        self.logger = logger
        self.operation = operation
        self.level = level
        self.extra = extra
        self.start_time = None

    def __enter__(self):
        self.start_time = datetime.utcnow()  # type: ignore[assignment]
        self.logger.log(self.level, f"Starting {self.operation}", extra=self.extra)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (datetime.utcnow() - self.start_time).total_seconds() * 1000  # type: ignore[operator]

        if exc_type:
            self.logger.error(
                f"Failed {self.operation}",
                extra={**self.extra, "duration_ms": duration_ms, "error": str(exc_val)},
            )
        else:
            self.logger.log(
                self.level,
                f"Completed {self.operation}",
                extra={**self.extra, "duration_ms": duration_ms},
            )


# Example usage functions
def log_http_request(response, logger: logging.Logger):
    """
    Log HTTP request/response

    Usage in Flask:
        @app.after_request
        def after_request(response):
            log_http_request(response, logger)
            return response
    """
    if has_request_context():
        logger.info(
            "HTTP request",
            extra={
                "status_code": response.status_code,
                "duration_ms": getattr(request, "duration_ms", None),
            },
        )


def log_websocket_event(event_name: str, data: dict, logger: logging.Logger):
    """
    Log WebSocket event

    Args:
        event_name: Name of the event (e.g., 'send_message')
        data: Event data
        logger: Logger instance
    """
    logger.info(
        f"WebSocket event: {event_name}",
        extra={
            "event": event_name,
            "conversation_id": data.get("conversation_id"),
            "user_id": data.get("user_id"),
        },
    )


def log_llm_request(provider: str, model: str, prompt_tokens: int, logger: logging.Logger):
    """
    Log LLM request

    Args:
        provider: LLM provider (ollama, openai, etc.)
        model: Model name
        prompt_tokens: Number of tokens in prompt
        logger: Logger instance
    """
    logger.info(
        "LLM request started", extra={"provider": provider, "model": model, "tokens": prompt_tokens}
    )


def log_llm_response(
    provider: str, model: str, completion_tokens: int, duration_ms: float, logger: logging.Logger
):
    """
    Log LLM response

    Args:
        provider: LLM provider
        model: Model name
        completion_tokens: Number of tokens in completion
        duration_ms: Response time in milliseconds
        logger: Logger instance
    """
    logger.info(
        "LLM response completed",
        extra={
            "provider": provider,
            "model": model,
            "tokens": completion_tokens,
            "duration_ms": duration_ms,
        },
    )
