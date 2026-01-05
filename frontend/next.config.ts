import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd', '@ant-design/x', '@ant-design/icons'],
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', '@ant-design/x', 'lucide-react'],
  },

  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Empty turbopack config to silence the warning
  turbopack: {},

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000',
  },
};

export default withNextIntl(nextConfig);
