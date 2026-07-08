'use client'

import { useState } from 'react'
import { DAY_OF_WEEK_LABELS, timeRangeLabel, type PreferredSlot } from '../../../../api/schemas/reservation.schema'
import PreferredSlotsPicker from '../../../../components/PreferredSlotsPicker'
import { WalkInMemberDraft } from '../types'
import { fieldClass, labelClass, errorClass } from '../styles'

type Props = {
  members: WalkInMemberDraft[]
  onAddMember: (draft: Omit<WalkInMemberDraft, 'localId'>) => void
  onRemoveMember: (localId: string) => void
}

const emptyDraft = {
  parentName: '',
  childName: '',
  childAge: '' as number | '',
  parentEmail: '',
  parentPhone: '',
}

export default function WalkInMemberForm({ members, onAddMember, onRemoveMember }: Props) {
  const [draft, setDraft] = useState(emptyDraft)
  const [slots, setSlots] = useState<PreferredSlot[]>([])
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
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

    onAddMember({
      parentName: draft.parentName.trim(),
      childName: draft.childName.trim(),
      childAge: Number(draft.childAge),
      parentEmail: draft.parentEmail.trim() || undefined,
      parentPhone: draft.parentPhone.trim() || undefined,
      slots,
    })
    setDraft(emptyDraft)
    setSlots([])
    setError(null)
  }

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-dashed border-[#f2dfb9] bg-[#fffaf0] p-5">
      <div>
        <p className="text-sm font-black text-[#e86f00]">직접 추가</p>
        <p className="mt-1 text-xs font-semibold text-[#6f6253]">
          아직 신청이 없는 학부모·자녀를 직접 입력해 그룹에 포함할 수 있습니다.
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
          className="inline-flex h-10 items-center justify-center rounded-full border border-[#ff8a1f] bg-white px-5 text-sm font-black text-[#e86f00] transition hover:bg-[#fff3c8]"
        >
          멤버 추가
        </button>
      </div>

      {members.length > 0 && (
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li
              key={member.localId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f2dfb9] bg-white px-4 py-2.5"
            >
              <div>
                <p className="text-sm font-black text-[#222222]">
                  {member.childName} <span className="font-semibold text-[#6f6253]">(만 {member.childAge}세)</span> ·{' '}
                  <span className="font-semibold text-[#6f6253]">{member.parentName}</span>
                </p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {member.slots.map((slot, index) => (
                    <li
                      key={`${member.localId}-${index}`}
                      className="rounded-full bg-[#fff3c8] px-2.5 py-0.5 text-xs font-bold text-[#9f4d00]"
                    >
                      {DAY_OF_WEEK_LABELS[slot.dayOfWeek]} {timeRangeLabel(slot.startMinute, slot.endMinute)}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMember(member.localId)}
                aria-label="직접 추가한 멤버 삭제"
                className="text-sm font-black text-[#d6452f] hover:text-[#b23a26]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
