#!/bin/bash
# Script para actualizar la URL del agente a la IP correcta

BASE_URL="http://localhost:5000"
EMAIL="test@marie.com"
PASSWORD="test123456"
HOST_IP="192.168.1.10"
AGENT_PORT="9099"

echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Check credentials."
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Obtener configuración actual
echo "📥 Getting current settings..."
SETTINGS=$(curl -s "$BASE_URL/api/settings" -H "Authorization: Bearer $TOKEN")

# Buscar providers de tipo agent y actualizar su base_url
echo "🔄 Updating agent providers to use http://$HOST_IP:$AGENT_PORT/"
UPDATED_SETTINGS=$(echo "$SETTINGS" | python3 - <<EOF
import sys, json
settings = json.loads('''$SETTINGS''')
for provider in settings.get('providers', []):
    if provider.get('type') == 'agent':
        old_url = provider.get('config', {}).get('base_url', '')
        new_url = "http://$HOST_IP:$AGENT_PORT/"
        provider['config']['base_url'] = new_url
        print(f"  ✓ Updated {provider['name']}: {old_url} → {new_url}", file=sys.stderr)
print(json.dumps(settings))
EOF
)

# Guardar configuración actualizada
echo ""
echo "💾 Saving updated configuration..."
curl -s -X PUT "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATED_SETTINGS" > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Configuration updated successfully!"
  echo ""
  echo "🔄 Restarting backend to apply changes..."
  docker compose restart backend > /dev/null 2>&1
  echo "✅ Backend restarted"
  echo ""
  echo "🎉 Done! Try testing the connection again."
else
  echo "❌ Failed to update configuration"
  exit 1
fi
