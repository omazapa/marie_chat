import type { ThemeConfig } from 'antd';

export const marieTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1B4B73', // Azul institucional
    colorSuccess: '#17A589', // Verde/Teal
    colorInfo: '#2D6A9F', // Azul primario light
    colorWarning: '#F39C12', // Naranja/Dorado para highlights
    colorError: '#E74C3C', // Rojo para alertas
    fontFamily: 'var(--font-inter)',
    fontSize: 16,
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f7f9',
  },
  components: {
    Button: {
      borderRadius: 6,
      fontWeight: 500,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f5f7f9',
    },
    Menu: {
      itemSelectedColor: '#1B4B73',
      itemSelectedBg: '#E8F0F7',
    },
  },
};
