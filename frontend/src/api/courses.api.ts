import { apiFetch } from '../lib/apiClient'
import { CourseListSchema, CourseSchema, type Course, type CreateCourseInput } from './schemas/course.schema'

export async function fetchCourses(): Promise<Course[]> {
  const raw = await apiFetch('/courses')
  return CourseListSchema.parse(raw)
}

export async function fetchCourse(id: string): Promise<Course> {
  const raw = await apiFetch(`/courses/${id}`)
  return CourseSchema.parse(raw)
}

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const raw = await apiFetch('/courses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return CourseSchema.parse(raw)
}

export async function updateCourse(
  id: string,
  input: Partial<CreateCourseInput>,
): Promise<Course> {
  const raw = await apiFetch(`/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return CourseSchema.parse(raw)
}

export async function deleteCourse(id: string): Promise<void> {
  await apiFetch(`/courses/${id}`, { method: 'DELETE' })
}
