'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Order, StatusConfig, StatsData, Tab } from './types';
import DashboardTab from './components/DashboardTab';
import OrderRegistrationTab from './components/OrderRegistrationTab';
import MobileRegistrationTab from './components/MobileRegistrationTab';
import SettlementTab from './components/SettlementTab';
import UploadModal from './modals/UploadModal';
import OrderDetailModal from './modals/OrderDetailModal';
import ValidationErrorModal from './modals/ValidationErrorModal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import * as XLSX from 'xlsx';
import { validateRequiredColumns } from './utils/validation';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('대시보드');
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);

  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('registered');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('🔍 현재 로그인 사용자:', user);
      if (user?.email) {
        setUserEmail(user.email);
        console.log('✅ 이메일 설정:', user.email);
      } else {
        console.log('❌ 로그인되지 않음');
      }
    });

    // integrated_orders에서 데이터 불러오기
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('🔍 fetchOrders 호출됨');
    console.log('👤 현재 사용자:', user);

    if (!user) {
      console.log('❌ 사용자가 로그인되지 않음');
      return;
    }

    console.log('📋 사용자 ID로 주문 조회 중:', user.id);

    // 현재 로그인한 셀러의 주문만 조회
    const { data, error } = await supabase
      .from('integrated_orders')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 주문 조회 오류:', error);
      return;
    }

    console.log('✅ 조회된 주문 개수:', data?.length || 0);
    console.log('📦 조회된 데이터:', data);

    // shipping_status를 Order status로 매핑
    const mapShippingStatus = (shippingStatus: string | null): Order['status'] => {
      if (!shippingStatus) return 'registered';

      const statusMap: Record<string, Order['status']> = {
        '접수': 'registered',
        '발주서등록': 'registered',
        '결제완료': 'confirmed',
        '상품준비중': 'preparing',
        '배송중': 'shipped',
        '배송완료': 'shipped',
        '취소요청': 'cancelRequested',
        '취소완료': 'cancelled'
      };

      return statusMap[shippingStatus] || 'registered';
    };

    // integrated_orders 데이터를 Order 타입으로 변환
    const convertedOrders: Order[] = (data || []).map((order: any, index: number) => ({
      id: order.id,
      orderNo: order.order_no || `TEMP${order.id}`, // DB에 저장된 발주번호 사용
      orderNumber: order.order_number, // 주문번호
      products: order.option_name,
      amount: 0,
      quantity: parseInt(order.quantity) || 0,
      status: mapShippingStatus(order.shipping_status),
      date: order.created_at,
      registeredAt: order.created_at,
      confirmedAt: order.confirmed_at, // 발주확정일시
      cancelRequestedAt: order.cancel_requested_at,
      cancelledAt: order.canceled_at,
      cancelReason: order.cancel_reason,
      orderer: order.buyer_name,
      ordererPhone: order.buyer_phone,
      recipient: order.recipient_name,
      recipientPhone: order.recipient_phone,
      address: order.recipient_address,
      deliveryMessage: order.delivery_message,
      optionName: order.option_name,
      optionCode: order.option_code || '',
      specialRequest: order.special_request,
      unitPrice: order.seller_supply_price ? parseFloat(order.seller_supply_price) : undefined,
      supplyPrice: order.settlement_amount ? parseFloat(order.settlement_amount) : undefined,
      refundAmount: order.refund_amount ? parseFloat(order.refund_amount) : undefined // 환불액
    }));

    console.log('🔄 변환된 주문 데이터:', convertedOrders);
    setOrders(convertedOrders);
  };

  // 클라이언트에서만 localStorage에서 탭 불러오기
  useEffect(() => {
    const savedTab = localStorage.getItem('ordersActiveTab');
    if (savedTab) {
      setActiveTab(savedTab as Tab);
    } else {
      // 저장된 탭이 없으면 기본값으로 '대시보드' 설정
      setActiveTab('대시보드');
      localStorage.setItem('ordersActiveTab', '대시보드');
    }
  }, []);

  // 탭 변경 시 localStorage에 저장
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('ordersActiveTab', tab);
  };

  const statusConfig: Record<Order['status'], StatusConfig> = {
    registered: { label: '발주서등록', color: '#2563eb', bg: '#dbeafe' },
    confirmed: { label: '발주서확정', color: '#7c3aed', bg: '#ede9fe' },
    preparing: { label: '상품준비중', color: '#f59e0b', bg: '#fef3c7' },
    shipped: { label: '발송완료', color: '#10b981', bg: '#d1fae5' },
    cancelRequested: { label: '취소요청', color: '#ef4444', bg: '#fee2e2' },
    cancelled: { label: '취소완료', color: '#6b7280', bg: '#f3f4f6' }
  };

  const statsData: StatsData[] = [
    { status: 'registered', count: orders.filter(o => o.status === 'registered').length, bgGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' },
    { status: 'confirmed', count: orders.filter(o => o.status === 'confirmed').length, bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
    { status: 'preparing', count: orders.filter(o => o.status === 'preparing').length, bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    { status: 'shipped', count: orders.filter(o => o.status === 'shipped').length, bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
    { status: 'cancelRequested', count: orders.filter(o => o.status === 'cancelRequested').length, bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' },
    { status: 'cancelled', count: orders.filter(o => o.status === 'cancelled').length, bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' }
  ];

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);


        console.log('업로드된 데이터:', jsonData);

        // 필수 칼럼 검증
        const errors = validateRequiredColumns(jsonData);
        if (errors.length > 0) {
          setValidationErrors(errors);
          setShowValidationModal(true);
          setShowUploadModal(false);
          return;
        }

        // 현재 로그인한 사용자 정보 가져오기
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          alert('로그인이 필요합니다.');
          return;
        }

        // 한국 시간대로 현재 날짜/시간 생성
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9

        // 모든 옵션명과 옵션코드 수집 (중복 제거)
        const uniqueOptionNames = [...new Set(jsonData.map((row: any) => String(row['옵션명'] || '')).filter(Boolean))];
        const uniqueOptionCodes = [...new Set(jsonData.map((row: any) => String(row['옵션코드'] || '')).filter(Boolean))];

        console.log('📋 수집된 옵션명:', uniqueOptionNames);
        console.log('📋 수집된 옵션코드:', uniqueOptionCodes);

        // option_products에서 공급단가 조회
        let optionProducts: any[] = [];

        // 옵션명으로 조회
        if (uniqueOptionNames.length > 0) {
          const { data: nameData, error: nameError } = await supabase
            .from('option_products')
            .select('option_name, option_code, seller_supply_price')
            .in('option_name', uniqueOptionNames);

          if (nameError) {
            console.error('❌ 옵션명 조회 오류:', nameError);
          } else {
            console.log('✅ 옵션명으로 조회된 데이터:', nameData);
            if (nameData) {
              optionProducts = [...optionProducts, ...nameData];
            }
          }
        }

        // 옵션코드로 조회
        if (uniqueOptionCodes.length > 0) {
          const { data: codeData, error: codeError } = await supabase
            .from('option_products')
            .select('option_name, option_code, seller_supply_price')
            .in('option_code', uniqueOptionCodes);

          if (codeError) {
            console.error('❌ 옵션코드 조회 오류:', codeError);
          } else {
            console.log('✅ 옵션코드로 조회된 데이터:', codeData);
            if (codeData) {
              optionProducts = [...optionProducts, ...codeData];
            }
          }
        }

        console.log('💰 최종 조회된 옵션상품:', optionProducts);

        // 옵션명/옵션코드별 공급단가 맵 생성
        const priceMap = new Map<string, number>();
        optionProducts.forEach((product: any) => {
          if (product.option_name) {
            priceMap.set(product.option_name, product.seller_supply_price || 0);
            console.log(`✓ 옵션명 "${product.option_name}" → 공급단가: ${product.seller_supply_price}`);
          }
          if (product.option_code) {
            priceMap.set(product.option_code, product.seller_supply_price || 0);
            console.log(`✓ 옵션코드 "${product.option_code}" → 공급단가: ${product.seller_supply_price}`);
          }
        });

        console.log('🗺️ 생성된 가격 맵:', priceMap);

        // integrated_orders에 저장할 데이터 준비
        const ordersToInsert = jsonData.map((row: any) => {
          const optionName = String(row['옵션명'] || '');
          const optionCode = String(row['옵션코드'] || '');
          const quantity = parseInt(String(row['수량'] || '1'));

          // 옵션코드 우선, 없으면 옵션명으로 공급단가 조회
          const supplyPrice = priceMap.get(optionCode) || priceMap.get(optionName) || 0;
          const settlementAmount = supplyPrice * quantity;

          return {
            // 메타데이터
            sheet_date: koreaTime.toISOString().split('T')[0],
            seller_id: user.id, // 업로드한 셀러의 UUID
            created_by: user.id,
            // order_no는 발주확정 시점에 생성

            // 주문 기본 정보
            market_name: '플랫폼', // 플랫폼 주문 구분용
            order_number: String(row['주문번호'] || ''),
            payment_date: koreaTime.toISOString().split('T')[0],

            // 주문자 정보
            buyer_name: String(row['주문자'] || ''),
            buyer_phone: String(row['주문자전화번호'] || ''),

            // 수령인 정보
            recipient_name: String(row['수령인'] || ''),
            recipient_phone: String(row['수령인전화번호'] || ''),
            recipient_address: String(row['주소'] || ''),
            delivery_message: String(row['배송메세지'] || ''),

            // 상품 정보
            option_name: optionName,
            option_code: optionCode,
            quantity: String(quantity),
            special_request: String(row['특이/요청사항'] || ''),

            // 가격 정보
            seller_supply_price: supplyPrice > 0 ? String(supplyPrice) : null,
            settlement_amount: settlementAmount > 0 ? String(settlementAmount) : null,

            // 배송 상태
            shipping_status: '접수'
          };
        });

        console.log('저장할 데이터 샘플:', ordersToInsert[0]);

        // DB에 저장
        const { data: insertedData, error: insertError } = await supabase
          .from('integrated_orders')
          .insert(ordersToInsert)
          .select();

        if (insertError) {
          console.error('DB 저장 오류:', insertError);
          console.error('에러 상세:', JSON.stringify(insertError, null, 2));
          console.error('저장하려던 데이터 개수:', ordersToInsert.length);
          console.error('첫 번째 데이터:', ordersToInsert[0]);
          alert(`주문 저장 중 오류가 발생했습니다:\n${insertError.message || JSON.stringify(insertError)}`);
          return;
        }

        console.log('DB에 저장된 주문:', insertedData);
        alert(`${ordersToInsert.length}건의 주문이 등록되었습니다.`);
        setShowUploadModal(false);

        // 주문 목록 새로고침
        fetchOrders();

      } catch (error) {
        console.error('엑셀 파일 읽기 오류:', error);
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다. 양식을 확인해주세요.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: number) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const filteredOrders = orders.filter(order => {
    // 상태 필터
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

    // 날짜 필터 (한국 시간 기준)
    let matchesDate = true;
    if (startDate || endDate) {
      // UTC 시간을 한국 시간(UTC+9)으로 변환
      const orderDate = new Date(order.date);
      const koreaOrderDate = new Date(orderDate.getTime() + (9 * 60 * 60 * 1000));

      // 한국 시간 기준 날짜만 추출 (시간 제거)
      const orderDateOnly = new Date(
        koreaOrderDate.getUTCFullYear(),
        koreaOrderDate.getUTCMonth(),
        koreaOrderDate.getUTCDate()
      );

      if (startDate) {
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        if (orderDateOnly < startDateOnly) {
          matchesDate = false;
        }
      }
      if (endDate) {
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        if (orderDateOnly > endDateOnly) {
          matchesDate = false;
        }
      }
    }

    // 검색어 필터 (모든 컬럼 대상)
    let matchesSearch = true;
    if (searchTerm && searchTerm.trim()) {
      // 미완성 자음/모음 제거 (완성된 글자만 남김)
      const cleanedSearchTerm = searchTerm.replace(/[ㄱ-ㅎㅏ-ㅣ]/g, '');

      // 완성된 글자가 없으면 필터링 하지 않음
      if (!cleanedSearchTerm.trim()) {
        return true;
      }

      const searchLower = cleanedSearchTerm.toLowerCase();
      matchesSearch = Object.values(order).some(value =>
        String(value || '').toLowerCase().includes(searchLower)
      );
    }

    return matchesStatus && matchesDate && matchesSearch;
  });

  console.log('🔍 필터 상태:', { filterStatus, startDate, endDate, searchTerm });
  console.log('📊 전체 주문:', orders.length, '/ 필터된 주문:', filteredOrders.length);

  return (
    <div className="platform-orders-page bg-background" style={{ minHeight: '100vh' }}>
      {/* 발주관리 전용 헤더 */}
      <div className="bg-surface border-border" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '70px',
        background: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        {/* 왼쪽: 나가기 버튼 & 로그인 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 나가기 버튼 */}
          <button
            onClick={() => { router.push('/'); }}
            className="bg-surface border-border text-text hover:bg-surface-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1f2937',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!document.documentElement.classList.contains('dark')) {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (!document.documentElement.classList.contains('dark')) {
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            나가기
          </button>

          {/* 로그인 정보 */}
          <div className="text-text" style={{
            fontSize: '14px',
            color: '#1f2937',
            fontWeight: '500'
          }}>
            {userEmail || '로그인 정보 없음'}
          </div>
        </div>

        {/* 오른쪽: 다크모드 토글 */}
        <ThemeToggle />
      </div>

      {/* Sidebar */}
      <div className="bg-background-secondary border-border" style={{
        position: 'fixed',
        top: '70px',
        left: 0,
        width: isMobile ? '42px' : '175px',
        height: 'calc(100vh - 70px)',
        background: '#f5f5f5',
        borderRight: '1px solid #e0e0e0',
        zIndex: 100
      }}>
        <div style={{
          paddingTop: '16px',
          paddingLeft: isMobile ? '6px' : '12px',
          paddingRight: isMobile ? '6px' : '12px'
        }}>
          {/* 대시보드 탭 */}
          <button
            onClick={() => handleTabChange('대시보드')}
            className={`text-text ${activeTab === '대시보드' ? 'bg-surface-hover' : ''}`}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '대시보드' ? '#e8e8e8' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '대시보드' ? '700' : '400',
              color: '#1f2937',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '대시보드') {
                const isDark = document.documentElement.classList.contains('dark');
                e.currentTarget.style.background = isDark ? '#3e3e42' : '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '대시보드') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            {!isMobile && '대시보드'}
          </button>

          {/* 발주서등록 탭 */}
          <button
            onClick={() => handleTabChange('발주서등록')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '발주서등록' ? '#e8e8e8' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '발주서등록' ? '700' : '400',
              color: '#1f2937',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '발주서등록') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '발주서등록') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {!isMobile && '발주서등록'}
          </button>

          {/* 모바일등록 탭 */}
          <button
            onClick={() => handleTabChange('모바일등록')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '모바일등록' ? '#e8e8e8' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '모바일등록' ? '700' : '400',
              color: '#1f2937',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '모바일등록') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '모바일등록') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            {!isMobile && '모바일등록'}
          </button>

          {/* 정산관리 탭 */}
          <button
            onClick={() => handleTabChange('정산관리')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '정산관리' ? '#e8e8e8' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '정산관리' ? '700' : '400',
              color: '#1f2937',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '정산관리') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '정산관리') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            {!isMobile && '정산관리'}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="bg-background" style={{
        marginLeft: isMobile ? '42px' : '175px',
        padding: isMobile ? '16px' : '24px',
        paddingTop: '90px',
        background: '#f5f5f5',
        minHeight: '100vh',
        overflowY: 'auto'
      }}>
        {/* Tab Content */}
        {activeTab === '대시보드' && (
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto'
          }}>
            <DashboardTab
              isMobile={isMobile}
              orders={orders}
              statusConfig={statusConfig}
            />
          </div>
        )}
        {activeTab === '발주서등록' && (
          <div style={{
            width: '100%'
          }}>
            <OrderRegistrationTab
              isMobile={isMobile}
              orders={orders}
              statsData={statsData}
              statusConfig={statusConfig}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedOrders={selectedOrders}
              setSelectedOrders={setSelectedOrders}
              setShowUploadModal={setShowUploadModal}
              filteredOrders={filteredOrders}
              handleSelectAll={handleSelectAll}
              handleSelectOrder={handleSelectOrder}
              setSelectedOrder={setSelectedOrder}
              setShowDetailModal={setShowDetailModal}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onRefresh={fetchOrders}
              userEmail={userEmail}
            />
          </div>
        )}
        {activeTab === '모바일등록' && (
          <MobileRegistrationTab
            isMobile={isMobile}
            onRefresh={fetchOrders}
            userEmail={userEmail}
          />
        )}
        {activeTab === '정산관리' && (
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto'
          }}>
            <SettlementTab
              isMobile={isMobile}
              orders={orders}
            />
          </div>
        )}

        {/* 모달들 */}
        <UploadModal
          showUploadModal={showUploadModal}
          setShowUploadModal={setShowUploadModal}
          dragActive={dragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
          fileInputRef={fileInputRef}
          handleFiles={handleFiles}
        />


        <OrderDetailModal
          showDetailModal={showDetailModal}
          setShowDetailModal={setShowDetailModal}
          selectedOrder={selectedOrder}
          statusConfig={statusConfig}
        />

        <ValidationErrorModal
          show={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          errors={validationErrors}
        />
      </div>
    </div>
  );
}
