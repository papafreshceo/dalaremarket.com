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
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold"
        >
          멤버 초대
        </button>
      ) : (
        <div className="border-2 border-gray-300 rounded-xl p-8 bg-white shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">멤버 초대</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleInvite} className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                초대할 직원의 이메일 주소를 입력하세요
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                역할
              </label>
              <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                <span className="text-base font-medium text-gray-900">{ROLE_LABELS.member}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                담당자는 주문 및 상품 관리 등 기본 기능을 사용할 수 있습니다
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                초대 메시지 (선택)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="환영 메시지를 입력하세요"
                rows={4}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-base font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-3 text-base font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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
