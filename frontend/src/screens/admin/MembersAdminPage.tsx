'use client'

import { Fragment, useState, type MouseEvent } from 'react'
import { useMembersQuery } from './hooks/useMembersQuery'
import { useMemberMutations } from './hooks/useMemberMutations'
import {
  RESERVATION_STATUS_LABELS,
  timeRangeLabel,
  DAY_OF_WEEK_LABELS,
} from '../../api/schemas/reservation.schema'
import { OAUTH_PROVIDER_LABELS } from '../../api/schemas/member.schema'
import type { Member } from '../../api/schemas/member.schema'
import { ApiError } from '../../lib/apiClient'

function loginMethodsLabel(member: Member): string {
  const methods: string[] = []
  if (member.hasPassword) methods.push('이메일')
  for (const provider of member.socialProviders) {
    methods.push(OAUTH_PROVIDER_LABELS[provider])
  }
  return methods.length > 0 ? methods.join(', ') : '-'
}

function childrenLabel(member: Member): string {
  const seen = new Set<string>()
  const children: string[] = []
  for (const reservation of member.reservations) {
    const key = `${reservation.childName}-${reservation.childAge}`
    if (seen.has(key)) continue
    seen.add(key)
    children.push(`${reservation.childName}(만 ${reservation.childAge}세)`)
  }
  return children.length > 0 ? children.join(', ') : '-'
}

export default function MembersAdminPage() {
  const { members, isLoading, error } = useMembersQuery()
  const { deleteMember, isDeleting } = useMemberMutations()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedId((current) => (current === id ? null : id))
  }

  async function handleDelete(event: MouseEvent, id: string, name: string | null) {
    event.stopPropagation()
    if (!window.confirm(`'${name ?? '이름 없음'}' 회원을 삭제하시겠습니까? 신청 내역도 함께 삭제됩니다.`)) return
    try {
      await deleteMember(id)
    } catch (cause) {
      window.alert(cause instanceof ApiError ? cause.message : '회원을 삭제하지 못했습니다.')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">회원 관리</h1>

      {isLoading && <p className="mt-6 text-slate-500">불러오는 중...</p>}
      {error && <p className="mt-6 text-red-600">회원 목록을 불러오지 못했습니다.</p>}

      {!isLoading && !error && members.length === 0 && (
        <p className="mt-6 text-slate-500">가입한 회원이 없습니다.</p>
      )}

      {!isLoading && !error && members.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3">이름</th>
                <th className="px-5 py-3">이메일</th>
                <th className="px-5 py-3">가입일</th>
                <th className="px-5 py-3">로그인 수단</th>
                <th className="px-5 py-3">자녀</th>
                <th className="px-5 py-3">신청 건수</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.map((member) => {
                const isExpanded = expandedId === member.id
                return (
                  <Fragment key={member.id}>
                    <tr
                      onClick={() => toggleExpand(member.id)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {member.name ?? '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-700">{member.email ?? '-'}</td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(member.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-5 py-4 text-slate-700">{loginMethodsLabel(member)}</td>
                      <td className="px-5 py-4 text-slate-700">{childrenLabel(member)}</td>
                      <td className="px-5 py-4 text-slate-700">{member.reservations.length}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => handleDelete(event, member.id, member.name)}
                          disabled={isDeleting}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-bold text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50 px-5 py-4">
                          {member.reservations.length === 0 ? (
                            <p className="text-slate-500">신청 내역이 없습니다.</p>
                          ) : (
                            <ul className="flex flex-col gap-3">
                              {member.reservations.map((reservation) => (
                                <li
                                  key={reservation.id}
                                  className="rounded-lg border border-slate-200 bg-white p-4"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-slate-900">
                                      {reservation.childName} (만 {reservation.childAge}세)
                                    </p>
                                    <span className="text-xs font-medium text-slate-500">
                                      {RESERVATION_STATUS_LABELS[reservation.status]}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-xs text-slate-500">
                                    희망 시간:{' '}
                                    {reservation.preferredSlots
                                      .map(
                                        (slot) =>
                                          `${DAY_OF_WEEK_LABELS[slot.dayOfWeek]} ${timeRangeLabel(slot.startMinute, slot.endMinute)}`,
                                      )
                                      .join(' / ')}
                                  </p>
                                  {reservation.groupId && (
                                    <p className="mt-1 text-xs text-emerald-600">확정 그룹 편성됨</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
