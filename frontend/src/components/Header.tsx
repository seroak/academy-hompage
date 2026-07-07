'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CalendarCheck, LogIn, LogOut, Menu, Shield, X } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useLoginModalStore } from '../stores/loginModalStore'
import AdminLoginModal from './AdminLoginModal'

const navItems = [
  { to: '/instructors', label: '학원소개' },
  { to: '/courses', label: '교육과정' },
  { to: '/#programs', label: '프로그램' },
  { to: '/notices', label: '커뮤니티' },
]

function navLinkClass(isActive: boolean) {
  return `rounded-full px-3 py-2 text-sm font-bold transition ${
    isActive
      ? 'bg-[#fff0cf] text-[#e86f00]'
      : 'text-[#3f3a31] hover:bg-[#fff4dc] hover:text-[#e86f00]'
  }`
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoginModalOpen = useLoginModalStore((state) => state.isOpen)
  const openSharedLoginModal = useLoginModalStore((state) => state.open)
  const closeSharedLoginModal = useLoginModalStore((state) => state.close)
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()
  const hasAdminLoginParam = searchParams?.get('adminLogin') === '1'
  const shouldShowLoginModal = isLoginModalOpen || hasAdminLoginParam

  function handleLogout() {
    logout()
    setIsOpen(false)
    router.push('/')
  }

  function openLoginModal() {
    setIsOpen(false)
    openSharedLoginModal()
  }

  function closeLoginModal() {
    closeSharedLoginModal()
    if (hasAdminLoginParam) {
      const nextParams = new URLSearchParams(searchParams?.toString())
      nextParams.delete('adminLogin')
      const query = nextParams.toString()
      router.replace(query ? `/?${query}` : '/')
    }
  }

  function handleLoginSuccess() {
    closeSharedLoginModal()
    router.push('/admin')
  }

  function handleParentLoginSuccess() {
    closeSharedLoginModal()
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#fff9ec]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[84px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center" onClick={() => setIsOpen(false)}>
            <span className="text-xl font-black tracking-[-0.01em] text-[#222222]">아이꿈 학원</span>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                className={navLinkClass(pathname === item.to)}
              >
                {item.label}
              </Link>
            ))}
            <button type="button" onClick={openLoginModal} className={navLinkClass(false)}>
              학부모센터
            </button>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <>
                <Link
                  href="/admin"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#f2dfb9] bg-white px-5 text-sm font-black text-[#3f3a31] transition duration-250 hover:-translate-y-0.5 hover:border-[#ffd66b] hover:text-[#e86f00]"
                >
                  <Shield size={18} strokeWidth={2.5} />
                  관리자
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#f2dfb9] bg-white px-5 text-sm font-black text-[#3f3a31] transition duration-250 hover:-translate-y-0.5 hover:border-[#ff9f8a] hover:text-[#d6452f]"
                >
                  <LogOut size={18} strokeWidth={2.5} />
                  로그아웃
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-[#f2dfb9] bg-white px-5 text-sm font-black text-[#3f3a31] transition duration-250 hover:-translate-y-0.5 hover:border-[#ffd66b] hover:text-[#e86f00]"
              >
                <LogIn size={18} strokeWidth={2.5} />
                로그인
              </button>
            )}
            <button
              type="button"
              onClick={openLoginModal}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#ffd66b] px-6 text-sm font-black text-[#2b2418] shadow-[0_14px_28px_rgba(255,214,107,0.34)] transition duration-250 hover:-translate-y-0.5 hover:bg-[#ffcf4d]"
            >
              <CalendarCheck size={18} strokeWidth={2.5} />
              상담예약
            </button>
          </div>

          <button
            type="button"
            aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="grid size-12 place-items-center rounded-full bg-white text-[#222222] shadow-[0_10px_24px_rgba(48,33,10,0.08)] lg:hidden"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-[#f2dfb9] bg-[#fff9ec] px-5 pb-5 lg:hidden">
            <nav className="mx-auto grid max-w-[1280px] gap-2 pt-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  className={navLinkClass(pathname === item.to)}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button type="button" onClick={openLoginModal} className={navLinkClass(false)}>
                학부모센터
              </button>
              {isAuthenticated ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#f2dfb9] bg-white px-4 text-sm font-black text-[#3f3a31]"
                  >
                    <Shield size={18} strokeWidth={2.5} />
                    관리자
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#f2dfb9] bg-white px-4 text-sm font-black text-[#d6452f]"
                  >
                    <LogOut size={18} strokeWidth={2.5} />
                    로그아웃
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#f2dfb9] bg-white px-6 text-sm font-black text-[#3f3a31]"
                >
                  <LogIn size={18} strokeWidth={2.5} />
                  로그인
                </button>
              )}
              <button
                type="button"
                onClick={openLoginModal}
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ffd66b] px-6 text-sm font-black text-[#2b2418]"
              >
                <CalendarCheck size={18} strokeWidth={2.5} />
                상담예약
              </button>
            </nav>
          </div>
        )}
      </header>

      <AdminLoginModal
        isOpen={shouldShowLoginModal}
        onClose={closeLoginModal}
        onSuccess={handleLoginSuccess}
        onParentSuccess={handleParentLoginSuccess}
      />
    </>
  )
}
