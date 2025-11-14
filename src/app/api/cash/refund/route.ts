import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';

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

    // 조직의 현재 캐시 조회 (organization_cash 테이블 사용)
    const { data: orgCash, error: cashError } = await supabase
      .from('organization_cash')
      .select('balance')
      .eq('organization_id', organizationId)
      .single();

    if (cashError || !orgCash) {
      console.error('❌ 조직 캐시 조회 실패:', cashError);
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
      console.error('❌ 캐시 환불 실패:', updateError);
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
        used_by_user_id: auth.user.id,
        type: 'refund',
        amount: refundAmount,
        balance_after: newCash,
        description: `주문 취소 환불 (주문번호: ${orderNumber || orderId})`,
      });

    if (txError) {
      console.error('❌ 캐시 거래 내역 저장 실패:', txError);
      // 거래 내역 저장 실패해도 환불은 완료된 상태
    }

    console.log('✅ 캐시 환불 성공:', {
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
    console.error('❌ POST /api/cash/refund 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
