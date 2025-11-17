'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  category: string
  title: string
  body: string
  resource_type?: string
  resource_id?: string
  action_url?: string
  data?: any
  is_read: boolean
  read_at?: string
  created_at: string
  priority: string
}

export default function ReceivedTab() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'admin_new_member' | 'new_message' | 'order_status'>('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('category', 'admin')
        .order('created_at', { ascending: false })
        .limit(100)

      // 필터 적용
      if (filter === 'unread') {
        query = query.eq('is_read', false)
      } else if (filter !== 'all') {
        query = query.eq('type', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('알림 조회 실패:', error)
        return
      }

      setNotifications(data || [])

      // 읽지 않은 알림 개수 조회
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'admin')
        .eq('is_read', false)

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('알림 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (!error) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('읽음 처리 실패:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds)

      if (!error) {
        loadNotifications()
      }
    } catch (error) {
      console.error('전체 읽음 처리 실패:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // 읽음 처리
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    // 액션 URL로 이동
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('이 알림을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (!error) {
        setNotifications(notifications.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      admin_new_member: '신규 회원',
      admin_new_order: '신규 발주서',
      admin_support_post: '질문/건의',
      new_message: '새 메시지',
      order_status: '발주서 상태',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      admin_new_member: '#10b981',
      admin_new_order: '#3b82f6',
      admin_support_post: '#f59e0b',
      new_message: '#8b5cf6',
      order_status: '#6366f1',
    }
    return colors[type] || '#6b7280'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#9ca3af',
      normal: '#3b82f6',
      high: '#ef4444',
    }
    return colors[priority] || '#3b82f6'
  }

  return (
    <div>
      {/* 상단 액션 바 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px',
        background: '#f9fafb',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            전체 {notifications.length}개
          </span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: '13px',
              color: '#ef4444',
              background: '#fee2e2',
              padding: '2px 8px',
              borderRadius: '12px',
            }}>
              읽지 않음 {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: unreadCount === 0 ? '#e5e7eb' : '#3b82f6',
              color: unreadCount === 0 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            전체 읽음 처리
          </button>
          <button
            onClick={loadNotifications}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        {[
          { value: 'all', label: '전체' },
          { value: 'unread', label: '읽지 않음' },
          { value: 'admin_new_member', label: '신규 회원' },
          { value: 'admin_new_order', label: '신규 발주서' },
          { value: 'new_message', label: '메시지' },
          { value: 'order_status', label: '발주서 상태' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value as any)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: filter === value ? '#000' : 'white',
              color: filter === value ? 'white' : '#374151',
              border: filter === value ? 'none' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: filter === value ? '600' : '400',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 알림 리스트 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          로딩 중...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f9fafb',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontSize: '15px', color: '#6b7280', marginBottom: '8px' }}>
            알림이 없습니다
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
            {filter !== 'all' ? '다른 필터를 선택해보세요' : '새로운 알림이 도착하면 여기에 표시됩니다'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              style={{
                padding: '16px',
                background: notification.is_read ? 'white' : '#eff6ff',
                border: `1px solid ${notification.is_read ? '#e5e7eb' : '#bfdbfe'}`,
                borderLeft: `4px solid ${getTypeColor(notification.type)}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* 타입 배지 */}
              <span style={{
                fontSize: '11px',
                padding: '4px 8px',
                background: getTypeColor(notification.type),
                color: 'white',
                borderRadius: '4px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {getTypeLabel(notification.type)}
              </span>

              {/* 긴급 배지 */}
              {notification.priority === 'high' && (
                <span style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '4px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  긴급
                </span>
              )}

              {/* 읽지 않음 표시 */}
              {!notification.is_read && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: '#3b82f6',
                  borderRadius: '50%',
                  flexShrink: 0,
                }} />
              )}

              {/* 제목 */}
              <div style={{
                fontSize: '14px',
                fontWeight: notification.is_read ? '500' : '700',
                color: '#111827',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: '120px',
                maxWidth: '200px',
              }}>
                {notification.title}
              </div>

              {/* 내용 */}
              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}>
                {notification.body}
              </div>

              {/* 자세히 보기 */}
              {notification.action_url && (
                <span style={{
                  fontSize: '12px',
                  color: '#3b82f6',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  자세히 보기 →
                </span>
              )}

              {/* 시간 */}
              <span style={{
                fontSize: '12px',
                color: '#9ca3af',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {new Date(notification.created_at).toLocaleString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => deleteNotification(notification.id, e)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: 'none',
                  color: '#9ca3af',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af'
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
