import { create } from 'zustand';
import api from '@/lib/api';
import { message } from 'antd';

interface InterfacePreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es';
  ttsVoice: string;
  sttLanguage: string;
  messageDensity: 'compact' | 'comfortable' | 'spacious';
  showTimestamps: boolean;
  enableMarkdown: boolean;
  enableCodeHighlighting: boolean;
}

interface InterfaceStore extends InterfacePreferences {
  loading: boolean;
  initialized: boolean;

  // Actions
  loadPreferences: () => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
  updateLanguage: (language: 'en' | 'es') => Promise<void>;
  updateTTSVoice: (voice: string) => Promise<void>;
  updateSTTLanguage: (language: string) => Promise<void>;
  updateMessageDensity: (density: 'compact' | 'comfortable' | 'spacious') => Promise<void>;
  updateShowTimestamps: (show: boolean) => Promise<void>;
  updateEnableMarkdown: (enable: boolean) => Promise<void>;
  updateEnableCodeHighlighting: (enable: boolean) => Promise<void>;
  updateAllPreferences: (prefs: Partial<InterfacePreferences>) => Promise<void>;
  reset: () => void;
}

const DEFAULT_PREFERENCES: InterfacePreferences = {
  theme: 'light',
  language: 'en',
  ttsVoice: 'en-US-EmmaNeural',
  sttLanguage: 'en-US',
  messageDensity: 'comfortable',
  showTimestamps: true,
  enableMarkdown: true,
  enableCodeHighlighting: true,
};

// Load from localStorage
const loadFromLocalStorage = (): Partial<InterfacePreferences> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('interface_preferences');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save to localStorage
const saveToLocalStorage = (prefs: InterfacePreferences) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('interface_preferences', JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences to localStorage:', err);
  }
};

