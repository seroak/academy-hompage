'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCoursesQuery } from '../../queries/useCoursesQuery'
import { useInstructorsQuery } from '../../queries/useInstructorsQuery'
import { useCourseMutations } from './hooks/useCourseMutations'
import { CreateCourseInputSchema, type CreateCourseInput } from '../../api/schemas/course.schema'
import type { Course } from '../../api/schemas/course.schema'

const emptyForm: CreateCourseInput = {
  title: '',
  description: '',
  category: '',
  level: '',
  tuition: 0,
  schedule: '',
  instructorId: '',
}

export default function CoursesAdminPage() {
  const { courses, isLoading, error } = useCoursesQuery()
  const { instructors } = useInstructorsQuery()
  const { createCourse, updateCourse, deleteCourse, isCreating, isUpdating } =
    useCourseMutations()

  const [form, setForm] = useState<CreateCourseInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function startEdit(course: Course) {
    setEditingId(course.id)
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      tuition: course.tuition,
      schedule: course.schedule,
      instructorId: course.instructorId,
      thumbnailUrl: course.thumbnailUrl ?? undefined,
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
    const result = CreateCourseInputSchema.safeParse(form)
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
        await updateCourse(editingId, result.data)
      } else {
        await createCourse(result.data)
      }
      cancelEdit()
    } catch {
      setSubmitError('저장에 실패했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('이 강좌를 삭제하시겠습니까?')) return
    try {
      await deleteCourse(id)
    } catch {
      window.alert('강좌를 삭제하지 못했습니다.')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">강좌 관리</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="col-span-full font-semibold text-slate-800">
          {editingId ? '강좌 수정' : '새 강좌 등록'}
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
          담당 강사
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.instructorId}
            onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
          >
            <option value="">선택해 주세요</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name} ({instructor.subject})
              </option>
            ))}
          </select>
          {fieldErrors.instructorId && (
            <span className="text-xs text-red-600">{fieldErrors.instructorId}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          분류
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          {fieldErrors.category && (
            <span className="text-xs text-red-600">{fieldErrors.category}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          난이도
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          />
          {fieldErrors.level && (
            <span className="text-xs text-red-600">{fieldErrors.level}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          수강료(원)
          <input
            type="number"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.tuition}
            onChange={(e) => setForm({ ...form, tuition: Number(e.target.value) })}
          />
          {fieldErrors.tuition && (
            <span className="text-xs text-red-600">{fieldErrors.tuition}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          수업 일정
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          />
          {fieldErrors.schedule && (
            <span className="text-xs text-red-600">{fieldErrors.schedule}</span>
          )}
        </label>

        <label className="col-span-full flex flex-col gap-1 text-sm text-slate-700">
          설명
          <textarea
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {fieldErrors.description && (
            <span className="text-xs text-red-600">{fieldErrors.description}</span>
          )}
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
          {courses.map((course) => (
            <li key={course.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {course.title}
                  <span className="ml-2 text-xs text-indigo-600">
                    {course.category} · {course.level}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {course.tuition.toLocaleString('ko-KR')}원 · {course.schedule}
                  {course.instructor ? ` · ${course.instructor.name}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(course)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(course.id)}
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
