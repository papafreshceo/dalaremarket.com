// src/components/tools/PriceSimulator.jsx
import { useState, useEffect } from 'react';

function PriceSimulator() {
  const [baseInfo, setBaseInfo] = useState({
    productName: '',
    originalPrice: '',
    purchasePrice: '',
    targetMargin: '30'
  });

  const [scenarios, setScenarios] = useState([
    { id: 1, name: '일반 판매', discount: 0, quantity: 100, commission: 10 },
    { id: 2, name: '할인 이벤트', discount: 20, quantity: 200, commission: 10 },
    { id: 3, name: '대량 판매', discount: 30, quantity: 500, commission: 8 }
  ]);

  const [selectedScenario, setSelectedScenario] = useState(1);
  const [comparison, setComparison] = useState([]);

  // 시나리오별 계산
  const calculateScenario = (scenario) => {
    const purchase = parseFloat(baseInfo.purchasePrice) || 0;
    const original = parseFloat(baseInfo.originalPrice) || 0;
    const discountedPrice = original * (1 - scenario.discount / 100);
    const commissionAmount = discountedPrice * (scenario.commission / 100);
    const netPrice = discountedPrice - commissionAmount;
    const profit = netPrice - purchase;
    const marginRate = netPrice > 0 ? (profit / netPrice) * 100 : 0;
    const totalRevenue = netPrice * scenario.quantity;
    const totalProfit = profit * scenario.quantity;

    return {
      ...scenario,
      discountedPrice,
      commissionAmount,
      netPrice,
      profit,
      marginRate,
      totalRevenue,
      totalProfit
    };
  };

  useEffect(() => {
    const results = scenarios.map(scenario => calculateScenario(scenario));
    setComparison(results);
  }, [baseInfo, scenarios]);

  const updateScenario = (id, field, value) => {
    setScenarios(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const addScenario = () => {
    const newId = Math.max(...scenarios.map(s => s.id)) + 1;
    setScenarios([...scenarios, {
      id: newId,
      name: `시나리오 ${newId}`,
      discount: 15,
      quantity: 150,
      commission: 10
    }]);
  };

  const deleteScenario = (id) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter(s => s.id !== id));
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const getColorByMargin = (margin) => {
    if (margin >= 30) return '#10b981';
    if (margin >= 20) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          판매가 시뮬레이터
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          다양한 판매 시나리오를 비교하여 최적의 가격 전략을 수립하세요
        </p>
      </div>

      {/* 기본 정보 입력 */}
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
          marginBottom: '20px'
        }}>
          상품 기본 정보
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: '#495057',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              상품명
            </label>
            <input
              type="text"
              value={baseInfo.productName}
              onChange={(e) => setBaseInfo({...baseInfo, productName: e.target.value})}
              placeholder="상품명 입력"
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
              정가
            </label>
            <input
              type="number"
              value={baseInfo.originalPrice}
              onChange={(e) => setBaseInfo({...baseInfo, originalPrice: e.target.value})}
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
              value={baseInfo.purchasePrice}
              onChange={(e) => setBaseInfo({...baseInfo, purchasePrice: e.target.value})}
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
              value={baseInfo.targetMargin}
              onChange={(e) => setBaseInfo({...baseInfo, targetMargin: e.target.value})}
              placeholder="30"
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

      {/* 시나리오 설정 */}
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
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600'
          }}>
            시나리오 설정
          </h3>
          <button
            onClick={addScenario}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            + 시나리오 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {scenarios.map(scenario => (
            <div
              key={scenario.id}
              style={{
                padding: '16px',
                background: selectedScenario === scenario.id ? '#e7f3ff' : '#f8f9fa',
                border: selectedScenario === scenario.id ? '2px solid #2563eb' : '1px solid #dee2e6',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                gap: '16px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    outline: 'none'
                  }}
                />
                
                <div>
                  <label style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                    할인율 (%)
                  </label>
                  <input
                    type="number"
                    value={scenario.discount}
                    onChange={(e) => updateScenario(scenario.id, 'discount', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                    예상 수량
                  </label>
                  <input
                    type="number"
                    value={scenario.quantity}
                    onChange={(e) => updateScenario(scenario.id, 'quantity', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                    수수료 (%)
                  </label>
                  <input
                    type="number"
                    value={scenario.commission}
                    onChange={(e) => updateScenario(scenario.id, 'commission', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                {scenarios.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScenario(scenario.id);
                    }}
                    style={{
                      padding: '6px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 비교 결과 */}
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
          시나리오 비교 분석
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>시나리오</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>판매가</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>수수료</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>순매출</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>개당 이익</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>마진율</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>총 수익</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(result => (
                <tr 
                  key={result.id}
                  style={{
                    borderBottom: '1px solid #f1f3f5',
                    background: selectedScenario === result.id ? '#f8f9fa' : 'transparent'
                  }}
                >
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{result.name}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                    {formatNumber(result.discountedPrice)}원
                    {result.discount > 0 && (
                      <span style={{ fontSize: '11px', color: '#ef4444', marginLeft: '4px' }}>
                        (-{result.discount}%)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#6c757d' }}>
                    {formatNumber(result.commissionAmount)}원
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                    {formatNumber(result.netPrice)}원
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                    {formatNumber(result.profit)}원
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: getColorByMargin(result.marginRate)
                  }}>
                    {result.marginRate.toFixed(1)}%
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2563eb'
                  }}>
                    {formatNumber(result.totalProfit)}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 최적 시나리오 추천 */}
        {comparison.length > 0 && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, #e7f3ff 0%, #dbeafe 100%)',
            borderRadius: '12px',
            border: '1px solid #2563eb'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              💡 추천 시나리오
            </h4>
            <p style={{ fontSize: '13px', color: '#495057', lineHeight: '1.6' }}>
              {(() => {
                const bestProfit = comparison.reduce((prev, current) => 
                  prev.totalProfit > current.totalProfit ? prev : current
                );
                const bestMargin = comparison.reduce((prev, current) => 
                  prev.marginRate > current.marginRate ? prev : current
                );
                
                if (bestProfit.id === bestMargin.id) {
                  return `"${bestProfit.name}" 시나리오가 총 수익 ${formatNumber(bestProfit.totalProfit)}원과 마진율 ${bestMargin.marginRate.toFixed(1)}% 모두에서 최적입니다.`;
                } else {
                  return `총 수익 최대화: "${bestProfit.name}" (${formatNumber(bestProfit.totalProfit)}원)\n마진율 최대화: "${bestMargin.name}" (${bestMargin.marginRate.toFixed(1)}%)`;
                }
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceSimulator;