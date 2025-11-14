'use client'

import { useState, useEffect } from 'react'
import {
  OrganizationMemberWithUser,
  OrganizationRole,
  ROLE_LABELS,
  STATUS_LABELS,
} from '@/types/organization'

interface OrganizationMembersProps {
  organizationId: string
  currentUserId?: string
  canManageMembers?: boolean
  canManage?: boolean
  isOwner?: boolean
  inviteButton?: React.ReactNode
}

export default function OrganizationMembers({
  organizationId,
  currentUserId,
  canManageMembers,
  canManage,
  isOwner,
  inviteButton,
}: OrganizationMembersProps) {
  // 소유자와 담당자 모두 동일한 권한 (테이블은 모두 동일하게 보임)
  const hasManagePermission = true
  const [members, setMembers] = useState<OrganizationMemberWithUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [organizationId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      console.log('멤버 조회 시작, organizationId:', organizationId)
      const response = await fetch(
        `/api/organizations/members?organization_id=${organizationId}`
      )
      console.log('API 응답 상태:', response.status)
      const data = await response.json()
      console.log('API 응답 데이터:', data)
      if (data.success) {
        setMembers(data.members)
        console.log('멤버 설정 완료:', data.members)
      } else {
        console.error('API 에러:', data.error)
      }
    } catch (error) {
      console.error('멤버 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, userName: string) => {
    if (!confirm(`${userName}님을 셀러계정에서 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/organizations/members?organization_id=${organizationId}&member_id=${memberId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()
      if (data.success) {
        alert('멤버가 삭제되었습니다.')
        // 멤버 목록 새로고침
        fetchMembers()
      } else {
        alert(data.error || '멤버 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('멤버 삭제 실패:', error)
      alert('멤버 삭제 중 오류가 발생했습니다')
    }
  }

  const handleLeaveOrganization = async () => {
    if (!confirm('셀러계정에서 탈퇴하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/organizations/leave', {
        method: 'POST',
      })

      const data = await response.json()
      if (data.success) {
        alert('셀러계정에서 탈퇴했습니다.')
        // 탈퇴 후 완전히 새로고침 (캐시 무시)
        // setTimeout으로 약간의 지연을 주어 서버 업데이트가 완료되도록 함
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        alert(data.error || '셀러계정 탈퇴에 실패했습니다')
      }
    } catch (error) {
      console.error('셀러계정 탈퇴 실패:', error)
      alert('셀러계정 탈퇴 중 오류가 발생했습니다')
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">셀러계정 멤버 ({members.length}명)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                이름
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                이메일
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                구분
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                상태
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                가입일
              </th>
              {hasManagePermission && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  작업
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <span>{member.user.name || ''}</span>
                    {member.user_id === currentUserId && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">
                        본인
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {ROLE_LABELS[member.role]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {STATUS_LABELS[member.status]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.joined_at
                    ? new Date(member.joined_at).toLocaleDateString('ko-KR')
                    : '-'}
                </td>
                {hasManagePermission && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      // 디버깅 로그
                      const showDeleteButton = isOwner && member.role !== 'owner' && member.user_id !== currentUserId;
                      const showLeaveButton = !isOwner && member.user_id === currentUserId && member.role !== 'owner';

                      console.log('멤버 버튼 체크:', {
                        memberEmail: member.user.email,
                        isOwner,
                        memberRole: member.role,
                        memberUserId: member.user_id,
                        currentUserId,
                        showDeleteButton,
                        showLeaveButton
                      });

                      return (
                        <>
                          {/* 소유자: 다른 멤버 삭제 가능 */}
                          {showDeleteButton && (
                            <button
                              onClick={() =>
                                handleRemoveMember(
                                  member.id,
                                  member.user.profile_name || member.user.email
                                )
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          )}
                          {/* 담당자: 본인만 탈퇴 가능 */}
                          {showLeaveButton && (
                            <button
                              onClick={handleLeaveOrganization}
                              className="text-orange-600 hover:text-orange-900 font-medium"
                            >
                              셀러계정 탈퇴
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </td>
                )}
              </tr>
            ))}
            {inviteButton && (
              <tr>
                <td colSpan={hasManagePermission ? 6 : 5} className="px-6 py-4">
                  {inviteButton}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
