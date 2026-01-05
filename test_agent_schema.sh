#!/bin/bash
# Test agent schema discovery

BASE_URL="http://localhost:5000"
EMAIL="test@marie.com"
PASSWORD="test123456"

echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Logged in"
echo ""

# Try to get agent schema
echo "📋 Getting agent schema for 'marie_reasoning_agent'..."
curl -s "$BASE_URL/api/models/agent/marie_reasoning_agent/config/schema" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "Done!"
