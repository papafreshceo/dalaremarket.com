'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'

interface User {
  id: string
  email: string
  name: string
  phone: string
  company_name: string
  role: string
  approved: boolean
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'staff' | 'customers'>('staff')
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
  }, [filter])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
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

  const fetchUsers = async () => {
    setLoading(true)
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    // 필터링 조건
    if (filter === 'staff') {
      query = query.in('role', ['employee', 'admin', 'super_admin'])
    } else if (filter === 'customers') {
      query = query.in('role', ['seller', 'partner'])
    } else if (filter === 'pending') {
      query = query.eq('approved', false)
    } else if (filter === 'approved') {
      query = query.eq('approved', true)
    }
    // 'all'인 경우 필터링 없음

    const { data, error } = await query

    if (error) {
      showToast('사용자 목록을 불러오는데 실패했습니다.', 'error')
      console.error(error)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const handleApprove = async (userId: string, userName: string) => {
    const confirmed = await confirm({
      title: '사용자 승인',
      message: `${userName} 사용자를 승인하시겠습니까?\n승인 후 해당 사용자는 시스템에 로그인할 수 있습니다.`,
      confirmText: '승인',
      cancelText: '취소',
      type: 'info'
    })

    if (!confirmed) return


    const { data, error } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', userId)
      .select()


    if (error) {
      showToast(`승인 처리에 실패했습니다: ${error.message}`, 'error')
      console.error('Approval error details:', error)
    } else {
      showToast('사용자가 승인되었습니다.', 'success')
      fetchUsers()
    }
  }

  const handleReject = async (userId: string, userName: string) => {
    const confirmed = await confirm({
      title: '사용자 승인 거부',
      message: `${userName} 사용자의 승인을 거부하시겠습니까?\n승인 거부 시 해당 사용자의 계정이 삭제됩니다.`,
      confirmText: '거부',
      cancelText: '취소',
      type: 'danger'
    })

    if (!confirmed) return

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      showToast('거부 처리에 실패했습니다.', 'error')
      console.error(error)
    } else {
      showToast('사용자 승인이 거부되었습니다.', 'success')
      fetchUsers()
    }
  }

  const handleRoleChange = async (userId: string, newRole: string, oldRole: string) => {
    console.log('역할 변경 시도:', { userId, newRole, oldRole, currentUserId, currentUserRole })

    // 본인의 역할은 변경할 수 없음
    if (userId === currentUserId) {
      showToast('본인의 역할은 변경할 수 없습니다.', 'error')
      return
    }

    // super_admin만 super_admin 역할 부여 가능
    if (newRole === 'super_admin' && currentUserRole !== 'super_admin') {
      showToast('최고관리자 역할은 최고관리자만 부여할 수 있습니다.', 'error')
      fetchUsers() // 롤백을 위해 다시 불러오기
      return
    }

    // super_admin 역할을 가진 사용자는 super_admin만 변경 가능
    if (oldRole === 'super_admin' && currentUserRole !== 'super_admin') {
      showToast('최고관리자 역할을 변경할 권한이 없습니다.', 'error')
      fetchUsers() // 롤백을 위해 다시 불러오기
      return
    }

    // 역할 변경 확인
    const roleNames: Record<string, string> = {
      seller: '셀러',
      partner: '파트너',
      employee: '직원',
      admin: '관리자',
      super_admin: '최고관리자'
    }

    const confirmed = await confirm({
      title: '역할 변경',
      message: `역할을 "${roleNames[oldRole]}"에서 "${roleNames[newRole]}"(으)로 변경하시겠습니까?`,
      confirmText: '변경',
      cancelText: '취소',
      type: 'info'
    })

    if (!confirmed) {
      fetchUsers() // 취소 시 롤백
      return
    }

    // 일반 회원 → 관리자 그룹으로 변경 시 셀러계정 연결 해제
    const isBecomingStaff = ['admin', 'super_admin', 'employee'].includes(newRole) &&
                            !['admin', 'super_admin', 'employee'].includes(oldRole)

    const updateData: any = { role: newRole }
    if (isBecomingStaff) {
      updateData.primary_organization_id = null
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()

    console.log('역할 변경 결과:', { data, error, isBecomingStaff })

    if (error) {
      showToast(`역할 변경에 실패했습니다: ${error.message}`, 'error')
      console.error(error)
      fetchUsers() // 오류 시 롤백
    } else {
      if (isBecomingStaff) {
        showToast('역할이 변경되었습니다. 셀러계정 연결이 해제되었습니다.', 'success')
      } else {
        showToast('역할이 변경되었습니다.', 'success')
      }
      fetchUsers()
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="mt-1 text-sm text-gray-600">사용자 승인 및 역할 관리</p>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('staff')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'staff'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          임직원 (직원/관리자)
        </button>
        <button
          onClick={() => setFilter('customers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'customers'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          고객 (일반/VIP/파트너)
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          승인 대기
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          승인 완료
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">사용자가 없습니다.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">전화번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.company_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value, user.role)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      disabled={user.id === currentUserId}
                    >
                      <option value="seller">셀러</option>
                      <option value="partner">파트너</option>
                      <option value="employee">직원</option>
                      <option value="admin">관리자</option>
                      {currentUserRole === 'super_admin' && (
                        <option value="super_admin">최고관리자</option>
                      )}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.approved ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        승인됨
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        대기중
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!user.approved ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(user.id, user.name)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(user.id, user.name)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          거부
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
