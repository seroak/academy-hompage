'use client'

import { useState, type SubmitEvent } from 'react'
import { useNoticesQuery } from '../../queries/useNoticesQuery'
import { useNoticeMutations } from './hooks/useNoticeMutations'
import { CreateNoticeInputSchema, type CreateNoticeInput, type Notice } from '../../api/schemas/notice.schema'
import { ApiError } from '../../lib/apiClient'

const emptyForm: CreateNoticeInput = { title: '', content: '', pinned: false }

export default function NoticesAdminPage() {
  const { notices, isLoading, error } = useNoticesQuery()
  const { createNotice, updateNotice, deleteNotice, isCreating, isUpdating } =
    useNoticeMutations()

  const [form, setForm] = useState<CreateNoticeInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function startEdit(notice: Notice) {
    setEditingId(notice.id)
    setForm({ title: notice.title, content: notice.content, pinned: notice.pinned })
    setFieldErrors({})
    setSubmitError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setFieldErrors({})
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = CreateNoticeInputSchema.safeParse(form)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setSubmitError(null)

    try {
      if (editingId) {
        await updateNotice(editingId, result.data)
      } else {
        await createNotice(result.data)
      }
      cancelEdit()
    } catch {
      setSubmitError('저장에 실패했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('이 공지를 삭제하시겠습니까?')) return
    try {
      await deleteNotice(id)
    } catch (cause) {
      window.alert(cause instanceof ApiError ? cause.message : '공지를 삭제하지 못했습니다.')
    }
  }

  return (
    <div data-testid="notices-admin-page" className="max-w-4xl bg-[#fff9ec]">
      <p className="text-sm font-black text-[#e86f00]">관리자 전용</p>
      <h1 className="mt-2 text-3xl font-black text-[#222222]">공지 관리</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6253]">
        학부모에게 전달할 소식을 등록하고, 중요한 공지는 목록 상단에 고정할 수 있습니다.
      </p>

      <form
        onSubmit={handleSubmit}
        data-testid="notice-form-panel"
        className="mt-6 grid gap-5 rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8"
      >
        <h2 className="text-xl font-black text-[#222222]">
          {editingId ? '공지 수정' : '새 공지 등록'}
        </h2>

        <label className="flex flex-col gap-2 text-sm font-black text-[#3f3a31]">
          제목
          <input
            className="h-12 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold text-[#3f3a31] outline-none transition focus:border-[#ff8a1f]"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {fieldErrors.title && (
            <span className="text-xs font-bold text-[#d6452f]">{fieldErrors.title}</span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm font-black text-[#3f3a31]">
          내용
          <textarea
            className="min-h-32 resize-y rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 py-3 text-sm font-semibold leading-6 text-[#3f3a31] outline-none transition focus:border-[#ff8a1f]"
            rows={5}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          {fieldErrors.content && (
            <span className="text-xs font-bold text-[#d6452f]">{fieldErrors.content}</span>
          )}
        </label>

        <label className="flex w-fit cursor-pointer items-center gap-3 rounded-2xl bg-[#fff4dc] px-4 py-3 text-sm font-black text-[#3f3a31]">
          <input
            type="checkbox"
            checked={form.pinned ?? false}
            onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            className="size-4 accent-[#e86f00]"
          />
          상단 고정
        </label>

        {submitError && (
          <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">
            {submitError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="h-12 rounded-full bg-[#ffd66b] px-6 text-sm font-black text-[#2b2418] transition hover:-translate-y-0.5 hover:bg-[#ffca47] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingId ? '수정 저장' : '등록'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="h-12 rounded-full border border-[#f2dfb9] bg-white px-6 text-sm font-black text-[#6f6253] transition hover:border-[#ffd66b] hover:text-[#e86f00]"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {isLoading && <p className="mt-8 text-sm font-semibold text-[#6f6253]">불러오는 중...</p>}
      {error && (
        <p className="mt-8 rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">
          목록을 불러오지 못했습니다.
        </p>
      )}

      {!isLoading && !error && (
        <section className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-black text-[#222222]">등록된 공지</h2>
            <p className="text-sm font-semibold text-[#6f6253]">총 {notices.length}건</p>
          </div>

          {notices.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-[#fff9ec] px-5 py-8 text-center text-sm font-semibold text-[#6f6253]">
              등록된 공지가 없습니다. 새 공지를 등록해 주세요.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-[#f2dfb9]">
              {notices.map((notice) => (
                <li key={notice.id} className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {notice.pinned && (
                        <span className="rounded-full bg-[#fff0cf] px-3 py-1 text-xs font-black text-[#e86f00]">
                          상단 고정
                        </span>
                      )}
                      <p className="text-base font-black text-[#3f3a31]">{notice.title}</p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[#6f6253]">
                      {notice.content}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-[#9a8b78]">
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(notice)}
                      className="rounded-full border border-[#f2dfb9] px-4 py-2 text-sm font-black text-[#6f6253] transition hover:border-[#ffd66b] hover:text-[#e86f00]"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(notice.id)}
                      className="rounded-full border border-[#ffd6ce] px-4 py-2 text-sm font-black text-[#d6452f] transition hover:bg-[#fff0ed]"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
