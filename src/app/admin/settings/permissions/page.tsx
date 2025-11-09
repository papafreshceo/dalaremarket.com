'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { ADMIN_PAGES, ROLE_INFO, UserRole } from '@/types/permissions'

interface Permission {
  id?: string
  role: UserRole
  page_path: string
  can_access: boolean
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
}

const MANAGEMENT_ROLES: UserRole[] = ['super_admin', 'admin', 'employee']

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
  const { confirm } = useConfirm()

  useEffect(() => {
    fetchPermissions()
  }, [selectedRole])

  const fetchPermissions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/permissions?role=${selectedRole}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      console.log('Permissions API result:', result) // 디버그 로그

      if (result.success) {
        // 모든 페이지에 대한 권한 초기화
        const permissionsMap = new Map(
          (result.data || []).map((p: Permission) => [p.page_path, p])
        )

        const allPermissions = ADMIN_PAGES.map(page => {
          const existing = permissionsMap.get(page.path)
          return existing || {
            role: selectedRole,
            page_path: page.path,
            can_access: false,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false,
          }
        })

        console.log('All permissions:', allPermissions) // 디버그 로그
        setPermissions(allPermissions)
      } else {
        const errorMsg = result.error || '권한을 불러오는데 실패했습니다.'
        setError(errorMsg)
        showToast(errorMsg, 'error')

        // 에러 발생시에도 빈 권한으로 초기화
        const emptyPermissions = ADMIN_PAGES.map(page => ({
          role: selectedRole,
          page_path: page.path,
          can_access: false,
          can_create: false,
          can_read: false,
          can_update: false,
          can_delete: false,
        }))
        setPermissions(emptyPermissions)
      }
    } catch (error: any) {
      console.error('권한 조회 오류:', error)
      const errorMsg = error.message || '권한을 불러오는데 실패했습니다.'
      setError(errorMsg)
      showToast(errorMsg, 'error')

      // 에러 발생시에도 빈 권한으로 초기화
      const emptyPermissions = ADMIN_PAGES.map(page => ({
        role: selectedRole,
        page_path: page.path,
        can_access: false,
        can_create: false,
        can_read: false,
        can_update: false,
        can_delete: false,
      }))
      setPermissions(emptyPermissions)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (
    pageIndex: number,
    field: keyof Permission
  ) => {
    const newPermissions = [...permissions]
    const current = newPermissions[pageIndex]

    if (field === 'can_access') {
      // 접근 권한 off시 모든 권한 off
      if (current.can_access) {
        current.can_access = false
        current.can_create = false
        current.can_read = false
        current.can_update = false
        current.can_delete = false
      } else {
        current.can_access = true
        current.can_read = true // 접근 권한 on시 기본적으로 조회 권한도 on
      }
    } else {
      // 다른 권한을 켜려면 접근 권한이 먼저 켜져 있어야 함
      if (!current.can_access) {
        showToast('먼저 접근 권한을 활성화해주세요.', 'warning')
        return
      }
      // @ts-ignore
      current[field] = !current[field]
    }

    setPermissions(newPermissions)
  }

  const handleSelectAll = (field: keyof Permission) => {
    const newPermissions = permissions.map(p => {
      if (field === 'can_access') {
        return {
          ...p,
          can_access: true,
          can_read: true, // 접근 권한 전체 선택시 조회 권한도 함께
        }
      } else {
        // 다른 권한은 접근 권한이 있는 경우만 선택
        if (p.can_access) {
          return { ...p, [field]: true }
        }
      }
      return p
    })
    setPermissions(newPermissions)
  }

  const handleDeselectAll = (field: keyof Permission) => {
    const newPermissions = permissions.map(p => {
      if (field === 'can_access') {
        // 접근 권한 전체 해제시 모든 권한 해제
        return {
          ...p,
          can_access: false,
          can_create: false,
          can_read: false,
          can_update: false,
          can_delete: false,
        }
      } else {
        return { ...p, [field]: false }
      }
    })
    setPermissions(newPermissions)
  }

  const handleSave = async () => {
    const confirmed = await confirm({
      title: '권한 설정 저장',
      message: `${ROLE_INFO[selectedRole].label} 역할의 권한 설정을 저장하시겠습니까?`,
      confirmText: '저장',
      cancelText: '취소',
    })

    if (!confirmed) return

    setSaving(true)
    try {
      const response = await fetch('/api/permissions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          permissions: permissions.filter(p => p.can_access), // 접근 권한이 있는 것만 저장
        }),
      })

      const result = await response.json()

      if (result.success) {
        showToast('권한 설정이 저장되었습니다.', 'success')
        fetchPermissions()
      } else {
        showToast(`저장 실패: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('권한 저장 오류:', error)
      showToast('권한 저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const confirmed = await confirm({
      title: '권한 설정 초기화',
      message: '현재 변경사항을 취소하고 저장된 설정으로 되돌리시겠습니까?',
      confirmText: '초기화',
      cancelText: '취소',
      type: 'danger',
    })

    if (!confirmed) return

    fetchPermissions()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">권한 설정</h1>
        <p className="mt-1 text-sm text-gray-600">
          역할별로 접근 가능한 페이지와 작업 권한을 설정합니다.
        </p>
      </div>

      {/* 역할 선택 탭 */}
      <div className="mb-6 flex gap-2">
        {MANAGEMENT_ROLES.map(role => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedRole === role
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  ROLE_INFO[role].color === 'red'
                    ? 'bg-red-500'
                    : ROLE_INFO[role].color === 'blue'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                }`}
              />
              <span>{ROLE_INFO[role].label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 역할 설명 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">
              {ROLE_INFO[selectedRole].label}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {ROLE_INFO[selectedRole].description}
            </p>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-900">오류 발생</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 권한 테이블 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : permissions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            페이지 목록을 불러올 수 없습니다.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-64">
                      페이지
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div>접근</div>
                      <div className="mt-1 flex gap-1 justify-center">
                        <button
                          onClick={() => handleSelectAll('can_access')}
                          className="text-[10px] text-blue-600 hover:text-blue-800"
                        >
                          전체
                        </button>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={() => handleDeselectAll('can_access')}
                          className="text-[10px] text-gray-600 hover:text-gray-800"
                        >
                          해제
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div>생성</div>
                      <div className="mt-1 flex gap-1 justify-center">
                        <button
                          onClick={() => handleSelectAll('can_create')}
                          className="text-[10px] text-blue-600 hover:text-blue-800"
                        >
                          전체
                        </button>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={() => handleDeselectAll('can_create')}
                          className="text-[10px] text-gray-600 hover:text-gray-800"
                        >
                          해제
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div>조회</div>
                      <div className="mt-1 flex gap-1 justify-center">
                        <button
                          onClick={() => handleSelectAll('can_read')}
                          className="text-[10px] text-blue-600 hover:text-blue-800"
                        >
                          전체
                        </button>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={() => handleDeselectAll('can_read')}
                          className="text-[10px] text-gray-600 hover:text-gray-800"
                        >
                          해제
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div>수정</div>
                      <div className="mt-1 flex gap-1 justify-center">
                        <button
                          onClick={() => handleSelectAll('can_update')}
                          className="text-[10px] text-blue-600 hover:text-blue-800"
                        >
                          전체
                        </button>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={() => handleDeselectAll('can_update')}
                          className="text-[10px] text-gray-600 hover:text-gray-800"
                        >
                          해제
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div>삭제</div>
                      <div className="mt-1 flex gap-1 justify-center">
                        <button
                          onClick={() => handleSelectAll('can_delete')}
                          className="text-[10px] text-blue-600 hover:text-blue-800"
                        >
                          전체
                        </button>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={() => handleDeselectAll('can_delete')}
                          className="text-[10px] text-gray-600 hover:text-gray-800"
                        >
                          해제
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map((permission, index) => {
                    const page = ADMIN_PAGES[index]
                    return (
                      <tr
                        key={page.path}
                        className={`hover:bg-gray-50 ${
                          !permission.can_access ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-2">
                            {page.icon && (
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={page.icon} />
                              </svg>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {page.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.can_access}
                            onChange={() =>
                              handleTogglePermission(index, 'can_access')
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.can_create}
                            onChange={() =>
                              handleTogglePermission(index, 'can_create')
                            }
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            disabled={!permission.can_access}
                          />
                        </td>
                        <td className="px-6 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.can_read}
                            onChange={() =>
                              handleTogglePermission(index, 'can_read')
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            disabled={!permission.can_access}
                          />
                        </td>
                        <td className="px-6 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.can_update}
                            onChange={() =>
                              handleTogglePermission(index, 'can_update')
                            }
                            className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                            disabled={!permission.can_access}
                          />
                        </td>
                        <td className="px-6 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.can_delete}
                            onChange={() =>
                              handleTogglePermission(index, 'can_delete')
                            }
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                            disabled={!permission.can_access}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {permissions.filter(p => p.can_access).length}개 페이지 접근
                가능
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  초기화
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">권한 설정 시 주의사항</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>접근 권한이 없으면 해당 페이지에 접근할 수 없습니다.</li>
              <li>
                생성/수정/삭제 권한은 접근 권한이 있어야만 설정할 수 있습니다.
              </li>
              <li>최고관리자 권한은 변경할 수 없습니다.</li>
              <li>
                권한 변경 후 저장하면 즉시 모든 사용자에게 적용됩니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
