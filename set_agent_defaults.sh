#!/bin/bash
# Script para configurar parámetros por defecto de un agente

BASE_URL="http://localhost:5000"
EMAIL="test@marie.com"
PASSWORD="test123456"

# Configuración del agente
PROVIDER="agent"
MODEL_ID="marie_reasoning_agent"  # Cambia esto por tu modelo

# Parámetros por defecto que quieres configurar
DEFAULT_PARAMS='{
  "temperature": 0.9,
  "model": "gpt-4",
  "max_iterations": 5,
  "tools": ["search", "calculator"]
}'

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
echo "💾 Setting default parameters for $MODEL_ID..."
echo "Parameters:"
echo "$DEFAULT_PARAMS" | python3 -m json.tool

# Guardar configuración global
curl -s -X POST "$BASE_URL/api/models/$PROVIDER/$MODEL_ID/config/values?scope=global" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"config_values\": $DEFAULT_PARAMS}" | python3 -m json.tool

echo ""
echo "✅ Default configuration saved!"
echo ""
echo "📝 This configuration will be automatically applied to ALL conversations using $MODEL_ID"
echo ""
echo "To verify, run:"
echo "  curl -s '$BASE_URL/api/models/$PROVIDER/$MODEL_ID/config/values' \\"
echo "    -H 'Authorization: Bearer $TOKEN' | python3 -m json.tool"
