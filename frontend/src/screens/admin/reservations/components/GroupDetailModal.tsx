'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { DAY_OF_WEEK_LABELS, Reservation, timeRangeLabel, type PreferredSlot } from '../../../../api/schemas/reservation.schema'
import { ReservationGroup, UpdateReservationGroupInput } from '../../../../api/schemas/reservation-group.schema'
import PreferredSlotsPicker from '../../../../components/PreferredSlotsPicker'

type MemberSlotInput = { dayOfWeek: PreferredSlot['dayOfWeek']; startMinute: number; endMinute: number }

type GroupInfoDraft = {
  label: string
  capacity: number
  minAge: number
  maxAge: number
}

type Props = {
  group: ReservationGroup | null
  allGroups: ReservationGroup[]
  waitingReservations: Reservation[]
  onClose: () => void
  onUpdateGroup: (groupId: string, patch: UpdateReservationGroupInput) => void
  onRemoveMember: (groupId: string, reservation: Reservation) => void
  onReplaceMemberSlots: (groupId: string, reservationId: string, slots: MemberSlotInput[]) => void
  onMoveMember: (reservation: Reservation, fromGroup: ReservationGroup, toGroup: ReservationGroup) => void
  onAddMember: (reservation: Reservation, group: ReservationGroup) => void
}

