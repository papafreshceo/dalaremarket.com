/**
 * 일일 셀러 랭킹 계산 배치 작업
 *
 * 매일 자정에 실행:
 * 1. seller_performance_daily의 점수 계산
 * 2. seller_rankings 업데이트 (일간/주간/월간)
 *    - 일간: 매일 계산 (보상 없음, 실시간 표시용)
 *    - 주간: 토요일에 확정 및 보상 지급
 *    - 월간: 다음달 1일에 확정 및 보상 지급
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
 * @param finalize 랭킹 확정 및 보상 지급 여부 (주간: 토요일, 월간: 1일)
 */
async function generateRankings(
  periodType: 'daily' | 'weekly' | 'monthly',
  scores: SellerScore[],
  salesPerPoint: number,
  ordersPerPoint: number,
  finalize: boolean = false
) {
  console.log(`\n📈 랭킹 생성 중 (${periodType})...${finalize ? ' [확정 및 보상 지급]' : ''}`);

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

  // 기간 내 성과 데이터 집계 (조직 단위)
  const { data: performances, error } = await supabase
    .from('seller_performance_daily')
    .select('*, organizations!seller_performance_daily_organization_id_fkey(id, owner_id)')
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .not('organization_id', 'is', null);

  if (error) {
    console.error(`   ❌ ${periodType} 성과 데이터 조회 실패:`, error);
    return { success: false };
  }

  if (!performances || performances.length === 0) {
    console.log(`   ⚠️  ${periodType} 성과 데이터가 없습니다.`);
    return { success: true, count: 0 };
  }

  // 조직별 집계 (organization_id 기준)
  const orgMap = new Map<string, SellerPerformanceData & { organization_id: string }>();

  performances.forEach((p: any) => {
    const orgId = p.organization_id;
    if (!orgId) return;

    if (!orgMap.has(orgId)) {
      orgMap.set(orgId, {
        seller_id: p.seller_id, // owner_id (랭킹 테이블 호환)
        organization_id: orgId,
        total_sales: 0,
        order_count: 0,
        activity_score: 0
      });
    }

    const org = orgMap.get(orgId)!;
    org.total_sales += p.total_sales || 0;
    org.order_count += p.order_count || 0;
    org.activity_score = (org.activity_score || 0) + (p.activity_score || 0);
  });

  // 점수 계산 및 순위 부여 (설정값 전달)
  const rankingScores = calculateRankings(Array.from(orgMap.values()), salesPerPoint, ordersPerPoint);

  // 보상 설정 조회 (주간/월간만)
  let rewardsMap = new Map<number, number>();
  if (finalize && periodType !== 'daily') {
    const { data: rewards } = await supabase
      .from('ranking_rewards_settings')
      .select('rank, reward_cash')
      .eq('period_type', periodType);

    if (rewards) {
      rewards.forEach(r => rewardsMap.set(r.rank, r.reward_cash));
    }
  }

  // seller_rankings에 저장 (조직 단위)
  for (const score of rankingScores) {
    const orgData = Array.from(orgMap.values()).find(o => o.seller_id === score.seller_id);
    if (!orgData) continue;

    // 이전 랭킹 조회 (순위 변동 계산용) - organization_id 기준
    const { data: prevRanking } = await supabase
      .from('seller_rankings')
      .select('rank, total_score')
      .eq('organization_id', orgData.organization_id)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(1)
      .single();

    const rankChange = prevRanking ? prevRanking.rank - (score.rank || 0) : 0;
    const scoreChange = prevRanking ? score.total_score - prevRanking.total_score : 0;

    // 보상 캐시 계산
    const rewardCash = finalize && rewardsMap.has(score.rank || 0) ? rewardsMap.get(score.rank || 0) || 0 : 0;

    // Upsert (있으면 업데이트, 없으면 삽입)
    const rankingData: any = {
      seller_id: score.seller_id,
      organization_id: orgData.organization_id,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      total_sales: orgData.total_sales,
      order_count: orgData.order_count,
      activity_score: score.activity_score,
      sales_score: score.sales_score,
      order_count_score: score.order_count_score,
      total_score: score.total_score,
      rank: score.rank,
      prev_rank: prevRanking?.rank || null,
      rank_change: rankChange,
      prev_total_score: prevRanking?.total_score || null,
      score_change: scoreChange,
      reward_cash: rewardCash,
      is_finalized: finalize,
      updated_at: new Date().toISOString()
    };

    if (finalize && rewardCash > 0) {
      rankingData.rewarded_at = new Date().toISOString();
      console.log(`   💰 ${score.rank}위 (조직 ${orgData.organization_id}): ${rewardCash.toLocaleString()}원 보상`);
    }

    const { error: upsertError } = await supabase
      .from('seller_rankings')
      .upsert(rankingData, {
        onConflict: 'organization_id,period_type,period_start'
      });

    if (upsertError) {
      console.error(`   ❌ 조직 ${orgData.organization_id} 랭킹 저장 실패:`, upsertError);
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

  // 이번 달 랭킹 조회 (조직 단위)
  const { data: rankings, error } = await supabase
    .from('seller_rankings')
    .select('*')
    .eq('period_type', 'monthly')
    .eq('period_start', thisMonth)
    .not('organization_id', 'is', null);

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

    // 배지 저장 (조직 단위)
    for (const badgeId of badges) {
      const { error: badgeError } = await supabase
        .from('seller_badges')
        .upsert({
          seller_id: ranking.seller_id,
          organization_id: ranking.organization_id,
          badge_id: badgeId,
          period_month: thisMonth,
          metadata: {
            rank: ranking.rank,
            total_score: ranking.total_score,
            tier: ranking.tier
          }
        }, {
          onConflict: 'organization_id,badge_id,period_month'
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
  const today = getTodayKST();
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay(); // 0: 일요일, 6: 토요일
  const dayOfMonth = todayDate.getDate();

  console.log(`   날짜: ${today}`);
  console.log(`   요일: ${dayOfWeek === 0 ? '일' : dayOfWeek === 1 ? '월' : dayOfWeek === 2 ? '화' : dayOfWeek === 3 ? '수' : dayOfWeek === 4 ? '목' : dayOfWeek === 5 ? '금' : '토'}요일`);

  try {
    // 1. 일일 점수 계산
    const { success: step1Success, scores, salesPerPoint, ordersPerPoint } = await calculateDailyScores();
    if (!step1Success) {
      throw new Error('일일 점수 계산 실패');
    }

    // 2. 랭킹 생성
    if (scores && scores.length > 0) {
      // 일간 랭킹: 매일 계산 (보상 없음)
      await generateRankings('daily', scores, salesPerPoint || 10000, ordersPerPoint || 10, false);

      // 주간 랭킹: 토요일에만 확정 및 보상 지급
      const isSaturday = dayOfWeek === 6;
      if (isSaturday) {
        console.log('   🎯 토요일 - 주간 랭킹 확정 및 보상 지급');
      }
      await generateRankings('weekly', scores, salesPerPoint || 10000, ordersPerPoint || 10, isSaturday);

      // 월간 랭킹: 1일에만 확정 및 보상 지급 (지난 달 랭킹)
      const isFirstDayOfMonth = dayOfMonth === 1;
      if (isFirstDayOfMonth) {
        console.log('   🎯 1일 - 월간 랭킹 확정 및 보상 지급');
      }
      await generateRankings('monthly', scores, salesPerPoint || 10000, ordersPerPoint || 10, isFirstDayOfMonth);
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
