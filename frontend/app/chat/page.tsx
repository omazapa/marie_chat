'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Typography } from 'antd';

const { Title, Text } = Typography;

export default function ChatPage() {
  return (
    <AuthGuard>
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Title level={2}>Área de Chat</Title>
        <Text type="secondary">
          Esta interfaz de chat se implementará en la Fase 2
        </Text>
      </div>
    </AuthGuard>
  );
}
