import { CourseListSchema, CourseSchema, type Course } from './schemas/course.schema'
import { InstructorListSchema, type Instructor } from './schemas/instructor.schema'
import { NoticeListSchema, NoticeSchema, type Notice } from './schemas/notice.schema'

export const PUBLIC_REVALIDATE_SECONDS = 300

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'

async function publicApiFetch(path: string): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Public API request failed: ${response.status}`)
  }

  return response.json()
}

export async function fetchPublicCourses(): Promise<Course[]> {
  const raw = await publicApiFetch('/courses')
  return CourseListSchema.parse(raw)
}

export async function fetchPublicCourse(id: string): Promise<Course | null> {
  try {
    const raw = await publicApiFetch(`/courses/${id}`)
    return CourseSchema.parse(raw)
  } catch {
    return null
  }
}

export async function fetchPublicInstructors(): Promise<Instructor[]> {
  const raw = await publicApiFetch('/instructors')
  return InstructorListSchema.parse(raw)
}

export async function fetchPublicNotices(): Promise<Notice[]> {
  const raw = await publicApiFetch('/notices')
  return NoticeListSchema.parse(raw)
}

export async function fetchPublicNotice(id: string): Promise<Notice | null> {
  try {
    const raw = await publicApiFetch(`/notices/${id}`)
    return NoticeSchema.parse(raw)
  } catch {
    return null
  }
}
