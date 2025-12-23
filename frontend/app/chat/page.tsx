'use client';

import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Spin } from 'antd';

// Lazy load ChatContainer to reduce initial bundle size
const ChatContainer = dynamic(() => import('@/components/chat/ChatContainer'), {
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Loading Chat..." />
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

