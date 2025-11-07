'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Order, StatusConfig, StatsData, Tab } from './types';
import DashboardTab from './components/DashboardTab';
import OrderRegistrationTab from './components/OrderRegistrationTab';
import MobileRegistrationTab from './components/MobileRegistrationTab';
import SettlementTab from './components/SettlementTab';
import OptionMappingTab from './components/OptionMappingTab';
import SellerInfoTab from './components/SellerInfoTab';
import CashHistoryTab from './components/CashHistoryTab';
import UploadModal from './modals/UploadModal';
import OrderDetailModal from './modals/OrderDetailModal';
import ValidationErrorModal from './modals/ValidationErrorModal';
import OptionValidationModal from './modals/OptionValidationModal';
import MappingResultModal from './modals/MappingResultModal';
import { LocalThemeToggle } from './components/LocalThemeToggle';
import PWAInstallBanner from './components/PWAInstallBanner';
import TierBadge from '@/components/TierBadge';
import LoadingScreen from '@/components/LoadingScreen';
import ExcelJS from 'exceljs';
import { validateRequiredColumns } from './utils/validation';
import toast, { Toaster } from 'react-hot-toast';
import { getCurrentTimeUTC } from '@/lib/date';
import { applyOptionMapping } from './utils/applyOptionMapping';
import { showStatusToast } from './utils/statusToast';

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const isModalMode = searchParams.get('modal') === 'true';
  const statusParam = searchParams.get('status') as Order['status'] | null;

  const [activeTab, setActiveTab] = useState<Tab>(statusParam ? '발주서등록' : '대시보드');
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userTier, setUserTier] = useState<'light' | 'standard' | 'advance' | 'elite' | 'legend'>('light');
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [showCashTooltip, setShowCashTooltip] = useState(false);
  const [showCreditTooltip, setShowCreditTooltip] = useState(false);

  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>(statusParam || 'registered');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // postMessage 처리 여부 추적
  const messageHandledRef = useRef<boolean>(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  // 기본값: 7일 전부터 오늘까지
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [showOptionValidationModal, setShowOptionValidationModal] = useState<boolean>(false);
  const [uploadedOrders, setUploadedOrders] = useState<any[]>([]);
  const [optionProductsMap, setOptionProductsMap] = useState<Map<string, any>>(new Map());
  const [showMappingResultModal, setShowMappingResultModal] = useState<boolean>(false);
  const [mappingResults, setMappingResults] = useState<any[]>([]);
  const [mappingStats, setMappingStats] = useState({ total: 0, mapped: 0 });

  // 로컬 다크모드 상태 (발주관리 페이지 전용, 사용자별 DB 저장)
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>('light');
  const [themeLoaded, setThemeLoaded] = useState(false);

  // 새로고침 상태
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 전체 탭 리셋용 키 (새로고침 시 모든 컴포넌트 리마운트)
  const [refreshKey, setRefreshKey] = useState(0);

  // 샘플 모드 상태
  const [isSampleMode, setIsSampleMode] = useState(false);

  // 초기 로딩 상태 (전체 화면 로딩 스크린용)
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 사용자별 테마 불러오기
  useEffect(() => {
    const loadUserTheme = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('orders_theme')
          .eq('id', user.id)
          .single();

        if (!error && data?.orders_theme) {
          setLocalTheme(data.orders_theme as 'light' | 'dark');
        }
      }
      setThemeLoaded(true);
    };

    loadUserTheme();
  }, []);

  // 로컬 다크모드 적용
  useEffect(() => {
    if (!themeLoaded) return;

    if (localTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 컴포넌트 언마운트 시 다크모드 해제 (다른 페이지로 이동 시)
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [localTheme, themeLoaded]);

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setLocalTheme(newTheme);

    // DB에 저장
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('users')
        .update({ orders_theme: newTheme })
        .eq('id', user.id);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // F5 키 가로채기 - 페이지 새로고침 대신 컴포넌트만 새로고침
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // F5 키 또는 Ctrl+R 감지 (e.code도 체크)
      if (e.key === 'F5' || e.code === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault(); // 기본 새로고침 동작 막기
        e.stopPropagation(); // 이벤트 전파 중지

        setIsRefreshing(true);

        try {
          // 현재 컴포넌트만 새로고침 (데이터 다시 로드)
          await Promise.all([
            fetchOrders(),
            fetchBalances(false) // 새로고침 시에는 리필 토스트 표시 안 함
          ]);

          // 모든 탭 컴포넌트 리셋 (필터 상태 초기화)
          setRefreshKey(prev => prev + 1);

          // fetchOrders 완료 후 1초 더 표시한 다음 상태 해제
          setTimeout(() => {
            setIsRefreshing(false);
          }, 1000);
        } catch (error) {
          console.error('새로고침 오류:', error);
          setIsRefreshing(false);
        }
      }
    };

    // capture 단계에서 이벤트 캡처
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []); // fetchOrders는 함수 선언이므로 의존성 불필요

  useEffect(() => {
    const checkImpersonateToken = async () => {
      const impersonateToken = searchParams.get('impersonate_token');

      if (impersonateToken) {
        try {
          // 토큰 검증 및 사용자 정보 가져오기
          const response = await fetch('/api/admin/verify-impersonate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: impersonateToken }),
          });

          const data = await response.json();

          if (data.success && data.user) {
            // sessionStorage에 impersonate 사용자 정보 저장
            sessionStorage.setItem('impersonate_user', JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
              name: data.user.name,
              impersonatedBy: data.impersonatedBy,
            }));

            // URL에서 토큰 제거
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('impersonate_token');
            window.history.replaceState({}, '', newUrl);

            // 사용자 정보 설정
            setUserId(data.user.id);
            setUserEmail(data.user.email);

            toast.success(`${data.user.email}로 전환되었습니다`, {
              duration: 3000,
              position: 'top-center',
            });
            return;
          }
        } catch (error) {
          console.error('Impersonate 토큰 검증 오류:', error);
          toast.error('회원 전환에 실패했습니다');
        }
      }

      // 일반 로그인 또는 sessionStorage에 저장된 impersonate 정보 확인
      const storedImpersonate = sessionStorage.getItem('impersonate_user');

      if (storedImpersonate) {
        const impersonateUser = JSON.parse(storedImpersonate);
        setUserId(impersonateUser.userId);
        setUserEmail(impersonateUser.email);
        return;
      }

      // 일반 사용자
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        if (user.email) {
          setUserEmail(user.email);
        }

        // tier 정보 가져오기
        const { data: userData } = await supabase
          .from('users')
          .select('tier')
          .eq('id', user.id)
          .single();

        const validTiers = ['light', 'standard', 'advance', 'elite', 'legend'];
        const tier = userData?.tier;
        setUserTier(validTiers.includes(tier) ? tier : 'light');
      } else {
        // 비회원 사용자
        setUserId('guest');
        setUserEmail('');
        setUserTier('light');
      }
    };

    const init = async () => {
      await checkImpersonateToken();
      // impersonate 정보가 설정된 후에 주문 데이터 불러오기
      await fetchOrders();
    };

    init();
  }, []);

  // 날짜 필터 변경 시 주문 다시 조회
  useEffect(() => {
    // 최초 로딩이 아닐 때만 실행 (userId가 설정된 후)
    if (userId) {
      fetchOrders();
    }
  }, [startDate, endDate, userId]);

  // 캐시 & 크레딧 잔액 조회 함수
  const fetchBalances = async (showRefillToast: boolean = true) => {
    // impersonate 사용자 정보 확인
    const impersonateUser = typeof window !== 'undefined'
      ? JSON.parse(sessionStorage.getItem('impersonate_user') || 'null')
      : null;

    const effectiveUserId = impersonateUser ? impersonateUser.userId : userId;

    if (effectiveUserId === 'guest' || !effectiveUserId) {
      setCashBalance(0);
      setCreditBalance(0);
      return;
    }

    try {
      const baseHeaders: Record<string, string> = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      // impersonate 모드인 경우 헤더에 사용자 ID 추가
      if (impersonateUser) {
        baseHeaders['X-Impersonate-User-Id'] = impersonateUser.userId;
      }

      // 캐시 조회
      const cashResponse = await fetch('/api/cash', {
        cache: 'no-store',
        headers: baseHeaders
      });
      const cashData = await cashResponse.json();
      if (cashData.success) {
        setCashBalance(cashData.balance);
      }

      // 크레딧 일일 리필 (날짜 바뀌면 자동으로 100으로 리필)
      const creditResponse = await fetch('/api/credits/daily-refill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...baseHeaders
        },
        cache: 'no-store'
      });
      const creditData = await creditResponse.json();
      if (creditData.success) {
        setCreditBalance(creditData.balance);

        // 리필되었을 때만 토스트 표시 (showRefillToast가 true일 때만)
        if (creditData.refilled && showRefillToast) {
          toast.success('일일 크레딧 100이 지급되었습니다!', {
            position: 'top-center',
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error('잔액 조회 실패:', error);
    }
  };

  // 캐시 & 크레딧 잔액 자동 조회
  useEffect(() => {
    fetchBalances();

    // 30초마다 갱신
    const interval = setInterval(() => fetchBalances(), 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // postMessage로 상태 변경 수신 (최초 1회만)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 이미 처리했으면 무시
      if (messageHandledRef.current) {
        return;
      }

      if (event.data.type === 'setStatus' && event.data.status) {
        setActiveTab('발주서등록');
        setFilterStatus(event.data.status);
        messageHandledRef.current = true;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // 빈 배열로 마운트 시 1회만 등록

  const fetchOrders = async () => {
    try {
      // impersonate 사용자 정보 확인
      const impersonateUser = typeof window !== 'undefined'
        ? JSON.parse(sessionStorage.getItem('impersonate_user') || 'null')
        : null;


      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      // impersonate 모드인 경우 헤더에 사용자 ID 추가
      if (impersonateUser) {
        headers['X-Impersonate-User-Id'] = impersonateUser.userId;
      }


      // API URL에 날짜 파라미터 추가
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }

      const url = `/api/platform-orders${params.toString() ? `?${params.toString()}` : ''}`;

      // API를 통해 주문 조회 (샘플 모드 자동 처리)
      const response = await fetch(url, {
        cache: 'no-store',
        headers
      });
      const result = await response.json();

      if (!result.success) {
        console.error('주문 조회 오류:', result.error);
        return;
      }

      const data = result.data || [];

      // 샘플 데이터인 경우 콘솔에 표시
      if (result.isSample) {
        setIsSampleMode(true);
      } else {
        setIsSampleMode(false);
      }

    // shipping_status를 Order status로 매핑
    const mapShippingStatus = (shippingStatus: string | null): Order['status'] => {
      if (!shippingStatus) return 'registered';

      const statusMap: Record<string, Order['status']> = {
        '발주서등록': 'registered',
        '발주서확정': 'confirmed',
        '결제완료': 'confirmed',
        '상품준비중': 'preparing',
        '배송중': 'shipped',
        '배송완료': 'shipped',
        '발송완료': 'shipped',
        '취소요청': 'cancelRequested',
        '취소완료': 'cancelled',
        '환불완료': 'refunded',
        'refunded': 'refunded'
      };

      return statusMap[shippingStatus] || 'registered';
    };

    // integrated_orders 데이터를 Order 타입으로 변환
    const convertedOrders: Order[] = (data || []).map((order: any, index: number) => ({
      id: order.id,
      orderNo: order.order_number || order.order_no || `TEMP${order.id}`, // 시스템 발주번호
      orderNumber: order.seller_order_number, // 셀러 주문번호
      products: order.option_name,
      amount: order.settlement_amount ? parseFloat(order.settlement_amount) : 0,
      quantity: parseInt(order.quantity) || 0,
      status: mapShippingStatus(order.shipping_status),
      date: order.created_at,
      registeredAt: order.created_at,
      confirmedAt: order.confirmed_at, // 발주확정일시
      shippedDate: order.shipped_date, // 발송일
      courier: order.courier_company, // 택배사
      trackingNo: order.tracking_number, // 송장번호
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
      refundAmount: order.settlement_amount ? parseFloat(order.settlement_amount) : undefined, // 환불액 (정산금액과 동일)
      refundedAt: order.refund_processed_at, // 환불일
      marketName: order.market_name || '미지정', // 마켓명
      sellerMarketName: order.seller_market_name || '미지정', // 셀러 마켓명
      priceUpdatedAt: order.price_updated_at // 공급가 갱신 일시
    }));

    setOrders(convertedOrders);

    // 초기 로딩 완료
    setIsInitialLoading(false);
    } catch (error) {
      console.error('주문 조회 중 오류:', error);
      // 에러가 발생해도 로딩 화면은 닫기
      setIsInitialLoading(false);
    }
  };

  // URL 쿼리 파라미터에서 탭 읽어오기
  useEffect(() => {
    const tabParam = searchParams.get('tab');

    // 모달 모드인 경우 항상 대시보드로 시작
    if (isModalMode) {
      setActiveTab('대시보드');
      localStorage.setItem('ordersActiveTab', '대시보드');
      return;
    }

    if (tabParam && ['대시보드', '발주서등록', '건별등록', '정산관리', '옵션명매핑', '판매자정보', '지갑'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
      localStorage.setItem('ordersActiveTab', tabParam);
    } else {
      // URL에 탭 파라미터가 없으면 localStorage에서 불러오기
      const savedTab = localStorage.getItem('ordersActiveTab');
      if (savedTab) {
        setActiveTab(savedTab as Tab);
      } else {
        // 저장된 탭이 없으면 기본값으로 '대시보드' 설정
        setActiveTab('대시보드');
        localStorage.setItem('ordersActiveTab', '대시보드');
      }
    }
  }, [searchParams, isModalMode]);

  // 탭 변경 시 localStorage에 저장
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('ordersActiveTab', tab);
    // 모바일에서 탭 변경 시 사이드바 닫기
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const statusConfig: Record<Order['status'] | 'refunded', StatusConfig> = {
    registered: { label: '발주서등록', color: '#2563eb', bg: '#dbeafe' },
    confirmed: { label: '발주서확정', color: '#7c3aed', bg: '#ede9fe' },
    preparing: { label: '상품준비중', color: '#f59e0b', bg: '#fef3c7' },
    shipped: { label: '발송완료', color: '#10b981', bg: '#d1fae5' },
    cancelRequested: { label: '취소요청', color: '#f87171', bg: '#fee2e2' },
    cancelled: { label: '취소완료', color: '#6b7280', bg: '#f3f4f6' },
    refunded: { label: '환불완료', color: '#10b981', bg: '#d1fae5' }
  };

  // 날짜와 검색 필터만 적용 (통계 계산용)
  const dateAndSearchFilteredOrders = orders.filter(order => {
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

    // 검색 필터
    const matchesSearch = !searchTerm ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.optionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.marketName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientPhone?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch;
  });

  // 날짜, 검색, 상태 필터 모두 적용 (테이블 표시용)
  const filteredOrders = dateAndSearchFilteredOrders.filter(order => {
    // 상태 필터
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesStatus;
  });

  // 통계 데이터 (상태 필터 제외, 날짜와 검색 필터만 적용)
  const statsData: StatsData[] = [
    { status: 'registered', count: dateAndSearchFilteredOrders.filter(o => o.status === 'registered').length, bgGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' },
    { status: 'confirmed', count: dateAndSearchFilteredOrders.filter(o => o.status === 'confirmed').length, bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
    { status: 'preparing', count: dateAndSearchFilteredOrders.filter(o => o.status === 'preparing').length, bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    { status: 'shipped', count: dateAndSearchFilteredOrders.filter(o => o.status === 'shipped').length, bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
    { status: 'cancelRequested', count: dateAndSearchFilteredOrders.filter(o => o.status === 'cancelRequested').length, bgGradient: 'linear-gradient(135deg, #f87171 0%, #fca5a5 100%)' },
    { status: 'cancelled', count: dateAndSearchFilteredOrders.filter(o => o.status === 'cancelled').length, bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' },
    { status: 'refunded', count: dateAndSearchFilteredOrders.filter(o => o.status === 'refunded').length, bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }
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
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);
        const worksheet = workbook.worksheets[0];
        const jsonData: any[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const rowData: any = {};
          const headers = worksheet.getRow(1).values as any[];
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          if (Object.keys(rowData).length > 0) {
            jsonData.push(rowData);
          }
        });


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
          toast.error('로그인이 필요합니다.', {
            position: 'top-center',
            duration: 3000
          });
          return;
        }

        // UTC 시간 생성
        const utcTime = getCurrentTimeUTC();

        // 옵션명 검증용으로만 option_products 조회 (저장 시에는 서버에서 자동 처리)
        const uniqueOptionNames = [...new Set(jsonData.map((row: any) => String(row['옵션명'] || '')).filter(Boolean))];

        let optionProducts: any[] = [];
        if (uniqueOptionNames.length > 0) {
          const { data: nameData, error: nameError } = await supabase
            .from('option_products')
            .select('option_name, option_code, seller_supply_price')
            .in('option_name', uniqueOptionNames);

          if (!nameError && nameData) {
            optionProducts = nameData;
          }
        }

        // 검증용 Map 생성 (옵션명 검증 모달에서 사용)
        const productMap = new Map<string, any>();
        optionProducts.forEach((product: any) => {
          if (product.option_name) {
            const key = product.option_name.trim().toLowerCase();
            productMap.set(key, product);
          }
        });
        setOptionProductsMap(productMap);

        // 주문 데이터 준비
        let ordersForValidation = jsonData.map((row: any, index: number) => ({
          index,
          orderNumber: String(row['주문번호'] || ''),
          orderer: String(row['주문자'] || ''),
          ordererPhone: String(row['주문자전화번호'] || ''),
          recipient: String(row['수령인'] || ''),
          recipientPhone: String(row['수령인전화번호'] || ''),
          address: String(row['주소'] || ''),
          deliveryMessage: String(row['배송메세지'] || ''),
          optionName: String(row['옵션명'] || ''),
          optionCode: String(row['옵션코드'] || ''),
          quantity: String(row['수량'] || '1'),
          specialRequest: String(row['특이/요청사항'] || ''),
          // DB 저장용 메타데이터 (검증 후 사용)
          _metadata: {
            sheet_date: utcTime.split('T')[0],
            seller_id: user.id,
            created_by: user.id,
            market_name: '플랫폼',
            payment_date: utcTime.split('T')[0],
            shipping_status: '발주서등록'
          }
        }));

        // 1단계: 옵션명 매핑 적용
        const { orders: mappedOrders, mappingResults: results, totalOrders, mappedOrders: mappedCount } =
          await applyOptionMapping(ordersForValidation, user.id);

        ordersForValidation = mappedOrders;

        // 매핑 후 변환된 옵션명도 검증용으로 조회
        if (results.length > 0) {
          const mappedOptionNames = [...new Set(ordersForValidation.map(order => String(order.optionName || '')).filter(Boolean))];

          if (mappedOptionNames.length > 0) {
            const { data: mappedNameData, error: mappedNameError } = await supabase
              .from('option_products')
              .select('option_name, option_code, seller_supply_price')
              .in('option_name', mappedOptionNames);

            if (!mappedNameError && mappedNameData) {
              // 기존 optionProducts에 추가
              optionProducts = [...optionProducts, ...mappedNameData];

              // productMap 다시 생성
              const updatedProductMap = new Map<string, any>();
              optionProducts.forEach((product: any) => {
                if (product.option_name) {
                  const key = product.option_name.trim().toLowerCase();
                  updatedProductMap.set(key, product);
                }
              });
              setOptionProductsMap(updatedProductMap);
            }
          }
        }

        // 2단계: 매핑 결과가 있으면 결과 모달 표시
        if (results.length > 0) {
          setMappingResults(results);
          setMappingStats({ total: totalOrders, mapped: mappedCount });
          setUploadedOrders(ordersForValidation);
          setShowUploadModal(false);
          setShowMappingResultModal(true);
        } else {
          // 매핑 결과가 없으면 바로 검증 모달로
          setUploadedOrders(ordersForValidation);
          setShowUploadModal(false);
          setShowOptionValidationModal(true);
        }

      } catch (error) {
        console.error('엑셀 파일 읽기 오류:', error);
        toast.error('엑셀 파일을 읽는 중 오류가 발생했습니다. 양식을 확인해주세요.', {
          position: 'top-center',
          duration: 3000
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveValidatedOrders = async (validatedOrders: any[]) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다.', {
          position: 'top-center',
          duration: 3000
        });
        return;
      }

      // 최소한의 정보만 전송 - 서버에서 enrichOrdersWithOptionInfo()가 자동 처리
      const ordersToInsert = validatedOrders.map((order) => {
        const quantity = parseInt(order.quantity) || 1;

        return {
          market_name: order._metadata.market_name,
          seller_order_number: order.orderNumber,
          buyer_name: order.orderer,
          buyer_phone: order.ordererPhone,
          recipient_name: order.recipient,
          recipient_phone: order.recipientPhone,
          recipient_address: order.address,
          delivery_message: order.deliveryMessage,
          option_name: order.optionName,         // 서버에서 이걸로 자동 매핑
          option_code: order.optionCode,
          quantity: String(quantity),
          special_request: order.specialRequest,
          sheet_date: order._metadata.sheet_date,
          payment_date: order._metadata.payment_date,
          shipping_status: order._metadata.shipping_status,
          seller_id: order._metadata.seller_id,
          created_by: order._metadata.created_by,
          created_at: getCurrentTimeUTC(),
          is_deleted: false
        };
      });

      // API를 통해 주문 일괄 저장 (옵션 상품 정보 자동 매핑)
      const response = await fetch('/api/platform-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToInsert }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('❌ 주문 저장 실패:', result.error);
        toast.error(`주문 저장에 실패했습니다: ${result.error}`, {
          position: 'top-center',
          duration: 3000
        });
        return;
      }

      showStatusToast('registered', `${result.count}건의 주문이 성공적으로 등록되었습니다.`, 3000);

      // 모달 닫기 및 상태 초기화
      setShowOptionValidationModal(false);
      setUploadedOrders([]);
      setOptionProductsMap(new Map());

      // 주문 목록 새로고침
      await fetchOrders();

    } catch (error) {
      console.error('❌ 주문 저장 중 오류:', error);
      toast.error('주문 저장 중 오류가 발생했습니다.', {
        position: 'top-center',
        duration: 3000
      });
    }
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

  // 샘플 데이터 삭제 핸들러
  const handleDeleteSampleData = async () => {
    if (!confirm('샘플 데이터를 삭제하시겠습니까?\n이후 실제 주문 데이터만 표시됩니다.')) {
      return;
    }

    try {
      const response = await fetch('/api/platform-orders/sample', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('샘플 데이터가 삭제되었습니다.');
        await fetchOrders(); // 주문 목록 새로고침
      } else {
        alert('샘플 데이터 삭제에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('샘플 데이터 삭제 오류:', error);
      alert('샘플 데이터 삭제 중 오류가 발생했습니다.');
    }
  };

  const impersonateUser = typeof window !== 'undefined'
    ? JSON.parse(sessionStorage.getItem('impersonate_user') || 'null')
    : null;

  return (
    <>
      {/* 전체 화면 로딩 스크린 */}
      <LoadingScreen isLoading={isInitialLoading} />

      <div className="platform-orders-page" style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--color-background)'
      }}>
        {/* PWA 설치 안내 배너 */}
        <PWAInstallBanner />

      {/* 관리자 회원 전환 배너 */}
      {impersonateUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>👁️</span>
            <span>
              <strong>{impersonateUser.email}</strong> 계정 조회 전용 모드
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                읽기 전용
              </span>
            </span>
            <button
              onClick={() => {
                sessionStorage.removeItem('impersonate_user');
                window.close();
              }}
              style={{
                marginLeft: '20px',
                padding: '6px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              종료
            </button>
          </div>
        </div>
      )}

      {/* 다크모드 스크롤바 스타일 */}
      <style>{`
        * {
          scrollbar-width: thin;
          scrollbar-color: var(--color-border) var(--color-background);
        }

        *::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        *::-webkit-scrollbar-track {
          background: var(--color-background);
        }

        *::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 6px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-secondary);
        }
      `}</style>

      {/* Toast 컨테이너 */}
      <Toaster
        position="top-center"
        containerStyle={{
          zIndex: 99999
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
      {/* 발주관리 전용 헤더 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '70px',
        background: 'var(--color-background-secondary)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px',
        gap: '16px'
      }}>
        {/* 왼쪽: 햄버거 메뉴(모바일) + 나가기 버튼 & 로그인 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 0 auto' }}>
          {/* 햄버거 메뉴 버튼 (모바일만) */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}

          {/* 나가기/닫기 버튼 */}
          <button
            onClick={() => {
              if (isModalMode) {
                window.parent.postMessage({ type: 'closeModal' }, '*');
              } else {
                // 새 창으로 열린 경우 창 닫기, 아니면 메인 페이지로 이동
                if (window.opener) {
                  window.close();
                } else {
                  router.push('/');
                }
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--color-text)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)';
            }}
          >
            {isModalMode ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                닫기
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                나가기
              </>
            )}
          </button>

          {/* 티어 배지 & 로그인 정보 */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TierBadge tier={userTier} iconOnly glow={0} />
              <div style={{
                fontSize: '14px',
                color: 'var(--color-text)',
                fontWeight: '500'
              }}>
                {userEmail || '로그인 정보 없음'}
              </div>
            </div>
          )}

          {/* 캐시 & 크레딧 배지 (로그인 정보 바로 옆) */}
          {!isMobile && userId && userId !== 'guest' && (
            <>
              <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;700;800&display=swap" rel="stylesheet" />

              {/* 캐시 배지 */}
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block'
                }}
                onMouseEnter={() => setShowCashTooltip(true)}
                onMouseLeave={() => setShowCashTooltip(false)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '24px',
                  padding: '0px 6px',
                  border: '1.5px solid #10b981',
                  borderRadius: '6px',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#10b981',
                    fontFamily: 'Oxanium, monospace',
                    letterSpacing: '0.5px',
                    lineHeight: '1'
                  }}>
                    {cashBalance.toLocaleString()}
                  </span>
                </div>
                {showCashTooltip && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: '0',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    zIndex: 10000
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>달래캐시</div>
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>활동/로그인 보상으로 획득</div>
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: '8px',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: '5px solid rgba(0, 0, 0, 0.9)'
                    }}></div>
                  </div>
                )}
              </div>

              {/* 크레딧 배지 */}
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block'
                }}
                onMouseEnter={() => setShowCreditTooltip(true)}
                onMouseLeave={() => setShowCreditTooltip(false)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '24px',
                  padding: '0px 6px',
                  border: '1.5px solid #7c3aed',
                  borderRadius: '6px',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#7c3aed',
                    fontFamily: 'Oxanium, monospace',
                    letterSpacing: '0.5px',
                    lineHeight: '1'
                  }}>
                    {creditBalance.toLocaleString()}
                  </span>
                </div>
                {showCreditTooltip && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: '0',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    zIndex: 10000
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>크레딧</div>
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>업무도구 사용 포인트 (매일 1,000 리필)</div>
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: '8px',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: '5px solid rgba(0, 0, 0, 0.9)'
                    }}></div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 오른쪽: 새로고침 인디케이터 + 다크모드 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
          {/* 새로고침 인디케이터 */}
          {isRefreshing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#10b981'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                animation: 'spin 1s linear infinite'
              }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              새로고침 완료
            </div>
          )}
          <LocalThemeToggle onThemeChange={handleThemeChange} currentTheme={localTheme} />
        </div>
      </div>

      {/* 샘플 모드 배너 */}
      {isSampleMode && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: 0,
          width: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          zIndex: 1099,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>
            {userId === 'guest'
              ? '샘플 데이터로 미리보기 중입니다. 회원가입 후 실제 주문을 관리하세요.'
              : '샘플 데이터로 미리보기 중입니다. 첫 주문을 등록하면 실제 데이터로 전환됩니다.'}
          </span>
        </div>
      )}

      {/* Overlay (모바일에서 사이드바 열릴 때) */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1050,
            transition: 'opacity 0.3s'
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: '70px',
        left: isMobile ? (sidebarOpen ? 0 : '-250px') : 0,
        width: isMobile ? '250px' : '175px',
        height: 'calc(100vh - 70px)',
        background: 'var(--color-background-secondary)',
        borderRight: '1px solid var(--color-border)',
        zIndex: 1100,
        transition: 'left 0.3s ease',
        overflowY: 'auto'
      }}>
        <div style={{
          paddingTop: '16px',
          paddingLeft: isMobile ? '6px' : '12px',
          paddingRight: isMobile ? '6px' : '12px'
        }}>
          {/* 대시보드 탭 */}
          <button
            onClick={() => handleTabChange('대시보드')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '대시보드' ? 'var(--color-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '대시보드' ? '600' : '400',
              color: 'var(--color-text)',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '대시보드') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
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
            대시보드
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
              background: activeTab === '발주서등록' ? 'var(--color-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '발주서등록' ? '600' : '400',
              color: 'var(--color-text)',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '발주서등록') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
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
            발주서등록
          </button>

          {/* 건별등록 탭 */}
          <button
            onClick={() => handleTabChange('건별등록')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '건별등록' ? 'var(--color-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '건별등록' ? '600' : '400',
              color: 'var(--color-text)',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '건별등록') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '건별등록') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            건별등록
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
              background: activeTab === '정산관리' ? 'var(--color-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '정산관리' ? '600' : '400',
              color: 'var(--color-text)',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '정산관리') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
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
            정산관리
          </button>

          {/* 옵션명매핑 탭 */}
          <button
            onClick={() => handleTabChange('옵션명매핑')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '옵션명매핑' ? 'var(--color-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '옵션명매핑' ? '600' : '400',
              color: 'var(--color-text)',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '옵션명매핑') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '옵션명매핑') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="15" x2="15" y2="15"></line>
              <line x1="12" y1="12" x2="12" y2="18"></line>
            </svg>
            옵션명매핑
          </button>

          {/* 판매자정보 탭 */}
          <button
            onClick={() => handleTabChange('판매자정보')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '판매자정보' ? 'var(--color-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '판매자정보' ? '600' : '400',
              color: 'var(--color-text)',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '판매자정보') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '판매자정보') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            판매자정보
          </button>

          {/* 지갑 탭 */}
          <button
            onClick={() => handleTabChange('지갑')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '지갑' ? 'var(--color-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '지갑' ? '600' : '400',
              color: 'var(--color-text)',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '지갑') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '지갑') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
            </svg>
            지갑
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div
        key={refreshKey}
        style={{
          marginLeft: isMobile ? '0' : '175px',
          paddingLeft: isMobile ? '16px' : '24px',
          paddingRight: isMobile ? '16px' : '24px',
          paddingTop: isSampleMode ? '134px' : '90px',
          paddingBottom: isMobile ? '16px' : '24px',
          background: 'var(--color-background)',
          minHeight: '100vh',
          transition: 'padding-top 0.3s'
        }}
      >
        {/* Tab Content */}
        {activeTab === '대시보드' && (
          <div style={{
            width: '100%'
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
              userId={userId}
              userEmail={userEmail}
            />
          </div>
        )}
        {activeTab === '건별등록' && (
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
        {activeTab === '옵션명매핑' && (
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto'
          }}>
            <OptionMappingTab
              isMobile={isMobile}
            />
          </div>
        )}
        {activeTab === '판매자정보' && (
          <SellerInfoTab userId={userId} />
        )}
        {activeTab === '지갑' && (
          <CashHistoryTab userId={userId} />
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

        <MappingResultModal
          show={showMappingResultModal}
          onClose={() => {
            setShowMappingResultModal(false);
            setShowUploadModal(true);
          }}
          onContinue={() => {
            setShowMappingResultModal(false);
            // 매핑 후에도 매칭 실패한 옵션이 있는지 확인
            const unmatchedOrders = uploadedOrders.filter(order => {
              const optionName = order.optionName || '';
              const key = optionName.trim().toLowerCase();
              return !optionProductsMap.has(key);
            });

            if (unmatchedOrders.length > 0) {
              // 3단계: 매칭 실패한 옵션이 있으면 검증 모달 표시
              setShowOptionValidationModal(true);
            } else {
              // 4단계: 모두 매칭 성공이면 바로 저장
              handleSaveValidatedOrders(uploadedOrders);
            }
          }}
          results={mappingResults}
          totalOrders={mappingStats.total}
          mappedOrders={mappingStats.mapped}
        />

        <OptionValidationModal
          show={showOptionValidationModal}
          onClose={() => setShowOptionValidationModal(false)}
          orders={uploadedOrders}
          onSave={handleSaveValidatedOrders}
          optionProducts={optionProductsMap}
        />
      </div>
    </div>
  </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: 'var(--color-text)'
      }}>
        로딩중...
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
