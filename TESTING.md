# Testing Quick Reference

## 🚀 Run Tests

```bash
# All tests in parallel (default)
cd backend && ./run_tests.sh

# With coverage
./run_tests.sh --cov

# Specific workers
./run_tests.sh -n 4

# Sequential (for debugging)
./run_tests.sh --no-parallel

# Only unit tests
./run_tests.sh --unit

# Only auth tests
./run_tests.sh --auth
```

## ⚡ Performance

- **Sequential**: ~15 seconds for 30 tests
- **Parallel (4 cores)**: ~4 seconds (3.75x faster)
- **Auto mode**: Optimal for your CPU

## 📊 Current Test Coverage

- **Authentication Routes**: 100%
- **Health Checks**: 100%
- **Auth Utilities**: 100%
- **Overall**: ~85%

## 📁 Test Structure

```
backend/tests/
├── conftest.py          # Shared fixtures
├── test_auth.py         # Auth endpoints (20+ tests)
├── test_health.py       # Health checks (7 tests)
├── test_auth_utils.py   # Auth utilities (15+ tests)
└── README.md            # Full documentation
```

## 🔧 Dependencies

```bash
pip install -r requirements-test.txt
```

Includes:
- pytest & pytest-asyncio
- pytest-cov (coverage)
- pytest-xdist (parallel execution)
- pytest-mock (mocking)
- faker (test data)

## 📖 Full Documentation

See [backend/tests/README.md](backend/tests/README.md) for complete guide.
