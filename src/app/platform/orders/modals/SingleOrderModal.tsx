// src/app/platform/orders/modals/SingleOrderModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { getCurrentTimeUTC } from '@/lib/date';
import { X } from 'lucide-react';

interface SingleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: {
    id: number;
    option_name: string;
    option_code?: string;
    seller_supply_price?: number;
    category_4?: string;
  } | null;
  onRefresh?: () => void;
  userEmail: string;
}

interface OptionProduct {
  id: number;
  option_name: string;
  option_code?: string;
  seller_supply_price?: number;
}

interface FormData {
  orderNumber: string;
  orderer: string;
  ordererPhone: string;
  recipient: string;
  recipientPhone: string;
  address: string;
  deliveryMessage: string;
  quantity: number;
  specialRequest: string;
}

export default function SingleOrderModal({
  isOpen,
  onClose,
  selectedProduct,
  onRefresh,
  userEmail
}: SingleOrderModalProps) {
  const [formData, setFormData] = useState<FormData>({
    orderNumber: '',
    orderer: '',
    ordererPhone: '',
    recipient: '',
    recipientPhone: '',
    address: '',
    deliveryMessage: '',
    quantity: 1,
    specialRequest: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionProducts, setOptionProducts] = useState<OptionProduct[]>([]);
  const [selectedOption, setSelectedOption] = useState<OptionProduct | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // 품목 목록 관리
  interface ProductMaster {
    id: string;
    category_3?: string;
    category_4?: string;
  }
  const [productMasters, setProductMasters] = useState<ProductMaster[]>([]);
  const [selectedProductMaster, setSelectedProductMaster] = useState<ProductMaster | null>(null);
  const [sameAsOrderer, setSameAsOrderer] = useState(false);
  const [showDetailAddressModal, setShowDetailAddressModal] = useState(false);
  const [baseAddress, setBaseAddress] = useState('');

  // 배지 색상 생성 함수 (다크모드 지원)
  const generateBadgeColor = () => {
    const colors = [
      {
        bg: 'rgba(14, 165, 233, 0.15)',
        text: 'rgb(14, 165, 233)',
        border: 'rgba(14, 165, 233, 0.3)'
      }, // blue
      {
        bg: 'rgba(34, 197, 94, 0.15)',
        text: 'rgb(34, 197, 94)',
        border: 'rgba(34, 197, 94, 0.3)'
      }, // green
      {
        bg: 'rgba(234, 179, 8, 0.15)',
        text: 'rgb(234, 179, 8)',
        border: 'rgba(234, 179, 8, 0.3)'
      }, // yellow
      {
        bg: 'rgba(236, 72, 153, 0.15)',
        text: 'rgb(236, 72, 153)',
        border: 'rgba(236, 72, 153, 0.3)'
      }, // pink
      {
        bg: 'rgba(168, 85, 247, 0.15)',
        text: 'rgb(168, 85, 247)',
        border: 'rgba(168, 85, 247, 0.3)'
      }, // purple
      {
        bg: 'rgba(249, 115, 22, 0.15)',
        text: 'rgb(249, 115, 22)',
        border: 'rgba(249, 115, 22, 0.3)'
      }, // orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 상품 배지 목록 관리
  interface ProductBadge {
    id: number;
    optionName: string;
    quantity: number;
    color: { bg: string; text: string; border: string };
  }

  const [productBadges, setProductBadges] = useState<ProductBadge[]>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null);

  // 옵션 선택 시 배지 추가 또는 수정
  const handleOptionSelect = (option: OptionProduct) => {
    setSelectedOption(option);

    // 선택된 배지가 있고 배지 목록에 존재하면 해당 배지의 옵션명 변경
    const selectedBadgeExists = productBadges.some(badge => badge.id === selectedBadgeId);

    if (selectedBadgeId !== null && selectedBadgeExists) {
      setProductBadges(prev =>
        prev.map(badge =>
          badge.id === selectedBadgeId
            ? { ...badge, optionName: option.option_name }
            : badge
        )
      );
    } else {
      // 선택된 배지가 없거나 배지가 없으면 새 배지 추가
      const newBadge: ProductBadge = {
        id: Date.now(),
        optionName: option.option_name,
        quantity: 1,
        color: generateBadgeColor()
      };
      setProductBadges(prev => [...prev, newBadge]);
      // 새로 추가된 배지를 선택 상태로 설정
      setSelectedBadgeId(newBadge.id);
    }
  };

  // 상품 추가 핸들러
  const handleAddProduct = () => {
    if (!selectedOption) {
      toast.error('옵션을 먼저 선택해주세요');
      return;
    }
    const newBadge: ProductBadge = {
      id: Date.now(),
      optionName: selectedOption.option_name,
      quantity: 1,
      color: generateBadgeColor()
    };
    setProductBadges(prev => [...prev, newBadge]);
    // 새로 추가된 배지를 선택 상태로 설정
    setSelectedBadgeId(newBadge.id);
  };

  // 상품 삭제 핸들러 (마지막 배지부터 삭제)
  const handleRemoveProduct = () => {
    if (productBadges.length > 0) {
      setProductBadges(prev => prev.slice(0, -1));
    }
  };

  // 배지 수량 변경 핸들러
  const handleBadgeQuantityChange = (id: number, newQuantity: number) => {
    setProductBadges(prev =>
      prev.map(badge =>
        badge.id === id ? { ...badge, quantity: Math.max(1, newQuantity) } : badge
      )
    );
  };

  // Daum 주소 검색 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 품목 목록 로드
  useEffect(() => {
    if (isOpen) {
      fetchProductMasters();
      // 페이지에서 선택한 품목이 있으면 설정
      if (selectedProduct) {
        setSelectedProductMaster(selectedProduct);
      }
      // 모달 열릴 때 주문자와 동일 체크박스 활성화
      setSameAsOrderer(true);
    }
  }, [isOpen, selectedProduct]);

  const fetchProductMasters = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products_master')
        .select('id, category_3, category_4, supply_status')
        .eq('supply_status', '출하중')
        .order('category_3', { ascending: true })
        .order('category_4', { ascending: true });

      if (error) {
        console.error('품목 조회 오류:', error);
        return;
      }

      console.log('품목 조회 결과:', data);
      setProductMasters(data || []);
    } catch (error) {
      console.error('품목 조회 실패:', error);
    }
  };

  // 품목 선택 시 옵션상품 로드
  useEffect(() => {
    console.log('selectedProductMaster changed:', selectedProductMaster);
    if (selectedProductMaster) {
      console.log('Fetching options for product:', selectedProductMaster.id);
      fetchOptionProducts(selectedProductMaster.id);
    } else {
      console.log('No product selected, clearing options');
      setOptionProducts([]);
    }
  }, [selectedProductMaster]);

  const fetchOptionProducts = async (productMasterId: string) => {
    console.log('fetchOptionProducts called with id:', productMasterId);
    if (!productMasterId) {
      console.log('No productMasterId provided, returning');
      return;
    }

    setLoadingOptions(true);
    const supabase = createClient();

    try {
      console.log('Querying option_products for product_master_id:', productMasterId);
      const { data, error } = await supabase
        .from('option_products')
        .select('id, option_name, option_code, seller_supply_price')
        .eq('product_master_id', productMasterId)
        .order('option_name', { ascending: true });

      if (error) {
        console.error('옵션상품 조회 오류:', error);
        setOptionProducts([]);
        setSelectedOption(null);
        return;
      }

      console.log('Options loaded:', data);
      console.log('Number of options:', data?.length || 0);
      setOptionProducts(data || []);

      // 첫 번째 옵션을 기본 선택
      if (data && data.length > 0) {
        console.log('Setting first option as default:', data[0]);
        setSelectedOption(data[0]);
      } else {
        console.log('No options found for this product');
        setSelectedOption(null);
      }
    } catch (error) {
      console.error('옵션상품 조회 실패:', error);
      setOptionProducts([]);
      setSelectedOption(null);
    } finally {
      setLoadingOptions(false);
      console.log('Loading options complete');
    }
  };

  // 모달이 닫힐 때 폼 초기화
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        orderNumber: '',
        orderer: '',
        ordererPhone: '',
        recipient: '',
        recipientPhone: '',
        address: '',
        deliveryMessage: '',
        quantity: 1,
        specialRequest: ''
      });
      setErrors({});
      setOptionProducts([]);
      setSelectedOption(null);
      setSameAsOrderer(false);
      // 모달 작업 내용 초기화
      setProductBadges([]);
      setSelectedBadgeId(null);
      setSelectedProductMaster(null);
      setProductMasters([]);
    }
  }, [isOpen]);

  // 주문자와 동일 체크박스 처리
  const handleSameAsOrderer = (checked: boolean) => {
    setSameAsOrderer(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        recipient: prev.orderer,
        recipientPhone: prev.ordererPhone
      }));
    }
  };

  // 주소 검색
  const handleAddressSearch = () => {
    if (typeof window === 'undefined') return;

    // @ts-ignore - Daum Postcode API
    new window.daum.Postcode({
      oncomplete: function(data: any) {
        // 기본 주소
        let fullAddress = data.address;
        let extraAddress = '';

        // 건물명이 있을 경우 추가
        if (data.addressType === 'R') {
          if (data.bname !== '') {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddress += (extraAddress !== '' ? ' (' + extraAddress + ')' : '');
        }

        // 기본 주소 저장하고 상세주소 입력 모달 띄우기
        setBaseAddress(fullAddress);
        setShowDetailAddressModal(true);
      }
    }).open();
  };

  // 상세주소 입력 완료
  const handleDetailAddressComplete = (detailAddress: string) => {
    const finalAddress = detailAddress ? `${baseAddress} ${detailAddress}` : baseAddress;
    handleChange('address', finalAddress);
    setShowDetailAddressModal(false);
    setBaseAddress('');
  };

  if (!isOpen) return null;

  // 공급가 계산 (모든 배지의 옵션과 수량 기반)
  const supplyPrice = productBadges.reduce((total, badge) => {
    // 배지의 옵션명으로 옵션상품 찾기
    const option = optionProducts.find(opt => opt.option_name === badge.optionName);
    const price = option?.seller_supply_price || 0;
    return total + (price * badge.quantity);
  }, 0);

  // 휴대폰 번호 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    let finalValue = value;

    // 휴대폰 번호 필드일 경우 포맷팅 적용
    if ((field === 'ordererPhone' || field === 'recipientPhone') && typeof value === 'string') {
      finalValue = formatPhoneNumber(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: finalValue
    }));

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.orderer.trim()) newErrors.orderer = '주문자명을 입력하세요';
    if (!formData.ordererPhone.trim()) newErrors.ordererPhone = '주문자 연락처를 입력하세요';
    if (!formData.recipient.trim()) newErrors.recipient = '수령인을 입력하세요';
    if (!formData.recipientPhone.trim()) newErrors.recipientPhone = '수령인 연락처를 입력하세요';
    if (!formData.address.trim()) newErrors.address = '배송지를 입력하세요';
    if (!formData.quantity || formData.quantity < 1) newErrors.quantity = '수량은 1개 이상이어야 합니다';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('필수 항목을 모두 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      if (!selectedOption) {
        toast.error('옵션을 선택해주세요');
        return;
      }

      // 주문번호 자동 생성
      const finalOrderNumber = `ORD-${Date.now()}`;

      const orderData = {
        seller_id: user.id,
        order_number: finalOrderNumber,
        orderer: formData.orderer,
        orderer_phone: formData.ordererPhone,
        recipient: formData.recipient,
        recipient_phone: formData.recipientPhone,
        address: formData.address,
        delivery_message: formData.deliveryMessage,
        option_name: selectedOption.option_name,
        option_code: selectedOption.option_code || '',
        quantity: formData.quantity,
        unit_price: unitPrice,
        supply_price: supplyPrice,
        special_request: formData.specialRequest,
        shipping_status: 'registered',
        created_at: getCurrentTimeUTC(),
        updated_at: getCurrentTimeUTC()
      };

      const { error } = await supabase
        .from('integrated_orders')
        .insert([orderData]);

      if (error) {
        console.error('주문 등록 오류:', error);
        toast.error('주문 등록에 실패했습니다');
        return;
      }

      toast.success('주문이 등록되었습니다');
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('주문 등록 실패:', error);
      toast.error('주문 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '16px',
          maxWidth: '1400px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--color-surface)',
          zIndex: 1
        }}>
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '4px'
            }}>
              주문 등록
            </h2>
            {selectedProductMaster && (
              <div style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)'
              }}>
                {selectedProductMaster.category_3 && `${selectedProductMaster.category_3} / `}
                {selectedProductMaster.category_4}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 폼 내용 - 3컬럼 레이아웃 */}
        <div style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          minHeight: 'calc(90vh - 180px)'
        }}>
          {/* 1. 옵션 상품 선택 영역 */}
          <div style={{
            padding: '16px',
            background: 'var(--color-background-secondary)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* 품목 드롭다운 */}
            <div style={{ marginBottom: '12px' }}>
              <select
                value={selectedProductMaster?.id || ''}
                onChange={(e) => {
                  console.log('Dropdown changed, selected value:', e.target.value);
                  const productId = e.target.value;
                  console.log('Product ID (string):', productId);
                  const product = productMasters.find(p => p.id === productId);
                  console.log('Found product:', product);
                  setSelectedProductMaster(product || null);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: 'pointer'
                }}
              >
                <option value="">품목을 선택하세요</option>
                {productMasters.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.category_3 && `${product.category_3} / `}{product.category_4}
                  </option>
                ))}
              </select>
            </div>

            {/* 옵션 버튼들 */}
            {selectedProductMaster ? (
              <div style={{ marginTop: '12px' }}>
                {loadingOptions ? (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)'
                  }}>
                    옵션 로딩 중...
                  </div>
                ) : optionProducts.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface)',
                    borderRadius: '6px'
                  }}>
                    등록된 옵션이 없습니다
                  </div>
                ) : (
                  <div>
                    {(() => {
                      // 옵션명의 앞부분(공백 전까지)으로 그룹화
                      const groups: { [key: string]: OptionProduct[] } = {};
                      optionProducts.forEach(option => {
                        const baseKey = option.option_name.split(' ')[0] || option.option_name;
                        if (!groups[baseKey]) {
                          groups[baseKey] = [];
                        }
                        groups[baseKey].push(option);
                      });

                      return Object.entries(groups).map(([baseKey, options], groupIndex) => (
                        <div key={baseKey} style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginBottom: groupIndex < Object.keys(groups).length - 1 ? '12px' : '0'
                        }}>
                          {options.map(option => (
                            <button
                              key={option.id}
                              onClick={() => handleOptionSelect(option)}
                              style={{
                                padding: '6px 12px',
                                border: selectedOption?.id === option.id
                                  ? '2px solid var(--color-primary)'
                                  : '1px solid var(--color-border)',
                                borderRadius: '6px',
                                background: selectedOption?.id === option.id
                                  ? 'var(--color-surface)'
                                  : 'var(--color-surface)',
                                color: selectedOption?.id === option.id
                                  ? 'var(--color-primary)'
                                  : 'var(--color-text)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: selectedOption?.id === option.id ? '600' : '500',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedOption?.id !== option.id) {
                                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedOption?.id !== option.id) {
                                  e.currentTarget.style.borderColor = 'var(--color-border)';
                                }
                              }}
                            >
                              {option.option_name} {option.seller_supply_price?.toLocaleString() || '0'}원
                            </button>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-surface)',
                borderRadius: '6px',
                marginTop: '12px'
              }}>
                품목을 선택하면 옵션이 표시됩니다
              </div>
            )}

            {/* 옵션명과 수량 배지 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {productBadges.map((badge) => (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadgeId(badge.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '6px',
                      background: badge.color.bg,
                      border: selectedBadgeId === badge.id ? `2px solid ${badge.color.border}` : `1px solid ${badge.color.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: selectedBadgeId === badge.id ? 1 : 0.6,
                      boxShadow: selectedBadgeId === badge.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    {/* 옵션명 표시 */}
                    <div style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: badge.color.text,
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '120px',
                      background: 'transparent',
                      minWidth: '50px'
                    }}>
                      {badge.optionName || '옵션 선택'}
                    </div>

                    {/* 수량 입력란 */}
                    <div style={{ position: 'relative', display: 'flex', background: 'transparent' }}>
                      <input
                        type="text"
                        value={badge.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value.replace(/[^\d]/g, '')) || 1;
                          handleBadgeQuantityChange(badge.id, value);
                        }}
                        style={{
                          width: '35px',
                          padding: '4px 16px 4px 6px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: 'transparent',
                          color: badge.color.text,
                          textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                      {/* 스핀 버튼 */}
                      <div style={{
                        position: 'absolute',
                        right: '0',
                        top: '0',
                        bottom: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '14px',
                        background: 'transparent'
                      }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBadgeQuantityChange(badge.id, badge.quantity + 1);
                          }}
                          style={{
                            flex: 1,
                            padding: '0',
                            border: 'none',
                            fontSize: '7px',
                            lineHeight: '7px',
                            color: badge.color.text,
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.7';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBadgeQuantityChange(badge.id, Math.max(1, badge.quantity - 1));
                          }}
                          style={{
                            flex: 1,
                            padding: '0',
                            border: 'none',
                            fontSize: '7px',
                            lineHeight: '7px',
                            color: badge.color.text,
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.7';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 상품추가 버튼 */}
                <button
                  type="button"
                  onClick={handleAddProduct}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--color-text)',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface-hover)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  상품추가
                </button>

                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={handleRemoveProduct}
                  disabled={productBadges.length === 0}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: productBadges.length === 0 ? 'var(--color-text-secondary)' : 'var(--color-text)',
                    background: 'var(--color-surface)',
                    cursor: productBadges.length === 0 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    opacity: productBadges.length === 0 ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (productBadges.length > 0) {
                      e.currentTarget.style.background = 'var(--color-surface-hover)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (productBadges.length > 0) {
                      e.currentTarget.style.background = 'var(--color-surface)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }
                  }}
                >
                  삭제
                </button>
              </div>

              {/* 공급가 표시 */}
              <div style={{
                padding: '12px',
                background: 'var(--color-surface)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--color-text)'
                }}>
                  정산 예정 금액
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--color-primary)'
                }}>
                  {supplyPrice.toLocaleString()}원
                </div>
              </div>
            </div>
          </div>

          {/* 2. 주문자 정보 영역 */}
          <div style={{
            padding: '16px',
            background: 'var(--color-background-secondary)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text)',
              margin: '0 0 8px 0'
            }}>주문자 정보</h3>

            {/* 주문자명 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>
                주문자명
              </label>
              <input
                type="text"
                value={formData.orderer}
                onChange={(e) => handleChange('orderer', e.target.value)}
                placeholder="주문자명"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.orderer ? '#ef4444' : 'var(--color-border)'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)'
                }}
              />
              {errors.orderer && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  {errors.orderer}
                </div>
              )}
            </div>

            {/* 주문자 연락처 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>
                주문자 연락처
              </label>
              <input
                type="text"
                value={formData.ordererPhone}
                onChange={(e) => handleChange('ordererPhone', e.target.value)}
                placeholder="주문자 연락처"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.ordererPhone ? '#ef4444' : 'var(--color-border)'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)'
                }}
              />
              {errors.ordererPhone && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  {errors.ordererPhone}
                </div>
              )}
            </div>

            {/* 주문자 배송지 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>
                배송지
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={formData.ordererAddress || ''}
                  readOnly
                  placeholder="주소 검색"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `1px solid var(--color-border)`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'var(--color-background-secondary)',
                    color: 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleAddressSearch('orderer')}
                />
                <button
                  type="button"
                  onClick={() => handleAddressSearch('orderer')}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  검색
                </button>
              </div>
            </div>

            {/* 주문자 배송 메시지 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>
                배송 메시지
              </label>
              <input
                type="text"
                value={formData.ordererDeliveryMessage || ''}
                onChange={(e) => handleChange('ordererDeliveryMessage', e.target.value)}
                placeholder="배송 메시지 (선택)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid var(--color-border)`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)'
                }}
              />
            </div>
          </div>

          {/* 3. 수령인 정보 영역 */}
          <div style={{
            padding: '16px',
            background: 'var(--color-background-secondary)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text)',
              margin: '0 0 8px 0'
            }}>수령인 정보</h3>

            {/* 수령인 추가 버튼 - 오른쪽 정렬 */}
              <button
                type="button"
                onClick={() => {
                  // TODO: 수령인 추가 기능 구현
                  console.log('수령인 추가');
                }}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--color-text)',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                수령인 추가
              </button>
            </div>

          </div>

          {/* 3. 수령인 정보 영역 */}
          <div style={{
            padding: '16px',
            background: 'var(--color-background-secondary)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text)',
              margin: '0 0 8px 0'
            }}>수령인 정보</h3>

            {/* 주문자와 동일 체크박스 */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                marginBottom: '6px'
              }}>
                <input
                  type="checkbox"
                  checked={sameAsOrderer}
                  onChange={(e) => handleSameAsOrderer(e.target.checked)}
                  style={{
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer'
                  }}
                />
                주문자와 동일
              </label>
            </div>

            {/* 수령인명 */}
            <div>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => {
                  handleChange('recipient', e.target.value);
                  if (sameAsOrderer) setSameAsOrderer(false);
                }}
                placeholder="수령인명"
                disabled={sameAsOrderer}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.recipient ? '#ef4444' : 'var(--color-border)'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: sameAsOrderer ? 'var(--color-background-secondary)' : 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: sameAsOrderer ? 'not-allowed' : 'text',
                  opacity: sameAsOrderer ? 0.7 : 1
                }}
              />
              {errors.recipient && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  {errors.recipient}
                </div>
              )}
            </div>

            {/* 수령인 연락처 */}
            <div>
              <input
                type="text"
                value={formData.recipientPhone}
                onChange={(e) => {
                  handleChange('recipientPhone', e.target.value);
                  if (sameAsOrderer) setSameAsOrderer(false);
                }}
                placeholder="수령인 연락처"
                disabled={sameAsOrderer}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.recipientPhone ? '#ef4444' : 'var(--color-border)'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: sameAsOrderer ? 'var(--color-background-secondary)' : 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: sameAsOrderer ? 'not-allowed' : 'text',
                  opacity: sameAsOrderer ? 0.7 : 1
                }}
              />
              {errors.recipientPhone && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  {errors.recipientPhone}
                </div>
              )}
            </div>

            {/* 배송지 */}
            <div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="배송지"
                  style={{
                    width: '100%',
                    padding: '8px 80px 8px 12px',
                    border: `1px solid ${errors.address ? '#ef4444' : 'var(--color-border)'}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'var(--color-text)',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface-hover)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  검색
                </button>
              </div>
              {errors.address && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  {errors.address}
                </div>
              )}
            </div>

            {/* 배송메시지 */}
            <div>
              <input
                type="text"
                value={formData.deliveryMessage}
                onChange={(e) => handleChange('deliveryMessage', e.target.value)}
                placeholder="배송메시지"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)'
                }}
              />
            </div>
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: '12px',
          position: 'sticky',
          bottom: 0,
          background: 'var(--color-surface)'
        }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text)',
              background: 'var(--color-surface)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              background: 'var(--color-primary)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? '등록 중...' : '주문 등록'}
          </button>
        </div>
      </div>

      {/* 상세주소 입력 모달 */}
      {showDetailAddressModal && (
        <DetailAddressModal
          baseAddress={baseAddress}
          onComplete={handleDetailAddressComplete}
          onCancel={() => {
            setShowDetailAddressModal(false);
            setBaseAddress('');
          }}
        />
      )}
    </div>
  );
}

// 상세주소 입력 모달 컴포넌트
function DetailAddressModal({
  baseAddress,
  onComplete,
  onCancel
}: {
  baseAddress: string;
  onComplete: (detailAddress: string) => void;
  onCancel: () => void;
}) {
  const [detailAddress, setDetailAddress] = useState('');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '20px'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '16px'
        }}>
          상세주소 입력
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            marginBottom: '8px'
          }}>
            기본주소
          </div>
          <div style={{
            padding: '10px 12px',
            background: 'var(--color-background-secondary)',
            borderRadius: '6px',
            fontSize: '14px',
            color: 'var(--color-text)',
            lineHeight: '1.5'
          }}>
            {baseAddress}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            marginBottom: '8px'
          }}>
            상세주소 (동/호수 등)
          </div>
          <input
            type="text"
            value={detailAddress}
            onChange={(e) => setDetailAddress(e.target.value)}
            placeholder="예: 101동 1001호"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onComplete(detailAddress);
              }
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--color-text)',
              background: 'var(--color-surface)',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button
            onClick={() => onComplete(detailAddress)}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              background: 'var(--color-primary)',
              cursor: 'pointer'
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
