// src/components/tools/DiscountCalculator.jsx
import { useState, useEffect } from 'react';

function DiscountCalculator() {
  const [calculatorMode, setCalculatorMode] = useState('simple'); // simple, advanced
  
  const [simpleInputs, setSimpleInputs] = useState({
    originalPrice: '',
    purchasePrice: '',
    targetMargin: '20',
    currentDiscount: '0'
  });

  const [advancedInputs, setAdvancedInputs] = useState({
    originalPrice: '',
    purchasePrice: '',
    targetMargin: '20',
    commission: '10',
    shippingCost: '3000',
    packagingCost: '500',
    marketingCost: '5',
    taxRate: '10'
  });

  const [results, setResults] = useState({
    maxDiscount: 0,
    recommendedDiscount: 0,
    finalPrice: 0,
    actualMargin: 0,
    profit: 0,
    breakEvenDiscount: 0
  });

  const [scenarios, setScenarios] = useState([]);

  // 간단 계산
  useEffect(() => {
    if (calculatorMode === 'simple') {
      const original = parseFloat(simpleInputs.originalPrice) || 0;
      const purchase = parseFloat(simpleInputs.purchasePrice) || 0;
      const targetMargin = parseFloat(simpleInputs.targetMargin) || 0;
      
      if (original > 0 && purchase > 0) {
        const minPrice = purchase / (1 - targetMargin / 100);
        const maxDiscount = ((original - minPrice) / original) * 100;
        const recommendedDiscount = Math.max(0, Math.min(maxDiscount * 0.8, 50));
        const finalPrice = original * (1 - recommendedDiscount / 100);
        const profit = finalPrice - purchase;
        const actualMargin = (profit / finalPrice) * 100;
        const breakEvenDiscount = ((original - purchase) / original) * 100;

        setResults({
          maxDiscount: Math.max(0, maxDiscount),
          recommendedDiscount: recommendedDiscount,
          finalPrice: finalPrice,
          actualMargin: actualMargin,
          profit: profit,
          breakEvenDiscount: breakEvenDiscount
        });
        
        // 시나리오 생성
        const scenarioList = [0, 10, 20, 30, 40, 50].map(discount => {
          const price = original * (1 - discount / 100);
          const profit = price - purchase;
          const margin = (profit / price) * 100;
          return {
            discount,
            price,
            profit,
            margin,
            status: margin >= targetMargin ? 'good' : margin > 0 ? 'warning' : 'danger'
          };
        });
        setScenarios(scenarioList);
      }
    }
  }, [simpleInputs, calculatorMode]);

  // 고급 계산
  useEffect(() => {
    if (calculatorMode === 'advanced') {
      const original = parseFloat(advancedInputs.originalPrice) || 0;
      const purchase = parseFloat(advancedInputs.purchasePrice) || 0;
      const targetMargin = parseFloat(advancedInputs.targetMargin) || 0;
      const commission = parseFloat(advancedInputs.commission) || 0;
      const shipping = parseFloat(advancedInputs.shippingCost) || 0;
      const packaging = parseFloat(advancedInputs.packagingCost) || 0;
      const marketing = parseFloat(advancedInputs.marketingCost) || 0;
      const tax = parseFloat(advancedInputs.taxRate) || 0;
      
      if (original > 0 && purchase > 0) {
        const totalCost = purchase + shipping + packaging;
        const minRevenue = totalCost / (1 - targetMargin / 100);
        const minPrice = minRevenue / (1 - (commission + marketing + tax) / 100);
        const maxDiscount = ((original - minPrice) / original) * 100;
        const recommendedDiscount = Math.max(0, Math.min(maxDiscount * 0.8, 50));
        const finalPrice = original * (1 - recommendedDiscount / 100);
        const netRevenue = finalPrice * (1 - (commission + marketing + tax) / 100);
        const profit = netRevenue - totalCost;
        const actualMargin = (profit / netRevenue) * 100;
        const breakEvenPrice = totalCost / (1 - (commission + marketing + tax) / 100);
        const breakEvenDiscount = ((original - breakEvenPrice) / original) * 100;

        setResults({
          maxDiscount: Math.max(0, maxDiscount),
          recommendedDiscount: recommendedDiscount,
          finalPrice: finalPrice,
          actualMargin: actualMargin,
          profit: profit,
          breakEvenDiscount: Math.max(0, breakEvenDiscount)
        });
      }
    }
  }, [advancedInputs, calculatorMode]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          할인율 계산기
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          목표 마진을 유지하면서 최대 할인율을 계산합니다
        </p>
      </div>

      {/* 모드 선택 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setCalculatorMode('simple')}
          style={{
            flex: 1,
            padding: '12px',
            background: calculatorMode === 'simple' ? '#2563eb' : '#ffffff',
            color: calculatorMode === 'simple' ? '#ffffff' : '#495057',
            border: `1px solid ${calculatorMode === 'simple' ? '#2563eb' : '#dee2e6'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          간단 계산
        </button>
        <button
          onClick={() => setCalculatorMode('advanced')}
          style={{
            flex: 1,
            padding: '12px',
            background: calculatorMode === 'advanced' ? '#2563eb' : '#ffffff',
            color: calculatorMode === 'advanced' ? '#ffffff' : '#495057',
            border: `1px solid ${calculatorMode === 'advanced' ? '#2563eb' : '#dee2e6'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          고급 계산 (수수료 포함)
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* 입력 섹션 */}
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
            {calculatorMode === 'simple' ? '기본 정보' : '상세 정보'}
          </h3>

          {calculatorMode === 'simple' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#495057',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  정가 (원래 판매가)
                </label>
                <input
                  type="number"
                  value={simpleInputs.originalPrice}
                  onChange={(e) => setSimpleInputs({...simpleInputs, originalPrice: e.target.value})}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#495057',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  원가 (매입가)
                </label>
                <input
                  type="number"
                  value={simpleInputs.purchasePrice}
                  onChange={(e) => setSimpleInputs({...simpleInputs, purchasePrice: e.target.value})}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#495057',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  목표 마진율 (%)
                </label>
                <input
                  type="number"
                  value={simpleInputs.targetMargin}
                  onChange={(e) => setSimpleInputs({...simpleInputs, targetMargin: e.target.value})}
                  placeholder="20"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    정가
                  </label>
                  <input
                    type="number"
                    value={advancedInputs.originalPrice}
                    onChange={(e) => setAdvancedInputs({...advancedInputs, originalPrice: e.target.value})}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    원가
                  </label>
                  <input
                    type="number"
                    value={advancedInputs.purchasePrice}
                    onChange={(e) => setAdvancedInputs({...advancedInputs, purchasePrice: e.target.value})}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    목표 마진 (%)
                  </label>
                  <input
                    type="number"
                    value={advancedInputs.targetMargin}
                    onChange={(e) => setAdvancedInputs({...advancedInputs, targetMargin: e.target.value})}
                    placeholder="20"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    판매 수수료 (%)
                  </label>
                  <input
                    type="number"
                    value={advancedInputs.commission}
                    onChange={(e) => setAdvancedInputs({...advancedInputs, commission: e.target.value})}
                    placeholder="10"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    배송비
                  </label>
                  <input
                    type="number"
                    value={advancedInputs.shippingCost}
                    onChange={(e) => setAdvancedInputs({...advancedInputs, shippingCost: e.target.value})}
                    placeholder="3000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    포장비
                  </label>
                  <input
                    type="number"
                    value={advancedInputs.packagingCost}
                    onChange={(e) => setAdvancedInputs({...advancedInputs, packagingCost: e.target.value})}
                    placeholder="500"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    마케팅 비용 (%)
                  </label>
                  <input
                    type="number"
                    value={advancedInputs.marketingCost}
                    onChange={(e) => setAdvancedInputs({...advancedInputs, marketingCost: e.target.value})}
                    placeholder="5"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    세금 (%)
                  </label>
                  <input
                    type="number"
                    value={advancedInputs.taxRate}
                    onChange={(e) => setAdvancedInputs({...advancedInputs, taxRate: e.target.value})}
                    placeholder="10"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 결과 섹션 */}
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
            할인율 분석 결과
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              borderRadius: '12px',
              color: '#ffffff'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>권장 할인율</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>
                {results.recommendedDiscount.toFixed(1)}%
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              borderRadius: '12px',
              color: '#ffffff'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>최대 할인율</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>
                {results.maxDiscount.toFixed(1)}%
              </div>
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6c757d' }}>할인 후 판매가</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                {formatNumber(results.finalPrice)}원
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6c757d' }}>예상 마진율</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                {results.actualMargin.toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6c757d' }}>개당 이익</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                {formatNumber(results.profit)}원
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #dee2e6'
            }}>
              <span style={{ fontSize: '13px', color: '#6c757d' }}>손익분기 할인율</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                {results.breakEvenDiscount.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 경고 메시지 */}
          {results.maxDiscount < 0 && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              borderLeft: '3px solid #ef4444',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#dc3545', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="#dc3545"/>
                </svg>
                주의
              </div>
              <div style={{ fontSize: '12px', color: '#495057' }}>
                현재 원가와 목표 마진율로는 할인이 불가능합니다.
                원가를 낮추거나 목표 마진을 조정해주세요.
              </div>
            </div>
          )}

          {/* 할인율별 시뮬레이션 슬라이더 */}
          <div style={{ marginTop: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: '#495057',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              할인율 시뮬레이션
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={simpleInputs.currentDiscount}
              onChange={(e) => setSimpleInputs({...simpleInputs, currentDiscount: e.target.value})}
              style={{
                width: '100%',
                marginBottom: '8px'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#6c757d'
            }}>
              <span>0%</span>
              <span style={{ fontWeight: '600', color: '#2563eb' }}>
                {simpleInputs.currentDiscount}%
              </span>
              <span>50%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 시나리오 테이블 */}
      {calculatorMode === 'simple' && scenarios.length > 0 && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            할인율별 시나리오 비교
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>할인율</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>판매가</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>이익</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>마진율</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {scenario.discount}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                    {formatNumber(scenario.price)}원
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    fontSize: '14px',
                    color: scenario.profit > 0 ? '#10b981' : '#ef4444'
                  }}>
                    {formatNumber(scenario.profit)}원
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: scenario.status === 'good' ? '#10b981' : scenario.status === 'warning' ? '#f59e0b' : '#ef4444'
                  }}>
                    {scenario.margin.toFixed(1)}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: scenario.status === 'good' ? '#dcfce7' : scenario.status === 'warning' ? '#fef3c7' : '#fee2e2',
                      color: scenario.status === 'good' ? '#10b981' : scenario.status === 'warning' ? '#f59e0b' : '#ef4444',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {scenario.status === 'good' ? '적정' : scenario.status === 'warning' ? '주의' : '위험'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DiscountCalculator;