import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { getUserPrimaryOrganization } from '@/lib/organization-utils';
import logger from '@/lib/logger';

/**
 * GET /api/cash
 * 조직의 캐시 잔액 조회 (organization_id 기준)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // impersonate 헤더 확인
    const impersonateUserId = request.headers.get('X-Impersonate-User-Id');

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 실제 사용할 사용자 ID 결정 (impersonate 우선)
    const effectiveUserId = impersonateUserId || user?.id;

    if (!effectiveUserId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Service Role 클라이언트 사용 (RLS 우회 - 캐시 생성/업데이트 위해 필요)
    const { createAdminClient } = await import('@/lib/supabase/server');
    const dbClient = createAdminClient();

    // 사용자의 조직 정보 가져오기
    let organization = await getUserPrimaryOrganization(effectiveUserId);

    // 조직이 없으면 자동 생성
    if (!organization) {
      const { autoCreateOrganizationFromUser } = await import('@/lib/auto-create-organization');
      const result = await autoCreateOrganizationFromUser(effectiveUserId);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || '조직 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 다시 조직 정보 조회
      organization = await getUserPrimaryOrganization(effectiveUserId);

      if (!organization) {
        return NextResponse.json(
          { success: false, error: '조직 생성 후에도 조직을 찾을 수 없습니다.' },
          { status: 500 }
        );
      }
    }

    // 조직 캐시 잔액 조회 (organization_id 기준)
    const { data: userCash, error: cashError } = await dbClient
      .from('organization_cash')
      .select('*')
      .eq('organization_id', organization.id)
      .single();

    // 캐시 잔액이 없으면 0 반환 (impersonate 모드에서는 생성하지 않음)
    if (cashError && cashError.code === 'PGRST116') {
      // impersonate 모드에서는 읽기만 하고 생성하지 않음
      if (impersonateUserId) {
        return NextResponse.json({
          success: true,
          balance: 0,
          organization_id: organization.id,
          isImpersonate: true
        });
      }

      const { data: newCash, error: insertError } = await dbClient
        .from('organization_cash')
        .insert({
          organization_id: organization.id,
          balance: 0
        })
        .select()
        .single();

      if (insertError) {
        // 중복 키 오류 (23505) - 이미 존재하는 경우 다시 조회
        if (insertError.code === '23505') {
          const { data: existingCash } = await dbClient
            .from('organization_cash')
            .select('*')
            .eq('organization_id', organization.id)
            .single();

          if (existingCash) {
            return NextResponse.json({
              success: true,
              balance: existingCash.balance,
              organization_id: organization.id
            });
          }
        }

        logger.error('[GET /api/cash] 캐시 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '캐시 정보를 생성할 수 없습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        balance: 0,
        organization_id: organization.id
      });
    }

    if (cashError) {
      logger.error('[GET /api/cash] 캐시 조회 오류:', cashError);
      return NextResponse.json(
        { success: false, error: '캐시 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: userCash.balance,
      organization_id: organization.id
    });

  } catch (error: any) {
    logger.error('[GET /api/cash] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
