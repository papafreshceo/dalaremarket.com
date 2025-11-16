import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';
import { createAuditLog } from '@/lib/audit-log';

/**
 * POST /api/cash/use
 * 캐시 사용 (발주서 등록 시 입금액 차감)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { amount, description, metadata } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 금액입니다.' },
        { status: 400 }
      );
    }

    // 사용자의 primary organization 조회
    const { getUserPrimaryOrganization } = await import('@/lib/organization-utils');
    const organization = await getUserPrimaryOrganization(user.id);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: '조직 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 조직 캐시 잔액 조회
    const { data: userCash, error: cashError } = await supabase
      .from('organization_cash')
      .select('*')
      .eq('organization_id', organization.id)
      .single();

    if (cashError || !userCash) {
      logger.error('[POST /api/cash/use] 캐시 조회 오류:', cashError);
      return NextResponse.json(
        { success: false, error: '캐시 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    // 잔액 부족 확인
    if (userCash.balance < amount) {
      return NextResponse.json(
        { success: false, error: '캐시 잔액이 부족합니다.', insufficientBalance: true },
        { status: 400 }
      );
    }

    const newBalance = userCash.balance - amount;

    // 캐시 잔액 업데이트
    const { error: updateError } = await supabase
      .from('organization_cash')
      .update({ balance: newBalance })
      .eq('organization_id', organization.id);

    if (updateError) {
      logger.error('[POST /api/cash/use] 잔액 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '캐시 사용에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 거래 이력 추가
    const { error: transactionError } = await supabase
      .from('organization_cash_transactions')
      .insert({
        organization_id: organization.id,
        used_by_user_id: user.id,
        type: 'usage',
        amount: -amount, // 음수로 저장
        balance_after: newBalance,
        description: description || '캐시 사용',
        metadata: metadata || null
      });

    if (transactionError) {
      logger.error('[POST /api/cash/use] 거래 이력 추가 오류:', transactionError);
      // 이력 추가 실패는 치명적이지 않으므로 계속 진행
    }

    // 🔒 감사 로그: 캐시 사용 기록
    await createAuditLog({
      action: 'use_cash',
      actionCategory: 'payment',
      resourceType: 'cash',
      resourceId: organization.id,
      beforeData: { balance: userCash.balance },
      afterData: { balance: newBalance },
      details: {
        amount,
        description,
        balance_before: userCash.balance,
        balance_after: newBalance
      },
      severity: 'info'
    }, request, { user, userData: { id: user.id, organization_id: organization.id } });

    return NextResponse.json({
      success: true,
      message: `${amount}캐시를 사용했습니다.`,
      amountUsed: amount,
      newBalance
    });

  } catch (error: any) {
    logger.error('[POST /api/cash/use] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
