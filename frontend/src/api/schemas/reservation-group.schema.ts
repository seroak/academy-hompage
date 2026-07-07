import { z } from 'zod'
import {
  DAY_OF_WEEK_OPTIONS,
  MIN_SLOT_DURATION_MINUTES,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  ReservationListSchema,
  SLOT_STEP_MINUTES,
} from './reservation.schema'

export const RESERVATION_GROUP_STATUS_OPTIONS = ['CONFIRMED', 'CANCELLED'] as const

export const ReservationGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  dayOfWeek: z.string(),
  startMinute: z.number(),
  endMinute: z.number(),
  status: z.enum(RESERVATION_GROUP_STATUS_OPTIONS),
  reservations: ReservationListSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ReservationGroupListSchema = z.array(ReservationGroupSchema)

export type ReservationGroup = z.infer<typeof ReservationGroupSchema>

export const CreateReservationGroupInputSchema = z
  .object({
    label: z.string().min(1, '그룹 이름을 입력해 주세요'),
    dayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS, { message: '요일을 선택해 주세요' }),
    startMinute: z
      .number()
      .int('시작 시각은 10분 단위 정수로 입력해 주세요')
      .min(OPERATING_START_MINUTE, '12:00~18:00 사이에서 선택해 주세요')
      .max(OPERATING_END_MINUTE, '12:00~18:00 사이에서 선택해 주세요'),
    endMinute: z
      .number()
      .int('종료 시각은 10분 단위 정수로 입력해 주세요')
      .min(OPERATING_START_MINUTE, '12:00~18:00 사이에서 선택해 주세요')
      .max(OPERATING_END_MINUTE, '12:00~18:00 사이에서 선택해 주세요'),
    reservationIds: z.array(z.string()).min(1, '신청을 1명 이상 선택해 주세요'),
  })
  .refine((input) => input.startMinute % SLOT_STEP_MINUTES === 0, {
    message: `${SLOT_STEP_MINUTES}분 단위로 선택해 주세요`,
    path: ['startMinute'],
  })
  .refine((input) => input.endMinute % SLOT_STEP_MINUTES === 0, {
    message: `${SLOT_STEP_MINUTES}분 단위로 선택해 주세요`,
    path: ['endMinute'],
  })
  .refine((input) => input.endMinute - input.startMinute >= MIN_SLOT_DURATION_MINUTES, {
    message: `최소 ${MIN_SLOT_DURATION_MINUTES}분 이상 선택해 주세요`,
    path: ['endMinute'],
  })

export type CreateReservationGroupInput = z.infer<typeof CreateReservationGroupInputSchema>
