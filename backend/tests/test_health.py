"""
Tests for health check endpoints.
"""

import pytest
from fastapi import status


@pytest.mark.unit
class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_liveness_probe(self, client):
        """Test liveness endpoint - should always return 200."""
        response = client.get("/health/live")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "alive"
        assert data["service"] == "marie-backend"

    def test_readiness_probe_healthy(self, client, mock_opensearch):
        """Test readiness endpoint when all dependencies are healthy."""
        # Setup
        mock_opensearch.info.return_value = {
            "version": {"number": "2.11.0"},
            "cluster_name": "marie-cluster",
        }

        # Execute
        response = client.get("/health/ready")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "ready"
        assert data["service"] == "marie-backend"
        assert "checks" in data
        assert data["checks"]["opensearch"]["status"] == "healthy"

    def test_readiness_probe_unhealthy(self, client, mock_opensearch):
        """Test readiness endpoint when OpenSearch is down."""
        # Setup - simulate OpenSearch failure
        mock_opensearch.info.side_effect = Exception("Connection refused")

        # Execute
        response = client.get("/health/ready")

        # Assert
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = response.json()
        assert data["status"] == "not_ready"
        assert data["checks"]["opensearch"]["status"] == "unhealthy"
        assert "error" in data["checks"]["opensearch"]

    def test_startup_probe_initialized(self, client, mock_opensearch):
        """Test startup endpoint when application is initialized."""
        # Setup
        mock_opensearch.info.return_value = {"version": {"number": "2.11.0"}}

        # Execute
        response = client.get("/health/startup")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "started"
        assert data["checks"]["opensearch"]["status"] == "initialized"

    def test_startup_probe_not_initialized(self, client, mock_opensearch):
        """Test startup endpoint when still initializing."""
        # Setup
        mock_opensearch.info.side_effect = Exception("Not ready")

        # Execute
        response = client.get("/health/startup")

        # Assert
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = response.json()
        assert data["status"] == "starting"
        assert data["checks"]["opensearch"]["status"] == "not_initialized"


@pytest.mark.integration
class TestHealthIntegration:
    """Integration tests for health checks."""

    def test_health_endpoints_sequence(self, client, mock_opensearch):
        """Test calling health endpoints in sequence (K8s probe order)."""
        # Setup
        mock_opensearch.info.return_value = {"version": {"number": "2.11.0"}}

        # 1. Startup probe
        startup = client.get("/health/startup")
        assert startup.status_code == status.HTTP_200_OK

        # 2. Liveness probe
        liveness = client.get("/health/live")
        assert liveness.status_code == status.HTTP_200_OK

        # 3. Readiness probe
        readiness = client.get("/health/ready")
        assert readiness.status_code == status.HTTP_200_OK

    def test_health_check_without_auth(self, client):
        """Test that health checks don't require authentication."""
        # No auth headers provided
        liveness = client.get("/health/live")
        assert liveness.status_code == status.HTTP_200_OK

        readiness = client.get("/health/ready")
        assert readiness.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]

        startup = client.get("/health/startup")
        assert startup.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]
