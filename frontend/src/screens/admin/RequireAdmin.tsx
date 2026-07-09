'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'

export default function RequireAdmin({ 
  children, 
  initialAdmin = false,
}: { 
  children: ReactNode
  initialAdmin?: boolean
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const isAuth = mounted ? isAuthenticated : initialAdmin

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/?adminLogin=1')
    }
  }, [mounted, isAuthenticated, router])

  if (!isAuth) {
    return null
  }

  return children
}
