'use client';

import { useEffect, useState } from 'react';

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

export default function TierGuidePage() {
  const [tierCriteria, setTierCriteria] = useState<TierCriteria[]>([]);
  const [pointSettings, setPointSettings] = useState<TierPointSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTierInfo();
  }, []);

  const fetchTierInfo = async () => {
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
      setLoading(false);
    }
  };

  const getTierName = (tier: string) => {
    const names: Record<string, string> = {
      LIGHT: 'LIGHT',
      STANDARD: 'STANDARD',
      ADVANCE: 'ADVANCE',
      ELITE: 'ELITE',
      LEGEND: 'LEGEND'
    };
    return names[tier] || tier;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      LIGHT: { bg: '#fed7aa', text: '#9a3412', border: '#fb923c' },
      STANDARD: { bg: '#e2e8f0', text: '#334155', border: '#94a3b8' },
      ADVANCE: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
      ELITE: { bg: '#e9d5ff', text: '#581c87', border: '#a855f7' },
      LEGEND: { bg: '#bfdbfe', text: '#1e40af', border: '#3b82f6' }
    };
    return colors[tier] || colors.LIGHT;
  };

  const getTierIcon = (tier: string) => {
    const icons: Record<string, string> = {
      LIGHT: '🌟',
      STANDARD: '⭐',
      ADVANCE: '💎',
      ELITE: '👑',
      LEGEND: '🏆'
    };
    return icons[tier] || '⭐';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
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
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', padding: '24px', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '28px' }}>{getTierIcon(tier.tier)}</span>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: '900',
                          fontFamily: 'var(--font-sans)',
                          textTransform: 'uppercase',
                          letterSpacing: '-0.02em'
                        }}>
                          {getTierName(tier.tier)}
                        </span>
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
    </div>
  );
}
