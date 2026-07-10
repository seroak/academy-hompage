'use client'

import Link from 'next/link'
import { useNoticesQuery } from '../../queries/useNoticesQuery'

export default function DashboardPage() {
  const { notices } = useNoticesQuery()

  const cards = [
    { label: '공지', count: notices.length, to: '/admin/notices' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.to}
            className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.count}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
