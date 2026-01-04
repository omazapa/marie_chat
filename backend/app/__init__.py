"""
FastAPI application factory and configuration.
Migrated from Flask + Flask-SocketIO to FastAPI + native WebSockets.
"""

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.utils.logger import get_logger, setup_logging

# Setup structured logging
setup_logging(app_name="marie", level="INFO")
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan events"""
    logger.info("Starting MARIE FastAPI application")

    # Initialize providers
    from app.services.provider_factory import initialize_providers

    initialize_providers()

    yield

    logger.info("Shutting down MARIE application")


def create_app() -> FastAPI:
    """FastAPI application factory"""

    app = FastAPI(
        title="MARIE API",
        description="Machine-Assisted Research Intelligent Environment",
        version="2.0.0",
        docs_url="/api/v1/docs" if not settings.PRODUCTION else None,
        redoc_url="/api/v1/redoc" if not settings.PRODUCTION else None,
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request tracking middleware
    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        """Add request ID and timing to all requests"""
        request_id = str(uuid.uuid4())
        start_time = datetime.utcnow()

        # Set request ID in state
        request.state.request_id = request_id
        request.state.start_time = start_time

        response: Response = await call_next(request)

        # Add request ID header
        response.headers["X-Request-ID"] = request_id

        # Log request completion (skip health checks)
        if not request.url.path.startswith("/health"):
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            logger.info(
                "Request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 2),
                },
            )

        return response

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handle unexpected exceptions"""
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(
            f"Unhandled exception: {exc}",
            extra={"request_id": request_id},
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "request_id": request_id},
        )

    # Import and register routers
    from app.routes.admin import router as admin_router
    from app.routes.api_keys import router as api_keys_router
    from app.routes.auth import router as auth_router
    from app.routes.conversations import router as conversations_router
    from app.routes.files import router as files_router
    from app.routes.health import router as health_router
    from app.routes.images import router as images_router
    from app.routes.models import router as models_router
    from app.routes.prompts import router as prompts_router
    from app.routes.settings import router as settings_router
    from app.routes.speech import router as speech_router

    # V1 API routes
    from app.routes.v1.chat import router as v1_chat_router
    from app.routes.v1.conversations import router as v1_conversations_router
    from app.routes.v1.docs import router as v1_docs_router
    from app.routes.v1.search import router as v1_search_router
    from app.routes.v1.settings import router as v1_settings_router

    # WebSocket routes
    from app.sockets.chat_events import router as chat_ws_router

    # Health checks (no prefix - top level)
    app.include_router(health_router, tags=["health"])

    # Main API routes
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    app.include_router(conversations_router, prefix="/api/conversations", tags=["conversations"])
    app.include_router(models_router, prefix="/api/models", tags=["models"])
    app.include_router(files_router, prefix="/api/files", tags=["files"])
    app.include_router(speech_router, prefix="/api/speech", tags=["speech"])
    app.include_router(images_router, prefix="/api/images", tags=["images"])
    app.include_router(api_keys_router, prefix="/api/api-keys", tags=["api-keys"])
    app.include_router(prompts_router, prefix="/api/prompts", tags=["prompts"])
    app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
    app.include_router(settings_router, prefix="/api/settings", tags=["settings"])

    # V1 API routes
    app.include_router(v1_chat_router, prefix="/api/v1/chat", tags=["v1-chat"])
    app.include_router(
        v1_conversations_router, prefix="/api/v1/conversations", tags=["v1-conversations"]
    )
    app.include_router(v1_search_router, prefix="/api/v1/search", tags=["v1-search"])
    app.include_router(v1_settings_router, prefix="/api/v1/settings", tags=["v1-settings"])
    app.include_router(v1_docs_router, prefix="/api/v1/docs", tags=["v1-docs"])

    # WebSocket routes
    app.include_router(chat_ws_router, tags=["websocket"])

    return app


# Create app instance
app = create_app()
