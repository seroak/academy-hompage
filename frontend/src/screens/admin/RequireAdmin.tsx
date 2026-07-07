'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/?adminLogin=1')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return children
}
