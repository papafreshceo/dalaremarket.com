// src/components/tools/OptionPricing.jsx
import { useState } from 'react';

function OptionPricing() {
  const [basePrice, setBasePrice] = useState('10000');
  const [pricingMethod, setPricingMethod] = useState('fixed'); // fixed, percentage, tiered
  
  const [options, setOptions] = useState([
    { 
      id: 1, 
      category: '사이즈',
      items: [
        { id: 1, name: 'S', priceAdjust: 0, stock: 100 },
        { id: 2, name: 'M', priceAdjust: 0, stock: 150 },
        { id: 3, name: 'L', priceAdjust: 1000, stock: 120 },
        { id: 4, name: 'XL', priceAdjust: 2000, stock: 80 }
      ]
    },
    {
      id: 2,
      category: '색상',
      items: [
        { id: 1, name: '블랙', priceAdjust: 0, stock: 200 },
        { id: 2, name: '화이트', priceAdjust: 0, stock: 180 },
        { id: 3, name: '네이비', priceAdjust: 500, stock: 100 },
        { id: 4, name: '베이지', priceAdjust: 500, stock: 90 }
      ]
    }
  ]);

  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [presets, setPresets] = useState([
    { id: 1, name: '기본 가격', value: 0 },
    { id: 2, name: '프리미엄 (+10%)', value: 10 },
    { id: 3, name: '할인 (-20%)', value: -20 }
  ]);

  const addOption = () => {
    const newId = Math.max(...options.map(o => o.id), 0) + 1;
    setOptions([...options, {
      id: newId,
      category: `옵션 ${newId}`,
      items: [{ id: 1, name: '항목 1', priceAdjust: 0, stock: 0 }]
    }]);
  };

  const addOptionItem = (optionId) => {
    setOptions(options.map(opt => {
      if (opt.id === optionId) {
        const newId = Math.max(...opt.items.map(i => i.id), 0) + 1;
        return {
          ...opt,
          items: [...opt.items, { 
            id: newId, 
            name: `항목 ${newId}`, 
            priceAdjust: 0, 
            stock: 0 
          }]
        };
      }
      return opt;
    }));
  };

  const updateOptionItem = (optionId, itemId, field, value) => {
    setOptions(options.map(opt => {
      if (opt.id === optionId) {
        return {
          ...opt,
          items: opt.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
          )
        };
      }
      return opt;
    }));
  };

  const deleteOptionItem = (optionId, itemId) => {
    setOptions(options.map(opt => {
      if (opt.id === optionId) {
        return {
          ...opt,
          items: opt.items.filter(item => item.id !== itemId)
        };
      }
      return opt;
    }));
  };

  const applyBulkPricing = (adjustment) => {
    if (selectedItems.length === 0) return;
    
    setOptions(options.map(opt => ({
      ...opt,
      items: opt.items.map(item => {
        const itemKey = `${opt.id}-${item.id}`;
        if (selectedItems.includes(itemKey)) {
          if (pricingMethod === 'percentage') {
            const base = parseFloat(basePrice) || 0;
            return { ...item, priceAdjust: base * (adjustment / 100) };
          } else {
            return { ...item, priceAdjust: adjustment };
          }
        }
        return item;
      })
    })));
    setSelectedItems([]);
    setBulkEditMode(false);
  };

  const toggleItemSelection = (optionId, itemId) => {
    const itemKey = `${optionId}-${itemId}`;
    setSelectedItems(prev => 
      prev.includes(itemKey) 
        ? prev.filter(key => key !== itemKey)
        : [...prev, itemKey]
    );
  };

  const calculateFinalPrice = (item) => {
    const base = parseFloat(basePrice) || 0;
    return base + item.priceAdjust;
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
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          옵션가 세팅
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          상품 옵션별로 가격과 재고를 효율적으로 관리하세요
        </p>
      </div>

      {/* 기본 설정 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>기본 설정</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: '#495057',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              기본 가격
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 30px 10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
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
              가격 조정 방식
            </label>
            <select
              value={pricingMethod}
              onChange={(e) => setPricingMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="fixed">고정 금액</option>
              <option value="percentage">퍼센트</option>
              <option value="tiered">단계별</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button
              onClick={() => setBulkEditMode(!bulkEditMode)}
              style={{
                flex: 1,
                padding: '10px',
                background: bulkEditMode ? '#ef4444' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {bulkEditMode ? '일괄 편집 취소' : '일괄 편집'}
            </button>
            <button
              onClick={addOption}
              style={{
                padding: '10px 16px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + 옵션 추가
            </button>
          </div>
        </div>

        {/* 빠른 설정 프리셋 */}
        {bulkEditMode && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#e7f3ff',
            borderRadius: '8px',
            border: '1px solid #2563eb'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
              빠른 가격 설정 ({selectedItems.length}개 선택됨)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {presets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyBulkPricing(preset.value)}
                  disabled={selectedItems.length === 0}
                  style={{
                    padding: '8px 16px',
                    background: selectedItems.length === 0 ? '#e9ecef' : '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: selectedItems.length === 0 ? 'default' : 'pointer'
                  }}
                >
                  {preset.name}
                </button>
              ))}
              <input
                type="number"
                placeholder="직접 입력"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    applyBulkPricing(parseFloat(e.target.value) || 0);
                    e.target.value = '';
                  }
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 옵션 목록 */}
      {options.map(option => (
        <div key={option.id} style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <input
              type="text"
              value={option.category}
              onChange={(e) => {
                setOptions(options.map(opt => 
                  opt.id === option.id ? { ...opt, category: e.target.value } : opt
                ));
              }}
              style={{
                fontSize: '16px',
                fontWeight: '600',
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: '4px',
                padding: '4px 8px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#dee2e6'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />
            <button
              onClick={() => addOptionItem(option.id)}
              style={{
                padding: '6px 12px',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              + 항목 추가
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                  {bulkEditMode && (
                    <th style={{ padding: '12px', width: '40px' }}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const optionItemKeys = option.items.map(item => `${option.id}-${item.id}`);
                          if (e.target.checked) {
                            setSelectedItems(prev => [...new Set([...prev, ...optionItemKeys])]);
                          } else {
                            setSelectedItems(prev => prev.filter(key => !optionItemKeys.includes(key)));
                          }
                        }}
                      />
                    </th>
                  )}
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>옵션명</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>추가금액</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>최종가격</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#495057' }}>재고</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {option.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                    {bulkEditMode && (
                      <td style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(`${option.id}-${item.id}`)}
                          onChange={() => toggleItemSelection(option.id, item.id)}
                        />
                      </td>
                    )}
                    <td style={{ padding: '12px' }}>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateOptionItem(option.id, item.id, 'name', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <input
                          type="number"
                          value={item.priceAdjust}
                          onChange={(e) => updateOptionItem(option.id, item.id, 'priceAdjust', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100px',
                            padding: '6px 24px 6px 8px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            textAlign: 'right',
                            outline: 'none'
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '12px',
                          color: '#6c757d'
                        }}>원</span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2563eb'
                    }}>
                      {calculateFinalPrice(item).toLocaleString()}원
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => updateOptionItem(option.id, item.id, 'stock', parseInt(e.target.value) || 0)}
                        style={{
                          width: '80px',
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '14px',
                          textAlign: 'right',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => deleteOptionItem(option.id, item.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* 저장 버튼 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '32px'
      }}>
        <button
          style={{
            padding: '12px 32px',
            background: '#ffffff',
            color: '#2563eb',
            border: '1px solid #2563eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          미리보기
        </button>
        <button
          style={{
            padding: '12px 32px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          옵션 저장
        </button>
      </div>
    </div>
  );
}

export default OptionPricing;