'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  color: string
  permissions: string[]
}

export default function PermissionsPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const permissions: Permission[] = [
    // 상품 관리
    { id: 'product_view', name: '상품 조회', description: '상품 목록 및 상세 조회', category: '상품 관리' },
    { id: 'product_create', name: '상품 등록', description: '신규 상품 등록', category: '상품 관리' },
    { id: 'product_edit', name: '상품 수정', description: '기존 상품 정보 수정', category: '상품 관리' },
    { id: 'product_delete', name: '상품 삭제', description: '상품 삭제', category: '상품 관리' },

    // 주문 관리
    { id: 'order_view', name: '주문 조회', description: '주문 목록 및 상세 조회', category: '주문 관리' },
    { id: 'order_create', name: '주문 등록', description: '관리자 주문 등록', category: '주문 관리' },
    { id: 'order_edit', name: '주문 수정', description: '주문 정보 수정', category: '주문 관리' },
    { id: 'order_cancel', name: '주문 취소', description: '주문 취소 처리', category: '주문 관리' },

    // 고객 관리
    { id: 'customer_view', name: '고객 조회', description: '고객 정보 조회', category: '고객 관리' },
    { id: 'customer_edit', name: '고객 수정', description: '고객 정보 수정', category: '고객 관리' },
    { id: 'customer_delete', name: '고객 삭제', description: '고객 계정 삭제', category: '고객 관리' },

    // 재무 관리
    { id: 'finance_view', name: '재무 조회', description: '매출, 비용 조회', category: '재무 관리' },
    { id: 'finance_edit', name: '재무 수정', description: '재무 정보 수정', category: '재무 관리' },

    // 설정 관리
    { id: 'settings_view', name: '설정 조회', description: '시스템 설정 조회', category: '설정 관리' },
    { id: 'settings_edit', name: '설정 수정', description: '시스템 설정 수정', category: '설정 관리' },

    // 사용자 관리
    { id: 'user_view', name: '사용자 조회', description: '사용자 목록 조회', category: '사용자 관리' },
    { id: 'user_create', name: '사용자 등록', description: '신규 사용자 등록', category: '사용자 관리' },
    { id: 'user_edit', name: '사용자 수정', description: '사용자 정보 수정', category: '사용자 관리' },
    { id: 'user_delete', name: '사용자 삭제', description: '사용자 계정 삭제', category: '사용자 관리' },
  ]

  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'super_admin',
      name: '최고 관리자',
      description: '모든 권한을 가진 최고 관리자',
      color: 'red',
      permissions: permissions.map(p => p.id)
    },
    {
      id: 'admin',
      name: '관리자',
      description: '일반 관리자',
      color: 'blue',
      permissions: [
        'product_view', 'product_create', 'product_edit',
        'order_view', 'order_create', 'order_edit', 'order_cancel',
        'customer_view', 'customer_edit',
        'finance_view',
        'settings_view'
      ]
    },
    {
      id: 'employee',
      name: '직원',
      description: '일반 직원',
      color: 'green',
      permissions: [
        'product_view',
        'order_view', 'order_create', 'order_edit',
        'customer_view'
      ]
    },
    {
      id: 'viewer',
      name: '조회자',
      description: '조회만 가능',
      color: 'gray',
      permissions: [
        'product_view',
        'order_view',
        'customer_view'
      ]
    }
  ])

  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0])

  const togglePermission = (permissionId: string) => {
    if (!selectedRole) return

    setRoles(prev => prev.map(role => {
      if (role.id === selectedRole.id) {
        const newPermissions = role.permissions.includes(permissionId)
          ? role.permissions.filter(p => p !== permissionId)
          : [...role.permissions, permissionId]

        const updatedRole = { ...role, permissions: newPermissions }
        setSelectedRole(updatedRole)
        return updatedRole
      }
      return role
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // 실제로는 Supabase에 저장
      // await supabase.from('roles').upsert(roles)

      showToast('권한 설정이 저장되었습니다.', 'success')
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const getRoleColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[color] || colors.gray
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-text">권한 설정</h1>
        <p className="mt-1 text-sm text-text-secondary">역할별 접근 권한을 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 역할 목록 */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-text mb-4">역할 목록</h2>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedRole?.id === role.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text">{role.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleColor(role.color)}`}>
                      {role.permissions.length}개 권한
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">{role.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  최고 관리자 역할은 수정할 수 없습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 권한 설정 */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-lg p-6">
            {selectedRole ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-text">{selectedRole.name}</h2>
                      <p className="text-sm text-text-secondary mt-1">{selectedRole.description}</p>
                    </div>
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full border ${getRoleColor(selectedRole.color)}`}>
                      {selectedRole.permissions.length}개 권한 활성화
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-text mb-3 pb-2 border-b border-border">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {perms.map((permission) => {
                          const isChecked = selectedRole.permissions.includes(permission.id)
                          const isDisabled = selectedRole.id === 'super_admin'

                          return (
                            <label
                              key={permission.id}
                              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                isDisabled
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-surface-hover cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => !isDisabled && togglePermission(permission.id)}
                                disabled={isDisabled}
                                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-text text-sm">{permission.name}</div>
                                <div className="text-xs text-text-tertiary mt-0.5">
                                  {permission.description}
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-text-tertiary">
                역할을 선택하세요
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
