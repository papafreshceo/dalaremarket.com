import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichOrdersWithOptionInfo } from '@/lib/order-utils';
import { requireStaff } from '@/lib/api-security';
import { canCreateServer, canUpdateServer, canDeleteServer } from '@/lib/permissions-server';
import { getOrganizationDataFilter } from '@/lib/organization-utils';

/**
 * POST /api/integrated-orders/bulk
 * 대량 주문 생성/업데이트 (UPSERT)
 */
export async function POST(request: NextRequest) {
  // 🔒 보안: 직원 이상 접근 가능
  const auth = await requireStaff(request);
  if (!auth.authorized) return auth.error;

  // 🔒 권한 체크: 생성 권한 확인
  const hasCreatePermission = await canCreateServer(auth.user!.id, '/admin/order-integration');
  if (!hasCreatePermission) {
    return NextResponse.json(
      { success: false, error: '주문 생성 권한이 없습니다.' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const { orders, overwriteDuplicates = false, skipDuplicateCheck = false } = await request.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 🔒 조직 ID 자동 설정
    const organizationId = await getOrganizationDataFilter(auth.user.id);

    // sheet_date 기본값 및 조직 ID 설정
    const ordersWithDate = orders.map((order) => {
      if (!order.sheet_date) {
        order.sheet_date = new Date().toISOString().split('T')[0];
      }
      if (organizationId) {
        order.organization_id = organizationId;
      }
      return order;
    });

    // 옵션 상품 정보 자동 매핑 (option_products 테이블)
    const processedOrders = await enrichOrdersWithOptionInfo(ordersWithDate);

    // 오늘 날짜
    const today = processedOrders[0]?.sheet_date || new Date().toISOString().split('T')[0];

    // 저장하려는 주문들의 마켓명 목록 추출
    const marketNames = [...new Set(processedOrders.map(o => o.market_name).filter(Boolean))];

    // 각 마켓별 최대 회차 계산
    const marketBatchInfo: Record<string, { currentBatch: number; maxSeq: number }> = {};

    for (const marketName of marketNames) {
      // 해당 마켓의 오늘 날짜 기준 최대 연번 조회 (market_check 컬럼 = "N1001" 형식)
      const { data: maxMarketData } = await supabase
        .from('integrated_orders')
        .select('market_check')
        .eq('market_name', marketName)
        .eq('sheet_date', today) // 오늘 날짜만 조회
        .eq('is_deleted', false)
        .not('market_check', 'is', null)
        .order('market_check', { ascending: false })
        .limit(1);

      let currentBatch = 1;
      let maxSeq = 0;

      if (maxMarketData?.[0]?.market_check) {
        // market_check 형식: "N1050" → 숫자 부분 추출 (1050)
        const marketCheck = maxMarketData[0].market_check;
        const numPart = marketCheck.replace(/[A-Z]/g, ''); // 이니셜 제거
        maxSeq = parseInt(numPart) || 0;

        // 회차 계산: 천의 자리가 회차 번호
        // 1001~1999 = 1회차, 2001~2999 = 2회차, 3001~3999 = 3회차
        currentBatch = Math.floor(maxSeq / 1000);

        // 다음 회차로 넘어가야 함
        currentBatch++;
      }

      marketBatchInfo[marketName] = { currentBatch, maxSeq };
    }

    // 전체 주문의 대표 회차 정보 (모달 표시용 - 최대 회차 사용)
    const representativeBatch = Math.max(...Object.values(marketBatchInfo).map(info => info.currentBatch));
    const nextSeqStart = 1; // 실제 연번은 사용 안 함 (마켓별로 계산되므로)

    // 저장 전 기존 주문 수 확인
    const { count: beforeCount } = await supabase
      .from('integrated_orders')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // 중복 체크를 위해 업로드하려는 주문번호 목록만 DB에서 조회 (성능 최적화)
    // 전체 DB를 조회하지 않고, 업로드할 주문번호만 IN 절로 검색
    const uploadOrderNumbers = processedOrders
      .map(o => o.order_number)
      .filter(Boolean)
      .map(num => String(num).trim());


    // 업로드하려는 주문번호 중에서 이미 DB에 있는 것만 조회 (IN 절 사용)
    const { data: existingOrders, error: fetchError } = await supabase
      .from('integrated_orders')
      .select('order_number')
      .in('order_number', uploadOrderNumbers)
      .eq('is_deleted', false);

    if (fetchError) {
      console.error('기존 주문 조회 실패:', fetchError);
    }

    // 중복 체크를 위한 Set 생성
    const existingOrderNumbers = new Set(
      (existingOrders || [])
        .map(order => String(order.order_number).trim())
        .filter(Boolean)
    );


    let duplicateCount = 0;
    let newCount = 0;
    processedOrders.forEach(order => {
      // 주문번호를 문자열로 변환하여 비교
      const orderNumber = order.order_number ? String(order.order_number).trim() : null;
      if (orderNumber && existingOrderNumbers.has(orderNumber)) {
        duplicateCount++;
      } else {
        newCount++;
      }
    });


    // 중복이 있고 덮어쓰기가 아니며 중복 체크를 건너뛰지 않는 경우 → 확인 모달 표시
    if (duplicateCount > 0 && !overwriteDuplicates && !skipDuplicateCheck) {
      // 마켓별 회차 정보 생성
      const marketBatchDetails = Object.entries(marketBatchInfo)
        .map(([marketName, info]) => `${marketName}: ${info.currentBatch}회차`)
        .join(', ');

      return NextResponse.json({
        success: true,
        duplicatesDetected: true,
        newCount,
        duplicateCount,
        total: processedOrders.length,
        batchInfo: {
          currentBatch: representativeBatch,
          marketBatchDetails, // 마켓별 회차 상세 정보
          nextSequenceStart: nextSeqStart,
          sequenceFormat: `마켓별 독립 연번 (${marketBatchDetails})`
        }
      });
    }

    // 신규 주문에만 회차별 연번 부여
    // 마켓별 카운터 초기화
    const marketCounters: Record<string, number> = {};
    for (const marketName of marketNames) {
      const batchInfo = marketBatchInfo[marketName];
      // 시작 연번: 회차 * 1000 + 1 (예: 1회차 = 1001, 2회차 = 2001)
      marketCounters[marketName] = batchInfo.currentBatch * 1000;
    }

    // 중복 제외 모드: 신규 주문만 필터링 (주문번호 기준)
    let ordersToSave = processedOrders;
    if (!overwriteDuplicates) {
      ordersToSave = processedOrders.filter(order => {
        const orderNumber = order.order_number ? String(order.order_number).trim() : null;
        return !(orderNumber && existingOrderNumbers.has(orderNumber));
      });
    }

    // 주문에 연번 부여
    const ordersWithSequence = ordersToSave.map(order => {
      const marketName = order.market_name;
      const orderNumber = order.order_number ? String(order.order_number).trim() : null;
      const isNewOrder = !(orderNumber && existingOrderNumbers.has(orderNumber));

      // 신규 주문에만 새 연번 부여
      if (isNewOrder && marketName && marketCounters[marketName] !== undefined) {
        marketCounters[marketName]++;
        const newSeq = marketCounters[marketName];

        return {
          ...order,
          sequence_number: String(newSeq).padStart(4, '0'),
          market_check: order.market_check?.replace(/\d+/, String(newSeq).padStart(4, '0')) // 이니셜+연번 업데이트
        };
      }

      return order; // 덮어쓰기 모드의 중복 주문은 기존 연번 유지
    });

    // INSERT 또는 UPSERT 수행
    let data, error;


    if (overwriteDuplicates) {
      // 덮어쓰기 모드: UPSERT 사용 (중복 시 덮어쓰기)
      const result = await supabase
        .from('integrated_orders')
        .upsert(ordersWithSequence, {
          onConflict: 'order_number',
          ignoreDuplicates: false,
        })
        .select();
      data = result.data;
      error = result.error;
    } else {
      // 중복 제외 모드: INSERT 사용 (이미 필터링됨)
      const result = await supabase
        .from('integrated_orders')
        .insert(ordersWithSequence)
        .select();
      data = result.data;
      error = result.error;
    }


    if (error) {
      console.error('대량 주문 생성 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 저장 후 주문 수 확인
    const { count: afterCount } = await supabase
      .from('integrated_orders')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    const actualNewCount = (afterCount || 0) - (beforeCount || 0);

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

    return NextResponse.json({
      success: true,
      total: processedOrders.length,
      newCount: overwriteDuplicates ? actualNewCount : ordersWithSequence.length,
      duplicateCount: overwriteDuplicates ? duplicateCount : 0,
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
  // 🔒 보안: 직원 이상 접근 가능
  const auth = await requireStaff(request);
  if (!auth.authorized) return auth.error;

  // 🔒 권한 체크: 수정 권한 확인
  const hasUpdatePermission = await canUpdateServer(auth.user!.id, '/admin/order-integration');
  if (!hasUpdatePermission) {
    return NextResponse.json(
      { success: false, error: '주문 수정 권한이 없습니다.' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const { orders } = await request.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 업데이트 가능한 칼럼 목록 (DB에 실제로 존재하는 칼럼만)
    const allowedColumns = [
      'sheet_date', 'market_name', 'sequence_number', 'payment_date', 'order_number',
      'buyer_name', 'buyer_phone', 'recipient_name', 'recipient_phone', 'recipient_address',
      'delivery_message', 'option_name', 'quantity', 'option_price', 'delivery_fee',
      'total_amount', 'settlement_amount', 'seller_id', 'courier_company', 'tracking_number',
      'shipping_date', 'shipped_date', 'order_status', 'shipping_status', 'payment_method', 'market_fee', 'pg_fee',
      'delivery_fee_paid_by_seller', 'other_fees', 'payment_confirmed_at', 'shipped_at',
      'delivered_at', 'cancelled_at', 'refunded_at', 'refund_processed_at', 'cancel_reason',
      'refund_reason', 'customer_id', 'cs_memo', 'admin_memo', 'market_check', 'is_deleted'
    ];

    // 각 주문 개별 업데이트
    const updatePromises = orders.map(async (order) => {
      if (!order.id) {
        throw new Error('각 주문에 ID가 필요합니다.');
      }

      const { id, ...allData } = order;

      // 허용된 칼럼만 필터링
      const updateData: any = {};
      for (const key of allowedColumns) {
        if (key in allData) {
          updateData[key] = allData[key];
        }
      }

      const result = await supabase
        .from('integrated_orders')
        .update(updateData)
        .eq('id', id)
        .select();

      if (result.error) {
        console.error(`주문 ${id} 업데이트 실패:`, result.error);
      }

      return result;
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

    const data = results.flatMap((r) => r.data || []);

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
  // 🔒 보안: 직원 이상 접근 가능
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
