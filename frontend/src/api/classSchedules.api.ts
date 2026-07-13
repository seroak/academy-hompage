import { apiFetch } from '../lib/apiClient'
import { ClassScheduleListSchema, ClassScheduleSchema, type ClassSchedule, type ClassScheduleDay, type ClassScheduleInput } from './schemas/class-schedule.schema'

export async function fetchClassSchedules(): Promise<ClassSchedule[]> {
  return ClassScheduleListSchema.parse(await apiFetch('/class-schedules'))
}
export async function createClassSchedule(input: ClassScheduleInput): Promise<ClassSchedule> {
  return ClassScheduleSchema.parse(await apiFetch('/class-schedules', { method: 'POST', body: JSON.stringify(input) }))
}
export async function updateClassSchedule(id: string, days: Omit<ClassScheduleDay, 'id'>[]): Promise<ClassSchedule> {
  return ClassScheduleSchema.parse(await apiFetch(`/class-schedules/${id}`, { method: 'PATCH', body: JSON.stringify({ days }) }))
}
export async function publishClassSchedule(id: string): Promise<ClassSchedule> {
  return ClassScheduleSchema.parse(await apiFetch(`/class-schedules/${id}/publish`, { method: 'POST' }))
}
export async function deleteClassSchedule(id: string): Promise<void> {
  await apiFetch(`/class-schedules/${id}`, { method: 'DELETE' })
}
