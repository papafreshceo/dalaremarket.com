import { createClientForRouteHandler, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-security'
import { generateSellerCode } from '@/lib/user-codes'
import logger from '@/lib/logger';
import { createAuditLog } from '@/lib/audit-log';
import { autoCreateOrganizationFromUser } from '@/lib/auto-create-organization';

export async function POST(request: NextRequest) {
  // 🔒 보안: 관리자만 역할 변경 가능
  const auth = await requireAdmin(request)
  if (!auth.authorized) return auth.error

  try {
    const body = await request.json()
    const { userId, newRole, oldRole } = body

    logger.info('역할 변경 요청:', { userId, newRole, oldRole });

    // Service Role Key 사용 (RLS 우회하여 users 테이블 업데이트 가능)
    const supabase = createAdminClient()
    const userSupabase = await createClientForRouteHandler()

    if (!userId || !newRole || !oldRole) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const updateData: any = { role: newRole }

    // 변경 전 사용자 정보 조회 (감사 로그용)
    const { data: beforeUser } = await supabase
      .from('users')
      .select('name, email, role')
      .eq('id', userId)
      .single()

    logger.info(`역할 변경 시도: userId=${userId}, updateData=`, updateData);

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()

    if (error) {
      logger.error('역할 변경 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    logger.info('역할 변경 성공:', data);

    // 역할 변경 후 조직이 없으면 자동 생성 (모든 역할에 적용)
    if (data && data.length > 0) {
      const updatedUser = data[0];
      if (!updatedUser.primary_organization_id) {
        try {
          logger.info(`조직이 없는 사용자 ${userId}, 조직 자동 생성 시작`);
          const orgResult = await autoCreateOrganizationFromUser(userId)
          if (orgResult.success && orgResult.organization_id) {
            logger.info('조직 자동 생성 성공:', orgResult);

            // primary_organization_id 명시적 업데이트 (Admin Client로 RLS 우회)
            const { data: updateData, error: updateError } = await supabase
              .from('users')
              .update({ primary_organization_id: orgResult.organization_id })
              .eq('id', userId)
              .select()

            if (updateError) {
              logger.error('primary_organization_id 업데이트 실패:', updateError);
            } else {
              logger.info('primary_organization_id 업데이트 성공:', updateData);
            }
          } else {
            logger.error('조직 자동 생성 실패:', orgResult.error);
          }
        } catch (orgCreateError: any) {
          logger.error('조직 자동 생성 중 예외 발생:', orgCreateError);
          // 조직 생성 실패해도 역할 변경은 완료된 상태로 진행
        }
      }
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
          new_role: newRole
        },
        severity: isAdminChange ? 'critical' : 'warning'
      }, request, auth)
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error: any) {
    logger.error('POST /api/admin/users/update-role 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '알 수 없는 오류가 발생했습니다.',
        details: error.toString(),
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
