import { z } from 'zod'

export const DAY_OF_WEEK_OPTIONS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
export const WEEKDAY_OPTIONS = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const
export const HOUR_OPTIONS = [12, 13, 14, 15, 16, 17] as const
export const RESERVATION_STATUS_OPTIONS = ['WAITING', 'GROUPED', 'CANCELLED'] as const

export const DAY_OF_WEEK_LABELS: Record<(typeof DAY_OF_WEEK_OPTIONS)[number], string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
}

export function hourLabel(hour: number): string {
  return `${hour}시`
}

export const RESERVATION_STATUS_LABELS: Record<(typeof RESERVATION_STATUS_OPTIONS)[number], string> = {
  WAITING: '대기중',
  GROUPED: '그룹편성',
  CANCELLED: '취소됨',
}

export const ReservationSchema = z.object({
  id: z.string(),
  childName: z.string(),
  childAge: z.number(),
  parentName: z.string(),
  parentEmail: z.string(),
  parentPhone: z.string().nullable().optional(),
  preferredDayOfWeek: z.string(),
  preferredHour: z.number(),
  note: z.string().nullable().optional(),
  status: z.enum(RESERVATION_STATUS_OPTIONS),
  groupId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ReservationListSchema = z.array(ReservationSchema)

export type Reservation = z.infer<typeof ReservationSchema>

export const CreateReservationInputSchema = z.object({
  childName: z.string().min(1, '아이 이름을 입력해 주세요'),
  childAge: z
    .number()
    .int('나이는 정수로 입력해 주세요')
    .min(4, '만 4세 이상만 신청 가능합니다')
    .max(10, '만 10세 이하만 신청 가능합니다'),
  parentName: z.string().min(1, '보호자 이름을 입력해 주세요'),
  parentEmail: z.string().min(1, '이메일을 입력해 주세요').email('올바른 이메일 형식이 아닙니다'),
  parentPhone: z.string().optional(),
  preferredDayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS, {
    message: '희망 요일을 선택해 주세요',
  }),
  preferredHour: z
    .number()
    .int('시간은 정수로 입력해 주세요')
    .min(12, '12시~17시 중에서 선택해 주세요')
    .max(17, '12시~17시 중에서 선택해 주세요'),
  note: z.string().optional(),
})

export type CreateReservationInput = z.infer<typeof CreateReservationInputSchema>

export interface ReservationFilters {
  status?: (typeof RESERVATION_STATUS_OPTIONS)[number]
  age?: number
  dayOfWeek?: string
  hour?: number
}
