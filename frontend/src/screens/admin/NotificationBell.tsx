'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useAdminNotificationsQuery } from './hooks/useAdminNotificationsQuery'
import { useAdminNotificationUnreadCountQuery } from './hooks/useAdminNotificationUnreadCountQuery'
import { useAdminNotificationMutations } from './hooks/useAdminNotificationMutations'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { notifications, isLoading } = useAdminNotificationsQuery()
  const { unreadCount } = useAdminNotificationUnreadCountQuery()
  const { markRead, markAllRead, isMarkingAllRead } = useAdminNotificationMutations()

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  async function handleNotificationClick(notification: AdminNotification) {
    if (!notification.readAt) {
      await markRead(notification.id)
    }
    if (notification.reservationId) {
      setIsOpen(false)
      router.push('/admin/reservations')
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
              onClick={() => markAllRead()}
              disabled={isMarkingAllRead || unreadCount === 0}
              className="text-xs font-bold text-[#e86f00] hover:underline disabled:cursor-not-allowed disabled:text-[#c9bfab] disabled:no-underline"
            >
              모두 읽음
            </button>
          </div>

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
                className={`w-full rounded-xl px-2 py-3 text-left transition ${
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
