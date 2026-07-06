import { z } from 'zod'
import { DAY_OF_WEEK_OPTIONS, ReservationListSchema } from './reservation.schema'

export const RESERVATION_GROUP_STATUS_OPTIONS = ['CONFIRMED', 'CANCELLED'] as const

export const ReservationGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  dayOfWeek: z.string(),
  hour: z.number(),
  status: z.enum(RESERVATION_GROUP_STATUS_OPTIONS),
  reservations: ReservationListSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ReservationGroupListSchema = z.array(ReservationGroupSchema)

export type ReservationGroup = z.infer<typeof ReservationGroupSchema>

export const CreateReservationGroupInputSchema = z.object({
  label: z.string().min(1, '그룹 이름을 입력해 주세요'),
  dayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS, { message: '요일을 선택해 주세요' }),
  hour: z
    .number()
    .int('시간은 정수로 입력해 주세요')
    .min(12, '12시~17시 중에서 선택해 주세요')
    .max(17, '12시~17시 중에서 선택해 주세요'),
  reservationIds: z.array(z.string()).min(1, '신청을 1명 이상 선택해 주세요'),
})

export type CreateReservationGroupInput = z.infer<typeof CreateReservationGroupInputSchema>