export const useInterfaceStore = create<InterfaceStore>((set, get) => ({
  ...DEFAULT_PREFERENCES,
  ...loadFromLocalStorage(),
  loading: false,
  initialized: false,

  loadPreferences: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/user/preferences');
      const interfacePrefs = data.interface_preferences || {};

      const newPrefs: InterfacePreferences = {
        theme: interfacePrefs.theme || DEFAULT_PREFERENCES.theme,
        language: interfacePrefs.language || DEFAULT_PREFERENCES.language,
        ttsVoice: interfacePrefs.tts_voice || DEFAULT_PREFERENCES.ttsVoice,
        sttLanguage: interfacePrefs.stt_language || DEFAULT_PREFERENCES.sttLanguage,
        messageDensity: interfacePrefs.message_density || DEFAULT_PREFERENCES.messageDensity,
        showTimestamps: interfacePrefs.show_timestamps ?? DEFAULT_PREFERENCES.showTimestamps,
        enableMarkdown: interfacePrefs.enable_markdown ?? DEFAULT_PREFERENCES.enableMarkdown,
        enableCodeHighlighting:
          interfacePrefs.enable_code_highlighting ?? DEFAULT_PREFERENCES.enableCodeHighlighting,
      };

      set({ ...newPrefs, initialized: true });
      saveToLocalStorage(newPrefs);
    } catch (err) {
      console.error('Failed to load interface preferences:', err);
      // Use localStorage fallback
      const localPrefs = loadFromLocalStorage();
      set({ ...localPrefs, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  updateTheme: async (theme) => {
    const prevTheme = get().theme;
    set({ theme });
    saveToLocalStorage(get() as InterfacePreferences);

    try {
      await api.put('/user/preferences/interface', { theme });
    } catch {
      set({ theme: prevTheme });
      message.error('Failed to save theme preference');
    }
  },

  updateLanguage: async (language) => {
    const prevLanguage = get().language;
    set({ language });
    saveToLocalStorage(get() as InterfacePreferences);

    try {
      await api.put('/user/preferences/interface', { language });
    } catch {
      set({ language: prevLanguage });
      message.error('Failed to save language preference');
    }
  },

  updateTTSVoice: async (ttsVoice) => {
    const prevVoice = get().ttsVoice;
    set({ ttsVoice });
    saveToLocalStorage(get() as InterfacePreferences);

    try {
      await api.put('/user/preferences/interface', { tts_voice: ttsVoice });
    } catch {
      set({ ttsVoice: prevVoice });
      message.error('Failed to save TTS voice preference');
    }
  },

  updateSTTLanguage: async (sttLanguage) => {
    const prevLang = get().sttLanguage;
    set({ sttLanguage });
    saveToLocalStorage(get() as InterfacePreferences);

    try {
      await api.put('/user/preferences/interface', { stt_language: sttLanguage });
    } catch {
      set({ sttLanguage: prevLang });
      message.error('Failed to save STT language preference');
    }
  },

  updateMessageDensity: async (messageDensity) => {
    const prevDensity = get().messageDensity;
    set({ messageDensity });
    saveToLocalStorage(get() as InterfacePreferences);

    try {
      await api.put('/user/preferences/interface', { message_density: messageDensity });
    } catch {
      set({ messageDensity: prevDensity });
      message.error('Failed to save message density preference');
    }
  },

  updateShowTimestamps: async (showTimestamps) => {
    const prevShow = get().showTimestamps;
    set({ showTimestamps });
    saveToLocalStorage(get() as InterfacePreferences);

    try {
      await api.put('/user/preferences/interface', { show_timestamps: showTimestamps });
    } catch {
      set({ showTimestamps: prevShow });
      message.error('Failed to save timestamp preference');
    }
  },

  updateEnableMarkdown: async (enableMarkdown) => {
    const prevEnable = get().enableMarkdown;
    set({ enableMarkdown });
    saveToLocalStorage(get() as InterfacePreferences);

    try {
      await api.put('/user/preferences/interface', { enable_markdown: enableMarkdown });
    } catch {
      set({ enableMarkdown: prevEnable });
      message.error('Failed to save markdown preference');
    }
  },

  updateEnableCodeHighlighting: async (enableCodeHighlighting) => {
    const prevEnable = get().enableCodeHighlighting;
    set({ enableCodeHighlighting });
    saveToLocalStorage(get() as InterfacePreferences);

    try {
      await api.put('/user/preferences/interface', {
        enable_code_highlighting: enableCodeHighlighting,
      });
    } catch {
      set({ enableCodeHighlighting: prevEnable });
      message.error('Failed to save code highlighting preference');
    }
  },

  updateAllPreferences: async (prefs) => {
    const currentState = get();
    const newState = { ...currentState, ...prefs };
    set(newState);
    saveToLocalStorage(newState as InterfacePreferences);

    try {
      // Convert to snake_case for backend
      const backendPrefs: Record<string, string | boolean> = {};
      if (prefs.theme !== undefined) backendPrefs.theme = prefs.theme;
      if (prefs.language !== undefined) backendPrefs.language = prefs.language;
      if (prefs.ttsVoice !== undefined) backendPrefs.tts_voice = prefs.ttsVoice;
      if (prefs.sttLanguage !== undefined) backendPrefs.stt_language = prefs.sttLanguage;
      if (prefs.messageDensity !== undefined) backendPrefs.message_density = prefs.messageDensity;
      if (prefs.showTimestamps !== undefined) backendPrefs.show_timestamps = prefs.showTimestamps;
      if (prefs.enableMarkdown !== undefined) backendPrefs.enable_markdown = prefs.enableMarkdown;
      if (prefs.enableCodeHighlighting !== undefined)
        backendPrefs.enable_code_highlighting = prefs.enableCodeHighlighting;

      await api.put('/user/preferences/interface', backendPrefs);
      message.success('Preferences saved successfully');
    } catch (err) {
      set(currentState);
      message.error('Failed to save preferences');
      throw err;
    }
  },

  reset: () => {
    set({ ...DEFAULT_PREFERENCES, initialized: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('interface_preferences');
    }
  },
}));
