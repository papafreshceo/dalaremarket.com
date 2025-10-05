'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

interface Invitation {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
  used: boolean
  created_at: string
}

export default function InviteUserPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('employee')
  const [loading, setLoading] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    fetchCurrentUserRole()
    fetchInvitations()
  }, [])

  const fetchCurrentUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (data) {
        setCurrentUserRole(data.role)
      }
    }
  }

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setInvitations(data)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 초대 토큰 생성
    const inviteToken = Math.random().toString(36).substring(2, 15) +
                        Math.random().toString(36).substring(2, 15)

    const { data: { user } } = await supabase.auth.getUser()

    // 초대 정보를 invitations 테이블에 저장
    const { error } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        token: inviteToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user?.id
      })

    if (error) {
      showToast('초대 생성에 실패했습니다.', 'error')
      console.error(error)
    } else {
      const inviteUrl = `${window.location.origin}/auth/register?invite=${inviteToken}`

      // 클립보드에 복사
      navigator.clipboard.writeText(inviteUrl)

      showToast('초대 링크가 클립보드에 복사되었습니다.', 'success')
      setEmail('')
      fetchInvitations()
    }

    setLoading(false)
  }

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      employee: '직원',
      admin: '관리자',
      super_admin: '최고관리자'
    }
    return roleNames[role] || role
  }

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/auth/register?invite=${token}`
    navigator.clipboard.writeText(inviteUrl)
    showToast('초대 링크가 클립보드에 복사되었습니다.', 'success')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사용자 초대</h1>
        <p className="mt-1 text-sm text-gray-600">관리자 및 직원 계정 초대</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 초대 폼 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">새 초대 생성</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="employee">직원</option>
                <option value="admin">관리자</option>
                {currentUserRole === 'super_admin' && (
                  <option value="super_admin">최고관리자</option>
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '초대 링크 생성'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 초대 링크는 7일간 유효하며, 클립보드에 자동으로 복사됩니다.
            </p>
          </div>
        </div>

        {/* 초대 내역 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">초대 내역</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {invitations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">초대 내역이 없습니다.</p>
            ) : (
              invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        역할: {getRoleName(invitation.role)}
                      </p>
                      <p className="text-xs text-gray-500">
                        만료: {new Date(invitation.expires_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {invitation.used ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          사용됨
                        </span>
                      ) : new Date(invitation.expires_at) < new Date() ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          만료됨
                        </span>
                      ) : (
                        <>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            대기중
                          </span>
                          <button
                            onClick={() => copyInviteLink(invitation.token)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            링크 복사
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
