import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-security'
import { generateSellerCode } from '@/lib/user-codes'
import logger from '@/lib/logger';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  // 🔒 보안: 관리자만 역할 변경 가능
  const auth = await requireAdmin(request)
  if (!auth.authorized) return auth.error

  try {
    const supabase = await createClientForRouteHandler()
    const body = await request.json()
    const { userId, newRole, oldRole } = body

    if (!userId || !newRole || !oldRole) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const updateData: any = { role: newRole }

    // 일반 회원 → 관리자 그룹으로 변경 시 셀러계정 연결 해제
    const isBecomingStaff = ['admin', 'super_admin', 'employee'].includes(newRole) &&
                            !['admin', 'super_admin', 'employee'].includes(oldRole)

    if (isBecomingStaff) {
      updateData.primary_organization_id = null
    }

    // 셀러로 변경 시 코드 생성
    if (newRole === 'seller' && oldRole !== 'seller') {
      try {
        const code = await generateSellerCode()
        updateData.seller_code = code
      } catch (error) {
        logger.error('Failed to generate seller code:', error);
      }
    }
    // 파트너 코드는 관리자가 수동으로 생성/할당

    // 변경 전 사용자 정보 조회 (감사 로그용)
    const { data: beforeUser } = await supabase
      .from('users')
      .select('name, email, role')
      .eq('id', userId)
      .single()

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // 🔒 감사 로그: 권한 변경 기록
    if (data && data.length > 0 && beforeUser) {
      const isAdminChange = ['admin', 'super_admin'].includes(newRole) || ['admin', 'super_admin'].includes(oldRole)

      await createAuditLog({
        action: isAdminChange ? 'grant_admin_access' : 'change_user_role',
        actionCategory: 'permission_change',
        resourceType: 'user',
        resourceId: userId,
        beforeData: { role: oldRole },
        afterData: { role: newRole },
        details: {
          target_user_name: beforeUser.name,
          target_user_email: beforeUser.email,
          old_role: oldRole,
          new_role: newRole,
          is_becoming_staff: isBecomingStaff
        },
        severity: isAdminChange ? 'critical' : 'warning'
      }, request, auth)
    }

    return NextResponse.json({
      success: true,
      data,
      isBecomingStaff
    })

  } catch (error: any) {
    logger.error('POST /api/admin/users/update-role 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
