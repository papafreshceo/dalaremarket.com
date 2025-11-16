/**
 * 조직 랭킹 점수 계산 로직
 *
 * 발주확정 금액, 건수, 활동점수로 순위를 산출합니다.
 * 점수는 실적에 비례하여 무제한 증가합니다.
 * 티어는 별도 시스템에서 관리됩니다.
 */

export interface SellerPerformanceData {
  organization_id: string;
  total_sales: number;
  order_count: number;
  activity_score?: number;  // 활동점수 (연속발주, 게시글, 답글, 로그인)
}

export interface SellerScore {
  organization_id: string;
  sales_score: number;  // 발주확정 금액 점수
  order_count_score: number;  // 발주확정 건수 점수
  activity_score: number;  // 활동점수
  total_score: number;  // 총점 (무제한)
  rank?: number;
}

/**
 * 발주확정 금액 점수 계산
 * @param totalSales 총 발주금액
 * @param salesPerPoint 몇 원당 1점인지 (기본값: 10000 = 1만원당 1점)
 */
export function calculateSalesScore(
  totalSales: number,
  salesPerPoint: number = 10000
): number {
  return Math.floor(totalSales / salesPerPoint);
}

/**
 * 발주확정 건수 점수 계산
 * @param orderCount 총 발주건수
 * @param ordersPerPoint 1건당 몇 점인지 (기본값: 10)
 */
export function calculateOrderCountScore(
  orderCount: number,
  ordersPerPoint: number = 10
): number {
  return orderCount * ordersPerPoint;
}

/**
 * 셀러의 종합 점수 계산
 * 발주금액 점수 + 발주건수 점수 + 활동점수
 * @param performance 셀러 성과 데이터
 * @param salesPerPoint 몇 원당 1점인지 (기본값: 10000)
 * @param ordersPerPoint 1건당 몇 점인지 (기본값: 10)
 */
export function calculateSellerScore(
  performance: SellerPerformanceData,
  salesPerPoint: number = 10000,
  ordersPerPoint: number = 10
): SellerScore {
  const salesScore = calculateSalesScore(performance.total_sales, salesPerPoint);
  const orderCountScore = calculateOrderCountScore(performance.order_count, ordersPerPoint);
  const activityScore = performance.activity_score || 0;

  const totalScore = salesScore + orderCountScore + activityScore;

  return {
    organization_id: performance.organization_id,
    sales_score: salesScore,
    order_count_score: orderCountScore,
    activity_score: activityScore,
    total_score: totalScore
  };
}

/**
 * 여러 셀러의 점수 계산 및 순위 부여
 * @param performances 셀러 성과 데이터 배열
 * @param salesPerPoint 몇 원당 1점인지 (기본값: 10000)
 * @param ordersPerPoint 1건당 몇 점인지 (기본값: 10)
 */
export function calculateRankings(
  performances: SellerPerformanceData[],
  salesPerPoint: number = 10000,
  ordersPerPoint: number = 10
): SellerScore[] {
  if (performances.length === 0) return [];

  // 각 셀러의 점수 계산
  const scores = performances.map(p => calculateSellerScore(p, salesPerPoint, ordersPerPoint));

  // 점수순으로 정렬 (높은 순)
  scores.sort((a, b) => b.total_score - a.total_score);

  // 순위 부여
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
}
