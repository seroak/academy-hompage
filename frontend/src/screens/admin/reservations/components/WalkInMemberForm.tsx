'use client'

import { useState } from 'react'
import { type PreferredSlot } from '../../../../api/schemas/reservation.schema'
import PreferredSlotsPicker from '../../../../components/PreferredSlotsPicker'


import { fieldClass, labelClass, errorClass } from '../styles'
import { useReservationMutations } from '../../hooks/useReservationMutations'

const emptyDraft = {
  parentName: '',
  childName: '',
  childAge: '' as number | '',
  parentEmail: '',
  parentPhone: '',
}

export default function WalkInMemberForm() {
  const [draft, setDraft] = useState(emptyDraft)
  const [slots, setSlots] = useState<PreferredSlot[]>([])
  const [error, setError] = useState<string | null>(null)

  const { createWalkInReservation, isCreatingWalkIn } = useReservationMutations()

  async function handleAdd() {
    if (!draft.parentName.trim() || !draft.childName.trim() || draft.childAge === '') {
      setError('보호자 이름·자녀 이름·나이를 입력해 주세요.')
      return
    }
    if (slots.length === 0) {
      setError('시간을 1개 이상 선택해 주세요.')
      return
    }
    if (draft.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.parentEmail)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }

    try {
      await createWalkInReservation({
        parentName: draft.parentName.trim(),
        childName: draft.childName.trim(),
        childAge: Number(draft.childAge),
        parentEmail: draft.parentEmail.trim() || undefined,
        parentPhone: draft.parentPhone.trim() || undefined,
        preferredSlots: slots,
      })
      window.alert('학생이 성공적으로 등록되었습니다. 예약 관리 창에서 확인하세요.')
      setDraft(emptyDraft)
      setSlots([])
      setError(null)
    } catch {
      setError('학생을 등록하지 못했습니다. 다시 시도해 주세요.')
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-dashed border-[#f2dfb9] bg-[#fffaf0] p-5">
      <div>
        <p className="text-sm font-black text-[#e86f00]">직접 추가</p>
        <p className="mt-1 text-xs font-semibold text-[#6f6253]">
          아직 신청이 없는 학부모·자녀를 직접 입력해 등록합니다. 등록 후 예약 관리 탭에서 시간표를 클릭해 그룹에 포함할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          보호자 이름
          <input
            className={fieldClass}
            value={draft.parentName}
            onChange={(e) => setDraft({ ...draft, parentName: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          자녀 이름
          <input
            className={fieldClass}
            value={draft.childName}
            onChange={(e) => setDraft({ ...draft, childName: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          나이(만)
          <input
            type="number"
            min={4}
            max={10}
            className={fieldClass}
            value={draft.childAge}
            onChange={(e) => setDraft({ ...draft, childAge: e.target.value === '' ? '' : Number(e.target.value) })}
          />
        </label>
        <label className={labelClass}>
          이메일(선택)
          <input
            type="email"
            className={fieldClass}
            value={draft.parentEmail}
            onChange={(e) => setDraft({ ...draft, parentEmail: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          연락처(선택)
          <input
            className={fieldClass}
            value={draft.parentPhone}
            onChange={(e) => setDraft({ ...draft, parentPhone: e.target.value })}
          />
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs font-black text-[#6f6253]">희망 시간</p>
        <PreferredSlotsPicker value={slots} onChange={setSlots} />
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isCreatingWalkIn}
          className="inline-flex h-10 items-center justify-center rounded-full bg-[#ff8a1f] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(255,138,31,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e86f00] disabled:translate-y-0 disabled:opacity-50"
        >
          {isCreatingWalkIn ? '등록 중...' : '학생 등록'}
        </button>
      </div>
    </div>
  )
}
