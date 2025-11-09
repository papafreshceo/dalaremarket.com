import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/permissions'

/**
 * 사용자의 권한을 확인하는 유틸리티 함수
 */

// 권한 캐시 (클라이언트 측)
const permissionsCache = new Map<string, any>()
const CACHE_DURATION = 5 * 60 * 1000 // 5분

interface PermissionCheck {
  canAccess: boolean
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

/**
 * 사용자의 특정 페이지에 대한 권한을 확인합니다.
 * @param userId - 사용자 ID
 * @param pagePath - 페이지 경로 (예: '/admin/products')
 * @returns 권한 체크 결과 객체
 */
export async function checkUserPermissions(
  userId: string,
  pagePath: string
): Promise<PermissionCheck> {
  const cacheKey = `${userId}:${pagePath}`
  const cached = permissionsCache.get(cacheKey)

  // 캐시가 있고 유효하면 반환
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.permissions
  }

  try {
    const supabase = createClient()

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
      const allPermissions = createAllPermissions()
      permissionsCache.set(cacheKey, {
        permissions: allPermissions,
        timestamp: Date.now(),
      })
      return allPermissions
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

    // 캐시 저장
    permissionsCache.set(cacheKey, {
      permissions,
      timestamp: Date.now(),
    })

    return permissions
  } catch (error) {
    console.error('권한 확인 오류:', error)
    return createNoPermission()
  }
}

/**
 * 사용자가 특정 페이지에 접근할 수 있는지 확인합니다.
 * @param userId - 사용자 ID
 * @param pagePath - 페이지 경로
 * @returns 접근 가능 여부
 */
export async function canAccessPage(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissions(userId, pagePath)
  return permissions.canAccess
}

/**
 * 사용자가 특정 페이지에서 생성 권한이 있는지 확인합니다.
 */
export async function canCreate(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissions(userId, pagePath)
  return permissions.canAccess && permissions.canCreate
}

/**
 * 사용자가 특정 페이지에서 조회 권한이 있는지 확인합니다.
 */
export async function canRead(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissions(userId, pagePath)
  return permissions.canAccess && permissions.canRead
}

/**
 * 사용자가 특정 페이지에서 수정 권한이 있는지 확인합니다.
 */
export async function canUpdate(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissions(userId, pagePath)
  return permissions.canAccess && permissions.canUpdate
}

/**
 * 사용자가 특정 페이지에서 삭제 권한이 있는지 확인합니다.
 */
export async function canDelete(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const permissions = await checkUserPermissions(userId, pagePath)
  return permissions.canAccess && permissions.canDelete
}

/**
 * 권한 캐시를 초기화합니다.
 */
export function clearPermissionsCache() {
  permissionsCache.clear()
}

/**
 * 특정 사용자의 권한 캐시를 초기화합니다.
 */
export function clearUserPermissionsCache(userId: string) {
  for (const key of permissionsCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      permissionsCache.delete(key)
    }
  }
}

/**
 * 사용자가 접근 가능한 모든 페이지 경로를 반환합니다.
 * @param userId - 사용자 ID
 * @returns 접근 가능한 페이지 경로 배열
 */
export async function getUserAccessiblePages(userId: string): Promise<string[]> {
  try {
    const supabase = createClient()

    // 사용자 역할 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('사용자 조회 오류:', userError)
      return []
    }

    const role = userData.role as UserRole

    // super_admin은 모든 페이지 접근 가능
    if (role === 'super_admin') {
      return ['*'] // 모든 페이지를 의미하는 와일드카드
    }

    // 해당 역할의 접근 가능한 페이지 조회
    const { data: permissions, error: permissionError } = await supabase
      .from('permissions')
      .select('page_path')
      .eq('role', role)
      .eq('can_access', true)

    if (permissionError || !permissions) {
      console.error('권한 조회 오류:', permissionError)
      return []
    }

    return permissions.map(p => p.page_path)
  } catch (error) {
    console.error('접근 가능한 페이지 조회 오류:', error)
    return []
  }
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
