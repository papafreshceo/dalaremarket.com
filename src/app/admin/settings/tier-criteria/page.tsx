'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface TierCriteria {
  id: number;
  tier: string;
  min_order_count: number;
  min_total_sales: number;
  discount_rate: number;
  consecutive_months_for_bonus: number | null;
  bonus_tier_duration_months: number;
  description: string;
  is_active: boolean;
}

export default function TierCriteriaPage() {
  const [criteria, setCriteria] = useState<TierCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCriteria();
  }, []);

  const loadCriteria = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tier-criteria');
      const data = await response.json();

      if (data.success) {
        setCriteria(data.criteria);
      }
    } catch (error) {
      console.error('티어 기준 로드 오류:', error);
      toast.error('티어 기준을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (tier: string, field: keyof TierCriteria, value: any) => {
    setCriteria(prev =>
      prev.map(c => {
        if (c.tier === tier) {
          const updated = { ...c, [field]: value };

          // 주문 건수, 매출 금액, 할인율이 변경되면 설명도 자동 업데이트
          if (field === 'min_order_count' || field === 'min_total_sales' || field === 'discount_rate') {
            updated.description = generateDescription(
              field === 'min_order_count' ? value : updated.min_order_count,
              field === 'min_total_sales' ? value : updated.min_total_sales,
              field === 'discount_rate' ? value : updated.discount_rate
            );
          }

          return updated;
        }
        return c;
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/tier-criteria', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('티어 기준이 저장되었습니다.');
        await loadCriteria();
      } else {
        toast.error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
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

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억`;
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만`;
    }
    return num.toLocaleString();
  };

  const formatNumberWithComma = (value: number) => {
    return value.toLocaleString('ko-KR');
  };

  const parseNumberFromInput = (value: string) => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  const generateDescription = (orderCount: number, sales: number, discountRate: number) => {
    const salesFormatted = formatNumber(sales);
    if (discountRate > 0) {
      return `월 ${orderCount}건 이상 + ${salesFormatted} 이상 (${discountRate}% 할인)`;
    } else {
      return `월 ${orderCount}건 이상 (할인 없음)`;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            티어 등급 기준 설정
          </h1>
          <p style={{ fontSize: '14px', color: '#6c757d' }}>
            각 등급의 월 발주건수, 발주금액, 할인율을 설정합니다 (매월 1일 직전달 실적 기준 판정)
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            background: saving
              ? '#adb5bd'
              : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      {/* 안내 메시지 */}
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#856404',
        lineHeight: '1.6'
      }}>
        <strong>💡 등급 판정 시스템:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li><strong>판정 시기:</strong> 매월 1일에 직전달 실적 기준으로 등급 판정</li>
          <li><strong>판정 기준:</strong> 발주건수 <strong>AND</strong> 발주금액을 <strong>동시 만족</strong>해야 해당 등급 획득</li>
          <li><strong>등급 적용:</strong> 판정받은 등급으로 당월부터 활동 (예: 2월 1일 판정 → 2월부터 적용)</li>
          <li><strong>연속 유지 보너스:</strong> X개월 연속 같은 등급 유지 시 1개월간 1단계 상위 등급 부여</li>
          <li><strong>할인율:</strong> 등급에 따라 자동으로 할인율이 적용됩니다</li>
        </ul>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d' }}>
          로딩 중...
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #dee2e6'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', width: '10%' }}>등급</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', width: '13%' }}>월 발주건수</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', width: '15%' }}>월 발주금액</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', width: '10%' }}>할인율</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', width: '13%' }}>연속 유지 기준</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', width: '13%' }}>보너스 지속</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', width: '26%' }}>설명</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((item) => {
                const tierColor = getTierColor(item.tier);
                return (
                  <tr key={item.tier} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: tierColor.bg,
                        color: tierColor.text,
                        border: `2px solid ${tierColor.border}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        letterSpacing: '0.05em'
                      }}>
                        {getTierName(item.tier)}
                      </span>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={item.min_order_count}
                          onChange={(e) => handleChange(item.tier, 'min_order_count', parseInt(e.target.value) || 0)}
                          style={{
                            width: '120px',
                            padding: '8px 12px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>건 이상</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={formatNumberWithComma(item.min_total_sales)}
                          onChange={(e) => handleChange(item.tier, 'min_total_sales', parseNumberFromInput(e.target.value))}
                          style={{
                            width: '150px',
                            padding: '8px 12px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>
                          원 ({formatNumber(item.min_total_sales)})
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={item.discount_rate}
                          onChange={(e) => handleChange(item.tier, 'discount_rate', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '80px',
                            padding: '8px 12px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>%</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={item.consecutive_months_for_bonus || ''}
                          onChange={(e) => handleChange(item.tier, 'consecutive_months_for_bonus', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="미사용"
                          style={{
                            width: '80px',
                            padding: '8px 12px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>개월</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={item.bonus_tier_duration_months}
                          onChange={(e) => handleChange(item.tier, 'bonus_tier_duration_months', parseInt(e.target.value) || 1)}
                          style={{
                            width: '80px',
                            padding: '8px 12px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>개월</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleChange(item.tier, 'description', e.target.value)}
                        placeholder="자동 생성됨"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          fontSize: '13px',
                          background: '#f8f9fa',
                          color: '#495057'
                        }}
                        readOnly
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 예시 설명 */}
      <div style={{
        marginTop: '24px',
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '20px',
        fontSize: '13px',
        color: '#495057',
        lineHeight: '1.8'
      }}>
        <strong style={{ display: 'block', marginBottom: '12px', fontSize: '14px' }}>
          📌 등급 판정 및 할인율 적용 예시
        </strong>
        <div style={{ marginBottom: '16px' }}>
          <strong>1월 발주실적 기준 (2월 1일 판정 → 2월 적용):</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
            <li>판매자 A: 1월 600건, 6천만원 발주 → <strong style={{ color: '#0c4a6e' }}>DIAMOND</strong> (10% 할인) - 2월부터 적용</li>
            <li>판매자 B: 1월 400건, 2천만원 발주 → <strong style={{ color: '#92400e' }}>GOLD</strong> (5% 할인) - PLATINUM 금액 미달</li>
            <li>판매자 C: 1월 100건, 5천만원 발주 → <strong style={{ color: '#334155' }}>SILVER</strong> (3% 할인) - 상위 등급 건수 미달</li>
          </ul>
        </div>
        <div>
          <strong>연속 유지 보너스 예시 (3개월 연속 기준):</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
            <li>판매자 D: 1~3월 연속 GOLD 유지 → 4월 한 달간 <strong style={{ color: '#581c87' }}>PLATINUM</strong> 등급 부여 (7.5% 할인)</li>
            <li>판매자 E: 1~2월 GOLD, 3월 SILVER → 보너스 미적용 (연속 유지 실패)</li>
            <li>판매자 F: 1~3월 연속 DIAMOND 유지 → 4월에도 <strong style={{ color: '#0c4a6e' }}>DIAMOND</strong> 유지 (최상위 등급)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
