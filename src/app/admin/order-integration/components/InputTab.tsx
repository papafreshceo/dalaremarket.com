'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Save, X, Trash2, Check } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import { Modal } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

interface ProductItem {
  id: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  shippingFee: number;
  total: number;
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
}

export default function InputTab() {
  // 폼 데이터 (샘플 데이터 포함)
  const [formData, setFormData] = useState<OrderFormData>({
    buyer_name: '김철수',
    buyer_phone: '010-1234-5678',
    recipientSections: [
      {
        id: Date.now().toString(),
        recipient_name: '이영희',
        recipient_phone: '010-9876-5432',
        recipient_address: '서울특별시 강남구 테헤란로 123, 456호',
        delivery_message: '부재시 문앞에 놓아주세요',
        special_request: '신선도 유지 부탁드립니다',
        shipping_request_date: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0],
        products: [
          {
            id: Date.now().toString() + '-0',
            optionName: '상추 1kg',
            quantity: 2,
            unitPrice: 5000,
            amount: 10000,
            shippingFee: 3000,
            total: 13000,
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

  // 로그인 사용자 정보 가져오기
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user.email || '');
      }
    });
  }, []);

  // 로컬 스토리지에서 저장된 주문 및 시퀀스 불러오기
  useEffect(() => {
    const storedOrders = localStorage.getItem('savedPhoneOrders');
    if (storedOrders) {
      try {
        const parsed = JSON.parse(storedOrders);
        setSavedOrders(parsed);
      } catch (error) {
        console.error('저장된 주문 불러오기 실패:', error);
      }
    }

    // 오늘 날짜 확인 및 시퀀스 불러오기 (한국 시간)
    const today = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
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

  // savedOrders 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (savedOrders.length > 0) {
      localStorage.setItem('savedPhoneOrders', JSON.stringify(savedOrders));
    } else {
      localStorage.removeItem('savedPhoneOrders');
    }
  }, [savedOrders]);

  // 옵션 상품 데이터 로드
  useEffect(() => {
    loadOptionProducts();
  }, []);

  const loadOptionProducts = async () => {
    try {
      const response = await fetch('/api/product-mapping?limit=10000');

      if (!response.ok) {
        console.error('API 응답 오류:', response.status, response.statusText);
        return;
      }

      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', text);
        return;
      }

      if (result.success) {
        const products = result.data;
        setOptionProducts(products);
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
    if (!(window as any).daum || !(window as any).daum.Postcode) {
      alert('주소 검색 API를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 모달 열기
    setAddressSearchModal({ sectionId, isOpen: true });
    setSelectedAddress(null);
    setDetailAddress('');

    // Daum Postcode 팝업 바로 열기
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        setSelectedAddress({
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
          zonecode: data.zonecode,
        });
      },
    }).open();
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

  // 주문번호 생성: PH + YYMMDDHHMMSS + 3자리 연번 (한국 시간)
  const generateOrderNumber = () => {
    const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const yy = now.getFullYear().toString().slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const min = String(now.getUTCMinutes()).padStart(2, '0');
    const ss = String(now.getUTCSeconds()).padStart(2, '0');
    const seq = String(todaySequence).padStart(3, '0');

    const newSequence = todaySequence + 1;
    setTodaySequence(newSequence);
    localStorage.setItem('phoneOrderSequence', String(newSequence));

    return `PH${yy}${mm}${dd}${hh}${min}${ss}${seq}`;
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
          shipping_request_date: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0],
          products: [
            {
              id: Date.now().toString() + '-0',
              optionName: '',
              quantity: 1,
              unitPrice: 0,
              amount: 0,
              shippingFee: 0,
              total: 0,
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

                  // 옵션명 선택 시 가격 자동 입력 (네이버유료판매가격 사용)
                  if (field === 'optionName' && typeof value === 'string') {
                    const selectedOption = optionProducts.find((op) => op.option_name === value);
                    if (selectedOption) {
                      updated.unitPrice = selectedOption.naver_paid_shipping_price || 0;
                      updated.shippingFee = selectedOption.shipping_cost || 0;
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
          shipping_request_date: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0],
          products: [
            {
              id: Date.now().toString() + '-0',
              optionName: '',
              quantity: 1,
              unitPrice: 0,
              amount: 0,
              shippingFee: 0,
              total: 0,
            },
          ],
        },
      ],
    });
    setVerificationStatus({});
  };

  // 주문 저장 (테이블에 추가)
  const handleSaveOrder = () => {
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

    // 각 수령인 섹션을 개별 주문으로 변환
    const newOrders: SavedOrder[] = [];

    formData.recipientSections.forEach((section) => {
      const orderNumber = generateOrderNumber();

      newOrders.push({
        id: Date.now().toString() + Math.random(),
        order_number: orderNumber,
        market_name: '전화주문',
        buyer_name: formData.buyer_name,
        buyer_phone: formData.buyer_phone,
        recipient_name: section.recipient_name,
        recipient_phone: section.recipient_phone,
        recipient_address: section.recipient_address,
        delivery_message: section.delivery_message,
        special_request: section.special_request,
        shipping_request_date: section.shipping_request_date,
        products: [...section.products],
        registered_by: currentUser,
        payment_confirmed: false,
      });
    });

    setSavedOrders([...savedOrders, ...newOrders]);

    // 폼 초기화
    resetForm();

    alert(`${newOrders.length}건의 주문이 추가되었습니다.`);
  };

  // 테이블에서 주문 삭제
  const handleDeleteOrder = (orderId: string) => {
    if (confirm('이 주문을 삭제하시겠습니까?')) {
      setSavedOrders(savedOrders.filter((o) => o.id !== orderId));
    }
  };

  // 입금확인 토글
  const handleTogglePaymentConfirmed = (orderId: string) => {
    setSavedOrders((prevOrders) => {
      const newOrders = prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, payment_confirmed: !order.payment_confirmed }
          : order
      );
      return newOrders;
    });
  };

  // 옵션명 검증 (ExcelTab과 동일한 로직)
  const handleVerifyOptions = async () => {
    if (savedOrders.length === 0) {
      alert('검증할 주문 데이터가 없습니다.');
      return;
    }

    try {
      console.log('검증 시작 - 주문 수:', savedOrders.length, '옵션상품 수:', optionProducts.length);

      // 각 주문의 각 상품에 대해 옵션명 검증 및 매핑
      const updatedOrders = savedOrders.map((order) => {
        const updatedProducts = order.products.map((product) => {
          const optionName = product.optionName;

          if (!optionName || optionName.trim() === '') {
            return {
              ...product,
              _optionNameInDB: false,
              _optionNameVerified: false
            };
          }

          const trimmedOption = optionName.trim().toLowerCase();
          const matchedProduct = optionProducts.find(
            (op) => op.option_name.trim().toLowerCase() === trimmedOption
          );

          if (matchedProduct) {
            // 옵션상품 정보를 상품에 자동 매핑 (네이버유료판매가격 사용)
            const naverPrice = matchedProduct.naver_paid_shipping_price || product.unitPrice;
            const shippingCost = matchedProduct.shipping_cost || product.shippingFee;

            return {
              ...product,
              unitPrice: naverPrice,
              shippingFee: shippingCost,
              amount: product.quantity * naverPrice,
              total: product.quantity * naverPrice + shippingCost,
              _optionNameInDB: true,
              _optionNameVerified: true
            };
          } else {
            return {
              ...product,
              _optionNameInDB: false,
              _optionNameVerified: false
            };
          }
        });

        return {
          ...order,
          products: updatedProducts
        };
      });

      setSavedOrders(updatedOrders);

      // 검증 통계 계산
      const allProducts = updatedOrders.flatMap((o) => o.products);
      const matchedCount = allProducts.filter((p: any) => p._optionNameVerified).length;
      const unmatchedCount = allProducts.filter((p: any) => !p._optionNameVerified).length;

      // 검증 상태 업데이트
      const newVerificationStatus: Record<string, boolean> = {};
      allProducts.forEach((p: any) => {
        newVerificationStatus[p.optionName] = p._optionNameVerified || false;
      });
      setVerificationStatus(newVerificationStatus);

      // 결과 메시지
      let content = `총 ${allProducts.length}개 상품\n\n`;
      content += `✓ 매칭 성공: ${matchedCount}개\n`;
      content += `✗ 매칭 실패: ${unmatchedCount}개\n\n`;

      if (unmatchedCount > 0) {
        content += `매칭 실패한 옵션명은 출고 정보가 자동으로 입력되지 않았습니다.\n`;
        content += `option_products에 등록 후 다시 검증하세요.`;
      } else {
        content += `✅ 모든 상품의 출고 정보가 자동으로 입력되었습니다!`;
      }

      alert(content);

    } catch (error) {
      console.error('옵션명 검증 오류:', error);
      alert('옵션명 검증 중 오류가 발생했습니다.');
    }
  };

  // 주문 접수 등록 (DB 저장)
  const handleRegisterOrders = async () => {
    if (savedOrders.length === 0) {
      alert('등록할 주문이 없습니다.');
      return;
    }

    // 입금확인 여부 확인
    const confirmedOrders = savedOrders.filter((order) => order.payment_confirmed);
    const unconfirmedOrders = savedOrders.filter((order) => !order.payment_confirmed);

    if (confirmedOrders.length === 0) {
      alert('입금확인된 주문이 없습니다.');
      return;
    }

    // 입금확인 상태 안내
    let message = `입금확인: ${confirmedOrders.length}건\n미확인: ${unconfirmedOrders.length}건\n\n`;
    message += `입금확인된 ${confirmedOrders.length}건만 DB에 저장됩니다.\n`;
    if (unconfirmedOrders.length > 0) {
      message += `미확인 ${unconfirmedOrders.length}건은 로컬에 유지됩니다.\n\n`;
    }
    message += `계속 진행하시겠습니까?`;

    if (!confirm(message)) {
      return;
    }

    // 검증되지 않은 옵션명이 있는지 확인 (입금확인된 주문만)
    const allOptionNames = confirmedOrders.flatMap((order) => order.products.map((p) => p.optionName));
    const unverified = allOptionNames.filter((name) => verificationStatus[name] === false);

    if (unverified.length > 0) {
      if (
        !confirm(
          `${unverified.length}개의 검증되지 않은 옵션명이 있습니다. 계속 진행하시겠습니까?`
        )
      ) {
        return;
      }
    }

    try {
      // 입금확인된 주문만 상품별로 분리하여 DB에 저장
      const ordersToSave: any[] = [];

      confirmedOrders.forEach((order) => {
        order.products.forEach((product) => {
          ordersToSave.push({
            market_name: order.market_name,
            order_number: order.order_number,
            buyer_name: order.buyer_name,
            buyer_phone: order.buyer_phone,
            recipient_name: order.recipient_name,
            recipient_phone: order.recipient_phone,
            recipient_address: order.recipient_address,
            delivery_message: order.delivery_message,
            option_name: product.optionName,
            quantity: product.quantity.toString(),
            special_request: order.special_request,
            shipping_request_date: order.shipping_request_date,
            settlement_amount: product.total.toString(), // 정산예정금액 = 합계액 (단가 x 수량 + 택배비)
            sheet_date: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0],
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
        alert(`${result.count}건의 주문이 등록되었습니다.`);
        // 입금확인된 주문만 제거, 미확인 주문은 로컬에 유지
        setSavedOrders(unconfirmedOrders);
        setVerificationStatus({});
      } else {
        alert(`등록 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('주문 등록 실패:', error);
      alert('주문 등록 중 오류가 발생했습니다.');
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
    {
      key: 'payment_confirmed_button',
      title: '입금확인',
      width: 80,
      readOnly: true,
      renderer: (value: any, row: any) => {
        const order = savedOrders.find(o => o.id === row.id);
        const isConfirmed = order?.payment_confirmed || false;

        return (
          <div className="flex items-center justify-center">
            {isConfirmed ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePaymentConfirmed(row.id);
                }}
                className="flex items-center justify-center text-green-600 hover:text-green-700 w-full h-full"
                title="입금확인 취소"
              >
                <Check className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePaymentConfirmed(row.id);
                }}
                className="px-1.5 py-0.5 text-[11px] bg-blue-500 text-white rounded hover:bg-blue-600"
                title="입금완료"
              >
                입금완료
              </button>
            )}
          </div>
        );
      }
    },
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
        payment_confirmed: order.payment_confirmed || false,
        payment_confirmed_button: '',
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
                onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
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
                  setFormData({ ...formData, buyer_phone: formatted });
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
            <h3 className="text-sm font-semibold">
              수령인 정보 #{sectionIndex + 1}
            </h3>
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
            <div className="grid grid-cols-[80px_120px_300px_120px_240px_100px] gap-2">
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
            <div className="grid grid-cols-[20%_50px_70px_70px_70px_70px_30px] gap-1">
              <div className="text-xs font-medium text-gray-700">옵션명</div>
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
              <div className="grid grid-cols-[80px_120px_300px_120px_240px_100px] gap-2">
                <input
                  type="text"
                  value={section.recipient_name}
                  onChange={(e) =>
                    updateRecipientSection(section.id, 'recipient_name', e.target.value)
                  }
                  className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  placeholder="전화 *"
                  maxLength={13}
                  className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="grid grid-cols-[20%_50px_70px_70px_70px_70px_30px] gap-1 items-center"
                  >
                    <input
                      type="text"
                      list={`options-${section.id}-${product.id}`}
                      value={product.optionName}
                      onChange={(e) =>
                        updateProduct(section.id, product.id, 'optionName', e.target.value)
                      }
                      className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="옵션명 입력 (자동완성) *"
                    />
                    <datalist id={`options-${section.id}-${product.id}`}>
                      {optionProducts
                        .filter((op) =>
                          op.option_name.toLowerCase().includes(product.optionName.toLowerCase())
                        )
                        .slice(0, 50)
                        .map((op) => (
                          <option key={op.id} value={op.option_name} />
                        ))}
                    </datalist>

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

                    <input
                      type="text"
                      value={product.shippingFee > 0 ? product.shippingFee.toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        updateProduct(
                          section.id,
                          product.id,
                          'shippingFee',
                          parseInt(value) || 0
                        );
                      }}
                      className="w-full h-8 px-2 py-1 text-xs text-right border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="택배비"
                    />

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

      {/* 저장된 주문 테이블 */}
      {savedOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">저장된 주문 ({savedOrders.length}건)</h3>
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
                  payment_confirmed: row.payment_confirmed,
                };
              }).filter(Boolean) as SavedOrder[];

              setSavedOrders(updatedOrders);
            }}
            onSave={() => {
              alert('수정사항이 로컬 스토리지에 저장되었습니다.');
            }}
            customActions={
              <>
                <button
                  onClick={handleVerifyOptions}
                  className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  옵션명 검증
                </button>
                <button
                  onClick={handleRegisterOrders}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  주문접수 등록
                </button>
              </>
            }
            height="400px"
            enableFilter={false}
            enableCSVExport={false}
            enableCSVImport={false}
            enableCheckbox={false}
            enableDelete={false}
            enableCopy={false}
            enableAddRow={false}
          />
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
