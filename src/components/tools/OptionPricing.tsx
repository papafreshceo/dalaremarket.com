'use client';

import React, { useState, useEffect } from 'react';

// 불러오기 전용 버튼 컴포넌트
function LoadOnlyButton({
  marginConfigs,
  onLoad
}: {
  marginConfigs: Array<{ name: string; timestamp: string }>;
  onLoad: (name: string) => void;
}) {
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  // 날짜 포맷 함수
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => {
          if (marginConfigs.length === 0) {
            alert('저장된 마진계산기 설정이 없습니다.');
            return;
          }
          setShowLoadMenu(!showLoadMenu);
        }}
        style={{
          padding: '6px 16px',
          background: 'transparent',
          color: '#10b981',
          border: '1px solid #10b981',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        판매가 불러오기
      </button>

      {showLoadMenu && marginConfigs.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          minWidth: '200px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {marginConfigs.map((config) => (
            <div
              key={config.name}
              onClick={() => {
                onLoad(config.name);
                setShowLoadMenu(false);
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#212529' }}>
                {config.name}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                {formatDate(config.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showLoadMenu && (
        <div
          onClick={() => setShowLoadMenu(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}

interface OptionProduct {
  id: string;
  name: string;
  price: string;
  option1: string;
  option2: string;
  option3: string;
  optionPrice: string;
  stockQuantity: string;
  managementCode: string;
  isActive: boolean;
  priceDiff: number;
}

interface Category4Product {
  category_4: string;
  option_products: Array<{
    id: string | number;
    option_name: string;
    seller_supply_price: number;
  }>;
}

export default function OptionPricing() {
  const [options, setOptions] = useState<OptionProduct[]>([
    { id: '1', name: '', price: '', option1: '', option2: '', option3: '', optionPrice: '', stockQuantity: '', managementCode: '', isActive: true, priceDiff: 0 }
  ]);
  const [baseOptionId, setBaseOptionId] = useState<string>('');

  // 판매가 및 할인금액
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [discountPrice, setDiscountPrice] = useState<string>('');

  // 옵션 헤더명
  const [option1Header, setOption1Header] = useState<string>('옵션1');
  const [option2Header, setOption2Header] = useState<string>('옵션2');
  const [option3Header, setOption3Header] = useState<string>('옵션3');

  // 옵션명 개수
  const [optionCount, setOptionCount] = useState<number>(2);

  // 카테고리4 관련 state
  const [categories, setCategories] = useState<Category4Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 선택된 옵션 ID 목록
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());


  // 카테고리 목록 가져오기
  useEffect(() => {
    fetchCategories();
  }, []);

  // 할인금액 자동 계산: 판매가(정가) - 기준가 = 할인금액
  useEffect(() => {
    if (sellingPrice && baseOptionId) {
      const baseOption = options.find(opt => opt.id === baseOptionId);
      if (baseOption && baseOption.price) {
        const sellingPriceNum = parseInt(sellingPrice);
        const basePriceNum = parseInt(baseOption.price);
        const calculatedDiscountPrice = sellingPriceNum - basePriceNum;
        setDiscountPrice(calculatedDiscountPrice.toString());
      }
    }
  }, [sellingPrice, baseOptionId, options]);

  // 옵션가 자동 계산: 옵션상품 판매가 - 할인판매가
  useEffect(() => {
    if (sellingPrice && discountPrice) {
      const discountedPrice = parseInt(sellingPrice) - parseInt(discountPrice); // 할인판매가
      const updatedOptions = options.map(opt => {
        if (opt.price) {
          const optionPriceValue = parseInt(opt.price) - discountedPrice;
          return {
            ...opt,
            optionPrice: optionPriceValue.toString()
          };
        }
        return opt;
      });
      setOptions(updatedOptions);
    }
  }, [sellingPrice, discountPrice]);

  // 카테고리 fetch 함수
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

  // 기준 옵션 변경 시 차액 재계산
  useEffect(() => {
    if (baseOptionId) {
      calculatePriceDiffs();
    }
  }, [baseOptionId]);

  // 차액 계산
  const calculatePriceDiffs = () => {
    const baseOption = options.find(opt => opt.id === baseOptionId);
    if (!baseOption || !baseOption.price) return;

    const basePrice = parseFloat(baseOption.price);
    if (isNaN(basePrice)) return;

    setOptions(prevOptions =>
      prevOptions.map(opt => {
        const optPrice = parseFloat(opt.price) || 0;
        return {
          ...opt,
          priceDiff: optPrice - basePrice
        };
      })
    );
  };

  // 카테고리 선택 시 옵션 상품 일괄 추가
  const handleCategorySelect = (category: string) => {
    if (!category) return;

    const selectedCat = categories.find(c => c.category_4 === category);
    if (!selectedCat || !selectedCat.option_products || selectedCat.option_products.length === 0) {
      alert('해당 카테고리에 옵션 상품이 없습니다.');
      return;
    }

    // 기존 옵션에 새 옵션들을 추가
    const currentMaxId = Math.max(...options.map(o => parseInt(o.id)), 0);
    const newOptions = selectedCat.option_products.map((product, index) => ({
      id: (currentMaxId + index + 1).toString(),
      name: product.option_name,
      price: product.seller_supply_price.toString(),
      option1: '',
      option2: '',
      option3: '',
      optionPrice: '',
      stockQuantity: '',
      managementCode: '',
      isActive: true,
      priceDiff: 0
    }));

    // 항상 기존 옵션에 추가
    setOptions([...options, ...newOptions]);

    alert(`"${category}" 카테고리의 ${newOptions.length}개 옵션 상품을 추가했습니다.`);
    setSelectedCategory('');
  };

  // 선택 토글
  const toggleSelection = (id: string) => {
    setSelectedOptionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedOptionIds.size === options.length) {
      setSelectedOptionIds(new Set());
    } else {
      setSelectedOptionIds(new Set(options.map(opt => opt.id)));
    }
  };

  // 순서 위로 이동
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    setOptions(newOptions);
  };

  // 순서 아래로 이동
  const moveDown = (index: number) => {
    if (index === options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    setOptions(newOptions);
  };

  // 옵션 추가
  const addOption = () => {
    const newId = (Math.max(...options.map(o => parseInt(o.id)), 0) + 1).toString();
    setOptions([...options, { id: newId, name: '', price: '', option1: '', option2: '', option3: '', optionPrice: '', stockQuantity: '', managementCode: '', isActive: true, priceDiff: 0 }]);
  };

  // 옵션 삭제
  const removeOption = (id: string) => {
    if (options.length === 1) {
      alert('최소 1개의 옵션은 있어야 합니다.');
      return;
    }
    setOptions(options.filter(opt => opt.id !== id));
    if (baseOptionId === id) {
      setBaseOptionId('');
    }
  };

  // 선택된 옵션 삭제
  const removeSelectedOptions = () => {
    if (selectedOptionIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    if (options.length - selectedOptionIds.size < 1) {
      alert('최소 1개의 옵션은 있어야 합니다.');
      return;
    }

    if (confirm(`선택한 ${selectedOptionIds.size}개 항목을 삭제하시겠습니까?`)) {
      setOptions(options.filter(opt => !selectedOptionIds.has(opt.id)));

      // 기준설정된 옵션이 삭제되면 초기화
      if (baseOptionId && selectedOptionIds.has(baseOptionId)) {
        setBaseOptionId('');
      }

      // 선택 목록 초기화
      setSelectedOptionIds(new Set());
    }
  };

  // 옵션 수정
  const updateOption = (id: string, field: keyof OptionProduct, value: string | boolean) => {
    setOptions(prevOptions => {
      const updated = prevOptions.map(opt => {
        if (opt.id === id) {
          // isActive는 boolean으로 처리
          if (field === 'isActive') {
            return { ...opt, [field]: value === 'true' || value === true };
          }
          return { ...opt, [field]: value };
        }
        return opt;
      });

      // 가격이 변경되면 옵션가 재계산
      if (field === 'price' && sellingPrice && discountPrice) {
        const discountedPrice = parseInt(sellingPrice) - parseInt(discountPrice);
        return updated.map(opt => {
          if (opt.price) {
            const optionPriceValue = parseInt(opt.price) - discountedPrice;
            return {
              ...opt,
              optionPrice: optionPriceValue.toString()
            };
          }
          return opt;
        });
      }

      return updated;
    });

    // 가격이 변경되면 차액 재계산
    if (field === 'price' && baseOptionId) {
      setTimeout(calculatePriceDiffs, 0);
    }
  };


  // 마진계산기에서 불러오기
  const loadFromMarginCalculator = (name: string) => {
    const saved = localStorage.getItem(`marginCalculator_${name}`);
    if (saved) {
      try {
        const config = JSON.parse(saved);

        // 현재 최대 ID 찾기
        const currentMaxId = Math.max(...options.map(o => parseInt(o.id)), 0);

        // 품목 선택 모드의 데이터가 있는 경우
        if (config.selectedCategory && config.calculationResults) {
          const results = config.calculationResults;
          const newOptions = results.map((item: any, index: number) => ({
            id: (currentMaxId + index + 1).toString(),
            name: item.option_name || '',
            price: item.recommended_price ? item.recommended_price.toString() : '',
            option1: '',
            option2: '',
            option3: '',
            optionPrice: '',
            stockQuantity: '',
            managementCode: '',
            isActive: true,
            priceDiff: 0
          }));

          if (newOptions.length > 0) {
            setOptions([...options, ...newOptions]);
            alert(`마진계산기 "${name}" 설정의 ${newOptions.length}개 옵션을 추가했습니다.`);
          } else {
            alert('불러올 옵션 상품이 없습니다.');
          }
        }
        // 직접 입력 모드의 데이터가 있는 경우
        else if (config.manualSellingRows) {
          const rows = config.manualSellingRows;
          const newOptions = rows
            .filter((row: any) => row.productName && row.sellingPrice)
            .map((row: any, index: number) => ({
              id: (currentMaxId + index + 1).toString(),
              name: row.productName,
              price: row.sellingPrice,
              option1: '',
              option2: '',
              option3: '',
              optionPrice: '',
              stockQuantity: '',
              managementCode: '',
              isActive: true,
              priceDiff: 0
            }));

          if (newOptions.length > 0) {
            setOptions([...options, ...newOptions]);
            alert(`마진계산기 "${name}" 설정의 ${newOptions.length}개 옵션을 추가했습니다.`);
          } else {
            alert('불러올 옵션 상품이 없습니다.');
          }
        } else {
          alert('마진계산기에 저장된 옵션 상품 데이터가 없습니다.');
        }
      } catch (e) {
        console.error('Load error:', e);
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
      {/* 설명 섹션 */}
      <div style={{
        background: '#f0f9ff',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #bfdbfe'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#1e40af'
        }}>
          💡 옵션가 세팅 사용 방법
        </h3>
        <ol style={{
          fontSize: '13px',
          color: '#1e3a8a',
          lineHeight: '1.6',
          margin: 0,
          paddingLeft: '20px'
        }}>
          <li>마진계산기의 '판매가 불러오기' 또는 '품목 추가'로 옵션 상품 추가</li>
          <li>판매가(정가) 입력 → 기준이 될 옵션 상품 1개 선택</li>
          <li>할인금액, 할인율, 할인판매가, 옵션가가 자동으로 계산됩니다</li>
          <li>옵션명 입력 후 네이버/카카오 양식으로 다운로드</li>
        </ol>
      </div>

      {/* 판매가 및 할인금액 입력 */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #dee2e6',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* 판매가(정가) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#495057',
            whiteSpace: 'nowrap'
          }}>
            판매가(정가)
          </label>
          <input
            type="text"
            value={sellingPrice ? parseInt(sellingPrice).toLocaleString() : ''}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setSellingPrice(value);
            }}
            placeholder="0"
            style={{
              width: '120px',
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '13px',
              textAlign: 'right'
            }}
          />
        </div>

        {/* 할인금액 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#495057',
            whiteSpace: 'nowrap'
          }}>
            할인금액
          </label>
          <input
            type="text"
            value={discountPrice ? parseInt(discountPrice).toLocaleString() : ''}
            readOnly
            disabled
            placeholder="0"
            style={{
              width: '120px',
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '13px',
              textAlign: 'right',
              background: '#f8f9fa',
              color: '#495057',
              cursor: 'not-allowed'
            }}
          />
        </div>

        {/* 할인율 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#495057',
            whiteSpace: 'nowrap'
          }}>
            할인율
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: (() => {
              if (sellingPrice && discountPrice) {
                const rate = (parseInt(discountPrice) / parseInt(sellingPrice)) * 100;
                return rate >= 50 ? '#dc3545' : '#495057';
              }
              return '#495057';
            })()
          }}>
            {(() => {
              if (sellingPrice && discountPrice && parseInt(sellingPrice) > 0) {
                const rate = (parseInt(discountPrice) / parseInt(sellingPrice)) * 100;
                return rate.toFixed(1) + '%';
              }
              return '0%';
            })()}
          </span>
        </div>

        {/* 할인판매가 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '32px' }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#495057',
            whiteSpace: 'nowrap'
          }}>
            할인판매가
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#dc3545'
          }}>
            {(() => {
              if (sellingPrice && discountPrice) {
                const finalPrice = parseInt(sellingPrice) - parseInt(discountPrice);
                return finalPrice.toLocaleString() + '원';
              }
              return '0원';
            })()}
          </span>
        </div>
      </div>

      {/* 옵션 목록 */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #dee2e6',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px 20px',
          background: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              color: '#212529',
              whiteSpace: 'nowrap'
            }}>
              옵션 설정
            </h3>
            <select
              value={optionCount}
              onChange={(e) => setOptionCount(parseInt(e.target.value))}
              style={{
                padding: '6px 12px',
                background: '#ffffff',
                color: '#495057',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '110px'
              }}
            >
              <option value={1}>옵션명 1개</option>
              <option value={2}>옵션명 2개</option>
              <option value={3}>옵션명 3개</option>
            </select>
            {/* 판매가 불러오기 버튼 */}
            <LoadOnlyButton
              marginConfigs={marginConfigs}
              onLoad={(name: string) => {
                loadFromMarginCalculator(name);
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                color: '#10b981',
                border: '1px solid #10b981',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '200px'
              }}
            >
              <option value="">품목 추가</option>
              {categories.map((cat) => (
                <option key={cat.category_4} value={cat.category_4}>
                  {cat.category_4} ({cat.option_products.length}개)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              {/* 첫 번째 행 */}
              <tr style={{ background: '#f8f9fa', height: '42px' }}>
                <th rowSpan={2} style={{
                  padding: '8px 4px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  width: '45px',
                  minWidth: '45px',
                  maxWidth: '45px'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedOptionIds.size === options.length && options.length > 0}
                    onChange={toggleSelectAll}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </th>
                <th rowSpan={2} style={{
                  padding: '8px 4px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  borderRight: '1px solid #dee2e6',
                  width: '65px',
                  minWidth: '65px',
                  maxWidth: '65px'
                }}>
                  순서
                </th>
                <th rowSpan={2} style={{
                  padding: '8px 4px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  borderRight: '1px solid #dee2e6',
                  width: '65px',
                  minWidth: '65px',
                  maxWidth: '65px'
                }}>
                  기준설정
                </th>
                <th rowSpan={2} style={{
                  padding: '8px 6px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  borderRight: '1px solid #dee2e6',
                  width: '120px',
                  minWidth: '120px',
                  maxWidth: '120px'
                }}>
                  옵션상품
                </th>
                <th rowSpan={2} style={{
                  padding: '8px 6px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  borderRight: '1px solid #dee2e6',
                  width: '80px',
                  minWidth: '80px',
                  maxWidth: '80px'
                }}>
                  판매가(원)
                </th>
                {/* 옵션1~사용여부까지 병합 */}
                <th colSpan={optionCount + 4} style={{
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '1px solid #dee2e6',
                  borderLeft: '1px solid #dee2e6',
                  background: '#FFF9C4'
                }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        // 네이버 다운로드 로직 추가 예정
                        alert('네이버 양식 다운로드 기능 준비 중입니다.');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '4px 8px',
                        background: 'transparent',
                        color: '#03C75A',
                        border: '1px solid #03C75A',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#03C75A';
                        e.currentTarget.style.color = 'white';
                        const svg = e.currentTarget.querySelector('svg path');
                        if (svg) (svg as SVGPathElement).setAttribute('fill', 'white');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#03C75A';
                        const svg = e.currentTarget.querySelector('svg path');
                        if (svg) (svg as SVGPathElement).setAttribute('fill', '#03C75A');
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15L7 10H10V3H14V10H17L12 15Z" fill="#03C75A"/>
                        <path d="M20 18H4V20H20V18Z" fill="#03C75A"/>
                      </svg>
                      네이버
                    </button>
                    <button
                      onClick={() => {
                        // 카카오 다운로드 로직 추가 예정
                        alert('카카오 양식 다운로드 기능 준비 중입니다.');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '4px 8px',
                        background: 'transparent',
                        color: '#191919',
                        border: '1px solid #191919',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#191919';
                        e.currentTarget.style.color = 'white';
                        const svg = e.currentTarget.querySelector('svg path');
                        if (svg) (svg as SVGPathElement).setAttribute('fill', 'white');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#191919';
                        const svg = e.currentTarget.querySelector('svg path');
                        if (svg) (svg as SVGPathElement).setAttribute('fill', '#191919');
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15L7 10H10V3H14V10H17L12 15Z" fill="#191919"/>
                        <path d="M20 18H4V20H20V18Z" fill="#191919"/>
                      </svg>
                      카카오
                    </button>
                  </div>
                </th>
              </tr>
              {/* 두 번째 행 */}
              <tr style={{ background: '#f8f9fa', height: '36px' }}>
                {optionCount >= 1 && (
                  <th style={{
                    padding: '6px 8px',
                    textAlign: 'center',
                    borderBottom: '2px solid #dee2e6',
                    width: '120px'
                  }}>
                    <input
                      type="text"
                      value={option1Header}
                      onChange={(e) => setOption1Header(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'center',
                        background: '#ffffff'
                      }}
                    />
                  </th>
                )}
                {optionCount >= 2 && (
                  <th style={{
                    padding: '6px 8px',
                    textAlign: 'center',
                    borderBottom: '2px solid #dee2e6',
                    width: '120px'
                  }}>
                    <input
                      type="text"
                      value={option2Header}
                      onChange={(e) => setOption2Header(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'center',
                        background: '#ffffff'
                      }}
                    />
                  </th>
                )}
                {optionCount >= 3 && (
                  <th style={{
                    padding: '6px 8px',
                    textAlign: 'center',
                    borderBottom: '2px solid #dee2e6',
                    width: '120px'
                  }}>
                    <input
                      type="text"
                      value={option3Header}
                      onChange={(e) => setOption3Header(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'center',
                        background: '#ffffff'
                      }}
                    />
                  </th>
                )}
                <th style={{
                  padding: '6px 8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  width: '120px'
                }}>
                  옵션가
                </th>
                <th style={{
                  padding: '6px 8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  width: '100px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        const quantity = prompt('모든 옵션에 적용할 재고수량을 입력하세요:');
                        if (quantity !== null && quantity.trim() !== '') {
                          const value = quantity.replace(/[^0-9]/g, '');
                          if (value) {
                            setOptions(prevOptions =>
                              prevOptions.map(opt => ({
                                ...opt,
                                stockQuantity: value
                              }))
                            );
                          }
                        }
                      }}
                      style={{
                        padding: '2px 6px',
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      일괄입력
                    </button>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057'
                    }}>
                      재고수량
                    </span>
                  </div>
                </th>
                <th style={{
                  padding: '6px 8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  width: '120px'
                }}>
                  관리코드
                </th>
                <th style={{
                  padding: '6px 8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#495057',
                  borderBottom: '2px solid #dee2e6',
                  width: '80px'
                }}>
                  사용여부
                </th>
              </tr>
            </thead>
            <tbody>
              {options.map((option, index) => (
                <tr key={option.id} style={{
                  borderBottom: '1px solid #f1f3f5'
                }}>
                  {/* 선택 */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedOptionIds.has(option.id)}
                      onChange={() => toggleSelection(option.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  {/* 순서 */}
                  <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        style={{
                          padding: '2px',
                          background: 'transparent',
                          border: 'none',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 6L15 11L14 12L10 8L6 12L5 11L10 6Z" fill={index === 0 ? '#adb5bd' : '#495057'}/>
                        </svg>
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === options.length - 1}
                        style={{
                          padding: '2px',
                          background: 'transparent',
                          border: 'none',
                          cursor: index === options.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 14L5 9L6 8L10 12L14 8L15 9L10 14Z" fill={index === options.length - 1 ? '#adb5bd' : '#495057'}/>
                        </svg>
                      </button>
                    </div>
                  </td>
                  {/* 기준설정 */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input
                      type="radio"
                      name="baseOption"
                      checked={baseOptionId === option.id}
                      onChange={() => setBaseOptionId(option.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#dc3545'
                      }}
                    />
                  </td>
                  {/* 옵션상품 */}
                  <td style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => updateOption(option.id, 'name', e.target.value)}
                      placeholder="옵션상품명"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                    />
                  </td>
                  {/* 판매가(원) */}
                  <td style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={option.price ? parseInt(option.price).toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        updateOption(option.id, 'price', value);
                      }}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        textAlign: 'right'
                      }}
                    />
                  </td>
                  {/* 옵션1 */}
                  {optionCount >= 1 && (
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        value={option.option1}
                        onChange={(e) => updateOption(option.id, 'option1', e.target.value)}
                        placeholder="옵션1"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          textAlign: 'center'
                        }}
                      />
                    </td>
                  )}
                  {/* 옵션2 */}
                  {optionCount >= 2 && (
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        value={option.option2}
                        onChange={(e) => updateOption(option.id, 'option2', e.target.value)}
                        placeholder="옵션2"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          textAlign: 'center'
                        }}
                      />
                    </td>
                  )}
                  {/* 옵션3 */}
                  {optionCount >= 3 && (
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        value={option.option3}
                        onChange={(e) => updateOption(option.id, 'option3', e.target.value)}
                        placeholder="옵션3"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          textAlign: 'center'
                        }}
                      />
                    </td>
                  )}
                  {/* 옵션가 */}
                  <td style={{ padding: '8px' }}>
                    {(() => {
                      const isWarning = sellingPrice && option.optionPrice &&
                        Math.abs(parseInt(option.optionPrice)) > (parseInt(sellingPrice) * 0.5);

                      return (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={option.optionPrice ? (parseInt(option.optionPrice) >= 0 ? parseInt(option.optionPrice).toLocaleString() : '-' + Math.abs(parseInt(option.optionPrice)).toLocaleString()) : ''}
                            readOnly
                            disabled
                            placeholder="0"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: isWarning ? '2px solid #dc3545' : '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '13px',
                              textAlign: 'right',
                              background: isWarning ? '#fff5f5' : '#f8f9fa',
                              color: isWarning ? '#dc3545' : '#495057',
                              cursor: 'not-allowed',
                              fontWeight: isWarning ? '600' : 'normal'
                            }}
                          />
                          {isWarning && (
                            <span style={{
                              position: 'absolute',
                              left: '20%',
                              fontSize: '16px',
                              color: '#dc3545',
                              pointerEvents: 'none'
                            }} title="옵션가가 판매가의 50%를 초과합니다">
                              ⚠️
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  {/* 재고수량 */}
                  <td style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={option.stockQuantity ? parseInt(option.stockQuantity).toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        updateOption(option.id, 'stockQuantity', value);
                      }}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        textAlign: 'right'
                      }}
                    />
                  </td>
                  {/* 관리코드 */}
                  <td style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={option.managementCode}
                      onChange={(e) => updateOption(option.id, 'managementCode', e.target.value)}
                      placeholder="코드"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                    />
                  </td>
                  {/* 사용여부 */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={option.isActive}
                      onChange={(e) => updateOption(option.id, 'isActive', e.target.checked.toString())}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 버튼 영역 */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={addOption}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + 행추가
            </button>
            <button
              onClick={removeSelectedOptions}
              disabled={selectedOptionIds.size === 0}
              style={{
                padding: '8px 16px',
                background: selectedOptionIds.size === 0 ? '#e9ecef' : '#dc3545',
                color: selectedOptionIds.size === 0 ? '#adb5bd' : '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: selectedOptionIds.size === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedOptionIds.size === 0 ? 0.6 : 1
              }}
            >
              선택삭제
            </button>
          </div>
        </div>
      </div>

      {/* 요약 정보 */}
      {baseOptionId && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #dee2e6',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <div style={{
              fontSize: '13px',
              color: '#6c757d',
              marginBottom: '6px'
            }}>
              기준 옵션
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#212529'
            }}>
              {options.find(opt => opt.id === baseOptionId)?.name || '-'}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '13px',
              color: '#6c757d',
              marginBottom: '6px'
            }}>
              기준 가격
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#2563eb'
            }}>
              {options.find(opt => opt.id === baseOptionId)?.price
                ? parseFloat(options.find(opt => opt.id === baseOptionId)!.price).toLocaleString()
                : '0'}원
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '13px',
              color: '#6c757d',
              marginBottom: '6px'
            }}>
              전체 옵션 수
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#212529'
            }}>
              {options.length}개
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '13px',
              color: '#6c757d',
              marginBottom: '6px'
            }}>
              가격 범위
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#212529'
            }}>
              {(() => {
                const prices = options
                  .filter(opt => opt.price)
                  .map(opt => parseFloat(opt.price));
                if (prices.length === 0) return '-';
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                return `${min.toLocaleString()} ~ ${max.toLocaleString()}원`;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      {!baseOptionId && options.some(opt => opt.price) && (
        <div style={{
          background: '#fff3cd',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #ffc107',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#856404',
            fontWeight: '500'
          }}>
            ⚠️ 기준 옵션을 선택하면 차액이 자동으로 계산됩니다
          </div>
        </div>
      )}
    </div>
  );
}
