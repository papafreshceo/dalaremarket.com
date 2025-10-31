import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichOrdersWithOptionInfo } from '@/lib/order-utils';
import { applyOptionMappingToOrdersServer } from '@/lib/option-mapping-utils';
import sampleOrdersTemplate from '@/lib/sample-orders-template.json';

/**
 * GET /api/platform-orders
 *
 * 주문 데이터 조회 API
 * - show_sample_data가 true이고 실제 주문이 없으면 샘플 데이터 반환
 * - 그렇지 않으면 실제 DB 데이터 반환
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // users 테이블에서 show_sample_data 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('show_sample_data')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[GET platform-orders] 사용자 정보 조회 실패:', userError);
    }

    const showSampleData = userData?.show_sample_data ?? false;

    // 실제 주문 데이터 조회
    const { data: orders, error: ordersError } = await supabase
      .from('integrated_orders')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[GET platform-orders] 주문 조회 오류:', ordersError);
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    // 샘플 데이터 반환 조건: show_sample_data가 true이고 실제 주문이 없을 때
    if (showSampleData && (!orders || orders.length === 0)) {
      console.log('[GET platform-orders] 샘플 데이터 모드 활성화');

      // 실제 option_products 조회
      const { data: optionProducts, error: opError } = await supabase
        .from('option_products')
        .select('id, option_name, seller_supply_price')
        .eq('is_active', true);

      if (opError) {
        console.error('[GET platform-orders] option_products 조회 실패:', opError);
        return NextResponse.json(
          { success: false, error: '샘플 데이터 생성 실패' },
          { status: 500 }
        );
      }

      if (!optionProducts || optionProducts.length === 0) {
        console.warn('[GET platform-orders] 옵션 상품이 없습니다. 빈 샘플 데이터 반환');
        return NextResponse.json({
          success: true,
          data: [],
          isSample: true,
          message: '옵션 상품을 먼저 등록해주세요.',
        });
      }

      // 템플릿에 실제 옵션 상품 매핑
      const sampleOrders = sampleOrdersTemplate.map(template => {
        // 랜덤 옵션 상품 선택
        const randomOption = optionProducts[Math.floor(Math.random() * optionProducts.length)];
        const supplyPrice = randomOption.seller_supply_price || 10000;

        return {
          ...template,
          option_name: randomOption.option_name,
          seller_supply_price: supplyPrice,
          settlement_amount: supplyPrice * template.quantity,
          seller_id: user.id,
        };
      });

      console.log(`[GET platform-orders] 샘플 데이터 생성 완료: ${sampleOrders.length}건`);

      return NextResponse.json({
        success: true,
        data: sampleOrders,
        isSample: true,
      });
    }

    // 실제 주문 데이터 반환
    return NextResponse.json({
      success: true,
      data: orders || [],
      isSample: false,
    });

  } catch (error: any) {
    console.error('GET /api/platform-orders 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platform-orders
 *
 * 플랫폼 셀러 주문 등록 API (마켓파일 업로드용)
 *
 * 처리 흐름:
 * 1. 사용자 인증 확인
 * 2. 옵션명 매핑 적용 (사용자 설정 기준)
 * 3. 옵션 상품 정보 조회 및 매핑 (공급단가, 발송정보 등)
 * 4. DB 저장
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
      // 다건 처리 (마켓파일 업로드)
      let { orders } = body;

      if (!orders || orders.length === 0) {
        return NextResponse.json(
          { success: false, error: '주문 데이터가 필요합니다.' },
          { status: 400 }
        );
      }

      // 1단계: 옵션명 매핑 적용 (사용자 설정 기준)
      orders = await applyOptionMappingToOrdersServer(orders, user.id);

      // 2단계: 옵션 상품 정보 자동 매핑 (공급단가, 발송정보 등)
      const ordersWithInfo = await enrichOrdersWithOptionInfo(orders);

      console.log('[platform-orders] DB에 저장할 데이터 (첫 번째 주문):', JSON.stringify(ordersWithInfo[0], null, 2));

      // DB에 일괄 저장
      const { data, error } = await supabase
        .from('integrated_orders')
        .insert(ordersWithInfo)
        .select();

      if (error) {
        console.error('[platform-orders] 주문 저장 실패:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // 첫 주문 업로드 시 show_sample_data를 false로 변경
      await supabase
        .from('users')
        .update({ show_sample_data: false })
        .eq('id', user.id);

      console.log('[platform-orders] 샘플 모드 비활성화 (첫 주문 업로드)');

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

      // 옵션 상품 정보 자동 매핑 (단건용)
      const ordersWithInfo = await enrichOrdersWithOptionInfo([orderData]);
      const orderWithInfo = ordersWithInfo[0];

      // DB에 저장
      const { data, error } = await supabase
        .from('integrated_orders')
        .insert(orderWithInfo)
        .select()
        .single();

      if (error) {
        console.error('[platform-orders] 주문 저장 실패:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // 첫 주문 업로드 시 show_sample_data를 false로 변경
      await supabase
        .from('users')
        .update({ show_sample_data: false })
        .eq('id', user.id);

      console.log('[platform-orders] 샘플 모드 비활성화 (첫 주문 업로드)');

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
