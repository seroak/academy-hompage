import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNoticesQuery } from '../../queries/useNoticesQuery'
import { useNoticeMutations } from './hooks/useNoticeMutations'
import { CreateNoticeInputSchema, type CreateNoticeInput } from '../../api/schemas/notice.schema'
import type { Notice } from '../../api/schemas/notice.schema'

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

  async function handleSubmit(event: FormEvent) {
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
    } catch {
      window.alert('공지를 삭제하지 못했습니다.')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">공지 관리</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <h2 className="font-semibold text-slate-800">
          {editingId ? '공지 수정' : '새 공지 등록'}
        </h2>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          제목
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {fieldErrors.title && (
            <span className="text-xs text-red-600">{fieldErrors.title}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          내용
          <textarea
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          {fieldErrors.content && (
            <span className="text-xs text-red-600">{fieldErrors.content}</span>
          )}
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.pinned ?? false}
            onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
          />
          상단 고정
        </label>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {editingId ? '수정 저장' : '등록'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {isLoading && <p className="mt-6 text-slate-500">불러오는 중...</p>}
      {error && <p className="mt-6 text-red-600">목록을 불러오지 못했습니다.</p>}

      {!isLoading && !error && (
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {notices.map((notice) => (
            <li key={notice.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {notice.pinned && <span className="mr-2 text-indigo-600">[고정]</span>}
                  {notice.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(notice)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(notice.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
