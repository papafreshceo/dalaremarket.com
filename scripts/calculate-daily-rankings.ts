/**
 * 일일 셀러 랭킹 계산 배치 작업
 *
 * 매일 자정에 실행:
 * 1. seller_performance_daily의 점수 계산
 * 2. seller_rankings 업데이트 (일간/주간/월간)
 * 3. 배지 자동 부여
 *
 * 실행 방법:
 * npx ts-node scripts/calculate-daily-rankings.ts
 */

import { createClient } from '@supabase/supabase-js';
import {
  calculateRankings,
  SellerPerformanceData,
  SellerScore
} from '../src/lib/seller-ranking-calculator';

// Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 오늘 날짜 (KST)
 */
function getTodayKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  return kstTime.toISOString().split('T')[0];
}

/**
 * 어제 날짜 (KST)
 */
function getYesterdayKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  kstTime.setDate(kstTime.getDate() - 1);
  return kstTime.toISOString().split('T')[0];
}

/**
 * 이번 주 시작일 (월요일)
 */
function getThisWeekStart(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  const day = kstTime.getDay();
  const diff = kstTime.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  kstTime.setDate(diff);
  return kstTime.toISOString().split('T')[0];
}

/**
 * 이번 달 시작일
 */
function getThisMonthStart(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  return `${kstTime.getFullYear()}-${String(kstTime.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * 1단계: 어제 날짜의 seller_performance_daily 점수 계산
 */
async function calculateDailyScores() {
  console.log('\n📊 1단계: 일일 성과 점수 계산 중...');

  const yesterday = getYesterdayKST();

  // 랭킹 점수 설정 조회
  const { data: settings, error: settingsError } = await supabase
    .from('ranking_score_settings')
    .select('sales_per_point, orders_per_point')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  if (settingsError) {
    console.error('❌ 랭킹 점수 설정 조회 실패:', settingsError);
    return { success: false };
  }

  const salesPerPoint = settings?.sales_per_point || 10000;
  const ordersPerPoint = settings?.orders_per_point || 10;
  console.log(`   - 설정: ${salesPerPoint}원당 1점, 1건당 ${ordersPerPoint}점`);

  // 어제 날짜의 모든 성과 데이터 가져오기
  const { data: performances, error } = await supabase
    .from('seller_performance_daily')
    .select('*')
    .eq('date', yesterday);

  if (error) {
    console.error('❌ 성과 데이터 조회 실패:', error);
    return { success: false };
  }

  if (!performances || performances.length === 0) {
    console.log('⚠️  어제 날짜의 성과 데이터가 없습니다.');
    return { success: true, count: 0 };
  }

  console.log(`   - 발견된 셀러: ${performances.length}명`);

  // 점수 계산 (설정값 전달)
  const scores = calculateRankings(performances as SellerPerformanceData[], salesPerPoint, ordersPerPoint);

  // 점수 업데이트
  for (const score of scores) {
    const { error: updateError } = await supabase
      .from('seller_performance_daily')
      .update({
        sales_score: score.sales_score,
        order_count_score: score.order_count_score,
        activity_score: score.activity_score,
        total_score: score.total_score
      })
      .eq('seller_id', score.seller_id)
      .eq('date', yesterday);

    if (updateError) {
      console.error(`   ❌ ${score.seller_id} 점수 업데이트 실패:`, updateError);
    }
  }

  console.log(`   ✅ ${scores.length}명의 점수 계산 완료`);
  return { success: true, count: scores.length, scores, salesPerPoint, ordersPerPoint };
}

/**
 * 2단계: 기간별 랭킹 생성 (일간/주간/월간)
 */
async function generateRankings(
  periodType: 'daily' | 'weekly' | 'monthly',
  scores: SellerScore[],
  salesPerPoint: number,
  ordersPerPoint: number
) {
  console.log(`\n📈 랭킹 생성 중 (${periodType})...`);

  const today = getTodayKST();
  let periodStart: string;
  let periodEnd: string;

  if (periodType === 'daily') {
    periodStart = getYesterdayKST();
    periodEnd = getYesterdayKST();
  } else if (periodType === 'weekly') {
    periodStart = getThisWeekStart();
    periodEnd = today;
  } else {
    periodStart = getThisMonthStart();
    periodEnd = today;
  }

  // 기간 내 성과 데이터 집계
  const { data: performances, error } = await supabase
    .from('seller_performance_daily')
    .select('*')
    .gte('date', periodStart)
    .lte('date', periodEnd);

  if (error) {
    console.error(`   ❌ ${periodType} 성과 데이터 조회 실패:`, error);
    return { success: false };
  }

  if (!performances || performances.length === 0) {
    console.log(`   ⚠️  ${periodType} 성과 데이터가 없습니다.`);
    return { success: true, count: 0 };
  }

  // 셀러별 집계
  const sellerMap = new Map<string, SellerPerformanceData>();

  performances.forEach((p: any) => {
    if (!sellerMap.has(p.seller_id)) {
      sellerMap.set(p.seller_id, {
        seller_id: p.seller_id,
        total_sales: 0,
        order_count: 0,
        activity_score: 0
      });
    }

    const seller = sellerMap.get(p.seller_id)!;
    seller.total_sales += p.total_sales || 0;
    seller.order_count += p.order_count || 0;
    seller.activity_score = (seller.activity_score || 0) + (p.activity_score || 0);
  });

  // 점수 계산 및 순위 부여 (설정값 전달)
  const rankingScores = calculateRankings(Array.from(sellerMap.values()), salesPerPoint, ordersPerPoint);

  // seller_rankings에 저장
  for (const score of rankingScores) {
    // 이전 랭킹 조회 (순위 변동 계산용)
    const { data: prevRanking } = await supabase
      .from('seller_rankings')
      .select('rank, total_score')
      .eq('seller_id', score.seller_id)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(1)
      .single();

    const rankChange = prevRanking ? prevRanking.rank - (score.rank || 0) : 0;
    const scoreChange = prevRanking ? score.total_score - prevRanking.total_score : 0;

    const seller = sellerMap.get(score.seller_id)!;

    // Upsert (있으면 업데이트, 없으면 삽입)
    const { error: upsertError } = await supabase
      .from('seller_rankings')
      .upsert({
        seller_id: score.seller_id,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        total_sales: seller.total_sales,
        order_count: seller.order_count,
        activity_score: score.activity_score,
        sales_score: score.sales_score,
        order_count_score: score.order_count_score,
        total_score: score.total_score,
        rank: score.rank,
        prev_rank: prevRanking?.rank || null,
        rank_change: rankChange,
        prev_total_score: prevRanking?.total_score || null,
        score_change: scoreChange,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'seller_id,period_type,period_start'
      });

    if (upsertError) {
      console.error(`   ❌ ${score.seller_id} 랭킹 저장 실패:`, upsertError);
    }
  }

  console.log(`   ✅ ${rankingScores.length}명의 ${periodType} 랭킹 생성 완료`);
  return { success: true, count: rankingScores.length };
}

/**
 * 3단계: 배지 자동 부여
 */
async function awardBadges() {
  console.log('\n🏆 3단계: 배지 부여 중...');

  const thisMonth = getThisMonthStart();

  // 이번 달 랭킹 조회
  const { data: rankings, error } = await supabase
    .from('seller_rankings')
    .select('*')
    .eq('period_type', 'monthly')
    .eq('period_start', thisMonth);

  if (error || !rankings || rankings.length === 0) {
    console.log('   ⚠️  이번 달 랭킹 데이터가 없습니다.');
    return { success: true, count: 0 };
  }

  let badgeCount = 0;

  for (const ranking of rankings) {
    const badges: string[] = [];

    // ⚡ 빠른 발주: 평균 발주확정 시간 1시간 이내
    if (ranking.avg_confirm_hours <= 1) {
      badges.push('fast_confirmer');
    }

    // ✨ 무결점: 취소율 1% 미만
    if (ranking.cancel_rate < 1) {
      badges.push('no_cancel');
    }

    // 👑 볼륨왕: 월간 주문 1,000건 이상
    if (ranking.order_count >= 1000) {
      badges.push('volume_king');
    }

    // 💯 완벽 데이터: 데이터 품질률 100%
    if (ranking.data_quality_rate === 100) {
      badges.push('perfect_data');
    }

    // 배지 저장
    for (const badgeId of badges) {
      const { error: badgeError } = await supabase
        .from('seller_badges')
        .upsert({
          seller_id: ranking.seller_id,
          badge_id: badgeId,
          period_month: thisMonth,
          metadata: {
            rank: ranking.rank,
            total_score: ranking.total_score,
            tier: ranking.tier
          }
        }, {
          onConflict: 'seller_id,badge_id,period_month'
        });

      if (!badgeError) {
        badgeCount++;
      }
    }
  }

  console.log(`   ✅ ${badgeCount}개의 배지 부여 완료`);
  return { success: true, count: badgeCount };
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🚀 셀러 랭킹 일일 배치 작업 시작...');
  console.log(`   날짜: ${getTodayKST()}`);

  try {
    // 1. 일일 점수 계산
    const { success: step1Success, scores, salesPerPoint, ordersPerPoint } = await calculateDailyScores();
    if (!step1Success) {
      throw new Error('일일 점수 계산 실패');
    }

    // 2. 랭킹 생성 (일간/주간/월간)
    if (scores && scores.length > 0) {
      await generateRankings('daily', scores, salesPerPoint || 10000, ordersPerPoint || 10);
      await generateRankings('weekly', scores, salesPerPoint || 10000, ordersPerPoint || 10);
      await generateRankings('monthly', scores, salesPerPoint || 10000, ordersPerPoint || 10);
    }

    // 3. 배지 부여
    await awardBadges();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 모든 작업이 완료되었습니다!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ 배치 작업 중 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  main();
}

export { main };
