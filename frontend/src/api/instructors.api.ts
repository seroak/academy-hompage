import { apiFetch } from '../lib/apiClient'
import { InstructorListSchema, InstructorSchema, type Instructor } from './schemas/instructor.schema'
import type { CreateInstructorInput } from './schemas/instructor-input.schema'

export async function fetchInstructors(): Promise<Instructor[]> {
  const raw = await apiFetch('/instructors')
  return InstructorListSchema.parse(raw)
}

export async function fetchInstructor(id: string): Promise<Instructor> {
  const raw = await apiFetch(`/instructors/${id}`)
  return InstructorSchema.parse(raw)
}

export async function createInstructor(input: CreateInstructorInput): Promise<Instructor> {
  const raw = await apiFetch('/instructors', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return InstructorSchema.parse(raw)
}

export async function updateInstructor(
  id: string,
  input: Partial<CreateInstructorInput>,
): Promise<Instructor> {
  const raw = await apiFetch(`/instructors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return InstructorSchema.parse(raw)
}

export async function deleteInstructor(id: string): Promise<void> {
  await apiFetch(`/instructors/${id}`, { method: 'DELETE' })
}
