"""
Test fixtures and configuration for MARIE backend tests.
"""

import os
from collections.abc import Generator
from unittest.mock import MagicMock, patch

import pytest
from faker import Faker
from fastapi.testclient import TestClient

# Set test environment variables before importing app
os.environ["TESTING"] = "true"
os.environ["OPENSEARCH_HOST"] = "localhost"
os.environ["OPENSEARCH_PORT"] = "9200"

fake = Faker()


@pytest.fixture(scope="session")
def app():
    """Create FastAPI app for testing."""
    # Lazy import to avoid loading during test collection
    from app import create_app

    return create_app()


@pytest.fixture(scope="function")
def client(app) -> Generator[TestClient, None, None]:
    """Create test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def mock_opensearch():
    """Mock OpenSearch client."""
    with patch("app.db.opensearch_client") as mock:
        mock.index.return_value = {"result": "created"}
        mock.get.return_value = {"_source": {}}
        mock.search.return_value = {"hits": {"hits": []}}
        mock.delete.return_value = {"result": "deleted"}
        mock.info.return_value = {"version": {"number": "2.11.0"}}
        yield mock


@pytest.fixture(scope="function")
def mock_opensearch_service():
    """Mock OpenSearchService."""
    from app.utils.auth import get_password_hash

    with patch("app.services.opensearch_service.OpenSearchService") as MockService:
        service = MockService.return_value
        service.create_user.return_value = {
            "id": "test-user-id",
            "email": "test@example.com",
            "full_name": "Test User",
            "is_active": True,
            "is_admin": False,
            "role": "user",
        }
        service.get_user_by_email.return_value = None
        service.get_user_by_id.return_value = {
            "id": "test-user-id",
            "email": "test@example.com",
            "full_name": "Test User",
            "is_active": True,
            "is_admin": False,
            "role": "user",
            "password_hash": get_password_hash("testpass123"),
        }
        service.verify_password.return_value = True
        service.update_last_login.return_value = True
        yield service


@pytest.fixture
def test_user():
    """Create test user data."""
    return {
        "id": "test-user-id",
        "email": fake.email(),
        "full_name": fake.name(),
        "password": "testpass123",
        "is_active": True,
        "is_admin": False,
        "role": "user",
    }


@pytest.fixture
def test_admin():
    """Create test admin user data."""
    return {
        "id": "test-admin-id",
        "email": "admin@example.com",
        "full_name": "Admin User",
        "password": "adminpass123",
        "is_active": True,
        "is_admin": True,
        "role": "admin",
    }


@pytest.fixture
def auth_headers(test_user):
    """Generate authentication headers."""
    from app.utils.auth import create_access_token

    token = create_access_token(data={"sub": test_user["id"], "role": test_user["role"]})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(test_admin):
    """Generate admin authentication headers."""
    from app.utils.auth import create_access_token

    token = create_access_token(data={"sub": test_admin["id"], "role": test_admin["role"]})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_settings_service():
    """Mock settings service."""
    with patch("app.services.settings_service.settings_service") as mock:
        mock.get_settings.return_value = {
            "white_label": {
                "app_name": "MARIE",
                "registration_enabled": True,
            },
            "llm": {
                "default_provider": "ollama",
                "default_model": "llama2",
            },
        }
        mock.update_settings.return_value = True
        yield mock


@pytest.fixture
def mock_llm_service():
    """Mock LLM service."""
    with patch("app.services.llm_service.llm_service") as mock:
        mock.chat_completion.return_value = {
            "content": "Test response",
            "model": "test-model",
        }
        yield mock


@pytest.fixture
def mock_provider_factory():
    """Mock provider factory."""
    with patch("app.services.provider_factory.provider_factory") as mock:
        provider = MagicMock()
        provider.chat_completion_sync.return_value = MagicMock(content="Test optimized prompt")
        mock.get_provider.return_value = provider
        yield mock


@pytest.fixture(autouse=True)
def reset_mocks():
    """Reset all mocks after each test."""
    yield
    # Cleanup happens automatically with pytest-mock
