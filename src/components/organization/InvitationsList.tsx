'use client'

import { useState, useEffect } from 'react'
import {
  OrganizationInvitation,
  ROLE_LABELS,
  INVITATION_STATUS_LABELS,
} from '@/types/organization'

interface InvitationsListProps {
  organizationId: string
  refreshTrigger?: number
}

export default function InvitationsList({
  organizationId,
  refreshTrigger,
}: InvitationsListProps) {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvitations()
  }, [organizationId, refreshTrigger])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/organizations/invite?organization_id=${organizationId}`
      )
      const data = await response.json()
      if (data.success) {
        // 취소된 초대와 수락된 초대는 목록에서 제외
        const activeInvitations = data.invitations.filter(
          (inv: OrganizationInvitation) =>
            inv.status !== 'cancelled' && inv.status !== 'accepted'
        )
        setInvitations(activeInvitations)
      }
    } catch (error) {
      console.error('초대 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`${email}님에게 보낸 초대를 취소하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/organizations/invite?invitation_id=${invitationId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()
      if (data.success) {
        alert('초대가 취소되었습니다')
        fetchInvitations()
      } else {
        alert(data.error || '초대 취소에 실패했습니다')
      }
    } catch (error) {
      console.error('초대 취소 실패:', error)
      alert('초대 취소 중 오류가 발생했습니다')
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/join?token=${token}`
    navigator.clipboard.writeText(link)
    alert('초대 링크가 복사되었습니다')
  }

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        발송된 초대가 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">발송된 초대 ({invitations.length}개)</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                발송일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                만료일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invitation.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ROLE_LABELS[invitation.role]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      invitation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invitation.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : invitation.status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {INVITATION_STATUS_LABELS[invitation.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invitation.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invitation.expires_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    {invitation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => copyInviteLink(invitation.token)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          링크 복사
                        </button>
                        <button
                          onClick={() =>
                            handleCancelInvitation(invitation.id, invitation.email)
                          }
                          className="text-red-600 hover:text-red-900"
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
