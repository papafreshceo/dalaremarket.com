/**
 * 셀러 랭킹 점수 계산 로직
 *
 * 발주확정 금액, 건수, 활동점수로 순위를 산출합니다.
 * 점수는 실적에 비례하여 무제한 증가합니다.
 * 티어는 별도 시스템에서 관리됩니다.
 */

export interface SellerPerformanceData {
  seller_id: string;
  total_sales: number;
  order_count: number;
  activity_score?: number;  // 활동점수 (연속발주, 게시글, 답글, 로그인)
}

export interface SellerScore {
  seller_id: string;
  sales_score: number;  // 발주확정 금액 점수
  order_count_score: number;  // 발주확정 건수 점수
  activity_score: number;  // 활동점수
  total_score: number;  // 총점 (무제한)
  rank?: number;
}

/**
 * 발주확정 금액 점수 계산
 * 1만원당 1점 (예: 5천만원 = 5,000점)
 */
export function calculateSalesScore(
  totalSales: number
): number {
  return Math.floor(totalSales / 10000);  // 만원 단위
}

/**
 * 발주확정 건수 점수 계산
 * 1건당 10점 (예: 200건 = 2,000점)
 */
export function calculateOrderCountScore(
  orderCount: number
): number {
  return orderCount * 10;  // 건수의 가중치
}

/**
 * 셀러의 종합 점수 계산
 * 발주금액 점수 + 발주건수 점수 + 활동점수
 */
export function calculateSellerScore(
  performance: SellerPerformanceData
): SellerScore {
  const salesScore = calculateSalesScore(performance.total_sales);
  const orderCountScore = calculateOrderCountScore(performance.order_count);
  const activityScore = performance.activity_score || 0;

  const totalScore = salesScore + orderCountScore + activityScore;

  return {
    seller_id: performance.seller_id,
    sales_score: salesScore,
    order_count_score: orderCountScore,
    activity_score: activityScore,
    total_score: totalScore
  };
}

/**
 * 여러 셀러의 점수 계산 및 순위 부여
 */
export function calculateRankings(
  performances: SellerPerformanceData[]
): SellerScore[] {
  if (performances.length === 0) return [];

  // 각 셀러의 점수 계산
  const scores = performances.map(p => calculateSellerScore(p));

  // 점수순으로 정렬 (높은 순)
  scores.sort((a, b) => b.total_score - a.total_score);

  // 순위 부여
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
}
