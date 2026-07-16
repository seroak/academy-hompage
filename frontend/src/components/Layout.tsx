import { Suspense } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
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
      <Suspense fallback={<div className="h-[84px]" aria-hidden="true" />}>
        <Header initialAuth={auth} />
      </Suspense>

      <main className={mainClassName}>{children}</main>

      <footer className="border-t border-[#f2dfb9] bg-[#fff4df] py-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-[#222222]">생각을 여는 수학</p>
            <p className="mt-1 text-xs font-medium text-[#6a6256]">
              경기도 용인시 기흥구 흥덕2로65번길 12-15 · 문의 010-2976-0166
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#8a7a61]">
            <p>유치부부터 초등 저학년까지 함께합니다.</p>
            <Link
              href="/courses/heungdeok-math"
              className="underline decoration-[#c9ad79] underline-offset-4 transition hover:text-[#e86f00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e86f00]"
            >
              흥덕 수학학원 안내
            </Link>
            <Link
              href="/privacy"
              className="underline decoration-[#c9ad79] underline-offset-4 transition hover:text-[#e86f00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e86f00]"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
