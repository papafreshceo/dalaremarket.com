// src/app/platform/orders/modals/SingleOrderModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast, { Toaster } from 'react-hot-toast';
import { getCurrentTimeUTC } from '@/lib/date';
import { X } from 'lucide-react';
import { showErrorToast } from '../utils/statusToast';

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
  selectedSubAccount?: any | null;
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
  userEmail,
  selectedSubAccount
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

  // 상품 배지 목록 관리
  interface ProductBadge {
    id: number;
    optionName: string;
    quantity: number;
    color: { bg: string; text: string; border: string };
  }

  // 수령인 목록 관리
  interface Recipient {
    id: number;
    recipient: string;
    recipientPhone: string;
    address: string;
    deliveryMessage: string;
    sameAsOrderer: boolean;
    selectedBadgeId: number | null;
    badges: ProductBadge[]; // 각 수령인별 배지 목록
  }
  const [recipients, setRecipients] = useState<Recipient[]>([
    {
      id: 1,
      recipient: '',
      recipientPhone: '',
      address: '',
      deliveryMessage: '',
      sameAsOrderer: true,
      selectedBadgeId: null,
      badges: []
    }
  ]);

  // 모달 초기화 함수
  const resetModal = () => {
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
    setRecipients([
      {
        id: 1,
        recipient: '',
        recipientPhone: '',
        address: '',
        deliveryMessage: '',
        sameAsOrderer: true,
        selectedBadgeId: null,
        badges: []
      }
    ]);
    setSelectedOption(null);
    setErrors({});
    setSameAsOrderer(false);
    setBaseAddress('');
  };

  // 배지 색상 생성 함수 (배경색만 랜덤, 글자색은 검정)
  const generateBadgeColor = () => {
    const colors = [
      {
        bg: 'rgba(14, 165, 233, 0.15)',
        text: '#000000',
        border: 'rgba(14, 165, 233, 0.3)'
      }, // blue
      {
        bg: 'rgba(34, 197, 94, 0.15)',
        text: '#000000',
        border: 'rgba(34, 197, 94, 0.3)'
      }, // green
      {
        bg: 'rgba(234, 179, 8, 0.15)',
        text: '#000000',
        border: 'rgba(234, 179, 8, 0.3)'
      }, // yellow
      {
        bg: 'rgba(236, 72, 153, 0.15)',
        text: '#000000',
        border: 'rgba(236, 72, 153, 0.3)'
      }, // pink
      {
        bg: 'rgba(168, 85, 247, 0.15)',
        text: '#000000',
        border: 'rgba(168, 85, 247, 0.3)'
      }, // purple
      {
        bg: 'rgba(249, 115, 22, 0.15)',
        text: '#000000',
        border: 'rgba(249, 115, 22, 0.3)'
      }, // orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const [supplyPrice, setSupplyPrice] = useState(0);
  const [selectedRecipientId, setSelectedRecipientId] = useState<number>(1); // 선택된 수령인 ID (첫 번째 수령인)

  // 옵션 선택 시 배지 추가 또는 수정
  const handleOptionSelect = (option: OptionProduct) => {
    setSelectedOption(option);

    // 선택된 수령인이 없으면 배지 추가하지 않음
    if (selectedRecipientId === null) return;

    // 선택된 수령인 찾기
    const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);
    if (!selectedRecipient) return;


    // 선택된 배지가 없고, 중복 체크 필요한 경우
    if (selectedRecipient.selectedBadgeId === null) {
      const isDuplicate = selectedRecipient.badges.some(badge => badge.optionName === option.option_name);
      if (isDuplicate) {
        showErrorToast('이미 추가된 상품입니다');
        return;
      }
    }

    // 선택된 수령인에게만 배지 추가/수정
    setRecipients(prev =>
      prev.map(recipient => {
        if (recipient.id !== selectedRecipientId) return recipient;

        // 선택된 수령인에 선택된 배지가 있는지 확인
        if (recipient.selectedBadgeId !== null) {
          // 선택된 배지가 있으면 해당 배지의 옵션상품 변경
          return {
            ...recipient,
            badges: recipient.badges.map(badge =>
              badge.id === recipient.selectedBadgeId
                ? { ...badge, optionName: option.option_name }
                : badge
            )
          };
        } else {
          // 선택된 배지가 없으면 새 배지 추가 (선택 상태로 만들지 않음)
          const newBadge: ProductBadge = {
            id: Date.now(),
            optionName: option.option_name,
            quantity: 1,
            color: generateBadgeColor()
          };
          return {
            ...recipient,
            badges: [...recipient.badges, newBadge]
          };
        }
      })
    );
  };

  // 상품 추가 핸들러 (특정 수령인에게 추가)
  const handleAddProduct = (recipientId: number) => {
    if (!selectedOption) {
      toast.error('옵션을 먼저 선택해주세요');
      return;
    }

    // 중복 체크: 해당 수령인에게 이미 동일한 옵션이 있는지 확인
    const targetRecipient = recipients.find(r => r.id === recipientId);
    if (targetRecipient) {
      const isDuplicate = targetRecipient.badges.some(badge => badge.optionName === selectedOption.option_name);
      if (isDuplicate) {
        showErrorToast('이미 추가된 상품입니다');
        return;
      }
    }

    const newBadge: ProductBadge = {
      id: Date.now(),
      optionName: selectedOption.option_name,
      quantity: 1,
      color: generateBadgeColor()
    };

    // 해당 수령인에게 배지 추가 (선택 상태로 만들지 않음)
    setRecipients(prev =>
      prev.map(recipient =>
        recipient.id === recipientId
          ? {
              ...recipient,
              badges: [...recipient.badges, newBadge]
            }
          : recipient
      )
    );
  };

  // 상품 삭제 핸들러 (특정 수령인의 마지막 배지 삭제)
  const handleRemoveProduct = (recipientId: number) => {
    setRecipients(prev =>
      prev.map(recipient =>
        recipient.id === recipientId && recipient.badges.length > 0
          ? { ...recipient, badges: recipient.badges.slice(0, -1) }
          : recipient
      )
    );
  };

  // 배지 수량 변경 핸들러
  const handleBadgeQuantityChange = (recipientId: number, badgeId: number, newQuantity: number) => {
    setRecipients(prev =>
      prev.map(recipient =>
        recipient.id === recipientId
          ? {
              ...recipient,
              badges: recipient.badges.map(badge =>
                badge.id === badgeId ? { ...badge, quantity: Math.max(1, newQuantity) } : badge
              )
            }
          : recipient
      )
    );
  };

  // Daum Postcode API 스크립트 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="postcode.map.daum.net"]')) {
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      document.body.appendChild(script);
    }
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

      setProductMasters(data || []);
    } catch (error) {
      console.error('품목 조회 실패:', error);
    }
  };

  // 품목 선택 시 옵션상품 로드
  useEffect(() => {
    if (selectedProductMaster) {
      fetchOptionProducts(selectedProductMaster.id);
    } else {
      setOptionProducts([]);
    }
  }, [selectedProductMaster]);

  const fetchOptionProducts = async (productMasterId: string) => {
    if (!productMasterId) {
      return;
    }

    setLoadingOptions(true);
    const supabase = createClient();

    try {
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

      setOptionProducts(data || []);

      // 첫 번째 옵션을 기본 선택
      if (data && data.length > 0) {
        setSelectedOption(data[0]);
      } else {
        setSelectedOption(null);
      }
    } catch (error) {
      console.error('옵션상품 조회 실패:', error);
      setOptionProducts([]);
      setSelectedOption(null);
    } finally {
      setLoadingOptions(false);
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
      setSelectedProductMaster(null);
      setProductMasters([]);
      setSelectedRecipientId(1); // 첫 번째 수령인 선택
      // 수령인 초기화
      setRecipients([{
        id: 1,
        recipient: '',
        recipientPhone: '',
        address: '',
        deliveryMessage: '',
        sameAsOrderer: true,
        selectedBadgeId: null,
        badges: []
      }]);
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

  // 주소 검색 (Daum Postcode API)
  const handleAddressSearch = () => {
    if (typeof window === 'undefined' || !(window as any).daum) return;

    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        const addr = data.roadAddress || data.jibunAddress;
        setBaseAddress(addr);
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

  // 옵션별 통계 state
  interface OptionSummary {
    optionName: string;
    unitPrice: number;
    totalQuantity: number;
    totalPrice: number;
  }
  const [optionSummaries, setOptionSummaries] = useState<OptionSummary[]>([]);

  // 공급가 계산 (배지 변경 시마다 DB에서 가격 조회)
  useEffect(() => {
    const calculateSupplyPrice = async () => {
      // 모든 수령인의 배지를 합산
      const allBadges = recipients.flatMap(r => r.badges);

      if (allBadges.length === 0) {
        setSupplyPrice(0);
        setOptionSummaries([]);
        return;
      }

      const supabase = createClient();
      let total = 0;
      const summaryMap = new Map<string, OptionSummary>();

      for (const badge of allBadges) {
        const { data } = await supabase
          .from('option_products')
          .select('seller_supply_price')
          .eq('option_name', badge.optionName)
          .single();

        const price = data?.seller_supply_price || 0;
        total += price * badge.quantity;

        // 옵션별 통계 집계
        if (summaryMap.has(badge.optionName)) {
          const existing = summaryMap.get(badge.optionName)!;
          existing.totalQuantity += badge.quantity;
          existing.totalPrice += price * badge.quantity;
        } else {
          summaryMap.set(badge.optionName, {
            optionName: badge.optionName,
            unitPrice: price,
            totalQuantity: badge.quantity,
            totalPrice: price * badge.quantity
          });
        }
      }

      setSupplyPrice(total);
      setOptionSummaries(Array.from(summaryMap.values()));
    };

    calculateSupplyPrice();
  }, [recipients]);

  if (!isOpen) return null;

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

    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: finalValue
      };

      // 주문자와 동일이 체크되어 있으면 수령인 정보도 자동 업데이트
      if (sameAsOrderer) {
        if (field === 'orderer') {
          updated.recipient = finalValue as string;
        } else if (field === 'ordererPhone') {
          updated.recipientPhone = finalValue as string;
        }
      }

      return updated;
    });

    // 주문자 정보가 변경되면 sameAsOrderer가 체크된 모든 수령인도 업데이트
    if (field === 'orderer') {
      setRecipients(prev => prev.map(r =>
        r.sameAsOrderer ? { ...r, recipient: finalValue as string } : r
      ));
    } else if (field === 'ordererPhone') {
      setRecipients(prev => prev.map(r =>
        r.sameAsOrderer ? { ...r, recipientPhone: finalValue as string } : r
      ));
    }

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

    // 주문자 정보 검증
    if (!formData.orderer || !formData.orderer.trim()) {
      toast.error('주문자명을 입력하세요');
      return false;
    }
    if (!formData.ordererPhone || !formData.ordererPhone.trim()) {
      toast.error('주문자 연락처를 입력하세요');
      return false;
    }

    // 전체 옵션 상품 개수 확인
    const totalBadges = recipients.reduce((sum, recipient) => sum + recipient.badges.length, 0);
    if (totalBadges === 0) {
      toast.error('옵션 상품을 선택해주세요');
      return false;
    }

    // 수령인별 검증
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      if (!recipient.recipient || !recipient.recipient.trim()) {
        toast.error(`수령인 정보를 입력하세요`);
        return false;
      }
      if (!recipient.recipientPhone || !recipient.recipientPhone.trim()) {
        toast.error(`수령인 연락처를 입력하세요`);
        return false;
      }
      if (!recipient.address || !recipient.address.trim()) {
        toast.error(`배송지를 입력하세요`);
        return false;
      }
      if (recipient.badges.length === 0) {
        toast.error(`수령인에게 상품을 추가하세요`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다');
        setIsSubmitting(false);
        return;
      }

      const ordersToInsert = [];

      // 각 수령인의 각 배지마다 별도의 주문 생성
      for (const recipient of recipients) {
        for (const badge of recipient.badges) {
          // 주문번호 생성 (각 주문마다 고유)
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const orderData = {
            order_no: orderNumber, // ✅ order_number → order_no 변경
            buyer_name: formData.orderer,
            buyer_phone: formData.ordererPhone,
            recipient_name: recipient.recipient,
            recipient_phone: recipient.recipientPhone,
            recipient_address: recipient.address,
            delivery_message: recipient.deliveryMessage || '',
            option_name: badge.optionName,
            quantity: String(badge.quantity),
            shipping_status: '접수',
            market_name: '플랫폼',
            created_by: user.id,
            created_at: getCurrentTimeUTC(),
            is_deleted: false,
            sub_account_id: (selectedSubAccount && selectedSubAccount !== 'main') ? selectedSubAccount.id : null
          };

          ordersToInsert.push(orderData);
        }
      }

      // API를 통해 주문 일괄 저장 (옵션 상품 정보 자동 매핑)
      const response = await fetch('/api/platform-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToInsert }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('주문 등록 실패:', result.error);
        toast.error(`주문 등록에 실패했습니다: ${result.error}`);
        setIsSubmitting(false);
        return;
      }

      toast.success(`${result.count}건의 주문이 등록되었습니다`);
      onRefresh?.();
      resetModal(); // 모달 초기화
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
        padding: '20px',
        animation: 'fadeIn 0.3s ease-in-out'
      }}
      onClick={(e) => {
        // 주문등록 중에는 클릭 무시
        if (isSubmitting) return;
        // 배경 클릭 시 배지 선택 해제
        setRecipients(prev =>
          prev.map(r => ({ ...r, selectedBadgeId: null }))
        );
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div
        style={{
          background: 'var(--color-surface)',
          maxWidth: '1600px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          animation: 'scaleIn 0.3s ease-in-out'
        }}
        onClick={(e) => {
          // 주문등록 중에는 클릭 무시
          if (isSubmitting) return;
          e.stopPropagation();
          // 모달 내부 클릭 시 배지 선택 해제
          setRecipients(prev =>
            prev.map(r => ({ ...r, selectedBadgeId: null }))
          );
        }}
      >
        {/* 모달 내부 토스트 컨테이너 */}
        <Toaster
          position="top-center"
          containerStyle={{
            top: 80,
            zIndex: 10002
          }}
          toastOptions={{
            duration: 3000,
            style: {
              minWidth: '300px',
              maxWidth: '500px',
              padding: '16px 24px',
              fontSize: '15px',
              fontWeight: '500',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* 주문등록 중 로딩 오버레이 */}
        {isSubmitting && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            cursor: 'not-allowed'
          }}>
            <div style={{
              background: 'white',
              padding: '24px 32px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <p style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                주문 등록 중...
              </p>
            </div>
          </div>
        )}
        {/* 헤더 */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--color-surface)',
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--color-text)',
            margin: 0
          }}>
            주문 등록
          </h2>
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
          gridTemplateColumns: '0.7fr 230px 1.3fr',
          gap: '16px',
          alignItems: 'start',
          overflowY: 'auto',
          flex: '1 1 auto'
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
                  const productId = e.target.value;
                  const product = productMasters.find(p => p.id === productId);
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
                      // 옵션상품의 앞부분(공백 전까지)으로 그룹화
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOptionSelect(option);
                              }}
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
          </div>

          {/* 2. 주문자 정보 영역 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                // 주문자 영역 클릭 시 배지 선택 해제
                setRecipients(prev =>
                  prev.map(r => ({ ...r, selectedBadgeId: null }))
                );
              }}
              style={{
              padding: '16px',
              background: 'var(--color-background-secondary)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              border: '1px solid var(--color-primary)',
              transition: 'all 0.2s'
            }}>
            <div style={{
              marginBottom: '4px',
              height: '32px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text)',
                margin: 0
              }}>주문자</h3>
            </div>

            {/* 주문자 & 연락처 */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <div style={{ width: '80px' }} onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={formData.orderer}
                  onChange={(e) => handleChange('orderer', e.target.value)}
                  placeholder="주문자"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.orderer ? '#ef4444' : 'var(--color-border)'}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    textAlign: 'center'
                  }}
                />
                {errors.orderer && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                    {errors.orderer}
                  </div>
                )}
              </div>

              <div style={{ width: '140px' }} onClick={(e) => e.stopPropagation()}>
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
                    color: 'var(--color-text)',
                    textAlign: 'center'
                  }}
                />
                {errors.ordererPhone && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                    {errors.ordererPhone}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* 3. 수령인 정보 영역 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {recipients.map((recipient, index) => (
              <div
                key={recipient.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRecipientId(recipient.id);
                  // 수령인 영역 클릭 시 배지 선택 해제
                  setRecipients(prev =>
                    prev.map(r => ({ ...r, selectedBadgeId: null }))
                  );
                }}
                style={{
                  padding: '16px',
                  background: 'var(--color-background-secondary)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                  border: selectedRecipientId === recipient.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                  boxShadow: selectedRecipientId === recipient.id ? '0 0 0 1px var(--color-primary)' : 'none',
                  transition: 'all 0.2s'
                }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
                gap: '12px',
                height: '32px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--color-text)',
                  margin: 0
                }}>수령인({index + 1}) {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecipientId(recipient.id);
                      setRecipients(prev =>
                        prev.map(r => ({ ...r, selectedBadgeId: null }))
                      );
                      // 삭제 처리
                      setTimeout(() => {
                        const remainingRecipients = recipients.filter(r => r.id !== recipient.id);
                        setRecipients(remainingRecipients);
                        // 삭제된 수령인이 선택되어 있었다면 첫 번째 남은 수령인 선택
                        if (selectedRecipientId === recipient.id && remainingRecipients.length > 0) {
                          setSelectedRecipientId(remainingRecipients[0].id);
                        }
                      }, 0);
                    }}
                    style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: '#ef4444',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                  >
                    x
                  </button>
                )}</h3>

                {/* 배송메시지 */}
                <input
                  type="text"
                  value={recipient.deliveryMessage}
                  onChange={(e) => {
                    setRecipients(prev => prev.map(r =>
                      r.id === recipient.id
                        ? { ...r, deliveryMessage: e.target.value }
                        : r
                    ));
                  }}
                  onFocus={() => {
                    setSelectedRecipientId(recipient.id);
                    setRecipients(prev =>
                      prev.map(r => ({ ...r, selectedBadgeId: null }))
                    );
                  }}
                  placeholder="배송메시지(선택)"
                  style={{
                    width: '250px',
                    padding: '4px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

            {/* 주문자와 동일 & 수령인 & 연락처 & 배송지 */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* 주문자와 동일 체크박스 */}
              <label
                onClick={() => {
                  setSelectedRecipientId(recipient.id);
                  setRecipients(prev =>
                    prev.map(r => ({ ...r, selectedBadgeId: null }))
                  );
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  fontSize: '10px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1'
                }}>주문자와동일</span>
                <input
                  type="checkbox"
                  checked={recipient.sameAsOrderer}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRecipients(prev => prev.map(r =>
                      r.id === recipient.id
                        ? {
                            ...r,
                            sameAsOrderer: checked,
                            recipient: checked ? formData.orderer : r.recipient,
                            recipientPhone: checked ? formData.ordererPhone : r.recipientPhone
                          }
                        : r
                    ));
                  }}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    margin: 0
                  }}
                />
              </label>

              <div style={{ width: '80px' }}>
                <input
                  type="text"
                  value={recipient.recipient}
                  onChange={(e) => {
                    setRecipients(prev => prev.map(r =>
                      r.id === recipient.id
                        ? { ...r, recipient: e.target.value, sameAsOrderer: false }
                        : r
                    ));
                  }}
                  placeholder="수령인"
                  disabled={recipient.sameAsOrderer}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid var(--color-border)`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: recipient.sameAsOrderer ? 'var(--color-background-secondary)' : 'var(--color-surface)',
                    color: 'var(--color-text)',
                    cursor: recipient.sameAsOrderer ? 'not-allowed' : 'text',
                    opacity: recipient.sameAsOrderer ? 0.7 : 1,
                    textAlign: 'center'
                  }}
                />
              </div>

              <div style={{ width: '140px' }}>
                <input
                  type="text"
                  value={recipient.recipientPhone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setRecipients(prev => prev.map(r =>
                      r.id === recipient.id
                        ? { ...r, recipientPhone: formatted, sameAsOrderer: false }
                        : r
                    ));
                  }}
                  placeholder="수령인 연락처"
                  disabled={recipient.sameAsOrderer}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid var(--color-border)`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: recipient.sameAsOrderer ? 'var(--color-background-secondary)' : 'var(--color-surface)',
                    color: 'var(--color-text)',
                    cursor: recipient.sameAsOrderer ? 'not-allowed' : 'text',
                    opacity: recipient.sameAsOrderer ? 0.7 : 1,
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* 배송지 */}
              <div style={{ flex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={recipient.address}
                    onChange={(e) => {
                      setRecipients(prev => prev.map(r =>
                        r.id === recipient.id
                          ? { ...r, address: e.target.value }
                          : r
                      ));
                    }}
                    placeholder="배송지"
                    style={{
                      width: '100%',
                      padding: '8px 60px 8px 12px',
                      border: `1px solid var(--color-border)`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentRecipientId = recipient.id;
                      setSelectedRecipientId(currentRecipientId);
                      setRecipients(prev =>
                        prev.map(r => ({ ...r, selectedBadgeId: null }))
                      );

                      // Daum 주소검색 API 호출
                      if (typeof window === 'undefined' || !(window as any).daum) return;

                      new (window as any).daum.Postcode({
                        oncomplete: function(data: any) {
                          const addr = data.roadAddress || data.jibunAddress;
                          setRecipients(prev => prev.map(r =>
                            r.id === currentRecipientId
                              ? { ...r, address: addr }
                              : r
                          ));
                        }
                      }).open();
                    }}
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
              </div>
            </div>

            {/* 옵션상품 배지 */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginLeft: '62px' }}>
              {recipient.badges.map((badge) => (
                <div
                  key={badge.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 해당 수령인 선택
                    setSelectedRecipientId(recipient.id);
                    // 모든 수령인의 배지 선택을 해제하고, 클릭한 배지만 선택
                    setRecipients(prev =>
                      prev.map(r =>
                        r.id === recipient.id
                          ? { ...r, selectedBadgeId: badge.id }
                          : { ...r, selectedBadgeId: null }
                      )
                    );
                  }}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '6px',
                    background: badge.color.bg,
                    border: recipient.selectedBadgeId === badge.id ? `2px solid ${badge.color.border}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: recipient.selectedBadgeId === badge.id ? 1 : 0.6,
                    boxShadow: recipient.selectedBadgeId === badge.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  {/* 옵션상품 표시 */}
                  <div style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: badge.color.text,
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    background: 'transparent',
                    minWidth: '50px'
                  }}>
                    {badge.optionName || '옵션 선택'}
                  </div>

                  {/* 수량 입력란 */}
                  <div style={{ position: 'relative', display: 'flex', background: 'transparent' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={badge.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value.replace(/[^\d]/g, '')) || 1;
                        handleBadgeQuantityChange(recipient.id, badge.id, value);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecipients(prev =>
                          prev.map(r =>
                            r.id === recipient.id
                              ? { ...r, selectedBadgeId: badge.id }
                              : r
                          )
                        );
                      }}
                      style={{
                        width: '40px',
                        padding: '4px 22px 4px 0',
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
                      right: '6px',
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
                          handleBadgeQuantityChange(recipient.id, badge.id, badge.quantity + 1);
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
                          handleBadgeQuantityChange(recipient.id, badge.id, Math.max(1, badge.quantity - 1));
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

                  {/* x 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecipients(prev =>
                        prev.map(r =>
                          r.id === recipient.id
                            ? { ...r, badges: r.badges.filter(b => b.id !== badge.id) }
                            : r
                        )
                      );
                    }}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-10px',
                      width: '18px',
                      height: '18px',
                      padding: '0',
                      border: 'none',
                      borderRadius: '50%',
                      background: badge.color.text,
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      opacity: 0.8,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            </div>
            ))}

            {/* 수령인 추가 버튼 */}
            <button
              type="button"
              onClick={() => {
                const newId = Math.max(...recipients.map(r => r.id)) + 1;
                setRecipients(prev => [...prev, {
                  id: newId,
                  recipient: '',
                  recipientPhone: '',
                  address: '',
                  deliveryMessage: '',
                  sameAsOrderer: false,
                  selectedBadgeId: null,
                  badges: []
                }]);
                setSelectedRecipientId(newId); // 새로 추가된 수령인 자동 선택
              }}
              style={{
                width: '36px',
                height: '36px',
                padding: '0',
                border: 'none',
                borderRadius: '50%',
                fontSize: '22px',
                fontWeight: '400',
                color: '#ffffff',
                background: 'var(--color-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
                alignSelf: 'center',
                lineHeight: '0',
                fontFamily: 'Arial, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.3)';
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)',
          borderRadius: '0 0 16px 16px',
          flexShrink: 0
        }}>
          <div style={{ flex: 1 }} />

          {/* 우측 버튼 그룹 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            {/* 옵션별 통계 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: 'flex-end'
            }}>
              {optionSummaries.map((summary, index) => (
                <div key={index} style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontWeight: '500' }}>{summary.optionName}</span>
                  <span>({summary.unitPrice.toLocaleString()}원)</span>
                  <span>×</span>
                  <span>{summary.totalQuantity}개</span>
                  <span>=</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                    {summary.totalPrice.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
            {/* 정산 예정 금액 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'var(--color-background-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              minWidth: '200px'
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
                color: 'var(--color-primary)',
                marginLeft: 'auto'
              }}>
                {supplyPrice.toLocaleString()}원
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                width: '150px',
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
                width: '150px',
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
