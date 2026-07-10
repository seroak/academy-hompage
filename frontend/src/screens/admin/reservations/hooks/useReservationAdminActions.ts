import { Reservation, UpdateReservationInput } from '../../../../api/schemas/reservation.schema'
import { ReservationGroup, UpdateReservationGroupInput } from '../../../../api/schemas/reservation-group.schema'
import { DayOfWeek } from '../types'
import { joinableSlotsForDay, joinableSlotsForAllDays, groupSlotsDeduped } from '../utils/reservationAdminUtils'

export function useReservationAdminActions(
  reservations: Reservation[],
  groups: ReservationGroup[],
  mutations: {
    updateReservation: (id: string, input: UpdateReservationInput) => Promise<any>
    deleteReservation: (id: string) => Promise<any>
    addMember: (groupId: string, input: any) => Promise<any>
    deleteGroup: (id: string) => Promise<any>
    updateGroup: (groupId: string, patch: UpdateReservationGroupInput) => Promise<any>
    removeMember: (groupId: string, reservationId: string) => Promise<any>
    replaceMemberSlots: (groupId: string, reservationId: string, input: any) => Promise<any>
    moveMember: (reservationId: string, fromGroupId: string, toGroupId: string, slots: any[]) => Promise<any>
  },
  onReservationDeleted: (id: string) => void
) {
  const {
    updateReservation,
    deleteReservation,
    addMember,
    deleteGroup,
    updateGroup,
    removeMember,
    replaceMemberSlots,
    moveMember,
  } = mutations

  async function handleUpdateReservation(id: string, input: UpdateReservationInput) {
    await updateReservation(id, input)
  }

  async function handleCancelReservation(id: string) {
    if (!window.confirm('이 신청을 취소하시겠습니까?')) return
    try {
      await deleteReservation(id)
      onReservationDeleted(id)
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

  return {
    handleUpdateReservation,
    handleCancelReservation,
    handleAddToGroup,
    requestedReservationsForGroup,
    handleApproveRequest,
    handleCancelGroup,
    handleUpdateGroupInfo,
    handleRemoveMember,
    handleReplaceMemberSlots,
    handleMoveMember,
    handleMoveMemberById,
  }
}
