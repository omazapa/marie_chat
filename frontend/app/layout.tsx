import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get messages for the current locale (will be determined by middleware)
  const messages = await getMessages();
  
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ClientProviders>{children}</ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
