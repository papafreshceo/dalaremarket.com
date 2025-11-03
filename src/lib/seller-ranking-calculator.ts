/**
 * 셀러 랭킹 점수 계산 로직
 *
 * 매출, 주문건수, 발주확정 속도, 취소율, 데이터 품질을 종합하여
 * 셀러의 최종 점수와 등급을 산출합니다.
 */

export interface SellerPerformanceData {
  seller_id: string;
  total_sales: number;
  order_count: number;
  avg_confirm_hours: number;
  cancel_rate: number;
  error_rate: number;
}

export interface SellerScore {
  seller_id: string;
  sales_score: number;  // 30점 만점
  order_count_score: number;  // 20점 만점
  confirm_speed_score: number;  // 20점 만점
  cancel_rate_score: number;  // 20점 만점
  data_quality_score: number;  // 10점 만점
  total_score: number;  // 100점 만점
  tier: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';
  rank?: number;
}

/**
 * 매출 점수 계산 (30점 만점)
 * 최고 매출액 대비 비율로 계산
 */
export function calculateSalesScore(
  mySales: number,
  maxSales: number
): number {
  if (maxSales === 0) return 0;
  const ratio = mySales / maxSales;
  return Math.min(ratio * 100, 100) * 0.3;  // 30% 가중치
}

/**
 * 주문건수 점수 계산 (20점 만점)
 * 최고 주문건수 대비 비율로 계산
 */
export function calculateOrderCountScore(
  myOrderCount: number,
  maxOrderCount: number
): number {
  if (maxOrderCount === 0) return 0;
  const ratio = myOrderCount / maxOrderCount;
  return Math.min(ratio * 100, 100) * 0.2;  // 20% 가중치
}

/**
 * 발주확정 속도 점수 계산 (20점 만점)
 * 빠를수록 높은 점수
 *
 * - 1시간 이내: 만점 (100점 × 0.2 = 20점)
 * - 6시간 이내: 90점 (90 × 0.2 = 18점)
 * - 24시간 이내: 70점 (70 × 0.2 = 14점)
 * - 48시간 이내: 50점 (50 × 0.2 = 10점)
 * - 48시간 초과: 비례 감소
 */
export function calculateConfirmSpeedScore(
  avgConfirmHours: number
): number {
  if (avgConfirmHours <= 1) {
    return 100 * 0.2;  // 20점
  } else if (avgConfirmHours <= 6) {
    return 90 * 0.2;  // 18점
  } else if (avgConfirmHours <= 24) {
    return 70 * 0.2;  // 14점
  } else if (avgConfirmHours <= 48) {
    return 50 * 0.2;  // 10점
  } else {
    // 48시간 초과 시 비례 감소 (최소 0점)
    const penalty = (avgConfirmHours - 48) / 48;
    const score = Math.max(0, 50 - (penalty * 50));
    return score * 0.2;
  }
}

/**
 * 취소율 점수 계산 (20점 만점)
 * 낮을수록 높은 점수
 *
 * - 1% 이하: 만점 (100점 × 0.2 = 20점)
 * - 3% 이하: 90점 (90 × 0.2 = 18점)
 * - 5% 이하: 70점 (70 × 0.2 = 14점)
 * - 10% 이하: 50점 (50 × 0.2 = 10점)
 * - 10% 초과: 비례 감소 (최소 0점)
 */
export function calculateCancelRateScore(
  cancelRate: number
): number {
  if (cancelRate <= 1) {
    return 100 * 0.2;  // 20점
  } else if (cancelRate <= 3) {
    return 90 * 0.2;  // 18점
  } else if (cancelRate <= 5) {
    return 70 * 0.2;  // 14점
  } else if (cancelRate <= 10) {
    return 50 * 0.2;  // 10점
  } else {
    // 10% 초과 시 비례 감소 (최소 0점)
    const penalty = (cancelRate - 10) / 10;
    const score = Math.max(0, 50 - (penalty * 50));
    return score * 0.2;
  }
}

