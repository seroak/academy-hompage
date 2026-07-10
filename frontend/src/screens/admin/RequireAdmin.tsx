'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'
import type { AdminRole } from '../../api/schemas/auth.schema'

export default function RequireAdmin({ 
  children, 
  initialAdmin = false,
  allowedRoles,
}: { 
  children: ReactNode
  initialAdmin?: boolean
  allowedRoles?: AdminRole[]
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const admin = useAuthStore((state) => state.admin)
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

  if (mounted && allowedRoles && (!admin || !allowedRoles.includes(admin.role))) {
    return (
      <div className="rounded-2xl border border-[#f2dfb9] bg-white p-6 text-sm font-bold text-[#6a6256]">
        이 페이지에 접근할 권한이 없습니다.
      </div>
    )
  }

  return children
}
