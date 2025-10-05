// src/components/tools/TrendAnalysis.jsx
import { useState } from 'react';

function TrendAnalysis() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // 트렌드 데이터
  const trendingKeywords = [
    { rank: 1, keyword: '유기농', searchVolume: 45320, growth: 32.5, trend: 'up' },
    { rank: 2, keyword: '비건', searchVolume: 38910, growth: 28.3, trend: 'up' },
    { rank: 3, keyword: '글루텐프리', searchVolume: 29870, growth: 15.2, trend: 'up' },
    { rank: 4, keyword: '친환경', searchVolume: 27650, growth: -5.1, trend: 'down' },
    { rank: 5, keyword: '무농약', searchVolume: 24310, growth: 8.7, trend: 'up' }
  ];

  const risingProducts = [
    { id: 1, name: '콜리플라워 라이스', category: '대체식품', growthRate: 156, salesTrend: [20, 35, 45, 68, 89, 145] },
    { id: 2, name: '단백질 쉐이크', category: '건강식품', growthRate: 89, salesTrend: [45, 52, 61, 73, 78, 85] },
    { id: 3, name: '그릭요거트', category: '유제품', growthRate: 67, salesTrend: [30, 38, 42, 48, 50, 50] },
    { id: 4, name: '아보카도 오일', category: '조미료', growthRate: 45, salesTrend: [25, 28, 32, 35, 36, 36] }
  ];

  const marketInsights = [
    {
      type: 'opportunity',
      title: '비건 제품 수요 급증',
      description: '최근 3개월간 비건 관련 제품 검색량이 45% 증가했습니다.',
      impact: 'high',
      action: '비건 제품 라인 확대 검토'
    },
    {
      type: 'threat',
      title: '계절 과일 가격 상승',
      description: '기상 이변으로 딸기, 포도 등 계절 과일 원가가 20% 상승 예상됩니다.',
      impact: 'medium',
      action: '대체 상품 소싱 또는 가격 조정 필요'
    },
    {
      type: 'opportunity',
      title: '홈쿠킹 트렌드 지속',
      description: '간편 조리 제품과 프리미엄 식재료 수요가 꾸준히 증가하고 있습니다.',
      impact: 'high',
      action: '밀키트 및 프리미엄 라인 강화'
    }
  ];

  const competitorActivity = [
    { competitor: 'A마켓', action: '유기농 전문관 오픈', date: '2025-01-25', impact: '중' },
    { competitor: 'B스토어', action: '무료배송 기준 하향', date: '2025-01-20', impact: '높음' },
    { competitor: 'C마트', action: '신규 PB상품 30종 출시', date: '2025-01-18', impact: '낮음' }
  ];

  // 차트 데이터 생성
  const generateSparkline = (data) => {
    const max = Math.max(...data);
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 30 - (value / max) * 25;
      return `${x},${y}`;
    }).join(' ');
    return points;
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          트렌드 분석
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          시장 트렌드와 판매 데이터 상관관계를 분석합니다
        </p>
      </div>

      {/* 기간 선택 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { value: 'week', label: '주간' },
            { value: 'month', label: '월간' },
            { value: 'quarter', label: '분기' },
            { value: 'year', label: '연간' }
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              style={{
                padding: '8px 16px',
                background: selectedPeriod === period.value ? '#2563eb' : '#ffffff',
                color: selectedPeriod === period.value ? '#ffffff' : '#495057',
                border: `1px solid ${selectedPeriod === period.value ? '#2563eb' : '#dee2e6'}`,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {period.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            리포트 다운로드
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* 인기 검색어 */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            🔥 인기 검색어 트렌드
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057', width: '50px' }}>순위</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>키워드</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>검색량</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>증감률</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>트렌드</th>
              </tr>
            </thead>
            <tbody>
              {trendingKeywords.map(keyword => (
                <tr key={keyword.rank} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '28px',
                      height: '28px',
                      borderRadius: '14px',
                      background: keyword.rank <= 3 ? 
                        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 
                        '#e5e7eb',
                      color: keyword.rank <= 3 ? '#ffffff' : '#6c757d',
                      fontSize: '12px',
                      fontWeight: '600',
                      lineHeight: '28px'
                    }}>
                      {keyword.rank}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {keyword.keyword}
                    {keyword.rank === 1 && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: '#fee2e2',
                        color: '#ef4444',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        HOT
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                    {keyword.searchVolume.toLocaleString()}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    fontSize: '14px',
                    color: keyword.growth > 0 ? '#10b981' : '#ef4444',
                    fontWeight: '600'
                  }}>
                    {keyword.growth > 0 ? '+' : ''}{keyword.growth}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '18px',
                      color: keyword.trend === 'up' ? '#10b981' : '#ef4444'
                    }}>
                      {keyword.trend === 'up' ? '↑' : '↓'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 급상승 상품 */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" fill="#f59e0b"/>
            </svg>
            급상승 상품
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {risingProducts.map(product => (
              <div
                key={product.id}
                style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e9ecef';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{product.name}</div>
                    <div style={{ fontSize: '11px', color: '#6c757d' }}>{product.category}</div>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    +{product.growthRate}%
                  </span>
                </div>
                
                <svg width="100%" height="30" style={{ marginTop: '8px' }}>
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    points={generateSparkline(product.salesTrend)}
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 시장 인사이트 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7V11C2 16.55 5.84 21.74 11 23L12 22.08L13 23C18.16 21.74 22 16.55 22 11V7L12 2ZM12 21.44C7.4 20.18 4 15.86 4 11.22V8.3L12 4.18L20 8.3V11.22C20 15.86 16.6 20.18 12 21.44Z" fill="#2563eb"/>
            <circle cx="12" cy="12" r="3" fill="#2563eb"/>
          </svg>
          시장 인사이트
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '16px'
        }}>
          {marketInsights.map((insight, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                background: insight.type === 'opportunity' ? '#dcfce7' : '#fee2e2',
                borderLeft: `4px solid ${insight.type === 'opportunity' ? '#10b981' : '#ef4444'}`,
                borderRadius: '8px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '8px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>
                  {insight.type === 'opportunity' ? '🎯 기회' : '⚠️ 위협'} - {insight.title}
                </h4>
                <span style={{
                  padding: '2px 6px',
                  background: insight.impact === 'high' ? '#ef4444' : 
                            insight.impact === 'medium' ? '#f59e0b' : '#6c757d',
                  color: '#ffffff',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {insight.impact === 'high' ? '높음' :
                   insight.impact === 'medium' ? '중간' : '낮음'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#495057', marginBottom: '12px', lineHeight: '1.5' }}>
                {insight.description}
              </p>
              <div style={{
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>추천 액션</div>
                <div style={{ fontSize: '12px', fontWeight: '500' }}>{insight.action}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 경쟁사 동향 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#8b5cf6"/>
          </svg>
          경쟁사 동향
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>경쟁사</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>활동 내용</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>날짜</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>영향도</th>
            </tr>
          </thead>
          <tbody>
            {competitorActivity.map((activity, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5' }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                  {activity.competitor}
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {activity.action}
                </td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#6c757d' }}>
                  {activity.date}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    background: activity.impact === '높음' ? '#fee2e2' :
                              activity.impact === '중' ? '#fef3c7' : '#e5e7eb',
                    color: activity.impact === '높음' ? '#ef4444' :
                          activity.impact === '중' ? '#f59e0b' : '#6c757d',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {activity.impact}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TrendAnalysis;