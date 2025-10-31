'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// 샘플 데이터
const SAMPLE_PRODUCTS = [
  '감자', '고구마', '양파', '당근', '배추'
];

const SAMPLE_MARKETS = ['스마트스토어', '쿠팡', '11번가', '옥션'];
const SAMPLE_DATES = ['01/01', '01/02', '01/03', '01/04', '01/05', '01/06', '01/07'];

type ViewMode = 'all' | 'single' | 'compare';

export default function TabsMethodPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [compareProducts, setCompareProducts] = useState<string[]>([]);

  // 샘플 그래프 데이터 생성
  const generateData = (productFilter?: string | string[]) => {
    return SAMPLE_MARKETS.map((market, idx) => ({
      market,
      color: ['#6366f1', '#ef4444', '#10b981', '#f59e0b'][idx],
      data: SAMPLE_DATES.map(date => ({
        date,
        amount: Math.random() * 100000
      }))
    }));
  };

  const graphData = useMemo(() => {
    if (viewMode === 'single' && selectedProduct) {
      return generateData(selectedProduct);
    } else if (viewMode === 'compare' && compareProducts.length > 0) {
      return generateData(compareProducts);
    }
    return generateData();
  }, [viewMode, selectedProduct, compareProducts]);

  const maxAmount = Math.max(
    ...graphData.flatMap(line => line.data.map(d => d.amount)),
    1
  );

  const toggleCompareProduct = (product: string) => {
    setCompareProducts(prev => {
      if (prev.includes(product)) {
        return prev.filter(p => p !== product);
      } else {
        if (prev.length >= 3) {
          alert('최대 3개까지만 선택할 수 있습니다.');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '1400px',
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      <Link href="/samples/multi-filter" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#6366f1',
        textDecoration: 'none',
        marginBottom: '24px'
      }}>
        ← 샘플 목록으로 돌아가기
      </Link>

      <h1 style={{
        fontSize: '28px',
        fontWeight: '700',
        marginBottom: '8px',
        color: '#111827'
      }}>
        방법 2: 탭 방식
      </h1>
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '32px'
      }}>
        전체/단일/비교 탭으로 모드를 전환하고, 각 모드에 맞는 UI와 그래프를 제공합니다.
      </p>

      {/* 탭 네비게이션 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '8px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '8px'
      }}>
        {[
          { value: 'all' as ViewMode, label: '전체 보기', icon: '📊' },
          { value: 'single' as ViewMode, label: '단일 품목', icon: '🎯' },
          { value: 'compare' as ViewMode, label: '비교 모드', icon: '⚖️' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setViewMode(tab.value)}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: viewMode === tab.value ? '#6366f1' : 'transparent',
              color: viewMode === tab.value ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (viewMode !== tab.value) {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (viewMode !== tab.value) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 전체 보기 모드 */}
      {viewMode === 'all' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#111827'
          }}>
            📊 전체 마켓별 통계
          </h3>

          <svg viewBox="0 0 800 300" style={{
            width: '100%',
            height: '300px'
          }}>
            {[0, 1, 2, 3, 4].map(i => (
              <g key={i}>
                <line
                  x1="60"
                  y1={40 + i * 40}
                  x2="760"
                  y2={40 + i * 40}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x="55"
                  y={40 + i * 40 + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {Math.round((maxAmount * (4 - i)) / 4).toLocaleString()}
                </text>
              </g>
            ))}

            {graphData.map((line, lineIdx) => {
              const points = line.data.map((d, idx) => {
                const x = 60 + (idx / (SAMPLE_DATES.length - 1)) * 700;
                const y = 200 - ((d.amount / maxAmount) * 160);
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={lineIdx}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="2"
                  />
                  {line.data.map((d, idx) => {
                    const x = 60 + (idx / (SAMPLE_DATES.length - 1)) * 700;
                    const y = 200 - ((d.amount / maxAmount) * 160);
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={line.color}
                      />
                    );
                  })}
                </g>
              );
            })}

            {SAMPLE_DATES.map((date, idx) => {
              const x = 60 + (idx / (SAMPLE_DATES.length - 1)) * 700;
              return (
                <text
                  key={idx}
                  x={x}
                  y="230"
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {date}
                </text>
              );
            })}
          </svg>

          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {graphData.map((line, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: line.color
                }} />
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  {line.market}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 단일 품목 모드 */}
      {viewMode === 'single' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#111827'
          }}>
            🎯 단일 품목 선택
          </h3>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            {SAMPLE_PRODUCTS.map((product, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedProduct(product)}
                style={{
                  padding: '10px 20px',
                  background: selectedProduct === product ? '#6366f1' : 'white',
                  color: selectedProduct === product ? 'white' : '#374151',
                  border: selectedProduct === product ? 'none' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedProduct !== product) {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.color = '#6366f1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProduct !== product) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
              >
                {product}
              </button>
            ))}
          </div>

          {!selectedProduct && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                품목을 선택해주세요
              </p>
              <p style={{ fontSize: '14px' }}>
                위에서 품목을 선택하면 해당 품목의 마켓별 통계가 표시됩니다.
              </p>
            </div>
          )}

          {selectedProduct && (
            <>
              <svg viewBox="0 0 800 300" style={{
                width: '100%',
                height: '300px'
              }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <g key={i}>
                    <line
                      x1="60"
                      y1={40 + i * 40}
                      x2="760"
                      y2={40 + i * 40}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                    <text
                      x="55"
                      y={40 + i * 40 + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {Math.round((maxAmount * (4 - i)) / 4).toLocaleString()}
                    </text>
                  </g>
                ))}

                {graphData.map((line, lineIdx) => {
                  const points = line.data.map((d, idx) => {
                    const x = 60 + (idx / (SAMPLE_DATES.length - 1)) * 700;
                    const y = 200 - ((d.amount / maxAmount) * 160);
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <g key={lineIdx}>
                      <polyline
                        points={points}
                        fill="none"
                        stroke={line.color}
                        strokeWidth="2"
                      />
                      {line.data.map((d, idx) => {
                        const x = 60 + (idx / (SAMPLE_DATES.length - 1)) * 700;
                        const y = 200 - ((d.amount / maxAmount) * 160);
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r="4"
                            fill={line.color}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {SAMPLE_DATES.map((date, idx) => {
                  const x = 60 + (idx / (SAMPLE_DATES.length - 1)) * 700;
                  return (
                    <text
                      key={idx}
                      x={x}
                      y="230"
                      textAnchor="middle"
                      fontSize="11"
                      fill="#6b7280"
                    >
                      {date}
                    </text>
                  );
                })}
              </svg>

              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '20px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {graphData.map((line, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: line.color
                    }} />
                    <span style={{ fontSize: '13px', color: '#374151' }}>
                      {line.market}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 비교 모드 */}
      {viewMode === 'compare' && (
        <div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}>
                ⚖️ 비교할 품목 선택 (최대 3개)
              </h3>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {compareProducts.length}/3 선택됨
              </span>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {SAMPLE_PRODUCTS.map((product, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleCompareProduct(product)}
                  disabled={!compareProducts.includes(product) && compareProducts.length >= 3}
                  style={{
                    padding: '10px 20px',
                    background: compareProducts.includes(product) ? '#6366f1' : 'white',
                    color: compareProducts.includes(product) ? 'white' : '#374151',
                    border: compareProducts.includes(product) ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: compareProducts.includes(product) || compareProducts.length < 3 ? 'pointer' : 'not-allowed',
                    opacity: !compareProducts.includes(product) && compareProducts.length >= 3 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!compareProducts.includes(product) && compareProducts.length < 3) {
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.color = '#6366f1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!compareProducts.includes(product)) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  {product}
                </button>
              ))}
            </div>
          </div>

          {compareProducts.length === 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '60px 20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                비교할 품목을 선택해주세요
              </p>
              <p style={{ fontSize: '14px' }}>
                위에서 품목을 2~3개 선택하면 품목별 그래프가 표시됩니다.
              </p>
            </div>
          )}

          {compareProducts.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {compareProducts.map((product, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: '#111827'
                  }}>
                    {product}
                  </h4>

                  <svg viewBox="0 0 400 200" style={{
                    width: '100%',
                    height: '200px'
                  }}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <line
                        key={i}
                        x1="40"
                        y1={20 + i * 30}
                        x2="360"
                        y2={20 + i * 30}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                    ))}

                    {graphData.map((line, lineIdx) => {
                      const lineMaxAmount = Math.max(...line.data.map(d => d.amount));
                      const points = line.data.map((d, dataIdx) => {
                        const x = 40 + (dataIdx / (SAMPLE_DATES.length - 1)) * 320;
                        const y = 140 - ((d.amount / lineMaxAmount) * 120);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <g key={lineIdx}>
                          <polyline
                            points={points}
                            fill="none"
                            stroke={line.color}
                            strokeWidth="2"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    {graphData.map((line, lineIdx) => (
                      <div key={lineIdx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: line.color
                        }} />
                        <span style={{ fontSize: '11px', color: '#374151' }}>
                          {line.market}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 설명 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '12px',
          color: '#111827'
        }}>
          💡 이 방식의 특징
        </h3>
        <ul style={{
          fontSize: '14px',
          color: '#374151',
          lineHeight: '1.8',
          paddingLeft: '20px'
        }}>
          <li>✅ 명확한 모드 구분으로 사용자 의도를 명확하게 전달</li>
          <li>✅ 전체/단일/비교 모드를 쉽게 전환</li>
          <li>✅ 비교 모드에서 품목별 개별 그래프로 상세 비교 가능</li>
          <li>✅ 각 모드에 최적화된 UI 제공</li>
          <li>⚠️ 모드 전환을 위한 추가 클릭 필요</li>
          <li>⚠️ 비교 모드에서 그래프가 여러 개 생성되어 화면 공간 사용</li>
        </ul>
      </div>
    </div>
  );
}
