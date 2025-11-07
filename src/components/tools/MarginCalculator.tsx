'use client';

import { useState, useEffect } from 'react';

interface Category4Product {
  category_4: string;
  option_products: Array<{
    id: string | number;
    option_name: string;
    seller_supply_price: number;
  }>;
}

interface CalculationResult {
  id: string | number;
  option_name: string;
  supply_price: number;
  selling_price?: number;
  margin_amount?: number;
  margin_rate?: number;
  recommended_price?: number;
}

export default function MarginCalculator() {
  const [mode, setMode] = useState<'select' | 'manual'>('select');
  const [categories, setCategories] = useState<Category4Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 일괄 계산용 (품목 선택 모드)
  const [bulkSellingPrice, setBulkSellingPrice] = useState<string>('');
  const [bulkTargetMargin, setBulkTargetMargin] = useState<string>('');
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);

  // 개별 판매가 입력 (테이블용)
  const [individualPrices, setIndividualPrices] = useState<Record<string | number, string>>({});

  // 단건 계산용 (직접 입력 모드)
  const [supplyPrice, setSupplyPrice] = useState<string>('');
  const [singleSellingPrice, setSingleSellingPrice] = useState<string>('');
  const [singleTargetMargin, setSingleTargetMargin] = useState<string>('');
  const [singleMarginRate, setSingleMarginRate] = useState<number | null>(null);
  const [singleMarginAmount, setSingleMarginAmount] = useState<number | null>(null);
  const [singleRecommendedPrice, setSingleRecommendedPrice] = useState<number | null>(null);

  // 품목(카테고리4) 목록 불러오기
  useEffect(() => {
    if (mode === 'select') {
      fetchCategories();
    }
  }, [mode]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/all');
      const data = await response.json();

      if (data.success && data.products) {
        // category_4 기준으로 그룹화
        const categoryMap = new Map<string, any[]>();

        data.products.forEach((p: any) => {
          if (p.category_4 && p.seller_supply_price && p.seller_supply_price > 0) {
            if (!categoryMap.has(p.category_4)) {
              categoryMap.set(p.category_4, []);
            }
            categoryMap.get(p.category_4)!.push({
              id: p.id,
              option_name: p.option_name,
              seller_supply_price: p.seller_supply_price
            });
          }
        });

        // Map을 배열로 변환
        const categoryList = Array.from(categoryMap.entries()).map(([category_4, option_products]) => ({
          category_4,
          option_products
        })).sort((a, b) => a.category_4.localeCompare(b.category_4));

        setCategories(categoryList);
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 품목 선택 핸들러
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setBulkSellingPrice('');
    setBulkTargetMargin('');
    setCalculationResults([]);
    setIndividualPrices({});
  };

  // 개별 판매가 입력 핸들러
  const handleIndividualPriceChange = (productId: string | number, price: string) => {
    setIndividualPrices(prev => ({
      ...prev,
      [productId]: price
    }));
  };

  // 개별 입력 기반 계산
  const calculateIndividualMargins = () => {
    const category = categories.find(c => c.category_4 === selectedCategory);
    if (!category) return;

    const results: CalculationResult[] = category.option_products.map(product => {
      const priceInput = individualPrices[product.id];
      const selling = parseFloat(priceInput);
      const supply = product.seller_supply_price;

      if (!priceInput || isNaN(selling) || selling <= 0) {
        // 입력 안 된 경우
        return {
          id: product.id,
          option_name: product.option_name,
          supply_price: supply
        };
      }

      if (selling <= supply) {
        return {
          id: product.id,
          option_name: product.option_name,
          supply_price: supply,
          selling_price: selling,
          margin_amount: 0,
          margin_rate: 0
        };
      }

      const margin = selling - supply;
      const rate = (margin / selling) * 100;

      return {
        id: product.id,
        option_name: product.option_name,
        supply_price: supply,
        selling_price: selling,
        margin_amount: margin,
        margin_rate: rate
      };
    });

    setCalculationResults(results);
  };

  // 일괄 마진 계산 (판매가 입력)
  const calculateBulkMargin = () => {
    const selling = parseFloat(bulkSellingPrice);

    if (!selectedCategory) {
      alert('품목을 먼저 선택해주세요.');
      return;
    }

    if (isNaN(selling) || selling <= 0) {
      alert('판매가를 올바르게 입력해주세요.');
      return;
    }

    const category = categories.find(c => c.category_4 === selectedCategory);
    if (!category) return;

    const results: CalculationResult[] = category.option_products.map(product => {
      const supply = product.seller_supply_price;

      if (selling <= supply) {
        return {
          id: product.id,
          option_name: product.option_name,
          supply_price: supply,
          selling_price: selling,
          margin_amount: 0,
          margin_rate: 0
        };
      }

      const margin = selling - supply;
      const rate = (margin / selling) * 100;

      return {
        id: product.id,
        option_name: product.option_name,
        supply_price: supply,
        selling_price: selling,
        margin_amount: margin,
        margin_rate: rate
      };
    });

    setCalculationResults(results);
  };

  // 일괄 권장가 계산 (목표 마진율 입력)
  const calculateBulkRecommendedPrice = () => {
    const target = parseFloat(bulkTargetMargin);

    if (!selectedCategory) {
      alert('품목을 먼저 선택해주세요.');
      return;
    }

    if (isNaN(target) || target <= 0 || target >= 100) {
      alert('목표 마진율을 0~100 사이로 입력해주세요.');
      return;
    }

    const category = categories.find(c => c.category_4 === selectedCategory);
    if (!category) return;

    const results: CalculationResult[] = category.option_products.map(product => {
      const supply = product.seller_supply_price;
      const recommended = supply / (1 - target / 100);

      return {
        id: product.id,
        option_name: product.option_name,
        supply_price: supply,
        recommended_price: Math.ceil(recommended)
      };
    });

    setCalculationResults(results);
  };

  // 단건 마진율 계산 (직접 입력 모드)
  const calculateSingleMargin = () => {
    const supply = parseFloat(supplyPrice);
    const selling = parseFloat(singleSellingPrice);

    if (isNaN(supply) || isNaN(selling) || supply <= 0 || selling <= 0) {
      alert('공급가와 판매가를 올바르게 입력해주세요.');
      return;
    }

    if (selling <= supply) {
      alert('판매가는 공급가보다 커야 합니다.');
      return;
    }

    const margin = selling - supply;
    const rate = (margin / selling) * 100;

    setSingleMarginAmount(margin);
    setSingleMarginRate(rate);
    setSingleRecommendedPrice(null);
  };

  // 단건 권장 판매가 계산 (직접 입력 모드)
  const calculateSingleRecommendedPrice = () => {
    const supply = parseFloat(supplyPrice);
    const target = parseFloat(singleTargetMargin);

    if (isNaN(supply) || supply <= 0) {
      alert('공급가를 올바르게 입력해주세요.');
      return;
    }

    if (isNaN(target) || target <= 0 || target >= 100) {
      alert('목표 마진율을 0~100 사이로 입력해주세요.');
      return;
    }

    const recommended = supply / (1 - target / 100);

    setSingleRecommendedPrice(Math.ceil(recommended));
    setSingleMarginRate(null);
    setSingleMarginAmount(null);
  };

  // 초기화
  const handleReset = () => {
    setSelectedCategory('');
    setSupplyPrice('');
    setBulkSellingPrice('');
    setBulkTargetMargin('');
    setSingleSellingPrice('');
    setSingleTargetMargin('');
    setCalculationResults([]);
    setIndividualPrices({});
    setSingleMarginRate(null);
    setSingleMarginAmount(null);
    setSingleRecommendedPrice(null);
  };

  return (
    <div>
      {/* 모드 선택 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => {
              setMode('select');
              handleReset();
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: mode === 'select' ? '#2563eb' : '#f8f9fa',
              color: mode === 'select' ? '#ffffff' : '#495057',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            품목 일괄계산
          </button>
          <button
            onClick={() => {
              setMode('manual');
              handleReset();
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: mode === 'manual' ? '#2563eb' : '#f8f9fa',
              color: mode === 'manual' ? '#ffffff' : '#495057',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            직접 입력
          </button>
        </div>

        {/* 품목 선택 모드 - 일괄 계산 */}
        {mode === 'select' && (
          <div>
            {loading ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#6c757d'
              }}>
                불러오는 중...
              </div>
            ) : (
              <div>
                {/* 품목(카테고리4) 선택 */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#495057'
                  }}>
                    품목 선택
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="">품목을 선택하세요</option>
                    {categories.map(cat => (
                      <option key={cat.category_4} value={cat.category_4}>
                        {cat.category_4} ({cat.option_products.length}개 옵션)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 선택된 품목이 있을 때만 계산 UI 표시 */}
                {selectedCategory && (
                  <>
                    {/* 옵션 상품 목록 테이블 - 방법1: 개별 판매가 입력 */}
                    <div style={{
                      marginTop: '24px',
                      marginBottom: '24px',
                      background: '#ffffff',
                      borderRadius: '8px',
                      border: '2px solid #2563eb',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '16px',
                        background: '#2563eb',
                        color: '#ffffff',
                        borderBottom: '1px solid #1e40af',
                        fontWeight: '600',
                        fontSize: '15px'
                      }}>
                        방법 1: 개별 판매가 입력 후 마진 계산 ({categories.find(c => c.category_4 === selectedCategory)?.option_products.length}개)
                      </div>
                      <div style={{
                        maxHeight: '400px',
                        overflowY: 'auto'
                      }}>
                        <table style={{
                          width: '100%',
                          fontSize: '13px'
                        }}>
                          <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                                옵션명
                              </th>
                              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                                공급가
                              </th>
                              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                                판매가 입력
                              </th>
                              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                                마진액
                              </th>
                              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                                마진율
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories.find(c => c.category_4 === selectedCategory)?.option_products.map((product) => {
                              const priceInput = individualPrices[product.id];
                              const selling = parseFloat(priceInput);
                              const supply = product.seller_supply_price;

                              let marginAmount = null;
                              let marginRate = null;

                              if (priceInput && !isNaN(selling) && selling > 0) {
                                if (selling > supply) {
                                  marginAmount = selling - supply;
                                  marginRate = (marginAmount / selling) * 100;
                                } else {
                                  marginAmount = 0;
                                  marginRate = 0;
                                }
                              }

                              return (
                                <tr key={product.id}>
                                  <td style={{ padding: '10px', borderBottom: '1px solid #f1f1f1' }}>
                                    {product.option_name}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontWeight: '600' }}>
                                    {supply.toLocaleString()}원
                                  </td>
                                  <td style={{ padding: '10px', borderBottom: '1px solid #f1f1f1' }}>
                                    <input
                                      type="number"
                                      value={individualPrices[product.id] || ''}
                                      onChange={(e) => handleIndividualPriceChange(product.id, e.target.value)}
                                      placeholder="판매가"
                                      style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        textAlign: 'right',
                                        outline: 'none'
                                      }}
                                    />
                                  </td>
                                  <td style={{
                                    padding: '10px',
                                    textAlign: 'right',
                                    borderBottom: '1px solid #f1f1f1',
                                    color: marginAmount !== null ? '#2563eb' : '#6c757d',
                                    fontWeight: marginAmount !== null ? '600' : 'normal'
                                  }}>
                                    {marginAmount !== null ? `${marginAmount.toLocaleString()}원` : '-'}
                                  </td>
                                  <td style={{
                                    padding: '10px',
                                    textAlign: 'right',
                                    borderBottom: '1px solid #f1f1f1',
                                    color: marginRate !== null ? '#2563eb' : '#6c757d',
                                    fontWeight: marginRate !== null ? '700' : 'normal'
                                  }}>
                                    {marginRate !== null ? `${marginRate.toFixed(2)}%` : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 방법 2: 목표 마진율 입력 → 일괄 권장가 계산 */}
                    <div style={{
                      background: '#f0fdf4',
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <h5 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '12px',
                        color: '#495057'
                      }}>
                        방법 2: 목표 마진율로 일괄 권장가 계산
                      </h5>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '500',
                          marginBottom: '6px',
                          color: '#6c757d'
                        }}>
                          목표 마진율 (%)
                        </label>
                        <input
                          type="number"
                          value={bulkTargetMargin}
                          onChange={(e) => setBulkTargetMargin(e.target.value)}
                          placeholder="목표 마진율을 입력하세요"
                          min="0"
                          max="100"
                          step="0.1"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <button
                        onClick={calculateBulkRecommendedPrice}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        일괄 권장가 계산하기
                      </button>
                    </div>

                    {/* 계산 결과 테이블 */}
                    {calculationResults.length > 0 && (
                      <div style={{
                        marginTop: '24px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '2px solid #2563eb',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '16px',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '15px'
                        }}>
                          계산 결과 ({calculationResults.length}개)
                        </div>
                        <div style={{
                          maxHeight: '400px',
                          overflowY: 'auto'
                        }}>
                          <table style={{
                            width: '100%',
                            fontSize: '13px'
                          }}>
                            <thead>
                              <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                                  옵션명
                                </th>
                                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                                  공급가
                                </th>
                                {calculationResults[0].selling_price !== undefined && (
                                  <>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                                      판매가
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                                      마진액
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                                      마진율
                                    </th>
                                  </>
                                )}
                                {calculationResults[0].recommended_price !== undefined && (
                                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                                    권장 판매가
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {calculationResults.map((result) => (
                                <tr key={result.id}>
                                  <td style={{ padding: '10px', borderBottom: '1px solid #f1f1f1' }}>
                                    {result.option_name}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f1f1' }}>
                                    {result.supply_price.toLocaleString()}원
                                  </td>
                                  {result.selling_price !== undefined && (
                                    <>
                                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f1f1' }}>
                                        {result.selling_price.toLocaleString()}원
                                      </td>
                                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#2563eb', fontWeight: '600' }}>
                                        {result.margin_amount?.toLocaleString()}원
                                      </td>
                                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#2563eb', fontWeight: '600' }}>
                                        {result.margin_rate?.toFixed(2)}%
                                      </td>
                                    </>
                                  )}
                                  {result.recommended_price !== undefined && (
                                    <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#16a34a', fontWeight: '600' }}>
                                      {result.recommended_price.toLocaleString()}원
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 직접 입력 모드 */}
        {mode === 'manual' && (
          <div>
            {/* 공급가 입력 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#495057'
              }}>
                셀러 공급가 (원)
              </label>
              <input
                type="number"
                value={supplyPrice}
                onChange={(e) => setSupplyPrice(e.target.value)}
                placeholder="공급가를 입력하세요"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* 구분선 */}
            <div style={{
              borderTop: '2px dashed #dee2e6',
              margin: '24px 0',
              paddingTop: '24px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#495057'
              }}>
                계산 방식 선택
              </h4>
            </div>

            {/* 방법 1: 판매가 입력 → 마진율 계산 */}
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h5 style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#495057'
              }}>
                방법 1: 판매가로 마진율 계산
              </h5>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#6c757d'
                }}>
                  판매가 (원)
                </label>
                <input
                  type="number"
                  value={singleSellingPrice}
                  onChange={(e) => setSingleSellingPrice(e.target.value)}
                  placeholder="판매가를 입력하세요"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <button
                onClick={calculateSingleMargin}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                마진 계산하기
              </button>

              {/* 계산 결과 */}
              {singleMarginRate !== null && singleMarginAmount !== null && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '2px solid #2563eb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>마진액</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#2563eb' }}>
                      {singleMarginAmount.toLocaleString()}원
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>마진율</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                      {singleMarginRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 방법 2: 목표 마진율 입력 → 권장 판매가 계산 */}
            <div style={{
              background: '#f0fdf4',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h5 style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#495057'
              }}>
                방법 2: 목표 마진율로 권장 판매가 계산
              </h5>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  marginBottom: '6px',
                  color: '#6c757d'
                }}>
                  목표 마진율 (%)
                </label>
                <input
                  type="number"
                  value={singleTargetMargin}
                  onChange={(e) => setSingleTargetMargin(e.target.value)}
                  placeholder="목표 마진율을 입력하세요"
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <button
                onClick={calculateSingleRecommendedPrice}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                권장가 계산하기
              </button>

              {/* 계산 결과 */}
              {singleRecommendedPrice !== null && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '2px solid #16a34a'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>권장 판매가</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
                      {singleRecommendedPrice.toLocaleString()}원
                    </span>
                  </div>
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6c757d',
                    textAlign: 'right'
                  }}>
                    마진액: {(singleRecommendedPrice - parseFloat(supplyPrice)).toLocaleString()}원
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 초기화 버튼 */}
      <button
        onClick={handleReset}
        style={{
          width: '100%',
          padding: '10px',
          background: '#6c757d',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        초기화
      </button>
    </div>
  );
}
