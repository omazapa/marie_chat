# Interface Preferences System

Complete user interface customization system with real-time updates and persistence.

## Features

### 🎨 Theme System
- **Light Mode**: Clean, bright interface for daytime use
- **Dark Mode**: Easy on the eyes for low-light environments (default)
- **Auto Mode**: Automatically follows system preference

Theme changes apply instantly across the entire application without page reload.

### 🌍 Internationalization (i18n)
- **English**: Full UI translation
- **Spanish**: Complete Spanish localization
- More languages coming soon!

Language changes require a page reload to apply the new locale properly.

### 💬 Message Density
Control how compact or spacious message bubbles appear:

- **Compact**: 8px padding, 13px font, 32px avatar - Maximum messages visible
- **Comfortable**: 12px padding, 14px font, 40px avatar - Balanced view (default)
- **Spacious**: 16px padding, 15px font, 48px avatar - Relaxed reading

### 🕐 Timestamps
- Toggle to show/hide message timestamps
- Automatically formatted based on selected language
- Tooltip with full timestamp on hover

### 📝 Markdown & Code
- **Enable Markdown**: Rich text rendering with formatting
- **Enable Code Highlighting**: Syntax highlighting for code blocks
- Disable for plain text mode (better performance)

### 🎙️ Voice Settings
- **TTS Voice**: Select text-to-speech voice (Emma, Andrew, Salome, Gonzalo)
- **STT Language**: Choose speech-to-text recognition language (en-US, es-LA)

## Usage

### Accessing Settings

1. **From Chat**: Click the "User Settings" button (⚙️) in the sidebar
2. **Direct URL**: Navigate to `/settings/interface`

### Changing Preferences

1. Navigate to **Settings > Interface**
2. Adjust your preferences using the form:
   - Select theme radio buttons
   - Choose message density
   - Pick language from dropdown
   - Select voice options
   - Toggle display options
3. Click **"Save Preferences"**
4. Changes apply immediately (except language which requires reload)

### Settings Menu

The settings panel includes 5 sections:

- **Profile**: Personal information and password management
- **Agent Preferences**: Model selection and parameters
- **Interface**: Visual and language preferences (this section)
- **Privacy & Security**: Data retention and deletion
- **API Keys**: Manage API keys

## Technical Details

### Architecture

```
┌─────────────────────────────────────────┐
│          User Login/Hydration            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Load Preferences from Backend         │
│    GET /api/user/preferences             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Store in Zustand (interfaceStore)     │
│    + localStorage fallback               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Apply to UI Components                │
│    - ThemeProvider                       │
│    - MessageItem (density, timestamps)   │
│    - MarkdownContent (render toggles)    │
│    - useWebSocket (TTS voice)            │
│    - useSpeech (STT language)            │
└─────────────────────────────────────────┘
```

### State Management

**Zustand Store** (`frontend/stores/interfaceStore.ts`):
- Centralized state for all preferences
- Auto-sync with backend API
- localStorage persistence for offline support
- Individual update functions + batch update
- Automatic rollback on errors

### Persistence

**Three-layer persistence**:
1. **Backend**: OpenSearch `marie_user_preferences` index
2. **Frontend Store**: Zustand state (in-memory)
3. **localStorage**: Fallback for offline/failed requests

### Components Integration

**MessageItem.tsx**:
- Reads `messageDensity` and `showTimestamps`
- Applies density styles dynamically
- Conditionally renders timestamps

**MarkdownContent.tsx**:
- Checks `enableMarkdown` before rendering
- Passes `enableCodeHighlighting` to CodeBlock
- Falls back to plain text when disabled

**ThemeProvider.tsx**:
- Wraps app with ConfigProvider
- Detects system theme for auto mode
- Listens for system preference changes
- Applies theme to body element

**TTS/STT Hooks**:
- `useWebSocket.textToSpeech`: Uses `ttsVoice` preference
- `useSpeech.transcribeAudio`: Uses `sttLanguage` preference

### API Endpoints

```typescript
// Get all preferences
GET /api/user/preferences
Response: {
  interface_preferences: {
    theme: string,
    language: string,
    tts_voice: string,
    stt_language: string,
    message_density: string,
    show_timestamps: boolean,
    enable_markdown: boolean,
    enable_code_highlighting: boolean
  }
}

// Update interface preferences
PUT /api/user/preferences/interface
Body: {
  theme?: string,
  language?: string,
  tts_voice?: string,
  stt_language?: string,
  message_density?: string,
  show_timestamps?: boolean,
  enable_markdown?: boolean,
  enable_code_highlighting?: boolean
}
```

