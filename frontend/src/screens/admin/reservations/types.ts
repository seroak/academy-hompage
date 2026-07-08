import type { DAY_OF_WEEK_OPTIONS, PreferredSlot } from '../../../api/schemas/reservation.schema'

export type DayOfWeek = (typeof DAY_OF_WEEK_OPTIONS)[number]

export type ReservationGroupFormState = {
  label: string
  capacityOverride?: number
  minAgeOverride?: number
  maxAgeOverride?: number
}

export type SelectedSlot = {
  reservationId: string
  childName: string
  dayOfWeek: DayOfWeek
  startMinute: number
  endMinute: number
}

export type WalkInMemberDraft = {
  localId: string
  parentName: string
  childName: string
  childAge: number
  parentEmail?: string
  parentPhone?: string
  slots: PreferredSlot[]
}
