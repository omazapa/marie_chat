# User Settings System - Technical Specification

## Overview
Complete user settings system allowing users to manage their profile, agent preferences, interface configuration, and privacy settings.

---

## 1. Profile Settings (Perfil Personal)

### Features
- ✅ Change full name
- ✅ Change email address
- ✅ Change password (with current password verification)
- 🎨 Avatar/profile picture (future enhancement)

### Backend Endpoints

#### GET /api/user/profile
```json
Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "created_at": "2026-01-05T10:00:00Z",
  "last_login_at": "2026-01-05T14:30:00Z"
}
```

#### PUT /api/user/profile
```json
Request:
{
  "full_name": "John Smith",
  "email": "john.smith@example.com"
}

Response 200:
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

#### PUT /api/user/password
```json
Request:
{
  "current_password": "oldpassword123",
  "new_password": "newpassword456",
  "confirm_password": "newpassword456"
}

Response 200:
{
  "message": "Password changed successfully"
}

Error 400:
{
  "error": "Current password is incorrect"
}
```

---

## 2. Agent/LLM Preferences (Preferencias del Agente)

### Features
- 🤖 Default LLM model selection
- 🔌 Default provider selection
- 📝 Custom system prompt
- 🎛️ Model parameters:
  - Temperature (0.0 - 2.0)
  - Max tokens (1 - 4096)
  - Top P (0.0 - 1.0)
  - Frequency penalty (0.0 - 2.0)
  - Presence penalty (0.0 - 2.0)
- 🎯 Response mode (concise, detailed, academic, casual)

### Data Model (OpenSearch: `marie_user_preferences`)
```json
{
  "user_id": "uuid",
  "agent_preferences": {
    "default_provider": "openai",
    "default_provider_id": "provider-uuid",
    "default_model": "gpt-4",
    "system_prompt": "You are a helpful assistant...",
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 2048,
      "top_p": 1.0,
      "frequency_penalty": 0.0,
      "presence_penalty": 0.0
    },
    "response_mode": "detailed"
  },
  "updated_at": "2026-01-05T15:00:00Z"
}
```

### Backend Endpoints

#### GET /api/user/preferences
```json
Response 200:
{
  "agent_preferences": { /* agent config */ },
  "interface_preferences": { /* UI config */ },
  "privacy_preferences": { /* privacy config */ }
}
```

#### PUT /api/user/preferences/agent
```json
Request:
{
  "default_provider": "openai",
  "default_provider_id": "uuid",
  "default_model": "gpt-4",
  "system_prompt": "Custom prompt...",
  "parameters": {
    "temperature": 0.8,
    "max_tokens": 1500
  },
  "response_mode": "concise"
}

Response 200:
{
  "message": "Agent preferences updated successfully",
  "preferences": { /* updated preferences */ }
}
```

---

## 3. Interface Preferences (Preferencias de Interfaz)

### Features
- 🌓 Theme (light/dark/auto)
- 🌍 Preferred language (en, es)
- 🎙️ Default TTS voice
- 🗣️ STT language configuration
- ⌨️ Keyboard shortcuts (future)
- 📊 Message display density (compact, comfortable, spacious)

### Data Model
```json
{
  "user_id": "uuid",
  "interface_preferences": {
    "theme": "dark",
    "language": "en",
    "tts_voice": "en-US-EmmaNeural",
    "stt_language": "en-US",
    "message_density": "comfortable",
    "show_timestamps": true,
    "enable_markdown": true,
    "enable_code_highlighting": true
  }
}
```

### Backend Endpoints

#### PUT /api/user/preferences/interface
```json
Request:
{
  "theme": "dark",
  "language": "es",
  "tts_voice": "es-CO-SalomeNeural",
  "message_density": "compact"
}

Response 200:
{
  "message": "Interface preferences updated",
  "preferences": { /* updated preferences */ }
}
```

---

## 4. Privacy & Security (Privacidad y Seguridad)

### Features
- 🔒 View active sessions
- 🚪 Close specific sessions
- 📊 Conversation retention settings
- 🗑️ Delete all conversations
- 📥 Export conversation history (future)

### Backend Endpoints

#### GET /api/user/sessions
```json
Response 200:
{
  "sessions": [
    {
      "session_id": "uuid",
      "device": "Chrome on Linux",
      "ip_address": "192.168.1.100",
      "last_active": "2026-01-05T15:30:00Z",
      "is_current": true
    }
  ]
}
```

#### DELETE /api/user/sessions/{session_id}
```json
Response 200:
{
  "message": "Session closed successfully"
}
```

#### DELETE /api/user/conversations
```json
Response 200:
{
  "message": "All conversations deleted",
  "deleted_count": 25
}
```

#### PUT /api/user/preferences/privacy
```json
Request:
{
  "conversation_retention_days": 30,
  "auto_delete_enabled": false,
  "share_usage_data": false
}

