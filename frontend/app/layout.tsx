import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
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
  title: 'Marie Chat - Intelligent Conversational AI',
  description: 'Chat inteligente con IA multi-provider, búsqueda semántica y capacidades avanzadas',
  keywords: ['AI', 'Chat', 'LLM', 'OpenSearch', 'Next.js', 'Flask'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1B4B73',
                colorSuccess: '#17A589',
                fontFamily: 'var(--font-inter)',
                fontSize: 16,
                borderRadius: 8,
              },
              components: {
                Layout: {
                  headerBg: '#1B4B73',
                  headerColor: '#ffffff',
                },
                Button: {
                  primaryColor: '#1B4B73',
                },
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
