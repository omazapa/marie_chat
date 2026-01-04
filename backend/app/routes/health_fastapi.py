"""
Health Check Endpoints for MARIE Backend - FastAPI Version

Provides:
- /health/live - Liveness probe (is the app running?)
- /health/ready - Readiness probe (can it handle requests?)
- /health/startup - Startup probe (has initialization completed?)

Usage in Kubernetes:
  livenessProbe:
    httpGet:
      path: /health/live
      port: 5000
  readinessProbe:
    httpGet:
      path: /health/ready
      port: 5000
  startupProbe:
    httpGet:
      path: /health/startup
      port: 5000
"""

import logging
from typing import Any

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.db import opensearch_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health")


@router.get("/live")
async def liveness() -> dict[str, Any]:
    """
    Liveness probe - indicates if the application is alive

    Returns:
        200: Application is running
        500: Application is dead (should be restarted)

    This should be a very lightweight check that only fails
    if the application process is completely broken.
    """
    return {"status": "alive", "service": "marie-backend"}


@router.get("/ready")
async def readiness():
    """
    Readiness probe - indicates if the application can handle requests

    Checks:
    - OpenSearch connection
    - (Future: Redis, Ollama, etc.)

    Returns:
        200: Application is ready to serve traffic
        503: Application is not ready (don't send traffic)

    This checks if all dependencies are available.
    """
    checks = {}
    all_healthy = True

    # Check OpenSearch
    try:
        health = opensearch_client.info()  # Use info() instead of cluster.health()
        checks["opensearch"] = {
            "status": "healthy",
            "version": health.get("version", {}).get("number", "unknown"),
        }
    except Exception as e:
        logger.error(f"OpenSearch health check failed: {e}")
        checks["opensearch"] = {"status": "unhealthy", "error": str(e)}
        all_healthy = False

    # Overall status
    response = {
        "status": "ready" if all_healthy else "not_ready",
        "service": "marie-backend",
        "checks": checks,
    }

    if all_healthy:
        return JSONResponse(content=response, status_code=status.HTTP_200_OK)
    else:
        return JSONResponse(content=response, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


@router.get("/startup")
async def startup():
    """
    Startup probe - indicates if the application has finished starting up

    This is used by Kubernetes to know when the app is initialized
    and ready for liveness/readiness checks.

    Returns:
        200: Application has started successfully
        503: Application is still starting up
    """
    checks = {}
    all_healthy = True

    # Check OpenSearch initialization
    try:
        opensearch_client.info()
        checks["opensearch"] = {"status": "initialized"}
    except Exception as e:
        logger.error(f"OpenSearch startup check failed: {e}")
        checks["opensearch"] = {"status": "not_initialized", "error": str(e)}
        all_healthy = False

    response = {
        "status": "started" if all_healthy else "starting",
        "service": "marie-backend",
        "checks": checks,
    }

    if all_healthy:
        return JSONResponse(content=response, status_code=status.HTTP_200_OK)
    else:
        return JSONResponse(content=response, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
