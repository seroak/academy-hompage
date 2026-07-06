import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ParentProfile } from '../api/schemas/auth.schema'

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
    { name: 'academy-parent-auth' },
  ),
)
