import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, auditLog } from '@/lib/api-security';

/**
 * POST /api/integrated-orders/hard-delete
 * 주문 완전 삭제 (DB에서 영구 삭제)
 * Security: 관리자 이상 권한 필요
 * 제약: 접수 상태인 주문만 삭제 가능
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 보안: 관리자 이상만 완전 삭제 가능
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 삭제 전 주문 정보 조회 (감사 로그용 & 접수 상태 확인)
    const { data: ordersToDelete, error: fetchError } = await supabase
      .from('integrated_orders')
      .select('id, order_number, market_name, shipping_status')
      .in('id', ids);

    if (fetchError) {
      console.error('주문 조회 실패:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 접수 상태가 아닌 주문 필터링
    const nonRegisteredOrders = ordersToDelete?.filter(
      (order) => order.shipping_status !== '접수'
    );

    if (nonRegisteredOrders && nonRegisteredOrders.length > 0) {
      const nonRegisteredNumbers = nonRegisteredOrders.map(o => o.order_number).join(', ');
      return NextResponse.json(
        {
          success: false,
          error: `접수 상태가 아닌 주문은 삭제할 수 없습니다: ${nonRegisteredNumbers}`,
        },
        { status: 400 }
      );
    }

    // 완전 삭제 실행
    const { error: deleteError, count } = await supabase
      .from('integrated_orders')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('완전 삭제 실패:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    // 🔒 감사 로그: 완전 삭제 기록
    if (ordersToDelete && ordersToDelete.length > 0) {
      auditLog('주문 완전삭제 (접수상태)', auth.userData, {
        deleted_count: ordersToDelete.length,
        order_numbers: ordersToDelete.map(o => o.order_number).join(', '),
      });
    }

    return NextResponse.json({
      success: true,
      count: count || ordersToDelete?.length || 0,
    });
  } catch (error: any) {
    console.error('POST /api/integrated-orders/hard-delete 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
