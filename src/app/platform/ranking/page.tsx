'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Award, Trophy, BookOpen, X, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import TierBadge, { TierRow } from '@/components/TierBadge';

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
  tier: 'LEGEND' | 'ELITE' | 'ADVANCE' | 'STANDARD' | 'LIGHT';
  prev_rank: number | null;
  rank_change: number | null;
  users: {
    name: string;
    profile_name?: string;
    business_name?: string;
  };
}

interface TierStats {
  LEGEND: number;
  ELITE: number;
  ADVANCE: number;
  STANDARD: number;
  LIGHT: number;
}

interface TierCriteria {
  tier: string;
  min_order_count: number;
  min_total_sales: number;
  discount_rate: number;
  description: string;
}

interface TierPointSettings {
  login_points_per_day: number;
  points_per_day: number;
  milestones: Array<{
    days: number;
    bonus: number;
    enabled: boolean;
  }>;
  consecutive_bonuses: Array<{
    days: number;
    bonus: number;
    enabled: boolean;
  }>;
  monthly_bonuses: Array<{
    minDays: number;
    bonus: number;
    enabled: boolean;
  }>;
  no_login_penalties: Array<{
    days: number;
    penalty: number;
    enabled: boolean;
  }>;
  accumulated_point_criteria: Array<{
    tier: string;
    requiredPoints: number;
  }>;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<SellerRanking[]>([]);
  const [myRanking, setMyRanking] = useState<SellerRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [tierStats, setTierStats] = useState<TierStats>({
    LEGEND: 0,
    ELITE: 0,
    ADVANCE: 0,
    STANDARD: 0,
    LIGHT: 0
  });

  // 모달 관련 state
  const [showTierGuideModal, setShowTierGuideModal] = useState(false);
  const [tierCriteria, setTierCriteria] = useState<TierCriteria[]>([]);
  const [pointSettings, setPointSettings] = useState<TierPointSettings | null>(null);
  const [tierGuideLoading, setTierGuideLoading] = useState(false);

  // 랭킹 참여 설정 state
  const [participation, setParticipation] = useState({
    isParticipating: false
  });
  const [notParticipating, setNotParticipating] = useState(false);
  const [participationLoading, setParticipationLoading] = useState(false);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 점수 설정 state
  const [scoreSettings, setScoreSettings] = useState<{
    sales_per_point: number;
    orders_per_point: number;
    weekly_consecutive_bonus: number;
    monthly_consecutive_bonus: number;
    post_score: number;
    comment_score: number;
    login_score: number;
  } | null>(null);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const rankingsResponse = await fetch(`/api/seller-rankings?period=${periodType}&limit=100`);
      const rankingsResult = await rankingsResponse.json();

      // 🔒 랭킹 참여 여부 확인
      if (rankingsResult.notParticipating) {
        setNotParticipating(true);
        setRankings([]);
        setMyRanking(null);
        setLoading(false);
        return;
      }

      setNotParticipating(false);

      if (rankingsResult.success) {
        setRankings(rankingsResult.data);

        const stats: TierStats = {
          LEGEND: 0,
          ELITE: 0,
          ADVANCE: 0,
          STANDARD: 0,
          LIGHT: 0
        };

        rankingsResult.data.forEach((r: SellerRanking) => {
          if (r.tier && stats[r.tier] !== undefined) {
            stats[r.tier]++;
          }
        });

        setTierStats(stats);
      }

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

  const fetchParticipation = async () => {
    try {
      const response = await fetch('/api/ranking-participation');
      const result = await response.json();

      if (result.success && result.data) {
        setParticipation({
          isParticipating: result.data.is_participating || false
        });
      }
    } catch (error) {
      console.error('Fetch participation error:', error);
    }
  };

