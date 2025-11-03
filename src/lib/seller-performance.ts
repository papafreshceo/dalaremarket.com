/**
 * 셀러 성과 추적 유틸리티
 *
 * 주문 등록, 발주확정, 취소 등의 이벤트 발생 시
 * seller_performance_daily 테이블을 업데이트합니다.
 */

import { createClient } from '@/lib/supabase/server';

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (KST 기준)
 */
function getTodayKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  return kstTime.toISOString().split('T')[0];
}

/**
 * 두 날짜 사이의 시간 차이를 시간 단위로 반환
 */
function getHoursDiff(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

/**
 * seller_performance_daily 레코드 초기화 또는 가져오기
 */
async function getOrCreateDailyPerformance(sellerId: string, date: string) {
  const supabase = await createClient();

  // 기존 레코드 조회
  const { data: existing, error: fetchError } = await supabase
    .from('seller_performance_daily')
    .select('*')
    .eq('seller_id', sellerId)
    .eq('date', date)
    .single();

  if (existing && !fetchError) {
    return { data: existing, error: null };
  }

  // 레코드가 없으면 생성
  const { data: created, error: createError } = await supabase
    .from('seller_performance_daily')
    .insert({
      seller_id: sellerId,
      date: date,
      total_sales: 0,
      order_count: 0,
      cancel_count: 0,
      upload_count: 0,
      error_count: 0
    })
    .select()
    .single();

  return { data: created, error: createError };
}

/**
 * 주문 등록 시 호출
 * 주문 건수만 증가시킴 (매출은 발주확정 시 추가)
 */
export async function trackOrderRegistered(sellerId: string) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    // 기존 레코드 가져오기 또는 생성
    const { data: performance } = await getOrCreateDailyPerformance(sellerId, today);

    if (!performance) {
      console.error('Failed to get or create daily performance');
      return { success: false };
    }

    // 주문 건수 증가
    const { error } = await supabase
      .from('seller_performance_daily')
      .update({
        order_count: (performance.order_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    if (error) {
      console.error('Failed to update order count:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('trackOrderRegistered error:', error);
    return { success: false, error };
  }
}

/**
 * 발주확정 시 호출
 * 매출액 추가 및 평균 발주확정 시간 업데이트
 */
export async function trackOrderConfirmed(
  sellerId: string,
  orderAmount: number,
  registeredAt: string,
  confirmedAt: string
) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    // 기존 레코드 가져오기 또는 생성
    const { data: performance } = await getOrCreateDailyPerformance(sellerId, today);

    if (!performance) {
      console.error('Failed to get or create daily performance');
      return { success: false };
    }

    // 발주확정 시간 계산 (시간 단위)
    const confirmHours = getHoursDiff(registeredAt, confirmedAt);
    const newTotalConfirmHours = (performance.total_confirm_hours || 0) + confirmHours;
    const confirmedOrderCount = (performance.order_count || 0);  // 발주확정된 주문 수
    const newAvgConfirmHours = confirmedOrderCount > 0 ? newTotalConfirmHours / confirmedOrderCount : confirmHours;

    // 당일 발주확정 여부
    const isSameDay = confirmHours < 24;

    // 업데이트
    const { error } = await supabase
      .from('seller_performance_daily')
      .update({
        total_sales: (performance.total_sales || 0) + orderAmount,
        total_confirm_hours: newTotalConfirmHours,
        avg_confirm_hours: newAvgConfirmHours,
        same_day_confirm_count: (performance.same_day_confirm_count || 0) + (isSameDay ? 1 : 0),
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    if (error) {
      console.error('Failed to update order confirmation:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('trackOrderConfirmed error:', error);
    return { success: false, error };
  }
}

/**
 * 취소요청 시 호출
 * 취소 건수 증가 및 취소율 업데이트
 */
export async function trackOrderCancelled(sellerId: string) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    // 기존 레코드 가져오기 또는 생성
    const { data: performance } = await getOrCreateDailyPerformance(sellerId, today);

    if (!performance) {
      console.error('Failed to get or create daily performance');
      return { success: false };
    }

    // 취소율 계산
    const newCancelCount = (performance.cancel_count || 0) + 1;
    const totalOrders = performance.order_count || 0;
    const cancelRate = totalOrders > 0 ? (newCancelCount / totalOrders) * 100 : 0;

    // 업데이트
    const { error } = await supabase
      .from('seller_performance_daily')
      .update({
        cancel_count: newCancelCount,
        cancel_rate: cancelRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    if (error) {
      console.error('Failed to update cancellation:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('trackOrderCancelled error:', error);
    return { success: false, error };
  }
}

/**
 * 엑셀 업로드 시 호출 (오류 추적)
 * 업로드 건수 및 오류 건수 업데이트
 */
export async function trackExcelUpload(sellerId: string, errorCount: number = 0) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    // 기존 레코드 가져오기 또는 생성
    const { data: performance } = await getOrCreateDailyPerformance(sellerId, today);

    if (!performance) {
      console.error('Failed to get or create daily performance');
      return { success: false };
    }

    // 오류율 계산
    const newUploadCount = (performance.upload_count || 0) + 1;
    const newErrorCount = (performance.error_count || 0) + errorCount;
    const errorRate = newUploadCount > 0 ? (newErrorCount / newUploadCount) * 100 : 0;

    // 업데이트
    const { error } = await supabase
      .from('seller_performance_daily')
      .update({
        upload_count: newUploadCount,
        error_count: newErrorCount,
        error_rate: errorRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    if (error) {
      console.error('Failed to update excel upload:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('trackExcelUpload error:', error);
    return { success: false, error };
  }
}

/**
 * 특정 셀러의 오늘 성과 조회
 */
export async function getTodayPerformance(sellerId: string) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('seller_performance_daily')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows returned
      console.error('Failed to get today performance:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('getTodayPerformance error:', error);
    return { data: null, error };
  }
}
