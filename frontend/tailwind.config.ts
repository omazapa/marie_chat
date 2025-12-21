import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4B73',
          50: '#E8F0F7',
          100: '#D1E1EF',
          200: '#A3C3DF',
          300: '#75A5CF',
          400: '#4787BF',
          500: '#1B4B73',
          600: '#163C5C',
          700: '#112D45',
          800: '#0C1E2E',
          900: '#060F17',
        },
        secondary: {
          DEFAULT: '#17A589',
          50: '#E7F7F4',
          100: '#CFEFE9',
          200: '#9FDFD3',
          300: '#6FCFBD',
          400: '#3FBFA7',
          500: '#17A589',
          600: '#12846E',
          700: '#0E6352',
          800: '#094237',
          900: '#05211B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable to avoid conflicts with Ant Design
  },
};

export default config;
