#!/bin/bash
# Ver configuración actual de un agente

BASE_URL="http://localhost:5000"
EMAIL="test@marie.com"
PASSWORD="test123456"
PROVIDER="agent"
MODEL_ID="marie_reasoning_agent"  # Cambia si es necesario

TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "🔍 Current configuration for $MODEL_ID:"
echo ""
curl -s "$BASE_URL/api/models/$PROVIDER/$MODEL_ID/config/values" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "📝 Note: This is the GLOBAL configuration that applies to all conversations"
