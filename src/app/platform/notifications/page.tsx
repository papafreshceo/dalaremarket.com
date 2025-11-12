'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Notification, NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_ICONS, NOTIFICATION_TYPE_COLORS } from '@/types/notification'
import InvitationNotificationCard from '@/components/notifications/InvitationNotificationCard'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [unreadCount, setUnreadCount] = useState(0)

  // 알림 조회
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const url = filter === 'unread'
        ? '/api/notifications?unread_only=true&limit=100'
        : '/api/notifications?limit=100'

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
      }
    } catch (error) {
      console.error('알림 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  // 모두 읽음 처리
  const markAllAsRead = async () => {
    if (!confirm('모든 알림을 읽음 처리하시겠습니까?')) return

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return

    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })
      fetchNotifications()
    } catch (error) {
      console.error('알림 삭제 실패:', error)
    }
  }

  // 알림 클릭 처리 (읽음 처리 + 페이지 이동)
  const handleNotificationClick = (notification: Notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // 알림 타입에 따라 페이지 이동
    switch (notification.type) {
      case 'organization_invitation':
        // 초대 알림은 현재 페이지에서 수락/거절 가능하므로 스크롤만
        const element = document.getElementById(`notification-${notification.id}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break

      case 'order_update':
        // 주문 업데이트 알림
        const orderData = notification.data as any
        if (orderData?.order_id) {
          router.push(`/platform/orders?order_id=${orderData.order_id}`)
        } else {
          router.push('/platform/orders')
        }
        break

      case 'payment_update':
        // 결제/정산 알림
        router.push('/platform/settlement')
        break

      case 'system_notice':
        // 시스템 공지는 현재 페이지에 머물기
        break

      default:
        break
    }
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">알림</h1>
        <p className="text-sm text-gray-600">
          {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다` : '모든 알림을 확인했습니다'}
        </p>
      </div>

      {/* 필터 및 액션 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            읽지 않음 {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            로딩 중...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600">
              {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const colors = NOTIFICATION_TYPE_COLORS[notification.type]

            // 초대 알림인 경우 특별한 카드 표시 (읽음/안읽음 모두)
            if (notification.type === 'organization_invitation') {
              return (
                <div key={notification.id} id={`notification-${notification.id}`}>
                  <InvitationNotificationCard
                    notification={notification}
                    onActionComplete={fetchNotifications}
                  />
                </div>
              )
            }

            // 일반 알림 카드
            return (
              <div
                key={notification.id}
                id={`notification-${notification.id}`}
                onClick={() => handleNotificationClick(notification)}
                className={`border rounded-lg p-4 transition-colors cursor-pointer hover:shadow-md ${
                  !notification.read
                    ? `${colors.bg} ${colors.border} border-2`
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <span className="text-3xl flex-shrink-0">
                    {NOTIFICATION_TYPE_ICONS[notification.type]}
                  </span>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {NOTIFICATION_TYPE_LABELS[notification.type]}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {notification.message && (
                      <p className="text-sm text-gray-700 mb-2">
                        {notification.message}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.created_at)}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          읽음 처리
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
