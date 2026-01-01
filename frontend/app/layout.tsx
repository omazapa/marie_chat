import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import { marieTheme } from '@/lib/theme';
import { ClientProviders } from '@/components/ClientProviders';
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
  title: 'Marie - Machine-Assisted Research Intelligent Environment',
  description:
    'Machine-Assisted Research Intelligent Environment (MARIE) - Intelligent AI chat with multi-provider support, semantic search and advanced capabilities by Omar Zapata',
  keywords: [
    'AI',
    'Chat',
    'LLM',
    'OpenSearch',
    'Next.js',
    'Flask',
    'Omar Zapata',
    'Research Assistant',
    'MARIE',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
