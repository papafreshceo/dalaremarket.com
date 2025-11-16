import { createClientForRouteHandler, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { autoCreateOrganizationFromUser } from '@/lib/auto-create-organization'
import { generateUserCodes } from '@/lib/user-codes'

/**
 * POST /api/organizations/leave
 * 셀러계정 탈퇴 (담당자가 조직에서 나가기)
 * - 조직 멤버에서 제거
 * - 개인 셀러계정 자동 생성
 * - 셀러코드 자동 생성
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    // 인증용 일반 클라이언트
    const supabase = await createClientForRouteHandler()
    // RLS 우회용 Admin 클라이언트
    const adminSupabase = createAdminClient()

    // 1. 현재 사용자의 조직 멤버 정보 조회
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('*, organizations!inner(owner_id, business_name)')
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
      .single()

    if (!memberData) {
      return NextResponse.json(
        { error: '조직 멤버 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 2. 소유자는 탈퇴 불가
    if ((memberData.organizations as any).owner_id === auth.user.id) {
      return NextResponse.json(
        { error: '소유자는 셀러계정을 탈퇴할 수 없습니다. 다른 멤버에게 소유권을 이전하거나 셀러계정을 삭제해주세요.' },
        { status: 400 }
      )
    }

    // 3. 먼저 조직 멤버에서 제거 (탈퇴 처리)
    logger.debug('🗑️  [탈퇴] 멤버 삭제 시작:', { data: memberData.id });
    const { error: deleteError } = await adminSupabase
      .from('organization_members')
      .delete()
      .eq('id', memberData.id)

    if (deleteError) {
      logger.error('❌ [탈퇴] 멤버 삭제 실패:', deleteError);
      return NextResponse.json(
        { error: '셀러계정 탈퇴에 실패했습니다', details: deleteError.message },
        { status: 500 }
      )
    }
    logger.info('[탈퇴] 멤버 삭제 완료');

    // 4. primary_organization_id를 NULL로 설정 (새로운 개인 셀러계정을 생성하기 위해)
    logger.debug('🔄 [탈퇴] primary_organization_id를 NULL로 설정');
    const { error: nullifyError } = await adminSupabase
      .from('users')
      .update({ primary_organization_id: null })
      .eq('id', auth.user.id)

    if (nullifyError) {
      logger.error('❌ [탈퇴] primary_organization_id NULL 설정 실패:', nullifyError);
      throw nullifyError
    }
    logger.info('[탈퇴] primary_organization_id NULL 설정 완료');

    // 5. 개인 셀러계정 자동 생성
    let newOrganizationId: string | null = null
    try {
      logger.debug('🚀 [탈퇴] 개인 셀러계정 생성 시작, user_id:', { data: auth.user.id });
      const result = await autoCreateOrganizationFromUser(auth.user.id)
      logger.info('[탈퇴] 개인 셀러계정 생성 결과:');

      if (!result.organization_id) {
        logger.error('❌ [탈퇴] organization_id가 없음:', result);
        throw new Error('셀러계정 ID가 반환되지 않았습니다')
      }

      newOrganizationId = result.organization_id

      // 6. users의 primary_organization_id 업데이트 (Admin Client로 RLS 우회)
      logger.debug('🔄 [탈퇴] primary_organization_id 업데이트 시작:', {
        user_id: auth.user.id,
        new_org_id: result.organization_id
      });
      const { data: updateData, error: updateError } = await adminSupabase
        .from('users')
        .update({ primary_organization_id: result.organization_id })
        .eq('id', auth.user.id)
        .select()

      if (updateError) {
        logger.error('❌ [탈퇴] primary_organization_id 업데이트 실패:', updateError);
        throw updateError
      }
      logger.info('[탈퇴] primary_organization_id 업데이트 성공:');

      // 7. 셀러코드 자동 생성
      logger.debug('🔑 [탈퇴] 셀러코드 생성 시작');
      const codes = await generateUserCodes(auth.user.id)
      logger.info('[탈퇴] 셀러코드 생성 완료:');

      return NextResponse.json({
        success: true,
        message: '셀러계정에서 탈퇴하고 개인 셀러계정이 생성되었습니다',
        organization_id: result.organization_id,
        organization_name: result.organization_name,
        codes,
      })

    } catch (createError) {
      logger.error('❌ [탈퇴] 개인 셀러계정 생성 실패:', createError);

      return NextResponse.json(
        { error: '개인 셀러계정 생성에 실패했습니다' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    logger.error('셀러계정 탈퇴 오류:', error);
    return NextResponse.json(
      { error: '셀러계정 탈퇴 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}
