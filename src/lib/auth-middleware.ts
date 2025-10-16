import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkUserPermissions } from '@/lib/permissions'

/**
 * API 라우트에서 사용할 권한 체크 미들웨어
 */

interface PermissionCheckOptions {
  requireAuth?: boolean
  requireRole?: string | string[]
  requirePermission?: {
    path: string
    action: 'create' | 'read' | 'update' | 'delete'
  }
}

/**
 * 인증 및 권한을 확인하는 미들웨어 함수
 */
export async function withAuth(
  request: NextRequest,
  options: PermissionCheckOptions = {}
) {
  const supabase = await createClient()

  // 1. 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      ),
      user: null,
      userData: null,
    }
  }

  // 2. 사용자 정보 조회
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      ),
      user,
      userData: null,
    }
  }

  // 3. 승인된 사용자인지 확인
  if (!userData.approved) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: '승인되지 않은 사용자입니다.' },
        { status: 403 }
      ),
      user,
      userData,
    }
  }

  // 4. 역할 확인 (옵션)
  if (options.requireRole) {
    const requiredRoles = Array.isArray(options.requireRole)
      ? options.requireRole
      : [options.requireRole]

    if (!requiredRoles.includes(userData.role)) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: '이 작업을 수행할 권한이 없습니다.',
            required: requiredRoles,
            current: userData.role,
          },
          { status: 403 }
        ),
        user,
        userData,
      }
    }
  }

  // 5. 세부 권한 확인 (옵션)
  if (options.requirePermission) {
    const { path, action } = options.requirePermission
    const permissions = await checkUserPermissions(user.id, path)

    // super_admin은 모든 권한 통과
    if (userData.role !== 'super_admin') {
      const hasPermission =
        permissions.canAccess &&
        permissions[`can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof permissions]

      if (!hasPermission) {
        return {
          authorized: false,
          response: NextResponse.json(
            {
              success: false,
              error: `${action} 권한이 없습니다.`,
              path,
              action,
            },
            { status: 403 }
          ),
          user,
          userData,
        }
      }
    }
  }

  // 모든 체크 통과
  return {
    authorized: true,
    response: null,
    user,
    userData,
  }
}

/**
 * API 핸들러를 권한 체크로 감싸는 헬퍼 함수
 */
export function withPermission(
  handler: (
    request: NextRequest,
    context: { user: any; userData: any }
  ) => Promise<NextResponse>,
  options: PermissionCheckOptions
) {
  return async (request: NextRequest) => {
    const authResult = await withAuth(request, options)

    if (!authResult.authorized) {
      return authResult.response
    }

    return handler(request, {
      user: authResult.user,
      userData: authResult.userData,
    })
  }
}
