"""
Tests for authentication routes.
"""

import pytest
from fastapi import status

from app.utils.auth import get_password_hash


@pytest.mark.unit
@pytest.mark.auth
class TestAuthRoutes:
    """Test authentication endpoints."""

    def test_register_success(
        self, client, mock_opensearch_service, mock_settings_service, test_user
    ):
        """Test successful user registration."""
        # Setup
        mock_opensearch_service.get_user_by_email.return_value = None
        mock_opensearch_service.create_user.return_value = {
            "id": "new-user-id",
            "email": test_user["email"],
            "full_name": test_user["full_name"],
            "is_active": True,
            "is_admin": False,
            "role": "user",
        }

        # Execute
        response = client.post(
            "/api/auth/register",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
                "full_name": test_user["full_name"],
            },
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_user["email"]
        assert "password" not in data["user"]

    def test_register_disabled(self, client, mock_settings_service):
        """Test registration when disabled."""
        # Setup - disable registration
        mock_settings_service.get_settings.return_value = {
            "white_label": {"registration_enabled": False}
        }

        # Execute
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "testpass123",
                "full_name": "Test User",
            },
        )

        # Assert
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "disabled" in response.json()["detail"].lower()

    def test_register_duplicate_email(self, client, mock_opensearch_service, test_user):
        """Test registration with existing email."""
        # Setup
        mock_opensearch_service.get_user_by_email.return_value = {
            "id": "existing-user",
            "email": test_user["email"],
        }

        # Execute
        response = client.post(
            "/api/auth/register",
            json={
                "email": test_user["email"],
                "password": "newpass123",
                "full_name": "New User",
            },
        )

        # Assert
        assert response.status_code == status.HTTP_409_CONFLICT
        assert "exists" in response.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        """Test registration with invalid email."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "invalid-email",
                "password": "testpass123",
                "full_name": "Test User",
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_success(self, client, mock_opensearch_service, test_user):
        """Test successful login."""
        # Setup
        mock_opensearch_service.get_user_by_email.return_value = {
            "id": test_user["id"],
            "email": test_user["email"],
            "full_name": test_user["full_name"],
            "password_hash": get_password_hash(test_user["password"]),
            "is_active": True,
            "is_admin": False,
            "role": "user",
        }
        mock_opensearch_service.verify_password.return_value = True

        # Execute
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_user["email"]
        assert "password_hash" not in data["user"]

    def test_login_invalid_credentials(self, client, mock_opensearch_service):
        """Test login with invalid credentials."""
        # Setup
        mock_opensearch_service.get_user_by_email.return_value = None

        # Execute
        response = client.post(
            "/api/auth/login",
            json={
                "email": "wrong@example.com",
                "password": "wrongpass",
            },
        )

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_wrong_password(self, client, mock_opensearch_service, test_user):
        """Test login with wrong password."""
        # Setup
        mock_opensearch_service.get_user_by_email.return_value = {
            "id": test_user["id"],
            "email": test_user["email"],
            "password_hash": get_password_hash(test_user["password"]),
            "is_active": True,
        }
        mock_opensearch_service.verify_password.return_value = False

        # Execute
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user["email"],
                "password": "wrongpassword",
            },
        )

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self, client, mock_opensearch_service, test_user):
        """Test login with inactive user."""
        # Setup
        mock_opensearch_service.get_user_by_email.return_value = {
            "id": test_user["id"],
            "email": test_user["email"],
            "password_hash": get_password_hash(test_user["password"]),
            "is_active": False,
        }

        # Execute
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
            },
        )

        # Assert
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_current_user(self, client, mock_opensearch_service, auth_headers, test_user):
        """Test getting current user info."""
        # Setup
        mock_opensearch_service.get_user_by_id.return_value = {
            "id": test_user["id"],
            "email": test_user["email"],
            "full_name": test_user["full_name"],
            "is_active": True,
            "is_admin": False,
            "role": "user",
        }

        # Execute
        response = client.get("/api/auth/me", headers=auth_headers)

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user["email"]
        assert "password_hash" not in data

    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without authentication."""
        response = client.get("/api/auth/me")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token."""
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid-token"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout(self, client, auth_headers):
        """Test logout endpoint."""
        response = client.post("/api/auth/logout", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()

    def test_refresh_token_success(self, client, test_user):
        """Test token refresh."""
        # Create a refresh token
        from app.utils.auth import create_refresh_token

        refresh_token = create_refresh_token(data={"sub": test_user["id"]})

        # Execute
        response = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data

    def test_refresh_token_invalid(self, client):
        """Test refresh with invalid token."""
        response = client.post("/api/auth/refresh", json={"refresh_token": "invalid-token"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.integration
@pytest.mark.auth
class TestAuthIntegration:
    """Integration tests for authentication flow."""

    def test_full_auth_flow(
        self, client, mock_opensearch_service, mock_settings_service, test_user
    ):
        """Test complete registration -> login -> access protected route flow."""
        # 1. Register
        mock_opensearch_service.get_user_by_email.return_value = None
        mock_opensearch_service.create_user.return_value = {
            "id": "new-user-id",
            "email": test_user["email"],
            "full_name": test_user["full_name"],
            "is_active": True,
            "is_admin": False,
            "role": "user",
        }

        register_response = client.post(
            "/api/auth/register",
            json={
                "email": test_user["email"],
                "password": test_user["password"],
                "full_name": test_user["full_name"],
            },
        )
        assert register_response.status_code == status.HTTP_201_CREATED
        access_token = register_response.json()["access_token"]

        # 2. Access protected route
        mock_opensearch_service.get_user_by_id.return_value = {
            "id": "new-user-id",
            "email": test_user["email"],
            "full_name": test_user["full_name"],
            "is_active": True,
            "is_admin": False,
            "role": "user",
        }

        me_response = client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )
        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.json()["email"] == test_user["email"]
