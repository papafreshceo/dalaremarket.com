'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

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

interface MarketFee {
  market_name: string;
  fee_rate: number;
}

// SaveLoadUI 컴포넌트를 export
export function SaveLoadUI({
  saveName,
  setSaveName,
  savedConfigs,
  onSave,
  onLoad,
  onDelete
}: {
  saveName: string;
  setSaveName: (name: string) => void;
  savedConfigs: Array<{ name: string; timestamp: string }>;
  onSave: () => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
}) {
  const [showLoadMenu, setShowLoadMenu] = React.useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = React.useState(false);

  // 날짜 포맷 함수
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
      {/* 저장명 입력란 */}
      <input
        type="text"
        value={saveName}
        onChange={(e) => setSaveName(e.target.value)}
        placeholder="저장명"
        style={{
          width: '80px',
          padding: '4px 8px',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '12px',
          outline: 'none'
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') onSave();
        }}
      />

      {/* 저장 버튼 */}
      <button
        onClick={onSave}
        style={{
          padding: '4px 12px',
          background: 'transparent',
          color: '#3b82f6',
          border: '1px solid #3b82f6',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        저장
      </button>

      {/* 불러오기 버튼 */}
      <button
        onClick={() => {
          if (savedConfigs.length === 0) {
            alert('저장된 설정이 없습니다.');
            return;
          }
          setShowLoadMenu(!showLoadMenu);
          setShowDeleteMenu(false);
        }}
        disabled={savedConfigs.length === 0}
        style={{
          padding: '4px 12px',
          background: 'transparent',
          color: savedConfigs.length > 0 ? '#10b981' : '#9ca3af',
          border: `1px solid ${savedConfigs.length > 0 ? '#10b981' : '#d1d5db'}`,
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: savedConfigs.length > 0 ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
          opacity: savedConfigs.length > 0 ? 1 : 0.6
        }}
      >
        불러오기
      </button>

        {/* 불러오기 드롭다운 메뉴 */}
        {showLoadMenu && savedConfigs.length > 0 && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9998
              }}
              onClick={() => setShowLoadMenu(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                minWidth: '280px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 9999
              }}
            >
              {savedConfigs.map((config, index) => (
                <div
                  key={config.name}
                  onClick={() => {
                    onLoad(config.name);
                    setShowLoadMenu(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < savedConfigs.length - 1 ? '1px solid #f3f4f6' : 'none',
                    transition: 'background 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#111827',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {config.name}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatDate(config.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      {/* 삭제 버튼 */}
      <button
        onClick={() => {
          if (savedConfigs.length === 0) {
            alert('저장된 설정이 없습니다.');
            return;
          }
          setShowDeleteMenu(!showDeleteMenu);
          setShowLoadMenu(false);
        }}
        disabled={savedConfigs.length === 0}
        style={{
          padding: '4px 12px',
          background: 'transparent',
          color: savedConfigs.length > 0 ? '#ef4444' : '#9ca3af',
          border: `1px solid ${savedConfigs.length > 0 ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: savedConfigs.length > 0 ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
          opacity: savedConfigs.length > 0 ? 1 : 0.6
        }}
      >
        삭제
      </button>

      {/* 삭제 드롭다운 메뉴 */}
      {showDeleteMenu && savedConfigs.length > 0 && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998
            }}
            onClick={() => setShowDeleteMenu(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              minWidth: '280px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 9999
            }}
          >
            {savedConfigs.map((config, index) => (
              <div
                key={config.name}
                onClick={() => {
                  onDelete(config.name);
                  setShowDeleteMenu(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: index < savedConfigs.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#111827',
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {config.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  whiteSpace: 'nowrap'
                }}>
                  {formatDate(config.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MarginCalculator({ onOpenSimulator }: { onOpenSimulator?: () => void } = {}) {
  const [mode, setMode] = useState<'select' | 'manual'>('select');
  const [categories, setCategories] = useState<Category4Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 저장/불러오기 기능
  const [saveName, setSaveName] = useState<string>('');
  const [savedConfigs, setSavedConfigs] = useState<Array<{ name: string; timestamp: string }>>([]);

  // 일괄 계산용 (품목 선택 모드)
  const [bulkSellingPrice, setBulkSellingPrice] = useState<string>('');
  const [bulkTargetMargin, setBulkTargetMargin] = useState<string>('');
  const [bulkTargetMarginAmount, setBulkTargetMarginAmount] = useState<string>('');
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [marginAmountResults, setMarginAmountResults] = useState<CalculationResult[]>([]);

  // 개별 판매가 입력 (테이블용)
  const [individualPrices, setIndividualPrices] = useState<Record<string | number, string>>({});

  // 테이블 펼침/접힘 상태
  const [isSellingPriceOpen, setIsSellingPriceOpen] = useState(true);
  const [isMarginRateOpen, setIsMarginRateOpen] = useState(false);
  const [isMarginAmountOpen, setIsMarginAmountOpen] = useState(false);

  // 단건 계산용 (직접 입력 모드)
  const [supplyPrice, setSupplyPrice] = useState<string>('');
  const [singleSellingPrice, setSingleSellingPrice] = useState<string>('');
  const [singleTargetMargin, setSingleTargetMargin] = useState<string>('');
  const [singleTargetMarginAmount, setSingleTargetMarginAmount] = useState<string>('');
  const [singleMarginRate, setSingleMarginRate] = useState<number | null>(null);
  const [singleMarginAmount, setSingleMarginAmount] = useState<number | null>(null);
  const [singleRecommendedPrice, setSingleRecommendedPrice] = useState<number | null>(null);

  // 직접입력 모드 - 다중 행 관리 (각 테이블별로 독립적)
  interface ManualRow {
    id: string;
    productName: string;
    supplyPrice: string;
    sellingPrice: string;
    targetMargin: string;
    targetMarginAmount: string;
  }
  const [manualSellingRows, setManualSellingRows] = useState<ManualRow[]>([
    { id: '1', productName: '', supplyPrice: '', sellingPrice: '', targetMargin: '', targetMarginAmount: '' }
  ]);
  const [manualMarginRateRows, setManualMarginRateRows] = useState<ManualRow[]>([
    { id: '1', productName: '', supplyPrice: '', sellingPrice: '', targetMargin: '', targetMarginAmount: '' }
  ]);
  const [manualMarginAmountRows, setManualMarginAmountRows] = useState<ManualRow[]>([
    { id: '1', productName: '', supplyPrice: '', sellingPrice: '', targetMargin: '', targetMarginAmount: '' }
  ]);

  // 직접입력 테이블 펼침/접힘
  const [isManualSellingOpen, setIsManualSellingOpen] = useState(true);
  const [isManualMarginRateOpen, setIsManualMarginRateOpen] = useState(false);
  const [isManualMarginAmountOpen, setIsManualMarginAmountOpen] = useState(false);

  // 마켓별 수수료율
  const [marketFees, setMarketFees] = useState<MarketFee[]>([
    { market_name: '', fee_rate: 0 }
  ]);

  // 마켓별 색상 팔레트
  const marketColors = [
    { border: '#3b82f6', bg: '#dbeafe', text: '#1e40af' }, // 파랑
    { border: '#10b981', bg: '#d1fae5', text: '#065f46' }, // 초록
    { border: '#f59e0b', bg: '#fef3c7', text: '#92400e' }, // 주황
    { border: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6' }, // 보라
    { border: '#ec4899', bg: '#fce7f3', text: '#9f1239' }, // 핑크
    { border: '#14b8a6', bg: '#ccfbf1', text: '#134e4a' }, // 청록
  ];

  // localStorage에서 수수료율 불러오기
  useEffect(() => {
    const savedFees = localStorage.getItem('marginCalculator_marketFees');
    if (savedFees) {
      try {
        const parsed = JSON.parse(savedFees);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMarketFees(parsed);
        }
      } catch (error) {
        console.error('수수료율 불러오기 실패:', error);
      }
    }
  }, []);

  // 수수료율 변경 시 localStorage에 저장
  useEffect(() => {
    if (marketFees.length > 0) {
      localStorage.setItem('marginCalculator_marketFees', JSON.stringify(marketFees));
    }
  }, [marketFees]);

  // 품목(카테고리4) 목록 불러오기
  useEffect(() => {
    if (mode === 'select') {
      fetchCategories();
    }
  }, [mode]);

  // 마진율 자동 계산
  useEffect(() => {
    if (!selectedCategory || !bulkTargetMargin) return;

    const target = parseFloat(bulkTargetMargin);
    if (isNaN(target) || target <= 0 || target >= 100) return;

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
    setIsMarginRateOpen(true);
  }, [bulkTargetMargin, selectedCategory, categories]);

  // 마진액 자동 계산 (수수료 고려)
  useEffect(() => {
    if (!selectedCategory || !bulkTargetMarginAmount) return;

    const targetAmount = parseFloat(bulkTargetMarginAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) return;

    const category = categories.find(c => c.category_4 === selectedCategory);
    if (!category) return;

    // 평균 수수료율 계산
    const validMarkets = marketFees.filter(m => m.market_name && m.fee_rate > 0);
    const avgFeeRate = validMarkets.length > 0
      ? validMarkets.reduce((sum, m) => sum + m.fee_rate, 0) / validMarkets.length
      : 0;

    const results: CalculationResult[] = category.option_products.map(product => {
      const supply = product.seller_supply_price;

      // 수수료를 고려한 권장 판매가 계산
      // 최종 마진 = 판매가 - 공급가 - (판매가 × 수수료율)
      // 목표 마진 = 판매가 - 공급가 - (판매가 × 수수료율)
      // 목표 마진 = 판매가(1 - 수수료율) - 공급가
      // 판매가 = (공급가 + 목표 마진) / (1 - 수수료율)
      const recommended = avgFeeRate > 0
        ? (supply + targetAmount) / (1 - avgFeeRate / 100)
        : supply + targetAmount;

      return {
        id: product.id,
        option_name: product.option_name,
        supply_price: supply,
        recommended_price: Math.ceil(recommended)
      };
    });

    setMarginAmountResults(results);
    setIsMarginAmountOpen(true);
  }, [bulkTargetMarginAmount, selectedCategory, categories, marketFees]);


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
    setBulkTargetMarginAmount('');

    // 선택된 품목의 옵션상품을 마진율/마진액 테이블에 자동으로 채우기
    const selectedCat = categories.find(c => c.category_4 === category);
    if (selectedCat) {
      // 판매가 입력 방식 - 공급가를 기본값으로 설정
      const initialPrices: Record<string | number, string> = {};
      selectedCat.option_products.forEach(product => {
        initialPrices[product.id] = String(Math.floor(product.seller_supply_price));
      });
      setIndividualPrices(initialPrices);

      // 마진율 방식 - 초기 데이터 (권장가는 0으로)
      const initialResults: CalculationResult[] = selectedCat.option_products.map(product => ({
        id: product.id,
        option_name: product.option_name,
        supply_price: product.seller_supply_price,
        recommended_price: 0
      }));
      setCalculationResults(initialResults);
      setMarginAmountResults(initialResults);
    } else {
      setIndividualPrices({});
      setCalculationResults([]);
      setMarginAmountResults([]);
    }
  };

  // 개별 판매가 입력 핸들러
  const handleIndividualPriceChange = (productId: string | number, price: string) => {
    // 숫자만 추출 (콤마 제거)
    const numericValue = price.replace(/[^\d]/g, '');
    setIndividualPrices(prev => ({
      ...prev,
      [productId]: numericValue
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
    setIsMarginRateOpen(true);
  };

  // 일괄 권장가 계산 (목표 마진액 입력)
  const calculateBulkRecommendedPriceByAmount = () => {
    const targetAmount = parseFloat(bulkTargetMarginAmount);

    if (!selectedCategory) {
      alert('품목을 먼저 선택해주세요.');
      return;
    }

    if (isNaN(targetAmount) || targetAmount <= 0) {
      alert('목표 마진액을 올바르게 입력해주세요.');
      return;
    }

    const category = categories.find(c => c.category_4 === selectedCategory);
    if (!category) return;

    const results: CalculationResult[] = category.option_products.map(product => {
      const supply = product.seller_supply_price;
      const recommended = supply + targetAmount;

      return {
        id: product.id,
        option_name: product.option_name,
        supply_price: supply,
        recommended_price: Math.ceil(recommended)
      };
    });

    setMarginAmountResults(results);
    setIsMarginAmountOpen(true);
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

  // 초기화 (수수료율은 유지)
  const handleReset = () => {
    setSelectedCategory('');
    setSupplyPrice('');
    setBulkSellingPrice('');
    setBulkTargetMargin('');
    setBulkTargetMarginAmount('');
    setSingleSellingPrice('');
    setSingleTargetMargin('');
    setCalculationResults([]);
    setMarginAmountResults([]);
    setIndividualPrices({});
    setSingleMarginRate(null);
    setSingleMarginAmount(null);
    setSingleRecommendedPrice(null);
  };

  // 수수료율 초기화
  const handleResetMarketFees = () => {
    setMarketFees([{ market_name: '', fee_rate: 0 }]);
    localStorage.removeItem('marginCalculator_marketFees');
  };

  // 마켓 추가 (최대 3개)
  const addMarket = () => {
    if (marketFees.length < 3) {
      setMarketFees([...marketFees, { market_name: '', fee_rate: 0 }]);
    }
  };

  // 마켓 삭제
  const removeMarket = (index: number) => {
    if (marketFees.length > 1) {
      setMarketFees(marketFees.filter((_, i) => i !== index));
    }
  };

  // 직접입력 행 추가 - 판매가 테이블
  const addManualSellingRow = () => {
    const newId = String(Date.now());
    setManualSellingRows([...manualSellingRows, {
      id: newId,
      productName: '',
      supplyPrice: '',
      sellingPrice: '',
      targetMargin: '',
      targetMarginAmount: ''
    }]);
  };

  // 직접입력 행 삭제 - 판매가 테이블
  const removeLastManualSellingRow = () => {
    if (manualSellingRows.length > 1) {
      setManualSellingRows(manualSellingRows.slice(0, -1));
    }
  };

  // 직접입력 행 업데이트 - 판매가 테이블
  const updateManualSellingRow = (id: string, field: keyof ManualRow, value: string) => {
    setManualSellingRows(manualSellingRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // 직접입력 행 추가 - 마진율 테이블
  const addManualMarginRateRow = () => {
    const newId = String(Date.now());
    setManualMarginRateRows([...manualMarginRateRows, {
      id: newId,
      productName: '',
      supplyPrice: '',
      sellingPrice: '',
      targetMargin: '',
      targetMarginAmount: ''
    }]);
  };

  // 직접입력 행 삭제 - 마진율 테이블
  const removeLastManualMarginRateRow = () => {
    if (manualMarginRateRows.length > 1) {
      setManualMarginRateRows(manualMarginRateRows.slice(0, -1));
    }
  };

  // 직접입력 행 업데이트 - 마진율 테이블
  const updateManualMarginRateRow = (id: string, field: keyof ManualRow, value: string) => {
    setManualMarginRateRows(manualMarginRateRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // 직접입력 행 추가 - 마진액 테이블
  const addManualMarginAmountRow = () => {
    const newId = String(Date.now());
    setManualMarginAmountRows([...manualMarginAmountRows, {
      id: newId,
      productName: '',
      supplyPrice: '',
      sellingPrice: '',
      targetMargin: '',
      targetMarginAmount: ''
    }]);
  };

  // 직접입력 행 삭제 - 마진액 테이블
  const removeLastManualMarginAmountRow = () => {
    if (manualMarginAmountRows.length > 1) {
      setManualMarginAmountRows(manualMarginAmountRows.slice(0, -1));
    }
  };

  // 직접입력 행 업데이트 - 마진액 테이블
  const updateManualMarginAmountRow = (id: string, field: keyof ManualRow, value: string) => {
    setManualMarginAmountRows(manualMarginAmountRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // 마켓명 변경
  const updateMarketName = (index: number, name: string) => {
    const updated = [...marketFees];
    updated[index].market_name = name;
    setMarketFees(updated);
  };

  // 수수료율 변경
  const updateFeeRate = (index: number, rate: string) => {
    const updated = [...marketFees];
    updated[index].fee_rate = parseFloat(rate) || 0;
    setMarketFees(updated);
  };

  // 수수료 적용 후 최종 마진 계산
  const calculateFinalMargin = (sellingPrice: number, supplyPrice: number) => {
    let totalFee = 0;
    marketFees.forEach(market => {
      if (market.market_name && market.fee_rate > 0) {
        totalFee += (sellingPrice * market.fee_rate) / 100;
      }
    });
    const finalMargin = sellingPrice - supplyPrice - totalFee;
    const finalMarginRate = (finalMargin / sellingPrice) * 100;
    return { finalMargin, finalMarginRate, totalFee };
  };

  // 저장된 설정 목록 불러오기
  useEffect(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('marginCalc_'));
    const configs = keys.map(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          return {
            name: key.replace('marginCalc_', ''),
            timestamp: parsed.timestamp || new Date().toISOString()
          };
        } catch {
          return {
            name: key.replace('marginCalc_', ''),
            timestamp: new Date().toISOString()
          };
        }
      }
      return null;
    }).filter(Boolean) as Array<{ name: string; timestamp: string }>;

    // 최신순으로 정렬
    configs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setSavedConfigs(configs);
  }, []);

  // 현재 설정 저장
  const handleSave = () => {
    if (!saveName.trim()) {
      alert('저장명을 입력해주세요.');
      return;
    }

    const timestamp = new Date().toISOString();
    const config = {
      mode,
      selectedCategory,
      marketFees,
      individualPrices,
      bulkTargetMargin,
      bulkTargetMarginAmount,
      calculationResults,
      manualSellingRows,
      timestamp
    };

    localStorage.setItem(`marginCalculator_${saveName}`, JSON.stringify(config));

    // 기존 설정 제거 후 새로 추가하고 최신순 정렬
    const newConfigs = [
      { name: saveName, timestamp },
      ...savedConfigs.filter(c => c.name !== saveName)
    ];
    setSavedConfigs(newConfigs);

    // savedConfigs를 localStorage에도 저장
    localStorage.setItem('marginCalculator_savedConfigs', JSON.stringify(newConfigs));

    setSaveName('');
    alert('저장되었습니다.');
  };

  // 저장된 설정 불러오기
  const handleLoad = (name: string) => {
    const saved = localStorage.getItem(`marginCalculator_${name}`);
    if (!saved) return;

    const config = JSON.parse(saved);
    setMode(config.mode);
    setSelectedCategory(config.selectedCategory);
    setMarketFees(config.marketFees || marketFees);
    setIndividualPrices(config.individualPrices || {});
    setBulkTargetMargin(config.bulkTargetMargin || '');
    setBulkTargetMarginAmount(config.bulkTargetMarginAmount || '');
    setCalculationResults(config.calculationResults || []);
    setManualSellingRows(config.manualSellingRows || [{ id: '1', productName: '', supplyPrice: '', sellingPrice: '', targetMargin: '', targetMarginAmount: '' }]);
    alert(`"${name}" 설정을 불러왔습니다.`);
  };

  // 저장된 설정 삭제
  const handleDelete = (name: string) => {
    if (!confirm(`"${name}"을(를) 삭제하시겠습니까?`)) return;

    localStorage.removeItem(`marginCalculator_${name}`);
    const newConfigs = savedConfigs.filter(c => c.name !== name);
    setSavedConfigs(newConfigs);

    // localStorage에서도 삭제
    localStorage.setItem('marginCalculator_savedConfigs', JSON.stringify(newConfigs));
  };


  return (
    <div style={{ padding: '0 24px' }}>
      {/* 마켓별 수수료율 입력 - 최상단 배치 */}
      <div style={{
        border: '1px solid #dee2e6',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={addMarket}
              disabled={marketFees.length >= 3}
              style={{
                padding: '4px 10px',
                background: marketFees.length >= 3 ? '#9ca3af' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: marketFees.length >= 3 ? 'not-allowed' : 'pointer',
                opacity: marketFees.length >= 3 ? 0.6 : 1,
                whiteSpace: 'nowrap'
              }}
            >
              + 마켓 추가
            </button>

            {/* 마켓들을 같은 줄에 배치 */}
            {marketFees.map((market, index) => {
              const color = marketColors[index % marketColors.length];
              return (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <input
                  type="text"
                  value={market.market_name}
                  onChange={(e) => updateMarketName(index, e.target.value)}
                  placeholder="마켓명"
                  style={{
                    width: '100px',
                    padding: '3px 8px',
                    border: `1px solid ${color.border}`,
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <input
                  type="number"
                  value={market.fee_rate || ''}
                  onChange={(e) => updateFeeRate(index, e.target.value)}
                  placeholder="율"
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    width: '60px',
                    padding: '3px 8px',
                    border: `1px solid ${color.border}`,
                    borderRadius: '4px',
                    fontSize: '13px',
                    textAlign: 'right',
                    outline: 'none'
                  }}
                />
                <span style={{
                  fontSize: '13px',
                  color: color.text,
                  fontWeight: '500'
                }}>
                  %
                </span>
                {marketFees.length > 1 && (
                  <button
                    onClick={() => removeMarket(index)}
                    style={{
                      padding: '2px 6px',
                      background: '#f87171',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      lineHeight: 1
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <SaveLoadUI
              saveName={saveName}
              setSaveName={setSaveName}
              savedConfigs={savedConfigs}
              onSave={handleSave}
              onLoad={handleLoad}
              onDelete={handleDelete}
            />

            <button
              onClick={handleResetMarketFees}
              style={{
                padding: '4px 12px',
                background: 'transparent',
                color: '#6c757d',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 품목 선택 모드 */}
      {mode === 'select' && (
        <div style={{ marginBottom: '24px' }}>
          {loading ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              불러오는 중...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: '24px',
              alignItems: 'start'
            }}>
              {/* 칼럼 1: 모드 스위치 + 품목 선택 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 모드 선택 - 스위치 형태 */}
                <div style={{
                  display: 'flex',
                  width: '100%',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '4px',
                  gap: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  <button
                    onClick={() => {
                      setMode('select');
                      handleReset();
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: mode === 'select' ? '#2563eb' : 'transparent',
                      color: mode === 'select' ? '#ffffff' : '#6c757d',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    품목 선택
                  </button>
                  <button
                    onClick={() => {
                      setMode('manual');
                      handleReset();
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: mode === 'manual' ? '#2563eb' : 'transparent',
                      color: mode === 'manual' ? '#ffffff' : '#6c757d',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    직접 입력
                  </button>
                </div>

                {/* 품목(카테고리4) 선택 */}
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '13px',
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

                {/* 구분선 */}
                <div style={{
                  height: '1px',
                  background: '#dee2e6',
                  margin: '16px 0'
                }} />

                {/* 시뮬레이션 버튼 */}
                <button
                  onClick={() => onOpenSimulator?.()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  시뮬레이션
                </button>

              </div>

              {/* 칼럼 2: 선택된 품목이 있을 때만 계산 UI 표시 */}
              <div>
                  {selectedCategory && (
                    <>
                      {/* 옵션 상품 목록 테이블 - 방법1: 개별 판매가 입력 */}
                      <div style={{
                        marginBottom: '24px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '2px solid #2563eb',
                        overflow: 'hidden'
                      }}>
                      <div
                        onClick={() => setIsSellingPriceOpen(!isSellingPriceOpen)}
                        style={{
                          padding: '6px 16px 6px 16px',
                          background: '#2563eb',
                          color: '#ffffff',
                          borderBottom: isSellingPriceOpen ? '1px solid #1e40af' : 'none',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minHeight: '32px'
                        }}>
                        <span style={{
                          fontSize: '16px',
                          transform: isSellingPriceOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          display: 'inline-block'
                        }}>
                          ›
                        </span>
                        <span style={{ flex: 1 }}>
                          판매가 입력 방식 ({categories.find(c => c.category_4 === selectedCategory)?.option_products.length}개)
                        </span>
                      </div>
                      {isSellingPriceOpen && (
                      <div style={{
                        maxHeight: '400px',
                        overflowY: 'auto'
                      }}>
                        <table style={{
                          width: '100%',
                          fontSize: '13px',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          <thead>
                            {/* 1행 헤더: 마켓명 */}
                            <tr style={{ background: '#f8f9fa' }}>
                              <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '150px', minWidth: '150px', maxWidth: '150px', fontSize: '13px' }}>
                                옵션상품
                              </th>
                              <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                                공급가
                              </th>
                              <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                                판매가
                              </th>
                              {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                const color = marketColors[originalIndex % marketColors.length];
                                return (
                                <th key={idx} colSpan={3} style={{ padding: '6px', textAlign: 'center', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, fontSize: '12px' }}>
                                  <span style={{ background: color.bg, padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{market.market_name}</span>
                                </th>
                                );
                              })}
                            </tr>
                            {/* 2행 헤더: 수수료, 마진액, 마진율 */}
                            <tr style={{ background: '#f8f9fa' }}>
                              {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                const color = marketColors[originalIndex % marketColors.length];
                                return (
                                <React.Fragment key={`header-${idx}`}>
                                  <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057', fontWeight: '600' }}>
                                    수수료
                                  </th>
                                  <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                                    마진액
                                  </th>
                                  <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                                    마진율
                                  </th>
                                </React.Fragment>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {categories.find(c => c.category_4 === selectedCategory)?.option_products.map((product) => {
                              const priceInput = individualPrices[product.id];
                              const selling = parseFloat(priceInput);
                              const supply = product.seller_supply_price;

                              return (
                                <tr key={product.id}>
                                  <td style={{ padding: '4px 8px', textAlign: 'center', borderBottom: '1px solid #f1f1f1' }}>
                                    {product.option_name}
                                  </td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1' }}>
                                    {Math.floor(supply).toLocaleString()}
                                  </td>
                                  <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f1f1' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <input
                                        type="text"
                                        value={individualPrices[product.id] ? Number(individualPrices[product.id]).toLocaleString() : ''}
                                        onChange={(e) => handleIndividualPriceChange(product.id, e.target.value)}
                                        placeholder="판매가"
                                        style={{
                                          flex: 1,
                                          padding: '3px 8px',
                                          border: '1px solid #dee2e6',
                                          borderRadius: '4px',
                                          fontSize: '13px',
                                          textAlign: 'right',
                                          outline: 'none'
                                        }}
                                      />
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button
                                          onClick={() => {
                                            const current = parseFloat(individualPrices[product.id]) || 0;
                                            handleIndividualPriceChange(product.id, String(current + 100));
                                          }}
                                          style={{
                                            width: '16px',
                                            height: '11px',
                                            padding: 0,
                                            border: '1px solid #dee2e6',
                                            borderRadius: '2px',
                                            background: '#f8f9fa',
                                            cursor: 'pointer',
                                            fontSize: '8px',
                                            lineHeight: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          ▲
                                        </button>
                                        <button
                                          onClick={() => {
                                            const current = parseFloat(individualPrices[product.id]) || 0;
                                            const newValue = Math.max(0, current - 100);
                                            handleIndividualPriceChange(product.id, String(newValue));
                                          }}
                                          style={{
                                            width: '16px',
                                            height: '11px',
                                            padding: 0,
                                            border: '1px solid #dee2e6',
                                            borderRadius: '2px',
                                            background: '#f8f9fa',
                                            cursor: 'pointer',
                                            fontSize: '8px',
                                            lineHeight: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          ▼
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  {/* 각 마켓별 수수료, 마진액, 마진율 */}
                                  {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                    const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                    const color = marketColors[originalIndex % marketColors.length];

                                    if (!priceInput || isNaN(selling) || selling <= 0 || selling <= supply) {
                                      return (
                                        <React.Fragment key={`${product.id}-${idx}`}>
                                          <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', color: '#6c757d', fontSize: '12px' }}>-</td>
                                          <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                          <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                        </React.Fragment>
                                      );
                                    }

                                    const fee = (selling * market.fee_rate) / 100;
                                    const margin = selling - supply - fee;
                                    const marginRate = (margin / selling) * 100;

                                    return (
                                      <React.Fragment key={`${product.id}-${idx}`}>
                                        <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', fontSize: '12px' }}>
                                          {Math.floor(fee).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                          {Math.floor(margin).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                          {marginRate.toFixed(1)}%
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>

                      {/* 마진율 입력 방식 테이블 - 항상 표시 */}
                      <div style={{
                        marginTop: '24px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '2px solid #16a34a',
                        overflow: 'hidden'
                      }}>
                        {/* 타이틀 영역에 입력란과 버튼 포함 */}
                        <div
                          onClick={() => setIsMarginRateOpen(!isMarginRateOpen)}
                          style={{
                            padding: '6px 16px',
                            background: '#16a34a',
                            color: '#ffffff',
                            borderBottom: isMarginRateOpen ? '1px solid #15803d' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            minHeight: '32px'
                          }}>
                          <span style={{
                            fontSize: '16px',
                            transform: isMarginRateOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            display: 'inline-block'
                          }}>
                            ›
                          </span>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}>
                            마진율 입력 방식 {selectedCategory && `(${categories.find(c => c.category_4 === selectedCategory)?.option_products.length}개)`}
                          </span>
                          <input
                            type="number"
                            value={bulkTargetMargin}
                            onChange={(e) => setBulkTargetMargin(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="목표 마진율"
                            min="0"
                            max="100"
                            step="0.1"
                            style={{
                              width: '80px',
                              padding: '2px 6px',
                              border: '1px solid #ffffff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              outline: 'none',
                              textAlign: 'right'
                            }}
                          />
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            %
                          </span>
                        </div>
                          {isMarginRateOpen && (
                          <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto'
                          }}>
                            <table style={{
                              width: '100%',
                              fontSize: '13px',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              <thead>
                                {/* 1행 헤더: 마켓명 */}
                                <tr style={{ background: '#f8f9fa' }}>
                                  <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '150px', minWidth: '150px', maxWidth: '150px', fontSize: '13px' }}>
                                    옵션상품
                                  </th>
                                  <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                                    공급가
                                  </th>
                                  <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                                    마진율
                                  </th>
                                  {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                    const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                    const color = marketColors[originalIndex % marketColors.length];
                                    return (
                                    <th key={idx} colSpan={3} style={{ padding: '6px', textAlign: 'center', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, fontSize: '12px' }}>
                                      <span style={{ background: color.bg, padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{market.market_name}</span>
                                    </th>
                                    );
                                  })}
                                </tr>
                                {/* 2행 헤더: 권장 판매가, 수수료, 마진액 */}
                                <tr style={{ background: '#f8f9fa' }}>
                                  {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                    const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                    const color = marketColors[originalIndex % marketColors.length];
                                    return (
                                    <React.Fragment key={`result-header-${idx}`}>
                                      <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #16a34a', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057', fontWeight: '600' }}>
                                        판매가
                                      </th>
                                      <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                                        수수료
                                      </th>
                                      <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                                        마진액
                                      </th>
                                    </React.Fragment>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {calculationResults.length > 0 ? (
                                  calculationResults.map((result) => {
                                    const supply = result.supply_price;
                                    const targetMarginRate = parseFloat(bulkTargetMargin) || 0;

                                    return (
                                      <tr key={result.id}>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #f1f1f1' }}>
                                          {result.option_name}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1' }}>
                                          {Math.floor(supply).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: targetMarginRate > 0 ? '#16a34a' : '#9ca3af' }}>
                                          {targetMarginRate > 0 ? `${targetMarginRate.toFixed(1)}%` : '-'}
                                        </td>
                                        {/* 각 마켓별 권장 판매가, 수수료, 마진액 */}
                                        {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                          const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                          const color = marketColors[originalIndex % marketColors.length];

                                          if (targetMarginRate <= 0 || targetMarginRate >= 100) {
                                            return (
                                              <React.Fragment key={`${result.id}-${idx}`}>
                                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', color: '#6c757d', fontSize: '12px' }}>-</td>
                                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                              </React.Fragment>
                                            );
                                          }

                                          // 마진율 고정, 역산하여 권장 판매가 계산
                                          // 마진율 = 마진액 / 판매가 = (판매가 - 공급가 - 수수료) / 판매가
                                          // 마진율 = (판매가 - 공급가 - 판매가×수수료율) / 판매가
                                          // 마진율 = 1 - 공급가/판매가 - 수수료율
                                          // 공급가/판매가 = 1 - 마진율 - 수수료율
                                          // 판매가 = 공급가 / (1 - 마진율 - 수수료율)
                                          const recommendedPrice = supply / (1 - targetMarginRate / 100 - market.fee_rate / 100);
                                          const fee = (recommendedPrice * market.fee_rate) / 100;
                                          const margin = recommendedPrice - supply - fee;

                                          return (
                                            <React.Fragment key={`${result.id}-${idx}`}>
                                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #16a34a', fontSize: '12px', fontWeight: '500' }}>
                                                <span style={{ background: color.bg, padding: '2px 6px', borderRadius: '4px' }}>
                                                  {Math.floor(recommendedPrice).toLocaleString()}
                                                </span>
                                              </td>
                                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                                {Math.floor(fee).toLocaleString()}
                                              </td>
                                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                                {Math.floor(margin).toLocaleString()}
                                              </td>
                                            </React.Fragment>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={100} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                                      {selectedCategory ? '목표 마진율을 입력하고 계산하기 버튼을 눌러주세요' : '품목을 선택해주세요'}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          )}
                        </div>

                      {/* 마진액 입력 방식 테이블 - 항상 표시 */}
                      <div style={{
                        marginTop: '24px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '2px solid #f59e0b',
                        overflow: 'hidden'
                      }}>
                        {/* 타이틀 영역에 입력란과 버튼 포함 */}
                        <div
                          onClick={() => setIsMarginAmountOpen(!isMarginAmountOpen)}
                          style={{
                            padding: '6px 16px',
                            background: '#f59e0b',
                            color: '#ffffff',
                            borderBottom: isMarginAmountOpen ? '1px solid #d97706' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            minHeight: '32px'
                          }}>
                          <span style={{
                            fontSize: '16px',
                            transform: isMarginAmountOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            display: 'inline-block'
                          }}>
                            ›
                          </span>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}>
                            마진액 입력 방식 {selectedCategory && `(${categories.find(c => c.category_4 === selectedCategory)?.option_products.length}개)`}
                          </span>
                          <input
                            type="text"
                            value={bulkTargetMarginAmount ? Number(bulkTargetMarginAmount).toLocaleString() : ''}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/[^\d]/g, '');
                              setBulkTargetMarginAmount(numericValue);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="마진액"
                            style={{
                              width: '80px',
                              padding: '2px 6px',
                              border: '1px solid #ffffff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              outline: 'none',
                              textAlign: 'right'
                            }}
                          />
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            원
                          </span>
                        </div>
                          {isMarginAmountOpen && (
                          <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto'
                          }}>
                            <table style={{
                              width: '100%',
                              fontSize: '13px',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              <thead>
                                {/* 1행 헤더: 마켓명 */}
                                <tr style={{ background: '#f8f9fa' }}>
                                  <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '150px', minWidth: '150px', maxWidth: '150px', fontSize: '13px' }}>
                                    옵션상품
                                  </th>
                                  <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                                    공급가
                                  </th>
                                  <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                                    마진액
                                  </th>
                                  {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                    const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                    const color = marketColors[originalIndex % marketColors.length];
                                    return (
                                    <th key={idx} colSpan={3} style={{ padding: '6px', textAlign: 'center', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, fontSize: '12px' }}>
                                      <span style={{ background: color.bg, padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{market.market_name}</span>
                                    </th>
                                    );
                                  })}
                                </tr>
                                {/* 2행 헤더: 권장 판매가, 수수료, 마진율 */}
                                <tr style={{ background: '#f8f9fa' }}>
                                  {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                    const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                    const color = marketColors[originalIndex % marketColors.length];
                                    return (
                                    <React.Fragment key={`amount-header-${idx}`}>
                                      <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #f59e0b', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057', fontWeight: '600' }}>
                                        판매가
                                      </th>
                                      <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                                        수수료
                                      </th>
                                      <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                                        마진율
                                      </th>
                                    </React.Fragment>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {marginAmountResults.length > 0 ? (
                                  marginAmountResults.map((result) => {
                                    const supply = result.supply_price;
                                    const targetMargin = parseFloat(bulkTargetMarginAmount) || 0;

                                    return (
                                      <tr key={result.id}>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #f1f1f1' }}>
                                          {result.option_name}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1' }}>
                                          {Math.floor(supply).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: targetMargin > 0 ? '#f59e0b' : '#9ca3af' }}>
                                          {targetMargin > 0 ? Math.floor(targetMargin).toLocaleString() : '-'}
                                        </td>
                                        {/* 각 마켓별 권장 판매가, 수수료, 마진율 */}
                                        {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                                          const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                                          const color = marketColors[originalIndex % marketColors.length];

                                          if (targetMargin <= 0) {
                                            return (
                                              <React.Fragment key={`${result.id}-${idx}`}>
                                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', color: '#6c757d', fontSize: '12px' }}>-</td>
                                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                              </React.Fragment>
                                            );
                                          }

                                          // 마진액 고정, 역산하여 권장 판매가 계산
                                          // 마진액 = 판매가 - 공급가 - (판매가 × 수수료율)
                                          // 마진액 = 판매가(1 - 수수료율) - 공급가
                                          // 판매가 = (공급가 + 마진액) / (1 - 수수료율)
                                          const recommendedPrice = (supply + targetMargin) / (1 - market.fee_rate / 100);
                                          const fee = (recommendedPrice * market.fee_rate) / 100;
                                          const marginRate = (targetMargin / recommendedPrice) * 100;

                                          return (
                                            <React.Fragment key={`${result.id}-${idx}`}>
                                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #f59e0b', fontSize: '12px', fontWeight: '500' }}>
                                                <span style={{ background: color.bg, padding: '2px 6px', borderRadius: '4px' }}>
                                                  {Math.floor(recommendedPrice).toLocaleString()}
                                                </span>
                                              </td>
                                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                                {Math.floor(fee).toLocaleString()}
                                              </td>
                                              <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                                {marginRate.toFixed(1)}%
                                              </td>
                                            </React.Fragment>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={100} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                                      {selectedCategory ? '목표 마진액을 입력하고 계산하기 버튼을 눌러주세요' : '품목을 선택해주세요'}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          )}
                        </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      {/* 직접 입력 모드 */}
      {mode === 'manual' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr',
            gap: '24px',
            alignItems: 'start'
          }}>
            {/* 칼럼 1: 모드 스위치 + 시뮬레이션 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 모드 선택 - 스위치 형태 */}
              <div style={{
                display: 'flex',
                width: '100%',
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '4px',
                gap: '4px',
                border: '1px solid #dee2e6'
              }}>
                <button
                  onClick={() => {
                    setMode('select');
                    handleReset();
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: mode === 'select' ? '#2563eb' : 'transparent',
                    color: mode === 'select' ? '#ffffff' : '#6c757d',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  품목 선택
                </button>
                <button
                  onClick={() => {
                    setMode('manual');
                    handleReset();
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: mode === 'manual' ? '#2563eb' : 'transparent',
                    color: mode === 'manual' ? '#ffffff' : '#6c757d',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  직접 입력
                </button>
              </div>

              {/* 구분선 */}
              <div style={{
                height: '1px',
                background: '#dee2e6',
                margin: '4px 0'
              }} />

              {/* 시뮬레이션 버튼 */}
              <button
                onClick={() => onOpenSimulator?.()}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'transparent',
                  color: '#10b981',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                시뮬레이션
              </button>
            </div>

            {/* 칼럼 2: 3개 테이블 */}
            <div>
              {/* 테이블 1: 판매가 입력 방식 */}
              <div style={{
                marginBottom: '24px',
                background: '#ffffff',
                borderRadius: '8px',
                border: '2px solid #2563eb',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    padding: '6px 16px',
                    background: '#2563eb',
                    color: '#ffffff',
                    borderBottom: isManualSellingOpen ? '1px solid #1e40af' : 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    minHeight: '32px'
                  }}>
                  <div
                    onClick={() => setIsManualSellingOpen(!isManualSellingOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    <span style={{
                      fontSize: '16px',
                      transform: isManualSellingOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block'
                    }}>
                      ›
                    </span>
                    판매가 입력 방식 ({manualSellingRows.length}개)
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLastManualSellingRow();
                      }}
                      disabled={manualSellingRows.length <= 1}
                      style={{
                        padding: '4px 12px',
                        background: manualSellingRows.length <= 1 ? '#94a3b8' : '#ffffff',
                        color: manualSellingRows.length <= 1 ? '#ffffff' : '#2563eb',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: manualSellingRows.length <= 1 ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        opacity: manualSellingRows.length <= 1 ? 0.6 : 1
                      }}
                    >
                      - 행제거
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addManualSellingRow();
                        setIsManualSellingOpen(true);
                      }}
                      style={{
                        padding: '4px 12px',
                        background: '#ffffff',
                        color: '#2563eb',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + 행추가
                    </button>
                  </div>
                </div>
                {isManualSellingOpen && (
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    <table style={{
                      width: '100%',
                      fontSize: '13px',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                    <thead>
                      {/* 1행 헤더: 마켓명 */}
                      <tr style={{ background: '#f8f9fa' }}>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '150px', minWidth: '150px', maxWidth: '150px', fontSize: '13px' }}>
                          옵션상품
                        </th>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                          공급가
                        </th>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                          판매가
                        </th>
                        {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                          const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                          const color = marketColors[originalIndex % marketColors.length];
                          return (
                          <th key={idx} colSpan={3} style={{ padding: '6px', textAlign: 'center', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, fontSize: '12px' }}>
                            <span style={{ background: color.bg, padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{market.market_name}</span>
                          </th>
                          );
                        })}
                      </tr>
                      {/* 2행 헤더: 수수료, 마진액, 마진율 */}
                      <tr style={{ background: '#f8f9fa' }}>
                        {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                          const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                          const color = marketColors[originalIndex % marketColors.length];
                          return (
                          <React.Fragment key={`header-manual-${idx}`}>
                            <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057', fontWeight: '600' }}>
                              수수료
                            </th>
                            <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                              마진액
                            </th>
                            <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                              마진율
                            </th>
                          </React.Fragment>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {manualSellingRows.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: '4px 8px', textAlign: 'center', borderBottom: '1px solid #f1f1f1' }}>
                            <input
                              type="text"
                              value={row.productName}
                              onChange={(e) => updateManualSellingRow(row.id, 'productName', e.target.value)}
                              placeholder="상품명"
                              style={{
                                width: '100%',
                                padding: '3px 8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f1f1' }}>
                            <input
                              type="text"
                              value={row.supplyPrice ? Number(row.supplyPrice).toLocaleString() : ''}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^\d]/g, '');
                                updateManualSellingRow(row.id, 'supplyPrice', numericValue);
                              }}
                              placeholder="공급가"
                              style={{
                                width: '100%',
                                padding: '3px 8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'right',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f1f1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="text"
                                value={row.sellingPrice ? Number(row.sellingPrice).toLocaleString() : ''}
                                onChange={(e) => {
                                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                                  updateManualSellingRow(row.id, 'sellingPrice', numericValue);
                                }}
                                placeholder="판매가"
                                style={{
                                  flex: 1,
                                  padding: '3px 8px',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  textAlign: 'right',
                                  outline: 'none'
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <button
                                  onClick={() => {
                                    const current = parseFloat(row.sellingPrice) || 0;
                                    updateManualSellingRow(row.id, 'sellingPrice', String(current + 100));
                                  }}
                                  style={{
                                    width: '16px',
                                    height: '11px',
                                    padding: 0,
                                    border: '1px solid #dee2e6',
                                    borderRadius: '2px',
                                    background: '#f8f9fa',
                                    cursor: 'pointer',
                                    fontSize: '8px',
                                    lineHeight: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  ▲
                                </button>
                                <button
                                  onClick={() => {
                                    const current = parseFloat(row.sellingPrice) || 0;
                                    const newValue = Math.max(0, current - 100);
                                    updateManualSellingRow(row.id, 'sellingPrice', String(newValue));
                                  }}
                                  style={{
                                    width: '16px',
                                    height: '11px',
                                    padding: 0,
                                    border: '1px solid #dee2e6',
                                    borderRadius: '2px',
                                    background: '#f8f9fa',
                                    cursor: 'pointer',
                                    fontSize: '8px',
                                    lineHeight: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          </td>
                          {/* 각 마켓별 수수료, 마진액, 마진율 */}
                          {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                            const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                            const color = marketColors[originalIndex % marketColors.length];
                            const selling = parseFloat(row.sellingPrice);
                            const supply = parseFloat(row.supplyPrice);

                            if (!row.sellingPrice || isNaN(selling) || selling <= 0 || !row.supplyPrice || isNaN(supply) || selling <= supply) {
                              return (
                                <React.Fragment key={`manual-${row.id}-${idx}`}>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', color: '#6c757d', fontSize: '12px' }}>-</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                </React.Fragment>
                              );
                            }

                            const fee = (selling * market.fee_rate) / 100;
                            const margin = selling - supply - fee;
                            const marginRate = (margin / selling) * 100;

                            return (
                              <React.Fragment key={`manual-${row.id}-${idx}`}>
                                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', fontSize: '12px' }}>
                                  {Math.floor(fee).toLocaleString()}
                                </td>
                                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                  {Math.floor(margin).toLocaleString()}
                                </td>
                                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                  {marginRate.toFixed(1)}%
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 테이블 2: 마진율 입력 방식 */}
            <div style={{
            marginBottom: '24px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '2px solid #16a34a',
            overflow: 'hidden'
          }}>
            <div
              style={{
                padding: '6px 16px',
                background: '#16a34a',
                color: '#ffffff',
                borderBottom: isManualMarginRateOpen ? '1px solid #15803d' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                minHeight: '32px'
              }}>
              <div
                onClick={() => setIsManualMarginRateOpen(!isManualMarginRateOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                <span style={{
                  fontSize: '16px',
                  transform: isManualMarginRateOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block'
                }}>
                  ›
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  마진율 입력 방식 ({manualMarginRateRows.length}개)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLastManualMarginRateRow();
                  }}
                  disabled={manualMarginRateRows.length <= 1}
                  style={{
                    padding: '4px 12px',
                    background: manualMarginRateRows.length <= 1 ? '#94a3b8' : '#ffffff',
                    color: manualMarginRateRows.length <= 1 ? '#ffffff' : '#16a34a',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: manualMarginRateRows.length <= 1 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    opacity: manualMarginRateRows.length <= 1 ? 0.6 : 1
                  }}
                >
                  - 행제거
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addManualMarginRateRow();
                    setIsManualMarginRateOpen(true);
                  }}
                  style={{
                    padding: '4px 12px',
                    background: '#ffffff',
                    color: '#16a34a',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  + 행추가
                </button>
              </div>
            </div>
              {isManualMarginRateOpen && (
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <table style={{
                    width: '100%',
                    fontSize: '13px',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    <thead>
                      {/* 1행 헤더: 마켓명 */}
                      <tr style={{ background: '#f8f9fa' }}>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '150px', minWidth: '150px', maxWidth: '150px', fontSize: '13px' }}>
                          옵션상품
                        </th>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                          공급가
                        </th>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                          마진율
                        </th>
                        {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                          const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                          const color = marketColors[originalIndex % marketColors.length];
                          return (
                            <th key={idx} colSpan={3} style={{ padding: '6px', textAlign: 'center', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, fontSize: '12px' }}>
                              <span style={{ background: color.bg, padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{market.market_name}</span>
                            </th>
                          );
                        })}
                      </tr>
                      {/* 2행 헤더: 판매가, 수수료, 마진액 */}
                      <tr style={{ background: '#f8f9fa' }}>
                        {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                          const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                          const color = marketColors[originalIndex % marketColors.length];
                          return (
                            <React.Fragment key={`header-rate-${idx}`}>
                              <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #16a34a', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057', fontWeight: '600' }}>
                                판매가
                              </th>
                              <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                                수수료
                              </th>
                              <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                                마진액
                              </th>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {manualMarginRateRows.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: '4px 8px', textAlign: 'center', borderBottom: '1px solid #f1f1f1' }}>
                            <input
                              type="text"
                              value={row.productName}
                              onChange={(e) => updateManualMarginRateRow(row.id, 'productName', e.target.value)}
                              placeholder="상품명"
                              style={{
                                width: '100%',
                                padding: '3px 8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f1f1' }}>
                            <input
                              type="text"
                              value={row.supplyPrice ? Number(row.supplyPrice).toLocaleString() : ''}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^\d]/g, '');
                                updateManualMarginRateRow(row.id, 'supplyPrice', numericValue);
                              }}
                              placeholder="공급가"
                              style={{
                                width: '100%',
                                padding: '3px 8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'right',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f1f1' }}>
                            <input
                              type="text"
                              value={row.targetMargin}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '');
                                updateManualMarginRateRow(row.id, 'targetMargin', value);
                              }}
                              placeholder="마진율(%)"
                              style={{
                                width: '100%',
                                padding: '3px 8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'right',
                                outline: 'none'
                              }}
                            />
                          </td>
                          {/* 각 마켓별 판매가, 수수료, 마진액 */}
                          {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                            const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                            const color = marketColors[originalIndex % marketColors.length];

                            if (!row.supplyPrice || !row.targetMargin) {
                              return (
                                <React.Fragment key={`rate-${row.id}-${idx}`}>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #16a34a', color: '#6c757d', fontSize: '12px' }}>-</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                </React.Fragment>
                              );
                            }

                            const supply = parseFloat(row.supplyPrice);
                            const targetRate = parseFloat(row.targetMargin);
                            const recommendedPrice = supply / (1 - (targetRate + market.fee_rate) / 100);
                            const fee = (recommendedPrice * market.fee_rate) / 100;
                            const marginAmount = recommendedPrice - supply - fee;

                            return (
                              <React.Fragment key={`rate-${row.id}-${idx}`}>
                                <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #16a34a', fontSize: '12px', fontWeight: '500' }}>
                                  <span style={{ background: color.bg, padding: '2px 6px', borderRadius: '4px' }}>
                                    {Math.floor(recommendedPrice).toLocaleString()}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                  {Math.floor(fee).toLocaleString()}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                  {Math.floor(marginAmount).toLocaleString()}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          {/* 테이블 3: 마진액 입력 방식 */}
          <div style={{
            marginBottom: '24px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '2px solid #f59e0b',
            overflow: 'hidden'
          }}>
            <div
              style={{
                padding: '6px 16px',
                background: '#f59e0b',
                color: '#ffffff',
                borderBottom: isManualMarginAmountOpen ? '1px solid #d97706' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                minHeight: '32px'
              }}>
              <div
                onClick={() => setIsManualMarginAmountOpen(!isManualMarginAmountOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                <span style={{
                  fontSize: '16px',
                  transform: isManualMarginAmountOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block'
                }}>
                  ›
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  마진액 입력 방식 ({manualMarginAmountRows.length}개)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLastManualMarginAmountRow();
                  }}
                  disabled={manualMarginAmountRows.length <= 1}
                  style={{
                    padding: '4px 12px',
                    background: manualMarginAmountRows.length <= 1 ? '#94a3b8' : '#ffffff',
                    color: manualMarginAmountRows.length <= 1 ? '#ffffff' : '#f59e0b',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: manualMarginAmountRows.length <= 1 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    opacity: manualMarginAmountRows.length <= 1 ? 0.6 : 1
                  }}
                >
                  - 행제거
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addManualMarginAmountRow();
                    setIsManualMarginAmountOpen(true);
                  }}
                  style={{
                    padding: '4px 12px',
                    background: '#ffffff',
                    color: '#f59e0b',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  + 행추가
                </button>
              </div>
            </div>
              {isManualMarginAmountOpen && (
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <table style={{
                    width: '100%',
                    fontSize: '13px',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '150px', minWidth: '150px', maxWidth: '150px', fontSize: '13px' }}>
                          옵션상품
                        </th>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                          공급가
                        </th>
                        <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, width: '120px', minWidth: '120px', maxWidth: '120px', fontSize: '13px' }}>
                          목표마진액
                        </th>
                        {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                          const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                          const color = marketColors[originalIndex % marketColors.length];
                          return (
                            <th key={idx} colSpan={3} style={{ padding: '6px', textAlign: 'center', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1, fontSize: '12px' }}>
                              <span style={{ background: color.bg, padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{market.market_name}</span>
                            </th>
                          );
                        })}
                      </tr>
                      <tr style={{ background: '#f8f9fa' }}>
                        {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                          const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                          const color = marketColors[originalIndex % marketColors.length];
                          return (
                          <React.Fragment key={`header-amount-${idx}`}>
                            <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #f59e0b', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057', fontWeight: '600' }}>
                              판매가
                            </th>
                            <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                              수수료
                            </th>
                            <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #dee2e6', position: 'sticky', top: '28px', background: '#f8f9fa', zIndex: 1, fontSize: '11px', color: '#495057' }}>
                              마진율
                            </th>
                          </React.Fragment>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {manualMarginAmountRows.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: '4px 8px', textAlign: 'center', borderBottom: '1px solid #f1f1f1' }}>
                            <input
                              type="text"
                              value={row.productName}
                              onChange={(e) => updateManualMarginAmountRow(row.id, 'productName', e.target.value)}
                              placeholder="상품명"
                              style={{
                                width: '100%',
                                padding: '3px 8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f1f1' }}>
                            <input
                              type="text"
                              value={row.supplyPrice ? Number(row.supplyPrice).toLocaleString() : ''}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^\d]/g, '');
                                updateManualMarginAmountRow(row.id, 'supplyPrice', numericValue);
                              }}
                              placeholder="공급가"
                              style={{
                                width: '100%',
                                padding: '3px 8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'right',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f1f1' }}>
                            <input
                              type="text"
                              value={row.targetMarginAmount ? Number(row.targetMarginAmount).toLocaleString() : ''}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^\d]/g, '');
                                updateManualMarginAmountRow(row.id, 'targetMarginAmount', numericValue);
                              }}
                              placeholder="마진액"
                              style={{
                                width: '100%',
                                padding: '3px 8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'right',
                                outline: 'none'
                              }}
                            />
                          </td>
                          {marketFees.filter(m => m.market_name && m.fee_rate > 0).map((market, idx) => {
                            const originalIndex = marketFees.findIndex(m => m.market_name === market.market_name && m.fee_rate === market.fee_rate);
                            const color = marketColors[originalIndex % marketColors.length];

                            if (!row.supplyPrice || !row.targetMarginAmount) {
                              return (
                                <React.Fragment key={`amount-${row.id}-${idx}`}>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', color: '#6c757d', fontSize: '12px' }}>-</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', color: '#6c757d', fontSize: '12px' }}>-</td>
                                </React.Fragment>
                              );
                            }

                            const supply = parseFloat(row.supplyPrice);
                            const targetAmount = parseFloat(row.targetMarginAmount);
                            const recommendedPrice = (supply + targetAmount) / (1 - market.fee_rate / 100);
                            const fee = (recommendedPrice * market.fee_rate) / 100;
                            const marginRate = (targetAmount / recommendedPrice) * 100;

                            return (
                              <React.Fragment key={`amount-${row.id}-${idx}`}>
                                <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', borderLeft: idx === 0 ? '2px solid #dee2e6' : 'none', borderRight: '2px solid #f59e0b', fontSize: '12px', fontWeight: '500' }}>
                                  <span style={{ background: color.bg, padding: '2px 6px', borderRadius: '4px' }}>
                                    {Math.floor(recommendedPrice).toLocaleString()}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                  {Math.floor(fee).toLocaleString()}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f1f1f1', fontSize: '12px' }}>
                                  {marginRate.toFixed(1)}%
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
