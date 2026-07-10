import { useMemo, useState, type FormEvent } from 'react'
import { useReservationsQuery } from '../../hooks/useReservationsQuery'
import { useReservationGroupsQuery } from '../../hooks/useReservationGroupsQuery'
import { useReservationMutations } from '../../hooks/useReservationMutations'
import { useReservationGroupMutations } from '../../hooks/useReservationGroupMutations'
import { Reservation, UpdateReservationInput } from '../../../../api/schemas/reservation.schema'
import {
  CreateReservationGroupInputSchema,
  ReservationGroup,
  UpdateReservationGroupInput,
} from '../../../../api/schemas/reservation-group.schema'
import { useReservationTimetable } from './useReservationTimetable'
import { DayOfWeek, ReservationGroupFormState, SelectedSlot } from '../types'
import {
  ADMIN_ROW_MINUTES,
  findSlotGap,
  groupSlotsDeduped,
  joinableSlotsForAllDays,
  joinableSlotsForDay,
  mergeContiguousSlots,
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
  const { deleteReservation, updateReservation, isUpdating } = useReservationMutations()
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
  const [groupForm, setGroupForm] = useState<ReservationGroupFormState>(emptyGroupForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [blankGroupFieldErrors, setBlankGroupFieldErrors] = useState<Record<string, string>>({})
  const [blankGroupSubmitError, setBlankGroupSubmitError] = useState<string | null>(null)
  const [detailReservationId, setDetailReservationId] = useState<string | null>(null)
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null)

  const waiting = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'WAITING'),
    [reservations],
  )

  const { getCellReservations, groupByReservationId, joinableGroupsForReservation } =
    useReservationTimetable(waiting, groups)

  // 확정됐지만 아직 확정 시간(slots)이 없는 그룹 — 상단 그리드는 slots 기준으로만 렌더되므로
  // 이 그룹들은 별도의 "시간 미정" 영역에서 드롭 타겟으로 보여줘야 학생을 채워 넣을 수 있다.
  const unscheduledGroups = useMemo(
    () => groups.filter((group) => group.status === 'CONFIRMED' && group.slots.length === 0),
    [groups],
  )

  const selectedReservationIds = [...new Set(Array.from(selectedSlots.values()).map((slot) => slot.reservationId))]
  const selectedAges = selectedReservationIds
      .map((id) => reservations.find((r) => r.id === id)?.childAge)
      .filter((age): age is number => age !== undefined)
  const totalMemberCount = selectedReservationIds.length
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



  async function handleConfirmGroup(event: FormEvent) {
    event.preventDefault()

    const gapSlot = findSlotGap(Array.from(selectedSlots.values()))
    if (gapSlot) {
      window.alert(
        `${gapSlot.childName}의 선택한 시간 사이에 빈 시간이 있습니다. 이어지는 시간만 그룹으로 묶을 수 있습니다.`,
      )
      return
    }



    const input = {
      label: groupForm.label,
      capacity: groupCapacity,
      minAge: groupMinAge,
      maxAge: groupMaxAge,
      slots: mergeContiguousSlots(
        Array.from(selectedSlots.values()).map(({ reservationId, dayOfWeek, startMinute, endMinute }) => ({
          reservationId,
          dayOfWeek,
          startMinute,
          endMinute,
        })),
      ),
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

  async function handleCreateBlankGroup(input: {
    label: string
    capacity: number
    minAge?: number
    maxAge?: number
  }): Promise<boolean> {
    const result = CreateReservationGroupInputSchema.safeParse({ ...input, slots: [] })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setBlankGroupFieldErrors(errors)
      return false
    }
    setBlankGroupFieldErrors({})
    setBlankGroupSubmitError(null)

    try {
      await createGroup(result.data)
      return true
    } catch {
      setBlankGroupSubmitError('그룹 생성에 실패했습니다.')
      return false
    }
  }

  async function handleUpdateReservation(id: string, input: UpdateReservationInput) {
    await updateReservation(id, input)
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
    const existingSlots = groupSlotsDeduped(toGroup)
    // 대상 그룹에 아직 확정된 시간이 없으면(막 만든 빈 그룹), 겹침을 따질 필요 없이
    // 이동하는 학생의 희망 시간을 그대로 그 그룹의 첫 확정 시간으로 채택한다.
    const slots =
      existingSlots.length > 0
        ? existingSlots
        : reservation.preferredSlots.map(({ dayOfWeek, startMinute, endMinute }) => ({
            dayOfWeek,
            startMinute,
            endMinute,
          }))
    if (slots.length === 0) {
      window.alert('이동할 시간 정보가 없어 이동할 수 없습니다.')
      return
    }

    try {
      await moveMember(reservation.id, fromGroup.id, toGroup.id, slots)
    } catch {
      window.alert('그룹 이동에 실패했습니다.')
    }
  }

  async function handleMoveMemberById(reservationId: string, fromGroupId: string, toGroupId: string) {
    if (fromGroupId === toGroupId) return

    const fromGroup = groups.find((g) => g.id === fromGroupId)
    const toGroup = groups.find((g) => g.id === toGroupId)
    const reservation =
      fromGroup?.reservations?.find((r) => r.id === reservationId) ??
      reservations.find((r) => r.id === reservationId)

    if (!reservation || !fromGroup || !toGroup) return

    await handleMoveMember(reservation, fromGroup, toGroup)
  }

  const detailGroup = groups.find((group) => group.id === detailGroupId) ?? null
  const detailReservation = reservations.find((r) => r.id === detailReservationId) ?? null

  function setDetailReservation(reservation: Reservation | null) {
    setDetailReservationId(reservation?.id ?? null)
  }

  return {
    ageFilter,
    setAgeFilter,
    isLoading,
    error,
    reservations,
    groups,
    unscheduledGroups,
    selectedSlots,
    groupForm,
    setGroupForm,
    fieldErrors,
    submitError,
    blankGroupFieldErrors,
    blankGroupSubmitError,
    detailReservation,
    setDetailReservation,
    detailGroup,
    isUpdating,
    isCreating,
    createError,
    isAddingMember,
    groupCapacity,
    groupMinAge,
    groupMaxAge,
    selectedReservationCount: selectedReservationIds.length,
    getCellReservations,
    groupByReservationId,
    joinableGroupsForReservation,
    requestedReservationsForGroup,
    toggleSlot,
    removeSlot,
    selectCell,
    handleConfirmGroup,
    handleCreateBlankGroup,
    handleUpdateReservation,
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
    handleMoveMemberById,
  }
}
