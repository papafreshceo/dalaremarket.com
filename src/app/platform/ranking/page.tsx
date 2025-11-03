'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Award, Trophy } from 'lucide-react';
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

export default function RankingPage() {
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
      const rankingsResponse = await fetch(`/api/seller-rankings?period=${periodType}&limit=100`);
      const rankingsResult = await rankingsResponse.json();

      if (rankingsResult.success) {
        setRankings(rankingsResult.data);

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
      diamond: '◆',
      platinum: '◇',
      gold: '●',
      silver: '○',
      bronze: '▪'
    };
    return icons[tier] || '';
  };

  const getTierName = (tier: string) => {
    const names: Record<string, string> = {
      diamond: 'DIAMOND',
      platinum: 'PLATINUM',
      gold: 'GOLD',
      silver: 'SILVER',
      bronze: 'BRONZE'
    };
    return names[tier] || tier;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      diamond: { bg: '#e0f2fe', text: '#0c4a6e', border: '#0c4a6e' },
      platinum: { bg: '#f3e8ff', text: '#581c87', border: '#581c87' },
      gold: { bg: '#fef3c7', text: '#92400e', border: '#92400e' },
      silver: { bg: '#f1f5f9', text: '#334155', border: '#334155' },
      bronze: { bg: '#fed7aa', text: '#9a3412', border: '#9a3412' }
    };
    return colors[tier] || colors.bronze;
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
            marginBottom: '8px',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.02em'
          }}>
            SELLER RANKING
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            fontFamily: 'var(--font-sans)'
          }}>
            Performance-based seller rankings
          </p>
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
          {(['diamond', 'platinum', 'gold', 'silver', 'bronze'] as const).map((tier) => {
            const color = getTierColor(tier);
            return (
              <div
                key={tier}
                style={{
                  background: color.bg,
                  border: `2px solid ${color.border}`,
                  padding: '24px',
                  textAlign: 'center',
                  boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: color.text,
                  marginBottom: '8px',
                  letterSpacing: '0.1em'
                }}>
                  {getTierName(tier)}
                </div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '900',
                  color: color.text,
                  fontFamily: 'var(--font-mono)'
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
                {['RANK', 'CHANGE', 'SELLER', 'TIER', 'SCORE', 'SALES', 'ORDERS', 'SPEED', 'CANCEL'].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: '16px',
                      textAlign: header === 'SELLER' ? 'left' : header === 'RANK' || header === 'CHANGE' || header === 'TIER' ? 'center' : 'right',
                      fontSize: '12px',
                      fontWeight: '700',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: '0.1em'
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
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
                    colSpan={9}
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
                rankings.map((ranking, index) => {
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
                        padding: '20px 16px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '40px',
                          height: '40px',
                          background: ranking.rank <= 3 ? '#000000' : 'transparent',
                          color: ranking.rank <= 3 ? '#ffffff' : '#000000',
                          border: '2px solid #000000',
                          fontSize: '18px',
                          fontWeight: '900',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {ranking.rank}
                        </div>
                      </td>
                      <td style={{
                        padding: '20px 16px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {getRankChangeIcon(ranking.rank_change)}
                      </td>
                      <td style={{
                        padding: '20px 16px'
                      }}>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#000000',
                          marginBottom: '4px',
                          fontFamily: 'var(--font-sans)'
                        }}>
                          {ranking.users.name}
                          {isMe && (
                            <span style={{
                              marginLeft: '8px',
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
                        {ranking.users.company_name && (
                          <div style={{
                            fontSize: '13px',
                            color: '#64748b'
                          }}>
                            {ranking.users.company_name}
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '20px 16px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          background: tierColor.bg,
                          color: tierColor.text,
                          border: `2px solid ${tierColor.border}`,
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.1em',
                          fontFamily: 'var(--font-sans)'
                        }}>
                          {getTierName(ranking.tier)}
                        </span>
                      </td>
                      <td style={{
                        padding: '20px 16px',
                        textAlign: 'right',
                        fontSize: '20px',
                        fontWeight: '900',
                        color: '#000000',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.total_score.toFixed(1)}
                      </td>
                      <td style={{
                        padding: '20px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.total_sales.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '20px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.order_count.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '20px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.avg_confirm_hours.toFixed(1)}h
                      </td>
                      <td style={{
                        padding: '20px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {ranking.cancel_rate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 점수 계산 기준 */}
        <div style={{
          marginTop: '32px',
          background: '#fef3c7',
          border: '2px solid #000000',
          padding: '32px',
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 0.15)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '900',
            color: '#000000',
            marginBottom: '24px',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.05em'
          }}>
            SCORING CRITERIA
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '24px'
          }}>
            {[
              { label: 'SALES', weight: '30%', desc: 'vs. Top Seller' },
              { label: 'ORDERS', weight: '20%', desc: 'vs. Top Count' },
              { label: 'SPEED', weight: '20%', desc: '< 1h = 100' },
              { label: 'CANCEL', weight: '20%', desc: '< 1% = 100' },
              { label: 'QUALITY', weight: '10%', desc: '0 Error = 100' }
            ].map((item) => (
              <div key={item.label}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#92400e',
                  marginBottom: '4px',
                  letterSpacing: '0.1em'
                }}>
                  {item.label} ({item.weight})
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#78350f'
                }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
