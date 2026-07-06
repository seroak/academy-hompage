import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const adminNavItems = [
  { to: '/admin', label: '대시보드', end: true },
  { to: '/admin/courses', label: '강좌 관리' },
  { to: '/admin/notices', label: '공지 관리' },
  { to: '/admin/instructors', label: '강사 관리' },
  { to: '/admin/reservations', label: '예약 관리' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-medium transition-colors ${
    isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
  }`
}

export default function AdminLayout() {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-slate-900">관리자</span>
            <nav className="flex gap-6">
              {adminNavItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-600"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
