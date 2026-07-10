'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CalendarCheck, ChevronDown, LogIn, LogOut, Menu, Shield, X } from 'lucide-react'
import type { ParentProfile } from '../api/schemas/auth.schema'
import { logoutParent } from '../api/auth.api'
import { useAuthStore } from '../stores/authStore'
import { useLoginModalStore } from '../stores/loginModalStore'
import AdminLoginModal from './AdminLoginModal'

const navItems = [
  { to: '/courses', label: '교육과정' },
  { to: '/#programs', label: '프로그램' },
  { to: '/notices', label: '커뮤니티' },
  { to: '/level-test', label: '레벨테스트' },
]

function navLinkClass(isActive: boolean) {
  return `rounded-full px-3 py-2 text-sm font-bold transition ${
    isActive
      ? 'bg-[#fff0cf] text-[#e86f00]'
      : 'text-[#3f3a31] hover:bg-[#fff4dc] hover:text-[#e86f00]'
  }`
}

function initialOf(parent: { name: string | null; email: string | null }) {
  const source = parent.name?.trim() || parent.email?.trim() || '회원'
  return source.charAt(0).toUpperCase()
}

function ParentProfileMenu({
  parent,
  onLogout,
}: {
  parent: ParentProfile
  onLogout: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const displayName = parent.name?.trim() || parent.email?.trim() || '회원'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="inline-flex h-12 items-center gap-2 rounded-full border border-[#f2dfb9] bg-white pl-2 pr-4 text-sm font-black text-[#3f3a31] transition duration-250 hover:-translate-y-0.5 hover:border-[#ffd66b] hover:text-[#e86f00]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418]">
          {initialOf(parent)}
        </span>
        <span className="max-w-[8rem] truncate">{displayName}</span>
        <ChevronDown size={16} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[#f2dfb9] bg-white p-3 shadow-[0_18px_36px_rgba(48,33,10,0.14)]">
          <div className="border-b border-[#f2dfb9] px-2 pb-3">
            <p className="truncate text-sm font-black text-[#3f3a31]">{displayName}</p>
            {parent.email && (
              <p className="truncate text-xs font-bold text-[#8a8272]">{parent.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-black text-[#3f3a31] transition hover:bg-[#fff4dc] hover:text-[#d6452f]"
          >
            <LogOut size={18} strokeWidth={2.5} />
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}

export interface HeaderInitialAuth {
  admin: boolean
  parent: ParentProfile | null
}

export default function Header({ initialAuth }: { initialAuth: HeaderInitialAuth }) {
  const [isOpen, setIsOpen] = useState(false)
  // 관리자 인증은 클라이언트 스토어(persist 쿠키)를 쓰므로, 서버(쿠키)와 클라이언트
  // 첫 렌더가 항상 일치하도록 mount 전에는 서버가 내려준 initialAuth를 그대로 쓰고
  // mount 후에야 zustand 스토어 값으로 전환한다. 학부모 인증은 httpOnly 쿠키를
  // 서버 컴포넌트(getServerAuth)만 읽으므로 initialAuth 값을 그대로 쓴다.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const adminFromStore = useAuthStore((state) => state.isAuthenticated)
  const isAuthenticated = mounted ? adminFromStore : initialAuth.admin
  const isParentAuthenticated = initialAuth.parent !== null
  const parent = initialAuth.parent
  const isLoginModalOpen = useLoginModalStore((state) => state.isOpen)
  const loginModalRedirectTo = useLoginModalStore((state) => state.redirectTo)
  const openSharedLoginModal = useLoginModalStore((state) => state.open)
  const closeSharedLoginModal = useLoginModalStore((state) => state.close)
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()
  const hasAdminLoginParam = searchParams?.get('adminLogin') === '1'
  const hasParentLoginParam = searchParams?.get('login') === '1'
  const shouldShowLoginModal = isLoginModalOpen || hasAdminLoginParam || hasParentLoginParam
  const parentLoginRedirectTo = hasParentLoginParam ? '/apply' : loginModalRedirectTo

  function handleLogout() {
    logout()
    setIsOpen(false)
    router.push('/')
  }

  async function handleParentLogout() {
    setIsOpen(false)
    await logoutParent()
    router.refresh()
    router.push('/')
  }

  function openLoginModal() {
    setIsOpen(false)
    openSharedLoginModal()
  }

  function handleReservationClick() {
    setIsOpen(false)
    router.push('/apply')
  }

  function closeLoginModal() {
    closeSharedLoginModal()
    if (hasAdminLoginParam || hasParentLoginParam) {
      const nextParams = new URLSearchParams(searchParams?.toString())
      nextParams.delete('adminLogin')
      nextParams.delete('login')
      const query = nextParams.toString()
      router.replace(query ? `/?${query}` : '/')
    }
  }

  function handleLoginSuccess() {
    closeSharedLoginModal()
    router.push('/admin')
  }

  function handleParentLoginSuccess() {
    const redirect = parentLoginRedirectTo
    closeSharedLoginModal()
    router.refresh()
    if (redirect) {
      router.push(redirect)
    }
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
            ) : isParentAuthenticated && parent ? (
              <ParentProfileMenu parent={parent} onLogout={handleParentLogout} />
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
              onClick={handleReservationClick}
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
              ) : isParentAuthenticated && parent ? (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-full border border-[#f2dfb9] bg-white px-4 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418]">
                      {initialOf(parent)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#3f3a31]">
                        {parent.name?.trim() || parent.email?.trim() || '회원'}
                      </p>
                      {parent.email && (
                        <p className="truncate text-xs font-bold text-[#8a8272]">{parent.email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleParentLogout}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#f2dfb9] bg-white px-3 text-sm font-black text-[#d6452f]"
                  >
                    <LogOut size={16} strokeWidth={2.5} />
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
                onClick={handleReservationClick}
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
        redirectTo={parentLoginRedirectTo}
        onClose={closeLoginModal}
        onSuccess={handleLoginSuccess}
        onParentSuccess={handleParentLoginSuccess}
      />
    </>
  )
}
