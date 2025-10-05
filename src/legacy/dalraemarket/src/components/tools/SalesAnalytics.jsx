// src/components/tools/SalesAnalytics.jsx
import { useState } from 'react';

function SalesAnalytics() {
  const [period, setPeriod] = useState('week'); // day, week, month, year
  const [chartType, setChartType] = useState('line'); // line, bar, pie
  
  // 더미 데이터
  const salesData = {
    week: [
      { date: '월', sales: 2850000, orders: 45, avgPrice: 63333 },
      { date: '화', sales: 3200000, orders: 52, avgPrice: 61538 },
      { date: '수', sales: 2950000, orders: 48, avgPrice: 61458 },
      { date: '목', sales: 4100000, orders: 67, avgPrice: 61194 },
      { date: '금', sales: 5200000, orders: 85, avgPrice: 61176 },
      { date: '토', sales: 6800000, orders: 112, avgPrice: 60714 },
      { date: '일', sales: 5500000, orders: 89, avgPrice: 61798 }
    ],
    month: [
      { date: '1주', sales: 18500000, orders: 301, avgPrice: 61462 },
      { date: '2주', sales: 22300000, orders: 365, avgPrice: 61096 },
      { date: '3주', sales: 25100000, orders: 412, avgPrice: 60922 },
      { date: '4주', sales: 30600000, orders: 498, avgPrice: 61445 }
    ]
  };

  const topProducts = [
    { rank: 1, name: '유기농 토마토 1kg', sales: 8500000, quantity: 342, growth: 15.3 },
    { rank: 2, name: '프리미엄 딸기 500g', sales: 6200000, quantity: 248, growth: -5.2 },
    { rank: 3, name: '친환경 사과 3kg', sales: 5800000, quantity: 193, growth: 22.1 },
    { rank: 4, name: '신선 양배추', sales: 4300000, quantity: 430, growth: 8.7 },
    { rank: 5, name: '당근 1kg', sales: 3900000, quantity: 390, growth: -2.3 }
  ];

  const categoryAnalysis = [
    { category: '과일류', sales: 18500000, ratio: 35, color: '#2563eb' },
    { category: '채소류', sales: 15200000, ratio: 29, color: '#10b981' },
    { category: '근채류', sales: 10300000, ratio: 20, color: '#f59e0b' },
    { category: '양념류', sales: 8400000, ratio: 16, color: '#8b5cf6' }
  ];

  const currentData = salesData[period] || salesData.week;
  const totalSales = currentData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = currentData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalSales / totalOrders;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const getMaxValue = () => {
    return Math.max(...currentData.map(item => item.sales));
  };

  const getChartHeight = (value) => {
    const maxValue = getMaxValue();
    return (value / maxValue) * 200;
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
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          매출 분석
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          기간별, 상품별 매출 현황을 시각화하여 분석합니다
        </p>
      </div>

      {/* 기간 선택 및 요약 통계 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'day', label: '일별' },
              { value: 'week', label: '주간' },
              { value: 'month', label: '월간' },
              { value: 'year', label: '연간' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                style={{
                  padding: '8px 16px',
                  background: period === option.value ? '#2563eb' : '#ffffff',
                  color: period === option.value ? '#ffffff' : '#495057',
                  border: `1px solid ${period === option.value ? '#2563eb' : '#dee2e6'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['line', 'bar'].map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                style={{
                  padding: '8px 12px',
                  background: chartType === type ? '#f8f9fa' : '#ffffff',
                  border: `1px solid ${chartType === type ? '#2563eb' : '#dee2e6'}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {type === 'line' ? (
                    <path d="M3 17L9 11L13 15L21 7" stroke="#495057" strokeWidth="2"/>
                  ) : (
                    <path d="M3 12H7V21H3V12ZM10 8H14V21H10V8ZM17 3H21V21H17V3Z" fill="#495057"/>
                  )}
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* 요약 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: '#ffffff'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>총 매출</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>
              {formatNumber(totalSales)}원
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
              +12.5% vs 이전 기간
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '12px',
            color: '#ffffff'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>총 주문</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>
              {totalOrders}건
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
              +8.3% vs 이전 기간
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '12px',
            color: '#ffffff'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>평균 주문액</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>
              {formatNumber(avgOrderValue)}원
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
              +3.8% vs 이전 기간
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '12px',
            color: '#ffffff'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>전환율</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>
              3.8%
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
              +0.5% vs 이전 기간
            </div>
          </div>
        </div>

        {/* 차트 영역 */}
        <div style={{
          padding: '20px',
          background: '#fafafa',
          borderRadius: '12px',
          height: '300px',
          position: 'relative'
        }}>
          {chartType === 'bar' ? (
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              height: '250px',
              paddingBottom: '30px'
            }}>
              {currentData.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{
                    position: 'relative',
                    height: '220px',
                    display: 'flex',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{
                      width: '40px',
                      height: `${getChartHeight(item.sales)}px`,
                      background: 'linear-gradient(180deg, #2563eb 0%, #60a5fa 100%)',
                      borderRadius: '4px 4px 0 0',
                      position: 'relative',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scaleY(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scaleY(1)';
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#2563eb',
                        whiteSpace: 'nowrap'
                      }}>
                        {(item.sales / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#495057'
                  }}>
                    {item.date}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <svg width="100%" height="250" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 0.1 }} />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 50}
                  x2="100%"
                  y2={i * 50}
                  stroke="#e5e7eb"
                  strokeDasharray="2,2"
                />
              ))}
              
              {/* Area */}
              <path
                d={`M ${currentData.map((item, idx) => {
                  const x = (idx / (currentData.length - 1)) * 100;
                  const y = 200 - getChartHeight(item.sales);
                  return `${x}% ${y}`;
                }).join(' L ')} L 100% 200 L 0% 200 Z`}
                fill="url(#salesGradient)"
              />
              
              {/* Line */}
              <path
                d={`M ${currentData.map((item, idx) => {
                  const x = (idx / (currentData.length - 1)) * 100;
                  const y = 200 - getChartHeight(item.sales);
                  return `${x}% ${y}`;
                }).join(' L ')}`}
                stroke="#2563eb"
                strokeWidth="2"
                fill="none"
              />
              
              {/* Points */}
              {currentData.map((item, idx) => {
                const x = (idx / (currentData.length - 1)) * 100;
                const y = 200 - getChartHeight(item.sales);
                return (
                  <g key={idx}>
                    <circle
                      cx={`${x}%`}
                      cy={y}
                      r="4"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={`${x}%`}
                      y={y - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#2563eb"
                      fontWeight="600"
                    >
                      {(item.sales / 1000000).toFixed(1)}M
                    </text>
                    <text
                      x={`${x}%`}
                      y="230"
                      textAnchor="middle"
                      fontSize="12"
                      fill="#495057"
                    >
                      {item.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: '24px'
      }}>
        {/* 상품별 매출 순위 */}
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
            상품별 매출 TOP 5
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057', width: '50px' }}>순위</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>상품명</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>매출</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>수량</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>성장률</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(product => (
                <tr key={product.rank} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '24px',
                      height: '24px',
                      borderRadius: '12px',
                      background: product.rank <= 3 ? '#2563eb' : '#e5e7eb',
                      color: product.rank <= 3 ? '#ffffff' : '#6c757d',
                      fontSize: '12px',
                      fontWeight: '600',
                      lineHeight: '24px'
                    }}>
                      {product.rank}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{product.name}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                    {formatNumber(product.sales)}원
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                    {product.quantity}개
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    fontSize: '14px',
                    color: product.growth > 0 ? '#10b981' : '#ef4444',
                    fontWeight: '500'
                  }}>
                    {product.growth > 0 ? '+' : ''}{product.growth}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 카테고리별 매출 비중 */}
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
            카테고리별 매출 비중
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categoryAnalysis.map((category, idx) => (
              <div key={idx}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '13px', color: '#495057' }}>{category.category}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>
                    {formatNumber(category.sales)}원 ({category.ratio}%)
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '20px',
                  background: '#f1f3f5',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${category.ratio}%`,
                    height: '100%',
                    background: category.color,
                    borderRadius: '10px',
                    transition: 'width 0.5s'
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '24px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
              💡 인사이트
            </div>
            <div style={{ fontSize: '13px', color: '#495057', lineHeight: '1.6' }}>
              과일류가 전체 매출의 35%로 가장 높은 비중을 차지하고 있으며,
              채소류(29%)가 뒤를 잇고 있습니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesAnalytics;