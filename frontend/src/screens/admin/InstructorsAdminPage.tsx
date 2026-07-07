'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useInstructorsQuery } from '../../queries/useInstructorsQuery'
import { useInstructorMutations } from './hooks/useInstructorMutations'
import {
  CreateInstructorInputSchema,
  type CreateInstructorInput,
} from '../../api/schemas/instructor-input.schema'
import type { Instructor } from '../../api/schemas/instructor.schema'

const emptyForm: CreateInstructorInput = { name: '', subject: '', bio: '' }

export default function InstructorsAdminPage() {
  const { instructors, isLoading, error } = useInstructorsQuery()
  const { createInstructor, updateInstructor, deleteInstructor, isCreating, isUpdating } =
    useInstructorMutations()

  const [form, setForm] = useState<CreateInstructorInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function startEdit(instructor: Instructor) {
    setEditingId(instructor.id)
    setForm({
      name: instructor.name,
      subject: instructor.subject,
      bio: instructor.bio,
      photoUrl: instructor.photoUrl ?? undefined,
    })
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
    const result = CreateInstructorInputSchema.safeParse(form)
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
        await updateInstructor(editingId, result.data)
      } else {
        await createInstructor(result.data)
      }
      cancelEdit()
    } catch {
      setSubmitError('저장에 실패했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('이 강사를 삭제하시겠습니까?')) return
    try {
      await deleteInstructor(id)
    } catch {
      window.alert('강사를 삭제하지 못했습니다. 담당 강좌가 남아있는지 확인해 주세요.')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">강사 관리</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="col-span-full font-semibold text-slate-800">
          {editingId ? '강사 수정' : '새 강사 등록'}
        </h2>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          이름
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {fieldErrors.name && <span className="text-xs text-red-600">{fieldErrors.name}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          담당 과목
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          {fieldErrors.subject && (
            <span className="text-xs text-red-600">{fieldErrors.subject}</span>
          )}
        </label>

        <label className="col-span-full flex flex-col gap-1 text-sm text-slate-700">
          소개
          <textarea
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          {fieldErrors.bio && <span className="text-xs text-red-600">{fieldErrors.bio}</span>}
        </label>

        {submitError && <p className="col-span-full text-sm text-red-600">{submitError}</p>}

        <div className="col-span-full flex gap-2">
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
          {instructors.map((instructor) => (
            <li key={instructor.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {instructor.name}
                  <span className="ml-2 text-xs text-indigo-600">{instructor.subject}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">{instructor.bio}</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(instructor)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(instructor.id)}
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
