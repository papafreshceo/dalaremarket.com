import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * POST /api/refund-settlements
 * 환불완료 처리 시 정산 데이터 저장
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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: '주문 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 주문 정보 조회
    const { data: order, error: orderError } = await supabase
      .from('integrated_orders')
      .select('*, organizations(id, business_name, bank_name, bank_account, account_holder)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      logger.error('❌ 주문 조회 실패:', orderError);
      return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 처리자 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', auth.user.id)
      .single();

    const organization = order.organizations as any;

    // 환불 정산 데이터 저장
    const { data: settlement, error: settlementError } = await supabase
      .from('refund_settlements')
      .insert({
        order_id: order.id,
        order_number: order.order_number,
        organization_id: order.organization_id,
        organization_name: organization?.business_name || null,
        refund_amount: order.settlement_amount || 0,
        settlement_amount: order.settlement_amount || 0,
        cash_refund_amount: order.cash_used || 0,
        bank_name: organization?.bank_name || null,
        bank_account: organization?.bank_account || null,
        account_holder: organization?.account_holder || null,
        market_name: order.market_name,
        vendor_name: order.vendor_name,
        option_name: order.option_name,
        quantity: order.quantity,
        // 주문자 정보
        orderer_name: order.buyer_name || null,
        orderer_phone: order.buyer_phone || null,
        // 수령인 정보
        recipient_name: order.recipient_name || null,
        recipient_phone: order.recipient_phone || null,
        recipient_address: order.recipient_address || null,
        // 셀러 공급가
        seller_supply_price: order.seller_supply_price || null,
        // CS 정보 (발송완료 후 환불인 경우에만 존재)
        cs_type: order.cs_type || null,
        cs_content: order.cs_content || null,
        resolution_method: order.cs_resolution_method || null,
        refund_ratio: order.refund_ratio || null,
        refund_processed_at: new Date().toISOString(),
        processed_by: auth.user.id,
        processed_by_name: userData?.name || null,
      })
      .select()
      .single();

    if (settlementError) {
      logger.error('❌ 환불 정산 데이터 저장 실패:', settlementError);
      return NextResponse.json(
        { success: false, error: '환불 정산 데이터 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.debug('✅ 환불 정산 데이터 저장 성공:', {
      settlement_id: settlement.id,
      order_id: orderId,
      organization: organization?.business_name,
      amount: settlement.refund_amount,
    });

    return NextResponse.json({
      success: true,
      data: settlement,
    });
  } catch (error: any) {
    logger.error('❌ POST /api/refund-settlements 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/refund-settlements
 * 환불 정산 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 접근 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const organizationId = searchParams.get('organizationId');

    let query = supabase
      .from('refund_settlements')
      .select('*')
      .order('refund_processed_at', { ascending: false });

    // 날짜 필터
    if (startDate && endDate) {
      query = query
        .gte('refund_processed_at', startDate)
        .lte('refund_processed_at', endDate);
    }

    // 조직 필터
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ 환불 정산 데이터 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('❌ GET /api/refund-settlements 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
