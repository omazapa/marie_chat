'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import apiClient from '@/lib/api';

interface WhiteLabelSettings {
  app_name: string;
  app_logo: string;
  app_icon: string;
  primary_color: string;
  welcome_title: string;
  welcome_subtitle: string;
  registration_enabled: boolean;
  suggested_prompts?: string[];
}

interface SettingsContextType {
  whiteLabel: WhiteLabelSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultWhiteLabel: WhiteLabelSettings = {
  app_name: 'Marie',
  app_logo: '/imgs/marie_logo.png',
  app_icon: '/imgs/marie_icon.png',
  primary_color: '#1B4B73',
  welcome_title: 'Marie',
  welcome_subtitle: 'Machine-Assisted Research Intelligent Environment',
  registration_enabled: false,
};

const SettingsContext = createContext<SettingsContextType>({
  whiteLabel: defaultWhiteLabel,
  loading: true,
  refetch: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelSettings>(defaultWhiteLabel);
  const [loading, setLoading] = useState(true);

  const fetchPublicSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/public');
      if (response.data.white_label) {
        setWhiteLabel((prev) => ({
          ...prev,
          ...response.data.white_label,
        }));

        // Apply primary color to CSS variable if needed
        if (response.data.white_label.primary_color) {
          document.documentElement.style.setProperty(
            '--primary-color',
            response.data.white_label.primary_color
          );
        }
      }
    } catch (err: unknown) {
      console.error(
        'Failed to fetch public settings:',
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ whiteLabel, loading, refetch: fetchPublicSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
