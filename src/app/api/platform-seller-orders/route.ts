import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/platform-seller-orders 호출됨');

    const supabase = await createClient();

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ 인증 오류:', authError);
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    console.log('✅ 인증된 사용자:', user.id);

    const { orders } = await request.json();

    console.log('📦 받은 주문 개수:', orders?.length);

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      console.error('❌ 유효하지 않은 주문 데이터');
      return NextResponse.json({ error: '유효한 주문 데이터가 없습니다.' }, { status: 400 });
    }

    // 옵션명 매핑 적용
    const { data: mappings } = await supabase
      .from('option_name_mappings')
      .select('*')
      .eq('seller_id', user.id);

    console.log('🔄 옵션명 매핑 개수:', mappings?.length || 0);

    const mappingMap = new Map(
      (mappings || []).map(m => [m.user_option_name, m.site_option_name])
    );

    // platform_seller_orders 테이블에 삽입할 데이터 준비
    const insertData = orders.map((order: any) => {
      // 옵션명 매핑 적용
      let optionName = order.optionName;
      if (optionName && mappingMap.has(optionName)) {
        optionName = mappingMap.get(optionName);
      }

      return {
        seller_id: user.id,
        order_number: order.orderNumber || null,
        orderer: order.orderer || null,
        orderer_phone: order.ordererPhone || null,
        recipient: order.recipient || null,
        recipient_phone: order.recipientPhone || null,
        address: order.address || null,
        delivery_message: order.deliveryMessage || null,
        option_name: optionName || null,
        quantity: order.quantity || 1,
        market_name: order.marketName || null,
        status: 'registered',
        registered_at: order.registeredAt || new Date().toISOString()
      };
    });

    console.log('💾 데이터베이스에 삽입 시도:', insertData.length, '건');
    console.log('📋 첫 번째 주문 샘플:', insertData[0]);

    // 데이터베이스에 삽입
    const { data, error } = await supabase
      .from('platform_seller_orders')
      .insert(insertData)
      .select();

    if (error) {
      console.error('❌ 주문 삽입 오류:', error);
      console.error('❌ 오류 상세:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: '주문 등록에 실패했습니다.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      orders: data
    });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
