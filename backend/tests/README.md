# MARIE Backend Test Suite

Comprehensive test suite for the MARIE backend using pytest and FastAPI TestClient.

## 📋 Overview

This test suite provides:
- **Unit Tests**: Test individual functions and methods in isolation
- **Integration Tests**: Test interactions between components
- **Mocked Dependencies**: OpenSearch, LLM services, and external APIs
- **Coverage Reports**: Track code coverage with pytest-cov
- **Markers**: Organize tests by category

## 🚀 Quick Start

### Install Dependencies

```bash
pip install -r requirements-test.txt
```

### Run All Tests

```bash
./run_tests.sh
```

### Run with Coverage

```bash
./run_tests.sh --cov
```

## 📊 Test Organization

### Test Files

- `conftest.py` - Shared fixtures and configuration
- `test_auth.py` - Authentication endpoints (register, login, JWT)
- `test_health.py` - Health check endpoints (liveness, readiness, startup)
- `test_auth_utils.py` - Authentication utilities (password hashing, JWT tokens)

### Test Markers

Tests are organized with markers for selective execution:

```bash
# Run only unit tests
./run_tests.sh --unit

# Run only integration tests
./run_tests.sh --integration

# Run only auth tests
./run_tests.sh --auth

# Run specific marker
./run_tests.sh -m "unit and auth"
```

## 🔧 Available Fixtures

### Client Fixtures

- `app` - FastAPI application instance
- `client` - TestClient for making HTTP requests

### Mock Fixtures

- `mock_opensearch` - Mocked OpenSearch client
- `mock_opensearch_service` - Mocked OpenSearchService
- `mock_settings_service` - Mocked settings service
- `mock_llm_service` - Mocked LLM service
- `mock_provider_factory` - Mocked provider factory

### Data Fixtures

- `test_user` - Test user data with fake information
- `test_admin` - Test admin user data
- `auth_headers` - HTTP headers with valid JWT token
- `admin_headers` - HTTP headers with admin JWT token

## 📝 Writing Tests

### Basic Test Structure

```python
import pytest
from fastapi import status

@pytest.mark.unit
class TestMyFeature:
    def test_something(self, client, mock_opensearch_service):
        """Test description."""
        # Arrange
        mock_opensearch_service.method.return_value = expected_value

        # Act
        response = client.post("/api/endpoint", json={"data": "value"})

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["field"] == expected_value
```

### Using Authentication

```python
def test_protected_endpoint(self, client, auth_headers):
    """Test endpoint that requires authentication."""
    response = client.get("/api/protected", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
```

### Testing Error Cases

```python
def test_error_case(self, client):
    """Test error handling."""
    response = client.post("/api/endpoint", json={"invalid": "data"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "error" in response.json()
```

## 🎯 Test Coverage

### Current Coverage

Run tests with coverage to see detailed reports:

```bash
./run_tests.sh --cov
```

View HTML report:
```bash
xdg-open htmlcov/index.html  # Linux
open htmlcov/index.html       # macOS
```

### Coverage Goals

- **Overall**: > 80%
- **Critical paths** (auth, security): > 95%
- **Utilities**: > 90%
- **Routes**: > 85%

## 🔍 Running Specific Tests

### By File

```bash
pytest tests/test_auth.py
```

### By Class

```bash
pytest tests/test_auth.py::TestAuthRoutes
```

### By Function

```bash
pytest tests/test_auth.py::TestAuthRoutes::test_login_success
```

### By Keyword

```bash
pytest -k "login"  # Run all tests with "login" in name
```

## 🐛 Debugging Tests

### Verbose Output

```bash
./run_tests.sh -v
```

### Stop on First Failure

```bash
pytest tests/ -x
```

### Run Failed Tests First

```bash
./run_tests.sh --ff
```

### Show Print Statements

```bash
pytest tests/ -s
```

### Drop into debugger on failure

```bash
pytest tests/ --pdb
```

## 🏗️ CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt -r requirements-test.txt
      - run: ./run_tests.sh --cov
      - uses: codecov/codecov-action@v2
```

## 📚 Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive names**: Test names should describe what they test
4. **Mock external dependencies**: Don't hit real databases or APIs
5. **Test edge cases**: Empty inputs, nulls, large data
6. **Use fixtures**: Share common setup between tests
7. **Mark tests appropriately**: Use @pytest.mark for organization

## 🔗 Related Documentation

- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [pytest-cov](https://pytest-cov.readthedocs.io/)

## 🆘 Troubleshooting

### Import Errors

Ensure you're in the backend directory and have installed dependencies:
```bash
cd backend
pip install -r requirements.txt -r requirements-test.txt
```

### Mock Not Working

Check that mocks are defined in `conftest.py` and imported correctly.

### Async Test Issues

Use `@pytest.mark.asyncio` for async tests and ensure pytest-asyncio is installed.

## 📈 Future Improvements

- [ ] Add tests for remaining routes (conversations, models, files, etc.)
- [ ] Add WebSocket tests
- [ ] Add load tests with locust
- [ ] Add mutation testing with mutmut
- [ ] Add property-based testing with hypothesis
- [ ] Add performance benchmarks
