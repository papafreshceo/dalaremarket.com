'use client';

import React, { useState } from 'react';

interface TrendData {
  keyword: string;
  period: string;
  ratio: string;
}

// 라인 차트 컴포넌트
function LineChart({ data }: { data: any[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: any } | null>(null);

  if (!data || data.length === 0 || !data[0].data) {
    return null;
  }

  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = chartWidth - padding.left - padding.right;
  const height = chartHeight - padding.top - padding.bottom;

  // 모든 데이터 포인트에서 최대값 찾기
  const allValues = data.flatMap(series => series.data.map((d: any) => parseFloat(d.ratio)));
  const maxValue = Math.max(...allValues, 100);
  const minValue = 0;

  // 데이터 포인트 수
  const dataPoints = data[0].data.length;

  // 좌표 변환 함수
  const getX = (index: number) => (index / (dataPoints - 1)) * width;
  const getY = (value: number) => height - ((value - minValue) / (maxValue - minValue)) * height;

  // 색상 배열
  const colors = ['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#ab47bc'];

  return (
    <div style={{ position: 'relative', width: '100%', height: `${chartHeight}px` }}>
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ overflow: 'visible' }}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* 그리드 라인 (Y축) */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = getY(value);
            return (
              <g key={value}>
                <line
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={-10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill="#9ca3af"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* X축 라벨 */}
          {data[0].data.map((point: any, index: number) => {
            // 10개 정도만 표시
            if (index % Math.ceil(dataPoints / 10) !== 0 && index !== dataPoints - 1) {
              return null;
            }
            const x = getX(index);
            return (
              <text
                key={index}
                x={x}
                y={height + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {point.period.substring(5)}
              </text>
            );
          })}

          {/* 라인 그리기 */}
          {data.map((series, seriesIndex) => {
            const pathData = series.data
              .map((point: any, index: number) => {
                const x = getX(index);
                const y = getY(parseFloat(point.ratio));
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ');

            return (
              <g key={seriesIndex}>
                {/* 라인 */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={colors[seriesIndex]}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* 데이터 포인트 */}
                {series.data.map((point: any, index: number) => {
                  const x = getX(index);
                  const y = getY(parseFloat(point.ratio));
                  const pointData = {
                    keyword: series.title,
                    date: point.period,
                    value: point.ratio,
                    color: colors[seriesIndex]
                  };

                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={colors[seriesIndex]}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredPoint({
                          x: rect.left,
                          y: rect.top,
                          data: pointData
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Y축 라벨 */}
          <text
            x={-height / 2}
            y={-35}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            transform={`rotate(-90, -${height / 2}, -35)`}
          >
            검색 관심도
          </text>
        </g>
      </svg>

      {/* 툴팁 */}
      {hoveredPoint && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredPoint.x}px`,
            top: `${hoveredPoint.y - 80}px`,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px', color: hoveredPoint.data.color }}>
            {hoveredPoint.data.keyword}
          </div>
          <div>{hoveredPoint.data.date}</div>
          <div style={{ fontWeight: '600' }}>관심도: {hoveredPoint.data.value}</div>
        </div>
      )}
    </div>
  );
}

export default function TrendAnalysis() {
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [period, setPeriod] = useState('1m'); // 1m, 3m, 6m, 1y
  const [device, setDevice] = useState('all'); // all, pc, mobile
  const [gender, setGenderder] = useState('all'); // all, m, f
  const [age, setAge] = useState('all'); // all, 10, 20, 30, 40, 50
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // 키워드 추가
  const addKeyword = () => {
    if (keywords.length < 5) {
      setKeywords([...keywords, '']);
    }
  };

  // 키워드 제거
  const removeKeyword = (index: number) => {
    if (keywords.length > 1) {
      setKeywords(keywords.filter((_, i) => i !== index));
    }
  };

  // 키워드 변경
  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  // 트렌드 데이터 조회
  const analyzeTrend = async () => {
    const validKeywords = keywords.filter(k => k.trim() !== '');

    if (validKeywords.length === 0) {
      setError('최소 1개 이상의 키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/naver-trend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: validKeywords,
          period,
          device,
          gender,
          age
        }),
      });

      if (!response.ok) {
        throw new Error('트렌드 데이터를 가져오는데 실패했습니다.');
      }

      const data = await response.json();

      // 데이터 검증
      if (!data.results || data.results.length === 0) {
        setError('키워드에 대한 검색 데이터가 충분하지 않습니다. 더 일반적인 키워드를 사용해보세요.');
        return;
      }

      setTrendData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 최댓값 찾기
  const getMaxValue = (data: any[]) => {
    return Math.max(...data.map(d => d.ratio));
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: 'white' }}>
      {/* 좌측 패널 - 검색 설정 */}
      <div style={{
        width: '320px',
        borderRight: '1px solid #e5e7eb',
        padding: '24px',
        overflowY: 'auto',
        background: '#fafafa'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '24px',
          color: '#111827'
        }}>
          검색어 트렌드
        </h3>

        {/* 키워드 입력 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#374151'
          }}>
            검색어 (최대 5개)
          </label>

          {keywords.map((keyword, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '10px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: ['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#ab47bc'][index],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '11px',
                fontWeight: '600',
                flexShrink: 0
              }}>
                {index + 1}
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => updateKeyword(index, e.target.value)}
                placeholder="검색어를 입력하세요"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4285f4'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              {keywords.length > 1 && (
                <button
                  onClick={() => removeKeyword(index)}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  title="삭제"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {keywords.length < 5 && (
            <button
              onClick={addKeyword}
              style={{
                width: '100%',
                padding: '8px',
                background: 'white',
                border: '1px dashed #d1d5db',
                borderRadius: '4px',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
                marginTop: '8px'
              }}
            >
              + 검색어 추가
            </button>
          )}
        </div>

        {/* 조회 기간 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#374151'
          }}>
            조회 기간
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            {[
              { value: '1m', label: '1개월' },
              { value: '3m', label: '3개월' },
              { value: '6m', label: '6개월' },
              { value: '1y', label: '1년' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                style={{
                  padding: '8px',
                  background: period === option.value ? '#4285f4' : 'white',
                  color: period === option.value ? 'white' : '#6b7280',
                  border: `1px solid ${period === option.value ? '#4285f4' : '#d1d5db'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: period === option.value ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 기기 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#374151'
          }}>
            기기
          </label>
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">전체</option>
            <option value="pc">PC</option>
            <option value="mobile">모바일</option>
          </select>
        </div>

        {/* 성별 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#374151'
          }}>
            성별
          </label>
          <select
            value={gender}
            onChange={(e) => setGenderder(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">전체</option>
            <option value="m">남성</option>
            <option value="f">여성</option>
          </select>
        </div>

        {/* 연령대 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#374151'
          }}>
            연령
          </label>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">전체</option>
            <option value="10">10대</option>
            <option value="20">20대</option>
            <option value="30">30대</option>
            <option value="40">40대</option>
            <option value="50">50대 이상</option>
          </select>
        </div>

        {/* 조회 버튼 */}
        <button
          onClick={analyzeTrend}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#9ca3af' : '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {loading ? '조회 중...' : '조회하기'}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#dc2626',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* 우측 패널 - 차트 영역 */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {trendData && trendData.results ? (
          <>
            {/* 헤더 */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px'
              }}>
                검색어 트렌드
              </h2>
              <p style={{
                fontSize: '13px',
                color: '#6b7280'
              }}>
                기간별 검색 관심도 추이를 확인하세요
              </p>
            </div>

            {/* 범례 */}
            <div style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {trendData.results.map((result: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: ['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#ab47bc'][index]
                  }} />
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {result.title}
                  </span>
                </div>
              ))}
            </div>

            {/* 라인 차트 */}
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              {trendData.results[0]?.data && trendData.results[0].data.length > 0 ? (
                <LineChart data={trendData.results} />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '400px',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}>
                  데이터가 없습니다.
                </div>
              )}
            </div>

            {/* 통계 요약 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {trendData.results.map((result: any, index: number) => {
                const values = result.data.map((d: any) => parseFloat(d.ratio));
                const avg = (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1);
                const max = Math.max(...values).toFixed(1);
                const min = Math.min(...values).toFixed(1);

                return (
                  <div key={index} style={{
                    padding: '16px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${['#4285f4', '#0f9d58', '#f4b400', '#db4437', '#ab47bc'][index]}`
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '12px'
                    }}>
                      {result.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                      평균 관심도: <span style={{ fontWeight: '600', color: '#374151' }}>{avg}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                      최고: <span style={{ fontWeight: '600', color: '#374151' }}>{max}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      최저: <span style={{ fontWeight: '600', color: '#374151' }}>{min}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : !loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#9ca3af'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '16px',
              opacity: 0.5
            }}>
              📊
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#6b7280'
            }}>
              검색어를 입력하고 조회하기를 눌러주세요
            </div>
            <div style={{
              fontSize: '13px',
              color: '#9ca3af'
            }}>
              네이버 데이터랩 검색량 데이터 기반
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#4285f4',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px'
              }} />
              <div style={{ fontSize: '14px', color: '#6b7280' }}>데이터 조회 중...</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
