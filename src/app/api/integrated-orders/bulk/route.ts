import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { enrichOrdersWithOptionInfo } from '@/lib/order-utils';

/**
 * POST /api/integrated-orders/bulk
 * 대량 주문 생성/업데이트 (UPSERT)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { orders, checkDuplicatesOnly = false } = await request.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // sheet_date 기본값 설정
    const ordersWithDate = orders.map((order) => {
      if (!order.sheet_date) {
        order.sheet_date = new Date().toISOString().split('T')[0];
      }
      return order;
    });

    // 옵션 상품 정보 자동 매핑 (option_products 테이블)
    const processedOrders = await enrichOrdersWithOptionInfo(ordersWithDate);

    // 오늘 날짜
    const today = processedOrders[0]?.sheet_date || new Date().toISOString().split('T')[0];

    // 회차 정보 계산 - 오늘 날짜 기준 최대 연번 조회
    const { data: maxSeqData } = await supabase
      .from('integrated_orders')
      .select('sequence_number')
      .eq('sheet_date', today)
      .eq('is_deleted', false)
      .order('sequence_number', { ascending: false })
      .limit(1);

    const maxSeq = maxSeqData?.[0]?.sequence_number;
    let currentBatch = 1;
    let nextSeqStart = 1;

    if (maxSeq) {
      const maxNum = parseInt(maxSeq);
      currentBatch = Math.floor(maxNum / 1000) + 1;
      nextSeqStart = currentBatch * 1000 + 1;
    }

    // 저장 전 기존 주문 수 확인
    const { count: beforeCount } = await supabase
      .from('integrated_orders')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // 중복 체크를 위해 기존 주문 조회
    const { data: existingOrders } = await supabase
      .from('integrated_orders')
      .select('market_name, order_number, buyer_name, recipient_name, option_name, quantity')
      .eq('is_deleted', false);

    // 중복 카운트 계산
    const existingSet = new Set(
      (existingOrders || []).map(order =>
        `${order.market_name || ''}-${order.order_number || ''}-${order.buyer_name || ''}-${order.recipient_name || ''}-${order.option_name || ''}-${order.quantity || ''}`
      )
    );

    let duplicateCount = 0;
    let newCount = 0;
    processedOrders.forEach(order => {
      const key = `${order.market_name || ''}-${order.order_number || ''}-${order.buyer_name || ''}-${order.recipient_name || ''}-${order.option_name || ''}-${order.quantity || ''}`;
      if (existingSet.has(key)) {
        duplicateCount++;
      } else {
        newCount++;
      }
    });

    // 중복 체크만 하는 경우
    if (checkDuplicatesOnly && duplicateCount > 0) {
      return NextResponse.json({
        success: true,
        duplicatesDetected: true,
        newCount,
        duplicateCount,
        total: processedOrders.length,
        batchInfo: {
          currentBatch,
          nextSequenceStart: nextSeqStart,
          sequenceFormat: `${String(nextSeqStart).padStart(4, '0')}~${String(nextSeqStart + newCount - 1).padStart(4, '0')}`
        }
      });
    }

    // UPSERT 수행 (중복 주문 덮어쓰기)
    // market_name, order_number, buyer_name, recipient_name, option_name, quantity 기준
    const { data, error} = await supabase
      .from('integrated_orders')
      .upsert(processedOrders, {
        onConflict: 'market_name,order_number,buyer_name,recipient_name,option_name,quantity',
        ignoreDuplicates: false,  // 중복 시 덮어쓰기
      })
      .select();

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

    return NextResponse.json({
      success: true,
      total: processedOrders.length,
      newCount: actualNewCount,
      duplicateCount: duplicateCount,
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
