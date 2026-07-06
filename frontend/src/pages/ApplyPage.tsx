import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { socialLoginStartUrl } from '../api/auth.api'
import type { OAuthProvider } from '../api/schemas/auth.schema'
import { useApplyReservationMutation } from './hooks/useApplyReservationMutation'
import { useParentAuthStore } from '../stores/parentAuthStore'
import {
  CreateReservationInputSchema,
  DAY_OF_WEEK_OPTIONS,
  DAY_OF_WEEK_LABELS,
  HOUR_OPTIONS,
  hourLabel,
  type CreateReservationInput,
} from '../api/schemas/reservation.schema'

const emptyForm: CreateReservationInput = {
  childName: '',
  childAge: 4,
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  preferredDayOfWeek: 'MON',
  preferredHour: 12,
  note: '',
}

const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10]

const SOCIAL_PROVIDERS: Array<{ provider: OAuthProvider; label: string; className: string }> = [
  {
    provider: 'google',
    label: 'Google로 계속하기',
    className: 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  },
  {
    provider: 'kakao',
    label: '카카오로 계속하기',
    className: 'border-[#f6df36] bg-[#f6df36] text-slate-950 hover:bg-[#f1d900]',
  },
  {
    provider: 'naver',
    label: '네이버로 계속하기',
    className: 'border-[#03c75a] bg-[#03c75a] text-white hover:bg-[#02b351]',
  },
]

export default function ApplyPage() {
  const { apply, isSubmitting, isSuccess, reset } = useApplyReservationMutation()
  const { parent, isAuthenticated, logout } = useParentAuthStore()
  const [form, setForm] = useState<CreateReservationInput>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!parent) return

    setForm((current) => ({
      ...current,
      parentName: current.parentName || parent.name || '',
      parentEmail: current.parentEmail || parent.email || '',
    }))
  }, [parent])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = CreateReservationInputSchema.safeParse(form)
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
      await apply(result.data)
      setForm(emptyForm)
    } catch {
      setSubmitError('신청 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  function applyAgain() {
    reset()
    setForm({
      ...emptyForm,
      parentName: parent?.name ?? '',
      parentEmail: parent?.email ?? '',
    })
  }

  function startSocialLogin(provider: OAuthProvider) {
    window.location.href = socialLoginStartUrl(provider, '/apply')
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <p className="text-sm font-semibold text-brand-700">수업 신청</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">보호자 계정으로 로그인해 주세요</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            신청 내역과 그룹 편성 안내를 정확히 연결하기 위해 Google, 카카오, 네이버 계정 중
            하나로 로그인한 뒤 신청을 받을게요.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">소셜 로그인</h2>
          <div className="mt-4 grid gap-3">
            {SOCIAL_PROVIDERS.map((item) => (
              <button
                key={item.provider}
                type="button"
                onClick={() => startSocialLogin(item.provider)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${item.className}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            로그인 후 이름과 이메일이 신청서에 자동 입력되며, 실제 보호자 정보에 맞게 수정할 수
            있습니다.
          </p>
        </section>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">접수 완료</h1>
        <p className="mt-3 text-sm text-slate-600">
          수업 신청이 접수되었습니다. 비슷한 신청이 모이면 그룹 편성 결과를 이메일로 안내드리겠습니다.
        </p>
        <button
          type="button"
          onClick={applyAgain}
          className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          다시 신청하기
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">수업 신청</h1>
      <p className="mt-2 text-sm text-slate-600">
        그룹을 직접 모으지 못하셨다면, 아래 정보를 남겨 주세요. 비슷한 희망 시간대의 신청이 모이면
        그룹을 편성해 안내드립니다.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{parent?.name ?? parent?.email ?? '보호자'}</span>
          님 계정으로 신청합니다.
        </p>
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          다른 계정으로 로그인
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          아이 이름
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.childName}
            onChange={(e) => setForm({ ...form, childName: e.target.value })}
          />
          {fieldErrors.childName && (
            <span className="text-xs text-red-600">{fieldErrors.childName}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          나이(만)
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.childAge}
            onChange={(e) => setForm({ ...form, childAge: Number(e.target.value) })}
          >
            {CHILD_AGE_OPTIONS.map((age) => (
              <option key={age} value={age}>
                만 {age}세
              </option>
            ))}
          </select>
          {fieldErrors.childAge && (
            <span className="text-xs text-red-600">{fieldErrors.childAge}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          보호자 이름
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.parentName}
            onChange={(e) => setForm({ ...form, parentName: e.target.value })}
          />
          {fieldErrors.parentName && (
            <span className="text-xs text-red-600">{fieldErrors.parentName}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          이메일
          <input
            type="email"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.parentEmail}
            onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
          />
          {fieldErrors.parentEmail && (
            <span className="text-xs text-red-600">{fieldErrors.parentEmail}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          전화번호(선택)
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.parentPhone}
            onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          희망 요일
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.preferredDayOfWeek}
            onChange={(e) => setForm({ ...form, preferredDayOfWeek: e.target.value as CreateReservationInput['preferredDayOfWeek'] })}
          >
            {DAY_OF_WEEK_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {DAY_OF_WEEK_LABELS[day]}
              </option>
            ))}
          </select>
          {fieldErrors.preferredDayOfWeek && (
            <span className="text-xs text-red-600">{fieldErrors.preferredDayOfWeek}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          희망 시간
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.preferredHour}
            onChange={(e) => setForm({ ...form, preferredHour: Number(e.target.value) })}
          >
            {HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {hourLabel(hour)}
              </option>
            ))}
          </select>
          {fieldErrors.preferredHour && (
            <span className="text-xs text-red-600">{fieldErrors.preferredHour}</span>
          )}
        </label>

        <label className="col-span-full flex flex-col gap-1 text-sm text-slate-700">
          요청사항(선택)
          <textarea
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </label>

        {submitError && <p className="col-span-full text-sm text-red-600">{submitError}</p>}

        <div className="col-span-full">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            신청하기
          </button>
        </div>
      </form>
    </div>
  )
}
