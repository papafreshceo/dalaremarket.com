'use client'

import { useState } from 'react'
import { OrganizationRole, ROLE_LABELS } from '@/types/organization'

interface InviteMemberProps {
  organizationId: string
  onInvited?: () => void
}

export default function InviteMember({ organizationId, onInvited }: InviteMemberProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrganizationRole>('member')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      alert('이메일을 입력해주세요')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `/api/organizations/invite?organization_id=${organizationId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            role,
            message,
          }),
        }
      )

      const data = await response.json()
      if (data.success) {
        alert('초대가 발송되었습니다')
        setEmail('')
        setRole('member')
        setMessage('')
        setShowForm(false)
        onInvited?.()
      } else {
        alert(data.error || '초대 발송에 실패했습니다')
      }
    } catch (error) {
      console.error('초대 발송 실패:', error)
      alert('초대 발송 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          멤버 초대
        </button>
      ) : (
        <div className="border border-gray-300 rounded-lg p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">멤버 초대</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                초대할 직원의 이메일 주소를 입력하세요
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as OrganizationRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">{ROLE_LABELS.member}</option>
                <option value="admin">{ROLE_LABELS.admin}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {role === 'admin'
                  ? '관리자는 멤버 관리 및 모든 데이터에 접근할 수 있습니다'
                  : '일반 멤버는 기본 기능을 사용할 수 있습니다'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                초대 메시지 (선택)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="환영 메시지를 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? '발송 중...' : '초대 발송'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
