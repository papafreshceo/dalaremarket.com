import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichOrdersWithOptionInfo } from '@/lib/order-utils';
import { requireAuth, requireStaff, auditLog } from '@/lib/api-security';
import { canCreateServer, canUpdateServer, canDeleteServer } from '@/lib/permissions-server';
import { getOrganizationDataFilter } from '@/lib/organization-utils';

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

    const supabase = await createClientForRouteHandler();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dateType = searchParams.get('dateType') || 'sheet'; // 'sheet' | 'payment'
    const marketName = searchParams.get('marketName');
    const searchKeyword = searchParams.get('searchKeyword');
    const shippingStatus = searchParams.get('shippingStatus');
    const vendorName = searchParams.get('vendorName');
    const onlyWithSeller = searchParams.get('onlyWithSeller') === 'true'; // seller_id가 있는 주문만 (레거시)
    const onlyWithOrganization = searchParams.get('onlyWithOrganization') === 'true'; // organization_id가 있는 주문만
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam ? parseInt(offsetParam) : (page - 1) * limit;

    // 기본 쿼리 (삭제되지 않은 주문만 조회)
    let query = supabase
      .from('integrated_orders')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false);

    // 🔒 조직 필터: 같은 조직의 주문만 조회 (관리자 제외)
    if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin' && auth.user.role !== 'employee') {
      const organizationId = await getOrganizationDataFilter(auth.user.id);
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        // 조직이 없으면 본인이 등록한 주문만 조회
        query = query.eq('seller_id', auth.user.id);
      }
    }

    // organization_id가 있는 주문만 필터링 (관리자용)
    if (onlyWithOrganization) {
      query = query.not('organization_id', 'is', null);
    }

    // seller_id가 있는 주문만 필터링 (레거시 지원)
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

    // 검색어 (주문번호, 수취인명, 옵션상품, 주문자명, 주문자 전화번호, 수령인 전화번호, 수령인 주소, 송장번호, 연번)
    if (searchKeyword) {
      query = query.or(
        `order_number.ilike.%${searchKeyword}%,recipient_name.ilike.%${searchKeyword}%,option_name.ilike.%${searchKeyword}%,buyer_name.ilike.%${searchKeyword}%,buyer_phone.ilike.%${searchKeyword}%,recipient_phone.ilike.%${searchKeyword}%,recipient_address.ilike.%${searchKeyword}%,tracking_number.ilike.%${searchKeyword}%,sequence_number.ilike.%${searchKeyword}%`
      );
    }

    // 정렬 (최신순 - 마켓 순서는 클라이언트에서 정렬)
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (data) {
      const marketNames = [...new Set(data.map((o: any) => o.market_name))];
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

    // 🔒 권한 체크: 생성 권한 확인
    const hasCreatePermission = await canCreateServer(auth.user!.id, '/admin/order-integration');
    if (!hasCreatePermission) {
      return NextResponse.json(
        { success: false, error: '주문 생성 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const supabase = await createClientForRouteHandler();
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

    // 🔒 등록자 설정 (audit trail)
    body.created_by = auth.user.id;

    // 🔒 조직 ID 자동 설정 (관리자 제외)
    if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin') {
      const organizationId = await getOrganizationDataFilter(auth.user.id);
      if (organizationId) {
        body.organization_id = organizationId;
      }
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

    // 발주일 점수 추가 (하루 1회)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('add_order_points', { p_user_id: user.id });
      }
    } catch (pointsError) {
      console.error('Order points error:', pointsError);
      // 점수 추가 실패해도 주문은 성공으로 처리
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

    // 🔒 권한 체크: 수정 권한 확인
    const hasUpdatePermission = await canUpdateServer(auth.user!.id, '/admin/order-integration');
    if (!hasUpdatePermission) {
      return NextResponse.json(
        { success: false, error: '주문 수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const supabase = await createClientForRouteHandler();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID 필드가 필요합니다.' },
        { status: 400 }
      );
    }

    const { id, ...updateData } = body;

    // 상태 변경 전 기존 주문 정보 조회
    const { data: existingOrder } = await supabase
      .from('integrated_orders')
      .select('status, amount, seller_id')
      .eq('id', id)
      .single();

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

    // 발송완료 상태로 변경된 경우 랭킹 집계
    if (existingOrder && existingOrder.status !== 'shipped' && updateData.status === 'shipped') {
      const { trackOrderShipped } = await import('@/lib/seller-performance');
      await trackOrderShipped(data.seller_id, data.amount || 0);
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
 * Security: 직원 이상 권한 필요
 */
export async function DELETE(request: NextRequest) {
  try {
    // 🔒 보안: 직원 이상만 주문 삭제 가능
    const auth = await requireStaff(request);
    if (!auth.authorized) return auth.error;

    // 🔒 권한 체크: 삭제 권한 확인
    const hasDeletePermission = await canDeleteServer(auth.user!.id, '/admin/order-integration');
    if (!hasDeletePermission) {
      return NextResponse.json(
        { success: false, error: '주문 삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const supabase = await createClientForRouteHandler();
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
