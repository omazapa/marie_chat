'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    return null;
  }

  return <>{children}</>;
}
