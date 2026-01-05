#!/bin/bash
# Script para añadir un nuevo agente a Marie

# Configuración
BASE_URL="http://localhost:5000"
EMAIL="test@marie.com"
PASSWORD="test123456"

# 1. Login y obtener token
echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Token obtained"

# 2. Añadir nuevo agente
echo ""
echo "➕ Adding new agent provider..."

curl -X POST "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providers": [{
      "name": "Mi Agente Custom",
      "type": "agent",
      "enabled": true,
      "config": {
        "base_url": "http://localhost:9099/",
        "api_key": "0p3n-w3bu!"
      }
    }]
  }' | python3 -m json.tool

echo ""
echo "✅ Agent added! Now you can:"
echo "   1. Select it from the model picker"
echo "   2. Click ⚙️ to configure parameters"
echo "   3. Start chatting!"
