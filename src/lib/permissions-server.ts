import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/types/permissions'

/**
 * 서버 사이드에서 사용자의 권한을 확인하는 유틸리티 함수
 */

interface PermissionCheck {
  canAccess: boolean
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

/**
 * 사용자의 특정 페이지에 대한 권한을 확인합니다. (서버 사이드)
 * @param userId - 사용자 ID
 * @param pagePath - 페이지 경로 (예: '/admin/order-integration')
 * @returns 권한 체크 결과 객체
 */
export async function checkUserPermissionsServer(
  userId: string,
  pagePath: string
): Promise<PermissionCheck> {
  try {
    const supabase = await createClient()

    // 사용자 역할 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('사용자 조회 오류:', userError)
      return createNoPermission()
    }

    const role = userData.role as UserRole

    // super_admin은 모든 권한 허용
    if (role === 'super_admin') {
      return createAllPermissions()
    }

    // 권한 조회
    const { data: permissionData, error: permissionError } = await supabase
      .from('permissions')
      .select('*')
      .eq('role', role)
      .eq('page_path', pagePath)
      .single()

    if (permissionError || !permissionData) {
      // 권한이 없는 경우
      return createNoPermission()
    }

    const permissions: PermissionCheck = {
      canAccess: permissionData.can_access,
      canCreate: permissionData.can_create,
      canRead: permissionData.can_read,
      canUpdate: permissionData.can_update,
      canDelete: permissionData.can_delete,
    }

    return permissions
  } catch (error) {
    console.error('권한 확인 오류:', error)
    return createNoPermission()
  }
}

/**
 * 사용자가 특정 페이지에서 생성 권한이 있는지 확인합니다.
 */
export async function canCreateServer(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissionsServer(userId, pagePath)
  return permissions.canAccess && permissions.canCreate
}

/**
 * 사용자가 특정 페이지에서 조회 권한이 있는지 확인합니다.
 */
export async function canReadServer(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissionsServer(userId, pagePath)
  return permissions.canAccess && permissions.canRead
}

/**
 * 사용자가 특정 페이지에서 수정 권한이 있는지 확인합니다.
 */
export async function canUpdateServer(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissionsServer(userId, pagePath)
  return permissions.canAccess && permissions.canUpdate
}

/**
 * 사용자가 특정 페이지에서 삭제 권한이 있는지 확인합니다.
 */
export async function canDeleteServer(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissionsServer(userId, pagePath)
  return permissions.canAccess && permissions.canDelete
}

// 헬퍼 함수
function createNoPermission(): PermissionCheck {
  return {
    canAccess: false,
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
  }
}

function createAllPermissions(): PermissionCheck {
  return {
    canAccess: true,
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  }
}
