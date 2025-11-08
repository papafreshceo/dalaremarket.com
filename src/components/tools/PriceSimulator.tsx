'use client';

import React, { useState, useEffect } from 'react';

interface MarketFee {
  market_name: string;
  fee_rate: number;
}

interface OptionProduct {
  option_name: string;
  seller_supply_price: number;
}

interface Category4Product {
  category_4: string;
  option_products: Array<{
    id: string | number;
    option_name: string;
    seller_supply_price: number;
  }>;
}

export default function PriceSimulator() {
  // 플레이스홀더 스타일을 위한 CSS 추가
  const placeholderStyle = `
    .price-simulator-input::placeholder {
      color: #adb5bd;
      opacity: 1;
    }
  `;
  // 입력 모드 ('품목선택' | '직접입력')
  const [inputMode, setInputMode] = useState<'품목선택' | '직접입력'>('품목선택');

  // 저장명
  const [saveName, setSaveName] = useState<string>('');

  // 저장된 설정 목록
  const [savedConfigs, setSavedConfigs] = useState<Array<{ name: string; timestamp: string }>>([]);

  // 드롭다운 메뉴 상태
  const [showLoadMenu, setShowLoadMenu] = useState<boolean>(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false);

  // 품목선택 모드용 - 카테고리 목록
  const [categories, setCategories] = useState<Category4Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 옵션 상품 목록
  const [optionProducts, setOptionProducts] = useState<OptionProduct[]>([]);

  // 직접입력 모드용 데이터
  const [directSupplyPrice, setDirectSupplyPrice] = useState<string>('');
  const [directSellingPrice, setDirectSellingPrice] = useState<string>('');
  const [directMarketCount, setDirectMarketCount] = useState<number>(1);
  const [directMarkets, setDirectMarkets] = useState<Array<{
    marketName: string;
    feeRate: string;
    supplyPrice: string;
  }>>([
    { marketName: '', feeRate: '', supplyPrice: '' }
  ]);

  // 품목선택 모드용 마켓 데이터
  const [categoryMarkets, setCategoryMarkets] = useState<Array<{
    marketName: string;
    feeRate: string;
  }>>([
    { marketName: '마켓 1', feeRate: '0' }
  ]);

  // 절사 단위 설정 (10 또는 100)
  const [truncateUnit, setTruncateUnit] = useState<number>(() => {
    const saved = localStorage.getItem('priceSimulator_truncateUnit');
    return saved ? parseInt(saved) : 10;
  });

  // 절사 적용 여부
  const [useTruncate, setUseTruncate] = useState<boolean>(() => {
    const saved = localStorage.getItem('priceSimulator_useTruncate');
    return saved ? saved === 'true' : false;
  });

  // 마켓별 마진 설정 (마켓 인덱스별로 관리)
  const [marketMarginSettings, setMarketMarginSettings] = useState<{
    [marketIndex: number]: {
      marginMixRatio: number;
      targetMarginRate: string;
      targetMarginAmount: string;
    };
  }>({});

  // 추가 비용/할인
  const [reviewPoint, setReviewPoint] = useState<string>('');
  const [signupPoint, setSignupPoint] = useState<string>('');
  const [couponAmount, setCouponAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [additionalCost, setAdditionalCost] = useState<string>('');

  // 천단위 콤마 포맷 함수
  const formatNumber = (value: string): string => {
    const number = value.replace(/,/g, '');
    if (!number) return '';
    return parseInt(number).toLocaleString();
  };

  // 콤마 제거 함수
  const removeComma = (value: string): string => {
    return value.replace(/,/g, '');
  };

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

  // 마켓 수수료
  const [marketFees, setMarketFees] = useState<MarketFee[]>([]);

  // Supabase에서 카테고리 데이터 불러오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/category4-products');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // localStorage에서 수수료율 불러오기
  useEffect(() => {
    const savedFees = localStorage.getItem('marginCalculator_marketFees');
    if (savedFees) {
      try {
        const parsed = JSON.parse(savedFees);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMarketFees(parsed.filter(f => f.market_name));
        }
      } catch (e) {
        console.error('Failed to parse market fees:', e);
      }
    }
  }, []);

  // 저장된 설정 목록 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('priceSimulator_savedConfigs');
    if (saved) {
      try {
        const configs = JSON.parse(saved);
        setSavedConfigs(configs);
      } catch (e) {
        console.error('Failed to parse saved configs:', e);
      }
    }
  }, []);

  // 카테고리 선택 시 옵션 상품 설정
  const handleCategorySelect = (category4: string) => {
    setSelectedCategory(category4);
    const selectedCat = categories.find(c => c.category_4 === category4);
    if (selectedCat) {
      setOptionProducts(selectedCat.option_products);
    } else {
      setOptionProducts([]);
    }
  };

  // 마켓 색상
  const marketColors = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#fef3c7', text: '#b45309' },
    { bg: '#fce7f3', text: '#9f1239' },
    { bg: '#e0e7ff', text: '#4338ca' }
  ];

  // 마켓별 마진 설정 가져오기 (없으면 기본값)
  const getMarketSettings = (marketIndex: number) => {
    return marketMarginSettings[marketIndex] || {
      marginMixRatio: 50,
      targetMarginRate: '0',
      targetMarginAmount: '0'
    };
  };

  // 마켓별 마진 설정 업데이트
  const updateMarketSettings = (marketIndex: number, updates: Partial<{
    marginMixRatio: number;
    targetMarginRate: string;
    targetMarginAmount: string;
  }>) => {
    setMarketMarginSettings(prev => ({
      ...prev,
      [marketIndex]: {
        ...getMarketSettings(marketIndex),
        ...updates
      }
    }));
  };

  // 절사 함수 (버림) - 음수인 경우 절사하지 않음
  const truncate = (value: number, unit: number) => {
    // 부동소수점 오차로 인한 거의 0에 가까운 값 처리
    if (Math.abs(value) < 0.01) return 0;
    if (!useTruncate) return Math.floor(value); // 절사 미사용 시 정수만
    if (value < 0) return Math.floor(value); // 음수는 그냥 내림
    return Math.floor(value / unit) * unit;
  };

  // 최종 판매가 계산 (마진율과 마진액 혼합)
  const calculateFinalPrice = (supplyPrice: number, market: MarketFee, marketIndex: number) => {
    const settings = getMarketSettings(marketIndex);
    const rateWeight = (100 - settings.marginMixRatio) / 100;
    const amountWeight = settings.marginMixRatio / 100;

    // 마진율 기준 계산
    const targetRate = parseFloat(settings.targetMarginRate) || 0;
    const priceByRate = supplyPrice / (1 - (targetRate + market.fee_rate) / 100);

    // 마진액 기준 계산
    const targetAmount = parseFloat(settings.targetMarginAmount) || 0;
    const priceByAmount = (supplyPrice + targetAmount) / (1 - market.fee_rate / 100);

    // 혼합 계산 후 절사 또는 정수 적용
    const mixedPrice = (priceByRate * rateWeight) + (priceByAmount * amountWeight);

    return truncate(mixedPrice, truncateUnit);
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
  const calculateFinalMargin = (supplyPrice: number, market: MarketFee, marketIndex: number) => {
    const finalPrice = calculateFinalPrice(supplyPrice, market, marketIndex);
    const fee = (finalPrice * market.fee_rate) / 100;
    const additionalCosts = getTotalAdditionalCosts();

    // 추가비용 고려하지 않은 마진 (절사 적용)
    const baseMarginRaw = finalPrice - supplyPrice - fee;
    const baseMargin = truncate(baseMarginRaw, truncateUnit);
    const baseMarginRate = finalPrice > 0 ? (baseMargin / finalPrice) * 100 : 0;

    // 추가비용 고려한 최종 마진 (절사 적용)
    const finalMarginRaw = finalPrice - supplyPrice - fee - additionalCosts;
    const finalMargin = truncate(finalMarginRaw, truncateUnit);
    const finalMarginRate = finalPrice > 0 ? (finalMargin / finalPrice) * 100 : 0;

    return {
      finalPrice,
      fee,
      baseMargin,
      baseMarginRate,
      finalMargin,
      finalMarginRate
    };
  };


  // 직접입력 모드에서 사용할 옵션 상품 생성
  const getDisplayProducts = (): OptionProduct[] => {
    if (inputMode === '직접입력') {
      return [];
    } else {
      // 품목선택 모드: 옵션 상품 목록 사용
      return optionProducts;
    }
  };

  // 직접입력 모드에서 사용할 마켓 목록
  const getDisplayMarkets = (): MarketFee[] => {
    if (inputMode === '직접입력') {
      return [];
    } else if (inputMode === '품목선택') {
      // 품목선택 모드에서는 categoryMarkets 사용
      return categoryMarkets.map(m => ({
        market_name: m.marketName,
        fee_rate: parseFloat(m.feeRate) || 0
      }));
    } else {
      return marketFees;
    }
  };

  const additionalCostsTotal = getTotalAdditionalCosts();
  const displayProducts = getDisplayProducts();
  const displayMarkets = getDisplayMarkets();

  return (
    <>
      <style>{placeholderStyle}</style>
      <div>
      {/* 2칼럼 레이아웃 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        zIndex: 10,
        padding: '12px 20px',
        borderBottom: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {/* 칼럼1: 품목선택 스위치와 입력 */}
        <div style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingRight: '12px',
          borderRight: '2px solid #dee2e6'
        }}>
          {/* 입력 모드 선택 - 스위치 형태 */}
          <div style={{
            display: 'flex',
            gap: '0',
            background: '#f8f9fa',
            borderRadius: '6px',
            padding: '3px',
            height: '32px'
          }}>
            {(['품목선택', '직접입력'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                style={{
                  padding: '0 16px',
                  background: inputMode === mode ? '#ffffff' : 'transparent',
                  color: inputMode === mode ? '#212529' : '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: inputMode === mode ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* 모드별 드롭다운 또는 입력란 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {inputMode === '품목선택' && (
              <>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  style={{
                    width: '130px',
                    height: '28px',
                    padding: '0 6px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.category_4} value={cat.category_4}>
                      {cat.category_4} ({cat.option_products.length})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (categoryMarkets.length < 5) {
                      setCategoryMarkets([...categoryMarkets, {
                        marketName: `마켓 ${categoryMarkets.length + 1}`,
                        feeRate: '0'
                      }]);
                    } else {
                      alert('최대 5개까지 마켓을 추가할 수 있습니다.');
                    }
                  }}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#45a049'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
                >
                  + 마켓 추가
                </button>
              </>
            )}

            {inputMode === '직접입력' && (
              <select
                value={directMarketCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  setDirectMarketCount(count);
                  // 마켓 수에 맞게 배열 조정
                  const newMarkets = Array.from({ length: count }, (_, i) =>
                    directMarkets[i] || { marketName: '', feeRate: '', supplyPrice: '' }
                  );
                  setDirectMarkets(newMarkets);
                }}
                style={{
                  width: '130px',
                  height: '28px',
                  padding: '0 6px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value={1}>마켓 1개</option>
                <option value={2}>마켓 2개</option>
                <option value={3}>마켓 3개</option>
              </select>
            )}
          </div>
        </div>

        {/* 칼럼2: 컨트롤 영역 - 한 줄로 압축 */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '8px',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center'
        }}>

        {/* 추가비용 */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: '#495057', whiteSpace: 'nowrap' }}>
            리뷰P
          </label>
          <input
            type="text"
            value={formatNumber(reviewPoint)}
            onChange={(e) => setReviewPoint(removeComma(e.target.value.replace(/[^0-9,]/g, '')))}
            placeholder="0"
            style={{ width: '45px', height: '28px', padding: '0 3px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '12px', textAlign: 'right' }}
          />
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: '#495057', whiteSpace: 'nowrap' }}>
            가입P
          </label>
          <input
            type="text"
            value={formatNumber(signupPoint)}
            onChange={(e) => setSignupPoint(removeComma(e.target.value.replace(/[^0-9,]/g, '')))}
            placeholder="0"
            style={{ width: '45px', height: '28px', padding: '0 3px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '12px', textAlign: 'right' }}
          />
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: '#495057', whiteSpace: 'nowrap' }}>
            쿠폰
          </label>
          <input
            type="text"
            value={formatNumber(couponAmount)}
            onChange={(e) => setCouponAmount(removeComma(e.target.value.replace(/[^0-9,]/g, '')))}
            placeholder="0"
            style={{ width: '45px', height: '28px', padding: '0 3px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '12px', textAlign: 'right' }}
          />
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: '#495057', whiteSpace: 'nowrap' }}>
            할인
          </label>
          <input
            type="text"
            value={formatNumber(discountAmount)}
            onChange={(e) => setDiscountAmount(removeComma(e.target.value.replace(/[^0-9,]/g, '')))}
            placeholder="0"
            style={{ width: '45px', height: '28px', padding: '0 3px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '12px', textAlign: 'right' }}
          />
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: '#495057', whiteSpace: 'nowrap' }}>
            기타
          </label>
          <input
            type="text"
            value={formatNumber(additionalCost)}
            onChange={(e) => setAdditionalCost(removeComma(e.target.value.replace(/[^0-9,]/g, '')))}
            placeholder="0"
            style={{ width: '45px', height: '28px', padding: '0 3px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '12px', textAlign: 'right' }}
          />
        </div>

        {/* 추가비용 합계 표시 */}
        <div style={{
          flex: '0 0 auto',
          height: '28px',
          padding: '0 8px',
          background: '#dc3545',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '500', color: '#ffffff' }}>합계</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff' }}>
            {additionalCostsTotal.toLocaleString()}
          </span>
        </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
          {/* 저장명 입력란 */}
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="저장명 입력"
            style={{
              width: '100px',
              height: '28px',
              padding: '0 8px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '12px',
              outline: 'none'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (!saveName || !saveName.trim()) {
                  alert('저장 이름을 입력해주세요.');
                  return;
                }

                // 저장할 데이터 구성
                const saveData = {
                  inputMode,
                  selectedCategory,
                  optionProducts,
                  directSupplyPrice,
                  directSellingPrice,
                  directMarketCount,
                  directMarkets,
                  categoryMarkets,
                  marketMarginSettings,
                  reviewPoint,
                  signupPoint,
                  couponAmount,
                  discountAmount,
                  additionalCost,
                  truncateUnit,
                  useTruncate,
                  timestamp: new Date().toISOString()
                };

                // 저장
                localStorage.setItem(`priceSimulator_${saveName}`, JSON.stringify(saveData));

                // 저장된 설정 목록 업데이트
                const savedConfigsStr = localStorage.getItem('priceSimulator_savedConfigs');
                let configs = savedConfigsStr ? JSON.parse(savedConfigsStr) : [];

                // 기존 동일 이름 제거 후 추가
                configs = configs.filter((c: any) => c.name !== saveName);
                configs.push({ name: saveName, timestamp: new Date().toISOString() });

                localStorage.setItem('priceSimulator_savedConfigs', JSON.stringify(configs));

                // 상태 업데이트
                setSavedConfigs(configs);

                alert(`"${saveName}" 이름으로 저장되었습니다.`);
                setSaveName(''); // 저장 후 입력란 초기화
              }
            }}
          />

          {/* 저장 버튼 */}
          <button
            onClick={() => {
              if (!saveName || !saveName.trim()) {
                alert('저장 이름을 입력해주세요.');
                return;
              }

              // 저장할 데이터 구성
              const saveData = {
                inputMode,
                selectedCategory,
                optionProducts,
                directSupplyPrice,
                directSellingPrice,
                directMarketCount,
                directMarkets,
                categoryMarkets,
                marketMarginSettings,
                reviewPoint,
                signupPoint,
                couponAmount,
                discountAmount,
                additionalCost,
                truncateUnit,
                useTruncate,
                timestamp: new Date().toISOString()
              };

              // 저장
              localStorage.setItem(`priceSimulator_${saveName}`, JSON.stringify(saveData));

              // 저장된 설정 목록 업데이트
              const savedConfigsStr = localStorage.getItem('priceSimulator_savedConfigs');
              let configs = savedConfigsStr ? JSON.parse(savedConfigsStr) : [];

              // 기존 동일 이름 제거 후 추가
              configs = configs.filter((c: any) => c.name !== saveName);
              configs.push({ name: saveName, timestamp: new Date().toISOString() });

              localStorage.setItem('priceSimulator_savedConfigs', JSON.stringify(configs));

              // 상태 업데이트
              setSavedConfigs(configs);

              alert(`"${saveName}" 이름으로 저장되었습니다.`);
              setSaveName(''); // 저장 후 입력란 초기화
            }}
            style={{
              height: '28px',
              padding: '0 12px',
              background: 'transparent',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
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
              height: '28px',
              padding: '0 12px',
              background: 'transparent',
              color: savedConfigs.length > 0 ? '#10b981' : '#9ca3af',
              border: `1px solid ${savedConfigs.length > 0 ? '#10b981' : '#d1d5db'}`,
              borderRadius: '6px',
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
                  right: '0',
                  minWidth: '240px',
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
                      const saved = localStorage.getItem(`priceSimulator_${config.name}`);
                      if (!saved) {
                        alert('저장된 데이터를 찾을 수 없습니다.');
                        return;
                      }

                      try {
                        const data = JSON.parse(saved);

                        // 데이터 불러오기
                        setInputMode(data.inputMode || '품목선택');
                        setSelectedCategory(data.selectedCategory || '');
                        setOptionProducts(data.optionProducts || []);
                        setDirectSupplyPrice(data.directSupplyPrice || '');
                        setDirectSellingPrice(data.directSellingPrice || '');
                        setDirectMarketCount(data.directMarketCount || 1);
                        setDirectMarkets(data.directMarkets || [{ marketName: '', feeRate: '', supplyPrice: '' }]);
                        setCategoryMarkets(data.categoryMarkets || [{ marketName: '마켓 1', feeRate: '0' }]);
                        setMarketMarginSettings(data.marketMarginSettings || {});
                        setReviewPoint(data.reviewPoint || '');
                        setSignupPoint(data.signupPoint || '');
                        setCouponAmount(data.couponAmount || '');
                        setDiscountAmount(data.discountAmount || '');
                        setAdditionalCost(data.additionalCost || '');
                        setTruncateUnit(data.truncateUnit || 10);
                        setUseTruncate(data.useTruncate !== undefined ? data.useTruncate : false);

                        alert(`"${config.name}" 설정을 불러왔습니다.`);
                      } catch (e) {
                        console.error('Failed to load data:', e);
                        alert('데이터를 불러오는데 실패했습니다.');
                      }
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
              height: '28px',
              padding: '0 12px',
              background: 'transparent',
              color: savedConfigs.length > 0 ? '#ef4444' : '#9ca3af',
              border: `1px solid ${savedConfigs.length > 0 ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '6px',
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
                  right: '0',
                  minWidth: '240px',
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
                      if (!confirm(`"${config.name}" 설정을 삭제하시겠습니까?`)) {
                        return;
                      }

                      // localStorage에서 삭제
                      localStorage.removeItem(`priceSimulator_${config.name}`);

                      // 설정 목록에서 제거
                      const configs = savedConfigs.filter((c) => c.name !== config.name);
                      localStorage.setItem('priceSimulator_savedConfigs', JSON.stringify(configs));
                      setSavedConfigs(configs);

                      alert(`"${config.name}" 설정이 삭제되었습니다.`);
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

          {/* 초기화 버튼 */}
          <button
            onClick={() => {
              // 모든 상태 초기화
              setInputMode('품목선택');
              setSelectedCategory('');
              setOptionProducts([]);
              setDirectSupplyPrice('');
              setDirectSellingPrice('');
              setDirectMarketCount(1);
              setDirectMarkets([{ marketName: '', feeRate: '', supplyPrice: '' }]);
              setMarketMarginSettings({});
              setReviewPoint('');
              setSignupPoint('');
              setCouponAmount('');
              setDiscountAmount('');
              setAdditionalCost('');
            }}
            style={{
              height: '28px',
              padding: '0 12px',
              background: 'transparent',
              color: '#6c757d',
              border: '1px solid #6c757d',
              borderRadius: '6px',
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

      {/* 마켓별 테이블 */}
      {inputMode === '직접입력' ? (
        // 직접입력 모드: directMarkets 사용
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          {directMarkets.map((market, marketIndex) => {
            const colorScheme = marketColors[marketIndex % marketColors.length];
            const supplyPrice = parseInt(removeComma(market.supplyPrice)) || 0;
            const feeRate = parseFloat(market.feeRate) || 0;

            // 단일 상품으로 처리
            const marketFee: MarketFee = {
              market_name: market.marketName || `마켓 ${marketIndex + 1}`,
              fee_rate: feeRate
            };

            const result = supplyPrice > 0 ? calculateFinalMargin(supplyPrice, marketFee, marketIndex) : null;

            return (
              <div key={marketIndex} style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #dee2e6',
                overflow: 'hidden'
              }}>
                {/* 마켓 헤더 */}
                <div style={{
                  padding: '12px 20px',
                  background: colorScheme.bg,
                  borderBottom: '2px solid #dee2e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  {/* 좌측: 마켓명 */}
                  <input
                    type="text"
                    value={market.marketName}
                    onChange={(e) => {
                      const newMarkets = [...directMarkets];
                      newMarkets[marketIndex].marketName = e.target.value;
                      setDirectMarkets(newMarkets);
                    }}
                    placeholder={market.marketName || `마켓 ${marketIndex + 1}`}
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colorScheme.text,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '2px solid transparent',
                      outline: 'none',
                      padding: '4px 8px',
                      width: '150px',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = colorScheme.text}
                    onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                  />

                  {/* 중앙: 마진 설정 컨트롤 */}
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: 0
                  }}>
                    {/* 마진율 입력 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: '0 0 auto'
                    }}>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: colorScheme.text,
                        whiteSpace: 'nowrap'
                      }}>
                        마진율(%)
                      </label>
                      <input
                        type="text"
                        value={getMarketSettings(marketIndex).targetMarginRate}
                        onChange={(e) => updateMarketSettings(marketIndex, { targetMarginRate: e.target.value.replace(/[^0-9.]/g, '') })}
                        placeholder="0"
                        className="price-simulator-input"
                        style={{
                          width: '60px',
                          padding: '3px 6px',
                          border: '1px solid #ff9800',
                          borderRadius: '4px',
                          fontSize: '12px',
                          textAlign: 'center',
                          background: '#fff8e1',
                          color: '#e65100',
                          fontWeight: '700',
                          boxShadow: '0 1px 2px rgba(255,152,0,0.15)'
                        }}
                      />
                    </div>

                    {/* 혼합 비율 바 */}
                    <div style={{
                      flex: '0 0 280px',
                      position: 'relative',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {/* 비율 바 배경 */}
                      <div style={{
                        width: '100%',
                        height: '24px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #dee2e6'
                      }}>
                        {/* 마진율 영역 */}
                        <div style={{
                          width: `${100 - getMarketSettings(marketIndex).marginMixRatio}%`,
                          background: 'linear-gradient(135deg, #ffe082 0%, #ffb74d 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          {(100 - getMarketSettings(marketIndex).marginMixRatio) > 15 && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: '#e65100',
                              textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                            }}>
                              {100 - getMarketSettings(marketIndex).marginMixRatio}%
                            </span>
                          )}
                        </div>
                        {/* 마진액 영역 */}
                        <div style={{
                          width: `${getMarketSettings(marketIndex).marginMixRatio}%`,
                          background: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          {getMarketSettings(marketIndex).marginMixRatio > 15 && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: '#01579b',
                              textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                            }}>
                              {getMarketSettings(marketIndex).marginMixRatio}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* 슬라이더 (역방향) */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={100 - getMarketSettings(marketIndex).marginMixRatio}
                        onChange={(e) => updateMarketSettings(marketIndex, { marginMixRatio: 100 - parseInt(e.target.value) })}
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '24px',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      />
                    </div>

                    {/* 마진액 입력 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: '0 0 auto'
                    }}>
                      <input
                        type="text"
                        value={formatNumber(getMarketSettings(marketIndex).targetMarginAmount)}
                        onChange={(e) => updateMarketSettings(marketIndex, { targetMarginAmount: removeComma(e.target.value.replace(/[^0-9,]/g, '')) })}
                        placeholder="0"
                        className="price-simulator-input"
                        style={{
                          width: '60px',
                          padding: '3px 6px',
                          border: '1px solid #29b6f6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          textAlign: 'right',
                          background: '#e1f5fe',
                          color: '#01579b',
                          fontWeight: '700',
                          boxShadow: '0 1px 2px rgba(41,182,246,0.15)'
                        }}
                      />
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: colorScheme.text,
                        whiteSpace: 'nowrap'
                      }}>
                        마진액(원)
                      </label>
                    </div>
                  </div>

                  {/* 우측: 수수료율 입력 (밑줄 스타일) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: '0 0 auto'
                  }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: colorScheme.text,
                      whiteSpace: 'nowrap'
                    }}>
                      수수료율:
                    </label>
                    <input
                      type="text"
                      value={market.feeRate}
                      onChange={(e) => {
                        const newMarkets = [...directMarkets];
                        newMarkets[marketIndex].feeRate = e.target.value.replace(/[^0-9.]/g, '');
                        setDirectMarkets(newMarkets);
                      }}
                      placeholder={market.feeRate || '0'}
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colorScheme.text,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid transparent',
                        outline: 'none',
                        padding: '4px 8px',
                        width: '60px',
                        textAlign: 'right',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderBottomColor = colorScheme.text}
                      onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                    />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: colorScheme.text
                    }}>%</span>
                  </div>
                </div>

                {/* 테이블 */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '15%'
                        }}>
                          공급가
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          최종 판매가
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          수수료
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          마진
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          마진율
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          추가비용
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          최종 마진
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          최종 마진율
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{
                        borderBottom: '1px solid #f1f3f5',
                        background: '#ffffff'
                      }}>
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'center'
                        }}>
                          <input
                            type="text"
                            value={formatNumber(market.supplyPrice)}
                            onChange={(e) => {
                              const newMarkets = [...directMarkets];
                              newMarkets[marketIndex].supplyPrice = removeComma(e.target.value.replace(/[^0-9,]/g, ''));
                              setDirectMarkets(newMarkets);
                            }}
                            placeholder="공급가 입력"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '13px',
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          />
                        </td>
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#212529',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {result ? result.finalPrice.toLocaleString() : '-'}
                        </td>
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontSize: '13px',
                          color: '#dc3545',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {result ? Math.floor(result.fee).toLocaleString() : '-'}
                        </td>
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: result && result.baseMargin >= 0 ? '#10b981' : '#dc3545',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {result ? Math.floor(result.baseMargin).toLocaleString() : '-'}
                        </td>
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: result && result.baseMarginRate >= 0 ? '#10b981' : '#dc3545',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {result ? result.baseMarginRate.toFixed(1) + '%' : '-'}
                        </td>
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontSize: '13px',
                          color: '#dc3545',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {additionalCostsTotal.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: result && result.finalMargin >= 0 ? '#10b981' : '#dc3545',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {result ? Math.floor(result.finalMargin).toLocaleString() : '-'}
                        </td>
                        <td style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: result && result.finalMarginRate >= 0 ? '#10b981' : '#dc3545',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {result ? result.finalMarginRate.toFixed(1) + '%' : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* 절사 설정 */}
          <div style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#495057'
            }}>
              가격 표시 방식:
            </label>
            {/* 절사 ON/OFF */}
            <div style={{
              display: 'flex',
              gap: '4px',
              background: '#f8f9fa',
              borderRadius: '6px',
              padding: '2px'
            }}>
              <button
                onClick={() => setUseTruncate(false)}
                style={{
                  padding: '6px 16px',
                  background: !useTruncate ? '#ffffff' : 'transparent',
                  color: !useTruncate ? '#212529' : '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: !useTruncate ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                계산값
              </button>
              <button
                onClick={() => setUseTruncate(true)}
                style={{
                  padding: '6px 16px',
                  background: useTruncate ? '#ffffff' : 'transparent',
                  color: useTruncate ? '#212529' : '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: useTruncate ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                절사
              </button>
            </div>

            {/* 절사 단위 선택 (절사 모드일 때만 표시) */}
            {useTruncate && (
              <>
                <span style={{
                  fontSize: '13px',
                  color: '#6c757d'
                }}>
                  단위:
                </span>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '2px'
                }}>
                  <button
                    onClick={() => setTruncateUnit(10)}
                    style={{
                      padding: '6px 16px',
                      background: truncateUnit === 10 ? '#ffffff' : 'transparent',
                      color: truncateUnit === 10 ? '#212529' : '#6c757d',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: truncateUnit === 10 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    10
                  </button>
                  <button
                    onClick={() => setTruncateUnit(100)}
                    style={{
                      padding: '6px 16px',
                      background: truncateUnit === 100 ? '#ffffff' : 'transparent',
                      color: truncateUnit === 100 ? '#212529' : '#6c757d',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: truncateUnit === 100 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    100
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : displayProducts.length > 0 ? (
        // 품목선택 모드: 기존 로직
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          {displayMarkets.length > 0 ? displayMarkets.map((market, marketIndex) => {
            const colorScheme = marketColors[marketIndex % marketColors.length];

            return (
              <div key={marketIndex} style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #dee2e6',
                overflow: 'hidden'
              }}>
                {/* 마켓 헤더 */}
                <div style={{
                  padding: '12px 20px',
                  background: colorScheme.bg,
                  borderBottom: '2px solid #dee2e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  {/* 좌측: 마켓명 */}
                  {inputMode === '품목선택' ? (
                    <input
                      type="text"
                      value={categoryMarkets[marketIndex]?.marketName || ''}
                      onChange={(e) => {
                        const newMarkets = [...categoryMarkets];
                        newMarkets[marketIndex].marketName = e.target.value;
                        setCategoryMarkets(newMarkets);
                      }}
                      placeholder={categoryMarkets[marketIndex]?.marketName || `마켓 ${marketIndex + 1}`}
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colorScheme.text,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid transparent',
                        outline: 'none',
                        padding: '4px 8px',
                        width: '150px',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderBottomColor = colorScheme.text}
                      onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                    />
                  ) : (
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: 0,
                      color: colorScheme.text,
                      flex: '0 0 auto',
                      minWidth: '120px'
                    }}>
                      {market.market_name}
                    </h3>
                  )}

                  {/* 중앙: 마진 설정 컨트롤 */}
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: 0
                  }}>
                    {/* 마진율 입력 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: '0 0 auto'
                    }}>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: colorScheme.text,
                        whiteSpace: 'nowrap'
                      }}>
                        마진율(%)
                      </label>
                      <input
                        type="text"
                        value={getMarketSettings(marketIndex).targetMarginRate}
                        onChange={(e) => updateMarketSettings(marketIndex, { targetMarginRate: e.target.value.replace(/[^0-9.]/g, '') })}
                        placeholder="0"
                        className="price-simulator-input"
                        style={{
                          width: '60px',
                          padding: '3px 6px',
                          border: '1px solid #ff9800',
                          borderRadius: '4px',
                          fontSize: '12px',
                          textAlign: 'center',
                          background: '#fff8e1',
                          color: '#e65100',
                          fontWeight: '700',
                          boxShadow: '0 1px 2px rgba(255,152,0,0.15)'
                        }}
                      />
                    </div>

                    {/* 혼합 비율 바 */}
                    <div style={{
                      flex: '0 0 280px',
                      position: 'relative',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {/* 비율 바 배경 */}
                      <div style={{
                        width: '100%',
                        height: '24px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #dee2e6'
                      }}>
                        {/* 마진율 영역 */}
                        <div style={{
                          width: `${100 - getMarketSettings(marketIndex).marginMixRatio}%`,
                          background: 'linear-gradient(135deg, #ffe082 0%, #ffb74d 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          {(100 - getMarketSettings(marketIndex).marginMixRatio) > 15 && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: '#e65100',
                              textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                            }}>
                              {100 - getMarketSettings(marketIndex).marginMixRatio}%
                            </span>
                          )}
                        </div>
                        {/* 마진액 영역 */}
                        <div style={{
                          width: `${getMarketSettings(marketIndex).marginMixRatio}%`,
                          background: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          {getMarketSettings(marketIndex).marginMixRatio > 15 && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: '#01579b',
                              textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                            }}>
                              {getMarketSettings(marketIndex).marginMixRatio}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* 슬라이더 (역방향) */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={100 - getMarketSettings(marketIndex).marginMixRatio}
                        onChange={(e) => updateMarketSettings(marketIndex, { marginMixRatio: 100 - parseInt(e.target.value) })}
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '24px',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      />
                    </div>

                    {/* 마진액 입력 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: '0 0 auto'
                    }}>
                      <input
                        type="text"
                        value={formatNumber(getMarketSettings(marketIndex).targetMarginAmount)}
                        onChange={(e) => updateMarketSettings(marketIndex, { targetMarginAmount: removeComma(e.target.value.replace(/[^0-9,]/g, '')) })}
                        placeholder="0"
                        className="price-simulator-input"
                        style={{
                          width: '60px',
                          padding: '3px 6px',
                          border: '1px solid #29b6f6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          textAlign: 'right',
                          background: '#e1f5fe',
                          color: '#01579b',
                          fontWeight: '700',
                          boxShadow: '0 1px 2px rgba(41,182,246,0.15)'
                        }}
                      />
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: colorScheme.text,
                        whiteSpace: 'nowrap'
                      }}>
                        마진액(원)
                      </label>
                    </div>
                  </div>

                  {/* 우측: 수수료율 입력 (품목선택 모드일 때만) */}
                  {inputMode === '품목선택' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: '0 0 auto'
                    }}>
                      <label style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colorScheme.text,
                        whiteSpace: 'nowrap'
                      }}>
                        수수료율:
                      </label>
                      <input
                        type="text"
                        value={categoryMarkets[marketIndex]?.feeRate || ''}
                        onChange={(e) => {
                          const newMarkets = [...categoryMarkets];
                          newMarkets[marketIndex].feeRate = e.target.value.replace(/[^0-9.]/g, '');
                          setCategoryMarkets(newMarkets);
                        }}
                        placeholder={categoryMarkets[marketIndex]?.feeRate || '0'}
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: colorScheme.text,
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '2px solid transparent',
                          outline: 'none',
                          padding: '4px 8px',
                          width: '60px',
                          textAlign: 'right',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderBottomColor = colorScheme.text}
                        onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                      />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colorScheme.text
                      }}>%</span>
                    </div>
                  )}
                </div>

                {/* 테이블 */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '15%'
                        }}>
                          옵션상품
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          공급가
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          최종 판매가
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          수수료
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          마진
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          마진율
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          추가비용
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          최종 마진
                        </th>
                        <th style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#495057',
                          borderBottom: '2px solid #dee2e6',
                          width: '10%'
                        }}>
                          최종 마진율
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayProducts.map((product, index) => {
                        const result = calculateFinalMargin(product.seller_supply_price, market, marketIndex);

                        return (
                          <tr key={index} style={{
                            borderBottom: '1px solid #f1f3f5',
                            background: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                          }}>
                            <td style={{
                              padding: '10px 12px',
                              fontSize: '13px',
                              color: '#212529',
                              textAlign: 'center'
                            }}>
                              {product.option_name}
                            </td>
                            <td style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              color: '#495057',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {product.seller_supply_price.toLocaleString()}
                            </td>
                            <td style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#212529',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {result.finalPrice.toLocaleString()}
                            </td>
                            <td style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              color: '#dc3545',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {Math.floor(result.fee).toLocaleString()}
                            </td>
                            <td style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: result.baseMargin >= 0 ? '#10b981' : '#dc3545',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {Math.floor(result.baseMargin).toLocaleString()}
                            </td>
                            <td style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: result.baseMarginRate >= 0 ? '#10b981' : '#dc3545',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {result.baseMarginRate.toFixed(1)}%
                            </td>
                            <td style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              color: '#dc3545',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {additionalCostsTotal.toLocaleString()}
                            </td>
                            <td style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: result.finalMargin >= 0 ? '#10b981' : '#dc3545',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {Math.floor(result.finalMargin).toLocaleString()}
                            </td>
                            <td style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: result.finalMarginRate >= 0 ? '#10b981' : '#dc3545',
                              fontVariantNumeric: 'tabular-nums'
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
            );
          }) : null}

          {/* 절사 설정 */}
          {displayMarkets.length > 0 && (
          <div style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#495057'
            }}>
              가격 표시 방식:
            </label>
            {/* 절사 ON/OFF */}
            <div style={{
              display: 'flex',
              gap: '4px',
              background: '#f8f9fa',
              borderRadius: '6px',
              padding: '2px'
            }}>
              <button
                onClick={() => setUseTruncate(false)}
                style={{
                  padding: '6px 16px',
                  background: !useTruncate ? '#ffffff' : 'transparent',
                  color: !useTruncate ? '#212529' : '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: !useTruncate ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                계산값
              </button>
              <button
                onClick={() => setUseTruncate(true)}
                style={{
                  padding: '6px 16px',
                  background: useTruncate ? '#ffffff' : 'transparent',
                  color: useTruncate ? '#212529' : '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: useTruncate ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                절사
              </button>
            </div>

            {/* 절사 단위 선택 (절사 모드일 때만 표시) */}
            {useTruncate && (
              <>
                <span style={{
                  fontSize: '13px',
                  color: '#6c757d'
                }}>
                  단위:
                </span>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '2px'
                }}>
                  <button
                    onClick={() => setTruncateUnit(10)}
                    style={{
                      padding: '6px 16px',
                      background: truncateUnit === 10 ? '#ffffff' : 'transparent',
                      color: truncateUnit === 10 ? '#212529' : '#6c757d',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: truncateUnit === 10 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    10
                  </button>
                  <button
                    onClick={() => setTruncateUnit(100)}
                    style={{
                      padding: '6px 16px',
                      background: truncateUnit === 100 ? '#ffffff' : 'transparent',
                      color: truncateUnit === 100 ? '#212529' : '#6c757d',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: truncateUnit === 100 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    100
                  </button>
                </div>
              </>
            )}
          </div>
          )}
        </div>
      ) : (
        <div style={{
          background: '#f8f9fa',
          padding: '48px 32px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '2px dashed #dee2e6',
          margin: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#212529' }}>
            시뮬레이션을 시작하세요
          </h3>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            다양한 조건의 시뮬레이션으로<br />
            판매가, 마진 및 마진율을 한눈에 볼 수 있습니다
          </p>
        </div>
      )}
      </div>
    </>
  );
}
