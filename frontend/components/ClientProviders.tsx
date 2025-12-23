'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import { marieTheme } from '@/lib/theme';
import { SettingsProvider, useSettings } from '@/hooks/useSettings';
import { useEffect, useState } from 'react';
import type { ThemeConfig } from 'antd';

function DynamicConfigProvider({ children }: { children: React.ReactNode }) {
  const { whiteLabel } = useSettings();
  const [theme, setTheme] = useState<ThemeConfig>(marieTheme);

  useEffect(() => {
    if (whiteLabel.primary_color) {
      setTheme({
        ...marieTheme,
        token: {
          ...marieTheme.token,
          colorPrimary: whiteLabel.primary_color,
        },
        components: {
          ...marieTheme.components,
          Menu: {
            ...marieTheme.components?.Menu,
            itemSelectedColor: whiteLabel.primary_color,
          }
        }
      });
    }
  }, [whiteLabel.primary_color]);

  return (
    <ConfigProvider theme={theme}>
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <SettingsProvider>
        <DynamicConfigProvider>
          {children}
        </DynamicConfigProvider>
      </SettingsProvider>
    </AntdRegistry>
  );
}
