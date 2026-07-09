import { apiFetch } from '../lib/apiClient'
import {
  ReservationListSchema,
  ReservationSchema,
  type CreateReservationInput,
  type CreateWalkInReservationInput,
  type Reservation,
  type ReservationFilters,
  type UpdateReservationInput,
} from './schemas/reservation.schema'

function toQueryString(filters: ReservationFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.age !== undefined) params.set('age', String(filters.age))
  if (filters.dayOfWeek) params.set('dayOfWeek', filters.dayOfWeek)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function fetchReservations(filters: ReservationFilters = {}): Promise<Reservation[]> {
  const raw = await apiFetch(`/reservations${toQueryString(filters)}`)
  return ReservationListSchema.parse(raw)
}

export async function fetchReservation(id: string): Promise<Reservation> {
  const raw = await apiFetch(`/reservations/${id}`)
  return ReservationSchema.parse(raw)
}

export async function createReservation(input: CreateReservationInput): Promise<Reservation> {
  const raw = await apiFetch('/reservations', {
    method: 'POST',
    body: JSON.stringify(input),
  }, { authMode: 'parent' })
  return ReservationSchema.parse(raw)
}

export async function createWalkInReservation(input: CreateWalkInReservationInput): Promise<Reservation> {
  const raw = await apiFetch('/reservations/walk-in', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return ReservationSchema.parse(raw)
}

export async function updateReservation(
  id: string,
  input: UpdateReservationInput,
): Promise<Reservation> {
  const raw = await apiFetch(`/reservations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return ReservationSchema.parse(raw)
}

export async function deleteReservation(id: string): Promise<void> {
  await apiFetch(`/reservations/${id}`, { method: 'DELETE' })
}
