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
  let { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // ✅ 사용자 정보가 없으면 자동 생성 시도 (소셜 로그인 등)
  if (userError || !userData) {
    console.log('📝 사용자 정보 없음, 자동 생성 시도:', user.id, user.email)

    // Service Role로 사용자 생성 시도
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = createAdminClient()

    const provider = user.app_metadata?.provider || 'email'

    // 셀러 코드 생성 시도
    let sellerCode: string | undefined
    try {
      const { generateSellerCode } = await import('@/lib/user-codes')
      sellerCode = await generateSellerCode()
    } catch (error) {
      console.error('셀러 코드 생성 실패:', error)
    }

    const { error: insertError } = await adminClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
        phone: user.user_metadata?.phone || null,
        role: 'seller',
        approved: true,
        last_login_provider: provider,
        seller_code: sellerCode,
      })

    if (insertError) {
      console.error('❌ 사용자 생성 실패:', insertError)
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: '사용자 프로필 생성에 실패했습니다.' },
          { status: 500 }
        ),
        user,
        userData: null,
      }
    }

    // 생성 후 다시 조회
    const { data: newUserData, error: refetchError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (refetchError || !newUserData) {
      console.error('❌ 생성된 사용자 조회 실패:', refetchError)
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

    userData = newUserData

    // ✅ 신규 사용자: 조직 자동 생성 (비동기로, 실패해도 무시)
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      import('@/lib/auto-create-organization').then(({ autoCreateOrganizationFromUser }) => {
        autoCreateOrganizationFromUser(user.id).catch(error => {
          console.error('❌ 조직 자동 생성 실패 (무시됨):', error)
        })
      })
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
