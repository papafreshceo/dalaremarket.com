import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { getUserPrimaryOrganization } from '@/lib/organization-utils';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {

    const supabase = await createClientForRouteHandler();

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.error('플랫폼 주문 등록 인증 실패', authError);
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { orders } = await request.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      logger.warn('유효하지 않은 주문 데이터', { orderCount: orders?.length });
      return NextResponse.json({ error: '유효한 주문 데이터가 없습니다.' }, { status: 400 });
    }

    // 🔒 사용자의 조직 정보 가져오기
    const organization = await getUserPrimaryOrganization(user.id);
    if (!organization) {
      logger.error('조직 정보 없음');
      return NextResponse.json({ error: '조직 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 옵션상품 매핑 적용 (조직 기준)
    const { data: mappings } = await supabase
      .from('option_name_mappings')
      .select('*')
      .eq('organization_id', organization.id);


    const mappingMap = new Map(
      (mappings || []).map(m => [m.user_option_name, m.site_option_name])
    );

    // platform_seller_orders 테이블에 삽입할 데이터 준비 (조직 ID 포함)
    const insertData = orders.map((order: any) => {
      // 옵션상품 매핑 적용
      let optionName = order.optionName;
      if (optionName && mappingMap.has(optionName)) {
        optionName = mappingMap.get(optionName);
      }

      return {
        organization_id: organization.id, // 🔒 조직 ID
        created_by: user.id, // 생성자
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


    // 데이터베이스에 삽입
    const { data, error } = await supabase
      .from('platform_seller_orders')
      .insert(insertData)
      .select();

    if (error) {
      logger.error('주문 삽입 오류', error);
      return NextResponse.json({ error: '주문 등록에 실패했습니다.', details: error.message }, { status: 500 });
    }

    logger.info('플랫폼 주문 등록 성공', { count: data.length });

    return NextResponse.json({
      success: true,
      count: data.length,
      orders: data
    });

  } catch (error) {
    logger.error('플랫폼 주문 등록 API 오류', error as Error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
