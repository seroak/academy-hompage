import { create } from 'zustand'

interface LoginModalState {
  isOpen: boolean
  redirectTo: string | null
  open: (redirectTo?: string | null) => void
  close: () => void
}

export const useLoginModalStore = create<LoginModalState>()((set) => ({
  isOpen: false,
  redirectTo: null,
  open: (redirectTo = null) => set({ isOpen: true, redirectTo }),
  close: () => set({ isOpen: false, redirectTo: null }),
}))
