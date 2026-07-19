'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { LockKeyhole, X } from 'lucide-react'
import { useModalFocusTrap } from '../hooks/useModalFocusTrap'
import { AdminLoginForm } from './admin-login/AdminLoginForm'
import { ParentLoginForm } from './admin-login/ParentLoginForm'
import { SocialLoginButtons } from './admin-login/SocialLoginButtons'
import { useAdminLoginForm } from './admin-login/useAdminLoginForm'
import { useParentLoginForm } from './admin-login/useParentLoginForm'

interface AdminLoginModalProps {
  isOpen: boolean
  redirectTo?: string | null
  onClose: () => void
  onSuccess: () => void
  onParentSuccess: () => void
}

export default function AdminLoginModal({
  isOpen,
  redirectTo,
  onClose,
  onSuccess,
  onParentSuccess,
}: AdminLoginModalProps) {
  const pathname = usePathname()
  const dialogRef = useModalFocusTrap(isOpen)
  const parentForm = useParentLoginForm(onParentSuccess)
  const adminForm = useAdminLoginForm(onSuccess)

  useEffect(() => {
    if (!isOpen) {
      parentForm.reset()
      adminForm.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] grid place-items-center bg-[#2b2418]/45 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <dialog
        ref={dialogRef}
        open
        aria-modal="true"
        aria-labelledby="login-title"
        className="static max-h-[calc(100vh-48px)] w-full max-w-[440px] overflow-y-auto rounded-[28px] border border-[#f2dfb9] bg-[#fff9ec] p-6 shadow-[0_24px_70px_rgba(48,33,10,0.24)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-[#ffd66b] text-[#2b2418]">
              <LockKeyhole size={22} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-black text-[#e86f00]">생각을 여는 수학</p>
              <h1 id="login-title" className="text-xl font-black text-[#222222]">
                로그인
              </h1>
            </div>
          </div>
          <button
            type="button"
            data-autofocus
            aria-label="로그인 창 닫기"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#3f3a31] shadow-[0_8px_20px_rgba(48,33,10,0.08)] transition hover:text-[#d6452f]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-5 text-sm font-semibold leading-6 text-[#6a6256]">
          상담 신청은 소셜 계정으로, 학원 관리는 아이디와 비밀번호로 로그인할 수 있습니다.
        </p>

        <ParentLoginForm form={parentForm} />

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#ead7ad]" />
          <span className="text-xs font-black text-[#8a7a61]">소셜 로그인</span>
          <span className="h-px flex-1 bg-[#ead7ad]" />
        </div>

        <SocialLoginButtons redirectTo={redirectTo} pathname={pathname} />

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#ead7ad]" />
          <span className="text-xs font-black text-[#8a7a61]">관리자</span>
          <span className="h-px flex-1 bg-[#ead7ad]" />
        </div>

        <AdminLoginForm form={adminForm} />
      </dialog>
    </div>
  )
}
