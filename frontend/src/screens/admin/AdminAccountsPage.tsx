'use client'

import { useState, type FormEvent } from 'react'
import { createAdmin } from '../../api/admins.api'
import { CreateAdminInputSchema, type CreateAdminInput } from '../../api/schemas/admin.schema'
import { ApiError } from '../../lib/apiClient'

const emptyForm: CreateAdminInput = {
  username: '',
  password: '',
  role: 'CONTENT_MANAGER',
}

const roles = [
  { value: 'CONTENT_MANAGER', label: '콘텐츠 담당' },
  { value: 'RESERVATION_MANAGER', label: '예약 담당' },
  { value: 'ASSESSMENT_MANAGER', label: '레벨테스트 담당' },
  { value: 'SUPER_ADMIN', label: '최고관리자' },
] as const

export default function AdminAccountsPage() {
  const [form, setForm] = useState<CreateAdminInput>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = CreateAdminInputSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.')
      return
    }

    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const created = await createAdmin(parsed.data)
      setSuccess(`${created.username} 계정을 생성했습니다.`)
      setForm(emptyForm)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '관리자 계정을 생성하지 못했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="max-w-xl rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8">
      <p className="text-sm font-black text-[#e86f00]">최고관리자 전용</p>
      <h1 className="mt-2 text-3xl font-black text-[#222222]">관리자 계정 생성</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6253]">
        담당 업무에 필요한 역할만 부여하세요. 강사 전용 역할은 제공하지 않습니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-black text-[#3f3a31]">
          아이디
          <input
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            minLength={3}
            maxLength={50}
            required
            className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold outline-none focus:border-[#ff8a1f]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-black text-[#3f3a31]">
          임시 비밀번호
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            minLength={8}
            required
            className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold outline-none focus:border-[#ff8a1f]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-black text-[#3f3a31]">
          역할
          <select
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as CreateAdminInput['role'] }))}
            className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold outline-none focus:border-[#ff8a1f]"
          >
            {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
        </label>
        {error && <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">{error}</p>}
        {success && <p className="rounded-2xl bg-[#eaf7ea] px-4 py-3 text-sm font-bold text-[#2f7a3d]">{success}</p>}
        <button type="submit" disabled={isSubmitting} className="h-12 rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418] disabled:opacity-60">
          {isSubmitting ? '생성 중...' : '관리자 계정 생성'}
        </button>
      </form>
    </section>
  )
}
