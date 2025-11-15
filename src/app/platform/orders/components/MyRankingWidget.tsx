'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Badge {
  badge_id: string;
  earned_at: string;
  badge_definitions: {
    name: string;
    icon: string;
    description: string;
  };
}

interface MyRanking {
  rank: number;
  tier: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';
  total_score: number;
  total_sales: number;
  order_count: number;
  avg_confirm_hours: number;
  cancel_rate: number;
  rank_change: number | null;
  prev_rank: number | null;
  badges: Badge[];
  total_sellers: number;
  period_start: string;
  period_end: string;
}

interface MyRankingWidgetProps {
  isSampleMode?: boolean;
}

export default function MyRankingWidget({ isSampleMode }: MyRankingWidgetProps) {
  const [ranking, setRanking] = useState<MyRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  // 샘플 데이터 생성 함수
  const getSampleData = (): MyRanking => ({
    rank: 42,
    tier: 'gold',
    total_score: 87.5,
    total_sales: 12500000,
    order_count: 156,
    avg_confirm_hours: 4.2,
    cancel_rate: 1.8,
    rank_change: 5,
    prev_rank: 47,
    badges: [
      {
        badge_id: 'sample-1',
        earned_at: new Date().toISOString(),
        badge_definitions: {
          name: '빠른 발주',
          icon: '⚡',
          description: '평균 발주 확정 시간 6시간 이내'
        }
      },
      {
        badge_id: 'sample-2',
        earned_at: new Date().toISOString(),
        badge_definitions: {
          name: '우수 셀러',
          icon: '🌟',
          description: '월 매출 1천만원 이상'
        }
      }
    ],
    total_sellers: 250,
    period_start: new Date().toISOString(),
    period_end: new Date().toISOString()
  });

  const fetchMyRanking = async () => {
    // 로그인하지 않았거나 샘플 모드인 경우 샘플 데이터 표시
    if (!isAuthenticated || isSampleMode) {
      setLoading(false);
      setRanking(getSampleData());
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/seller-rankings/me?period=${periodType}`);

      // JSON이 아닌 응답 처리
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setRanking(getSampleData());
        return;
      }

      const result = await response.json();

      if (result.success) {
        // 데이터가 없으면 샘플 데이터 표시
        setRanking(result.data || getSampleData());
      } else {
        // API 오류 시 샘플 데이터 표시
        setRanking(getSampleData());
      }
    } catch (error) {
      // 네트워크 오류 시 샘플 데이터 표시
      setRanking(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRanking();
  }, [periodType, isAuthenticated, isSampleMode]);

  const getTierIcon = (tier: string) => {
    const icons: Record<string, string> = {
      diamond: '🏆',
      platinum: '💎',
      gold: '🥇',
      silver: '🥈',
      bronze: '🥉'
    };
    return icons[tier] || '';
  };

  const getTierName = (tier: string) => {
    const names: Record<string, string> = {
      diamond: '다이아몬드',
      platinum: '플래티넘',
      gold: '골드',
      silver: '실버',
      bronze: '브론즈'
    };
    return names[tier] || tier;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      diamond: 'from-cyan-500 to-cyan-600',
      platinum: 'from-purple-500 to-purple-600',
      gold: 'from-yellow-500 to-yellow-600',
      silver: 'from-gray-500 to-gray-600',
      bronze: 'from-orange-500 to-orange-600'
    };
    return colors[tier] || 'from-gray-500 to-gray-600';
  };

  const getRankChangeDisplay = () => {
    if (!ranking?.rank_change || ranking.rank_change === 0) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Minus className="w-4 h-4" />
          <span className="text-xs font-medium">변동없음</span>
        </div>
      );
    }

    if (ranking.rank_change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-medium">▲ {ranking.rank_change}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="w-4 h-4" />
        <span className="text-xs font-medium">▼ {Math.abs(ranking.rank_change)}</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">내 순위</h3>
        <div className="flex items-center gap-2">
          {/* 기간 선택 */}
          <div className="flex gap-1">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodType(period)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  periodType === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period === 'daily' ? '일간' : period === 'weekly' ? '주간' : '월간'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchMyRanking}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>로딩 중...</span>
          </div>
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && !ranking && (
        <div className="p-6">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">아직 랭킹 데이터가 없습니다.</p>
            <p className="text-xs mt-1">주문을 시작하면 랭킹이 집계됩니다.</p>
          </div>
        </div>
      )}

      {/* 랭킹 데이터 */}
      {!loading && ranking && (
        <>
          {/* 메인 순위 정보 */}
          <div className={`bg-gradient-to-br ${getTierColor(ranking.tier)} p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-5xl">{getTierIcon(ranking.tier)}</div>
                <div>
                  <div className="text-sm opacity-90">현재 등급</div>
                  <div className="text-2xl font-bold">{getTierName(ranking.tier)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">순위</div>
                <div className="text-3xl font-bold">
                  {ranking.rank}<span className="text-lg font-normal opacity-90">위</span>
                </div>
                <div className="text-xs opacity-75 mt-1">(전체 {ranking.total_sellers}명)</div>
              </div>
            </div>

            {/* 순위 변동 & 종합 점수 */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div>
                <div className="text-xs opacity-75 mb-1">순위 변동</div>
                <div className="bg-white/20 rounded-lg px-3 py-1.5 inline-block">
                  {getRankChangeDisplay()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-75 mb-1">종합 점수</div>
                <div className="text-2xl font-bold">{ranking.total_score.toFixed(1)}점</div>
              </div>
            </div>
          </div>

          {/* 상세 지표 */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">매출액</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {ranking.total_sales.toLocaleString()}원
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">주문건수</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {ranking.order_count.toLocaleString()}건
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">발주속도</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {ranking.avg_confirm_hours.toFixed(1)}시간
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">취소율</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {ranking.cancel_rate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* 획득 배지 */}
          {ranking.badges && ranking.badges.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">획득 배지</div>
              <div className="flex flex-wrap gap-2">
                {ranking.badges.map((badge) => (
                  <div
                    key={badge.badge_id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-full"
                    title={badge.badge_definitions.description}
                  >
                    <span className="text-base">{badge.badge_definitions.icon}</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {badge.badge_definitions.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 빠른 발주확정과 낮은 취소율로 더 높은 순위를 달성하세요!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
