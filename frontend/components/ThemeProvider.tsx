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
          colorBgBase: effectiveTheme === 'dark' ? '#141414' : '#ffffff',
          colorTextBase:
            effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
        },
        components: {
          Layout: {
            headerBg: effectiveTheme === 'dark' ? '#141414' : '#ffffff',
            bodyBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#f5f7fa',
            siderBg: effectiveTheme === 'dark' ? '#141414' : '#ffffff',
          },
          Card: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorderSecondary: effectiveTheme === 'dark' ? '#303030' : '#f0f0f0',
          },
          Modal: {
            contentBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            headerBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Input: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
          },
          InputNumber: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
          },
          Select: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBgElevated: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
          },
          Form: {
            labelColor:
              effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
          },
          Table: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorderSecondary: effectiveTheme === 'dark' ? '#303030' : '#f0f0f0',
          },
          Collapse: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
          },
          Slider: {
            colorBgElevated: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Radio: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Checkbox: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Drawer: {
            colorBgElevated: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
