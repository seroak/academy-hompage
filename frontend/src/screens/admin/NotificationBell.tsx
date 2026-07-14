'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useAdminNotificationsQuery } from './hooks/useAdminNotificationsQuery'
import { useAdminNotificationUnreadCountQuery } from './hooks/useAdminNotificationUnreadCountQuery'
import { useAdminNotificationMutations } from './hooks/useAdminNotificationMutations'
import { useClickOutsideAndEscape } from '../../hooks/useClickOutsideAndEscape'
import type { AdminNotification } from '../../api/schemas/adminNotification.schema'

function formatNotificationTime(createdAt: string) {
  return new Date(createdAt).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { notifications, isLoading } = useAdminNotificationsQuery(isOpen)
  const { unreadCount } = useAdminNotificationUnreadCountQuery()
  const { markRead, markAllRead, isMarkingRead, isMarkingAllRead } = useAdminNotificationMutations()

  useClickOutsideAndEscape(containerRef, isOpen, () => setIsOpen(false))

  async function handleNotificationClick(notification: AdminNotification) {
    setActionError(null)
    try {
      if (!notification.readAt) {
        await markRead(notification.id)
      }
      if (notification.reservationId) {
        setIsOpen(false)
        router.push('/admin/reservations')
      }
    } catch {
      setActionError('알림을 읽음 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  async function handleMarkAllRead() {
    setActionError(null)
    try {
      await markAllRead()
    } catch {
      setActionError('알림을 모두 읽음 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="notification-bell-button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="알림"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#f2dfb9] bg-white text-[#3f3a31] transition duration-200 hover:-translate-y-0.5 hover:border-[#ffd66b] hover:text-[#e86f00]"
      >
        <Bell size={18} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span
            data-testid="notification-bell-badge"
            className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e8543f] px-1 text-[11px] font-black text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          data-testid="notification-panel"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[#f2dfb9] bg-white p-3 shadow-[0_18px_36px_rgba(48,33,10,0.14)]"
        >
          <div className="flex items-center justify-between border-b border-[#f2dfb9] px-2 pb-3">
            <p className="text-sm font-black text-[#3f3a31]">알림</p>
            <button
              type="button"
              data-testid="notification-mark-all-read"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead || unreadCount === 0}
              className="text-xs font-bold text-[#e86f00] hover:underline disabled:cursor-not-allowed disabled:text-[#c9bfab] disabled:no-underline"
            >
              모두 읽음
            </button>
          </div>

          {actionError && (
            <p data-testid="notification-action-error" className="mt-2 rounded-xl bg-[#fff0ed] px-3 py-2 text-xs font-bold text-[#d6452f]">
              {actionError}
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <p className="px-2 py-6 text-center text-sm font-bold text-[#8a8272]">불러오는 중...</p>
            )}
            {!isLoading && notifications.length === 0 && (
              <p className="px-2 py-6 text-center text-sm font-bold text-[#8a8272]">새 알림이 없어요.</p>
            )}
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                data-testid={`notification-item-${notification.id}`}
                onClick={() => handleNotificationClick(notification)}
                disabled={isMarkingRead}
                className={`w-full rounded-xl px-2 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  notification.readAt ? 'opacity-60' : 'bg-[#fff7e8]'
                } hover:bg-[#fff0cf]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-[#3f3a31]">{notification.title}</p>
                  {!notification.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e8543f]" />}
                </div>
                <p className="mt-1 text-xs font-bold text-[#6f6253]">{notification.body}</p>
                <p className="mt-1 text-[11px] font-bold text-[#8a8272]">
                  {formatNotificationTime(notification.createdAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
