'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';

// 샘플 데이터
const SAMPLE_PRODUCTS = [
  '감자', '고구마', '양파', '당근', '배추', '무', '상추', '시금치', '브로콜리', '파프리카',
  '토마토', '오이', '가지', '호박', '버섯'
];

const SAMPLE_MARKETS = ['스마트스토어', '쿠팡', '11번가', '옥션'];
const SAMPLE_DATES = ['01/01', '01/02', '01/03', '01/04', '01/05', '01/06', '01/07'];

export default function DropdownMethodPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 샘플 그래프 데이터 생성
  const graphData = useMemo(() => {
    return SAMPLE_MARKETS.map((market, idx) => ({
      market,
      color: ['#6366f1', '#ef4444', '#10b981', '#f59e0b'][idx],
      data: SAMPLE_DATES.map(date => ({
        date,
        amount: selectedProducts.length > 0
          ? Math.random() * 50000 * selectedProducts.length
          : Math.random() * 100000
      }))
    }));
  }, [selectedProducts]);

  const maxAmount = Math.max(
    ...graphData.flatMap(line => line.data.map(d => d.amount)),
    1
  );

  const toggleProduct = (product: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(product)) {
        return prev.filter(p => p !== product);
      } else {
        if (prev.length >= 5) {
          alert('최대 5개까지만 선택할 수 있습니다.');
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
        방법 3: 드롭다운 멀티셀렉트
      </h1>
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '32px'
      }}>
        그래프 헤더의 드롭다운에서 여러 품목을 선택하고, 선택된 품목들의 조합 데이터를 표시합니다.
      </p>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 헤더 with 드롭다운 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            마켓별 통계
          </h3>

          {/* 드롭다운 버튼 */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '10px 16px',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '200px',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <span style={{ color: selectedProducts.length > 0 ? '#111827' : '#9ca3af' }}>
                {selectedProducts.length > 0
                  ? `${selectedProducts.length}개 품목 선택됨`
                  : '품목 선택'}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {isDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* 드롭다운 메뉴 */}
            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                minWidth: '280px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {/* 헤더 */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  background: 'white',
                  zIndex: 1
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    품목 선택 (최대 5개)
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {selectedProducts.length}/5
                  </span>
                </div>

                {/* 전체 해제 버튼 */}
                {selectedProducts.length > 0 && (
                  <div style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => setSelectedProducts([])}
                      style={{
                        width: '100%',
                        padding: '6px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      전체 해제
                    </button>
                  </div>
                )}

                {/* 품목 리스트 */}
                <div style={{ padding: '8px' }}>
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
                          padding: '10px 8px',
                          borderRadius: '6px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.5 : 1,
                          background: isSelected ? '#eef2ff' : 'transparent',
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
                            width: '16px',
                            height: '16px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            accentColor: '#6366f1'
                          }}
                        />
                        <span style={{
                          fontSize: '14px',
                          color: isSelected ? '#4338ca' : '#374151',
                          fontWeight: isSelected ? '500' : '400',
                          flex: 1
                        }}>
                          {product}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 선택된 품목 배지 */}
        {selectedProducts.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            {selectedProducts.map((product, idx) => (
              <span
                key={idx}
                onClick={() => toggleProduct(product)}
                style={{
                  fontSize: '12px',
                  color: '#6366f1',
                  backgroundColor: '#eef2ff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#eef2ff';
                }}
              >
                {product}
                <span style={{ fontSize: '14px' }}>×</span>
              </span>
            ))}
          </div>
        )}

        {/* 그래프 또는 빈 상태 */}
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
              위의 드롭다운에서 품목을 선택하면 해당 품목의 마켓별 통계가 표시됩니다.
            </p>
          </div>
        )}

        {selectedProducts.length > 0 && (
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
          <li>✅ 공간 효율적 - 드롭다운으로 품목 선택 UI 숨김</li>
          <li>✅ 깔끔한 레이아웃 - 그래프 영역을 최대화</li>
          <li>✅ 친숙한 UX - 드롭다운은 일반적인 UI 패턴</li>
          <li>✅ 선택된 품목을 배지로 명확하게 표시</li>
          <li>✅ 배지 클릭으로 빠른 개별 해제 가능</li>
          <li>⚠️ 드롭다운이 닫히면 선택 가능한 품목이 보이지 않음</li>
          <li>⚠️ 드롭다운 열기/닫기 동작 필요</li>
        </ul>
      </div>

      {/* 추가 설명 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '24px',
        color: 'white'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '12px'
        }}>
          🎯 실전 활용 팁
        </h3>
        <ul style={{
          fontSize: '14px',
          lineHeight: '1.8',
          paddingLeft: '20px'
        }}>
          <li>드롭다운 내 검색 기능 추가 시 많은 품목도 쉽게 관리</li>
          <li>최근 선택 항목을 상단에 표시하면 재선택이 편리</li>
          <li>"자주 선택하는 조합" 프리셋 기능 추가 가능</li>
          <li>모바일에서 특히 유용한 방식</li>
        </ul>
      </div>
    </div>
  );
}
