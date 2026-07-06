import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: '홈', end: true },
  { to: '/courses', label: '강좌 안내' },
  { to: '/instructors', label: '강사진' },
  { to: '/notices', label: '공지사항' },
  { to: '/apply', label: '수업 신청' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `relative pb-1 text-sm transition-colors ${
    isActive
      ? 'font-semibold text-brand-600 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-brand-600'
      : 'font-medium text-slate-600 hover:text-brand-600'
  }`
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <NavLink to="/" className="text-lg font-bold text-slate-900">
              푸른들 학원
            </NavLink>
            <Link
              to="/courses"
              className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              전체 강좌
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex gap-6">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <Link
              to="/admin/login"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-brand-600 hover:text-brand-600"
            >
              관리자 로그인
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-sm font-semibold text-slate-800">푸른들 학원</p>
          <p className="mt-1 text-xs text-slate-500">
            경기도 어딘가 123 · 문의 02-000-0000
          </p>
        </div>
      </footer>
    </div>
  )
}