Response 200:
{
  "message": "Privacy preferences updated"
}
```

---

## Frontend Structure

```
frontend/app/settings/
├── layout.tsx                     # Settings layout with sidebar navigation
├── page.tsx                       # Redirect to profile (default)
├── profile/
│   └── page.tsx                   # Profile settings page
├── agent/
│   └── page.tsx                   # Agent preferences page
├── interface/
│   └── page.tsx                   # Interface preferences page
└── privacy/
    └── page.tsx                   # Privacy & security page

frontend/components/settings/
├── ProfileForm.tsx                # Profile edit form
├── PasswordForm.tsx               # Password change form
├── AgentPreferencesForm.tsx       # Agent configuration form
├── ModelParametersSlider.tsx      # Sliders for temperature, tokens, etc.
├── InterfacePreferencesForm.tsx   # Theme, language, etc.
├── PrivacyPreferencesForm.tsx     # Privacy settings
├── SessionsList.tsx               # Active sessions list
└── DangerZone.tsx                 # Delete all conversations
```

---

## Backend Structure

```
backend/app/routes/
└── user_settings.py               # All user settings endpoints

backend/app/services/
└── user_settings_service.py       # User settings business logic

backend/app/models/
└── user_preferences.py            # Pydantic models for preferences
```

---

## Implementation Order

### Phase 1: Backend Foundation
1. ✅ Create `user_settings_service.py`
2. ✅ Create `user_settings.py` routes
3. ✅ Create Pydantic models for validation
4. ✅ Add OpenSearch index for `marie_user_preferences`

### Phase 2: Profile Settings
1. ✅ Implement GET/PUT profile endpoints
2. ✅ Implement password change endpoint
3. ✅ Create frontend Profile page
4. ✅ Create ProfileForm and PasswordForm components

### Phase 3: Agent Preferences
1. ✅ Implement agent preferences endpoints
2. ✅ Create frontend Agent page
3. ✅ Create AgentPreferencesForm component
4. ✅ Add model/provider selection dropdowns
5. ✅ Add parameter sliders

### Phase 4: Interface Preferences
1. ✅ Implement interface preferences endpoints
2. ✅ Create frontend Interface page
3. ✅ Create InterfacePreferencesForm component
4. ✅ Integrate theme switcher

### Phase 5: Privacy & Security
1. ✅ Implement sessions management
2. ✅ Implement conversation deletion
3. ✅ Create frontend Privacy page
4. ✅ Create SessionsList and DangerZone components

---

## Security Considerations

1. **Authentication**: All endpoints require `@jwt_required()`
2. **Authorization**: Users can only access/modify their own settings
3. **Password Change**: Requires current password verification
4. **Email Change**: Should send verification email (future enhancement)
5. **Session Management**: JWT tokens should be invalidated on session close
6. **Data Validation**: All inputs validated with Pydantic models
7. **Rate Limiting**: Implement rate limiting on sensitive operations

---

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/password` | Change password |
| GET | `/api/user/preferences` | Get all preferences |
| PUT | `/api/user/preferences/agent` | Update agent preferences |
| PUT | `/api/user/preferences/interface` | Update interface preferences |
| PUT | `/api/user/preferences/privacy` | Update privacy preferences |
| GET | `/api/user/sessions` | List active sessions |
| DELETE | `/api/user/sessions/{id}` | Close specific session |
| DELETE | `/api/user/conversations` | Delete all conversations |

---

## Testing Checklist

### Backend Tests
- [ ] Profile update validation
- [ ] Password change with wrong current password
- [ ] Email uniqueness validation
- [ ] Preferences CRUD operations
- [ ] Session management
- [ ] Conversation deletion

### Frontend Tests
- [ ] Profile form submission
- [ ] Password validation (match, strength)
- [ ] Agent preferences persistence
- [ ] Theme switching
- [ ] Session list display
- [ ] Delete conversations confirmation

---

## Future Enhancements

1. 🎨 Avatar/profile picture upload
2. 📧 Email verification on change
3. 📥 Export conversation history
4. 🔐 Two-factor authentication (2FA)
5. ⌨️ Custom keyboard shortcuts
6. 🌐 Multi-language support expansion
7. 📊 Usage statistics dashboard
8. 🔔 Notification preferences
9. 🎤 Custom voice training
10. 🤝 Sharing settings across devices

---

**Version**: 1.0.0  
**Last Updated**: January 5, 2026  
**Status**: Ready for Implementation
