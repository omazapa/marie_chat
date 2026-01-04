"""
Structured Logging for MARIE Backend

Provides JSON-formatted logs with contextual information for better debugging
and monitoring in production environments.

Features:
- JSON structured logging
- Automatic log rotation
- Request context tracking
- Performance timing
- Multiple output handlers (console + file)
- Environment-based configuration

Usage:
    from app.utils.logger import get_logger, log_with_context, LogTimer

    logger = get_logger(__name__)

    # Basic logging
    logger.info("User logged in", extra={"user_id": user_id})

    # With context decorator
    @log_with_context(user_id=user_id, conversation_id=conv_id)
    def process_message():
        logger.info("Processing message")  # Automatically includes context

    # With timing
    with LogTimer(logger, "database_query", user_id=user_id):
        result = db.query()
"""

import json
import logging
import os
import sys
from contextvars import ContextVar
from datetime import datetime
from functools import wraps
from logging.handlers import RotatingFileHandler
from pathlib import Path

from flask import has_request_context, request

# Context variables for request-scoped data
request_context: ContextVar[dict | None] = ContextVar("request_context", default=None)


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
            try:
                log_obj["request"] = {
                    "method": request.method,
                    "path": request.path,
                    "remote_addr": request.remote_addr,
                    "user_agent": request.headers.get("User-Agent", "")[:200],  # Truncate
                }

                # Add request ID if available
                if hasattr(request, "id"):
                    log_obj["request_id"] = request.id
            except RuntimeError:
                # Outside request context
                pass

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
            log_obj["duration_ms"] = round(record.duration_ms, 2)
        if hasattr(record, "provider"):
            log_obj["provider"] = record.provider
        if hasattr(record, "model"):
            log_obj["model"] = record.model
        if hasattr(record, "tokens"):
            log_obj["tokens"] = record.tokens
        if hasattr(record, "error"):
            log_obj["error"] = str(record.error)
        if hasattr(record, "status_code"):
            log_obj["status_code"] = record.status_code

        # Add exception info if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        # Add stack info if present
        if record.stack_info:
            log_obj["stack_info"] = self.formatStack(record.stack_info)

        return json.dumps(log_obj)

        return json.dumps(log_obj)


def setup_logging(
    app_name: str = "marie",
    level: str = "INFO",
    log_dir: str = "logs",
    max_bytes: int = 10485760,  # 10MB
    backup_count: int = 5,
    console_output: bool = True,
    file_output: bool = True,
) -> logging.Logger:
    """
    Configure logging for the application

    Args:
        app_name: Name of the application
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        max_bytes: Maximum size of each log file before rotation
        backup_count: Number of backup files to keep
        console_output: Enable console output
        file_output: Enable file output

    Returns:
        Configured logger instance
    """
    # Get log level from environment or parameter
    log_level = os.getenv("LOG_LEVEL", level).upper()
    level_value = getattr(logging, log_level, logging.INFO)

    # Create formatter
    json_formatter = JSONFormatter()

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level_value)
    root_logger.handlers.clear()  # Remove existing handlers

    # Console handler
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(json_formatter)
        console_handler.setLevel(level_value)
        root_logger.addHandler(console_handler)

    # File handler with rotation
    if file_output:
        # Create log directory if it doesn't exist
        log_path = Path(log_dir)
        log_path.mkdir(parents=True, exist_ok=True)

        # Main application log file
        app_log_file = log_path / f"{app_name}.log"
        file_handler = RotatingFileHandler(
            app_log_file, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8"
        )
        file_handler.setFormatter(json_formatter)
        file_handler.setLevel(level_value)
        root_logger.addHandler(file_handler)

        # Separate error log file
        error_log_file = log_path / f"{app_name}_error.log"
        error_handler = RotatingFileHandler(
            error_log_file, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8"
        )
        error_handler.setFormatter(json_formatter)
        error_handler.setLevel(logging.ERROR)
        root_logger.addHandler(error_handler)

    # Silence noisy libraries
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Create app logger
    logger = logging.getLogger(app_name)
    logger.setLevel(level_value)

    logger.info(
        "Logging initialized",
        extra={
            "log_level": log_level,
            "console_output": console_output,
            "file_output": file_output,
            "log_dir": str(log_path) if file_output else None,
        },
    )

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
    if ctx is None:
        ctx = {}
    ctx.update(kwargs)
    request_context.set(ctx)


def clear_context():
    """Clear context variables"""
    request_context.set(None)


def get_context() -> dict:
    """Get current context variables"""
    ctx = request_context.get()
    return ctx if ctx is not None else {}


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
