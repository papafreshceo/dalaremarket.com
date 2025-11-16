/**
 * 조직 성과 추적 유틸리티
 *
 * 주문 등록, 발주확정, 취소 등의 이벤트 발생 시
 * seller_performance_daily 테이블을 조직 단위로 업데이트합니다.
 */

import { createClient } from '@/lib/supabase/server';
import { getUserPrimaryOrganization } from '@/lib/organization-utils';

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
 * seller_performance_daily 레코드 초기화 또는 가져오기 (조직 단위)
 */
async function getOrCreateDailyPerformance(organizationId: string, date: string) {
  const supabase = await createClient();

  // 기존 레코드 조회 (organization_id 기준)
  const { data: existing, error: fetchError } = await supabase
    .from('seller_performance_daily')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('date', date)
    .single();

  if (existing && !fetchError) {
    return { data: existing, error: null };
  }

  // 조직 정보 조회
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', organizationId)
    .single();

  // 레코드가 없으면 생성
  const { data: created, error: createError } = await supabase
    .from('seller_performance_daily')
    .insert({
      organization_id: organizationId,
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
 */
export async function trackOrderRegistered(userId: string) {
  // 발송완료 상태에서만 집계하므로 여기서는 처리하지 않음
  return { success: true };
}

/**
 * 발주확정 시 호출
 */
export async function trackOrderConfirmed(
  userId: string,
  orderAmount: number,
  registeredAt: string,
  confirmedAt: string
) {
  // 발송완료 시에만 집계하므로 발주확정 시에는 처리하지 않음
  return { success: true };
}

/**
 * 발송완료 시 호출 (조직 단위)
 * 주문 건수 +1, 매출액 추가
 */
export async function trackOrderShipped(
  userId: string,
  orderAmount: number
) {
  try {
    const today = getTodayKST();

    // 사용자의 조직 정보 가져오기
    const organization = await getUserPrimaryOrganization(userId);
    if (!organization) {
      console.error('Organization not found for user:', userId);
      return { success: false };
    }

    // 기존 레코드 가져오기 또는 생성
    const { data: performance } = await getOrCreateDailyPerformance(organization.id, today);

    if (!performance) {
      console.error('Failed to get or create daily performance');
      return { success: false };
    }

    const supabase = await createClient();

    // 주문 건수 +1, 매출액 추가
    const { error } = await supabase
      .from('seller_performance_daily')
      .update({
        order_count: (performance.order_count || 0) + 1,
        total_sales: (performance.total_sales || 0) + orderAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    if (error) {
      console.error('Failed to update order shipped:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('trackOrderShipped error:', error);
    return { success: false, error };
  }
}

/**
 * 취소요청 시 호출 (조직 단위)
 * 취소 건수 증가 및 취소율 업데이트
 */
export async function trackOrderCancelled(userId: string) {
  try {
    const today = getTodayKST();

    // 사용자의 조직 정보 가져오기
    const organization = await getUserPrimaryOrganization(userId);
    if (!organization) {
      console.error('Organization not found for user:', userId);
      return { success: false };
    }

    // 기존 레코드 가져오기 또는 생성
    const { data: performance } = await getOrCreateDailyPerformance(organization.id, today);

    if (!performance) {
      console.error('Failed to get or create daily performance');
      return { success: false };
    }

    // 취소율 계산
    const newCancelCount = (performance.cancel_count || 0) + 1;
    const totalOrders = performance.order_count || 0;
    const cancelRate = totalOrders > 0 ? (newCancelCount / totalOrders) * 100 : 0;

    const supabase = await createClient();

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
 * 엑셀 업로드 시 호출 (조직 단위)
 * 업로드 건수 증가
 */
export async function trackExcelUpload(userId: string) {
  try {
    const today = getTodayKST();

    // 사용자의 조직 정보 가져오기
    const organization = await getUserPrimaryOrganization(userId);
    if (!organization) {
      console.error('Organization not found for user:', userId);
      return { success: false };
    }

    // 기존 레코드 가져오기 또는 생성
    const { data: performance } = await getOrCreateDailyPerformance(organization.id, today);

    if (!performance) {
      console.error('Failed to get or create daily performance');
      return { success: false };
    }

    const supabase = await createClient();

    // 업로드 건수 증가
    const { error } = await supabase
      .from('seller_performance_daily')
      .update({
        upload_count: (performance.upload_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    if (error) {
      console.error('Failed to update upload count:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('trackExcelUpload error:', error);
    return { success: false, error };
  }
}

/**
 * 데이터 오류 발생 시 호출 (조직 단위)
 * 오류 건수 증가 및 오류율 업데이트
 */
export async function trackDataError(userId: string) {
  try {
    const today = getTodayKST();

    // 사용자의 조직 정보 가져오기
    const organization = await getUserPrimaryOrganization(userId);
    if (!organization) {
      console.error('Organization not found for user:', userId);
      return { success: false };
    }

    // 기존 레코드 가져오기 또는 생성
    const { data: performance } = await getOrCreateDailyPerformance(organization.id, today);

    if (!performance) {
      console.error('Failed to get or create daily performance');
      return { success: false };
    }

    // 오류율 계산
    const newErrorCount = (performance.error_count || 0) + 1;
    const totalUploads = performance.upload_count || 0;
    const errorRate = totalUploads > 0 ? (newErrorCount / totalUploads) * 100 : 0;

    const supabase = await createClient();

    // 업데이트
    const { error } = await supabase
      .from('seller_performance_daily')
      .update({
        error_count: newErrorCount,
        error_rate: errorRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    if (error) {
      console.error('Failed to update error count:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('trackDataError error:', error);
    return { success: false, error };
  }
}
