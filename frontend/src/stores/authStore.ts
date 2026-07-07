import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { cookieStorage } from '../lib/cookieStorage'

interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  setAccessToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      isAuthenticated: false,
      setAccessToken: (token: string) =>
        set({ accessToken: token, isAuthenticated: true }),
      logout: () => set({ accessToken: null, isAuthenticated: false }),
    }),
    { name: 'academy-admin-auth', storage: createJSONStorage(() => cookieStorage) },
  ),
)
