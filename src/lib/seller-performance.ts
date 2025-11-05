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
 * 주문 건수는 발송완료 시에만 집계하므로 여기서는 아무 것도 하지 않음
 */
export async function trackOrderRegistered(sellerId: string) {
  // 발송완료 상태에서만 집계하므로 여기서는 처리하지 않음
  return { success: true };
}

/**
 * 발주확정 시 호출
 * 발주확정 시간만 기록 (건수/금액은 발송완료 시 집계)
 */
export async function trackOrderConfirmed(
  sellerId: string,
  orderAmount: number,
  registeredAt: string,
  confirmedAt: string
) {
  // 발송완료 시에만 집계하므로 발주확정 시에는 처리하지 않음
  return { success: true };
}

/**
 * 발송완료 시 호출
 * 주문 건수 +1, 매출액 추가
 */
export async function trackOrderShipped(
  sellerId: string,
  orderAmount: number
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

/**
 * 활동점수 업데이트
 * weekly_consecutive_bonus + monthly_consecutive_bonus + post_score + comment_score + login_score
 */
async function updateActivityScore(sellerId: string, date: string) {
  const supabase = await createClient();

  const { data: performance } = await supabase
    .from('seller_performance_daily')
    .select('weekly_consecutive_bonus, monthly_consecutive_bonus, post_score, comment_score, login_score')
    .eq('seller_id', sellerId)
    .eq('date', date)
    .single();

  if (!performance) return;

  const activityScore =
    (performance.weekly_consecutive_bonus || 0) +
    (performance.monthly_consecutive_bonus || 0) +
    (performance.post_score || 0) +
    (performance.comment_score || 0) +
    (performance.login_score || 0);

  await supabase
    .from('seller_performance_daily')
    .update({ activity_score: activityScore })
    .eq('seller_id', sellerId)
    .eq('date', date);
}

/**
 * 특정 날짜가 공휴일인지 확인
 */
async function isHoliday(date: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('holidays')
    .select('id')
    .eq('holiday_date', date)
    .single();

  return !!data;
}

/**
 * 특정 날짜가 주말인지 확인 (토요일=6, 일요일=0)
 */
function isWeekend(date: string): boolean {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

/**
 * 특정 날짜가 영업일인지 확인
 */
async function isBusinessDay(date: string): Promise<boolean> {
  if (isWeekend(date)) return false;
  if (await isHoliday(date)) return false;
  return true;
}

/**
 * 해당 주의 마지막 영업일 찾기 (금요일 기준, 공휴일이면 이전 영업일)
 */
async function getLastBusinessDayOfWeek(date: string): Promise<string> {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  // 해당 주의 금요일 찾기
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  const friday = new Date(targetDate);
  friday.setDate(targetDate.getDate() + daysUntilFriday);

  // 금요일부터 역순으로 영업일 찾기
  for (let i = 0; i <= 4; i++) {
    const checkDate = new Date(friday);
    checkDate.setDate(friday.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (await isBusinessDay(dateStr)) {
      return dateStr;
    }
  }

  return date; // 실패 시 원래 날짜 반환
}

/**
 * 해당 월의 마지막 영업일 찾기
 */
async function getLastBusinessDayOfMonth(date: string): Promise<string> {
  const targetDate = new Date(date);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  // 해당 월의 마지막 날 찾기
  const lastDay = new Date(year, month + 1, 0);

  // 마지막 날부터 역순으로 영업일 찾기
  for (let i = 0; i <= 10; i++) {
    const checkDate = new Date(lastDay);
    checkDate.setDate(lastDay.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (await isBusinessDay(dateStr)) {
      return dateStr;
    }
  }

  return date; // 실패 시 원래 날짜 반환
}

/**
 * 주간/월간 연속 발주 보너스 계산 및 업데이트
 * 주간: 일요일~금요일 6일 연속 발주 시, 토요일에 보너스 가산
 * 월간: 1일~마지막일까지 토요일 제외한 모든 날에 발주 시, 다음달 1일에 보너스 가산
 */
export async function trackConsecutiveOrder(sellerId: string) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    // 설정에서 보너스 점수 조회
    const { data: settings } = await supabase
      .from('ranking_score_settings')
      .select('weekly_consecutive_bonus, monthly_consecutive_bonus')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    const weeklyBonus = settings?.weekly_consecutive_bonus || 50;
    const monthlyBonus = settings?.monthly_consecutive_bonus || 500;

    const todayDate = new Date(today);

    // 주간 보너스 체크 (일요일~금요일 6일 연속 발주 시, 토요일에 가산)
    let weeklyBonusPoints = 0;
    const dayOfWeek = todayDate.getDay();

    if (dayOfWeek === 6) {
      // 오늘이 토요일인 경우, 일요일~금요일 6일 연속발주 체크
      const weekStart = new Date(todayDate);
      weekStart.setDate(weekStart.getDate() - 6); // 이번 주 일요일
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // 일요일~금요일 6일 목록 생성
      const daysThisWeek: string[] = [];
      for (let i = 0; i < 6; i++) {
        const checkDate = new Date(weekStart);
        checkDate.setDate(weekStart.getDate() + i);
        const dateStr = checkDate.toISOString().split('T')[0];
        daysThisWeek.push(dateStr);
      }

      // 이번 주 6일 발주 기록 조회 (일요일~금요일)
      const fridayDate = new Date(todayDate);
      fridayDate.setDate(todayDate.getDate() - 1); // 어제(금요일)
      const fridayStr = fridayDate.toISOString().split('T')[0];

      const { data: weekOrders } = await supabase
        .from('seller_performance_daily')
        .select('date, order_count')
        .eq('seller_id', sellerId)
        .gte('date', weekStartStr)
        .lte('date', fridayStr);

      // 6일 모두 발주가 있는지 확인
      const ordersMap = new Map(weekOrders?.map(o => [o.date, o.order_count || 0]) || []);
      const allDaysHaveOrders = daysThisWeek.every(day => (ordersMap.get(day) || 0) > 0);

      if (allDaysHaveOrders) {
        weeklyBonusPoints = weeklyBonus;
      }
    }

    // 월간 보너스 체크 (토요일 제외한 모든 날 발주 시, 다음달 1일에 가산)
    let monthlyBonusPoints = 0;

    if (todayDate.getDate() === 1) {
      // 오늘이 1일인 경우, 지난 달 토요일을 제외한 모든 날 연속발주 체크
      const lastMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
      const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

      const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
      const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];

      // 지난 달 토요일 제외한 모든 날 목록 생성
      const daysLastMonth: string[] = [];
      for (let d = new Date(lastMonthStart); d <= lastMonthEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        // 토요일(6) 제외
        if (dayOfWeek !== 6) {
          daysLastMonth.push(dateStr);
        }
      }

      // 지난 달 발주 기록 조회
      const { data: monthOrders } = await supabase
        .from('seller_performance_daily')
        .select('date, order_count')
        .eq('seller_id', sellerId)
        .gte('date', lastMonthStartStr)
        .lte('date', lastMonthEndStr);

      // 토요일 제외한 모든 날에 발주가 있는지 확인
      const ordersMap = new Map(monthOrders?.map(o => [o.date, o.order_count || 0]) || []);
      const allDaysHaveOrders = daysLastMonth.every(day => (ordersMap.get(day) || 0) > 0);

      if (allDaysHaveOrders && daysLastMonth.length > 0) {
        monthlyBonusPoints = monthlyBonus;
      }
    }

    // 보너스가 있는 경우에만 업데이트
    if (weeklyBonusPoints > 0 || monthlyBonusPoints > 0) {
      const { data: performance } = await getOrCreateDailyPerformance(sellerId, today);
      if (!performance) return { success: false };

      await supabase
        .from('seller_performance_daily')
        .update({
          weekly_consecutive_bonus: weeklyBonusPoints,
          monthly_consecutive_bonus: monthlyBonusPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', performance.id);

      await updateActivityScore(sellerId, today);

      return { success: true, weeklyBonus: weeklyBonusPoints, monthlyBonus: monthlyBonusPoints };
    }

    return { success: true, weeklyBonus: 0, monthlyBonus: 0 };
  } catch (error) {
    console.error('trackConsecutiveOrder error:', error);
    return { success: false, error };
  }
}

/**
 * 셀러피드 게시글 작성 점수 추가
 * 1게시글 = 5점
 */
export async function trackPostCreated(sellerId: string) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    const { data: performance } = await getOrCreateDailyPerformance(sellerId, today);
    if (!performance) return { success: false };

    const postScore = (performance.post_score || 0) + 5;

    await supabase
      .from('seller_performance_daily')
      .update({
        post_score: postScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    await updateActivityScore(sellerId, today);

    return { success: true };
  } catch (error) {
    console.error('trackPostCreated error:', error);
    return { success: false, error };
  }
}

/**
 * 답글 작성 점수 추가
 * 1답글 = 2점
 */
export async function trackCommentCreated(sellerId: string) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    const { data: performance } = await getOrCreateDailyPerformance(sellerId, today);
    if (!performance) return { success: false };

    const commentScore = (performance.comment_score || 0) + 2;

    await supabase
      .from('seller_performance_daily')
      .update({
        comment_score: commentScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    await updateActivityScore(sellerId, today);

    return { success: true };
  } catch (error) {
    console.error('trackCommentCreated error:', error);
    return { success: false, error };
  }
}

/**
 * 로그인 점수 추가
 * 1일 1회 = 3점
 */
export async function trackLogin(sellerId: string) {
  try {
    const today = getTodayKST();
    const supabase = await createClient();

    const { data: performance } = await getOrCreateDailyPerformance(sellerId, today);
    if (!performance) return { success: false };

    // 오늘 이미 로그인 점수를 받았는지 확인
    if ((performance.login_score || 0) > 0) {
      return { success: true, alreadyTracked: true };
    }

    await supabase
      .from('seller_performance_daily')
      .update({
        login_score: 3,
        updated_at: new Date().toISOString()
      })
      .eq('id', performance.id);

    await updateActivityScore(sellerId, today);

    return { success: true };
  } catch (error) {
    console.error('trackLogin error:', error);
    return { success: false, error };
  }
}
