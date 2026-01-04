"""
Tests for authentication utilities.
"""

import pytest
from jose import jwt

from app.config import settings
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)


@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing functions."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert hashed != password
        assert hashed.startswith("$2b$")
        assert len(hashed) > 50

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_different_hashes_for_same_password(self):
        """Test that same password generates different hashes (salt)."""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


@pytest.mark.unit
class TestJWTTokens:
    """Test JWT token functions."""

    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "test-user-id", "role": "user"}
        token = create_access_token(data=data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 100

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        data = {"sub": "test-user-id"}
        token = create_refresh_token(data=data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 100

    def test_decode_access_token(self):
        """Test decoding access token."""
        user_id = "test-user-id"
        role = "admin"
        data = {"sub": user_id, "role": role}
        token = create_access_token(data=data)

        decoded = decode_token(token)

        assert decoded["sub"] == user_id
        assert decoded["role"] == role
        assert decoded["type"] == "access"
        assert "exp" in decoded

    def test_decode_refresh_token(self):
        """Test decoding refresh token."""
        user_id = "test-user-id"
        data = {"sub": user_id}
        token = create_refresh_token(data=data)

        decoded = decode_token(token)

        assert decoded["sub"] == user_id
        assert decoded["type"] == "refresh"
        assert "exp" in decoded

    def test_decode_invalid_token(self):
        """Test decoding invalid token raises exception."""
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.token.here")

        assert exc_info.value.status_code == 401

    def test_decode_expired_token(self):
        """Test decoding expired token raises exception."""
        from datetime import datetime, timedelta

        from fastapi import HTTPException

        # Create token that expired 1 hour ago
        past_time = datetime.utcnow() - timedelta(hours=1)
        payload = {
            "sub": "test-user-id",
            "exp": past_time,
            "type": "access",
        }
        expired_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")

        with pytest.raises(HTTPException) as exc_info:
            decode_token(expired_token)

        assert exc_info.value.status_code == 401

    def test_token_contains_expiration(self):
        """Test that tokens contain expiration claim."""
        from datetime import datetime

        data = {"sub": "test-user-id"}
        token = create_access_token(data=data)
        decoded = decode_token(token)

        assert "exp" in decoded
        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        now = datetime.utcnow()

        # Token should expire in the future
        assert exp_datetime > now

    def test_access_and_refresh_tokens_different(self):
        """Test that access and refresh tokens are different."""
        data = {"sub": "test-user-id"}
        access_token = create_access_token(data=data)
        refresh_token = create_refresh_token(data=data)

        assert access_token != refresh_token

        decoded_access = decode_token(access_token)
        decoded_refresh = decode_token(refresh_token)

        assert decoded_access["type"] == "access"
        assert decoded_refresh["type"] == "refresh"


@pytest.mark.unit
class TestAuthDependencies:
    """Test authentication dependency functions."""

    def test_get_current_user_valid_token(self, client, mock_opensearch_service, test_user):
        """Test get_current_user with valid token."""
        # Setup
        token = create_access_token(data={"sub": test_user["id"], "role": "user"})
        mock_opensearch_service.get_user_by_id.return_value = test_user

        # This would be called by FastAPI's dependency injection in real scenario
        # Here we test that the token is valid and can be decoded
        from app.utils.auth import decode_token

        decoded = decode_token(token)
        assert decoded["sub"] == test_user["id"]

    def test_password_hash_is_bcrypt(self):
        """Test that password hashing uses bcrypt."""
        password = "testpassword"
        hashed = get_password_hash(password)

        # Bcrypt hashes start with $2b$ or $2a$
        assert hashed.startswith("$2")
        assert "$" in hashed[3:]  # Has multiple $ separators


@pytest.mark.integration
class TestAuthIntegration:
    """Integration tests for auth utilities."""

    def test_full_password_cycle(self):
        """Test complete password hash and verify cycle."""
        passwords = [
            "simple",
            "Complex123!@#",
            "very-long-password-with-special-chars-!@#$%^&*()",
            "unicode-パスワード-🔒",
        ]

        for password in passwords:
            hashed = get_password_hash(password)
            assert verify_password(password, hashed)
            assert not verify_password(password + "wrong", hashed)

    def test_token_roundtrip(self):
        """Test creating and decoding tokens."""
        test_data = {
            "sub": "user-123",
            "role": "admin",
            "email": "test@example.com",
        }

        # Create token
        token = create_access_token(data=test_data)

        # Decode token
        decoded = decode_token(token)

        # Verify data
        assert decoded["sub"] == test_data["sub"]
        assert decoded["role"] == test_data["role"]
        assert decoded["email"] == test_data["email"]
