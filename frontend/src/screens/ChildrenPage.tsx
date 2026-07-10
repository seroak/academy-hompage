'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, UserRound, Users } from 'lucide-react'
import { createChild, deleteChild, updateChild } from '../api/children.api'
import { CHILD_AGE_OPTIONS, ChildInputSchema, type Child, type ChildInput } from '../api/schemas/child.schema'
import { queryKeys } from '../queries/queryKeys'
import { useChildrenQuery } from '../queries/useChildrenQuery'

const emptyForm: ChildInput = { name: '', age: 4 }

export default function ChildrenPage() {
  const queryClient = useQueryClient()
  const { children, isLoading, error } = useChildrenQuery()
  const [form, setForm] = useState<ChildInput>(emptyForm)
  const [editing, setEditing] = useState<Child | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.children.all })
  const create = useMutation({ mutationFn: createChild, onSuccess: invalidate })
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: ChildInput }) => updateChild(id, input), onSuccess: invalidate })
  const remove = useMutation({ mutationFn: deleteChild, onSuccess: invalidate })

  function startEdit(child: Child) {
    setEditing(child)
    setForm({ name: child.name, age: child.age })
    setFormError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = ChildInputSchema.safeParse(form)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.')
      return
    }

    setFormError(null)
    try {
      if (editing) await update.mutateAsync({ id: editing.id, input: parsed.data })
      else await create.mutateAsync(parsed.data)
      cancelEdit()
    } catch {
      setFormError('자녀 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  async function handleDelete(child: Child) {
    if (!window.confirm(`${child.name} 어린이를 삭제할까요? 기존 신청과 레벨테스트 이력은 유지됩니다.`)) return
    try {
      await remove.mutateAsync(child.id)
      if (editing?.id === child.id) cancelEdit()
    } catch {
      setFormError('자녀 정보를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const saving = create.isPending || update.isPending

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wide text-[#e86f00]">내 계정</p>
        <h1 className="mt-2 text-3xl font-black text-[#222222]">내 자녀</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6253]">
          등록한 자녀 정보는 상담 신청과 레벨테스트에 그대로 사용할 수 있습니다.
        </p>

        {isLoading ? (
          <p className="mt-6 text-sm font-semibold text-[#6f6253]">자녀 정보를 불러오는 중...</p>
        ) : error ? (
          <p className="mt-6 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">
            자녀 정보를 불러오지 못했습니다.
          </p>
        ) : children.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#f2dfb9] bg-[#fffdf8] px-6 py-10 text-center">
            <Users size={32} strokeWidth={2} className="text-[#ffb84d]" />
            <p className="text-sm font-semibold text-[#6f6253]">등록된 자녀가 없습니다. 오른쪽에서 첫 자녀를 등록해 보세요.</p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3">
            {children.map((child) => {
              const isEditing = editing?.id === child.id
              return (
                <li
                  key={child.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 transition-colors ${
                    isEditing ? 'border-[#ffb84d] bg-[#fff7e8]' : 'border-[#f2dfb9] bg-[#fffdf8]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#ffedc9] text-[#9f4d00]">
                      <UserRound size={20} strokeWidth={2.5} />
                    </span>
                    <p className="text-sm font-black text-[#3f3a31]">
                      {child.name} <span className="font-semibold text-[#8a7a61]">· 만 {child.age}세</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(child)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#f2dfb9] bg-white px-3 py-1.5 text-sm font-black text-[#3f3a31] transition duration-200 hover:-translate-y-0.5 hover:border-[#ffd66b] hover:text-[#e86f00]"
                    >
                      <Pencil size={14} strokeWidth={2.5} />
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(child)}
                      disabled={remove.isPending}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#f9d9d0] bg-white px-3 py-1.5 text-sm font-black text-[#d6452f] transition duration-200 hover:-translate-y-0.5 hover:border-[#d6452f] disabled:opacity-50"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                      삭제
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <form onSubmit={submit} className="h-fit rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wide text-[#e86f00]">{editing ? '정보 수정' : '신규 등록'}</p>
        <h2 className="mt-2 text-xl font-black text-[#222222]">{editing ? '자녀 정보 수정' : '자녀 등록'}</h2>
        <label className="mt-5 flex flex-col gap-2 text-sm font-black text-[#3f3a31]">
          자녀 이름
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold outline-none focus:border-[#ff8a1f]"
          />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm font-black text-[#3f3a31]">
          만 나이
          <select
            value={form.age}
            onChange={(event) => setForm({ ...form, age: Number(event.target.value) })}
            className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold outline-none focus:border-[#ff8a1f]"
          >
            {CHILD_AGE_OPTIONS.map((age) => <option key={age} value={age}>만 {age}세</option>)}
          </select>
        </label>
        {formError && <p className="mt-4 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">{formError}</p>}
        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="h-12 flex-1 rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffcf4d] disabled:opacity-60"
          >
            {editing ? '변경 저장' : '자녀 등록'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="h-12 rounded-full border border-[#f2dfb9] bg-white px-4 text-sm font-black text-[#3f3a31] transition duration-200 hover:-translate-y-0.5 hover:border-[#ffd66b]"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
