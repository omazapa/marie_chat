'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ConfigProvider, theme as antTheme } from 'antd';
import { useInterfaceStore } from '@/stores/interfaceStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: userTheme } = useInterfaceStore();
  const pathname = usePathname();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Check if we're on auth pages (login/register)
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Calculate effective theme based on all factors
  const effectiveTheme = useMemo(() => {
    // Auth pages always use light theme
    if (isAuthPage) {
      return 'light';
    }

    // Apply user preference
    if (userTheme === 'auto') {
      return systemTheme;
    }
    return userTheme as 'light' | 'dark';
  }, [isAuthPage, userTheme, systemTheme]);

  // Listen to system theme changes
  useEffect(() => {
    // Skip if on auth page
    if (isAuthPage) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    // Set initial value
    updateSystemTheme();

    // Only listen if user theme is auto
    if (userTheme === 'auto') {
      mediaQuery.addEventListener('change', updateSystemTheme);
      return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    }
  }, [userTheme, isAuthPage]);

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
          colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          colorBgElevated: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
          colorBgLayout: effectiveTheme === 'dark' ? '#141414' : '#f5f7fa',
          colorTextBase:
            effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
          colorText:
            effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
          colorTextSecondary:
            effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
          colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
          colorBorderSecondary: effectiveTheme === 'dark' ? '#303030' : '#f0f0f0',
        },
        components: {
          Layout: {
            headerBg: effectiveTheme === 'dark' ? '#141414' : '#ffffff',
            bodyBg: effectiveTheme === 'dark' ? '#141414' : '#f5f7fa',
            siderBg: effectiveTheme === 'dark' ? '#141414' : '#ffffff',
            triggerBg: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
          },
          Button: {
            defaultBg: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
            defaultBorderColor: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
            defaultColor:
              effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
            defaultHoverBg: effectiveTheme === 'dark' ? '#303030' : '#fafafa',
            defaultHoverBorderColor: effectiveTheme === 'dark' ? '#525252' : '#d9d9d9',
            defaultHoverColor:
              effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.88)',
            textHoverBg:
              effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
          Card: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorderSecondary: effectiveTheme === 'dark' ? '#303030' : '#f0f0f0',
          },
          Modal: {
            contentBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            headerBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Popover: {
            colorBgElevated: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
          },
          Dropdown: {
            colorBgElevated: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
          },
          Menu: {
            itemBg: effectiveTheme === 'dark' ? '#141414' : '#ffffff',
            itemHoverBg: effectiveTheme === 'dark' ? '#262626' : '#f5f5f5',
            itemSelectedBg: effectiveTheme === 'dark' ? '#1B4B73' : '#e6f7ff',
          },
          Input: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
            activeBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            hoverBg: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
          },
          InputNumber: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
          },
          Select: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBgElevated: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
            colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
            optionSelectedBg: effectiveTheme === 'dark' ? '#1B4B73' : '#e6f7ff',
          },
          Form: {
            labelColor:
              effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
          },
          Table: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorderSecondary: effectiveTheme === 'dark' ? '#303030' : '#f0f0f0',
            headerBg: effectiveTheme === 'dark' ? '#262626' : '#fafafa',
          },
          Collapse: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorder: effectiveTheme === 'dark' ? '#424242' : '#d9d9d9',
            headerBg: effectiveTheme === 'dark' ? '#262626' : '#fafafa',
          },
          Tabs: {
            cardBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Tooltip: {
            colorBgSpotlight: effectiveTheme === 'dark' ? '#434343' : 'rgba(0, 0, 0, 0.85)',
          },
          Message: {
            contentBg: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
          },
          Notification: {
            colorBgElevated: effectiveTheme === 'dark' ? '#262626' : '#ffffff',
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
          Switch: {
            colorPrimary: '#1B4B73',
            colorPrimaryHover: '#2d6a9f',
          },
          Drawer: {
            colorBgElevated: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Avatar: {
            colorBgContainer: effectiveTheme === 'dark' ? '#262626' : '#f5f5f5',
            colorTextPlaceholder:
              effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
          },
          Tag: {
            defaultBg: effectiveTheme === 'dark' ? '#262626' : '#fafafa',
            defaultColor:
              effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
