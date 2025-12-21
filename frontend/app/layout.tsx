import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Marie Chat - Intelligent Conversational Assistant',
  description: 'Intelligent AI chat with multi-provider support, semantic search and advanced capabilities by ImpactU/CoLaV',
  keywords: ['AI', 'Chat', 'LLM', 'OpenSearch', 'Next.js', 'Flask', 'ImpactU', 'CoLaV', 'Research Assistant'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1B4B73',      // Azul institucional ImpactU
                colorSuccess: '#17A589',      // Verde/Teal CoLaV
                colorInfo: '#2D6A9F',         // Azul primario light
                colorWarning: '#F39C12',      // Naranja/Dorado para highlights
                colorError: '#E74C3C',        // Rojo para alertas
                fontFamily: 'var(--font-inter)',
                fontSize: 16,
                borderRadius: 8,
              },
              components: {
                Layout: {
                  headerBg: '#1B4B73',
                  headerColor: '#ffffff',
                  bodyBg: '#F8FAFC',
                },
                Button: {
                  primaryColor: '#ffffff',
                  colorPrimary: '#1B4B73',
                  colorPrimaryHover: '#2D6A9F',
                  colorPrimaryActive: '#0F2D47',
                },
                Input: {
                  colorBorder: '#E2E8F0',
                  colorPrimary: '#1B4B73',
                },
              },
            }}
          >
            <App>
              {children}
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
