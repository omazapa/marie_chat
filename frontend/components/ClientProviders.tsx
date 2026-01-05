'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { SettingsProvider } from '@/hooks/useSettings';
import { ThemeProvider } from './ThemeProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <SettingsProvider>
        <ThemeProvider>
          <App>{children}</App>
        </ThemeProvider>
      </SettingsProvider>
    </AntdRegistry>
  );
}
