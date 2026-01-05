# Interface Preferences Integration - Implementation Plan

## 🎯 Objetivo
Integrar completamente las preferencias de interfaz del usuario en toda la aplicación, haciendo que los cambios se apliquen en tiempo real y persistan entre sesiones.

---

## 📋 Estado Actual

### ✅ Ya Implementado:
- Frontend: Página de configuración con formulario (`/settings/interface`)
- Backend: Endpoints para guardar/obtener preferencias (`/api/user/preferences/interface`)
- Hook: `useUserPreferences` para acceder a preferencias
- Storage: Índice OpenSearch `marie_user_preferences`

### ❌ Falta Implementar:
- Aplicar las preferencias en tiempo real en la UI
- Persistir y cargar preferencias al iniciar sesión
- Cambiar tema dinámicamente
- Cambiar idioma de la interfaz
- Aplicar densidad de mensajes
- Usar voces TTS/STT seleccionadas
- Mostrar/ocultar timestamps
- Habilitar/deshabilitar markdown rendering
- Habilitar/deshabilitar code highlighting

---

## 🏗️ Arquitectura de Implementación

```
┌─────────────────────────────────────────────────────────────┐
│                    User Login                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Load User Preferences from Backend                   │
│         GET /api/user/preferences                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Store in Zustand Store (interfaceStore)              │
│         - theme, language, tts_voice, stt_language           │
│         - message_density, show_timestamps, etc.             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Apply Preferences to UI Components                   │
│         - ThemeProvider updates theme                        │
│         - i18n updates language                              │
│         - ChatMessages apply density & timestamps            │
│         - Markdown/Code components check flags               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Fase 1: Crear Store de Interface Preferences

### Archivo: `frontend/stores/interfaceStore.ts`

**Responsabilidades:**
- Almacenar preferencias de interfaz en memoria
- Proveer acciones para actualizar preferencias
- Sincronizar con backend automáticamente
- Aplicar cambios en tiempo real

**Estado:**
```typescript
interface InterfaceStore {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es';
  ttsVoice: string;
  sttLanguage: string;
  messageDensity: 'compact' | 'comfortable' | 'spacious';
  showTimestamps: boolean;
  enableMarkdown: boolean;
  enableCodeHighlighting: boolean;

  // Actions
  loadPreferences: () => Promise<void>;
  updateTheme: (theme: string) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  updateTTSVoice: (voice: string) => Promise<void>;
  updateSTTLanguage: (language: string) => Promise<void>;
  updateMessageDensity: (density: string) => Promise<void>;
  updateShowTimestamps: (show: boolean) => Promise<void>;
  updateEnableMarkdown: (enable: boolean) => Promise<void>;
  updateEnableCodeHighlighting: (enable: boolean) => Promise<void>;
  updateAllPreferences: (prefs: Partial<InterfacePreferences>) => Promise<void>;
}
```

**Features:**
- ✅ Carga automática al iniciar sesión
- ✅ Sincronización automática con backend
- ✅ Persistencia en localStorage como fallback
- ✅ Notificaciones de éxito/error

---

## 🎨 Fase 2: Implementar Sistema de Temas

### 2.1. ThemeProvider Mejorado
**Archivo:** `frontend/components/ThemeProvider.tsx`

**Features:**
- ✅ Soportar light, dark, auto (basado en sistema)
- ✅ Listener para cambios de sistema (auto mode)
- ✅ Transiciones suaves entre temas
- ✅ Aplicar tema desde interfaceStore
- ✅ Sincronizar con Ant Design ConfigProvider

**Implementation:**
```typescript
// Detectar preferencia del sistema
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark' : 'light';

// Aplicar tema efectivo
const effectiveTheme = theme === 'auto' ? systemTheme : theme;

// Listener para cambios del sistema
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (theme === 'auto') {
      // Re-render con nuevo tema del sistema
    }
  };
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}, [theme]);
```

### 2.2. CSS Variables para Temas
**Archivo:** `frontend/app/globals.css`

**Implementation:**
- Definir variables CSS para cada tema
- Aplicar en :root y [data-theme="dark"]
- Variables para colores, espaciados, sombras

---

## 🌍 Fase 3: Sistema de Internacionalización (i18n)

### 3.1. Setup i18n
**Tool:** `next-intl` o `react-i18next`

**Archivos de Idioma:**
```
frontend/locales/
├── en.json
└── es.json
```

**Contenido:**
```json
// en.json
{
  "chat": {
    "newConversation": "New Conversation",
    "sendMessage": "Send message",
    "placeholder": "Type your message..."
  },
  "settings": {
    "profile": "Profile",
    "agent": "Agent Preferences",
    "interface": "Interface",
    "privacy": "Privacy & Security"
  }
}

