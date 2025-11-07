'use client';

import React, { useState } from 'react';

interface TrendData {
  keyword: string;
  period: string;
  ratio: string;
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
    <div style={{ padding: '24px' }}>
      {/* 키워드 입력 영역 */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#212529'
        }}>
          검색 키워드 설정 (최대 5개)
        </h3>

        {keywords.map((keyword, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            alignItems: 'center'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {index + 1}
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => updateKeyword(index, e.target.value)}
              placeholder="검색 키워드 입력"
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            />
            {keywords.length > 1 && (
              <button
                onClick={() => removeKeyword(index)}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid #dc3545',
                  borderRadius: '6px',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                삭제
              </button>
            )}
          </div>
        ))}

        {keywords.length < 5 && (
          <button
            onClick={addKeyword}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginTop: '8px'
            }}
          >
            + 키워드 추가
          </button>
        )}
      </div>

      {/* 필터 옵션 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* 기간 선택 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '6px',
            color: '#495057'
          }}>
            조회 기간
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="1m">최근 1개월</option>
            <option value="3m">최근 3개월</option>
            <option value="6m">최근 6개월</option>
            <option value="1y">최근 1년</option>
          </select>
        </div>

        {/* 기기 선택 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '6px',
            color: '#495057'
          }}>
            기기
          </label>
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">전체</option>
            <option value="pc">PC</option>
            <option value="mobile">모바일</option>
          </select>
        </div>

        {/* 성별 선택 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '6px',
            color: '#495057'
          }}>
            성별
          </label>
          <select
            value={gender}
            onChange={(e) => setGenderder(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">전체</option>
            <option value="m">남성</option>
            <option value="f">여성</option>
          </select>
        </div>

        {/* 연령대 선택 */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '6px',
            color: '#495057'
          }}>
            연령대
          </label>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
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
      </div>

      {/* 분석 버튼 */}
      <button
        onClick={analyzeTrend}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          background: loading ? '#6c757d' : 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '24px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {loading ? '분석 중...' : '트렌드 분석하기'}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          padding: '16px',
          background: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '8px',
          color: '#c53030',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* 트렌드 차트 */}
      {trendData && trendData.results && (
        <div style={{
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '24px',
            color: '#212529'
          }}>
            검색량 추이 분석
          </h3>

          {/* 범례 */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            {trendData.results.map((result: any, index: number) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index]
                }} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  {result.title}
                </span>
              </div>
            ))}
          </div>

          {/* 차트 영역 */}
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            minHeight: '400px',
            position: 'relative'
          }}>
            {trendData.results[0]?.data && trendData.results[0].data.length > 0 ? (
              <div style={{ height: '360px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                {trendData.results[0].data.map((dataPoint: any, index: number) => {
                  const maxValue = Math.max(
                    ...trendData.results.flatMap((r: any) => r.data.map((d: any) => parseFloat(d.ratio)))
                  );

                  return (
                    <div key={index} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      minWidth: '20px'
                    }}>
                      {/* 막대 그래프들 */}
                      <div style={{
                        width: '100%',
                        height: '320px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        gap: '2px',
                        position: 'relative'
                      }}>
                        {trendData.results.map((result: any, resultIndex: number) => {
                          const value = parseFloat(result.data[index]?.ratio || '0');
                          const height = (value / maxValue) * 100;

                          return (
                            <div
                              key={resultIndex}
                              style={{
                                flex: 1,
                                height: `${height}%`,
                                background: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][resultIndex],
                                borderRadius: '4px 4px 0 0',
                                minHeight: value > 0 ? '2px' : '0',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                              title={`${result.title}: ${value}`}
                            />
                          );
                        })}
                      </div>
                      {/* 날짜 라벨 (일부만 표시) */}
                      {index % Math.ceil(trendData.results[0].data.length / 10) === 0 && (
                        <span style={{
                          fontSize: '10px',
                          color: '#6c757d',
                          transform: 'rotate(-45deg)',
                          transformOrigin: 'top left',
                          whiteSpace: 'nowrap',
                          marginTop: '20px'
                        }}>
                          {dataPoint.period}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '360px',
                color: '#6c757d',
                fontSize: '14px'
              }}>
                데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 통계 요약 */}
          <div style={{
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {trendData.results.map((result: any, index: number) => {
              const values = result.data.map((d: any) => parseFloat(d.ratio));
              const avg = (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2);
              const max = Math.max(...values);
              const min = Math.min(...values);

              return (
                <div key={index} style={{
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index]}`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#212529',
                    marginBottom: '12px'
                  }}>
                    {result.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                    평균: {avg}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                    최고: {max}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    최저: {min}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      {!trendData && !loading && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6c757d',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            📊
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            키워드를 입력하고 트렌드를 분석해보세요
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6c757d'
          }}>
            네이버 데이터랩의 검색량 데이터를 기반으로 트렌드를 분석합니다.
          </div>
        </div>
      )}
    </div>
  );
}
