import { z } from 'zod'

export const DAY_OF_WEEK_OPTIONS = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const
export const RESERVATION_STATUS_OPTIONS = ['WAITING', 'GROUPED', 'CANCELLED'] as const

export const DAY_OF_WEEK_LABELS: Record<(typeof DAY_OF_WEEK_OPTIONS)[number], string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
}

export const OPERATING_START_MINUTE = 780
export const OPERATING_END_MINUTE = 1200
export const SLOT_STEP_MINUTES = 10

export function timeLabel(minute: number): string {
  const hours = Math.floor(minute / 60)
  const minutes = minute % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function timeRangeLabel(startMinute: number, endMinute: number): string {
  return `${timeLabel(startMinute)}~${timeLabel(endMinute)} · ${endMinute - startMinute}분`
}

export function parseTimeLabel(value: string): number {
  const [hoursText, minutesText] = value.split(':')
  return Number(hoursText) * 60 + Number(minutesText)
}

export const RESERVATION_STATUS_LABELS: Record<(typeof RESERVATION_STATUS_OPTIONS)[number], string> = {
  WAITING: '대기중',
  GROUPED: '그룹편성',
  CANCELLED: '취소됨',
}

export const PreferredSlotSchema = z
  .object({
    id: z.string().optional(),
    reservationId: z.string().optional(),
    dayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS, {
      message: '희망 요일을 선택해 주세요',
    }),
    startMinute: z
      .number()
      .int('시작 시각은 10분 단위 정수로 입력해 주세요')
      .min(OPERATING_START_MINUTE, '13:00~20:00 사이에서 선택해 주세요')
      .max(OPERATING_END_MINUTE, '13:00~20:00 사이에서 선택해 주세요'),
    endMinute: z
      .number()
      .int('종료 시각은 10분 단위 정수로 입력해 주세요')
      .min(OPERATING_START_MINUTE, '13:00~20:00 사이에서 선택해 주세요')
      .max(OPERATING_END_MINUTE, '13:00~20:00 사이에서 선택해 주세요'),
  })
  .refine((slot) => slot.startMinute % SLOT_STEP_MINUTES === 0, {
    message: `${SLOT_STEP_MINUTES}분 단위로 선택해 주세요`,
    path: ['startMinute'],
  })
  .refine((slot) => slot.endMinute % SLOT_STEP_MINUTES === 0, {
    message: `${SLOT_STEP_MINUTES}분 단위로 선택해 주세요`,
    path: ['endMinute'],
  })
  .refine((slot) => slot.endMinute > slot.startMinute, {
    message: '종료 시각은 시작 시각보다 이후여야 합니다',
    path: ['endMinute'],
  })

export type PreferredSlot = z.infer<typeof PreferredSlotSchema>

export const ReservationSchema = z.object({
  id: z.string(),
  childName: z.string(),
  childAge: z.number(),
  parentName: z.string(),
  parentEmail: z.string(),
  parentPhone: z.string().nullable().optional(),
  preferredSlots: z.array(PreferredSlotSchema),
  note: z.string().nullable().optional(),
  status: z.enum(RESERVATION_STATUS_OPTIONS),
  groupId: z.string().nullable().optional(),
  requestedGroupId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ReservationListSchema = z.array(ReservationSchema)

export type Reservation = z.infer<typeof ReservationSchema>

export const CreateReservationInputSchema = z.object({
  childId: z.string().min(1),
  childName: z.string().min(1, '아이 이름을 입력해 주세요'),
  childAge: z
    .number()
    .int('나이는 정수로 입력해 주세요')
    .min(4, '만 4세 이상만 신청 가능합니다')
    .max(10, '만 10세 이하만 신청 가능합니다'),
  parentName: z.string().min(1, '보호자 이름을 입력해 주세요'),
  parentEmail: z.string().min(1, '이메일을 입력해 주세요').email('올바른 이메일 형식이 아닙니다'),
  parentPhone: z.string().min(1, '전화번호를 입력해 주세요'),
  preferredSlots: z.array(PreferredSlotSchema).min(1, '가능한 시간을 1개 이상 선택해 주세요'),
  note: z.string().optional(),
  requestedGroupId: z.string().optional(),
  levelTestResultId: z.string().optional(),
})

export type CreateReservationInput = z.infer<typeof CreateReservationInputSchema>

export const UpdateReservationInputSchema = CreateReservationInputSchema.partial().extend({
  status: z.enum(RESERVATION_STATUS_OPTIONS).optional(),
})

export type UpdateReservationInput = z.infer<typeof UpdateReservationInputSchema>

export const CreateWalkInReservationInputSchema = z.object({
  childName: z.string().min(1, '아이 이름을 입력해 주세요'),
  childAge: z
    .number()
    .int('나이는 정수로 입력해 주세요')
    .min(4, '만 4세 이상만 신청 가능합니다')
    .max(10, '만 10세 이하만 신청 가능합니다'),
  parentName: z.string().min(1, '보호자 이름을 입력해 주세요'),
  parentEmail: z.union([z.string().email('올바른 이메일 형식이 아닙니다'), z.literal('')]).optional(),
  parentPhone: z.string().optional(),
  preferredSlots: z.array(PreferredSlotSchema).min(1, '가능한 시간을 1개 이상 선택해 주세요'),
})

export type CreateWalkInReservationInput = z.infer<typeof CreateWalkInReservationInputSchema>

export interface ReservationFilters {
  status?: (typeof RESERVATION_STATUS_OPTIONS)[number]
  age?: number
  dayOfWeek?: string
}