// es.json
{
  "chat": {
    "newConversation": "Nueva Conversación",
    "sendMessage": "Enviar mensaje",
    "placeholder": "Escribe tu mensaje..."
  },
  "settings": {
    "profile": "Perfil",
    "agent": "Preferencias del Agente",
    "interface": "Interfaz",
    "privacy": "Privacidad y Seguridad"
  }
}
```

### 3.2. Integración en Componentes
- Usar hook `useTranslation()` en componentes
- Reemplazar textos hardcoded con claves de traducción
- Formatear fechas según idioma

**Prioridad de Traducción:**
1. **Alta:** ChatContainer, ChatSidebar, Settings pages
2. **Media:** Admin panel, Modals
3. **Baja:** Tooltips, Placeholder texts

---

## 💬 Fase 4: Message Density (Densidad de Mensajes)

### 4.1. Estilos por Densidad
**Archivo:** `frontend/components/chat/ChatMessage.tsx`

**Configuración:**
```typescript
const densityStyles = {
  compact: {
    padding: '8px',
    fontSize: '13px',
    lineHeight: '1.4',
    gap: '4px',
  },
  comfortable: {
    padding: '12px',
    fontSize: '14px',
    lineHeight: '1.6',
    gap: '8px',
  },
  spacious: {
    padding: '16px',
    fontSize: '15px',
    lineHeight: '1.8',
    gap: '12px',
  },
};
```

### 4.2. Aplicar en Componentes
- ChatMessage: Ajustar padding, fontSize, spacing
- ChatBubble: Ajustar max-width, padding
- Avatar: Ajustar tamaño según densidad

---

## 🕐 Fase 5: Show/Hide Timestamps

### Implementación:
**Archivo:** `frontend/components/chat/ChatMessage.tsx`

```typescript
const { showTimestamps } = useInterfaceStore();

{showTimestamps && (
  <Text type="secondary" style={{ fontSize: '12px' }}>
    {formatTime(message.timestamp)}
  </Text>
)}
```

**Features:**
- ✅ Mostrar/ocultar timestamps en mensajes
- ✅ Formato adaptado al idioma (en-US, es-CO)
- ✅ Tooltip con timestamp completo al hover

---

## 📝 Fase 6: Markdown & Code Highlighting

### 6.1. Markdown Rendering
**Archivo:** `frontend/components/markdown/MarkdownRenderer.tsx`

```typescript
const { enableMarkdown } = useInterfaceStore();

if (!enableMarkdown) {
  return <div>{content}</div>; // Plain text
}

return <ReactMarkdown>{content}</ReactMarkdown>;
```

### 6.2. Code Highlighting
**Archivo:** `frontend/components/markdown/CodeBlock.tsx`

```typescript
const { enableCodeHighlighting } = useInterfaceStore();

if (!enableCodeHighlighting) {
  return <pre><code>{code}</code></pre>; // Sin syntax highlighting
}

return <SyntaxHighlighter>{code}</SyntaxHighlighter>;
```

---

## 🎙️ Fase 7: TTS/STT Voice Configuration

### 7.1. TTS Integration
**Archivo:** `frontend/hooks/useSpeech.ts`

```typescript
const { ttsVoice } = useInterfaceStore();

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices.find(v => v.name === ttsVoice) || null;
  speechSynthesis.speak(utterance);
};
```

### 7.2. STT Integration
**Archivo:** `frontend/hooks/useAudioRecorder.ts`

```typescript
const { sttLanguage } = useInterfaceStore();

