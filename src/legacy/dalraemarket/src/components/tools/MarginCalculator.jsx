// src/components/tools/MarginCalculator.jsx
import { useState, useEffect } from 'react';

function MarginCalculator() {
  const [inputs, setInputs] = useState({
    purchasePrice: '',
    sellingPrice: '',
    quantity: '1',
    additionalCost: ''
  });
  
  const [results, setResults] = useState({
    margin: 0,
    marginRate: 0,
    totalProfit: 0,
    roi: 0
  });

  const [savedCalculations, setSavedCalculations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 계산 로직
  useEffect(() => {
    const purchase = parseFloat(inputs.purchasePrice) || 0;
    const selling = parseFloat(inputs.sellingPrice) || 0;
    const qty = parseFloat(inputs.quantity) || 1;
    const additional = parseFloat(inputs.additionalCost) || 0;
    
    const totalCost = (purchase + additional) * qty;
    const totalRevenue = selling * qty;
    const margin = totalRevenue - totalCost;
    const marginRate = totalCost > 0 ? (margin / totalRevenue) * 100 : 0;
    const roi = totalCost > 0 ? (margin / totalCost) * 100 : 0;
    
    setResults({
      margin: margin,
      marginRate: marginRate,
      totalProfit: margin,
      roi: roi
    });
  }, [inputs]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveCalculation = () => {
    if (inputs.purchasePrice && inputs.sellingPrice) {
      const calculation = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        ...inputs,
        ...results
      };
      setSavedCalculations(prev => [calculation, ...prev].slice(0, 5));
    }
  };

  const loadCalculation = (calc) => {
    setInputs({
      purchasePrice: calc.purchasePrice,
      sellingPrice: calc.sellingPrice,
      quantity: calc.quantity,
      additionalCost: calc.additionalCost
    });
    setShowHistory(false);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          마진계산기
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          상품의 원가와 판매가를 입력하여 마진율과 수익률을 계산합니다
        </p>
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
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M11 17H13V13H17V11H13V7H11V11H7V13H11V17ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z" fill="#667eea"/>
            </svg>
            입력 정보
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 30px 10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '13px',
                  color: '#6c757d'
                }}>원</span>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#495057',
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                판매가
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={inputs.sellingPrice}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 30px 10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '13px',
                  color: '#6c757d'
                }}>원</span>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#495057',
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                수량
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={inputs.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="1"
                  style={{
                    width: '100%',
                    padding: '10px 30px 10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '13px',
                  color: '#6c757d'
                }}>개</span>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#495057',
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                부대비용 <span style={{ fontSize: '11px', color: '#6c757d' }}>(선택)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={inputs.additionalCost}
                  onChange={(e) => handleInputChange('additionalCost', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 30px 10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '13px',
                  color: '#6c757d'
                }}>원</span>
              </div>
            </div>
          </div>

          <button
            onClick={saveCalculation}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '20px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.background = '#2563eb'}
          >
            계산 결과 저장
          </button>
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
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H15V19H9V21ZM12 17C13.95 17 15.59 16.35 16.93 15.04C18.26 13.74 18.93 12.09 18.93 10.13C18.93 8.84 18.66 7.65 18.12 6.58C17.58 5.51 16.83 4.64 15.88 3.99L14.91 5.42C15.65 5.91 16.23 6.55 16.65 7.35C17.07 8.14 17.28 9.02 17.28 10C17.28 11.61 16.75 12.96 15.7 14.06C14.64 15.15 13.33 15.7 11.76 15.7C10.33 15.7 9.11 15.22 8.1 14.27C7.08 13.31 6.57 12.11 6.57 10.66C6.57 9.36 7 8.25 7.86 7.31C8.72 6.38 9.82 5.91 11.17 5.91C11.72 5.91 12.24 6 12.73 6.17C13.22 6.35 13.66 6.6 14.04 6.93L12.5 8.46L17.5 9L17 4L15.03 5.97C14.44 5.43 13.77 5 13 4.68C12.24 4.36 11.44 4.2 10.61 4.2C9.58 4.2 8.62 4.42 7.74 4.86C6.86 5.3 6.11 5.89 5.5 6.64C4.88 7.39 4.41 8.25 4.09 9.23C3.77 10.2 3.61 11.21 3.61 12.25C3.61 13.52 3.85 14.69 4.34 15.77C4.83 16.85 5.5 17.76 6.35 18.5C7.21 19.25 8.2 19.83 9.33 20.24C10.46 20.66 11.65 20.86 12.91 20.86V17.03L12 17Z" fill="#10b981"/>
            </svg>
            계산 결과
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: '#ffffff'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>순이익</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>
                {formatNumber(results.margin)}원
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              borderRadius: '12px',
              color: '#ffffff'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>마진율</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>
                {results.marginRate.toFixed(1)}%
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              borderRadius: '12px',
              color: '#ffffff'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>총 수익</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>
                {formatNumber(results.totalProfit)}원
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
              borderRadius: '12px',
              color: '#ffffff'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>ROI</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>
                {results.roi.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* 상세 분석 */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>상세 분석</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#6c757d' }}>총 원가</span>
                <span style={{ fontWeight: '500' }}>
                  {formatNumber((parseFloat(inputs.purchasePrice) || 0 + parseFloat(inputs.additionalCost) || 0) * parseFloat(inputs.quantity) || 1)}원
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#6c757d' }}>총 매출</span>
                <span style={{ fontWeight: '500' }}>
                  {formatNumber(parseFloat(inputs.sellingPrice) || 0 * parseFloat(inputs.quantity) || 1)}원
                </span>
              </div>
              <div style={{
                borderTop: '1px solid #dee2e6',
                paddingTop: '8px',
                marginTop: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px'
              }}>
                <span style={{ color: '#495057', fontWeight: '500' }}>개당 이익</span>
                <span style={{ fontWeight: '600', color: '#2563eb' }}>
                  {formatNumber((parseFloat(inputs.sellingPrice) || 0) - (parseFloat(inputs.purchasePrice) || 0) - (parseFloat(inputs.additionalCost) || 0))}원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 히스토리 */}
      <div style={{
        marginTop: '24px',
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>최근 계산 내역</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2563eb',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {showHistory ? '숨기기' : '보기'}
          </button>
        </div>

        {showHistory && savedCalculations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedCalculations.map(calc => (
              <div
                key={calc.id}
                onClick={() => loadCalculation(calc)}
                style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {formatNumber(calc.purchasePrice)}원 → {formatNumber(calc.sellingPrice)}원
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {calc.date} | 마진율 {calc.marginRate.toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>
                  +{formatNumber(calc.margin)}원
                </div>
              </div>
            ))}
          </div>
        )}

        {showHistory && savedCalculations.length === 0 && (
          <p style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center', padding: '20px 0' }}>
            저장된 계산 내역이 없습니다
          </p>
        )}
      </div>
    </div>
  );
}

export default MarginCalculator;