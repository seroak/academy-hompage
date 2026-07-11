'use client'

import { useState, type SubmitEvent } from 'react'
import { CreateAdminInputSchema, type CreateAdminInput } from '../../api/schemas/admin.schema'
import { ApiError } from '../../lib/apiClient'
import { useAuthStore } from '../../stores/authStore'
import { useAdminsQuery } from './hooks/useAdminsQuery'
import { useAdminMutations } from './hooks/useAdminMutations'

const emptyForm: CreateAdminInput = {
  username: '',
  password: '',
}

export default function AdminAccountsPage() {
  const currentAdminId = useAuthStore((state) => state.admin?.id)
  const { admins, isLoading, error: listError } = useAdminsQuery()
  const { createAdmin, deleteAdmin, isCreating, isDeleting } = useAdminMutations()

  const [form, setForm] = useState<CreateAdminInput>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = CreateAdminInputSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.')
      return
    }

    setError(null)
    setSuccess(null)
    try {
      const created = await createAdmin(parsed.data)
      setSuccess(`${created.username} 계정을 생성했습니다.`)
      setForm(emptyForm)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '관리자 계정을 생성하지 못했습니다.')
    }
  }

  async function handleDelete(id: string, username: string) {
    if (!window.confirm(`'${username}' 계정을 삭제하시겠습니까?`)) return
    try {
      await deleteAdmin(id)
    } catch (cause) {
      window.alert(cause instanceof ApiError ? cause.message : '관리자 계정을 삭제하지 못했습니다.')
    }
  }

  return (
    <div className="grid max-w-xl gap-8">
      <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8">
        <p className="text-sm font-black text-[#e86f00]">관리자 전용</p>
        <h1 className="mt-2 text-3xl font-black text-[#222222]">관리자 계정 생성</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6253]">
          생성된 계정은 모든 관리자 기능을 이용할 수 있습니다.
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
          {error && <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">{error}</p>}
          {success && <p className="rounded-2xl bg-[#eaf7ea] px-4 py-3 text-sm font-bold text-[#2f7a3d]">{success}</p>}
          <button type="submit" disabled={isCreating} className="h-12 rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418] disabled:opacity-60">
            {isCreating ? '생성 중...' : '관리자 계정 생성'}
          </button>
        </form>
      </section>

      <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8">
        <h2 className="text-xl font-black text-[#222222]">관리자 계정 목록</h2>

        {isLoading && <p className="mt-4 text-sm font-semibold text-[#6f6253]">불러오는 중...</p>}
        {listError && (
          <p className="mt-4 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">
            목록을 불러오지 못했습니다.
          </p>
        )}

        {!isLoading && !listError && (
          <ul className="mt-4 divide-y divide-[#f2dfb9]">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-black text-[#3f3a31]">
                    {admin.username}
                    {admin.id === currentAdminId && (
                      <span className="ml-2 text-xs font-semibold text-[#e86f00]">(나)</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#6f6253]">
                    {new Date(admin.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(admin.id, admin.username)}
                  disabled={isDeleting || admin.id === currentAdminId}
                  className="text-sm font-bold text-[#d6452f] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