/**
 * 데이터 품질 점수 계산 (10점 만점)
 * 오류율이 낮을수록 높은 점수
 *
 * - 0% (오류 없음): 만점 (100점 × 0.1 = 10점)
 * - 1% 이하: 90점 (90 × 0.1 = 9점)
 * - 5% 이하: 70점 (70 × 0.1 = 7점)
 * - 10% 이하: 50점 (50 × 0.1 = 5점)
 * - 10% 초과: 비례 감소 (최소 0점)
 */
export function calculateDataQualityScore(
  errorRate: number
): number {
  if (errorRate === 0) {
    return 100 * 0.1;  // 10점
  } else if (errorRate <= 1) {
    return 90 * 0.1;  // 9점
  } else if (errorRate <= 5) {
    return 70 * 0.1;  // 7점
  } else if (errorRate <= 10) {
    return 50 * 0.1;  // 5점
  } else {
    // 10% 초과 시 비례 감소 (최소 0점)
    const penalty = (errorRate - 10) / 10;
    const score = Math.max(0, 50 - (penalty * 50));
    return score * 0.1;
  }
}

/**
 * 종합 점수를 기반으로 등급 산정
 *
 * - 90점 이상: 다이아몬드 (상위 5%)
 * - 80-89점: 플래티넘 (상위 15%)
 * - 70-79점: 골드 (상위 30%)
 * - 60-69점: 실버 (상위 60%)
 * - 60점 미만: 브론즈
 */
export function calculateTier(totalScore: number): SellerScore['tier'] {
  if (totalScore >= 90) return 'diamond';
  if (totalScore >= 80) return 'platinum';
  if (totalScore >= 70) return 'gold';
  if (totalScore >= 60) return 'silver';
  return 'bronze';
}

/**
 * 셀러의 종합 점수 계산
 */
export function calculateSellerScore(
  performance: SellerPerformanceData,
  maxSales: number,
  maxOrderCount: number
): SellerScore {
  const salesScore = calculateSalesScore(performance.total_sales, maxSales);
  const orderCountScore = calculateOrderCountScore(performance.order_count, maxOrderCount);
  const confirmSpeedScore = calculateConfirmSpeedScore(performance.avg_confirm_hours || 0);
  const cancelRateScore = calculateCancelRateScore(performance.cancel_rate || 0);
  const dataQualityScore = calculateDataQualityScore(performance.error_rate || 0);

  const totalScore = salesScore + orderCountScore + confirmSpeedScore + cancelRateScore + dataQualityScore;
  const tier = calculateTier(totalScore);

  return {
    seller_id: performance.seller_id,
    sales_score: salesScore,
    order_count_score: orderCountScore,
    confirm_speed_score: confirmSpeedScore,
    cancel_rate_score: cancelRateScore,
    data_quality_score: dataQualityScore,
    total_score: totalScore,
    tier
  };
}

/**
 * 여러 셀러의 점수 계산 및 순위 부여
 */
export function calculateRankings(
  performances: SellerPerformanceData[]
): SellerScore[] {
  if (performances.length === 0) return [];

  // 최대값 찾기
  const maxSales = Math.max(...performances.map(p => p.total_sales));
  const maxOrderCount = Math.max(...performances.map(p => p.order_count));

  // 각 셀러의 점수 계산
  const scores = performances.map(p =>
    calculateSellerScore(p, maxSales, maxOrderCount)
  );

  // 점수순으로 정렬
  scores.sort((a, b) => b.total_score - a.total_score);

  // 순위 부여
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
}

/**
 * 등급별 통계 계산
 */
export function getTierStatistics(scores: SellerScore[]) {
  const stats = {
    diamond: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0
  };

  scores.forEach(score => {
    stats[score.tier]++;
  });

  return stats;
}

/**
 * 등급별 이모지 아이콘
 */
export function getTierIcon(tier: SellerScore['tier']): string {
  const icons = {
    diamond: '🏆',
    platinum: '💎',
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉'
  };
  return icons[tier];
}

/**
 * 등급별 한글 이름
 */
export function getTierName(tier: SellerScore['tier']): string {
  const names = {
    diamond: '다이아몬드',
    platinum: '플래티넘',
    gold: '골드',
    silver: '실버',
    bronze: '브론즈'
  };
  return names[tier];
}
