'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import AuthGuard from '@/components/auth/AuthGuard';
import ChatContainer from '@/components/chat/ChatContainer';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <AuthGuard>
      <ChatContainer />
    </AuthGuard>
  );
}