export default function GroupDetailModal({
  group,
  allGroups,
  waitingReservations,
  onClose,
  onUpdateGroup,
  onRemoveMember,
  onReplaceMemberSlots,
  onMoveMember,
  onAddMember,
}: Props) {
  const [infoDraft, setInfoDraft] = useState<GroupInfoDraft | null>(null)
  const [editingSlotsFor, setEditingSlotsFor] = useState<string | null>(null)
  const [slotDraft, setSlotDraft] = useState<PreferredSlot[]>([])

  if (!group) return null
  const activeGroup = group

  const info: GroupInfoDraft =
    infoDraft ?? { label: group.label, capacity: group.capacity, minAge: group.minAge, maxAge: group.maxAge }
  const members = group.reservations ?? []

  const slotsByMember = new Map<string, ReservationGroup['slots']>()
  for (const slot of group.slots) {
    const list = slotsByMember.get(slot.reservationId) ?? []
    list.push(slot)
    slotsByMember.set(slot.reservationId, list)
  }

  const otherGroups = allGroups.filter((candidate) => candidate.id !== group.id && candidate.status === 'CONFIRMED')
  const eligibleWaiting = waitingReservations.filter(
    (reservation) => reservation.childAge >= group.minAge && reservation.childAge <= group.maxAge,
  )

  function startEditingSlots(reservationId: string) {
    const current: PreferredSlot[] = (slotsByMember.get(reservationId) ?? []).map((slot) => ({
      dayOfWeek: slot.dayOfWeek as PreferredSlot['dayOfWeek'],
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
    }))
    setSlotDraft(current)
    setEditingSlotsFor(reservationId)
  }

  function saveSlots() {
    if (!editingSlotsFor) return
    if (slotDraft.length === 0) {
      window.alert('시간을 1개 이상 선택해 주세요.')
      return
    }
    onReplaceMemberSlots(
      activeGroup.id,
      editingSlotsFor,
      slotDraft.map(({ dayOfWeek, startMinute, endMinute }) => ({ dayOfWeek, startMinute, endMinute })),
    )
    setEditingSlotsFor(null)
  }

  function saveInfo() {
    onUpdateGroup(activeGroup.id, info)
    setInfoDraft(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-black text-[#222222]">그룹 상세</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#fff9ec] p-4">
          <label className="col-span-2 text-xs font-bold text-[#6f6253]">
            그룹 이름
            <input
              value={info.label}
              onChange={(event) => setInfoDraft({ ...info, label: event.target.value })}
              className="mt-1 w-full rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
            />
          </label>
          <label className="text-xs font-bold text-[#6f6253]">
            정원
            <input
              type="number"
              min={1}
              value={info.capacity}
              onChange={(event) => setInfoDraft({ ...info, capacity: Number(event.target.value) })}
              className="mt-1 w-full rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
            />
          </label>
          <div className="flex gap-2">
            <label className="flex-1 text-xs font-bold text-[#6f6253]">
              최소 연령
              <input
                type="number"
                min={4}
                max={10}
                value={info.minAge}
                onChange={(event) => setInfoDraft({ ...info, minAge: Number(event.target.value) })}
                className="mt-1 w-full rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
              />
            </label>
            <label className="flex-1 text-xs font-bold text-[#6f6253]">
              최대 연령
              <input
                type="number"
                min={4}
                max={10}
                value={info.maxAge}
                onChange={(event) => setInfoDraft({ ...info, maxAge: Number(event.target.value) })}
                className="mt-1 w-full rounded-lg border border-[#f2dfb9] px-3 py-2 text-sm font-semibold text-[#222222]"
              />
            </label>
          </div>
          {infoDraft && (
            <div className="col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInfoDraft(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveInfo}
                className="rounded-full bg-[#e86f00] px-3 py-1.5 text-xs font-black text-white"
              >
                저장
              </button>
            </div>
          )}
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-black text-[#222222]">
            멤버 ({members.length}/{group.capacity}명)
          </h3>
          <ul className="mt-2 space-y-2">
            {members.length === 0 && (
              <li className="rounded-2xl border border-dashed border-[#f2dfb9] px-3 py-4 text-center text-xs font-semibold text-[#6f6253]">
                아직 편성된 멤버가 없습니다.
              </li>
            )}
            {members.map((member) => {
              const memberSlots = slotsByMember.get(member.id) ?? []
              const isEditing = editingSlotsFor === member.id
              return (
                <li key={member.id} className="rounded-2xl border border-[#f2dfb9] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#222222]">
                      {member.childName}{' '}
                      <span className="font-semibold text-[#6f6253]">(만 {member.childAge}세)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditingSlots(member.id)}
                        className="rounded-full border border-[#f2dfb9] px-3 py-1 text-xs font-bold text-[#9f4d00] transition hover:bg-[#fff3c8]"
                      >
                        시간 수정
                      </button>
                      {otherGroups.length > 0 && (
                        <select
                          defaultValue=""
                          onChange={(event) => {
                            const target = otherGroups.find((candidate) => candidate.id === event.target.value)
                            if (target) onMoveMember(member, group, target)
                            event.target.value = ''
                          }}
                          className="rounded-full border border-[#f2dfb9] px-2 py-1 text-xs font-bold text-[#9f4d00]"
                        >
                          <option value="" disabled>
                            다른 그룹으로 이동
                          </option>
                          {otherGroups.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.label}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveMember(group.id, member)}
                        className="rounded-full border border-[#ffd6cc] bg-[#fff5f1] px-3 py-1 text-xs font-black text-[#d6452f] transition hover:bg-[#ffe9e1]"
                      >
                        빼기
                      </button>
                    </div>
                  </div>
                  {!isEditing ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {memberSlots.map((slot) => (
                        <li
                          key={slot.id}
                          className="rounded-full bg-[#fff3c8] px-2.5 py-1 text-xs font-bold text-[#9f4d00]"
                        >
                          {DAY_OF_WEEK_LABELS[slot.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS] ?? slot.dayOfWeek}{' '}
                          {timeRangeLabel(slot.startMinute, slot.endMinute)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-3">
                      <PreferredSlotsPicker value={slotDraft} onChange={setSlotDraft} />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingSlotsFor(null)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={saveSlots}
                          className="rounded-full bg-[#e86f00] px-3 py-1.5 text-xs font-black text-white"
                        >
                          시간 저장
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {eligibleWaiting.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-black text-[#222222]">대기 중인 신청 추가</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {eligibleWaiting.map((reservation) => (
                <li key={reservation.id}>
                  <button
                    type="button"
                    onClick={() => onAddMember(reservation, group)}
                    className="rounded-full border border-[#9fd6a6] bg-[#eaf7ea] px-3 py-1 text-xs font-black text-[#2f7a3d] transition hover:bg-[#d9f0da]"
                  >
                    {reservation.childName} 추가
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
