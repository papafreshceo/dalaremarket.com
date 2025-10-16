import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkUserPermissions } from '@/lib/permissions'

interface UsePermissionsResult {
  canAccess: boolean
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
}

/**
 * 현재 사용자의 특정 페이지에 대한 권한을 확인하는 Hook
 * @param pagePath - 페이지 경로 (예: '/admin/products')
 * @returns 권한 정보 객체
 */
export function usePermissions(pagePath: string): UsePermissionsResult {
  const [permissions, setPermissions] = useState<UsePermissionsResult>({
    canAccess: false,
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    loading: true,
    isAdmin: false,
    isSuperAdmin: false,
  })

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setPermissions({
            canAccess: false,
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            loading: false,
            isAdmin: false,
            isSuperAdmin: false,
          })
          return
        }

        // 사용자 역할 확인
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = userData?.role || 'customer'
        const isAdmin = role === 'admin' || role === 'super_admin'
        const isSuperAdmin = role === 'super_admin'

        // 권한 확인
        const perms = await checkUserPermissions(user.id, pagePath)

        setPermissions({
          ...perms,
          loading: false,
          isAdmin,
          isSuperAdmin,
        })
      } catch (error) {
        console.error('권한 조회 오류:', error)
        setPermissions({
          canAccess: false,
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          loading: false,
          isAdmin: false,
          isSuperAdmin: false,
        })
      }
    }

    fetchPermissions()
  }, [pagePath])

  return permissions
}

/**
 * 현재 사용자의 역할을 반환하는 Hook
 */
export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setRole(null)
          setLoading(false)
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        setRole(userData?.role || null)
        setLoading(false)
      } catch (error) {
        console.error('역할 조회 오류:', error)
        setRole(null)
        setLoading(false)
      }
    }

    fetchRole()
  }, [])

  return { role, loading }
}
