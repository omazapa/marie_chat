# Usuario de Prueba - Marie

## 🔐 Credenciales de Acceso

```
Email:    test@example.com
Password: poioiulkj
Nombre:   Test User
```

## 🌐 Acceso

**URL:** http://localhost:3000/login

## ✅ Estado

- ✅ Usuario creado exitosamente
- ✅ Login funcionando correctamente
- ✅ Redirige a /chat después del login
- ✅ Puede crear conversaciones
- ⏳ WebSocket se conecta al enviar primer mensaje

## 📝 Información del Usuario

```json
{
  "id": "30b0fa56-a9ad-45f8-ab2c-07b2ab1ec129",
  "email": "test@example.com",
  "full_name": "Test User",
  "role": "user",
  "roles": ["user"],
  "is_active": true,
  "permissions": {
    "can_create_users": false,
    "can_manage_models": false,
    "can_manage_system": false,
    "can_view_logs": false
  }
}
```

## 🚀 Cómo Usar

1. Abre http://localhost:3000/login
2. Ingresa las credenciales:
   - Email: `test@example.com`
   - Password: `poioiulkj`
3. Click en "Login"
4. Serás redirigido automáticamente a `/chat`
5. Click en "New Conversation" o "Start New Chat"
6. Comienza a chatear con Marie!

## 🧪 Verificación via API

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "poioiulkj"
  }'

# Crear conversación
curl -X POST http://localhost:5000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Primera Conversación",
    "model": "llama3.2"
  }'
```

## 📊 Capturas de Pantalla

Las capturas de la sesión se guardaron en:
- `test-results/01-login-page.png` - Página de login
- `test-results/02-form-filled.png` - Formulario lleno
- `test-results/03-chat-page.png` - Interfaz de chat
- `test-results/04-new-conversation.png` - Nueva conversación

## ⚙️ Configuración del Usuario

El usuario tiene permisos básicos (role: "user"). Si necesitas permisos de administrador, puedes actualizar en OpenSearch o crear un nuevo usuario admin.

## 🔄 Resetear Contraseña

Para cambiar la contraseña, actualiza el usuario en OpenSearch:

```bash
# Obtener hash de nueva contraseña
python3 -c "import bcrypt; print(bcrypt.hashpw(b'nueva_password', bcrypt.gensalt()).decode())"

# Actualizar en OpenSearch via API
curl -X POST "http://localhost:9200/marie_users/_update/USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "doc": {
      "password_hash": "HASH_AQUI"
    }
  }'
```

## 🎉 Listo para Usar!

El usuario **test@example.com** está completamente funcional y listo para probar todas las funcionalidades de Marie Phase 2:

- ✅ Autenticación
- ✅ Crear conversaciones
- ✅ Enviar mensajes
- ✅ Recibir respuestas con streaming
- ✅ Gestionar conversaciones (renombrar, eliminar)
- ✅ WebSocket en tiempo real

---

**Fecha de creación:** 21 de Diciembre, 2025
**ID de Usuario:** 30b0fa56-a9ad-45f8-ab2c-07b2ab1ec129
