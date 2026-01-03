"""
Health Check Endpoints for MARIE Backend

Provides:
- /health/live - Liveness probe (is the app running?)
- /health/ready - Readiness probe (can it handle requests?)

Usage in Kubernetes:
  livenessProbe:
    httpGet:
      path: /health/live
      port: 5000
  readinessProbe:
    httpGet:
      path: /health/ready
      port: 5000
"""

import logging

from flask import Blueprint, jsonify

from app.db import opensearch_client

logger = logging.getLogger(__name__)

health_bp = Blueprint("health", __name__, url_prefix="/health")


@health_bp.route("/live", methods=["GET"])
def liveness():
    """
    Liveness probe - indicates if the application is alive

    Returns:
        200: Application is running
        500: Application is dead (should be restarted)

    This should be a very lightweight check that only fails
    if the application process is completely broken.
    """
    return jsonify({"status": "alive", "service": "marie-backend"}), 200


@health_bp.route("/ready", methods=["GET"])
def readiness():
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
        health = opensearch_client.cluster.health()
        opensearch_healthy = health["status"] in ["green", "yellow"]
        checks["opensearch"] = {
            "status": "healthy" if opensearch_healthy else "unhealthy",
            "cluster_status": health["status"],
            "nodes": health["number_of_nodes"],
        }

        if not opensearch_healthy:
            all_healthy = False

    except Exception as e:
        logger.error(f"OpenSearch health check failed: {e}")
        checks["opensearch"] = {"status": "unhealthy", "error": str(e)}
        all_healthy = False

    # TODO: Add more health checks
    # - Redis cache
    # - Ollama service
    # - File storage

    status_code = 200 if all_healthy else 503
    response_status = "ready" if all_healthy else "not ready"

    return jsonify({"status": response_status, "checks": checks}), status_code


@health_bp.route("/startup", methods=["GET"])
def startup():
    """
    Startup probe - used during application initialization

    Returns:
        200: Application has completed startup
        503: Application is still starting up

    Useful for slow-starting applications.
    """
    # For now, same as readiness
    # In the future, could check if indices are created, etc.
    return readiness()
