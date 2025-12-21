import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginResponse } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (data: LoginResponse) => void;
  setUser: (user: User) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data: LoginResponse) => {
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
        });
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
      },

      updateTokens: (accessToken: string, refreshToken?: string) => {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
        }));
      },
    }),
    {
      name: 'marie-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
