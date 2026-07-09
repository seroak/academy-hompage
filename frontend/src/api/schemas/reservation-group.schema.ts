import { z } from 'zod'
import {
  DAY_OF_WEEK_OPTIONS,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  ReservationListSchema,
  SLOT_STEP_MINUTES,
} from './reservation.schema'

export const RESERVATION_GROUP_STATUS_OPTIONS = ['CONFIRMED', 'CANCELLED'] as const

export const ReservationGroupSlotSchema = z.object({
  id: z.string(),
  reservationId: z.string(),
  dayOfWeek: z.string(),
  startMinute: z.number(),
  endMinute: z.number(),
})

export type ReservationGroupSlot = z.infer<typeof ReservationGroupSlotSchema>

export const ReservationGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(RESERVATION_GROUP_STATUS_OPTIONS),
  capacity: z.number(),
  minAge: z.number(),
  maxAge: z.number(),
  slots: z.array(ReservationGroupSlotSchema),
  reservations: ReservationListSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ReservationGroupListSchema = z.array(ReservationGroupSchema)

export type ReservationGroup = z.infer<typeof ReservationGroupSchema>

const GroupSlotInputSchema = z
  .object({
    reservationId: z.string().min(1),
    dayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS, { message: '요일을 선택해 주세요' }),
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

export const CreateReservationGroupInputSchema = z.object({
  label: z.string().min(1, '그룹 이름을 입력해 주세요'),
  capacity: z.number().int('정원은 정수로 입력해 주세요').min(1, '정원은 1명 이상이어야 합니다'),
  minAge: z.number().int().min(4).max(10).optional(),
  maxAge: z.number().int().min(4).max(10).optional(),
  slots: z.array(GroupSlotInputSchema).min(1, '슬롯을 1개 이상 선택해 주세요'),
})

export type CreateReservationGroupInput = z.infer<typeof CreateReservationGroupInputSchema>

export const UpdateReservationGroupInputSchema = CreateReservationGroupInputSchema.omit({
  slots: true,
}).partial()

export type UpdateReservationGroupInput = z.infer<typeof UpdateReservationGroupInputSchema>

const MemberSlotInputSchema = z.object({
  dayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS),
  startMinute: z.number(),
  endMinute: z.number(),
})

export const AddGroupMemberInputSchema = z.object({
  reservationId: z.string().min(1),
  slots: z.array(MemberSlotInputSchema),
})

export type AddGroupMemberInput = z.infer<typeof AddGroupMemberInputSchema>

export const ReplaceMemberSlotsInputSchema = z.object({
  slots: z.array(MemberSlotInputSchema).min(1, '슬롯을 1개 이상 선택해 주세요'),
})

export type ReplaceMemberSlotsInput = z.infer<typeof ReplaceMemberSlotsInputSchema>

export const ConfirmedSlotSchema = z.object({
  dayOfWeek: z.enum(DAY_OF_WEEK_OPTIONS),
  startMinute: z.number(),
  endMinute: z.number(),
})

export const ConfirmedSlotListSchema = z.array(ConfirmedSlotSchema)

export type ConfirmedSlot = z.infer<typeof ConfirmedSlotSchema>

export const JoinableGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  capacity: z.number(),
  filledCount: z.number(),
  minAge: z.number(),
  maxAge: z.number(),
  slots: z.array(ConfirmedSlotSchema),
})

export const JoinableGroupListSchema = z.array(JoinableGroupSchema)

export type JoinableGroup = z.infer<typeof JoinableGroupSchema>
