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

const fieldClass =
  'h-11 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold text-[#2f281d] outline-none transition focus:border-[#ff8a1f] focus:bg-white focus:ring-4 focus:ring-[#ffd66b]/25'

const textareaClass =
  'rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 py-3 text-sm font-semibold leading-6 text-[#2f281d] outline-none transition focus:border-[#ff8a1f] focus:bg-white focus:ring-4 focus:ring-[#ffd66b]/25'

const labelClass = 'flex flex-col gap-2 text-sm font-black text-[#3f3a31]'
const errorClass = 'text-xs font-bold text-[#d6452f]'

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
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[28px] bg-white px-6 py-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="text-sm font-black text-[#e86f00]">교육 과정 운영</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.01em] text-[#222222]">
            강좌 관리
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6253]">
            아이들이 만나는 수업 정보를 등록하고, 일정과 담당 강사를 한 화면에서 정리합니다.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff3c8] px-4 py-2 text-sm font-black text-[#9f4d00]">
          등록 강좌
          <span className="text-lg text-[#e86f00]">{courses.length}</span>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-[28px] border border-[#f2dfb9] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:grid-cols-2 sm:p-8"
      >
        <div className="col-span-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#e86f00]">
              {editingId ? '선택한 강좌 편집' : '새 수업 만들기'}
            </p>
            <h2 className="mt-1 text-xl font-black text-[#222222]">
              {editingId ? '강좌 수정' : '새 강좌 등록'}
            </h2>
          </div>
          {editingId && (
            <span className="w-fit rounded-full bg-[#e7f4ff] px-3 py-1 text-xs font-black text-[#236c9c]">
              수정 모드
            </span>
          )}
        </div>

        <label className={labelClass}>
          제목
          <input
            className={fieldClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {fieldErrors.title && (
            <span className={errorClass}>{fieldErrors.title}</span>
          )}
        </label>

        <label className={labelClass}>
          담당 강사
          <select
            className={fieldClass}
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
            <span className={errorClass}>{fieldErrors.instructorId}</span>
          )}
        </label>

        <label className={labelClass}>
          분류
          <input
            className={fieldClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          {fieldErrors.category && (
            <span className={errorClass}>{fieldErrors.category}</span>
          )}
        </label>

        <label className={labelClass}>
          난이도
          <input
            className={fieldClass}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          />
          {fieldErrors.level && (
            <span className={errorClass}>{fieldErrors.level}</span>
          )}
        </label>

        <label className={labelClass}>
          수강료(원)
          <input
            type="number"
            className={fieldClass}
            value={form.tuition}
            onChange={(e) => setForm({ ...form, tuition: Number(e.target.value) })}
          />
          {fieldErrors.tuition && (
            <span className={errorClass}>{fieldErrors.tuition}</span>
          )}
        </label>

        <label className={labelClass}>
          수업 일정
          <input
            className={fieldClass}
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          />
          {fieldErrors.schedule && (
            <span className={errorClass}>{fieldErrors.schedule}</span>
          )}
        </label>

        <label className={`col-span-full ${labelClass}`}>
          설명
          <textarea
            className={textareaClass}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {fieldErrors.description && (
            <span className={errorClass}>{fieldErrors.description}</span>
          )}
        </label>

        {submitError && <p className={`col-span-full ${errorClass}`}>{submitError}</p>}

        <div className="col-span-full flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#ff8a1f] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(255,138,31,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e86f00] disabled:translate-y-0 disabled:opacity-50"
          >
            {editingId ? '수정 저장' : '등록'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#f2dfb9] bg-white px-6 text-sm font-black text-[#6f6253] transition duration-200 hover:-translate-y-0.5 hover:border-[#ffd66b] hover:text-[#e86f00]"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {isLoading && (
        <p className="rounded-[24px] border border-[#f2dfb9] bg-white px-5 py-4 text-sm font-bold text-[#6f6253]">
          불러오는 중...
        </p>
      )}
      {error && (
        <p className="rounded-[24px] border border-[#ffd6cc] bg-[#fff5f1] px-5 py-4 text-sm font-bold text-[#d6452f]">
          목록을 불러오지 못했습니다.
        </p>
      )}

      {!isLoading && !error && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[#222222]">등록된 강좌</h2>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#e86f00]">
              총 {courses.length}개
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-[28px] border border-[#f2dfb9] bg-white px-6 py-10 text-center shadow-[0_18px_46px_rgba(95,67,18,0.08)]">
              <p className="text-base font-black text-[#222222]">아직 등록된 강좌가 없습니다.</p>
              <p className="mt-2 text-sm font-semibold text-[#6f6253]">
                위 폼에서 첫 강좌를 등록해 주세요.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4">
              {courses.map((course) => (
                <li
                  key={course.id}
                  className="rounded-[28px] border border-[#f2dfb9] bg-white p-5 shadow-[0_14px_36px_rgba(95,67,18,0.07)]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-[#222222]">{course.title}</p>
                        <span className="rounded-full bg-[#fff3c8] px-3 py-1 text-xs font-black text-[#9f4d00]">
                          {course.category}
                        </span>
                        <span className="rounded-full bg-[#e9f9ec] px-3 py-1 text-xs font-black text-[#2f7a3d]">
                          {course.level}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#6f6253]">
                        <span className="rounded-full bg-[#fff9ec] px-3 py-1">
                          {course.tuition.toLocaleString('ko-KR')}원
                        </span>
                        <span className="rounded-full bg-[#fff9ec] px-3 py-1">
                          {course.schedule}
                        </span>
                        {course.instructor && (
                          <span className="rounded-full bg-[#e7f4ff] px-3 py-1 text-[#236c9c]">
                            {course.instructor.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(course)}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-[#ffd66b] bg-[#fff9ec] px-4 text-sm font-black text-[#e86f00] transition duration-200 hover:-translate-y-0.5 hover:bg-[#fff0cf]"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(course.id)}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-[#ffd6cc] bg-[#fff5f1] px-4 text-sm font-black text-[#d6452f] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe9e1]"
                      >
                        삭제
                      </button>
                    </div>
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
