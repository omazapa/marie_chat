#!/bin/bash
# Check providers configuration

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

# Get settings including providers
echo "📋 Getting system settings with providers..."
curl -s "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
providers = data.get('providers', [])
print('Found', len(providers), 'providers:')
for p in providers:
    print(f\"  - {p.get('name', 'N/A')} ({p.get('type', 'N/A')}) - URL: {p.get('base_url', 'N/A')}\")
    print(f\"    Enabled: {p.get('enabled', False)}\")
"

echo ""
echo "Done!"
