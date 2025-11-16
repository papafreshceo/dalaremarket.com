import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { getUserPrimaryOrganization } from '@/lib/organization-utils';
import logger from '@/lib/logger';

/**
 * GET /api/credits
 * 조직의 크레딧 잔액 조회 (organization_id 기준)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.', balance: 0 },
        { status: 401 }
      );
    }

    // 사용자의 조직 정보 가져오기
    const organization = await getUserPrimaryOrganization(user.id);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: '조직 정보를 찾을 수 없습니다.', balance: 0 },
        { status: 404 }
      );
    }

    // 조직 크레딧 잔액 조회 (organization_id 기준)
    let { data: userCredit, error: creditError } = await supabase
      .from('organization_credits')
      .select('balance')
      .eq('organization_id', organization.id)
      .single();

    // 크레딧 계정이 없으면 생성
    if (creditError || !userCredit) {
      const { data: newCredit, error: insertError } = await supabase
        .from('organization_credits')
        .insert({
          organization_id: organization.id,
          balance: 0
        })
        .select('balance')
        .single();

      if (insertError) {
        logger.error('[GET /api/credits] 크레딧 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '크레딧 정보를 생성할 수 없습니다.', balance: 0 },
          { status: 500 }
        );
      }
      userCredit = newCredit;
    }

    return NextResponse.json({
      success: true,
      balance: userCredit.balance,
      organization_id: organization.id
    });

  } catch (error: any) {
    logger.error('[GET /api/credits] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.', balance: 0 },
      { status: 500 }
    );
  }
}
