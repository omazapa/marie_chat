import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface AgentPreferences {
  default_provider?: string;
  default_provider_id?: string;
  default_model?: string;
  system_prompt?: string;
  parameters?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
  response_mode?: string;
}

interface InterfacePreferences {
  theme?: string;
  language?: string;
  tts_voice?: string;
  stt_language?: string;
  message_density?: string;
  show_timestamps?: boolean;
  enable_markdown?: boolean;
  enable_code_highlighting?: boolean;
}

interface PrivacyPreferences {
  conversation_retention_days?: number;
  auto_delete_enabled?: boolean;
  share_usage_data?: boolean;
}

interface UserPreferences {
  agent_preferences?: AgentPreferences;
  interface_preferences?: InterfacePreferences;
  privacy_preferences?: PrivacyPreferences;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/user/preferences');
      setPreferences(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load preferences');
      console.error('Failed to load user preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const refreshPreferences = () => {
    loadPreferences();
  };

  return {
    preferences,
    loading,
    error,
    refreshPreferences,
  };
}
