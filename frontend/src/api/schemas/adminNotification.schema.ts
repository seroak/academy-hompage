import { z } from 'zod'

export const AdminNotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  reservationId: z.string().nullable().optional(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
})

export const AdminNotificationListSchema = z.array(AdminNotificationSchema)

export type AdminNotification = z.infer<typeof AdminNotificationSchema>

export const AdminNotificationUnreadCountSchema = z.object({
  count: z.number(),
})

export type AdminNotificationUnreadCount = z.infer<typeof AdminNotificationUnreadCountSchema>
