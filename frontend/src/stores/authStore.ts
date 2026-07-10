import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { cookieStorage } from '../lib/cookieStorage'
import type { AdminProfile } from '../api/schemas/auth.schema'

interface AuthState {
  accessToken: string | null
  admin: AdminProfile | null
  isAuthenticated: boolean
  setAccessToken: (token: string, admin: AdminProfile) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      admin: null,
      isAuthenticated: false,
      setAccessToken: (token: string, admin: AdminProfile) =>
        set({ accessToken: token, admin, isAuthenticated: true }),
      logout: () => set({ accessToken: null, admin: null, isAuthenticated: false }),
    }),
    { name: 'academy-admin-auth', storage: createJSONStorage(() => cookieStorage) },
  ),
)
