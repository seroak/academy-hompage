'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'

const adminNavItems = [
  { to: '/admin/courses', label: '강좌 관리' },
  { to: '/admin/notices', label: '공지 관리' },
  { to: '/admin/instructors', label: '강사 관리' },
  { to: '/admin/reservations', label: '예약 관리' },
]

function navLinkClass(isActive: boolean) {
  return `text-sm font-medium transition-colors ${
    isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
  }`
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const logout = useAuthStore((state) => state.logout)
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/admin/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div className="flex shrink-0 items-center gap-3">
              <Link href="/" className="text-lg font-bold text-slate-900 hover:text-indigo-600">
                푸른들 학원
              </Link>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                관리자
              </span>
            </div>
            <nav className="flex gap-6">
              {adminNavItems.map((item) => (
                <Link key={item.to} href={item.to} className={navLinkClass(pathname === item.to)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
              메인 화면
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  )
}
