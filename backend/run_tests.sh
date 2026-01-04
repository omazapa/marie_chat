#!/bin/bash
# Test runner script for MARIE backend

set -e

echo "🧪 MARIE Backend Test Suite"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Change to backend directory
cd "$(dirname "$0")"

# Check if test dependencies are installed
if ! python -c "import pytest" 2>/dev/null; then
    echo -e "${YELLOW}Installing test dependencies...${NC}"
    pip install -r requirements-test.txt
fi

# Parse arguments
COVERAGE=false
MARKERS=""
VERBOSE=""
FAILED_FIRST=false
PARALLEL="-n auto"

while [[ $# -gt 0 ]]; do
    case $1 in
        --cov|--coverage)
            COVERAGE=true
            shift
            ;;
        -m|--markers)
            MARKERS="-m $2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE="-vv"
            shift
            ;;
        --ff|--failed-first)
            FAILED_FIRST=true
            shift
            ;;
        -n|--workers)
            PARALLEL="-n $2"
            shift 2
            ;;
        --no-parallel)
            PARALLEL=""
            shift
            ;;
        --unit)
            MARKERS="-m unit"
            shift
            ;;
        --integration)
            MARKERS="-m integration"
            shift
            ;;
        --auth)
            MARKERS="-m auth"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --cov, --coverage     Generate coverage report"
            echo "  -m, --markers MARK    Run tests with specific marker"
            echo "  -v, --verbose         Verbose output"
            echo "  --ff, --failed-first  Run previously failed tests first"
            echo "  -n, --workers NUM     Number of parallel workers (default: auto)"
            echo "  --no-parallel         Disable parallel execution"
            echo "  --unit                Run only unit tests"
            echo "  --integration         Run only integration tests"
            echo "  --auth                Run only auth tests"
            echo "  -h, --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Run all tests (parallel auto)"
            echo "  $0 --cov              # Run with coverage (parallel)"
            echo "  $0 -n 4               # Run with 4 workers"
            echo "  $0 --no-parallel      # Run sequentially"
            echo "  $0 --unit             # Run unit tests only"
            echo "  $0 -m auth --cov      # Run auth tests with coverage"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build pytest command
PYTEST_CMD="pytest tests/"

if [ "$PARALLEL" != "" ]; then
    PYTEST_CMD="$PYTEST_CMD $PARALLEL"
fi

if [ "$VERBOSE" != "" ]; then
    PYTEST_CMD="$PYTEST_CMD $VERBOSE"
fi

if [ "$MARKERS" != "" ]; then
    PYTEST_CMD="$PYTEST_CMD $MARKERS"
fi

if [ "$FAILED_FIRST" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --ff"
fi

if [ "$COVERAGE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=html --cov-report=term-missing"
fi

# Run tests
echo -e "${GREEN}Running tests...${NC}"
echo "Command: $PYTEST_CMD"
echo ""

if $PYTEST_CMD; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"

    if [ "$COVERAGE" = true ]; then
        echo ""
        echo -e "${GREEN}📊 Coverage report generated: htmlcov/index.html${NC}"
        echo -e "   Open with: xdg-open htmlcov/index.html (Linux)"
        echo -e "   or:        open htmlcov/index.html (macOS)"
    fi

    exit 0
else
    echo ""
    echo -e "${RED}❌ Tests failed!${NC}"
    exit 1
fi
