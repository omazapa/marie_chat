import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginResponse } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  legacyHydrated: boolean;
  _hasHydrated: boolean;

  // Actions
  setAuth: (data: LoginResponse) => void;
  setUser: (user: User) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken?: string) => void;
  hydrateFromLegacyStorage: () => void;
  loadUserPreferences: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      legacyHydrated: false,
      _hasHydrated: false,

      setAuth: (data: LoginResponse) => {
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
        });

        // Load interface preferences after successful login
        setTimeout(async () => {
          try {
            const { useInterfaceStore } = await import('./interfaceStore');
            await useInterfaceStore.getState().loadPreferences();
          } catch (error) {
            console.error('Failed to load interface preferences:', error);
          }
        }, 100);
      },

      setUser: (user: User) => {
        set({ user });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // Reset interface preferences on logout
        setTimeout(async () => {
          try {
            const { useInterfaceStore } = await import('./interfaceStore');
            useInterfaceStore.getState().reset();
          } catch (error) {
            console.error('Failed to reset interface preferences:', error);
          }
        }, 0);
      },

      updateTokens: (accessToken: string, refreshToken?: string) => {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
        }));
      },

      loadUserPreferences: async () => {
        try {
          const { useInterfaceStore } = await import('./interfaceStore');
          await useInterfaceStore.getState().loadPreferences();
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
      },

      hydrateFromLegacyStorage: () => {
        if (typeof window === 'undefined') return;

        const legacyToken = localStorage.getItem('auth_token');
        const legacyUser = localStorage.getItem('auth_user');
        const legacyRefresh = localStorage.getItem('refresh_token');

        if (legacyToken && legacyUser) {
          try {
            const parsedUser = JSON.parse(legacyUser);
            set({
              user: parsedUser,
              accessToken: legacyToken,
              refreshToken: legacyRefresh,
              isAuthenticated: true,
              legacyHydrated: true,
            });

            // Load preferences for legacy auth
            setTimeout(async () => {
              try {
                const { useInterfaceStore } = await import('./interfaceStore');
                await useInterfaceStore.getState().loadPreferences();
              } catch (error) {
                console.error('Failed to load interface preferences:', error);
              }
            }, 100);
            return;
          } catch (error) {
            console.warn('Failed to parse legacy auth_user', error);
          }
        }

        set({ legacyHydrated: true });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'marie-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        legacyHydrated: state.legacyHydrated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
