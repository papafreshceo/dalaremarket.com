import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/customers/[id]/orders
 * 특정 고객의 주문 이력 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const customerId = params.id;

    // 고객 정보 조회
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('is_deleted', false)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: '고객을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 주문 이력 조회
    const { data: orders, error: ordersError } = await supabase
      .from('integrated_orders')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (ordersError) {
      logger.error('주문 이력 조회 실패:', ordersError);
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        customer,
        orders: orders || [],
      },
    });
  } catch (error: any) {
    logger.error('주문 이력 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
