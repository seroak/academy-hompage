import { apiFetch } from '../lib/apiClient'
import {
  AdminNotificationListSchema,
  AdminNotificationSchema,
  AdminNotificationUnreadCountSchema,
  type AdminNotification,
  type AdminNotificationUnreadCount,
} from './schemas/adminNotification.schema'

export async function fetchAdminNotifications(): Promise<AdminNotification[]> {
  const raw = await apiFetch('/admin-notifications')
  return AdminNotificationListSchema.parse(raw)
}

export async function fetchAdminNotificationUnreadCount(): Promise<AdminNotificationUnreadCount> {
  const raw = await apiFetch('/admin-notifications/unread-count')
  return AdminNotificationUnreadCountSchema.parse(raw)
}

export async function markAdminNotificationRead(id: string): Promise<AdminNotification> {
  const raw = await apiFetch(`/admin-notifications/${id}/read`, { method: 'PATCH' })
  return AdminNotificationSchema.parse(raw)
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  await apiFetch('/admin-notifications/read-all', { method: 'POST' })
}
