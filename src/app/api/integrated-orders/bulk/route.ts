import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/integrated-orders/bulk
 * 대량 주문 생성/업데이트 (UPSERT)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { orders } = await request.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 제품 매핑 데이터 한 번에 로드
    const { data: mappings } = await supabase
      .from('product_mapping')
      .select('*')
      .eq('is_active', true);

    const mappingMap = new Map(
      mappings?.map((m) => [m.option_name.toLowerCase(), m]) || []
    );

    // 각 주문에 제품 매핑 적용
    const processedOrders = orders.map((order) => {
      // sheet_date 기본값
      if (!order.sheet_date) {
        order.sheet_date = new Date().toISOString().split('T')[0];
      }

      // 제품 매핑 적용
      if (order.option_name) {
        const mapping = mappingMap.get(order.option_name.toLowerCase());
        if (mapping) {
          order.shipping_source = order.shipping_source || mapping.shipping_source;
          order.invoice_issuer = order.invoice_issuer || mapping.invoice_issuer;
          order.vendor_name = order.vendor_name || mapping.vendor_name;
          order.shipping_location_name = order.shipping_location_name || mapping.shipping_location_name;
          order.shipping_location_address = order.shipping_location_address || mapping.shipping_location_address;
          order.shipping_location_phone = order.shipping_location_phone || mapping.shipping_location_phone;
          order.shipping_cost = order.shipping_cost || mapping.shipping_cost;

          // 셀러공급가 계산
          if (!order.seller_supply_price && mapping.seller_supply_price) {
            order.seller_supply_price = mapping.seller_supply_price * (order.quantity || 1);
          }
        }
      }

      return order;
    });

    // UPSERT 수행 (중복 주문 업데이트)
    const { data, error } = await supabase
      .from('integrated_orders')
      .upsert(processedOrders, {
        onConflict: 'market_name,order_number,option_name',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('대량 주문 생성 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data,
    });
  } catch (error: any) {
    console.error('POST /api/integrated-orders/bulk 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrated-orders/bulk
 * 대량 주문 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { orders } = await request.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 각 주문 개별 업데이트
    const updatePromises = orders.map((order) => {
      if (!order.id) {
        throw new Error('각 주문에 ID가 필요합니다.');
      }

      const { id, ...updateData } = order;

      return supabase
        .from('integrated_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error('일부 주문 수정 실패:', errors);
      return NextResponse.json(
        {
          success: false,
          error: `${errors.length}개 주문 수정 실패`,
          details: errors.map((e) => e.error?.message),
        },
        { status: 500 }
      );
    }

    const data = results.map((r) => r.data);

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error: any) {
    console.error('PUT /api/integrated-orders/bulk 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrated-orders/bulk
 * 대량 주문 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('integrated_orders')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('대량 주문 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: ids.length,
    });
  } catch (error: any) {
    console.error('DELETE /api/integrated-orders/bulk 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
