'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuthStore } from '@/stores/authStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, hydrateFromLegacyStorage, legacyHydrated } = useAuthStore();

  // Attempt to hydrate from legacy storage keys used by tests/playwright
  useEffect(() => {
    hydrateFromLegacyStorage();
  }, [hydrateFromLegacyStorage]);

  useEffect(() => {
    if (legacyHydrated && (!isAuthenticated || !user)) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router, legacyHydrated]);

  if (!legacyHydrated || !isAuthenticated || !user) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f5f7f9',
        }}
      >
        <Spin size="large" tip="Authenticating...">
          <div style={{ padding: '50px' }} />
        </Spin>
      </div>
    );
  }

  return <>{children}</>;
}
