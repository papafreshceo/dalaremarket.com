'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface SellerRanking {
  id: number;
  seller_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  order_count: number;
  avg_confirm_hours: number;
  cancel_rate: number;
  data_quality_rate: number;
  sales_score: number;
  order_count_score: number;
  confirm_speed_score: number;
  cancel_rate_score: number;
  data_quality_score: number;
  total_score: number;
  rank: number;
  tier: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';
  prev_rank: number | null;
  rank_change: number | null;
  users: {
    name: string;
    company_name?: string;
  };
}

interface TierStats {
  diamond: number;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
}

export default function SellerRankingTab() {
  const [rankings, setRankings] = useState<SellerRanking[]>([]);
  const [myRanking, setMyRanking] = useState<SellerRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [tierStats, setTierStats] = useState<TierStats>({
    diamond: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0
  });

  const fetchRankings = async () => {
    setLoading(true);
    try {
      // 전체 랭킹 조회
      const rankingsResponse = await fetch(`/api/seller-rankings?period=${periodType}&limit=100`);
      const rankingsResult = await rankingsResponse.json();

      if (rankingsResult.success) {
        setRankings(rankingsResult.data);

        // 등급별 통계 계산
        const stats: TierStats = {
          diamond: 0,
          platinum: 0,
          gold: 0,
          silver: 0,
          bronze: 0
        };

        rankingsResult.data.forEach((r: SellerRanking) => {
          stats[r.tier]++;
        });

        setTierStats(stats);
      }

      // 내 랭킹 조회
      const myRankingResponse = await fetch(`/api/seller-rankings/me?period=${periodType}`);
      const myRankingResult = await myRankingResponse.json();

      if (myRankingResult.success && myRankingResult.data) {
        setMyRanking(myRankingResult.data);
      } else {
        setMyRanking(null);
      }
    } catch (error) {
      console.error('Fetch rankings error:', error);
      toast.error('랭킹 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [periodType]);

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
      diamond: 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-900/30 dark:border-cyan-700',
      platinum: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-700',
      gold: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-700',
      silver: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600',
      bronze: 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-700'
    };
    return colors[tier] || '';
  };

  const getRankChangeIcon = (rankChange: number | null) => {
    if (!rankChange || rankChange === 0) {
      return <Minus className="w-3 h-3 text-gray-400" />;
    }
    if (rankChange > 0) {
      return (
        <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
          <TrendingUp className="w-3 h-3" />
          <span>{rankChange}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
        <TrendingDown className="w-3 h-3" />
        <span>{Math.abs(rankChange)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">셀러 랭킹</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">전체 셀러의 성과 순위</p>
        </div>
        <button
          onClick={fetchRankings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriodType('daily')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            periodType === 'daily'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          일간
        </button>
        <button
          onClick={() => setPeriodType('weekly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            periodType === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          주간
        </button>
        <button
          onClick={() => setPeriodType('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            periodType === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          월간
        </button>
      </div>

      {/* 내 순위 카드 (상단 고정) */}
      {myRanking && (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5" />
            <span className="text-sm font-semibold opacity-90">내 순위</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{getTierIcon(myRanking.tier)}</div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {myRanking.rank}<span className="text-lg font-normal opacity-90">위</span>
                </div>
                <div className="text-sm opacity-90">{getTierName(myRanking.tier)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">종합 점수</div>
              <div className="text-3xl font-bold">{myRanking.total_score.toFixed(1)}</div>
              <div className="flex items-center justify-end gap-2 mt-2">
                {getRankChangeIcon(myRanking.rank_change)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 등급별 통계 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 p-4 rounded-lg border border-cyan-200 dark:border-cyan-700">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">다이아몬드</div>
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{tierStats.diamond}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="text-2xl mb-1">💎</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">플래티넘</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{tierStats.platinum}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="text-2xl mb-1">🥇</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">골드</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{tierStats.gold}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-2xl mb-1">🥈</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">실버</div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{tierStats.silver}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="text-2xl mb-1">🥉</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">브론즈</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{tierStats.bronze}</div>
        </div>
      </div>

      {/* 랭킹 테이블 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  변동
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  셀러명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  종합점수
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  매출액
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  주문건수
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  발주속도
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  취소율
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      로딩 중...
                    </div>
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p>랭킹 데이터가 없습니다.</p>
                      <p className="text-xs mt-1">주문을 시작하면 랭킹이 집계됩니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rankings.map((ranking) => {
                  const isMe = myRanking?.seller_id === ranking.seller_id;
                  return (
                    <tr
                      key={ranking.id}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {ranking.rank <= 3 ? (
                            <span className="text-2xl">
                              {ranking.rank === 1 ? '🥇' : ranking.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                              {ranking.rank}
                            </span>
                          )}
                          {isMe && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                              ME
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium">
                          {getRankChangeIcon(ranking.rank_change)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ranking.users.name}
                        </div>
                        {ranking.users.company_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {ranking.users.company_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(ranking.tier)}`}>
                          {getTierIcon(ranking.tier)} {getTierName(ranking.tier)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {ranking.total_score.toFixed(1)}점
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                        {ranking.total_sales.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                        {ranking.order_count.toLocaleString()}건
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                        {ranking.avg_confirm_hours.toFixed(1)}시간
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                        {ranking.cancel_rate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 점수 계산 기준 안내 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📊 점수 계산 기준</h3>
        <div className="grid grid-cols-5 gap-4 text-xs text-blue-800 dark:text-blue-300">
          <div>
            <div className="font-medium">매출액 (30%)</div>
            <div className="text-blue-600 dark:text-blue-400">최고 매출 대비</div>
          </div>
          <div>
            <div className="font-medium">주문건수 (20%)</div>
            <div className="text-blue-600 dark:text-blue-400">최고 건수 대비</div>
          </div>
          <div>
            <div className="font-medium">발주속도 (20%)</div>
            <div className="text-blue-600 dark:text-blue-400">1시간 이내 만점</div>
          </div>
          <div>
            <div className="font-medium">취소율 (20%)</div>
            <div className="text-blue-600 dark:text-blue-400">1% 이하 만점</div>
          </div>
          <div>
            <div className="font-medium">데이터품질 (10%)</div>
            <div className="text-blue-600 dark:text-blue-400">오류 0% 만점</div>
          </div>
        </div>
      </div>
    </div>
  );
}
