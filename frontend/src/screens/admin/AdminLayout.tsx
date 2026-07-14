'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { logoutAdmin } from '../../api/auth.api'
import NotificationBell from './NotificationBell'
const adminNavItems = [
  { to: '/admin/schedules', label: '수업 일정 관리' },
  { to: '/admin/notices', label: '공지 관리' },
  { to: '/admin/reservations', label: '예약 관리' },
  { to: '/admin/reservations/groups', label: '수업 관리' },
  { to: '/admin/members', label: '회원 관리' },
  { to: '/admin/accounts', label: '관리자 계정' },
]

function navLinkClass(isActive: boolean) {
  return `rounded-full px-4 py-2 text-sm font-black transition duration-200 ${
    isActive
      ? 'bg-[#fff0cf] text-[#e86f00]'
      : 'text-[#3f3a31] hover:bg-[#fff4dc] hover:text-[#e86f00]'
  }`
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await logoutAdmin()
    router.refresh()
    router.push('/admin/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fff9ec]">
      <header className="border-b border-[#f2dfb9] bg-[#fff9ec]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/"
                className="text-xl font-black tracking-[-0.01em] text-[#222222] hover:text-[#e86f00]"
              >
                생각을 여는 수학
              </Link>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#e86f00] shadow-[0_8px_20px_rgba(127,88,22,0.08)]">
                관리자
              </span>
            </div>
            <nav className="flex flex-wrap gap-2">
              {adminNavItems.map((item) => (
                <Link key={item.to} href={item.to} className={navLinkClass(pathname === item.to)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full border border-[#f2dfb9] bg-white px-4 text-sm font-black text-[#3f3a31] transition duration-200 hover:-translate-y-0.5 hover:border-[#ffd66b] hover:text-[#e86f00]"
            >
              메인 화면
            </Link>
            <NotificationBell />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center rounded-full border border-[#f2dfb9] bg-white px-4 text-sm font-black text-[#6f6253] transition duration-200 hover:-translate-y-0.5 hover:border-[#ff9f8a] hover:text-[#d6452f]"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  )
}
