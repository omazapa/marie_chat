'use client';

import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Spin } from 'antd';

// Lazy load ChatContainer to reduce initial bundle size
const ChatContainer = dynamic(() => import('@/components/chat/ChatContainer'), {
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px' }}>
      <Spin size="large" />
      <div style={{ color: '#1B4B73', fontWeight: 500 }}>Loading Chat...</div>
    </div>
  ),
  ssr: false
});

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatContainer />
    </AuthGuard>
  );
}