  const updateParticipation = async (updates: Partial<typeof participation>) => {
    setParticipationLoading(true);
    try {
      const newSettings = { ...participation, ...updates };
      const response = await fetch('/api/ranking-participation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_participating: newSettings.isParticipating,
          show_score: true,  // 참여 시 모든 정보 공개
          show_sales_performance: true
        })
      });

      const result = await response.json();

      if (result.success) {
        setParticipation(newSettings);
        toast.success('설정이 저장되었습니다.');
        // 참여 상태가 변경되면 랭킹 다시 조회
        if (updates.isParticipating !== undefined) {
          fetchRankings();
        }
      } else {
        toast.error('설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Update participation error:', error);
      toast.error('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setParticipationLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
    fetchParticipation();
    fetchScoreSettings();
  }, [periodType]);

  const fetchScoreSettings = async () => {
    try {
      const response = await fetch('/api/admin/ranking-score-settings');
      const result = await response.json();

      if (result.success && result.settings) {
        setScoreSettings({
          sales_per_point: result.settings.sales_per_point,
          orders_per_point: result.settings.orders_per_point,
          weekly_consecutive_bonus: result.settings.weekly_consecutive_bonus,
          monthly_consecutive_bonus: result.settings.monthly_consecutive_bonus,
          post_score: result.settings.post_score,
          comment_score: result.settings.comment_score,
          login_score: result.settings.login_score
        });
      }
    } catch (error) {
      console.error('점수 설정 조회 실패:', error);
    }
  };

  const fetchTierInfo = async () => {
    setTierGuideLoading(true);
    try {
      const [criteriaRes, pointsRes] = await Promise.all([
        fetch('/api/admin/tier-criteria'),
        fetch('/api/admin/tier-point-settings')
      ]);

      const criteriaData = await criteriaRes.json();
      const pointsData = await pointsRes.json();

      if (criteriaData.success) {
        setTierCriteria(criteriaData.criteria);
      }

      if (pointsData.success) {
        setPointSettings(pointsData.settings);
      }
    } catch (error) {
      console.error('티어 정보 불러오기 실패:', error);
    } finally {
      setTierGuideLoading(false);
    }
  };

  const openTierGuideModal = () => {
    setShowTierGuideModal(true);
    if (tierCriteria.length === 0) {
      fetchTierInfo();
    }
  };

  const getTierIcon = (tier: string) => {
    const icons: Record<string, string> = {
      LEGEND: '◆',
      ELITE: '◇',
      ADVANCE: '●',
      STANDARD: '○',
      LIGHT: '▪'
    };
    return icons[tier] || '';
  };

  const getTierName = (tier: string) => {
    // 티어명 그대로 반환
    return tier;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      LEGEND: { bg: '#0b1020', text: '#FFD447', border: '#FFD447' },
      ELITE: { bg: '#0b1020', text: '#24E3A8', border: '#24E3A8' },
      ADVANCE: { bg: '#0b1020', text: '#B05CFF', border: '#B05CFF' },
      STANDARD: { bg: '#0b1020', text: '#4BB3FF', border: '#4BB3FF' },
      LIGHT: { bg: '#0b1020', text: '#7BE9FF', border: '#7BE9FF' }
    };
    return colors[tier] || colors.LIGHT;
  };

  const getRankChangeIcon = (rankChange: number | null) => {
    if (!rankChange || rankChange === 0) {
      return <span style={{ color: '#94a3b8' }}>━</span>;
    }
    if (rankChange > 0) {
      return (
        <span style={{ color: '#10b981', fontWeight: '700' }}>
          ▲ {rankChange}
        </span>
      );
    }
    return (
      <span style={{ color: '#ef4444', fontWeight: '700' }}>
        ▼ {Math.abs(rankChange)}
      </span>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      padding: '80px 24px'
    }}>
      {/* 점수 툴팁 (fixed position) */}
      {showScoreTooltip && (
        <div style={{
          position: 'fixed',
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          transform: 'translateX(-50%)',
          background: '#1e293b',
          color: '#ffffff',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '400',
          lineHeight: '1.6',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid #334155',
          pointerEvents: 'none'
        }}>
          발주금액, 건수, 연속발주, 활동점수 등을<br />
          종합하여 산출합니다
          {/* 화살표 */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid #334155'
          }}></div>
        </div>
      )}

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* 페이지 헤더 */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '56px',
            fontWeight: '900',
            color: '#000000',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.02em'
          }}>
            SELLER RANKING
          </h1>
        </div>

        {/* 기간 선택 + 새로고침 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodType(period)}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '2px solid #000000',
                  background: periodType === period ? '#000000' : '#ffffff',
                  color: periodType === period ? '#ffffff' : '#000000',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: periodType === period
                    ? '4px 4px 0px 0px #000000'
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (periodType !== period) {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000000';
                  }
                }}
                onMouseLeave={(e) => {
                  if (periodType !== period) {
                    e.currentTarget.style.transform = 'translate(0, 0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {period === 'daily' ? 'DAILY' : period === 'weekly' ? 'WEEKLY' : 'MONTHLY'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={openTierGuideModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: '#3b82f6',
                border: '2px solid #000000',
                fontSize: '14px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <BookOpen className="w-4 h-4" />
              TIER GUIDE
            </button>
            <button
              onClick={fetchRankings}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: '#ffffff',
                border: '2px solid #000000',
                fontSize: '14px',
                fontWeight: '700',
                color: '#000000',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
                fontFamily: 'var(--font-sans)'
              }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              REFRESH
            </button>
          </div>
        </div>

        {/* 내 순위 카드 */}
        {myRanking && (
          <div style={{
            background: '#000000',
            border: '2px solid #000000',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 0.15)',
            color: '#ffffff'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: '#ffffff',
                  border: '2px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: '900',
                  color: '#000000',
                  fontFamily: 'var(--font-mono)'
                }}>
                  #{myRanking.rank}
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    opacity: 0.7,
                    letterSpacing: '0.1em'
                  }}>
                    MY RANKING
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '900',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '-0.02em'
                  }}>
                    {getTierName(myRanking.tier)}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}>
                    {getRankChangeIcon(myRanking.rank_change)}
                  </div>
                </div>
              </div>
              <div style={{
                textAlign: 'right'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  opacity: 0.7,
                  letterSpacing: '0.1em'
                }}>
                  TOTAL SCORE
                </div>
                <div style={{
                  fontSize: '72px',
                  fontWeight: '900',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: '1'
                }}>
                  {myRanking.total_score.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 등급별 통계 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {(['LIGHT', 'STANDARD', 'ADVANCE', 'ELITE', 'LEGEND'] as const).map((tier) => {
            const color = getTierColor(tier);
            return (
              <div
                key={tier}
                style={{
                  background: color.bg,
                  border: `2px solid ${color.border}`,
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: `0 0 12px ${color.border}55, 4px 4px 0px 0px rgba(0, 0, 0, 0.3)`
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: color.text,
                  marginBottom: '4px',
                  letterSpacing: '0.1em',
                  textShadow: `0 0 8px ${color.text}88`
                }}>
                  {getTierName(tier)}
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  color: color.text,
                  fontFamily: 'var(--font-mono)',
                  textShadow: `0 0 12px ${color.text}99`
                }}>
                  {tierStats[tier]}
                </div>
              </div>
            );
          })}
        </div>

        {/* 랭킹 테이블 */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ background: '#fef3c7', color: '#000000', borderBottom: '2px solid #000000' }}>
                {['RANK', 'CHANGE', 'SELLER', 'SCORE', 'SALES', 'ORDERS', 'CANCEL'].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '700',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: '0.1em',
                      position: 'relative'
                    }}
                  >
                    {header === 'SCORE' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        {header}
                        <div
                          style={{ display: 'inline-flex' }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipPosition({
                              x: rect.left + rect.width / 2,
                              y: rect.bottom + 8
                            });
                            setShowScoreTooltip(true);
                          }}
                          onMouseLeave={() => setShowScoreTooltip(false)}
                        >
                          <HelpCircle
                            style={{
                              width: '14px',
                              height: '14px',
                              cursor: 'help',
                              opacity: 0.6
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: '60px',
                      textAlign: 'center',
                      color: '#94a3b8'
                    }}
                  >
                    <RefreshCw className="w-5 h-5 animate-spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: '60px',
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#94a3b8'
                    }}
                  >
                    NO RANKING DATA
                  </td>
                </tr>
              ) : (
                <>
                  {/* 내 랭킹 고정 표시 */}
                  {myRanking && (
                    <>
                      {(() => {
                        const tierColor = getTierColor(myRanking.tier);
                        return (
                          <tr
                            key={`my-${myRanking.id}`}
                            style={{
                              borderBottom: '3px solid #fbbf24',
                              background: '#fef3c7'
                            }}
                          >
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '32px',
                                height: '32px',
                                background: '#000000',
                                color: '#ffffff',
                                border: '2px solid #000000',
                                fontSize: '14px',
                                fontWeight: '900',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {myRanking.rank}
                              </div>
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'center',
                              fontSize: '13px',
                              fontWeight: '700',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {getRankChangeIcon(myRanking.rank_change)}
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: '700',
                                color: '#000000',
                                fontFamily: 'var(--font-sans)'
                              }}>
                                <div style={{ transform: 'scale(0.8)' }}>
                                  <TierBadge
                                    tier={myRanking.tier.toLowerCase() as 'light' | 'standard' | 'advance' | 'elite' | 'legend'}
                                    iconOnly={true}
                                    glow={0}
                                  />
                                </div>
                                {myRanking.users?.profile_name || myRanking.users?.name || 'Unknown'}
                                <span style={{
                                  padding: '2px 8px',
                                  background: '#000000',
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  letterSpacing: '0.1em'
                                }}>
                                  ME
                                </span>
                              </div>
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'center',
                              fontSize: '16px',
                              fontWeight: '900',
                              color: '#000000',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {myRanking.total_score.toFixed(1)}
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#475569',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {myRanking.total_sales.toLocaleString()}
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#475569',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {myRanking.order_count.toLocaleString()}
                            </td>
                            <td style={{
                              padding: '8px 12px',
                              textAlign: 'center',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#475569',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {myRanking.cancel_rate.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })()}
                    </>
                  )}
                  {/* 전체 랭킹 리스트 */}
                  {rankings.map((ranking, index) => {
                    const isMe = myRanking?.seller_id === ranking.seller_id;
                    const tierColor = getTierColor(ranking.tier);
                    return (
                      <tr
                        key={ranking.id}
                        style={{
                          borderBottom: index < rankings.length - 1 ? '2px solid #e5e7eb' : 'none',
                          background: isMe ? '#fef3c7' : '#ffffff'
                        }}
                      >
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '32px',
                          height: '32px',
                          background: ranking.rank <= 3 ? '#000000' : 'transparent',
                          color: ranking.rank <= 3 ? '#ffffff' : '#000000',
                          border: '2px solid #000000',
                          fontSize: '14px',
                          fontWeight: '900',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {ranking.rank}
                        </div>
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {getRankChangeIcon(ranking.rank_change)}
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#000000',
                          fontFamily: 'var(--font-sans)'
                        }}>
                          <div style={{ transform: 'scale(0.8)' }}>
                            <TierBadge
                              tier={ranking.tier.toLowerCase() as 'light' | 'standard' | 'advance' | 'elite' | 'legend'}
                              iconOnly={true}
                              glow={0}
                            />
                          </div>
                          {ranking.users.profile_name || ranking.users.name}
                          {isMe && (
                            <span style={{
                              padding: '2px 8px',
                              background: '#000000',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: '700',
                              letterSpacing: '0.1em'
                            }}>
                              ME
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'center',
                        fontSize: '16px',
                        fontWeight: '900',
                        color: '#000000',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.total_score.toFixed(1)}
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.total_sales.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.order_count.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.cancel_rate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* 점수 산정 방식 안내 */}
        {scoreSettings && (
          <div style={{
            marginTop: '32px',
            background: '#ffffff',
            border: '2px solid #000000',
            padding: '32px',
            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '900',
              color: '#000000',
              marginBottom: '16px',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.05em'
            }}>
              점수 산정 방식
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* 발주금액 점수 */}
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                border: '2px solid #000000'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#64748b',
                  marginBottom: '8px',
                  letterSpacing: '0.05em'
                }}>
                  발주금액 점수
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '900',
                  color: '#000000',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {scoreSettings.sales_per_point.toLocaleString()}원당 1점
                </div>
              </div>

              {/* 발주건수 점수 */}
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                border: '2px solid #000000'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#64748b',
                  marginBottom: '8px',
                  letterSpacing: '0.05em'
                }}>
                  발주건수 점수
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '900',
                  color: '#000000',
                  fontFamily: 'var(--font-mono)'
                }}>
                  1건당 {scoreSettings.orders_per_point}점
                </div>
              </div>

              {/* 주간 연속발주 보너스 */}
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                border: '2px solid #000000'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#64748b',
                  marginBottom: '8px',
                  letterSpacing: '0.05em'
                }}>
                  주간 연속발주 보너스
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '900',
                  color: '#000000',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {scoreSettings.weekly_consecutive_bonus}점
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '4px'
                }}>
                  매주 토요일 가산 (일~금 발주 시)
                </div>
              </div>

              {/* 월간 연속발주 보너스 */}
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                border: '2px solid #000000'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#64748b',
                  marginBottom: '8px',
                  letterSpacing: '0.05em'
                }}>
                  월간 연속발주 보너스
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '900',
                  color: '#000000',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {scoreSettings.monthly_consecutive_bonus}점
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '4px'
                }}>
                  다음달 1일 가산 (토요일 제외 전일 발주 시)
                </div>
              </div>

              {/* 활동 점수 */}
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                border: '2px solid #000000'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#64748b',
                  marginBottom: '8px',
                  letterSpacing: '0.05em'
                }}>
                  활동 점수
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#000000',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div>로그인: {scoreSettings.login_score}점</div>
                  <div>게시글: {scoreSettings.post_score}점</div>
                  <div>댓글: {scoreSettings.comment_score}점</div>
                </div>
              </div>
            </div>

            {/* 중요 안내 */}
            <div style={{
              padding: '20px',
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                fontSize: '20px',
                flexShrink: 0
              }}>
                ⚠️
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '900',
                  color: '#000000',
                  marginBottom: '4px',
                  fontFamily: 'var(--font-sans)'
                }}>
                  셀러 등급은 랭킹과 무관합니다
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: '1.6',
                  fontFamily: 'var(--font-sans)'
                }}>
                  셀러 랭킹은 기간별 순위 경쟁이며, 셀러 등급(LIGHT/STANDARD/ADVANCE/ELITE/LEGEND)은 실적 또는 활동점수 누적을 기준으로 별도 산정됩니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 랭킹 참여 설정 */}
        <div style={{
          marginTop: '32px',
          background: notParticipating ? '#fef3c7' : '#ffffff',
          border: '2px solid #000000',
          padding: '32px',
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 0.15)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '900',
            color: '#000000',
            marginBottom: '8px',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.05em'
          }}>
            RANKING PARTICIPATION
          </h3>
          <p style={{
            fontSize: '13px',
            color: '#475569',
            marginBottom: '24px',
            fontFamily: 'var(--font-sans)'
          }}>
            {notParticipating
              ? '랭킹을 보려면 참여 설정을 활성화해주세요. 참여 시 모든 정보(순위/점수/판매실적)가 공개됩니다.'
              : '랭킹 참여 중입니다. 모든 정보(순위/점수/판매실적)가 다른 참여자에게 공개되고 있습니다.'}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '16px'
          }}>
            {/* 참여 토글 */}
            <div style={{
              padding: '20px',
              background: '#f9fafb',
              border: '2px solid #000000',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '900',
                  color: '#000000',
                  marginBottom: '4px'
                }}>
                  랭킹전 참여
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b'
                }}>
                  참여하면 본인과 다른 참여자들의 랭킹을 볼 수 있습니다
                </div>
              </div>
              <button
                onClick={() => updateParticipation({ isParticipating: !participation.isParticipating })}
                disabled={participationLoading}
                style={{
                  padding: '8px 24px',
                  background: participation.isParticipating ? '#10b981' : '#94a3b8',
                  border: '2px solid #000000',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  opacity: participationLoading ? 0.5 : 1,
                  fontFamily: 'var(--font-sans)'
                }}
              >
                {participation.isParticipating ? '참여중' : '참여하기'}
              </button>
            </div>

          </div>

          {/* 안내 문구 */}
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '4px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#64748b',
              lineHeight: '1.6',
              textAlign: 'center',
              fontFamily: 'var(--font-sans)'
            }}>
              💡 셀러 랭킹은 판매자분들의 작은 <strong>재미</strong>와 <strong>동기부여</strong>를 위한 기능입니다.<br />
              순위에 너무 집착하지 마시고 가볍게 즐겨주세요! 😊
            </div>
          </div>
        </div>

      </div>

      {/* 티어 가이드 모달 */}
      {showTierGuideModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}
          onClick={() => setShowTierGuideModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '8px 8px 0px 0px #000000',
              maxWidth: '1400px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowTierGuideModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#000000',
                border: '2px solid #000000',
                color: '#ffffff',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X className="w-5 h-5" />
            </button>

            {tierGuideLoading ? (
              <div style={{
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  padding: '40px',
                  background: '#000000',
                  border: '2px solid #000000',
                  boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 0.15)',
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: '900',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  LOADING...
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px' }}>
                {/* 헤더 */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '24px',
                  padding: '20px',
                  background: '#ffffff',
                  border: '2px solid #000000',
                  boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 0.15)',
                  color: '#000000'
                }}>
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: '900',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '-0.02em',
                    textTransform: 'uppercase'
                  }}>
                    TIER SYSTEM
                  </h1>
                  <p style={{
                    fontSize: '13px',
                    opacity: 0.9,
                    fontFamily: 'var(--font-sans)'
                  }}>
                    실적방식(매월 1일 판정) 또는 활동점수방식(실시간 판정) 중 더 높은 등급 자동 적용
                  </p>
                </div>

                {/* 티어 테이블 */}
                <div style={{
                  background: '#ffffff',
                  border: '2px solid #000000',
                  boxShadow: '6px 6px 0px 0px #000000',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', color: '#000000' }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', borderRight: '2px solid #000000' }}>
                          TIER
                        </th>
                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', borderRight: '2px solid #000000' }}>
                          할인율
                        </th>
                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', borderRight: '2px solid #000000' }}>
                          실적방식 (3개월)
                        </th>
                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>
                          활동점수방식 (누적)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tierCriteria.map((tier, index) => {
                        const pointCriteria = pointSettings?.accumulated_point_criteria.find(
                          (p) => p.tier === tier.tier
                        );

                        return (
                          <tr
                            key={tier.tier}
                            style={{
                              borderBottom: index < tierCriteria.length - 1 ? '2px solid #000000' : 'none',
                              background: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                            }}
                          >
                            <td style={{ padding: '20px', borderRight: '2px solid #000000' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TierBadge
                                  tier={tier.tier.toLowerCase() as 'light' | 'standard' | 'advance' | 'elite' | 'legend'}
                                  compact={true}
                                  glow={0}
                                />
                              </div>
                            </td>
                            <td style={{ padding: '20px', textAlign: 'center', borderRight: '2px solid #000000' }}>
                              <div style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                background: '#000000',
                                color: '#ffffff',
                                fontSize: '18px',
                                fontWeight: '900',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {tier.discount_rate}%
                              </div>
                            </td>
                            <td style={{ padding: '20px', textAlign: 'center', borderRight: '2px solid #000000' }}>
                              {tier.tier === 'LIGHT' ? (
                                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                                  {tier.min_order_count}건 + {(tier.min_total_sales / 10000).toLocaleString()}만원 <span style={{ fontSize: '11px', color: '#6b7280' }}>(즉시 승급)</span>
                                </div>
                              ) : (
                                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                                  {tier.min_order_count.toLocaleString()}건 + {(tier.min_total_sales / 10000).toLocaleString()}만원
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '20px', textAlign: 'center' }}>
                              {pointCriteria ? (
                                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                                  {pointCriteria.requiredPoints.toLocaleString()}점
                                </div>
                              ) : (
                                <div style={{ fontSize: '14px', color: '#9ca3af' }}>-</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 활동점수방식 세부 설정 */}
                {pointSettings && (
                  <div style={{
                    marginTop: '24px',
                    background: '#ffffff',
                    border: '2px solid #000000',
                    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 0.15)',
                    padding: '20px'
                  }}>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '900',
                      marginBottom: '16px',
                      fontFamily: 'var(--font-sans)',
                      textTransform: 'uppercase',
                      letterSpacing: '-0.02em'
                    }}>
                      활동점수 적립 안내
                    </h2>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '16px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-sans)'
                    }}>
                      {/* 기본 점수 */}
                      <div style={{
                        padding: '12px',
                        background: '#f9fafb',
                        border: '2px solid #000000'
                      }}>
                        <div style={{ fontWeight: '900', marginBottom: '8px', fontSize: '14px' }}>기본 점수</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          <div>로그인: {pointSettings.login_points_per_day}점/일</div>
                          <div>발주: {pointSettings.points_per_day}점/일</div>
                        </div>
                      </div>

                      {/* 마일스톤 보너스 */}
                      {pointSettings.milestones.filter(m => m.enabled).length > 0 && (
                        <div style={{
                          padding: '12px',
                          background: '#f9fafb',
                          border: '2px solid #000000'
                        }}>
                          <div style={{ fontWeight: '900', marginBottom: '8px', fontSize: '14px' }}>마일스톤 보너스</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                            {pointSettings.milestones.filter(m => m.enabled).map((m, i) => (
                              <div key={i}>발주 {m.days}일 누적: +{m.bonus}점</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 연속성 보너스 */}
                      {pointSettings.consecutive_bonuses.filter(c => c.enabled).length > 0 && (
                        <div style={{
                          padding: '12px',
                          background: '#f9fafb',
                          border: '2px solid #000000'
                        }}>
                          <div style={{ fontWeight: '900', marginBottom: '8px', fontSize: '14px' }}>연속성 보너스</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                            {pointSettings.consecutive_bonuses.filter(c => c.enabled).map((c, i) => (
                              <div key={i}>{c.days}일 연속 발주: +{c.bonus}점</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 월간 보너스 */}
                      {pointSettings.monthly_bonuses.filter(m => m.enabled).length > 0 && (
                        <div style={{
                          padding: '12px',
                          background: '#f9fafb',
                          border: '2px solid #000000'
                        }}>
                          <div style={{ fontWeight: '900', marginBottom: '8px', fontSize: '14px' }}>월간 보너스</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                            {pointSettings.monthly_bonuses.filter(m => m.enabled).map((m, i) => (
                              <div key={i}>월 {m.minDays}일 이상 발주: +{m.bonus}점/월</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 미접속 페널티 */}
                      {pointSettings.no_login_penalties.filter(p => p.enabled).length > 0 && (
                        <div style={{
                          padding: '12px',
                          background: '#f9fafb',
                          border: '2px solid #000000'
                        }}>
                          <div style={{ fontWeight: '900', marginBottom: '8px', fontSize: '14px' }}>미접속 페널티</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                            {pointSettings.no_login_penalties.filter(p => p.enabled).map((p, i) => (
                              <div key={i}>{p.days}일 연속 미접속: -{p.penalty}점</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
