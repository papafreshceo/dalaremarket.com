import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichOrderWithOptionInfo, enrichOrdersWithOptionInfo } from '@/lib/order-utils';

/**
 * POST /api/platform-orders
 * 플랫폼 셀러 주문 등록 (단건 또는 다수)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 단건 또는 다건 처리
    const isMultiple = Array.isArray(body.orders);

    if (isMultiple) {
      // 다건 처리 (엑셀 업로드)
      const { orders } = body;

      if (!orders || orders.length === 0) {
        return NextResponse.json(
          { success: false, error: '주문 데이터가 필요합니다.' },
          { status: 400 }
        );
      }

      // 옵션 상품 정보 자동 매핑
      const ordersWithInfo = await enrichOrdersWithOptionInfo(orders);

      // DB에 일괄 저장
      const { data, error } = await supabase
        .from('integrated_orders')
        .insert(ordersWithInfo)
        .select();

      if (error) {
        console.error('❌ 주문 일괄 저장 실패:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        count: data.length,
        data
      });

    } else {
      // 단건 처리 (모바일 등록)
      const orderData = body;

      // 필수 필드 검증
      if (!orderData.option_name) {
        return NextResponse.json(
          { success: false, error: '옵션명은 필수입니다.' },
          { status: 400 }
        );
      }

      // seller_id 자동 설정
      if (!orderData.seller_id) {
        orderData.seller_id = user.id;
      }

      // 옵션 상품 정보 자동 매핑
      const orderWithInfo = await enrichOrderWithOptionInfo(orderData);

      // DB에 저장
      const { data, error } = await supabase
        .from('integrated_orders')
        .insert(orderWithInfo)
        .select()
        .single();

      if (error) {
        console.error('❌ 주문 저장 실패:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data
      });
    }

  } catch (error: any) {
    console.error('POST /api/platform-orders 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
