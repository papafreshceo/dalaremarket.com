import { createClientForRouteHandler, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';

/**
 * POST /api/admin/organizations/[id]/credits
 * 관리자가 조직에 크레딧을 지급/회수
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { id: organizationId } = await params;
    const { credits, description } = await request.json();

    // 크레딧 값 검증 (음수 허용 - 회수)
    if (!credits || typeof credits !== 'number' || credits === 0) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 크레딧 값입니다.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. 조직의 현재 크레딧 잔액 조회 또는 생성
    let { data: creditsRecord, error: fetchError } = await adminClient
      .from('organization_credits')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // 크레딧 레코드가 없으면 생성
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newRecord, error: insertError } = await adminClient
        .from('organization_credits')
        .insert({
          organization_id: organizationId,
          balance: 0
        })
        .select()
        .single();

      if (insertError) {
        logger.error('크레딧 레코드 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '크레딧 레코드 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      creditsRecord = newRecord;
    } else if (fetchError) {
      logger.error('크레딧 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: '크레딧 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 2. 잔액 검증 (회수 시)
    const currentBalance = creditsRecord?.balance || 0;
    const newBalance = currentBalance + credits;

    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: `잔액이 부족합니다. (현재: ${currentBalance.toLocaleString()}, 요청: ${Math.abs(credits).toLocaleString()})` },
        { status: 400 }
      );
    }

    // 3. 잔액 업데이트
    const { error: updateError } = await adminClient
      .from('organization_credits')
      .update({ balance: newBalance })
      .eq('organization_id', organizationId);

    if (updateError) {
      logger.error('크레딧 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '크레딧 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 4. 히스토리 기록
    const { error: historyError } = await adminClient
      .from('organization_credits_history')
      .insert({
        organization_id: organizationId,
        amount: credits,
        balance_before: currentBalance,
        balance_after: newBalance,
        admin_id: auth.user.id,
        description: description || (credits > 0 ? '관리자 지급' : '관리자 회수'),
        is_revoked: false
      });

    if (historyError) {
      logger.error('히스토리 기록 오류:', historyError);
      // 히스토리 실패는 치명적이지 않으므로 계속 진행
    }

    const actionType = credits > 0 ? '지급' : '회수';
    return NextResponse.json({
      success: true,
      message: `${Math.abs(credits).toLocaleString()}이 ${actionType}되었습니다. (잔액: ${newBalance.toLocaleString()})`,
      data: {
        balance_before: currentBalance,
        balance_after: newBalance,
        amount: credits
      }
    });

  } catch (error: any) {
    logger.error('POST /api/admin/organizations/[id]/credits 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
