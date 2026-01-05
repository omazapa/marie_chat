#!/bin/bash
# Test Open WebUI valves endpoint

BASE_URL="http://localhost:9099"  # Change to your Open WebUI URL
MODEL="marie_reasoning_agent"

echo "🔍 Testing Open WebUI valves endpoint..."
echo "URL: $BASE_URL/pipelines/$MODEL/valves"
echo ""

curl -v "$BASE_URL/pipelines/$MODEL/valves" 2>&1 | grep -E "< HTTP|valves|error" | head -20

echo ""
echo ""
echo "🔍 Trying with /api prefix..."
echo "URL: $BASE_URL/api/pipelines/$MODEL/valves"
echo ""

curl -v "$BASE_URL/api/pipelines/$MODEL/valves" 2>&1 | grep -E "< HTTP|valves|error" | head -20

echo ""
echo "Done!"
