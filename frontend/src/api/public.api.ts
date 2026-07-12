import { NoticeListSchema, NoticeSchema, type Notice } from './schemas/notice.schema'
import {
  ConfirmedSlotListSchema,
  JoinableGroupListSchema,
  type ConfirmedSlot,
  type JoinableGroup,
} from './schemas/reservation-group.schema'

export const PUBLIC_REVALIDATE_SECONDS = 300

// 서버 컴포넌트(Node 런타임)에서 실행되므로 브라우저용 NEXT_PUBLIC_API_BASE_URL 대신
// 컨테이너 내부에서만 유효한 API_INTERNAL_URL을 우선 사용한다 — Docker 등 프론트/백엔드가
// 분리된 네트워크에서는 두 값이 서로 다른 주소를 가리켜야 한다(브라우저는 공개 도메인,
// 서버는 도커 네트워크상의 backend 서비스명).
const API_BASE_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'

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
