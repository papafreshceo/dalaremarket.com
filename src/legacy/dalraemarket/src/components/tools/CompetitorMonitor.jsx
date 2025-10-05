// src/components/tools/CompetitorMonitor.jsx
import { useState } from 'react';

function CompetitorMonitor() {
  const [selectedCompetitor, setSelectedCompetitor] = useState('all');
  const [monitoringPeriod, setMonitoringPeriod] = useState('realtime');
  
  // 경쟁사 목록
  const competitors = [
    {
      id: 1,
      name: 'A마켓',
      url: 'www.amarket.com',
      status: 'active',
      lastChecked: '5분 전',
      priceLevel: 'low',
      changeRate: -3.2
    },
    {
      id: 2,
      name: 'B스토어',
      url: 'www.bstore.com',
      status: 'active',
      lastChecked: '10분 전',
      priceLevel: 'medium',
      changeRate: 1.5
    },
    {
      id: 3,
      name: 'C마트',
      url: 'www.cmart.com',
      status: 'inactive',
      lastChecked: '2시간 전',
      priceLevel: 'high',
      changeRate: 0
    }
  ];

  // 가격 비교 데이터
  const priceComparison = [
    {
      product: '유기농 토마토 1kg',
      ourPrice: 8500,
      competitors: [
        { name: 'A마켓', price: 7900, diff: -600 },
        { name: 'B스토어', price: 8200, diff: -300 },
        { name: 'C마트', price: 9200, diff: 700 }
      ]
    },
    {
      product: '프리미엄 딸기 500g',
      ourPrice: 12000,
      competitors: [
        { name: 'A마켓', price: 11500, diff: -500 },
        { name: 'B스토어', price: 12300, diff: 300 },
        { name: 'C마트', price: 13000, diff: 1000 }
      ]
    },
    {
      product: '친환경 사과 3kg',
      ourPrice: 25000,
      competitors: [
        { name: 'A마켓', price: 23500, diff: -1500 },
        { name: 'B스토어', price: 24800, diff: -200 },
        { name: 'C마트', price: 26500, diff: 1500 }
      ]
    }
  ];

  // 가격 변동 알림
  const priceAlerts = [
    {
      id: 1,
      type: 'decrease',
      competitor: 'A마켓',
      product: '유기농 토마토',
      oldPrice: 8500,
      newPrice: 7900,
      change: -7.1,
      time: '30분 전'
    },
    {
      id: 2,
      type: 'increase',
      competitor: 'B스토어',
      product: '프리미엄 딸기',
      oldPrice: 11800,
      newPrice: 12300,
      change: 4.2,
      time: '1시간 전'
    },
    {
      id: 3,
      type: 'new',
      competitor: 'C마트',
      product: '수입 망고',
      newPrice: 15000,
      time: '2시간 전'
    }
  ];

  // 프로모션 모니터링
  const promotions = [
    {
      competitor: 'A마켓',
      type: 'discount',
      title: '신선식품 20% 할인',
      period: '1/25 - 1/31',
      impact: 'high'
    },
    {
      competitor: 'B스토어',
      type: 'bundle',
      title: '과일 2+1 행사',
      period: '1/27 - 2/2',
      impact: 'medium'
    },
    {
      competitor: 'C마트',
      type: 'coupon',
      title: '신규회원 5000원 쿠폰',
      period: '상시',
      impact: 'low'
    }
  ];

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const getPriceLevelColor = (level) => {
    switch(level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6c757d';
    }
  };

  const getPriceLevelLabel = (level) => {
    switch(level) {
      case 'low': return '저가';
      case 'medium': return '중간';
      case 'high': return '고가';
      default: return '알 수 없음';
    }
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
          background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          경쟁사 모니터링
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          경쟁사 가격 변동을 실시간으로 추적합니다
        </p>
      </div>

      {/* 모니터링 설정 */}
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
          <select
            value={selectedCompetitor}
            onChange={(e) => setSelectedCompetitor(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
              background: '#ffffff'
            }}
          >
            <option value="all">전체 경쟁사</option>
            {competitors.map(comp => (
              <option key={comp.id} value={comp.id}>{comp.name}</option>
            ))}
          </select>

          {['realtime', 'hourly', 'daily', 'weekly'].map(period => (
            <button
              key={period}
              onClick={() => setMonitoringPeriod(period)}
              style={{
                padding: '8px 16px',
                background: monitoringPeriod === period ? '#2563eb' : '#ffffff',
                color: monitoringPeriod === period ? '#ffffff' : '#495057',
                border: `1px solid ${monitoringPeriod === period ? '#2563eb' : '#dee2e6'}`,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {period === 'realtime' ? '실시간' :
               period === 'hourly' ? '시간별' :
               period === 'daily' ? '일별' : '주간'}
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM13 7V12.414L16.293 15.707L17.707 14.293L15 11.586V7H13Z" fill="currentColor"/>
            </svg>
            새로고침
          </button>
          <button
            style={{
              padding: '8px 16px',
              background: '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            + 경쟁사 추가
          </button>
        </div>
      </div>

      {/* 경쟁사 현황 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {competitors.map(comp => (
          <div key={comp.id} style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '12px'
            }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  {comp.name}
                </h4>
                <div style={{ fontSize: '11px', color: '#6c757d' }}>{comp.url}</div>
              </div>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '4px',
                background: comp.status === 'active' ? '#10b981' : '#6c757d'
              }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>가격 수준</div>
                <span style={{
                  padding: '4px 8px',
                  background: `${getPriceLevelColor(comp.priceLevel)}15`,
                  color: getPriceLevelColor(comp.priceLevel),
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {getPriceLevelLabel(comp.priceLevel)}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>평균 변동</div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: comp.changeRate > 0 ? '#ef4444' : comp.changeRate < 0 ? '#10b981' : '#6c757d'
                }}>
                  {comp.changeRate > 0 ? '+' : ''}{comp.changeRate}%
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #f1f3f5',
              fontSize: '11px',
              color: '#6c757d',
              textAlign: 'center'
            }}>
              마지막 확인: {comp.lastChecked}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* 가격 비교 */}
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
              <path d="M9 3V18H12V3H9ZM5 8V18H8V8H5ZM13 8V18H16V8H13ZM17 13V18H20V13H17ZM1 18V21H24V18H1Z" fill="#2563eb"/>
            </svg>
            실시간 가격 비교
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>상품</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>우리 가격</th>
                  {competitors.map(comp => (
                    <th key={comp.id} style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {priceComparison.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{item.product}</td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2563eb'
                    }}>
                      {formatNumber(item.ourPrice)}원
                    </td>
                    {item.competitors.map((comp, cidx) => (
                      <td key={cidx} style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ fontSize: '13px' }}>{formatNumber(comp.price)}원</div>
                        <div style={{
                          fontSize: '11px',
                          color: comp.diff > 0 ? '#10b981' : '#ef4444'
                        }}>
                          ({comp.diff > 0 ? '+' : ''}{formatNumber(comp.diff)})
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#e7f3ff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM11 7H13V13L17.5 15.62L16.75 17.02L11.5 13.75V7Z" fill="#2563eb"/>
            </svg>
            <div style={{ fontSize: '13px', color: '#2563eb' }}>
              평균적으로 우리 가격이 A마켓 대비 <strong>5.2% 높고</strong>, B스토어 대비 <strong>1.3% 낮습니다</strong>
            </div>
          </div>
        </div>

        {/* 가격 변동 알림 */}
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
              <path d="M12 22C10.9 22 10 21.1 10 20H14C14 21.1 13.1 22 12 22ZM20 16V11C20 7.43 17.87 4.42 14.5 3.78V3C14.5 1.9 13.6 1 12.5 1H11.5C10.4 1 9.5 1.9 9.5 3V3.78C6.13 4.42 4 7.43 4 11V16L2 18V19H22V18L20 16Z" fill="#f59e0b"/>
            </svg>
            가격 변동 알림
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {priceAlerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  padding: '12px',
                  background: alert.type === 'decrease' ? '#fee2e2' : 
                            alert.type === 'increase' ? '#dcfce7' : '#e7f3ff',
                  borderLeft: `3px solid ${
                    alert.type === 'decrease' ? '#ef4444' :
                    alert.type === 'increase' ? '#10b981' : '#2563eb'
                  }`,
                  borderRadius: '6px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '6px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>
                    {alert.competitor} - {alert.product}
                  </div>
                  <span style={{ fontSize: '11px', color: '#6c757d' }}>{alert.time}</span>
                </div>
                {alert.type === 'new' ? (
                  <div style={{ fontSize: '12px', color: '#495057' }}>
                    신규 상품 등록: {formatNumber(alert.newPrice)}원
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#495057' }}>
                    {formatNumber(alert.oldPrice)}원 → {formatNumber(alert.newPrice)}원
                    <span style={{
                      marginLeft: '8px',
                      fontWeight: '600',
                      color: alert.change > 0 ? '#ef4444' : '#10b981'
                    }}>
                      ({alert.change > 0 ? '+' : ''}{alert.change}%)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 프로모션 모니터링 */}
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
            <path d="M21 11V9L14 2L7 9V11L10 14V22H14V14L21 11Z" fill="#8b5cf6"/>
            <path d="M3 13L6 16V22H10V16L3 13V11L7 7L6 6L1 11V13H3Z" fill="#8b5cf6"/>
          </svg>
          경쟁사 프로모션
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {promotions.map((promo, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                border: '1px solid #dee2e6',
                borderRadius: '12px',
                background: promo.impact === 'high' ? '#fee2e2' :
                          promo.impact === 'medium' ? '#fef3c7' : '#f8f9fa'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 6px',
                    background: promo.type === 'discount' ? '#ef4444' :
                              promo.type === 'bundle' ? '#f59e0b' : '#8b5cf6',
                    color: '#ffffff',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}>
                    {promo.type === 'discount' ? '할인' :
                     promo.type === 'bundle' ? '묶음' : '쿠폰'}
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{promo.competitor}</div>
                </div>
                <span style={{
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: promo.impact === 'high' ? '#ef4444' :
                        promo.impact === 'medium' ? '#f59e0b' : '#6c757d'
                }}>
                  영향 {promo.impact === 'high' ? '높음' :
                        promo.impact === 'medium' ? '중간' : '낮음'}
                </span>
              </div>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>{promo.title}</div>
              <div style={{ fontSize: '12px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M7 11H9V13H7V11ZM7 15H9V17H7V15ZM11 11H13V13H11V11ZM11 15H13V17H11V15ZM15 11H17V13H15V11ZM15 15H17V17H15V15ZM19 4H18V2H16V4H8V2H6V4H5C3.9 4 3 4.9 3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="#6c757d"/>
                </svg>
                {promo.period}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompetitorMonitor;