'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NotificationBell() {
  const router = useRouter()
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const channelRef = useRef<any>(null)

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [])

  // 읽지 않은 알림 개수 조회
  useEffect(() => {
    if (!currentUserId) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications')
        const data = await response.json()
        if (data.success) {
          setUnreadCount(data.unread_count)
        }
      } catch (error) {
        console.error('읽지 않은 알림 개수 조회 실패:', error)
      }
    }

    fetchUnreadCount()
  }, [currentUserId])

  // Realtime 구독: 알림 개수 실시간 업데이트
  useEffect(() => {
    if (!currentUserId) return

    // 기존 채널 구독 해제
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // 새 채널 구독
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('🔔 새 알림 실시간 수신:', payload)
          // 새 알림이 추가되면 카운트 증가
          setUnreadCount(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('✓ 알림 읽음 표시 업데이트:', payload)
          // 읽음 상태로 변경되면 카운트 감소
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('🗑️ 알림 삭제 감지:', payload)
          // 읽지 않은 알림이 삭제되면 카운트 감소
          if (!payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // 알림 페이지로 이동
  const handleClick = () => {
    router.push('/platform/notifications')
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      aria-label="알림"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>

      {/* 읽지 않은 알림 뱃지 */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
