import { useState, type FormEvent } from 'react'
import { useReservationsQuery } from '../../hooks/useReservationsQuery'
import { useReservationGroupsQuery } from '../../hooks/useReservationGroupsQuery'
import { useReservationMutations } from '../../hooks/useReservationMutations'
import { useReservationGroupMutations } from '../../hooks/useReservationGroupMutations'
import { Reservation } from '../../../../api/schemas/reservation.schema'
import {
  CreateReservationGroupInputSchema,
  ReservationGroup,
  UpdateReservationGroupInput,
} from '../../../../api/schemas/reservation-group.schema'
import { useReservationStats } from './useReservationStats'
import { useReservationTimetable } from './useReservationTimetable'
import { DayOfWeek, ReservationGroupFormState, SelectedSlot, WalkInMemberDraft } from '../types'
import {
  ADMIN_ROW_MINUTES,
  findSlotGap,
  joinableSlotsForAllDays,
  joinableSlotsForDay,
  slotKey,
} from '../utils/reservationAdminUtils'

const emptyGroupForm: ReservationGroupFormState = {
  label: '',
}

export function useReservationAdminState() {
  const [ageFilter, setAgeFilter] = useState<number | undefined>(undefined)
  const { reservations, isLoading, error } = useReservationsQuery(
    ageFilter !== undefined ? { age: ageFilter } : {},
  )
  const { groups } = useReservationGroupsQuery()
  const { deleteReservation, createWalkInReservation } = useReservationMutations()
  const {
    createGroup,
    deleteGroup,
    addMember,
    updateGroup,
    removeMember,
    replaceMemberSlots,
    moveMember,
    isCreating,
    createError,
    isAddingMember,
  } = useReservationGroupMutations()

  const [selectedSlots, setSelectedSlots] = useState<Map<string, SelectedSlot>>(new Map())
  const [walkInMembers, setWalkInMembers] = useState<WalkInMemberDraft[]>([])
  const [groupForm, setGroupForm] = useState<ReservationGroupFormState>(emptyGroupForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null)
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null)

  const { waiting, statCards } = useReservationStats(reservations, groups)

  const { getCellReservations, groupLabelByReservationId, joinableGroupsForReservation } =
    useReservationTimetable(waiting, groups)

  const selectedReservationIds = [...new Set(Array.from(selectedSlots.values()).map((slot) => slot.reservationId))]
  const selectedAges = [
    ...selectedReservationIds
      .map((id) => reservations.find((r) => r.id === id)?.childAge)
      .filter((age): age is number => age !== undefined),
    ...walkInMembers.map((member) => member.childAge),
  ]
  const totalMemberCount = selectedReservationIds.length + walkInMembers.length
  const groupCapacity = groupForm.capacityOverride ?? Math.max(totalMemberCount, 1)
  const groupMinAge = groupForm.minAgeOverride ?? (selectedAges.length > 0 ? Math.min(...selectedAges) : undefined)
  const groupMaxAge = groupForm.maxAgeOverride ?? (selectedAges.length > 0 ? Math.max(...selectedAges) : undefined)

  function toggleSlot(reservation: Reservation, day: DayOfWeek, rowStart: number) {
    const key = slotKey(reservation.id, day, rowStart)
    setSelectedSlots((prev) => {
      const next = new Map(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.set(key, {
          reservationId: reservation.id,
          childName: reservation.childName,
          dayOfWeek: day,
          startMinute: rowStart,
          endMinute: rowStart + ADMIN_ROW_MINUTES,
        })
      }
      return next
    })
  }

  function removeSlot(key: string) {
    setSelectedSlots((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }

  function selectCell(day: DayOfWeek, rowStart: number) {
    const { waitingInCell } = getCellReservations(day, rowStart)
    setSelectedSlots((prev) => {
      const next = new Map(prev)
      for (const reservation of waitingInCell) {
        const key = slotKey(reservation.id, day, rowStart)
        next.set(key, {
          reservationId: reservation.id,
          childName: reservation.childName,
          dayOfWeek: day,
          startMinute: rowStart,
          endMinute: rowStart + ADMIN_ROW_MINUTES,
        })
      }
      return next
    })
  }

  function addWalkInMember(draft: Omit<WalkInMemberDraft, 'localId'>) {
    setWalkInMembers((prev) => [...prev, { ...draft, localId: crypto.randomUUID() }])
  }

  function removeWalkInMember(localId: string) {
    setWalkInMembers((prev) => prev.filter((member) => member.localId !== localId))
  }

  async function handleConfirmGroup(event: FormEvent) {
    event.preventDefault()

    const gapSlot = findSlotGap(Array.from(selectedSlots.values()))
    if (gapSlot) {
      window.alert(
        `${gapSlot.childName}의 선택한 시간 사이에 빈 시간이 있습니다. 이어지는 시간만 그룹으로 묶을 수 있습니다.`,
      )
      return
    }

    for (const member of walkInMembers) {
      const memberGap = findSlotGap(
        member.slots.map((slot) => ({ ...slot, reservationId: member.localId, childName: member.childName })),
      )
      if (memberGap) {
        window.alert(
          `${memberGap.childName}의 선택한 시간 사이에 빈 시간이 있습니다. 이어지는 시간만 그룹으로 묶을 수 있습니다.`,
        )
        return
      }
    }

    // 워크인 멤버는 실제 Reservation으로 먼저 만든 뒤, 즉시 selectedSlots에 편입해 상태를 확정한다.
    // 이렇게 해야 이후 라벨 검증 실패나 그룹 확정 API 실패로 재시도하더라도
    // 이미 만든 워크인 예약을 중복 생성하지 않고 선택된 슬롯으로 그대로 재사용할 수 있다.
    let workingSlots = selectedSlots

    if (walkInMembers.length > 0) {
      try {
        const created = await Promise.all(
          walkInMembers.map((member) =>
            createWalkInReservation({
              childName: member.childName,
              childAge: member.childAge,
              parentName: member.parentName,
              parentEmail: member.parentEmail,
              parentPhone: member.parentPhone,
              preferredSlots: member.slots,
            }).then((reservation) => ({ reservation, member })),
          ),
        )
        const next = new Map(selectedSlots)
        for (const { reservation, member } of created) {
          member.slots.forEach((slot, index) => {
            next.set(`walkin-${reservation.id}-${index}`, {
              reservationId: reservation.id,
              childName: member.childName,
              dayOfWeek: slot.dayOfWeek,
              startMinute: slot.startMinute,
              endMinute: slot.endMinute,
            })
          })
        }
        workingSlots = next
        setSelectedSlots(next)
        setWalkInMembers([])
      } catch {
        setSubmitError('직접 추가한 멤버를 등록하지 못해 그룹을 만들지 못했습니다.')
        return
      }
    }

    const input = {
      label: groupForm.label,
      capacity: groupCapacity,
      minAge: groupMinAge,
      maxAge: groupMaxAge,
      slots: Array.from(workingSlots.values()).map(({ reservationId, dayOfWeek, startMinute, endMinute }) => ({
        reservationId,
        dayOfWeek,
        startMinute,
        endMinute,
      })),
    }
    const result = CreateReservationGroupInputSchema.safeParse(input)
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
      await createGroup(result.data)
      setSelectedSlots(new Map())
      setGroupForm(emptyGroupForm)
    } catch {
      setSubmitError('그룹 확정에 실패했습니다.')
    }
  }

  async function handleCancelReservation(id: string) {
    if (!window.confirm('이 신청을 취소하시겠습니까?')) return
    try {
      await deleteReservation(id)
      setSelectedSlots((prev) => {
        const next = new Map(prev)
        for (const key of next.keys()) {
          if (key.startsWith(`${id}-`)) next.delete(key)
        }
        return next
      })
    } catch {
      window.alert('신청을 취소하지 못했습니다.')
    }
  }

  async function handleAddToGroup(reservation: Reservation, group: ReservationGroup, day: DayOfWeek) {
    const slots = joinableSlotsForDay(reservation, group, day)
    if (slots.length === 0) return
    if (!window.confirm(`${reservation.childName} 학생을 "${group.label}" 그룹에 추가하시겠습니까?`)) return

    try {
      await addMember(group.id, { reservationId: reservation.id, slots })
    } catch {
      window.alert('그룹에 추가하지 못했습니다.')
    }
  }

  function requestedReservationsForGroup(groupId: string): Reservation[] {
    return reservations.filter((r) => r.status === 'WAITING' && r.requestedGroupId === groupId)
  }

  async function handleApproveRequest(reservation: Reservation, group: ReservationGroup) {
    const slots = joinableSlotsForAllDays(reservation, group)
    if (slots.length === 0) {
      window.alert('희망 시간이 그룹의 확정 시간과 겹치지 않아 자동으로 편입할 수 없습니다. 시간표에서 직접 추가해 주세요.')
      return
    }
    if (!window.confirm(`${reservation.childName} 학생의 "${group.label}" 합류 희망을 승인하시겠습니까?`)) return

    try {
      await addMember(group.id, { reservationId: reservation.id, slots })
    } catch {
      window.alert('합류 승인에 실패했습니다.')
    }
  }

  async function handleCancelGroup(id: string) {
    if (!window.confirm('이 그룹을 취소하시겠습니까? 소속 신청은 다시 대기 상태로 돌아갑니다.')) return
    try {
      await deleteGroup(id)
    } catch {
      window.alert('그룹을 취소하지 못했습니다.')
    }
  }

  function openGroupDetail(groupId: string) {
    setDetailGroupId(groupId)
  }

  function closeGroupDetail() {
    setDetailGroupId(null)
  }

  async function handleUpdateGroupInfo(groupId: string, patch: UpdateReservationGroupInput) {
    try {
      await updateGroup(groupId, patch)
    } catch {
      window.alert('그룹 정보를 수정하지 못했습니다.')
    }
  }

  async function handleRemoveMember(groupId: string, reservation: Reservation) {
    if (
      !window.confirm(
        `${reservation.childName} 학생을 이 그룹에서 빼시겠습니까? 다시 대기 상태로 돌아갑니다.`,
      )
    )
      return
    try {
      await removeMember(groupId, reservation.id)
    } catch {
      window.alert('멤버를 제외하지 못했습니다.')
    }
  }

  async function handleReplaceMemberSlots(
    groupId: string,
    reservationId: string,
    slots: { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[],
  ) {
    try {
      await replaceMemberSlots(groupId, reservationId, { slots })
    } catch {
      window.alert('시간을 수정하지 못했습니다.')
    }
  }

  async function handleMoveMember(reservation: Reservation, fromGroup: ReservationGroup, toGroup: ReservationGroup) {
    const slots = joinableSlotsForAllDays(reservation, toGroup)
    if (slots.length === 0) {
      window.alert('희망 시간이 대상 그룹의 확정 시간과 겹치지 않아 이동할 수 없습니다.')
      return
    }
    if (!window.confirm(`${reservation.childName} 학생을 "${toGroup.label}" 그룹으로 이동하시겠습니까?`)) return

    try {
      await moveMember(reservation.id, fromGroup.id, toGroup.id, slots)
    } catch {
      window.alert('그룹 이동에 실패했습니다.')
    }
  }

  const detailGroup = groups.find((group) => group.id === detailGroupId) ?? null

  return {
    ageFilter,
    setAgeFilter,
    isLoading,
    error,
    reservations,
    groups,
    selectedSlots,
    walkInMembers,
    groupForm,
    setGroupForm,
    fieldErrors,
    submitError,
    detailReservation,
    setDetailReservation,
    detailGroup,
    isCreating,
    createError,
    isAddingMember,
    groupCapacity,
    groupMinAge,
    groupMaxAge,
    selectedReservationCount: selectedReservationIds.length,
    statCards,
    getCellReservations,
    groupLabelByReservationId,
    joinableGroupsForReservation,
    requestedReservationsForGroup,
    toggleSlot,
    removeSlot,
    selectCell,
    addWalkInMember,
    removeWalkInMember,
    handleConfirmGroup,
    handleCancelReservation,
    handleCancelGroup,
    handleAddToGroup,
    handleApproveRequest,
    openGroupDetail,
    closeGroupDetail,
    handleUpdateGroupInfo,
    handleRemoveMember,
    handleReplaceMemberSlots,
    handleMoveMember,
  }
}
