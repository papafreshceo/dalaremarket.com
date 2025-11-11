import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichOrdersWithOptionInfo } from '@/lib/order-utils';
import { applyOptionMappingToOrdersServer } from '@/lib/option-mapping-utils';
import { generateSampleOrders, convertSampleOrdersToDBFormat } from '@/lib/sample-data';
import { getOrganizationDataFilter } from '@/lib/organization-utils';

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
    const { searchParams } = new URL(request.url);

    // 날짜 필터 파라미터
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // impersonate 헤더 확인
    const impersonateUserId = request.headers.get('X-Impersonate-User-Id');

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 실제 사용할 사용자 ID 결정 (impersonate 우선)
    const effectiveUserId = impersonateUserId || user?.id;

    if (impersonateUserId) {
      console.log('[GET platform-orders] Impersonate 모드:', {
        impersonateUserId,
        adminUserId: user?.id
      });
    }

    // 비로그인 사용자이고 impersonate도 아닌 경우 샘플 데이터 반환
    if (!effectiveUserId) {

      // 실제 option_products 조회 (service role 사용으로 RLS 우회)
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: optionProducts, error: opError } = await supabaseAdmin
        .from('option_products')
        .select('id, option_name, seller_supply_price')
        .eq('is_active', true);

      if (opError || !optionProducts || optionProducts.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          isSample: true,
          isGuest: true,
          message: '샘플 데이터를 불러올 수 없습니다.',
        });
      }

      // 동적으로 1년치 샘플 데이터 생성 (오늘 기준)
      const sampleOrdersData = generateSampleOrders(
        optionProducts.map(op => ({
          id: op.id,
          option_name: op.option_name,
          seller_supply_price: op.seller_supply_price,
        }))
      );

      // DB 포맷으로 변환
      const sampleOrders = convertSampleOrdersToDBFormat(sampleOrdersData, 'guest');


      return NextResponse.json({
        success: true,
        data: sampleOrders,
        isSample: true,
        isGuest: true,
      });
    }

    // impersonate 모드인 경우 Service Role 사용 (RLS 우회)
    let dbClient = supabase;

    if (impersonateUserId) {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      dbClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }

    // 로그인 사용자인 경우
    // users 테이블에서 show_sample_data 확인
    const { data: userData, error: userError } = await dbClient
      .from('users')
      .select('show_sample_data')
      .eq('id', effectiveUserId)
      .single();

    if (userError) {
      console.error('[GET platform-orders] 사용자 정보 조회 실패:', userError);
    }

    const showSampleData = userData?.show_sample_data ?? false;

    // 실제 주문 데이터 조회
    console.log('[GET platform-orders] 주문 조회 시작:', {
      effectiveUserId,
      isImpersonate: !!impersonateUserId,
      usingServiceRole: !!impersonateUserId,
      startDate,
      endDate
    });

    // 🔒 조직 필터 적용
    const organizationId = await getOrganizationDataFilter(effectiveUserId);

    // 쿼리 빌더
    let query = dbClient
      .from('integrated_orders')
      .select('*')
      .eq('is_deleted', false);

    // 조직이 있으면 조직 주문, 없으면 본인 주문만 조회
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    } else {
      query = query.eq('seller_id', effectiveUserId);
    }

    // 날짜 필터 적용
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      // endDate는 해당 날짜의 23:59:59까지 포함
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateTime.toISOString());
    }

    // 정렬
    query = query.order('created_at', { ascending: false });

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('[GET platform-orders] 주문 조회 오류:', ordersError);
      return NextResponse.json(
        { success: false, error: ordersError.message },
        { status: 500 }
      );
    }

    console.log('[GET platform-orders] 주문 조회 결과:', {
      effectiveUserId,
      orderCount: orders?.length || 0,
      isImpersonate: !!impersonateUserId,
      firstOrderSellerId: orders?.[0]?.seller_id || 'none'
    });

    // 샘플 데이터 반환 조건: show_sample_data가 true이고 실제 주문이 없을 때
    if (showSampleData && (!orders || orders.length === 0)) {

      // 실제 option_products 조회 (service role 사용으로 RLS 우회)
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: optionProducts, error: opError } = await supabaseAdmin
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
        return NextResponse.json({
          success: true,
          data: [],
          isSample: true,
          message: '옵션 상품을 먼저 등록해주세요.',
        });
      }

      // 동적으로 1년치 샘플 데이터 생성 (오늘 기준)
      const sampleOrdersData = generateSampleOrders(
        optionProducts.map(op => ({
          id: op.id,
          option_name: op.option_name,
          seller_supply_price: op.seller_supply_price,
        }))
      );

      // DB 포맷으로 변환
      const sampleOrders = convertSampleOrdersToDBFormat(sampleOrdersData, effectiveUserId);


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
 * 2. 옵션상품 매핑 적용 (사용자 설정 기준)
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

      // 1단계: 옵션상품 매핑 적용 (사용자 설정 기준)
      orders = await applyOptionMappingToOrdersServer(orders, user.id);

      // 🔒 조직 ID 자동 설정
      const organizationId = await getOrganizationDataFilter(user.id);
      if (organizationId) {
        orders = orders.map((order: any) => ({
          ...order,
          organization_id: organizationId,
        }));
      }

      // 2단계: 옵션 상품 정보 자동 매핑 (공급단가, 발송정보 등)
      const ordersWithInfo = await enrichOrdersWithOptionInfo(orders);

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

      // 발주일 점수 추가 (하루 1회)
      try {
        await supabase.rpc('add_order_points', { p_user_id: user.id });
      } catch (pointsError) {
        console.error('Order points error:', pointsError);
        // 점수 추가 실패해도 주문은 성공으로 처리
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
          { success: false, error: '옵션상품은 필수입니다.' },
          { status: 400 }
        );
      }

      // seller_id 자동 설정
      if (!orderData.seller_id) {
        orderData.seller_id = user.id;
      }

      // 🔒 조직 ID 자동 설정
      const organizationId = await getOrganizationDataFilter(user.id);
      if (organizationId) {
        orderData.organization_id = organizationId;
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

      // 발주일 점수 추가 (하루 1회)
      try {
        await supabase.rpc('add_order_points', { p_user_id: user.id });
      } catch (pointsError) {
        console.error('Order points error:', pointsError);
        // 점수 추가 실패해도 주문은 성공으로 처리
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
