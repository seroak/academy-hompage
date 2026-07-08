import { useMemo, useCallback } from 'react'
import { Reservation } from '../../../../api/schemas/reservation.schema'
import { ReservationGroup } from '../../../../api/schemas/reservation-group.schema'
import { DayOfWeek } from '../types'
import { ADMIN_ROW_MINUTES, isGroupJoinableForReservation } from '../utils/reservationAdminUtils'

export function useReservationTimetable(waiting: Reservation[], groups: ReservationGroup[]) {
  const cellMap = useMemo(() => {
    const map = new Map<string, { waitingInCell: Reservation[]; groupedInCell: Reservation[] }>()

    const getCell = (day: string, rowStart: number) => {
      const key = `${day}-${rowStart}`
      if (!map.has(key)) {
        map.set(key, { waitingInCell: [], groupedInCell: [] })
      }
      return map.get(key)!
    }

    for (const r of waiting) {
      for (const slot of r.preferredSlots) {
        const startRow = Math.floor(slot.startMinute / ADMIN_ROW_MINUTES) * ADMIN_ROW_MINUTES
        const endRow = Math.ceil(slot.endMinute / ADMIN_ROW_MINUTES) * ADMIN_ROW_MINUTES

        for (let rowStart = startRow; rowStart < endRow; rowStart += ADMIN_ROW_MINUTES) {
          if (rowStart < slot.endMinute && rowStart + ADMIN_ROW_MINUTES > slot.startMinute) {
            const cell = getCell(slot.dayOfWeek, rowStart)
            if (!cell.waitingInCell.find((existing) => existing.id === r.id)) {
              cell.waitingInCell.push(r)
            }
          }
        }
      }
    }

    for (const group of groups) {
      if (group.status !== 'CONFIRMED') continue

      const reservationById = new Map((group.reservations ?? []).map((r) => [r.id, r]))

      for (const slot of group.slots) {
        const reservation = reservationById.get(slot.reservationId)
        if (!reservation) continue

        const startRow = Math.floor(slot.startMinute / ADMIN_ROW_MINUTES) * ADMIN_ROW_MINUTES
        const endRow = Math.ceil(slot.endMinute / ADMIN_ROW_MINUTES) * ADMIN_ROW_MINUTES

        for (let rowStart = startRow; rowStart < endRow; rowStart += ADMIN_ROW_MINUTES) {
          if (rowStart < slot.endMinute && rowStart + ADMIN_ROW_MINUTES > slot.startMinute) {
            const cell = getCell(slot.dayOfWeek, rowStart)
            if (!cell.groupedInCell.find((existing) => existing.id === reservation.id)) {
              cell.groupedInCell.push(reservation)
            }
          }
        }
      }
    }

    return map
  }, [waiting, groups])

  const getCellReservations = useCallback(
    (day: string, rowStart: number) => {
      const key = `${day}-${rowStart}`
      return cellMap.get(key) || { waitingInCell: [], groupedInCell: [] }
    },
    [cellMap],
  )

  const groupLabelByReservationId = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of groups) {
      for (const reservation of group.reservations ?? []) {
        map.set(reservation.id, group.label)
      }
    }
    return map
  }, [groups])

  const joinableGroupsForReservation = useCallback(
    (reservation: Reservation, day: DayOfWeek) =>
      groups.filter((group) => isGroupJoinableForReservation(group, reservation, day)),
    [groups],
  )

  return { getCellReservations, groupLabelByReservationId, joinableGroupsForReservation }
}
