'use client';

import { useEffect, useState } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import { useInterfaceStore } from '@/stores/interfaceStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: userTheme } = useInterfaceStore();
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Detectar preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      if (userTheme === 'auto') {
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setEffectiveTheme(userTheme as 'light' | 'dark');
      }
    };

    // Actualizar tema inicial
    updateTheme();

    // Listener para cambios del sistema (solo si está en auto)
    if (userTheme === 'auto') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [userTheme]);

  // Aplicar clase al body para CSS variables
  useEffect(() => {
    document.body.setAttribute('data-theme', effectiveTheme);

    // Transición suave
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    return () => {
      document.body.style.transition = '';
    };
  }, [effectiveTheme]);

  return (
    <ConfigProvider
      theme={{
        algorithm: effectiveTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1B4B73',
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Layout: {
            headerBg: effectiveTheme === 'dark' ? '#141414' : '#ffffff',
            bodyBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#f5f7fa',
            siderBg: effectiveTheme === 'dark' ? '#141414' : '#ffffff',
          },
          Card: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Modal: {
            contentBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            headerBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
