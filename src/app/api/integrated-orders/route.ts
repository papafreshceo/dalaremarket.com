import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichOrdersWithOptionInfo } from '@/lib/order-utils';
import { requireAuth, requireAdmin, auditLog } from '@/lib/api-security';

/**
 * GET /api/integrated-orders
 * 주문 조회 (검색, 필터링, 페이지네이션)
 * Updated: seller_name fallback to name/email when company_name is null
 * Security: 인증 필요
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 주문 조회 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dateType = searchParams.get('dateType') || 'sheet'; // 'sheet' | 'payment'
    const marketName = searchParams.get('marketName');
    const searchKeyword = searchParams.get('searchKeyword');
    const shippingStatus = searchParams.get('shippingStatus');
    const vendorName = searchParams.get('vendorName');
    const onlyWithSeller = searchParams.get('onlyWithSeller') === 'true'; // seller_id가 있는 주문만
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam ? parseInt(offsetParam) : (page - 1) * limit;

    // 기본 쿼리 (삭제되지 않은 주문만 조회)
    let query = supabase
      .from('integrated_orders')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false);

    // seller_id가 있는 주문만 필터링
    if (onlyWithSeller) {
      query = query.not('seller_id', 'is', null);
    }

    // 날짜 필터
    if (startDate && endDate) {
      const dateColumn = dateType === 'payment' ? 'payment_date' : 'sheet_date';
      query = query.gte(dateColumn, startDate).lte(dateColumn, endDate);
    }

    // 마켓 필터
    if (marketName) {
      query = query.eq('market_name', marketName);
    }

    // 발송상태 필터
    if (shippingStatus) {
      query = query.eq('shipping_status', shippingStatus);
    }

    // 벤더사 필터
    if (vendorName) {
      query = query.eq('vendor_name', vendorName);
    }

    // 검색어 (주문번호, 수취인명, 옵션명)
    if (searchKeyword) {
      query = query.or(
        `order_number.ilike.%${searchKeyword}%,recipient_name.ilike.%${searchKeyword}%,option_name.ilike.%${searchKeyword}%`
      );
    }

    // 정렬 (최신순 - 마켓 순서는 클라이언트에서 정렬)
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (data) {
      const marketNames = [...new Set(data.map((o: any) => o.market_name))];
      console.log('📊 DB에서 가져온 마켓명:', marketNames);
      console.log('📊 전체 주문 수:', data.length);
    }

    if (error) {
      console.error('주문 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 마켓별 display_order 가져오기
    const { data: marketSettings } = await supabase
      .from('mapping_settings')
      .select('market_name, display_order');

    const marketOrderMap = new Map<string, number>();
    (marketSettings || []).forEach((setting) => {
      marketOrderMap.set(setting.market_name, setting.display_order || 999);
    });

    // 데이터를 마켓 순서 -> 최신순으로 정렬
    const sortedData = (data || []).sort((a, b) => {
      const orderA = marketOrderMap.get(a.market_name || '') || 999;
      const orderB = marketOrderMap.get(b.market_name || '') || 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // 같은 마켓이면 최신순
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // seller_id로 users 정보 가져오기
    const sellerIds = [...new Set(sortedData.map(order => order.seller_id).filter(Boolean))];
    const sellersMap = new Map<string, string>();

    if (sellerIds.length > 0) {
      const { data: sellers } = await supabase
        .from('users')
        .select('id, company_name, name, email')
        .in('id', sellerIds);

      (sellers || []).forEach((seller) => {
        // company_name이 없으면 name, 그것도 없으면 email 사용
        const displayName = seller.company_name || seller.name || seller.email || '미지정';
        sellersMap.set(seller.id, displayName);
        console.log(`Seller mapping: ${seller.id} => ${displayName}`);
      });
    }

    // seller_id를 통해 company_name을 seller_name에 매핑
    const normalizedData = sortedData.map(order => ({
      ...order,
      seller_name: order.seller_id ? sellersMap.get(order.seller_id) || null : null
    }));

    // 페이지네이션 적용 (limit이 0이면 전체 데이터 반환)
    const paginatedData = limit === 0 ? normalizedData : normalizedData.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: limit === 0 ? 1 : Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/integrated-orders 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrated-orders
 * 단건 주문 생성
 * Security: 직원 이상 권한 필요
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 보안: 직원 이상만 주문 생성 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const body = await request.json();

    // 필수 필드 검증
    const requiredFields = ['market_name', 'order_number', 'recipient_name', 'option_name', 'quantity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `필수 필드 누락: ${field}` },
          { status: 400 }
        );
      }
    }

    // sheet_date 기본값 설정
    if (!body.sheet_date) {
      body.sheet_date = new Date().toISOString().split('T')[0];
    }

    // 옵션 상품 정보 자동 매핑 (option_products 테이블)
    const enrichedOrders = await enrichOrdersWithOptionInfo([body]);
    const orderDataWithInfo = enrichedOrders[0];

    const { data, error } = await supabase
      .from('integrated_orders')
      .insert(orderDataWithInfo)
      .select()
      .single();

    if (error) {
      console.error('주문 생성 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('POST /api/integrated-orders 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrated-orders
 * 주문 수정
 * Security: 인증 필요
 */
export async function PUT(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 주문 수정 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID 필드가 필요합니다.' },
        { status: 400 }
      );
    }

    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('integrated_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('주문 수정 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('PUT /api/integrated-orders 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrated-orders
 * 주문 삭제
 * Security: 관리자 이상 권한 필요
 */
export async function DELETE(request: NextRequest) {
  try {
    // 🔒 보안: 관리자 이상만 주문 삭제 가능
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 삭제할 주문 정보 조회 (감사 로그용)
    const { data: order } = await supabase
      .from('integrated_orders')
      .select('order_number, market_name')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('integrated_orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('주문 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 🔒 감사 로그: 주문 삭제 기록
    if (order) {
      auditLog('주문 삭제', auth.userData, {
        order_id: id,
        order_number: order.order_number,
        market_name: order.market_name
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/integrated-orders 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
