'use client'

import { useState, useEffect } from 'react'
import { Notification, OrganizationInvitationData } from '@/types/notification'
import { ROLE_LABELS } from '@/types/organization'

interface InvitationNotificationCardProps {
  notification: Notification
  onActionComplete?: () => void
}

export default function InvitationNotificationCard({
  notification,
  onActionComplete,
}: InvitationNotificationCardProps) {
  const [loading, setLoading] = useState(false)
  const [actionTaken, setActionTaken] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [invitationStatus, setInvitationStatus] = useState<'pending' | 'accepted' | 'cancelled' | 'expired' | null>(null)

  const data = notification.data as OrganizationInvitationData

  // 초대 상태 및 멤버 여부 확인
  useEffect(() => {
    const checkStatus = async () => {
      try {
        console.log('🔍 초대 상태 확인 시작')
        console.log('📦 알림 데이터 전체:', notification.data)
        console.log('🆔 organization_id:', data.organization_id)
        console.log('🆔 invitation_id:', data.invitation_id)

        if (!data.invitation_id) {
          console.error('❌ invitation_id가 없습니다!')
          return
        }

        // 1. 초대 상태 확인 (내가 받은 초대만 조회)
        const inviteResponse = await fetch(`/api/organizations/my-invitations?invitation_id=${data.invitation_id}`)
        console.log('📥 초대 API 응답 상태:', inviteResponse.status)

        if (inviteResponse.ok) {
          const inviteResult = await inviteResponse.json()
          console.log('📋 초대 API 응답 전체:', JSON.stringify(inviteResult, null, 2))

          if (inviteResult.success && inviteResult.invitation) {
            console.log('✅ 초대 상태 설정:', inviteResult.invitation.status)
            console.log('📅 초대 업데이트 시간:', inviteResult.invitation.updated_at)
            setInvitationStatus(inviteResult.invitation.status)
          } else {
            console.warn('⚠️ 초대를 찾을 수 없음')
          }
        } else {
          const errorText = await inviteResponse.text()
          console.error('❌ 초대 조회 실패:', inviteResponse.status, errorText)
        }

        // 2. 멤버 여부 확인
        const memberResponse = await fetch(`/api/organizations/members?organization_id=${data.organization_id}`)
        if (memberResponse.ok) {
          const memberResult = await memberResponse.json()
          if (memberResult.success && memberResult.members) {
            const isCurrentUserMember = memberResult.members.some((member: any) =>
              member.status === 'active'
            )
            console.log('👥 멤버 여부:', isCurrentUserMember)
            setIsMember(isCurrentUserMember)
          }
        }
      } catch (error) {
        console.error('❌ 상태 확인 실패:', error)
      }
    }

    if (data.organization_id && data.invitation_id) {
      checkStatus()
    }
  }, [data.organization_id, data.invitation_id])

  const handleAction = async (action: 'accept' | 'reject') => {
    try {
      setLoading(true)

      const response = await fetch('/api/organizations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: data.invitation_id,
          action,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setActionTaken(true)

        // 알림 삭제
        try {
          await fetch(`/api/notifications?id=${notification.id}`, {
            method: 'DELETE',
          })
        } catch (deleteError) {
          console.error('알림 삭제 실패:', deleteError)
        }

        if (action === 'accept') {
          alert(`${data.organization_name}의 멤버가 되었습니다!`)
        } else {
          alert('초대를 거절했습니다.')
        }

        onActionComplete?.()
      } else {
        alert(result.error || '처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('초대 처리 실패:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 초대 상태별 메시지
  const getStatusMessage = () => {
    if (isMember) {
      return { icon: '✅', message: '이미 해당 셀러계정의 멤버입니다', color: 'text-green-700' }
    }
    if (invitationStatus === 'cancelled') {
      return { icon: '❌', message: '이 초대는 취소되었습니다', color: 'text-red-700' }
    }
    if (invitationStatus === 'expired') {
      return { icon: '⏰', message: '이 초대는 만료되었습니다', color: 'text-orange-700' }
    }
    if (invitationStatus === 'accepted' || actionTaken) {
      return { icon: '✅', message: '이 초대는 이미 수락되었습니다', color: 'text-green-700' }
    }
    return null
  }

  const statusInfo = getStatusMessage()

  // 처리된 알림 삭제
  const handleDeleteProcessedNotification = async () => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return

    try {
      await fetch(`/api/notifications?id=${notification.id}`, {
        method: 'DELETE',
      })
      onActionComplete?.()
    } catch (error) {
      console.error('알림 삭제 실패:', error)
      alert('알림 삭제에 실패했습니다.')
    }
  }

  // 이미 처리된 경우 (이미 멤버, 취소됨, 만료됨, 수락됨)
  if (statusInfo) {
    return (
      <div className="border border-gray-200 rounded-lg p-5 bg-gray-50 relative">
        {/* 삭제 버튼 */}
        <button
          onClick={handleDeleteProcessedNotification}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition-colors"
          title="알림 삭제"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start mb-3">
          <span className="text-3xl mr-3">{statusInfo.icon}</span>
          <div className="flex-1 pr-6">
            <h4 className="text-base font-bold text-gray-700 mb-1">
              셀러계정 초대
            </h4>
            <p className="text-sm text-gray-600">
              {data.inviter_name}님이 초대했습니다
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 mb-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">셀러계정</span>
            <span className="text-sm font-semibold text-gray-900">
              {data.organization_name}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">부여될 역할</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
              {ROLE_LABELS[data.role]}
            </span>
          </div>
        </div>
        <p className={`text-sm ${statusInfo.color} font-medium text-center bg-white rounded-lg p-3`}>
          {statusInfo.message}
        </p>
      </div>
    )
  }

  return (
    <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
      {/* 헤더 */}
      <div className="flex items-start mb-4">
        <span className="text-3xl mr-3">👥</span>
        <div className="flex-1">
          <h4 className="text-base font-bold text-gray-900 mb-1">
            셀러계정 초대
          </h4>
          <p className="text-sm text-gray-600">
            {data.inviter_name}님이 초대했습니다
          </p>
        </div>
      </div>

      {/* 초대 정보 */}
      <div className="bg-white rounded-lg p-4 mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">셀러계정</span>
          <span className="text-sm font-semibold text-gray-900">
            {data.organization_name}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">부여될 역할</span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {ROLE_LABELS[data.role]}
          </span>
        </div>
        {data.custom_message && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-1">초대 메시지</p>
            <p className="text-sm text-gray-800 italic">"{data.custom_message}"</p>
          </div>
        )}
      </div>

      {/* 역할 설명 */}
      <div className="bg-white rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-600">
          👤 담당자는 주문 및 상품 관리 등 기본 기능을 사용할 수 있습니다
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => handleAction('accept')}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? '처리 중...' : '멤버로 전환 동의'}
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={loading}
          className="flex-1 bg-white text-gray-700 px-4 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
        >
          거절
        </button>
      </div>

      {/* 안내 문구 */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        멤버로 전환하면 해당 셀러계정의 데이터를 공유하게 됩니다
      </p>
    </div>
  )
}
