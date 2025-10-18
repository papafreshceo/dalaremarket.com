'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Save, X, Trash2 } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import { Modal } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { getCurrentTimeUTC } from '@/lib/date';

interface ProductItem {
  id: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  shippingFee: number;
  total: number;
  shippingIncluded: boolean;
}

interface RecipientSection {
  id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_message: string;
  special_request: string;
  shipping_request_date: string;
  products: ProductItem[];
  sameAsBuyer: boolean; // 주문자 정보와 동일 여부
}

interface OrderFormData {
  buyer_name: string;
  buyer_phone: string;
  recipientSections: RecipientSection[];
}

interface SavedOrder {
  id: string;
  order_number: string;
  market_name: string;
  buyer_name: string;
  buyer_phone: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_message: string;
  special_request: string;
  shipping_request_date: string;
  products: ProductItem[];
  registered_by?: string; // 접수자
  payment_confirmed?: boolean; // 입금확인
}

interface OptionProduct {
  id: string;
  option_name: string;
  product_category?: string;
  seller_supply_price?: number;
  shipping_cost?: number;
  naver_paid_shipping_price?: number;
  naver_free_shipping_price?: number;
}

export default function InputTab() {
  // 폼 데이터
  const [formData, setFormData] = useState<OrderFormData>({
    buyer_name: '',
    buyer_phone: '',
    recipientSections: [
      {
        id: Date.now().toString(),
        recipient_name: '',
        recipient_phone: '',
        recipient_address: '',
        delivery_message: '',
        special_request: '',
        shipping_request_date: getCurrentTimeUTC().split('T')[0],
        sameAsBuyer: true, // 기본값: 주문자와 동일
        products: [
          {
            id: Date.now().toString() + '-0',
            optionName: '',
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            shippingFee: 0,
            total: 0,
            shippingIncluded: false,
          },
        ],
      },
    ],
  });

  // 저장된 주문 목록
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);

  // 옵션 상품 데이터 (드롭다운용)
  const [optionProducts, setOptionProducts] = useState<OptionProduct[]>([]);

  // 옵션명 검증 상태 추적
  const [verificationStatus, setVerificationStatus] = useState<Record<string, boolean>>({});

  // 주문 시퀀스 번호 (하루 기준)
  const [todaySequence, setTodaySequence] = useState(1);

  // 주소 검색 모달 상태
  const [addressSearchModal, setAddressSearchModal] = useState<{
    sectionId: string | null;
    isOpen: boolean;
  }>({ sectionId: null, isOpen: false });

  // 주소 검색 결과
  const [selectedAddress, setSelectedAddress] = useState<{
    roadAddress: string;
    jibunAddress: string;
    zonecode: string;
  } | null>(null);

  // 상세주소 입력
  const [detailAddress, setDetailAddress] = useState('');

  // 로그인한 사용자 정보
  const [currentUser, setCurrentUser] = useState<string>('');

  // 옵션명 드롭다운 상태
  const [activeDropdown, setActiveDropdown] = useState<{ sectionId: string; productId: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 로그인 사용자 정보 가져오기
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user.email || '');
      }
    });
  }, []);

  // DB에서 저장된 주문 불러오기 ('전화주문'이면서 '접수' 상태인 주문)
  const loadSavedOrders = async () => {
    try {
      console.log('🔄 주문 로드 시작...');

      // 최근 30일 날짜 계산 (한국 시간 기준)
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const endDate = koreaTime.toISOString().split('T')[0];
      const startTime = new Date(koreaTime.getTime() - (30 * 24 * 60 * 60 * 1000));
      const startDate = startTime.toISOString().split('T')[0];

      // shipping_status 필터와 날짜 범위 추가하여 접수 상태만 조회
      const response = await fetch(
        `/api/integrated-orders?market_name=전화주문&shippingStatus=접수&startDate=${startDate}&endDate=${endDate}&dateType=sheet&limit=10000`
      );
      if (!response.ok) {
        console.error('❌ 주문 로드 실패:', response.status);
        return;
      }

      const result = await response.json();
      console.log('📦 API 응답:', result);

      if (result.success) {
        console.log('✅ 접수 주문 수:', result.data.length);
        console.log('📋 주문 상태:', result.data.map((o: any) => ({ id: o.id, status: o.shipping_status })));

        const filteredOrders = result.data;

        console.log('🔍 필터링된 접수 주문 수:', filteredOrders.length);
        console.log('📝 필터링된 주문:', filteredOrders);

        // DB 데이터를 SavedOrder 형식으로 변환
        const ordersMap = new Map<string, SavedOrder>();

        filteredOrders.forEach((order: any) => {
          const orderNumber = order.order_number;

          if (ordersMap.has(orderNumber)) {
            // 기존 주문에 상품 추가
            const existingOrder = ordersMap.get(orderNumber)!;
            existingOrder.products.push({
              id: order.id,
              optionName: order.option_name || '',
              quantity: parseInt(order.quantity) || 1,
              unitPrice: 0,
              amount: 0,
              shippingFee: 0,
              total: parseInt(order.settlement_amount) || 0,
              shippingIncluded: false,
            });
          } else {
            // 새 주문 생성
            ordersMap.set(orderNumber, {
              id: order.id,
              order_number: orderNumber,
              market_name: order.market_name,
              buyer_name: order.buyer_name || '',
              buyer_phone: order.buyer_phone || '',
              recipient_name: order.recipient_name || '',
              recipient_phone: order.recipient_phone || '',
              recipient_address: order.recipient_address || '',
              delivery_message: order.delivery_message || '',
              special_request: order.special_request || '',
              shipping_request_date: order.shipping_request_date || '',
              products: [{
                id: order.id,
                optionName: order.option_name || '',
                quantity: parseInt(order.quantity) || 1,
                unitPrice: 0,
                amount: 0,
                shippingFee: 0,
                total: parseInt(order.settlement_amount) || 0,
                shippingIncluded: false,
              }],
              registered_by: order.registered_by || '',
              payment_confirmed: false,
            });
          }
        });

        const finalOrders = Array.from(ordersMap.values());
        console.log('🎯 최종 SavedOrder 개수:', finalOrders.length);
        console.log('🎯 최종 SavedOrder 데이터:', finalOrders);
        setSavedOrders(finalOrders);
      }
    } catch (error) {
      console.error('❌ 주문 로드 실패:', error);
    }
  };

  // 초기 로드 및 시퀀스 설정
  useEffect(() => {
    loadSavedOrders();

    // 오늘 날짜 확인 및 시퀀스 불러오기 (한국 시간)
    const today = getCurrentTimeUTC().split('T')[0];
    const storedDate = localStorage.getItem('phoneOrderSequenceDate');
    const storedSequence = localStorage.getItem('phoneOrderSequence');

    if (storedDate === today && storedSequence) {
      setTodaySequence(parseInt(storedSequence));
    } else {
      // 날짜가 다르면 시퀀스 초기화
      localStorage.setItem('phoneOrderSequenceDate', today);
      localStorage.setItem('phoneOrderSequence', '1');
      setTodaySequence(1);
    }
  }, []);


  // 옵션 상품 데이터 로드
  useEffect(() => {
    loadOptionProducts();
  }, []);

  const loadOptionProducts = async () => {
    try {
      const response = await fetch('/api/option-products?limit=10000');

      if (!response.ok) {
        console.error('API 응답 오류:', response.status, response.statusText);
        return;
      }

      const result = await response.json();

      if (result.success) {
        const products = result.data;
        setOptionProducts(products);
        console.log('✅ 옵션 상품 로드 완료:', products.length, '개');
      }
    } catch (error) {
      console.error('옵션 상품 로드 실패:', error);
    }
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    const formatted =
      numbers.length <= 10
        ? numbers.replace(/(\d{3})(\d{0,4})(\d{0,4})/, (_, p1, p2, p3) => {
            return p3 ? `${p1}-${p2}-${p3}` : p2 ? `${p1}-${p2}` : p1;
          })
        : numbers.replace(/(\d{3})(\d{4})(\d{0,4})/, (_, p1, p2, p3) => {
            return p3 ? `${p1}-${p2}-${p3}` : `${p1}-${p2}`;
          });
    return formatted;
  };

  // 주소 검색 팝업 열기
  const openAddressSearch = (sectionId: string) => {
    // Daum Postcode API가 로드되었는지 확인
    if (typeof window === 'undefined' || !(window as any).daum || !(window as any).daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      // Daum Postcode 팝업 바로 열기
      new (window as any).daum.Postcode({
        oncomplete: function (data: any) {
          // 선택한 주소 저장
          setSelectedAddress({
            roadAddress: data.roadAddress,
            jibunAddress: data.jibunAddress,
            zonecode: data.zonecode,
          });
          // 모달 열기
          setAddressSearchModal({ sectionId, isOpen: true });
        },
      }).open();
    } catch (error) {
      console.error('주소 검색 API 오류:', error);
      alert('주소 검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 주소 적용
  const applyAddress = () => {
    if (addressSearchModal.sectionId && selectedAddress) {
      const fullAddress = `${selectedAddress.roadAddress}${detailAddress ? ' ' + detailAddress : ''}`;
      updateRecipientSection(addressSearchModal.sectionId, 'recipient_address', fullAddress);
      setAddressSearchModal({ sectionId: null, isOpen: false });
      setSelectedAddress(null);
      setDetailAddress('');
    }
  };

  // 주문번호 생성: PH + YYMMDDHHMMSS + 3자리 연번 (UTC)
  const generateOrderNumber = () => {
    const utcTime = getCurrentTimeUTC();
    const timestamp = utcTime.replace(/[-:TZ.]/g, '').substring(2, 14); // YYMMDDHHMMSS
    const seq = String(todaySequence).padStart(3, '0');

    const newSequence = todaySequence + 1;
    setTodaySequence(newSequence);
    localStorage.setItem('phoneOrderSequence', String(newSequence));

    return `PH${timestamp}${seq}`;
  };

  // 수령인 섹션 추가
  const addRecipientSection = () => {
    setFormData({
      ...formData,
      recipientSections: [
        ...formData.recipientSections,
        {
          id: Date.now().toString(),
          recipient_name: '',
          recipient_phone: '',
          recipient_address: '',
          delivery_message: '',
          special_request: '',
          shipping_request_date: getCurrentTimeUTC().split('T')[0],
          sameAsBuyer: false, // 추가된 섹션은 기본적으로 다른 수령인
          products: [
            {
              id: Date.now().toString() + '-0',
              optionName: '',
              quantity: 1,
              unitPrice: 0,
              amount: 0,
              shippingFee: 0,
              total: 0,
              shippingIncluded: false,
            },
          ],
        },
      ],
    });
  };

  // 수령인 섹션 삭제
  const removeRecipientSection = (sectionId: string) => {
    if (formData.recipientSections.length > 1) {
      setFormData({
        ...formData,
        recipientSections: formData.recipientSections.filter((s) => s.id !== sectionId),
      });
    }
  };

  // 수령인 섹션 필드 업데이트
  const updateRecipientSection = (sectionId: string, field: keyof RecipientSection, value: any) => {
    setFormData({
      ...formData,
      recipientSections: formData.recipientSections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      ),
    });
  };

  // 주문자 정보와 동일 체크박스 토글
  const toggleSameAsBuyer = (sectionId: string) => {
    setFormData({
      ...formData,
      recipientSections: formData.recipientSections.map((section) => {
        if (section.id === sectionId) {
          const newSameAsBuyer = !section.sameAsBuyer;
          if (newSameAsBuyer) {
            // 체크: 주문자 정보를 수령인에게 복사
            return {
              ...section,
              sameAsBuyer: true,
              recipient_name: formData.buyer_name,
              recipient_phone: formData.buyer_phone,
            };
          } else {
            // 체크 해제: sameAsBuyer만 false로 변경
            return {
              ...section,
              sameAsBuyer: false,
            };
          }
        }
        return section;
      }),
    });
  };

  // 주문자 정보 변경 시 sameAsBuyer가 true인 섹션에 자동 복사
  const updateBuyerInfo = (field: 'buyer_name' | 'buyer_phone', value: string) => {
    setFormData({
      ...formData,
      [field]: value,
      recipientSections: formData.recipientSections.map((section) => {
        if (section.sameAsBuyer) {
          // 주문자와 동일한 섹션은 자동으로 업데이트
          if (field === 'buyer_name') {
            return { ...section, recipient_name: value };
          } else if (field === 'buyer_phone') {
            return { ...section, recipient_phone: value };
          }
        }
        return section;
      }),
    });
  };

  // 상품 추가
  const addProduct = (sectionId: string) => {
    setFormData({
      ...formData,
      recipientSections: formData.recipientSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              products: [
                ...section.products,
                {
                  id: Date.now().toString(),
                  optionName: '',
                  quantity: 1,
                  unitPrice: 0,
                  amount: 0,
                  shippingFee: 0,
                  total: 0,
                  shippingIncluded: false,
                },
              ],
            }
          : section
      ),
    });
  };

  // 상품 삭제
  const removeProduct = (sectionId: string, productId: string) => {
    setFormData({
      ...formData,
      recipientSections: formData.recipientSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              products: section.products.filter((p) => p.id !== productId),
            }
          : section
      ),
    });
  };

  // 상품 필드 업데이트
  const updateProduct = (sectionId: string, productId: string, field: keyof ProductItem, value: any) => {
    setFormData({
      ...formData,
      recipientSections: formData.recipientSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              products: section.products.map((p) => {
                if (p.id === productId) {
                  const updated = { ...p, [field]: value };

                  // shippingIncluded 토글 시 단가 자동 조정
                  if (field === 'shippingIncluded') {
                    const selectedOption = optionProducts.find((op) => op.option_name === p.optionName);
                    if (selectedOption) {
                      if (value === true) {
                        // 포함: naver_free_shipping_price 사용, shippingFee = 0
                        updated.unitPrice = selectedOption.naver_free_shipping_price || 0;
                        updated.shippingFee = 0;
                      } else {
                        // 별도: naver_paid_shipping_price 사용, shippingFee = 3000
                        updated.unitPrice = selectedOption.naver_paid_shipping_price || 0;
                        updated.shippingFee = 3000;
                      }
                      updated.amount = updated.quantity * updated.unitPrice;
                      updated.total = updated.amount + updated.shippingFee;
                    }
                  }

                  // 옵션명 선택 시 가격 자동 입력 (현재 shippingIncluded 상태에 따라 가격 설정)
                  if (field === 'optionName' && typeof value === 'string') {
                    const selectedOption = optionProducts.find((op) => op.option_name === value);
                    if (selectedOption) {
                      if (p.shippingIncluded) {
                        // 포함: naver_free_shipping_price 사용, shippingFee = 0
                        updated.unitPrice = selectedOption.naver_free_shipping_price || 0;
                        updated.shippingFee = 0;
                      } else {
                        // 별도: naver_paid_shipping_price 사용, shippingFee = 3000
                        updated.unitPrice = selectedOption.naver_paid_shipping_price || 0;
                        updated.shippingFee = 3000;
                      }
                      updated.amount = updated.quantity * updated.unitPrice;
                      updated.total = updated.amount + updated.shippingFee;
                    }
                  }

                  // 수량 또는 단가 변경 시 금액 재계산
                  if (field === 'quantity' || field === 'unitPrice') {
                    updated.amount = updated.quantity * updated.unitPrice;
                  }

                  // 택배비 변경 시 합계 재계산
                  if (field === 'shippingFee') {
                    updated.total = updated.amount + updated.shippingFee;
                  }

                  // 합계 재계산
                  if (field === 'quantity' || field === 'unitPrice') {
                    updated.total = updated.amount + updated.shippingFee;
                  }

                  return updated;
                }
                return p;
              }),
            }
          : section
      ),
    });
  };

  // 섹션별 최종 합계 계산
  const calculateSectionTotal = (section: RecipientSection) => {
    return section.products.reduce((sum, p) => sum + p.total, 0);
  };

  // 전체 최종 합계 계산
  const calculateFinalTotal = () => {
    return formData.recipientSections.reduce((sum, section) => sum + calculateSectionTotal(section), 0);
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      buyer_name: '',
      buyer_phone: '',
      recipientSections: [
        {
          id: Date.now().toString(),
          recipient_name: '',
          recipient_phone: '',
          recipient_address: '',
          delivery_message: '',
          special_request: '',
          shipping_request_date: getCurrentTimeUTC().split('T')[0],
          sameAsBuyer: true, // 초기화 시 주문자와 동일로 설정
          products: [
            {
              id: Date.now().toString() + '-0',
              optionName: '',
              quantity: 1,
              unitPrice: 0,
              amount: 0,
              shippingFee: 0,
              total: 0,
              shippingIncluded: false,
            },
          ],
        },
      ],
    });
    setVerificationStatus({});
  };

  // 주문 저장 (DB에 직접 저장 - 접수 상태)
  const handleSaveOrder = async () => {
    // 필수 입력 검증
    if (!formData.buyer_name) {
      alert('주문자명은 필수입니다.');
      return;
    }

    for (const section of formData.recipientSections) {
      if (!section.recipient_name || !section.recipient_phone) {
        alert('모든 수령인명과 수령인 전화번호는 필수입니다.');
        return;
      }

      const invalidProducts = section.products.filter((p) => !p.optionName || p.quantity < 1);
      if (invalidProducts.length > 0) {
        alert('모든 상품의 옵션명과 수량을 입력해주세요.');
        return;
      }
    }

    try {
      // DB 저장용 데이터 생성 (각 상품을 개별 행으로)
      const ordersToSave: any[] = [];

      formData.recipientSections.forEach((section) => {
        section.products.forEach((product) => {
          const orderNumber = generateOrderNumber(); // 각 상품마다 고유한 주문번호 생성

          ordersToSave.push({
            market_name: '전화주문',
            order_number: orderNumber,
            buyer_name: formData.buyer_name,
            buyer_phone: formData.buyer_phone,
            recipient_name: section.recipient_name,
            recipient_phone: section.recipient_phone,
            recipient_address: section.recipient_address,
            delivery_message: section.delivery_message,
            option_name: product.optionName,
            quantity: product.quantity.toString(),
            special_request: section.special_request,
            shipping_request_date: section.shipping_request_date,
            settlement_amount: product.total.toString(),
            sheet_date: (() => {
              // 한국 시간 기준 날짜 (YYYY-MM-DD)
              const now = new Date();
              const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
              return koreaTime.toISOString().split('T')[0];
            })(),
            shipping_status: '접수',
            registered_by: currentUser, // 접수자 정보 추가
          });
        });
      });

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: ordersToSave }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 주문 저장 성공!', result);
        alert(`${ordersToSave.length}건의 주문이 등록되었습니다.`);
        // 폼 초기화
        resetForm();
        // DB에서 저장된 주문 다시 로드
        console.log('🔄 저장 후 주문 다시 로드 시작...');
        await loadSavedOrders();
      } else {
        console.error('❌ 주문 저장 실패:', result.error);
        alert(`등록 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('주문 등록 실패:', error);
      alert('주문 등록 중 오류가 발생했습니다.');
    }
  };

  // 테이블에서 주문 삭제 (DB에서 삭제)
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('이 주문을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/integrated-orders/${orderId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('주문이 삭제되었습니다.');
        // DB에서 저장된 주문 다시 로드
        await loadSavedOrders();
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('주문 삭제 실패:', error);
      alert('주문 삭제 중 오류가 발생했습니다.');
    }
  };


  // 테이블용 컬럼 정의
  const tableColumns = [
    {
      key: 'delete_button',
      title: '삭제',
      width: 60,
      readOnly: true,
      renderer: (value: any, row: any) => (
        <button
          onClick={() => handleDeleteOrder(row.id)}
          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          title="삭제"
        >
          <Trash2 className="w-3 h-3 mx-auto" />
        </button>
      )
    },
    { key: 'registered_by', title: '접수자', width: 120, readOnly: true },
    { key: 'order_number', title: '주문번호', width: 150, readOnly: true },
    { key: 'market_name', title: '마켓명', width: 80, readOnly: true },
    { key: 'buyer_name', title: '주문자', width: 100 },
    { key: 'buyer_phone', title: '주문자전화번호', width: 120 },
    { key: 'recipient_name', title: '수령인', width: 100 },
    { key: 'recipient_phone', title: '수령인전화번호', width: 120 },
    { key: 'recipient_address', title: '주소', width: 250 },
    { key: 'delivery_message', title: '배송메시지', width: 150 },
    { key: 'products_display', title: '옵션명', width: 200, readOnly: true },
    { key: 'quantity_display', title: '수량', width: 60, readOnly: true },
    { key: 'total_amount', title: '합계금액', width: 100, readOnly: true },
    { key: 'special_request', title: '특이/요청사항', width: 150 },
    { key: 'shipping_request_date', title: '발송요청일', width: 100 },
  ];

  // 테이블용 데이터 변환 (useMemo로 자동 업데이트)
  const tableData = useMemo(() => {
    return savedOrders.map((order) => {
      const orderTotal = order.products.reduce((sum, p) => sum + p.total, 0);
      return {
        id: order.id,
        delete_button: '',
        registered_by: order.registered_by || '',
        order_number: order.order_number,
        market_name: order.market_name,
        buyer_name: order.buyer_name,
        buyer_phone: order.buyer_phone,
        recipient_name: order.recipient_name,
        recipient_phone: order.recipient_phone,
        recipient_address: order.recipient_address,
        delivery_message: order.delivery_message,
        products_display: order.products.map((p) => p.optionName).join(', '),
        quantity_display: order.products.map((p) => p.quantity).join(', '),
        total_amount: orderTotal.toLocaleString(),
        special_request: order.special_request,
        shipping_request_date: order.shipping_request_date,
      };
    });
  }, [savedOrders]);

  return (
    <div className="space-y-4 pb-20">
      {/* 하나의 큰 섹션으로 묶기 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 relative">
        {/* 초기화 버튼 - 우측 상단 */}
        <button
          onClick={resetForm}
          className="absolute top-4 right-4 px-3 py-1.5 text-xs border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50"
        >
          초기화
        </button>

        {/* 섹션 1: 주문자 정보 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">주문자 정보</h3>
          <div className="grid grid-cols-[120px_180px] gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">주문자</label>
              <input
                type="text"
                value={formData.buyer_name}
                onChange={(e) => updateBuyerInfo('buyer_name', e.target.value)}
                className="w-full h-8 px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">주문자전화번호</label>
              <input
                type="text"
                value={formData.buyer_phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  updateBuyerInfo('buyer_phone', formatted);
                }}
                placeholder="000-0000-0000"
                maxLength={13}
                className="w-full h-8 px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 섹션 2: 수령인 정보 (다중 추가 가능) */}
        {formData.recipientSections.map((section, sectionIndex) => (
          <div key={section.id} className="mb-6 last:mb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold">
                수령인 정보 #{sectionIndex + 1}
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.sameAsBuyer}
                  onChange={() => toggleSameAsBuyer(section.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 whitespace-nowrap">주문자정보와동일</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addRecipientSection}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                title="수령인 추가"
              >
                <Plus className="w-3 h-3" />
                추가
              </button>
              {formData.recipientSections.length > 1 && (
                <button
                  onClick={() => removeRecipientSection(section.id)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  title="수령인 삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 라벨 행 - 전체 */}
          <div className="grid grid-cols-[1fr_2fr] gap-4">
            {/* 왼쪽 라벨 */}
            <div className="grid grid-cols-[80px_120px_300px_120px_240px_110px] gap-2">
              <div className="text-xs font-medium text-gray-700">수령인</div>
              <div className="text-xs font-medium text-gray-700">전화</div>
              <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                주소
                <button
                  onClick={() => openAddressSearch(section.id)}
                  className="px-1.5 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  type="button"
                >
                  검색
                </button>
              </div>
              <div className="text-xs font-medium text-gray-700">배송메시지</div>
              <div className="text-xs font-medium text-gray-700">특이/요청</div>
              <div className="text-xs font-medium text-gray-700">발송요청일</div>
            </div>

            {/* 오른쪽 라벨 */}
            <div className="grid grid-cols-[20%_60px_50px_70px_70px_80px_70px_30px] gap-1">
              <div className="text-xs font-medium text-gray-700">옵션명</div>
              <div className="text-xs font-medium text-gray-700 text-center">배송비</div>
              <div className="text-xs font-medium text-gray-700 text-center">수량</div>
              <div className="text-xs font-medium text-gray-700 text-center">단가</div>
              <div className="text-xs font-medium text-gray-700 text-center">금액</div>
              <div className="text-xs font-medium text-gray-700 text-center">택배비</div>
              <div className="text-xs font-medium text-gray-700 text-center">합계</div>
              <div className="text-xs font-medium text-gray-700 text-center">
                <button
                  onClick={() => addProduct(section.id)}
                  className="flex items-center gap-0.5 h-5 px-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                  title="상품 추가"
                >
                  <Plus className="w-3 h-3" />
                  <span>상품추가</span>
                </button>
              </div>
            </div>
          </div>

          {/* 입력란 행 - 전체 */}
          <div className="grid grid-cols-[1fr_2fr] gap-4 mt-1">
            {/* 왼쪽: 수령인 정보 - 모두 가로 1줄 */}
            <div>
              <div className="grid grid-cols-[80px_120px_300px_120px_240px_110px] gap-2">
                <input
                  type="text"
                  value={section.recipient_name}
                  onChange={(e) =>
                    updateRecipientSection(section.id, 'recipient_name', e.target.value)
                  }
                  disabled={section.sameAsBuyer}
                  className={`w-full h-8 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    section.sameAsBuyer
                      ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 bg-white'
                  }`}
                  placeholder="수령인 *"
                  required
                />
                <input
                  type="text"
                  value={section.recipient_phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    updateRecipientSection(section.id, 'recipient_phone', formatted);
                  }}
                  disabled={section.sameAsBuyer}
                  placeholder="전화 *"
                  maxLength={13}
                  className={`w-full h-8 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    section.sameAsBuyer
                      ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                <input
                  type="text"
                  value={section.recipient_address}
                  onChange={(e) =>
                    updateRecipientSection(section.id, 'recipient_address', e.target.value)
                  }
                  className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="주소"
                />
                <input
                  type="text"
                  value={section.delivery_message}
                  onChange={(e) =>
                    updateRecipientSection(section.id, 'delivery_message', e.target.value)
                  }
                  className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="배송메시지"
                />
                <input
                  type="text"
                  value={section.special_request}
                  onChange={(e) =>
                    updateRecipientSection(section.id, 'special_request', e.target.value)
                  }
                  className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="특이/요청"
                />
                <input
                  type="date"
                  value={section.shipping_request_date}
                  onChange={(e) =>
                    updateRecipientSection(section.id, 'shipping_request_date', e.target.value)
                  }
                  className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 오른쪽: 상품 정보 */}
            <div>

              <div className="space-y-2">
                {section.products.map((product) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[20%_60px_50px_70px_70px_80px_70px_30px] gap-1 items-center"
                  >
                    <div className="relative" ref={activeDropdown?.sectionId === section.id && activeDropdown?.productId === product.id ? dropdownRef : null}>
                      <input
                        type="text"
                        value={product.optionName}
                        onChange={(e) => {
                          updateProduct(section.id, product.id, 'optionName', e.target.value);
                          setActiveDropdown({ sectionId: section.id, productId: product.id });
                        }}
                        onFocus={() => setActiveDropdown({ sectionId: section.id, productId: product.id })}
                        className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="옵션명 입력 *"
                      />
                      {activeDropdown?.sectionId === section.id && activeDropdown?.productId === product.id && product.optionName && (
                        <div
                          className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-[9999]"
                          style={{ top: '100%' }}
                        >
                          {(() => {
                            const filteredOptions = optionProducts.filter((op) =>
                              op.option_name.toLowerCase().includes(product.optionName.toLowerCase())
                            );
                            const displayOptions = filteredOptions.slice(0, 20);

                            return displayOptions.length > 0 ? (
                              <>
                                {displayOptions.map((op) => (
                                  <div
                                    key={op.id}
                                    onClick={() => {
                                      updateProduct(section.id, product.id, 'optionName', op.option_name);
                                      setActiveDropdown(null);
                                    }}
                                    className="px-2 py-1 text-xs cursor-pointer hover:bg-blue-50"
                                  >
                                    {op.option_name}
                                  </div>
                                ))}
                                {filteredOptions.length > 20 && (
                                  <div className="px-2 py-1 text-xs text-gray-500 bg-gray-50">
                                    +{filteredOptions.length - 20}개 더 있음 (더 검색하세요)
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="px-2 py-1 text-xs text-gray-500">
                                검색 결과 없음
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        updateProduct(section.id, product.id, 'shippingIncluded', !product.shippingIncluded);
                      }}
                      className={`w-full h-8 px-1 text-xs rounded transition-colors ${
                        product.shippingIncluded
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title={product.shippingIncluded ? '배송비 포함' : '배송비 별도'}
                    >
                      {product.shippingIncluded ? '포함' : '별도'}
                    </button>

                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) =>
                        updateProduct(
                          section.id,
                          product.id,
                          'quantity',
                          parseInt(e.target.value) || 1
                        )
                      }
                      min="1"
                      className="w-full h-8 px-2 py-1 text-xs text-center border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="수량"
                    />

                    <input
                      type="text"
                      value={product.unitPrice > 0 ? product.unitPrice.toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        updateProduct(
                          section.id,
                          product.id,
                          'unitPrice',
                          parseInt(value) || 0
                        );
                      }}
                      className="w-full h-8 px-2 py-1 text-xs text-right border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="단가"
                    />

                    <input
                      type="text"
                      value={product.amount > 0 ? product.amount.toLocaleString() : ''}
                      readOnly
                      className="w-full h-8 px-2 py-1 text-xs text-right border border-gray-200 rounded bg-gray-100 text-gray-700"
                      placeholder="금액"
                    />

                    {product.shippingIncluded ? (
                      <input
                        type="text"
                        value="0"
                        readOnly
                        className="w-full h-8 px-2 py-1 text-xs text-right border border-gray-200 rounded bg-gray-100 text-gray-700"
                        placeholder="택배비"
                      />
                    ) : (
                      <select
                        value={product.shippingFee}
                        onChange={(e) =>
                          updateProduct(
                            section.id,
                            product.id,
                            'shippingFee',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-8 px-2 py-1 text-xs text-right border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={3000}>3,000</option>
                        <option value={3500}>3,500</option>
                        <option value={4000}>4,000</option>
                        <option value={4500}>4,500</option>
                        <option value={5000}>5,000</option>
                      </select>
                    )}

                    <input
                      type="text"
                      value={product.total > 0 ? product.total.toLocaleString() : ''}
                      readOnly
                      className="w-full h-8 px-2 py-1 text-xs text-right border border-gray-200 rounded bg-gray-100 text-gray-700 font-semibold"
                      placeholder="합계"
                    />

                    <button
                      onClick={() => removeProduct(section.id, product.id)}
                      disabled={section.products.length === 1}
                      className="w-full h-8 px-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <X className="w-3 h-3 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 섹션 합계 */}
              <div className="flex justify-end mt-2">
                <div className="text-sm font-semibold">
                  합계 {calculateSectionTotal(section).toLocaleString()}원
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

        {/* 최종 합계 및 저장 버튼 */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <div className="text-lg font-bold">최종 합계 {calculateFinalTotal().toLocaleString()}원</div>
          <button
            onClick={handleSaveOrder}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            저장
          </button>
        </div>
      </div>

      {/* 접수된 주문 테이블 */}
      {savedOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">접수된 주문 ({savedOrders.length}건)</h3>
          </div>

          <EditableAdminGrid
            columns={tableColumns}
            data={tableData}
            onDataChange={(updatedData) => {
              // 테이블 데이터를 SavedOrder 형식으로 역변환
              const updatedOrders = updatedData.map((row: any) => {
                const order = savedOrders.find((o) => o.id === row.id);
                if (!order) return null;

                return {
                  ...order,
                  registered_by: row.registered_by,
                  buyer_name: row.buyer_name,
                  buyer_phone: row.buyer_phone,
                  recipient_name: row.recipient_name,
                  recipient_phone: row.recipient_phone,
                  recipient_address: row.recipient_address,
                  delivery_message: row.delivery_message,
                  special_request: row.special_request,
                  shipping_request_date: row.shipping_request_date,
                };
              }).filter(Boolean) as SavedOrder[];

              setSavedOrders(updatedOrders);
            }}
            onSave={() => {
              alert('저장된 주문 테이블은 읽기 전용입니다.');
            }}
            height="400px"
            enableFilter={false}
            enableCSVExport={false}
            enableCSVImport={false}
            enableCheckbox={false}
            enableDelete={false}
            enableCopy={false}
            enableAddRow={false}
          />

          <div className="mt-3 text-xs text-gray-500">
            ※ 입금확인 후 결제완료 상태로 이관된 주문은 더이상 보이지 않습니다
          </div>
        </div>
      )}

      {/* 주소 검색 모달 */}
      <Modal
        isOpen={addressSearchModal.isOpen && !!selectedAddress}
        onClose={() => {
          setAddressSearchModal({ sectionId: null, isOpen: false });
          setSelectedAddress(null);
          setDetailAddress('');
        }}
        title="주소 입력"
        size="xs"
        footer={
          <>
            <button
              onClick={() => {
                setAddressSearchModal({ sectionId: null, isOpen: false });
                setSelectedAddress(null);
                setDetailAddress('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={applyAddress}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              적용
            </button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          {selectedAddress && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  우편번호
                </label>
                <input
                  type="text"
                  value={selectedAddress.zonecode}
                  readOnly
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  기본주소
                </label>
                <input
                  type="text"
                  value={selectedAddress.roadAddress}
                  readOnly
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상세주소
                </label>
                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="상세주소를 입력하세요"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  autoFocus
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
