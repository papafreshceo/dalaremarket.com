import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * POST /api/cash/refund
 * 캐시 환불 (주문 취소 시)
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 보안: 관리자만 접근 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const userRole = auth.userData?.role || 'seller';
    if (!['super_admin', 'admin', 'employee'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const supabase = await createClientForRouteHandler();
    const body = await request.json();
    const { organizationId, amount, orderId, orderNumber } = body;

    if (!organizationId || !amount) {
      return NextResponse.json(
        { success: false, error: '조직 ID와 환불 금액이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: '주문 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 🔒 중복 환불 방지: 이미 환불된 주문인지 확인
    const { data: existingRefund, error: refundCheckError } = await supabase
      .from('refund_settlements')
      .select('id, refund_processed_at, cash_refund_amount')
      .eq('order_id', orderId)
      .single();

    if (refundCheckError && refundCheckError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러 (정상 케이스)
      logger.error('❌ 환불 이력 조회 실패:', refundCheckError);
      return NextResponse.json(
        { success: false, error: '환불 이력 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (existingRefund) {
      logger.warn('⚠️  중복 환불 시도 감지:', {
        order_id: orderId,
        order_number: orderNumber,
        existing_refund_date: existingRefund.refund_processed_at,
        existing_refund_amount: existingRefund.cash_refund_amount,
        attempted_amount: amount,
      });
      return NextResponse.json(
        {
          success: false,
          error: '이미 환불 처리된 주문입니다.',
          alreadyRefunded: true,
          refundDate: existingRefund.refund_processed_at
        },
        { status: 409 } // 409 Conflict
      );
    }

    // 조직의 현재 캐시 조회 (organization_cash 테이블 사용)
    const { data: orgCash, error: cashError } = await supabase
      .from('organization_cash')
      .select('balance')
      .eq('organization_id', organizationId)
      .single();

    if (cashError || !orgCash) {
      logger.error('❌ 조직 캐시 조회 실패:', cashError);
      return NextResponse.json(
        { success: false, error: '조직의 캐시 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const currentCash = Number(orgCash.balance || 0);
    const refundAmount = Number(amount);
    const newCash = currentCash + refundAmount;

    // 캐시 환불 (조직 캐시 증가)
    const { error: updateError } = await supabase
      .from('organization_cash')
      .update({ balance: newCash })
      .eq('organization_id', organizationId);

    if (updateError) {
      logger.error('❌ 캐시 환불 실패:', updateError);
      return NextResponse.json(
        { success: false, error: '캐시 환불에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 캐시 거래 내역 추가
    const { error: txError } = await supabase
      .from('organization_cash_transactions')
      .insert({
        organization_id: organizationId,
        transaction_by: auth.user.id,
        type: 'refund',
        amount: refundAmount,
        balance_after: newCash,
        description: `주문 취소 환불 (주문번호: ${orderNumber || orderId})`,
      });

    if (txError) {
      logger.error('❌ 캐시 거래 내역 저장 실패:', txError);
      // 거래 내역 저장 실패해도 환불은 완료된 상태
    }

    // 🔒 환불 이력 저장 (중복 환불 방지용)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));

    const { error: settlementError } = await supabase
      .from('refund_settlements')
      .insert({
        order_id: orderId,
        organization_id: organizationId,
        cash_refund_amount: refundAmount,
        refund_processed_at: koreaTime.toISOString(),
        processed_by: auth.user.id,
      });

    if (settlementError) {
      logger.error('❌ 환불 이력 저장 실패:', settlementError);
      // 이력 저장 실패해도 환불은 완료된 상태
    }

    logger.debug('✅ 캐시 환불 성공:', {
      organization_id: organizationId,
      refund_amount: refundAmount,
      previous_cash: currentCash,
      new_cash: newCash,
      order: orderNumber || orderId,
    });

    return NextResponse.json({
      success: true,
      data: {
        previous_cash: currentCash,
        refund_amount: refundAmount,
        new_cash: newCash,
      },
    });
  } catch (error: any) {
    logger.error('❌ POST /api/cash/refund 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
