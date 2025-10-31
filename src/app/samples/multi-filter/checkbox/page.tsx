'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// 샘플 데이터
const SAMPLE_PRODUCTS = [
  '감자', '고구마', '양파', '당근', '배추', '무', '상추', '시금치', '브로콜리', '파프리카',
  '토마토', '오이', '가지', '호박', '버섯'
];

const SAMPLE_MARKETS = ['스마트스토어', '쿠팡', '11번가', '옥션'];
const SAMPLE_DATES = ['01/01', '01/02', '01/03', '01/04', '01/05', '01/06', '01/07'];

export default function CheckboxMethodPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // 샘플 그래프 데이터 생성
  const graphData = useMemo(() => {
    return SAMPLE_MARKETS.map((market, idx) => ({
      market,
      color: ['#6366f1', '#ef4444', '#10b981', '#f59e0b'][idx],
      data: SAMPLE_DATES.map(date => ({
        date,
        // 선택된 품목이 많을수록 금액이 높아지도록
        amount: selectedProducts.length > 0
          ? Math.random() * 50000 * selectedProducts.length
          : Math.random() * 100000
      }))
    }));
  }, [selectedProducts]);

  const toggleProduct = (product: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(product)) {
        return prev.filter(p => p !== product);
      } else {
        // 최대 5개 제한
        if (prev.length >= 5) {
          alert('최대 5개까지만 선택할 수 있습니다.');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  const maxAmount = Math.max(
    ...graphData.flatMap(line => line.data.map(d => d.amount)),
    1
  );

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
        방법 1: 체크박스 방식
      </h1>
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '32px'
      }}>
        품목 목록에서 체크박스로 여러 품목을 선택하고, 선택된 품목들의 데이터를 합쳐서 그래프에 표시합니다.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '24px'
      }}>
        {/* 왼쪽: 품목 선택 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          height: 'fit-content'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827'
            }}>
              품목 선택
            </h3>
            <span style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {selectedProducts.length}/5
            </span>
          </div>

          {selectedProducts.length > 0 && (
            <button
              onClick={() => setSelectedProducts([])}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fecaca';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fee2e2';
              }}
            >
              전체 해제
            </button>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {SAMPLE_PRODUCTS.map((product, idx) => {
              const isSelected = selectedProducts.includes(product);
              const isDisabled = !isSelected && selectedProducts.length >= 5;

              return (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '6px',
                    background: isSelected ? '#eef2ff' : 'transparent',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.background = isSelected ? '#e0e7ff' : '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected ? '#eef2ff' : 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleProduct(product)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      accentColor: '#6366f1'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: isSelected ? '#4338ca' : '#374151',
                    fontWeight: isSelected ? '500' : '400'
                  }}>
                    {product}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 오른쪽: 그래프 */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827'
            }}>
              마켓별 통계
            </h3>
            {selectedProducts.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                {selectedProducts.map((product, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '11px',
                      color: '#6366f1',
                      backgroundColor: '#eef2ff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}
                  >
                    {product}
                  </span>
                ))}
              </div>
            )}
          </div>

          {selectedProducts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                품목을 선택해주세요
              </p>
              <p style={{ fontSize: '14px' }}>
                왼쪽에서 품목을 선택하면 해당 품목의 마켓별 통계가 표시됩니다.
              </p>
            </div>
          )}

          {selectedProducts.length > 0 && (
            <>
              {/* 그래프 */}
              <svg viewBox="0 0 800 300" style={{
                width: '100%',
                height: '300px'
              }}>
                {/* 가로 격자선 */}
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

                {/* 마켓별 라인 */}
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

                {/* X축 레이블 */}
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

              {/* 범례 */}
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
      </div>

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
          <li>✅ 직관적인 체크박스 UI로 선택 상태를 명확하게 확인</li>
          <li>✅ 최대 5개까지 선택 제한으로 그래프 복잡도 관리</li>
          <li>✅ 선택된 품목들의 데이터를 OR 조건으로 합쳐서 표시</li>
          <li>✅ "전체 해제" 버튼으로 빠른 초기화</li>
          <li>⚠️ 품목 수가 많으면 스크롤이 길어질 수 있음</li>
          <li>⚠️ 각 품목별 개별 비교는 어려움 (합산 데이터만 표시)</li>
        </ul>
      </div>
    </div>
  );
}
