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
  post_points: number;
  comment_points: number;
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
          show_score: true,
          show_sales_performance: true
        })
      });

      const result = await response.json();

      if (result.success) {
        setParticipation(newSettings);
        toast.success('설정이 저장되었습니다.');
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
    return tier;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      LEGEND: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
      ELITE: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
      ADVANCE: { bg: '#e9d5ff', text: '#6b21a8', border: '#a855f7' },
      STANDARD: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
      LIGHT: { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
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
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eff6ff, #ffffff 25%, #ffffff)',
        paddingTop: '0px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 배경 장식 */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          left: '-140px',
          width: '260px',
          height: '260px',
          background: '#bfdbfe',
          borderRadius: '999px',
          filter: 'blur(60px)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          right: '-120px',
          bottom: '-140px',
          width: '300px',
          height: '300px',
          background: '#93c5fd',
          borderRadius: '999px',
          filter: 'blur(60px)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />

        {/* 점수 툴팁 */}
        {showScoreTooltip && (
          <div style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '1.6',
            whiteSpace: 'nowrap',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #334155',
            pointerEvents: 'none'
          }}>
            발주금액, 건수, 연속발주, 기여점수 등을<br />
            종합하여 산출합니다
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
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '12px 20px 24px'
        }}>
          {/* 히어로 섹션 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '36px',
            marginTop: '24px',
            position: 'relative'
          }}>
            <h1 style={{
              fontSize: '38px',
              lineHeight: '1.15',
              margin: 0,
              color: '#1d4ed8',
              fontWeight: '700'
            }}>
              SELLER RANKING
            </h1>
            <p style={{
              margin: '12px auto 0',
              color: '#64748b',
              maxWidth: '900px',
              fontSize: '15px',
              whiteSpace: 'nowrap'
            }}>
              셀러 랭킹은 판매자분들의 작은 재미와 동기부여를 위한 기능입니다. 가볍게 즐겨주세요! 😊
            </p>
          </div>

          {/* 기간 선택 + 새로고침 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'inline-flex',
              background: '#ffffff',
              border: '1px solid #bfdbfe',
              borderRadius: '18px',
              boxShadow: '0 8px 24px rgba(2,6,23,0.06)'
            }}>
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setPeriodType(period)}
                  style={{
                    border: 0,
                    background: periodType === period ? '#2563eb' : 'transparent',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    color: periodType === period ? '#ffffff' : '#1d4ed8',
                    cursor: 'pointer',
                    boxShadow: periodType === period ? '0 10px 20px rgba(37,99,235,0.25)' : 'none',
                    transition: 'all 0.2s'
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
                  padding: '10px 16px',
                  background: '#ffffff',
                  border: '1px solid #93c5fd',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#1d4ed8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <BookOpen style={{ width: '16px', height: '16px' }} />
                티어 가이드
              </button>
              <button
                onClick={fetchRankings}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#ffffff',
                  border: '1px solid #93c5fd',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#1d4ed8',
                  cursor: 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#eff6ff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} className={loading ? 'animate-spin' : ''} />
                새로고침
              </button>
            </div>
          </div>

          {/* 내 순위 카드 */}
          {myRanking && (
            <div style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: '1px solid #1e40af',
              borderRadius: '22px',
              padding: '32px',
              marginBottom: '32px',
              boxShadow: '0 24px 60px -20px rgba(37,99,235,0.35)',
              color: '#ffffff',
              transition: 'all 0.25s'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    fontWeight: '900',
                    color: '#2563eb',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }}>
                    #{myRanking.rank}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      marginBottom: '8px',
                      opacity: 0.9,
                      letterSpacing: '0.05em'
                    }}>
                      MY RANKING
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '900',
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
                    fontSize: '12px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    opacity: 0.9,
                    letterSpacing: '0.05em'
                  }}>
                    TOTAL SCORE
                  </div>
                  <div style={{
                    fontSize: '56px',
                    fontWeight: '900',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
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
                    border: `1px solid ${color.border}`,
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: color.text,
                    marginBottom: '8px',
                    letterSpacing: '0.05em'
                  }}>
                    {getTierName(tier)}
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '900',
                    color: color.text
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
            border: '1px solid #bfdbfe',
            borderRadius: '22px',
            boxShadow: '0 8px 24px rgba(2,6,23,0.06)',
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ background: '#f0f9ff', color: '#1d4ed8' }}>
                  {['순위', '변동', '판매자', '점수', '매출', '건수', '취소율'].map((header, index) => (
                    <th
                      key={header}
                      style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #bfdbfe'
                      }}
                    >
                      {header === '점수' ? (
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
                        padding: '40px 20px',
                        textAlign: 'center'
                      }}
                    >
                      {/* 랭킹 참여 설정 */}
                      <div style={{
                        maxWidth: '500px',
                        margin: '0 auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '11px',
                            color: '#64748b'
                          }}>
                            참여하면 본인과 다른 참여자들의 랭킹을 볼 수 있습니다
                          </div>
                        </div>
                        <button
                          onClick={() => updateParticipation({ isParticipating: !participation.isParticipating })}
                          disabled={participationLoading}
                          style={{
                            padding: '8px 20px',
                            background: participation.isParticipating ? '#10b981' : '#2563eb',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            opacity: participationLoading ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!participationLoading) {
                              e.currentTarget.style.filter = 'brightness(1.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'brightness(1)';
                          }}
                        >
                          {participation.isParticipating ? '참여중' : '참여하기'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {myRanking && (
                      <tr
                        key={`my-${myRanking.id}`}
                        style={{
                          borderBottom: '2px solid #fbbf24',
                          background: '#fef3c7'
                        }}
                      >
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '40px',
                            height: '40px',
                            background: '#2563eb',
                            color: '#ffffff',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '900',
                            boxShadow: '0 4px 8px rgba(37,99,235,0.3)'
                          }}>
                            {myRanking.rank}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 12px',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: '700'
                        }}>
                          {getRankChangeIcon(myRanking.rank_change)}
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#000000'
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
                              padding: '4px 8px',
                              background: '#2563eb',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: '700',
                              borderRadius: '6px',
                              letterSpacing: '0.05em'
                            }}>
                              ME
                            </span>
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 12px',
                          textAlign: 'center',
                          fontSize: '18px',
                          fontWeight: '900',
                          color: '#1d4ed8'
                        }}>
                          {myRanking.total_score.toFixed(1)}
                        </td>
                        <td style={{
                          padding: '16px 12px',
                          textAlign: 'right',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#475569'
                        }}>
                          {myRanking.total_sales.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px 12px',
                          textAlign: 'right',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#475569'
                        }}>
                          {myRanking.order_count.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px 12px',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#475569'
                        }}>
                          {myRanking.cancel_rate.toFixed(1)}%
                        </td>
                      </tr>
                    )}
                    {rankings.map((ranking, index) => {
                      const isMe = myRanking?.seller_id === ranking.seller_id;
                      return (
                        <tr
                          key={ranking.id}
                          style={{
                            borderBottom: index < rankings.length - 1 ? '1px solid #e5e7eb' : 'none',
                            background: isMe ? '#fef3c7' : index % 2 === 0 ? '#ffffff' : '#f9fafb',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isMe) {
                              e.currentTarget.style.background = '#eff6ff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isMe) {
                              e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                            }
                          }}
                        >
                          <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '40px',
                              height: '40px',
                              background: ranking.rank <= 3 ? '#2563eb' : '#f3f4f6',
                              color: ranking.rank <= 3 ? '#ffffff' : '#000000',
                              borderRadius: '12px',
                              fontSize: '16px',
                              fontWeight: '900',
                              boxShadow: ranking.rank <= 3 ? '0 4px 8px rgba(37,99,235,0.3)' : 'none'
                            }}>
                              {ranking.rank}
                            </div>
                          </td>
                          <td style={{
                            padding: '16px 12px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: '700'
                          }}>
                            {getRankChangeIcon(ranking.rank_change)}
                          </td>
                          <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#000000'
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
                                  padding: '4px 8px',
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  borderRadius: '6px',
                                  letterSpacing: '0.05em'
                                }}>
                                  ME
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{
                            padding: '16px 12px',
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: '900',
                            color: '#1d4ed8'
                          }}>
                            {ranking.total_score.toFixed(1)}
                          </td>
                          <td style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#475569'
                          }}>
                            {ranking.total_sales.toLocaleString()}
                          </td>
                          <td style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#475569'
                          }}>
                            {ranking.order_count.toLocaleString()}
                          </td>
                          <td style={{
                            padding: '16px 12px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#475569'
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
              marginTop: '24px',
              padding: '12px 0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                lineHeight: '1.8'
              }}>
                발주금액 {scoreSettings.sales_per_point.toLocaleString()}원당 1p · 발주건수 1건당 {scoreSettings.orders_per_point}p · 주간 연속발주 보너스 {scoreSettings.weekly_consecutive_bonus}p (매주 토요일 가산) · 월간 연속발주 보너스 {scoreSettings.monthly_consecutive_bonus}p (다음달 1일 가산) · 로그인 {scoreSettings.login_score}p · 게시글 {scoreSettings.post_score}p · 댓글 {scoreSettings.comment_score}p
              </div>
              <div style={{
                fontSize: '10px',
                color: '#94a3b8',
                marginTop: '8px'
              }}>
                * 셀러 랭킹은 기간별 순위 경쟁이며, 셀러 등급(LIGHT/STANDARD/ADVANCE/ELITE/LEGEND)은 실적 또는 기여점수 누적을 기준으로 별도 산정됩니다.
              </div>
            </div>
          )}


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
                borderRadius: '24px',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowTierGuideModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000000',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>

              {tierGuideLoading ? (
                <div style={{
                  minHeight: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RefreshCw className="w-8 h-8 animate-spin" style={{ color: '#2563eb' }} />
                </div>
              ) : (
                <div style={{ padding: '40px' }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                  }}>
                    <h1 style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      marginBottom: '8px',
                      color: '#1d4ed8'
                    }}>
                      티어 시스템
                    </h1>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      실적방식(매월 1일 판정) 또는 기여점수방식(실시간 판정) 중 더 높은 등급 자동 적용
                    </p>
                  </div>

                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', color: '#000000' }}>
                          <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', borderBottom: '1px solid #e5e7eb' }}>
                            티어
                          </th>
                          <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', borderBottom: '1px solid #e5e7eb' }}>
                            할인율
                          </th>
                          <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', borderBottom: '1px solid #e5e7eb' }}>
                            실적방식 (3개월)
                          </th>
                          <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', borderBottom: '1px solid #e5e7eb' }}>
                            기여점수방식 (누적)
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
                                borderBottom: index < tierCriteria.length - 1 ? '1px solid #e5e7eb' : 'none',
                                background: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                              }}
                            >
                              <td style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <TierBadge
                                    tier={tier.tier.toLowerCase() as 'light' | 'standard' | 'advance' | 'elite' | 'legend'}
                                    compact={true}
                                    glow={0}
                                  />
                                </div>
                              </td>
                              <td style={{ padding: '20px', textAlign: 'center' }}>
                                <div style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}>
                                  {tier.discount_rate}%
                                </div>
                              </td>
                              <td style={{ padding: '20px', textAlign: 'center' }}>
                                {tier.tier === 'LIGHT' ? (
                                  <div style={{ fontSize: '14px', fontWeight: '700' }}>
                                    {tier.min_order_count}건 + {(tier.min_total_sales / 10000).toLocaleString()}만원 <span style={{ fontSize: '11px', color: '#6b7280' }}>(즉시 승급)</span>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '14px', fontWeight: '700' }}>
                                    {tier.min_order_count.toLocaleString()}건 + {(tier.min_total_sales / 10000).toLocaleString()}만원
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '20px', textAlign: 'center' }}>
                                {pointCriteria ? (
                                  <div style={{ fontSize: '14px', fontWeight: '700' }}>
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

                  {pointSettings && (
                    <div style={{
                      marginTop: '32px',
                      background: '#f9fafb',
                      borderRadius: '16px',
                      padding: '24px'
                    }}>
                      <h2 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        marginBottom: '16px',
                        color: '#1d4ed8'
                      }}>
                        기여점수 적립 안내
                      </h2>

                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        lineHeight: '1.8'
                      }}>
                        {/* 기본 점수 */}
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#1d4ed8' }}>기본 점수</strong> 로그인 {pointSettings.login_points_per_day}p/일 · 발주 {pointSettings.points_per_day}p/일 · 게시글 작성 {pointSettings.post_points}p · 댓글 작성 {pointSettings.comment_points}p
                        </div>

                        {/* 마일스톤 보너스 */}
                        {pointSettings.milestones.filter(m => m.enabled).length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#1d4ed8' }}>마일스톤 보너스</strong> {pointSettings.milestones.filter(m => m.enabled).map((m, i, arr) => (
                              <span key={i}>발주 {m.days}일 누적 +{m.bonus}p{i < arr.length - 1 ? ' · ' : ''}</span>
                            ))}
                          </div>
                        )}

                        {/* 연속성 보너스 */}
                        {pointSettings.consecutive_bonuses.filter(c => c.enabled).length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#1d4ed8' }}>연속성 보너스</strong> {pointSettings.consecutive_bonuses.filter(c => c.enabled).map((c, i, arr) => (
                              <span key={i}>{c.days}일 연속 발주 +{c.bonus}p{i < arr.length - 1 ? ' · ' : ''}</span>
                            ))}
                          </div>
                        )}

                        {/* 월간 보너스 */}
                        {pointSettings.monthly_bonuses.filter(m => m.enabled).length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#1d4ed8' }}>월간 보너스</strong> {pointSettings.monthly_bonuses.filter(m => m.enabled).map((m, i, arr) => (
                              <span key={i}>월 {m.minDays}일 이상 발주 +{m.bonus}p/월{i < arr.length - 1 ? ' · ' : ''}</span>
                            ))}
                          </div>
                        )}

                        {/* 미접속 페널티 */}
                        {pointSettings.no_login_penalties.filter(p => p.enabled).length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#1d4ed8' }}>미접속 페널티</strong> {pointSettings.no_login_penalties.filter(p => p.enabled).map((p, i, arr) => (
                              <span key={i}>{p.days}일 연속 미접속 -{p.penalty}p{i < arr.length - 1 ? ' · ' : ''}</span>
                            ))}
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
    </>
  );
}
