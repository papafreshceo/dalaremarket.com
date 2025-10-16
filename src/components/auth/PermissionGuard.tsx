'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  showLoading?: boolean
}

/**
 * 권한을 확인하고 접근을 제어하는 컴포넌트
 *
 * @example
 * <PermissionGuard>
 *   <YourProtectedComponent />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  fallback,
  redirectTo = '/admin/dashboard',
  showLoading = true,
}: PermissionGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { canAccess, loading } = usePermissions(pathname || '')

  useEffect(() => {
    if (!loading && !canAccess) {
      // 접근 권한이 없으면 리다이렉트
      if (redirectTo) {
        router.push(redirectTo)
      }
    }
  }, [loading, canAccess, redirectTo, router])

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!canAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
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
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            접근 권한이 없습니다
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            이 페이지에 접근할 권한이 없습니다.
            <br />
            관리자에게 문의하세요.
          </p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            대시보드로 이동
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * 특정 권한이 있을 때만 자식 컴포넌트를 렌더링합니다.
 */
interface CanProps {
  action: 'create' | 'read' | 'update' | 'delete'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ action, children, fallback }: CanProps) {
  const pathname = usePathname()
  const permissions = usePermissions(pathname || '')

  const hasPermission = permissions[`can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof permissions]

  if (permissions.loading) {
    return null
  }

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

/**
 * 역할 기반 렌더링 컴포넌트
 */
interface RoleGuardProps {
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const pathname = usePathname()
  const { loading, isAdmin, isSuperAdmin } = usePermissions(pathname || '')

  if (loading) {
    return null
  }

  const hasRole = roles.some(role => {
    if (role === 'super_admin') return isSuperAdmin
    if (role === 'admin') return isAdmin || isSuperAdmin
    return false
  })

  if (!hasRole) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
