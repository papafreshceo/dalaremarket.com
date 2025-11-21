'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// OneSignal 알림 타입 정의
interface Notification {
  id: string
  user_id: string
  type: string
  category: string
  title: string
  body: string
  resource_type?: string
  resource_id?: string
  action_url?: string
  image_url?: string
  is_read: boolean
  created_at: string
  data?: any
}

// 알림 카테고리별 아이콘 (SVG로 대체)
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'order_status':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'announcement':
    case 'shipping_holiday':
    case 'harvest_news':
    case 'price_change':
    case 'out_of_stock':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    case 'new_message':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    case 'comment_reply':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    case 'deposit_confirm':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'admin_new_order':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    case 'admin_support_post':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'admin_new_member':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    case 'organization_invitation':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
  }
}

// 알림 카테고리별 라벨
const CATEGORY_LABELS: Record<string, string> = {
  'order_status': '주문 상태',
  'announcement': '공지사항',
  'new_message': '메시지',
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
  'new_message': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
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

// 알림 탭 타입 정의
type NotificationTab = 'all' | 'orders' | 'announcements' | 'payments' | 'products' | 'messages' | 'others'

// 알림 탭별 포함되는 타입들
const TAB_TYPE_MAPPING: Record<NotificationTab, string[]> = {
  all: [], // 전체는 모든 타입 포함
  orders: ['order_status', 'admin_new_order'],
  announcements: ['announcement', 'shipping_holiday'],
  payments: ['deposit_confirm'],
  products: ['harvest_news', 'price_change', 'out_of_stock'],
  messages: ['new_message', 'comment_reply'],
  others: ['admin_support_post', 'admin_new_member', 'organization_invitation', 'system_notice'],
}

function NotificationsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<NotificationTab>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [tabCounts, setTabCounts] = useState<Record<NotificationTab, number>>({
    all: 0,
    orders: 0,
    announcements: 0,
    payments: 0,
    products: 0,
    messages: 0,
    others: 0,
  })

  // 알림 조회
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const url = readFilter === 'unread'
        ? '/api/notifications?unread_only=true&limit=100'
        : '/api/notifications?limit=100'

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        // 메시지 알림 제외 (AgriChatbot에서 확인)
        const allNotifications = data.notifications.filter(
          (n: Notification) => n.type !== 'new_message'
        )
        setNotifications(allNotifications)
        // 메시지 알림을 제외한 읽지 않은 알림 개수
        const unreadNonMessageCount = allNotifications.filter((n: Notification) => !n.is_read).length
        setUnreadCount(unreadNonMessageCount)

        // 탭별 읽지 않은 알림 개수 계산
        const counts: Record<NotificationTab, number> = {
          all: allNotifications.filter((n: Notification) => !n.is_read).length,
          orders: 0,
          announcements: 0,
          payments: 0,
          products: 0,
          messages: 0,
          others: 0,
        }

        allNotifications
          .filter((n: Notification) => !n.is_read)
          .forEach((n: Notification) => {
            if (TAB_TYPE_MAPPING.orders.includes(n.type)) {
              counts.orders++
            } else if (TAB_TYPE_MAPPING.announcements.includes(n.type)) {
              counts.announcements++
            } else if (TAB_TYPE_MAPPING.payments.includes(n.type)) {
              counts.payments++
            } else if (TAB_TYPE_MAPPING.products.includes(n.type)) {
              counts.products++
            } else if (TAB_TYPE_MAPPING.messages.includes(n.type)) {
              counts.messages++
            } else {
              counts.others++
            }
          })

        setTabCounts(counts)
      }
    } catch (error) {
      console.error('알림 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // URL 쿼리 파라미터에서 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['all', 'orders', 'announcements', 'payments', 'products', 'messages', 'others'].includes(tab)) {
      setActiveTab(tab as NotificationTab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchNotifications()
  }, [readFilter])

  // 탭에 따라 필터링된 알림 목록
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true

    // notification.type 필드로 필터링
    return TAB_TYPE_MAPPING[activeTab].includes(notification.type)
  })

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      })

      if (!response.ok) {
        throw new Error('읽음 처리 실패')
      }

      // 읽음 처리된 알림 찾기
      const notification = notifications.find(n => n.id === notificationId)

      // 로컬 state 업데이트
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )

      // 읽지 않은 알림이었으면 카운트 감소
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))

        // 탭별 카운트도 업데이트
        setTabCounts(prev => {
          const updated = { ...prev, all: Math.max(0, prev.all - 1) }

          if (TAB_TYPE_MAPPING.orders.includes(notification.type)) {
            updated.orders = Math.max(0, prev.orders - 1)
          } else if (TAB_TYPE_MAPPING.announcements.includes(notification.type)) {
            updated.announcements = Math.max(0, prev.announcements - 1)
          } else if (TAB_TYPE_MAPPING.payments.includes(notification.type)) {
            updated.payments = Math.max(0, prev.payments - 1)
          } else if (TAB_TYPE_MAPPING.products.includes(notification.type)) {
            updated.products = Math.max(0, prev.products - 1)
          } else if (TAB_TYPE_MAPPING.messages.includes(notification.type)) {
            updated.messages = Math.max(0, prev.messages - 1)
          } else {
            updated.others = Math.max(0, prev.others - 1)
          }

          return updated
        })
      }
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

  // 모두 삭제
  const deleteAllNotifications = async () => {
    if (!confirm('모든 알림을 삭제하시겠습니까?\n삭제된 알림은 복구할 수 없습니다.')) return

    try {
      const response = await fetch('/api/notifications?delete_all=true', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('삭제 실패')
      }

      // 로컬 state 초기화
      setNotifications([])
      setUnreadCount(0)
      setTabCounts({
        all: 0,
        orders: 0,
        announcements: 0,
        payments: 0,
        products: 0,
        messages: 0,
        others: 0,
      })

      alert('모든 알림이 삭제되었습니다.')
    } catch (error) {
      console.error('알림 삭제 실패:', error)
      alert('알림 삭제에 실패했습니다.')
    }
  }

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('삭제 실패')
      }

      // 삭제된 알림 찾기
      const deletedNotification = notifications.find(n => n.id === notificationId)

      // 로컬 state에서만 제거 (API 재호출 없이)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // 읽지 않은 알림이었으면 카운트도 감소
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))

        // 탭별 카운트도 업데이트
        setTabCounts(prev => {
          const updated = { ...prev, all: Math.max(0, prev.all - 1) }

          if (TAB_TYPE_MAPPING.orders.includes(deletedNotification.type)) {
            updated.orders = Math.max(0, prev.orders - 1)
          } else if (TAB_TYPE_MAPPING.announcements.includes(deletedNotification.type)) {
            updated.announcements = Math.max(0, prev.announcements - 1)
          } else if (TAB_TYPE_MAPPING.payments.includes(deletedNotification.type)) {
            updated.payments = Math.max(0, prev.payments - 1)
          } else if (TAB_TYPE_MAPPING.products.includes(deletedNotification.type)) {
            updated.products = Math.max(0, prev.products - 1)
          } else if (TAB_TYPE_MAPPING.messages.includes(deletedNotification.type)) {
            updated.messages = Math.max(0, prev.messages - 1)
          } else {
            updated.others = Math.max(0, prev.others - 1)
          }

          return updated
        })
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error)
      alert('알림 삭제에 실패했습니다.')
    }
  }

  // 알림 펼치기/접기 토글
  const toggleExpanded = (notificationId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  // 알림 클릭 처리 (읽음 처리 + 펼치기 또는 액션)
  const handleNotificationClick = (notification: Notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    // 메시지 알림인 경우 대화창 바로 열기
    if (notification.type === 'new_message' && notification.data?.sender_id) {
      window.dispatchEvent(new CustomEvent('openChat', {
        detail: { senderId: notification.data.sender_id }
      }))
      return
    }

    // 그 외의 알림은 카드 펼치기/접기
    toggleExpanded(notification.id)
  }

  // 상세 페이지로 이동
  const navigateToDetail = (notification: Notification) => {
    // action_url이 있으면 해당 URL로 이동
    if (notification.action_url) {
      router.push(notification.action_url)
      return
    }

    // 알림 타입에 따라 페이지 이동
    switch (notification.type) {
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

      case 'new_message':
        // 메시지 알림 - 챗봇 대화창 열기
        if (notification.data && notification.data.sender_id) {
          // 챗봇에 이벤트 발송하여 대화창 열기
          window.dispatchEvent(new CustomEvent('openChat', {
            detail: { senderId: notification.data.sender_id }
          }))
        } else {
          // sender_id가 없으면 기본 메시지 페이지로 이동
          router.push('/platform/messages')
        }
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
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">알림</h1>
        <p className="text-sm text-gray-600">
          {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다` : '모든 알림을 확인했습니다'}
        </p>
      </div>

      {/* 카테고리 탭 */}
      <div className="mb-4 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            전체
            {tabCounts.all > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                {tabCounts.all}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            발주/주문
            {tabCounts.orders > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                {tabCounts.orders}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'announcements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            공지사항
            {tabCounts.announcements > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                {tabCounts.announcements}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            입금/정산
            {tabCounts.payments > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                {tabCounts.payments}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            상품정보
            {tabCounts.products > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                {tabCounts.products}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('others')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'others'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            기타
            {tabCounts.others > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                {tabCounts.others}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 읽음 필터 및 액션 */}
      <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setReadFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                readFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setReadFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                readFilter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              읽지 않음
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                모두 읽음 처리
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                모두 삭제
              </button>
            )}
          </div>
        </div>

      {/* 알림 목록 */}
      <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              로딩 중...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600">
                {readFilter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
            const colors = CATEGORY_COLORS[notification.type] || CATEGORY_COLORS['system_notice']
            const icon = getCategoryIcon(notification.type)
            const label = CATEGORY_LABELS[notification.type] || '알림'

            const isExpanded = expandedIds.has(notification.id)

            return (
              <div
                key={notification.id}
                id={`notification-${notification.id}`}
                className={`border rounded-lg px-4 py-3 transition-all ${
                  !notification.is_read
                    ? `${colors.bg} border-l-4 ${colors.border}`
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                {/* 상단: 클릭 가능한 헤더 영역 */}
                <div
                  onClick={() => handleNotificationClick(notification)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  {/* 아이콘 */}
                  <div className={`flex-shrink-0 ${colors.text}`}>{icon}</div>

                  {/* 읽음 표시 */}
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                  )}

                  {/* 카테고리 뱃지 */}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text} flex-shrink-0`}>
                    {label}
                  </span>

                  {/* 제목 + 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 flex-shrink-0">
                        {notification.title}
                      </span>
                      {notification.body && !isExpanded && (
                        <>
                          <span className="text-gray-400 flex-shrink-0">·</span>
                          <span className="text-sm text-gray-600 line-clamp-1 flex-1 min-w-0">
                            {notification.body}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 시간 */}
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(notification.created_at)}
                  </span>

                  {/* 펼침 아이콘 */}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>

                  {/* 삭제 버튼 (X) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 펼쳐진 내용 */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {/* 전체 내용 */}
                    {notification.body && (
                      <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                        {notification.body}
                      </p>
                    )}

                    {/* 이미지 */}
                    {notification.image_url && (
                      <div className="mb-3">
                        <img
                          src={notification.image_url}
                          alt={notification.title}
                          className="w-full max-w-md rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-2">
                      {(notification.action_url || notification.resource_id) &&
                       notification.action_url !== '/platform/notifications' &&
                       notification.action_url !== 'platform/notifications' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigateToDetail(notification)
                          }}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          자세히 보기 →
                        </button>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          읽음 처리
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12 text-gray-500">
          로딩 중...
        </div>
      </div>
    }>
      <NotificationsPageContent />
    </Suspense>
  )
}
