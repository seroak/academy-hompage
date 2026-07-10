import { Suspense } from 'react'
import type { ReactNode } from 'react'
import Header from './Header'
import { getServerAuth } from '../lib/serverAuth'

export default async function Layout({
  children,
  variant = 'default',
}: {
  children: ReactNode
  variant?: 'home' | 'default' | 'landing'
}) {
  const mainClassName =
    variant === 'home'
      ? 'mx-auto w-full max-w-[1280px] flex-1 px-4 pb-0 pt-4 sm:px-6'
      : variant === 'landing'
        ? 'mx-auto w-full max-w-[1120px] flex-1 px-4 pb-0 pt-4 sm:px-6'
        : 'mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8'
  const auth = await getServerAuth()

  return (
    <div className="flex min-h-screen flex-col bg-[#fff9ec] text-[#222222]">
      <Suspense fallback={null}>
        <Header initialAuth={auth} />
      </Suspense>

      <main className={mainClassName}>{children}</main>

      <footer className="border-t border-[#f2dfb9] bg-[#fff4df] py-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-[#222222]">아이꿈 학원</p>
            <p className="mt-1 text-xs font-medium text-[#6a6256]">
              경기도 어딘가 123 · 문의 02-000-0000
            </p>
          </div>
          <p className="text-xs font-semibold text-[#8a7a61]">유치부부터 초등 저학년까지 함께합니다.</p>
        </div>
      </footer>
    </div>
  )
}
