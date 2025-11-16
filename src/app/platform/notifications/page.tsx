'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// OneSignal 알림 타입 정의
interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  category: string
  resource_type?: string
  resource_id?: string
  action_url?: string
  is_read: boolean
  created_at: string
  data?: any
}

// 알림 카테고리별 아이콘
const CATEGORY_ICONS: Record<string, string> = {
  'order_status': '📦',
  'announcement': '📢',
  'comment_reply': '💬',
  'deposit_confirm': '💰',
  'admin_new_order': '🛒',
  'admin_support_post': '❓',
  'admin_new_member': '👤',
  'shipping_holiday': '🏖️',
  'harvest_news': '🌾',
  'price_change': '💵',
  'out_of_stock': '❌',
  'organization_invitation': '✉️',
  'system_notice': '🔔',
}

// 알림 카테고리별 라벨
const CATEGORY_LABELS: Record<string, string> = {
  'order_status': '주문 상태',
  'announcement': '공지사항',
  'comment_reply': '댓글',
  'deposit_confirm': '예치금',
  'admin_new_order': '신규 주문',
  'admin_support_post': '문의',
  'admin_new_member': '신규 회원',
  'shipping_holiday': '발송 휴무',
  'harvest_news': '출하 소식',
  'price_change': '가격 변동',
  'out_of_stock': '품절 알림',
  'organization_invitation': '초대',
  'system_notice': '시스템',
}

// 알림 카테고리별 색상
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'order_status': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  'announcement': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  'comment_reply': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  'deposit_confirm': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  'admin_new_order': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
  'admin_support_post': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  'admin_new_member': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' },
  'shipping_holiday': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  'harvest_news': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  'price_change': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  'out_of_stock': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  'organization_invitation': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-300' },
  'system_notice': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
}

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
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    // action_url이 있으면 해당 URL로 이동
    if (notification.action_url) {
      router.push(notification.action_url)
      return
    }

    // 알림 카테고리에 따라 페이지 이동
    switch (notification.category) {
      case 'order_status':
        // 주문 상태 알림
        if (notification.resource_id) {
          router.push(`/platform/orders?highlight=${notification.resource_id}`)
        } else {
          router.push('/platform/orders')
        }
        break

      case 'announcement':
      case 'shipping_holiday':
      case 'harvest_news':
      case 'price_change':
      case 'out_of_stock':
        // 공지사항 알림
        router.push('/platform')
        break

      case 'comment_reply':
        // 댓글 알림
        if (notification.resource_id) {
          router.push(`/platform/feed?post_id=${notification.resource_id}`)
        } else {
          router.push('/platform/feed')
        }
        break

      case 'deposit_confirm':
        // 예치금 알림
        router.push('/platform/settlement')
        break

      case 'admin_new_order':
        // 관리자 - 신규 주문
        if (notification.resource_id) {
          router.push(`/admin/order-integration?highlight=${notification.resource_id}`)
        } else {
          router.push('/admin/order-integration')
        }
        break

      case 'admin_support_post':
        // 관리자 - 문의
        router.push('/admin/support')
        break

      case 'admin_new_member':
        // 관리자 - 신규 회원
        router.push('/admin/members')
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
            const colors = CATEGORY_COLORS[notification.category] || CATEGORY_COLORS['system_notice']
            const icon = CATEGORY_ICONS[notification.category] || '🔔'
            const label = CATEGORY_LABELS[notification.category] || '알림'

            // 일반 알림 카드
            return (
              <div
                key={notification.id}
                id={`notification-${notification.id}`}
                onClick={() => handleNotificationClick(notification)}
                className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-lg ${
                  !notification.is_read
                    ? `${colors.bg} ${colors.border} border-2 hover:scale-[1.01]`
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <div className="flex-shrink-0">
                    <span className="text-4xl">{icon}</span>
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                              <span className="text-xs font-semibold text-blue-600">NEW</span>
                            </span>
                          )}
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {label}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {notification.body && (
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {notification.body}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(notification.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
                          >
                            읽음 처리
                          </button>
                        )}
                        {notification.action_url && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            상세 보기
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        )}
                      </div>
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
