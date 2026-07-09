import { CourseListSchema, CourseSchema, type Course } from './schemas/course.schema'
import { InstructorListSchema, type Instructor } from './schemas/instructor.schema'
import { NoticeListSchema, NoticeSchema, type Notice } from './schemas/notice.schema'
import {
  ConfirmedSlotListSchema,
  JoinableGroupListSchema,
  type ConfirmedSlot,
  type JoinableGroup,
} from './schemas/reservation-group.schema'
import { QuizQuestionListSchema, type QuizQuestion } from './schemas/levelTest.schema'

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

// 확정 시간은 신청 폼의 실시간 차단 기준이라 5분 캐시(publicApiFetch)를 쓰지 않는다.
async function publicApiFetchFresh(path: string): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
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

export async function fetchPublicConfirmedSlots(): Promise<ConfirmedSlot[]> {
  try {
    const raw = await publicApiFetchFresh('/reservation-groups/confirmed-slots')
    return ConfirmedSlotListSchema.parse(raw)
  } catch {
    return []
  }
}

// 여석 여부는 신청 폼의 실시간 합류 안내 기준이라 5분 캐시(publicApiFetch)를 쓰지 않는다.
export async function fetchJoinableGroups(): Promise<JoinableGroup[]> {
  try {
    const raw = await publicApiFetchFresh('/reservation-groups/joinable')
    return JoinableGroupListSchema.parse(raw)
  } catch {
    return []
  }
}

// 레벨테스트는 매 응시마다 새로 무작위 출제되어야 하므로 5분 캐시(publicApiFetch)를 쓰지 않는다.
export async function fetchLevelTestQuiz(age: number): Promise<QuizQuestion[]> {
  try {
    const raw = await publicApiFetchFresh(`/level-tests/quiz?age=${age}`)
    return QuizQuestionListSchema.parse(raw)
  } catch {
    return []
  }
}