const recognition = new SpeechRecognition();
recognition.lang = sttLanguage; // 'en-US' or 'es-LA'
```

---

## 🔄 Fase 8: Auto-load & Sync

### 8.1. Load on Login
**Archivo:** `frontend/stores/authStore.ts`

```typescript
// Después de login exitoso
const login = async (credentials) => {
  const { token, user } = await authAPI.login(credentials);
  // ... set token & user

  // Cargar preferencias automáticamente
  await interfaceStore.getState().loadPreferences();
};
```

### 8.2. Sync on Update
**Archivo:** `frontend/app/settings/interface/page.tsx`

```typescript
const handleSave = async (values) => {
  await interfaceStore.getState().updateAllPreferences(values);
  // Store maneja sincronización con backend
};
```

---

## 🧪 Fase 9: Testing

### 9.1. Unit Tests
- Zustand store actions
- Theme switching logic
- i18n translations

### 9.2. Integration Tests
- Load preferences on login
- Apply theme changes
- Change language updates UI
- Message density affects spacing
- TTS/STT use correct settings

### 9.3. E2E Tests (Playwright)
```typescript
test('user can change theme and it persists', async ({ page }) => {
  await page.goto('/login');
  await login(page);
  await page.goto('/settings/interface');
  await page.selectOption('select[name="theme"]', 'dark');
  await page.click('button[type="submit"]');
  await page.reload();
  // Verify dark theme is still applied
});
```

---

## 📊 Plan de Implementación

### Sprint 1: Foundation (Días 1-2)
- ✅ Crear `interfaceStore.ts` con todas las acciones
- ✅ Integrar carga automática en login
- ✅ Setup ThemeProvider mejorado
- ✅ Aplicar tema en toda la app

### Sprint 2: i18n Setup (Días 3-4)
- ✅ Instalar y configurar next-intl
- ✅ Crear archivos de traducción (en.json, es.json)
- ✅ Traducir componentes principales (Chat, Settings)
- ✅ Integrar cambio de idioma desde store

### Sprint 3: Visual Preferences (Días 5-6)
- ✅ Implementar message density
- ✅ Implementar show/hide timestamps
- ✅ Integrar markdown enable/disable
- ✅ Integrar code highlighting enable/disable

### Sprint 4: Voice Settings (Día 7)
- ✅ Integrar TTS voice selection
- ✅ Integrar STT language selection
- ✅ Verificar funcionamiento en useSpeech y useAudioRecorder

### Sprint 5: Testing & Polish (Día 8)
- ✅ Unit tests para store
- ✅ Integration tests
- ✅ E2E tests con Playwright
- ✅ Optimización de performance
- ✅ Documentación

---

## 📝 Checklist de Implementación

### Backend (Ya completo ✅)
- [x] Endpoints para preferencias
- [x] OpenSearch storage
- [x] Validation con Pydantic

### Frontend - Core
- [ ] Crear `interfaceStore.ts` con Zustand
- [ ] Integrar carga en authStore
- [ ] Export store en `stores/index.ts`

### Frontend - Theme
- [ ] Mejorar ThemeProvider con auto mode
- [ ] CSS variables para temas
- [ ] Transiciones suaves
- [ ] Persistir en localStorage

### Frontend - i18n
- [ ] Instalar next-intl o react-i18next
- [ ] Crear locales/en.json y locales/es.json
- [ ] Setup i18n provider
- [ ] Traducir componentes principales
- [ ] Integrar con interfaceStore

### Frontend - Message Density
- [ ] Estilos para compact, comfortable, spacious
- [ ] Aplicar en ChatMessage
- [ ] Aplicar en ChatBubble
- [ ] Ajustar avatar sizes

### Frontend - Timestamps
- [ ] Toggle show/hide en ChatMessage
- [ ] Formato según idioma
- [ ] Tooltip con timestamp completo

### Frontend - Markdown & Code
- [ ] Toggle markdown rendering
- [ ] Toggle code highlighting
- [ ] Fallback a plain text cuando disabled

### Frontend - Voice
- [ ] Integrar TTS voice en useSpeech
- [ ] Integrar STT language en useAudioRecorder
- [ ] Listar voces disponibles

### Testing
- [ ] Unit tests para interfaceStore
- [ ] Integration tests para preferencias
- [ ] E2E tests con Playwright

### Documentation
- [ ] Actualizar README con i18n setup
- [ ] Documentar interfaceStore API
- [ ] Guía de traducción

---

## 🚀 Comandos de Ejecución

### Desarrollo
```bash
# Backend
docker compose up -d backend

# Frontend con watch mode
cd frontend && npm run dev
```

### Testing
```bash
# Unit tests
npm test

# E2E tests
npx playwright test
```

### Build
```bash
# Production build
docker compose build
docker compose up -d
```

---

## 📈 Métricas de Éxito

- ✅ Tema cambia en toda la app instantáneamente
- ✅ Idioma cambia en toda la app sin reload
- ✅ Densidad de mensajes se aplica correctamente
- ✅ Timestamps show/hide funciona
- ✅ Markdown y code highlighting toggles funcionan
- ✅ TTS/STT usan configuración del usuario
- ✅ Preferencias persisten entre sesiones
- ✅ Sin flickering al cargar preferencias
- ✅ Performance: <100ms para cambios de tema/idioma

---

## 🎯 Notas Importantes

1. **Zustand Store**: Usar Zustand para estado global (más ligero que Redux)
2. **Persistencia**: localStorage como fallback si backend falla
3. **SSR**: Considerar hidratación en Next.js para temas
4. **Performance**: Lazy load traducciones por página
5. **Accessibility**: Mantener contraste WCAG AA en todos los temas
6. **Mobile**: Responsive design para todas las densidades

---

**Versión:** 1.0.0
**Fecha:** Enero 5, 2026
**Branch:** `feature/interface-preferences-integration`
**Autor:** GitHub Copilot
