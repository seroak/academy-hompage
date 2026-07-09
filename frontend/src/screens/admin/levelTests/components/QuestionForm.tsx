'use client'

import {
  LEVEL_TEST_AGE_OPTIONS,
  LEVEL_TEST_QUESTION_TYPE_LABELS,
  LEVEL_TEST_QUESTION_TYPE_OPTIONS,
} from '../../../../api/schemas/levelTest.schema'
import type { QuestionFormState } from '../types'

type Props = {
  form: QuestionFormState
  onChange: (form: QuestionFormState) => void
  fieldErrors: Record<string, string>
  editingId: string | null
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
}

export default function QuestionForm({
  form,
  onChange,
  fieldErrors,
  editingId,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  function updateChoice(index: number, value: string) {
    const choices = [...form.choices]
    choices[index] = value
    onChange({ ...form, choices })
  }

  function addChoice() {
    onChange({ ...form, choices: [...form.choices, ''] })
  }

  function removeChoice(index: number) {
    const choices = form.choices.filter((_, i) => i !== index)
    const correctChoiceIndex =
      form.correctChoiceIndex === index
        ? 0
        : form.correctChoiceIndex !== undefined && form.correctChoiceIndex > index
          ? form.correctChoiceIndex - 1
          : form.correctChoiceIndex
    onChange({ ...form, choices, correctChoiceIndex })
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-4 rounded-2xl border border-[#f2dfb9] bg-white p-6"
    >
      <h2 className="font-black text-[#222222]">{editingId ? '문항 수정' : '새 문항 등록'}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-bold text-[#6f6253]">
          나이(만)
          <select
            className="rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
            value={form.age}
            onChange={(event) => onChange({ ...form, age: Number(event.target.value) })}
          >
            {LEVEL_TEST_AGE_OPTIONS.map((age) => (
              <option key={age} value={age}>
                만 {age}세
              </option>
            ))}
          </select>
          {fieldErrors.age && <span className="text-xs font-semibold text-[#d6452f]">{fieldErrors.age}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm font-bold text-[#6f6253]">
          유형
          <select
            className="rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
            value={form.type}
            onChange={(event) =>
              onChange({ ...form, type: event.target.value as QuestionFormState['type'] })
            }
          >
            {LEVEL_TEST_QUESTION_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {LEVEL_TEST_QUESTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-bold text-[#6f6253]">
        문제
        <textarea
          className="rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
          rows={2}
          value={form.prompt}
          onChange={(event) => onChange({ ...form, prompt: event.target.value })}
        />
        {fieldErrors.prompt && <span className="text-xs font-semibold text-[#d6452f]">{fieldErrors.prompt}</span>}
      </label>

      {form.type === 'MULTIPLE_CHOICE' && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-[#6f6253]">보기 (정답에 체크)</p>
          {form.choices.map((choice, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctChoiceIndex"
                checked={form.correctChoiceIndex === index}
                onChange={() => onChange({ ...form, correctChoiceIndex: index })}
              />
              <input
                className="flex-1 rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
                value={choice}
                onChange={(event) => updateChoice(index, event.target.value)}
                placeholder={`보기 ${index + 1}`}
              />
              {form.choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoice(index)}
                  className="text-xs font-bold text-[#d6452f]"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addChoice}
            className="self-start rounded-full border border-[#f2dfb9] px-3 py-1 text-xs font-bold text-[#9f4d00] transition hover:bg-[#fff3c8]"
          >
            보기 추가
          </button>
          {fieldErrors.choices && <span className="text-xs font-semibold text-[#d6452f]">{fieldErrors.choices}</span>}
          {fieldErrors.correctChoiceIndex && (
            <span className="text-xs font-semibold text-[#d6452f]">{fieldErrors.correctChoiceIndex}</span>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-bold text-[#6f6253]">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(event) => onChange({ ...form, active: event.target.checked })}
        />
        출제 대상(활성)
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[#e86f00] px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {editingId ? '수정 저장' : '등록'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#f2dfb9] px-4 py-2 text-sm font-bold text-[#6f6253]"
          >
            취소
          </button>
        )}
      </div>
    </form>
  )
}
