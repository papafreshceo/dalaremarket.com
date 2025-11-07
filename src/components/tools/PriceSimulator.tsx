'use client';

import React, { useState, useEffect } from 'react';
import { SaveLoadUI } from './MarginCalculator';

interface MarketFee {
  market_name: string;
  fee_rate: number;
}

export default function PriceSimulator() {
  // 기본 데이터
  const [supplyPrice, setSupplyPrice] = useState<string>('');

  // 마진 혼합 비율 (0: 마진율 기준, 100: 마진액 기준)
  const [marginMixRatio, setMarginMixRatio] = useState<number>(50);
  const [targetMarginRate, setTargetMarginRate] = useState<string>('30');
  const [targetMarginAmount, setTargetMarginAmount] = useState<string>('');

  // 추가 비용/할인
  const [reviewPoint, setReviewPoint] = useState<string>('');
  const [signupPoint, setSignupPoint] = useState<string>('');
  const [couponAmount, setCouponAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [additionalCost, setAdditionalCost] = useState<string>('');

  // 저장/불러오기 기능
  const [saveName, setSaveName] = useState<string>('');
  const [savedConfigs, setSavedConfigs] = useState<Array<{ name: string; timestamp: string }>>([]);

  // 마켓 수수료
  const [marketFees, setMarketFees] = useState<MarketFee[]>([
    { market_name: '', fee_rate: 0 }
  ]);

  // localStorage에서 저장된 설정 목록 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('priceSimulator_savedConfigs');
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved configs:', e);
      }
    }
  }, []);

  // localStorage에서 수수료율 불러오기
  useEffect(() => {
    const savedFees = localStorage.getItem('marginCalculator_marketFees');
    if (savedFees) {
      try {
        const parsed = JSON.parse(savedFees);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMarketFees(parsed);
        }
      } catch (e) {
        console.error('Failed to parse market fees:', e);
      }
    }
  }, []);

  // 마켓 색상
  const marketColors = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#fef3c7', text: '#b45309' },
    { bg: '#fce7f3', text: '#9f1239' },
    { bg: '#e0e7ff', text: '#4338ca' }
  ];

  // 최종 판매가 계산 (마진율과 마진액 혼합)
  const calculateFinalPrice = (market: MarketFee) => {
    if (!supplyPrice) return 0;

    const supply = parseFloat(supplyPrice);
    const rateWeight = (100 - marginMixRatio) / 100;
    const amountWeight = marginMixRatio / 100;

    // 마진율 기준 계산
    const targetRate = parseFloat(targetMarginRate) || 0;
    const priceByRate = supply / (1 - (targetRate + market.fee_rate) / 100);

    // 마진액 기준 계산
    const targetAmount = parseFloat(targetMarginAmount) || 0;
    const priceByAmount = (supply + targetAmount) / (1 - market.fee_rate / 100);

    // 혼합 계산
    const mixedPrice = (priceByRate * rateWeight) + (priceByAmount * amountWeight);

    return Math.floor(mixedPrice);
  };

  // 추가 비용 합계
  const getTotalAdditionalCosts = () => {
    const review = parseFloat(reviewPoint) || 0;
    const signup = parseFloat(signupPoint) || 0;
    const coupon = parseFloat(couponAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    const additional = parseFloat(additionalCost) || 0;

    return review + signup + coupon + discount + additional;
  };

  // 최종 마진 계산
  const calculateFinalMargin = (market: MarketFee) => {
    const finalPrice = calculateFinalPrice(market);
    const supply = parseFloat(supplyPrice) || 0;
    const fee = (finalPrice * market.fee_rate) / 100;
    const additionalCosts = getTotalAdditionalCosts();

    const finalMargin = finalPrice - supply - fee - additionalCosts;
    const finalMarginRate = finalPrice > 0 ? (finalMargin / finalPrice) * 100 : 0;

    return {
      finalPrice,
      fee,
      finalMargin,
      finalMarginRate,
      additionalCosts
    };
  };

  // 저장 기능
  const handleSave = () => {
    if (!saveName.trim()) {
      alert('저장할 이름을 입력해주세요.');
      return;
    }

    const configData = {
      supplyPrice,
      marginMixRatio,
      targetMarginRate,
      targetMarginAmount,
      reviewPoint,
      signupPoint,
      couponAmount,
      discountAmount,
      additionalCost,
      marketFees
    };

    localStorage.setItem(`priceSimulator_${saveName}`, JSON.stringify(configData));

    const newConfig = {
      name: saveName,
      timestamp: new Date().toISOString()
    };

    const updatedConfigs = [...savedConfigs.filter(c => c.name !== saveName), newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('priceSimulator_savedConfigs', JSON.stringify(updatedConfigs));

    alert(`"${saveName}" 설정이 저장되었습니다.`);
  };

  // 불러오기 기능
  const handleLoad = (name: string) => {
    const saved = localStorage.getItem(`priceSimulator_${name}`);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setSupplyPrice(config.supplyPrice || '');
        setMarginMixRatio(config.marginMixRatio || 50);
        setTargetMarginRate(config.targetMarginRate || '30');
        setTargetMarginAmount(config.targetMarginAmount || '');
        setReviewPoint(config.reviewPoint || '');
        setSignupPoint(config.signupPoint || '');
        setCouponAmount(config.couponAmount || '');
        setDiscountAmount(config.discountAmount || '');
        setAdditionalCost(config.additionalCost || '');
        if (config.marketFees) {
          setMarketFees(config.marketFees);
        }
        setSaveName(name);
        alert(`"${name}" 설정을 불러왔습니다.`);
      } catch (e) {
        alert('설정을 불러오는데 실패했습니다.');
      }
    }
  };

  // 삭제 기능
  const handleDelete = (name: string) => {
    if (confirm(`"${name}" 설정을 삭제하시겠습니까?`)) {
      localStorage.removeItem(`priceSimulator_${name}`);
      const updatedConfigs = savedConfigs.filter(c => c.name !== name);
      setSavedConfigs(updatedConfigs);
      localStorage.setItem('priceSimulator_savedConfigs', JSON.stringify(updatedConfigs));
      if (saveName === name) {
        setSaveName('');
      }
    }
  };

  // 마진계산기에서 저장한 데이터 불러오기
  const loadFromMarginCalculator = (name: string) => {
    const saved = localStorage.getItem(`marginCalculator_${name}`);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        // 마진계산기의 마켓 수수료 불러오기
        if (config.marketFees) {
          setMarketFees(config.marketFees);
        }
        alert(`마진계산기 "${name}" 설정의 수수료율을 불러왔습니다.`);
      } catch (e) {
        alert('마진계산기 설정을 불러오는데 실패했습니다.');
      }
    } else {
      alert('해당 이름의 마진계산기 설정을 찾을 수 없습니다.');
    }
  };

  // 마진계산기 설정 목록 가져오기
  const getMarginCalculatorConfigs = () => {
    const saved = localStorage.getItem('marginCalculator_savedConfigs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // 마진계산기 설정 목록을 state로 관리
  const [marginConfigs, setMarginConfigs] = useState<Array<{ name: string; timestamp: string }>>([]);

  // 마진계산기 설정 불러오기
  useEffect(() => {
    const configs = getMarginCalculatorConfigs();
    setMarginConfigs(configs);
  }, []);


  return (
    <div style={{ padding: '24px' }}>
      {/* 입력 영역 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* 기본 설정 */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '12px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#212529'
          }}>
            기본 설정
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#495057'
            }}>
              공급가 (원)
            </label>
            <input
              type="text"
              value={supplyPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setSupplyPrice(value);
              }}
              placeholder="10000"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#495057'
            }}>
              목표 마진율 (%)
            </label>
            <input
              type="text"
              value={targetMarginRate}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setTargetMarginRate(value);
              }}
              placeholder="30"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#495057'
            }}>
              목표 마진액 (원)
            </label>
            <input
              type="text"
              value={targetMarginAmount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setTargetMarginAmount(value);
              }}
              placeholder="3000"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* 마진 혼합 비율 */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '12px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#212529'
          }}>
            마진 계산 방식 혼합
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '13px', color: '#495057' }}>마진율 기준</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
                {100 - marginMixRatio}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={marginMixRatio}
              onChange={(e) => setMarginMixRatio(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                outline: 'none',
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${100 - marginMixRatio}%, #10b981 ${100 - marginMixRatio}%, #10b981 100%)`
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px'
            }}>
              <span style={{ fontSize: '13px', color: '#495057' }}>마진액 기준</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
                {marginMixRatio}%
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
              혼합 방식 설명
            </div>
            <div style={{ fontSize: '13px', color: '#212529' }}>
              슬라이더를 조정하여 마진율과 마진액 방식을 혼합할 수 있습니다.
              중간값(50%)은 두 방식을 균등하게 혼합합니다.
            </div>
          </div>
        </div>

        {/* 추가 비용/할인 */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '12px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#212529'
          }}>
            추가 비용 및 할인
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#495057'
            }}>
              리뷰 포인트 (원)
            </label>
            <input
              type="text"
              value={reviewPoint}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setReviewPoint(value);
              }}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#495057'
            }}>
              가입 포인트 (원)
            </label>
            <input
              type="text"
              value={signupPoint}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setSignupPoint(value);
              }}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#495057'
            }}>
              쿠폰 금액 (원)
            </label>
            <input
              type="text"
              value={couponAmount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setCouponAmount(value);
              }}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#495057'
            }}>
              프로모션 할인 (원)
            </label>
            <input
              type="text"
              value={discountAmount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setDiscountAmount(value);
              }}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#495057'
            }}>
              기타 비용 (원)
            </label>
            <input
              type="text"
              value={additionalCost}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setAdditionalCost(value);
              }}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{
            marginTop: '12px',
            padding: '10px',
            background: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#495057' }}>
              추가 비용 합계
            </span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc3545' }}>
              {getTotalAdditionalCosts().toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 결과 테이블 */}
      {supplyPrice && marketFees.length > 0 && marketFees[0].market_name && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #dee2e6',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            background: '#f8f9fa',
            borderBottom: '1px solid #dee2e6'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              color: '#212529'
            }}>
              마켓별 최종 판매가 시뮬레이션
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    마켓명
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    수수료율
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    최종 판매가
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    수수료
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    추가비용
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    최종 마진
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    최종 마진율
                  </th>
                </tr>
              </thead>
              <tbody>
                {marketFees.map((market, index) => {
                  if (!market.market_name) return null;
                  const result = calculateFinalMargin(market);
                  const colorScheme = marketColors[index % marketColors.length];

                  return (
                    <tr key={index} style={{
                      borderBottom: '1px solid #f1f3f5'
                    }}>
                      <td style={{
                        padding: '12px 16px'
                      }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: colorScheme.bg,
                          color: colorScheme.text,
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          {market.market_name}
                        </div>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: '#495057'
                      }}>
                        {market.fee_rate.toFixed(1)}%
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#212529'
                      }}>
                        {result.finalPrice.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: '#dc3545'
                      }}>
                        {Math.floor(result.fee).toLocaleString()}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: '#dc3545'
                      }}>
                        {Math.floor(result.additionalCosts).toLocaleString()}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: result.finalMargin >= 0 ? '#10b981' : '#dc3545'
                      }}>
                        {Math.floor(result.finalMargin).toLocaleString()}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: result.finalMarginRate >= 0 ? '#10b981' : '#dc3545'
                      }}>
                        {result.finalMarginRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      {(!supplyPrice || !marketFees[0]?.market_name) && (
        <div style={{
          background: '#f8f9fa',
          padding: '32px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            📊
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#212529'
          }}>
            시뮬레이션을 시작하세요
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6c757d',
            margin: 0
          }}>
            공급가를 입력하고 마켓 수수료율을 설정하면<br />
            다양한 조건에서의 최종 판매가와 마진을 확인할 수 있습니다.
          </p>
          {!marketFees[0]?.market_name && (
            <p style={{
              fontSize: '13px',
              color: '#dc3545',
              marginTop: '12px',
              fontWeight: '500'
            }}>
              💡 마진계산기에서 마켓 수수료율을 먼저 설정해주세요.
            </p>
          )}
        </div>
      )}

      {/* 구분선 */}
      <div style={{ height: '1px', background: '#dee2e6', margin: '24px 0' }} />

      {/* 저장/불러오기/삭제 UI */}
      <SaveLoadUI
        saveName={saveName}
        setSaveName={setSaveName}
        savedConfigs={[
          ...savedConfigs,
          ...marginConfigs.map((config: { name: string; timestamp: string }) => ({
            name: `[마진계산기] ${config.name}`,
            timestamp: config.timestamp,
            source: 'margin' as const
          }))
        ]}
        onSave={handleSave}
        onLoad={(name: string) => {
          if (name.startsWith('[마진계산기] ')) {
            const originalName = name.replace('[마진계산기] ', '');
            loadFromMarginCalculator(originalName);
          } else {
            handleLoad(name);
          }
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