### i18n Implementation

**next-intl Setup**:
- Messages stored in `frontend/messages/{locale}.json`
- Middleware handles locale detection
- No URL prefix for cleaner URLs
- Server-side message loading

**Translation Files**:
- `frontend/messages/en.json`: English translations
- `frontend/messages/es.json`: Spanish translations

**Usage in Components**:
```typescript
import { useTranslations } from '@/hooks/useLanguage';

function Component() {
  const t = useTranslations('settings.interfaceSection');
  
  return <h1>{t('appearance')}</h1>;
}
```

## Default Values

```typescript
{
  theme: 'dark',
  language: 'en',
  ttsVoice: 'en-US-EmmaNeural',
  sttLanguage: 'en-US',
  messageDensity: 'comfortable',
  showTimestamps: true,
  enableMarkdown: true,
  enableCodeHighlighting: true
}
```

## Performance Considerations

### Optimizations

1. **Lazy Loading**: SyntaxHighlighter only loads when code highlighting enabled
2. **Memoization**: Theme detection memoized to avoid re-computation
3. **Debouncing**: Form updates debounced to prevent excessive API calls
4. **localStorage**: Instant load on subsequent visits (before API response)

### Bundle Impact

- next-intl: ~22 packages, minimal runtime overhead
- Translations: ~100KB total (50KB per language, loaded on demand)
- SyntaxHighlighter: ~500KB (lazy loaded, only when needed)

## Testing

### E2E Tests

Run Playwright tests:
```bash
npx playwright test tests/interface-preferences.spec.js
```

**Test Coverage**:
- Theme switching (light, dark, auto)
- Language change with reload
- Message density application
- Timestamp toggle
- Markdown rendering toggle
- Code highlighting toggle
- TTS/STT voice selection
- Preference persistence across sessions
- System theme detection

### Manual Testing Checklist

- [ ] Change theme and verify instant update
- [ ] Switch language and check translations
- [ ] Toggle density and check message spacing
- [ ] Hide timestamps and verify removal
- [ ] Disable markdown and send formatted text
- [ ] Disable code highlighting and send code block
- [ ] Change TTS voice and test playback
- [ ] Change STT language and test transcription
- [ ] Logout and login to verify persistence
- [ ] Test with system dark mode on/off (auto theme)

## Troubleshooting

### Preferences Not Saving
- Check browser console for API errors
- Verify authentication token is valid
- Check OpenSearch is running (`marie_user_preferences` index)

### Theme Not Applying
- Clear localStorage: `localStorage.removeItem('interface_preferences')`
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Check browser console for errors in ThemeProvider

### Language Not Changing
- Ensure page reload occurred after save
- Check `frontend/messages/{locale}.json` exists
- Verify middleware.ts is properly configured

### Translations Missing
- Add missing keys to both `en.json` and `es.json`
- Restart dev server to reload messages
- Check namespace matches in `useTranslations('namespace')`

## Future Enhancements

### Planned Features
- [ ] More languages (French, German, Portuguese, Chinese, Japanese)
- [ ] Font size adjustment
- [ ] Font family selection
- [ ] Compact sidebar mode
- [ ] High contrast theme
- [ ] RTL support for Arabic/Hebrew
- [ ] Custom color scheme creator
- [ ] Export/import preferences
- [ ] Keyboard shortcuts customization
- [ ] Animation speed control

### Performance Improvements
- [ ] Virtual scrolling for long conversations
- [ ] Code splitting by language
- [ ] Preload next locale on hover
- [ ] Progressive image loading
- [ ] WebWorker for syntax highlighting

## Contributing

When adding new UI strings:

1. Add to `frontend/messages/en.json`
2. Add Spanish translation to `frontend/messages/es.json`
3. Use namespace organization: `section.subsection.key`
4. Keep keys lowercase with camelCase
5. Use `useTranslations('namespace')` in components

Example:
```json
// en.json
{
  "chat": {
    "sendButton": "Send Message"
  }
}

// Component
const t = useTranslations('chat');
<Button>{t('sendButton')}</Button>
```

## References

- [Next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Ant Design ConfigProvider](https://ant.design/components/config-provider)
- [OpenSearch Index Management](https://opensearch.org/docs/latest/)

---

**Version**: 1.0.0  
**Last Updated**: January 5, 2026  
**Maintainer**: GitHub Copilot
