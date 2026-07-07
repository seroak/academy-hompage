import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ParentProfile } from '../api/schemas/auth.schema'
import { cookieStorage } from '../lib/cookieStorage'

interface ParentAuthState {
  accessToken: string | null
  parent: ParentProfile | null
  isAuthenticated: boolean
  setSession: (token: string, parent: ParentProfile) => void
  logout: () => void
}

export const useParentAuthStore = create<ParentAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      parent: null,
      isAuthenticated: false,
      setSession: (token, parent) =>
        set({ accessToken: token, parent, isAuthenticated: true }),
      logout: () => set({ accessToken: null, parent: null, isAuthenticated: false }),
    }),
    { name: 'academy-parent-auth', storage: createJSONStorage(() => cookieStorage) },
  ),
)
