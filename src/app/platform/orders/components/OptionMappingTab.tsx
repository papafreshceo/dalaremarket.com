'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface OptionMappingTabProps {
  isMobile: boolean;
}

interface CategoryItem {
  category3: string;
  category4: string;
}

interface OptionProduct {
  id: number;
  option_name: string;
  category3: string;
  category4: string;
  specification_1?: string;
  specification_2?: string;
  specification_3?: string;
}

interface MappingData {
  [optionName: string]: string; // optionName -> userOptionName
}

interface ColumnData {
  [productId: number]: string;
}

export default function OptionMappingTab({ isMobile }: OptionMappingTabProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [optionProducts, setOptionProducts] = useState<OptionProduct[]>([]);
  const [mappings, setMappings] = useState<MappingData>({});
  const [column1Data, setColumn1Data] = useState<ColumnData>({});
  const [column2Data, setColumn2Data] = useState<ColumnData>({});
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showBulkInputModal, setShowBulkInputModal] = useState(false);
  const [bulkInputColumn, setBulkInputColumn] = useState<1 | 2>(1);
  const [bulkInputValue, setBulkInputValue] = useState('');
  const [autoFillModeColumn1, setAutoFillModeColumn1] = useState(0);
  const [autoFillModeColumn2, setAutoFillModeColumn2] = useState(0);
  const [columnOrder, setColumnOrder] = useState<{[key: string]: number}>({
    column1: 1,
    column2: 2,
    spec1: 3,
    spec2: 4,
    spec3: 5
  });
  const [autoFillEnabled, setAutoFillEnabled] = useState(false);
  const [isRightColumnsExpanded, setIsRightColumnsExpanded] = useState(false);
  const [categoryMappingCounts, setCategoryMappingCounts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchOrganizationId();
  }, []);

  useEffect(() => {
    if (organizationId) {
      fetchCategories();
      fetchAllMappingCounts();
    }
  }, [organizationId]);

  useEffect(() => {
    if (selectedCategory && organizationId) {
      fetchOptionProducts();
      fetchMappings();
    }
  }, [selectedCategory, organizationId]);

  // 칼럼1, 칼럼2, 규격1,2,3 값이 변경되면 판매자 옵션상품명 자동 채우기
  useEffect(() => {
    if (autoFillEnabled && optionProducts.length > 0) {
      const newMappings: MappingData = {};

      optionProducts.forEach((product) => {
        // 칼럼별 값 수집
        const columnValues: {[key: string]: string} = {
          column1: column1Data[product.id] || '',
          column2: column2Data[product.id] || '',
          spec1: product.specification_1 || '',
          spec2: product.specification_2 || '',
          spec3: product.specification_3 || ''
        };

        // 순서대로 정렬하여 값 추출
        const sortedColumns = Object.entries(columnOrder)
          .sort(([, orderA], [, orderB]) => orderA - orderB)
          .map(([key]) => columnValues[key])
          .filter(v => v && v.trim().length > 0); // 빈 값 제외

        if (sortedColumns.length > 0) {
          newMappings[product.option_name] = sortedColumns.join(' ');
        }
      });

      setMappings(newMappings);
    }
  }, [column1Data, column2Data, optionProducts, columnOrder, autoFillEnabled]);

  const fetchOrganizationId = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);

      const { data: userData } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', user.id)
        .single();

      setOrganizationId(userData?.primary_organization_id || null);
    } catch (error) {
      console.error('조직 정보 조회 오류:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);

      // API를 통해 상품 조회 (View 사용)
      const response = await fetch('/api/products/all');
      const { success, products, error } = await response.json();

      if (!success) {
        console.error('상품 조회 오류:', error);
        throw new Error(error);
      }

      if (!products || products.length === 0) {
        setCategories([]);
        setLoading(false);
        return;
      }

      // 중복 제거 (category_3, category_4 사용)
      const uniqueCategories = Array.from(
        new Map(
          products
            .filter((item: any) => item.category_3 && item.category_4)
            .map((item: any) => [
              `${item.category_3}/${item.category_4}`,
              { category3: item.category_3, category4: item.category_4 }
            ])
        ).values()
      ).sort((a, b) => {
        // 카테고리3 오름차순, 같으면 카테고리4 오름차순
        const cat3Diff = a.category3.localeCompare(b.category3, 'ko');
        if (cat3Diff !== 0) return cat3Diff;
        return a.category4.localeCompare(b.category4, 'ko');
      });

      setCategories(uniqueCategories);

      // 첫 번째 카테고리 자동 선택
      if (uniqueCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(uniqueCategories[0]);
      }
    } catch (error) {
      console.error('품목 목록 조회 오류:', error);
      toast.error('품목 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptionProducts = async () => {
    if (!selectedCategory) return;

    try {
      // API를 통해 상품 조회
      const response = await fetch('/api/products/all');
      const { success, products, error } = await response.json();

      if (!success) {
        console.error('상품 조회 오류:', error);
        throw new Error(error);
      }

      // 선택된 카테고리에 맞는 옵션상품 필터링
      const filtered = (products || [])
        .filter((p: any) =>
          p.category_3 === selectedCategory.category3 &&
          p.category_4 === selectedCategory.category4
        )
        .map((p: any) => ({
          id: p.id,
          option_name: p.option_name,
          category3: p.category_3,
          category4: p.category_4,
          specification_1: p.specification_1,
          specification_2: p.specification_2,
          specification_3: p.specification_3
        }))
        .sort((a: any, b: any) => a.option_name.localeCompare(b.option_name));

      setOptionProducts(filtered);
    } catch (error) {
      console.error('옵션상품 조회 오류:', error);
      toast.error('옵션상품을 불러오는데 실패했습니다.');
    }
  };

  const fetchMappings = async () => {
    if (!selectedCategory || !organizationId) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('option_name_mappings')
        .select('site_option_name, user_option_name')
        .eq('organization_id', organizationId);

      if (error && error.code !== '42P01') throw error;

      const mappingMap: MappingData = {};
      (data || []).forEach(item => {
        mappingMap[item.site_option_name] = item.user_option_name;
      });

      setMappings(mappingMap);
    } catch (error) {
      console.error('매핑 정보 조회 오류:', error);
    }
  };

  const fetchAllMappingCounts = async () => {
    if (!organizationId) return;

    try {
      const supabase = createClient();

      // 전체 매핑 조회
      const { data: allMappings, error: mappingError } = await supabase
        .from('option_name_mappings')
        .select('site_option_name')
        .eq('organization_id', organizationId);

      if (mappingError && mappingError.code !== '42P01') throw mappingError;

      // 전체 상품 조회
      const response = await fetch('/api/products/all');
      const { success, products } = await response.json();

      if (!success || !products) return;

      // 매핑된 site_option_name 목록
      const mappedOptionNames = new Set(
        (allMappings || []).map(m => m.site_option_name)
      );

      // 카테고리별로 매핑된 옵션 개수 카운트
      const counts: {[key: string]: number} = {};

      products.forEach((product: any) => {
        if (product.category_3 && product.category_4) {
          const categoryKey = `${product.category_3}/${product.category_4}`;

          if (!counts[categoryKey]) {
            counts[categoryKey] = 0;
          }

          // 이 옵션상품이 매핑되어 있으면 카운트 증가
          if (mappedOptionNames.has(product.option_name)) {
            counts[categoryKey]++;
          }
        }
      });

      setCategoryMappingCounts(counts);
    } catch (error) {
      console.error('매핑 개수 조회 오류:', error);
    }
  };

  const handleMappingChange = (optionName: string, value: string) => {
    setMappings(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleSave = async () => {
    if (!organizationId) {
      toast.error('조직 정보를 찾을 수 없습니다.');
      return;
    }

    if (!userId) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const supabase = createClient();

      // 현재 선택된 카테고리의 옵션상품에 대한 매핑만 저장
      const mappingsToSave = optionProducts
        .filter(product => mappings[product.option_name]?.trim())
        .map(product => ({
          seller_id: userId,
          organization_id: organizationId,
          site_option_name: product.option_name,
          user_option_name: mappings[product.option_name].trim()
        }));

      if (mappingsToSave.length === 0) {
        toast.error('저장할 매핑이 없습니다.');
        return;
      }

      // 기존 매핑 삭제 후 재생성 (upsert)
      const optionNames = mappingsToSave.map(m => m.site_option_name);

      const { error: deleteError } = await supabase
        .from('option_name_mappings')
        .delete()
        .eq('organization_id', organizationId)
        .in('site_option_name', optionNames);

      if (deleteError) {
        console.error('기존 매핑 삭제 오류:', deleteError);
      }

      const { data: insertData, error } = await supabase
        .from('option_name_mappings')
        .insert(mappingsToSave)
        .select();

      if (error) {
        console.error('매핑 저장 상세 오류:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: JSON.stringify(error)
        });
        throw new Error(`매핑 저장 실패: ${error.message || error.code || '알 수 없는 오류'}`);
      }

      toast.success('매핑이 저장되었습니다.');
      fetchMappings();
      fetchAllMappingCounts(); // 저장 후 카운트 업데이트
    } catch (error: any) {
      console.error('매핑 저장 오류:', error);
      toast.error(`매핑 저장에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleBulkInputColumn1 = () => {
    setBulkInputColumn(1);
    setBulkInputValue('');
    setShowBulkInputModal(true);
  };

  const handleBulkInputColumn2 = () => {
    setBulkInputColumn(2);
    setBulkInputValue('');
    setShowBulkInputModal(true);
  };

  const handleBulkInputConfirm = () => {
    if (bulkInputValue.trim()) {
      const newData: ColumnData = {};
      optionProducts.forEach(product => {
        newData[product.id] = bulkInputValue.trim();
      });

      if (bulkInputColumn === 1) {
        setColumn1Data(newData);
      } else {
        setColumn2Data(newData);
      }

      setShowBulkInputModal(false);
      setBulkInputValue('');
    }
  };

  const handleBulkInputCancel = () => {
    setShowBulkInputModal(false);
    setBulkInputValue('');
  };

  const handleAutoFillSellerNames = () => {
    if (optionProducts.length > 0) {
      const newMappings: MappingData = {};

      optionProducts.forEach((product) => {
        // 칼럼별 값 수집
        const columnValues: {[key: string]: string} = {
          column1: column1Data[product.id] || '',
          column2: column2Data[product.id] || '',
          spec1: product.specification_1 || '',
          spec2: product.specification_2 || '',
          spec3: product.specification_3 || ''
        };

        // 순서대로 정렬하여 값 추출
        const sortedColumns = Object.entries(columnOrder)
          .sort(([, orderA], [, orderB]) => orderA - orderB)
          .map(([key]) => columnValues[key])
          .filter(v => v && v.trim().length > 0); // 빈 값 제외

        if (sortedColumns.length > 0) {
          newMappings[product.option_name] = sortedColumns.join(' ');
        }
      });

      setMappings(newMappings);
    }
  };

  // 옵션상품명에서 중량 데이터 추출 (500g, 1kg, 300ml 등)
  const extractWeight = (optionName: string): string => {
    const weightMatch = optionName.match(/(\d+\.?\d*)\s?(g|kg|ml|l|cc|개입|입|ea|매|P|p)/i);
    if (weightMatch) {
      return weightMatch[0];
    }
    return '';
  };

  // 옵션상품명에서 맨 앞 구분 문자 추출
  const extractFirstDistinguishing = (optionName: string): string => {
    const words = optionName.split(/[\s,\/\-()]+/).filter(w => w.trim().length > 0);
    return words[0] || '';
  };

  const handleAutoFillColumn1 = () => {
    const newData: ColumnData = {};
    const currentMode = autoFillModeColumn1;

    optionProducts.forEach((product) => {
      let value = '';

      switch (currentMode) {
        case 0: // 중량 데이터 추출
          value = extractWeight(product.option_name) || product.specification_1 || product.specification_2 || product.specification_3 || '';
          break;
        case 1: // 카테고리3
          value = product.category3 || '';
          break;
        case 2: // 카테고리4
          value = product.category4 || '';
          break;
        case 3: // 맨 앞 구분 문자
          value = extractFirstDistinguishing(product.option_name);
          break;
      }

      if (value) {
        newData[product.id] = value;
      }
    });

    setColumn1Data(newData);
    // 다음 모드로 전환 (0 -> 1 -> 2 -> 3 -> 0 ...)
    setAutoFillModeColumn1((currentMode + 1) % 4);
  };

  const handleAutoFillColumn2 = () => {
    const newData: ColumnData = {};
    const currentMode = autoFillModeColumn2;

    optionProducts.forEach((product) => {
      let value = '';

      switch (currentMode) {
        case 0: // 중량 데이터 추출
          value = extractWeight(product.option_name) || product.specification_1 || product.specification_2 || product.specification_3 || '';
          break;
        case 1: // 카테고리3
          value = product.category3 || '';
          break;
        case 2: // 카테고리4
          value = product.category4 || '';
          break;
        case 3: // 맨 앞 구분 문자
          value = extractFirstDistinguishing(product.option_name);
          break;
      }

      if (value) {
        newData[product.id] = value;
      }
    });

    setColumn2Data(newData);
    // 다음 모드로 전환 (0 -> 1 -> 2 -> 3 -> 0 ...)
    setAutoFillModeColumn2((currentMode + 1) % 4);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 180px)', minHeight: '600px', width: '1440px', margin: '0 auto' }}>
      {/* 왼쪽: 품목 목록 */}
      <div style={{
        width: '280px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-background-secondary)',
          flexShrink: 0
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-text)'
          }}>
            품목
          </h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)'
            }}>
              로딩 중...
            </div>
          ) : categories.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '14px'
            }}>
              등록된 품목이 없습니다.
            </div>
          ) : (
            categories.map((category, index) => {
              const isSelected = selectedCategory?.category3 === category.category3
                && selectedCategory?.category4 === category.category4;
              const categoryKey = `${category.category3}/${category.category4}`;
              const mappingCount = categoryMappingCounts[categoryKey] || 0;

              return (
                <div
                  key={index}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-primary-light, rgba(37, 99, 235, 0.1))' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--color-primary, #2563eb)' : '3px solid transparent',
                    transition: 'all 0.2s',
                    fontSize: '14px',
                    color: isSelected ? 'var(--color-primary, #2563eb)' : 'var(--color-text)',
                    fontWeight: isSelected ? '600' : '400',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--color-surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span>{category.category3} / {category.category4}</span>
                  {mappingCount > 0 && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'white',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {mappingCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 오른쪽: 옵션상품 매핑 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
        {/* 일괄입력 미니 모달 */}
        {showBulkInputModal && (
          <div style={{
            position: 'absolute',
            top: '25px',
            left: bulkInputColumn === 1 ? '280px' : '365px',
            zIndex: 1000,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-primary, #2563eb)',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--color-text)',
              whiteSpace: 'nowrap'
            }}>
              칼럼{bulkInputColumn}:
            </span>
            <input
              type="text"
              value={bulkInputValue}
              onChange={(e) => setBulkInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBulkInputConfirm();
                } else if (e.key === 'Escape') {
                  handleBulkInputCancel();
                }
              }}
              placeholder="값 입력"
              autoFocus
              style={{
                width: '120px',
                padding: '4px 6px',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                fontSize: '11px',
                background: 'var(--color-background)',
                color: 'var(--color-text)',
                outline: 'none'
              }}
            />
            <button
              onClick={handleBulkInputConfirm}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '500',
                color: 'white',
                background: '#2563eb',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              확인
            </button>
            <button
              onClick={handleBulkInputCancel}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '500',
                color: 'var(--color-text)',
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              취소
            </button>
          </div>
        )}

        {/* 상단: 헤더 + 저장 버튼 */}
        <div style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '4px'
            }}>
              {selectedCategory
                ? `${selectedCategory.category3} / ${selectedCategory.category4}`
                : '품목을 선택해주세요'
              }
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)'
            }}>
              판매자 옵션상품명을 입력하고 저장 버튼을 클릭하세요.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={!selectedCategory || optionProducts.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: selectedCategory && optionProducts.length > 0
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                : 'var(--color-border)',
              color: selectedCategory && optionProducts.length > 0 ? 'white' : 'var(--color-text-secondary)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: selectedCategory && optionProducts.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedCategory && optionProducts.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Save size={16} />
            저장
          </button>
        </div>

        {/* 칼럼 순서 조절 - 우측 칼럼 펼쳤을 때만 표시 */}
        {isRightColumnsExpanded && (
          <div style={{
            marginBottom: '12px',
            padding: '10px 12px',
            background: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text)',
              whiteSpace: 'nowrap'
            }}>
              순서 조절:
            </span>
            {[
              { key: 'column1', label: '칼럼1' },
              { key: 'column2', label: '칼럼2' },
              { key: 'spec1', label: '규격1' },
              { key: 'spec2', label: '규격2' },
              { key: 'spec3', label: '규격3' }
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap'
                }}>
                  {label}
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={columnOrder[key]}
                  onChange={(e) => {
                    const newOrder = parseInt(e.target.value) || 1;
                    setColumnOrder(prev => ({ ...prev, [key]: Math.min(5, Math.max(1, newOrder)) }));
                  }}
                  style={{
                    width: '35px',
                    padding: '3px 4px',
                    fontSize: '11px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    textAlign: 'center',
                    background: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* 옵션상품 테이블 */}
        <div style={{
          flex: 1,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {!selectedCategory ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '14px'
            }}>
              왼쪽에서 품목을 선택해주세요.
            </div>
          ) : optionProducts.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '14px'
            }}>
              해당 품목에 등록된 옵션상품이 없습니다.
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  background: 'var(--color-background-secondary)',
                  zIndex: 1
                }}>
                  <tr>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      borderBottom: '2px solid var(--color-border)',
                      width: '180px'
                    }}>
                      옵션상품
                    </th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      borderBottom: '2px solid var(--color-border)',
                      width: '250px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>판매자 옵션상품명</span>
                        <button
                          onClick={handleAutoFillSellerNames}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            color: 'white',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          자동
                        </button>
                        <button
                          onClick={() => setIsRightColumnsExpanded(!isRightColumnsExpanded)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            color: 'white',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {isRightColumnsExpanded ? '접기' : '펼치기'}
                        </button>
                      </div>
                    </th>
                    {isRightColumnsExpanded && (
                      <>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      borderBottom: '2px solid var(--color-border)',
                      width: '120px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '3px', justifyContent: 'center' }}>
                        <button
                          onClick={handleBulkInputColumn1}
                          style={{
                            padding: '2px 5px',
                            fontSize: '10px',
                            fontWeight: '500',
                            color: 'white',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          일괄
                        </button>
                        <button
                          onClick={handleAutoFillColumn1}
                          style={{
                            padding: '2px 5px',
                            fontSize: '10px',
                            fontWeight: '500',
                            color: 'white',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          자동
                        </button>
                      </div>
                    </th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      borderBottom: '2px solid var(--color-border)',
                      width: '120px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '3px', justifyContent: 'center' }}>
                        <button
                          onClick={handleBulkInputColumn2}
                          style={{
                            padding: '2px 5px',
                            fontSize: '10px',
                            fontWeight: '500',
                            color: 'white',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          일괄
                        </button>
                        <button
                          onClick={handleAutoFillColumn2}
                          style={{
                            padding: '2px 5px',
                            fontSize: '10px',
                            fontWeight: '500',
                            color: 'white',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          자동
                        </button>
                      </div>
                    </th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      borderBottom: '2px solid var(--color-border)',
                      width: '100px'
                    }}>
                      규격1
                    </th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      borderBottom: '2px solid var(--color-border)',
                      width: '100px'
                    }}>
                      규격2
                    </th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      borderBottom: '2px solid var(--color-border)',
                      width: '100px'
                    }}>
                      규격3
                    </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {optionProducts.map((product) => (
                    <tr key={product.id} style={{
                      borderBottom: '1px solid var(--color-border)'
                    }}>
                      <td style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: 'var(--color-text)',
                        fontWeight: '500'
                      }}>
                        {product.option_name}
                      </td>
                      <td style={{
                        padding: '6px 12px'
                      }}>
                        <input
                          type="text"
                          value={mappings[product.option_name] || ''}
                          onChange={(e) => handleMappingChange(product.option_name, e.target.value)}
                          placeholder="판매자 옵션상품명 입력"
                          style={{
                            width: '100%',
                            padding: '5px 10px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            fontSize: '13px',
                            background: 'var(--color-background)',
                            color: 'var(--color-text)',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            height: '28px'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                          }}
                        />
                      </td>
                      {isRightColumnsExpanded && (
                        <>
                      <td style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: 'var(--color-text)',
                        textAlign: 'center'
                      }}>
                        {column1Data[product.id] || ''}
                      </td>
                      <td style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: 'var(--color-text)',
                        textAlign: 'center'
                      }}>
                        {column2Data[product.id] || ''}
                      </td>
                      <td style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: 'var(--color-text)',
                        textAlign: 'center'
                      }}>
                        {product.specification_1 || '-'}
                      </td>
                      <td style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: 'var(--color-text)',
                        textAlign: 'center'
                      }}>
                        {product.specification_2 || '-'}
                      </td>
                      <td style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: 'var(--color-text)',
                        textAlign: 'center'
                      }}>
                        {product.specification_3 || '-'}
                      </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          flexShrink: 0
        }}>
          💡 <strong>사용 방법:</strong> 판매자님이 사용하시는 옵션상품명을 입력하고 저장하면, 발주서 업로드 시 자동으로 표준 옵션상품으로 변환됩니다.
        </div>
      </div>
    </div>
  );
}
