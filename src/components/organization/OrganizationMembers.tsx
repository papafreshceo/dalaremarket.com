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
  currentUserId: string
  canManageMembers: boolean
}

export default function OrganizationMembers({
  organizationId,
  currentUserId,
  canManageMembers,
}: OrganizationMembersProps) {
  const [members, setMembers] = useState<OrganizationMemberWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<OrganizationMemberWithUser | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [organizationId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/organizations/members?organization_id=${organizationId}`
      )
      const data = await response.json()
      if (data.success) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error('멤버 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (memberId: string, newRole: OrganizationRole) => {
    try {
      const response = await fetch(
        `/api/organizations/members?organization_id=${organizationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: memberId,
            role: newRole,
          }),
        }
      )

      const data = await response.json()
      if (data.success) {
        alert('역할이 변경되었습니다')
        fetchMembers()
        setShowRoleModal(false)
      } else {
        alert(data.error || '역할 변경에 실패했습니다')
      }
    } catch (error) {
      console.error('역할 변경 실패:', error)
      alert('역할 변경 중 오류가 발생했습니다')
    }
  }

  const handleRemoveMember = async (memberId: string, userName: string) => {
    if (!confirm(`${userName}님을 셀러계정에서 제거하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/organizations/members?organization_id=${organizationId}&member_id=${memberId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()
      if (data.success) {
        alert('멤버가 제거되었습니다')
        fetchMembers()
      } else {
        alert(data.error || '멤버 제거에 실패했습니다')
      }
    } catch (error) {
      console.error('멤버 제거 실패:', error)
      alert('멤버 제거 중 오류가 발생했습니다')
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                가입일
              </th>
              {canManageMembers && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {member.user.profile_name || member.user.company_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'owner'
                        ? 'bg-purple-100 text-purple-800'
                        : member.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {STATUS_LABELS[member.status]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.joined_at
                    ? new Date(member.joined_at).toLocaleDateString('ko-KR')
                    : '-'}
                </td>
                {canManageMembers && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.role !== 'owner' && member.user_id !== currentUserId && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member)
                            setShowRoleModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          역할 변경
                        </button>
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member.id,
                              member.user.profile_name || member.user.email
                            )
                          }
                          className="text-red-600 hover:text-red-900"
                        >
                          제거
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 역할 변경 모달 */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">역할 변경</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedMember.user.profile_name || selectedMember.user.email}님의 역할을
              변경합니다.
            </p>
            <div className="space-y-2 mb-6">
              {(['admin', 'member'] as OrganizationRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleChangeRole(selectedMember.id, role)}
                  className={`w-full text-left px-4 py-2 rounded border ${
                    selectedMember.role === role
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{ROLE_LABELS[role]}</div>
                  <div className="text-xs text-gray-500">
                    {role === 'admin'
                      ? '멤버 관리 및 모든 데이터 접근 가능'
                      : '기본 기능 사용 가능'}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedMember(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
