'use client';

import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
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
import * as XLSX from 'xlsx';
import { validateRequiredColumns } from './utils/validation';
import toast, { Toaster } from 'react-hot-toast';
import { getCurrentTimeUTC } from '@/lib/date';
import { applyOptionMapping } from './utils/applyOptionMapping';
import { showStatusToast } from './utils/statusToast';
import PasswordModal from './modals/PasswordModal';

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const isModalMode = searchParams.get('modal') === 'true';
  const statusParam = searchParams.get('status') as Order['status'] | null;

  const [activeTab, setActiveTab] = useState<Tab>(statusParam ? '발주서등록' : '대시보드');
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [organizationTier, setOrganizationTier] = useState<'light' | 'standard' | 'advance' | 'elite' | 'legend' | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [sellerCode, setSellerCode] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [memberRole, setMemberRole] = useState<string>(''); // 조직 내 역할

  // 서브계정 관련 상태
  const [subAccounts, setSubAccounts] = useState<any[]>([]);
  const [selectedSubAccount, setSelectedSubAccount] = useState<any | null>(null); // null = 메인 계정
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [contributionPoints, setContributionPoints] = useState<number>(0);
  const [showCashTooltip, setShowCashTooltip] = useState(false);
  const [showCreditTooltip, setShowCreditTooltip] = useState(false);

  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>(statusParam || 'registered');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>(''); // 테이블 전용 검색어

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

  // 비밀번호 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [currentPasswordFile, setCurrentPasswordFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState<string>('');

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

    // localStorage에 저장 (FOUC 방지용)
    localStorage.setItem('theme', newTheme);

    // DB에 저장 (orders_theme과 theme_preference 모두 업데이트)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('users')
        .update({
          orders_theme: newTheme,
          theme_preference: newTheme // ThemeContext와 동기화
        })
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

  // F5 키 가로채기 - 완전한 새로고침 (Ctrl+Shift+R과 동일)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // F5 키 또는 Ctrl+R 감지 (e.code도 체크)
      if (e.key === 'F5' || e.code === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault(); // 기본 새로고침 동작 막기
        e.stopPropagation(); // 이벤트 전파 중지

        try {
          // 강제 새로고침: 캐시를 무시하고 서버에서 새로 가져옴 (Ctrl+Shift+R과 동일)
          window.location.reload();
        } catch (error) {
          console.error('새로고침 오류:', error);
        }
      }
    };

    // capture 단계에서 이벤트 캡처
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

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

      // 일반 사용자 - API를 통해 정보 가져오기
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (data.success && data.user) {
          const { user: profileUser } = data;

          setUserId(profileUser.id);
          setUserEmail(profileUser.email || '');
          setUserRole(profileUser.role || '');

          // 조직 정보 가져오기 (profile 페이지와 동일한 방식)
          if (profileUser.primary_organization_id) {
            const supabase = createClient();
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select(`
                id,
                owner_id,
                is_active,
                seller_code,
                partner_code,
                business_name,
                business_number,
                business_address,
                business_email,
                representative_name,
                representative_phone,
                manager_name,
                manager_phone,
                bank_account,
                bank_name,
                account_holder,
                store_name,
                store_phone,
                tier
              `)
              .eq('id', profileUser.primary_organization_id)
              .single();

            if (orgError) {
              console.error('❌ 조직 정보 로드 오류:', orgError);
            }

            if (orgData) {
              const validTiers = ['light', 'standard', 'advance', 'elite', 'legend'];

              setOrganizationId(orgData.id); // organizationId 설정
              setOrganizationName(orgData.business_name || '');

              // 조직의 tier 설정
              const orgTier = orgData.tier?.toLowerCase();
              if (orgTier && validTiers.includes(orgTier)) {
                setOrganizationTier(orgTier as any);
              } else {
                setOrganizationTier(null);
              }

              // role에 따라 적절한 코드 표시
              const code = profileUser.role === 'seller'
                ? orgData.seller_code
                : profileUser.role === 'partner'
                ? orgData.partner_code
                : '';
              setSellerCode(code || '');
            }

            // 조직 내 역할 가져오기
            const { data: memberData } = await supabase
              .from('organization_members')
              .select('role')
              .eq('organization_id', profileUser.primary_organization_id)
              .eq('user_id', profileUser.id)
              .eq('status', 'active')
              .single();

            if (memberData) {
              const roleNames: Record<string, string> = {
                'owner': '대표',
                'admin': '관리자',
                'member': '담당자'
              };
              const roleName = roleNames[memberData.role] || memberData.role;
              setMemberRole(roleName);
            }

            // 서브계정 목록 불러오기
            try {
              const subResponse = await fetch('/api/organizations/sub');
              const subData = await subResponse.json();

              if (subData.success && subData.sub_organizations) {
                setSubAccounts(subData.sub_organizations);
              }
            } catch (error) {
              console.error('❌ 서브계정 목록 로드 실패:', error);
            }
          }
        } else {
          // 비회원 사용자
          setUserId('guest');
          setUserEmail('');
          setOrganizationTier('light');
          setOrganizationName('');
          setSellerCode('');
          setUserRole('');
          setMemberRole('');
        }
      } catch (error) {
        console.error('❌ 사용자 정보 로드 실패:', error);
        setUserId('guest');
        setUserEmail('');
        setOrganizationTier('light');
        setOrganizationName('');
        setSellerCode('');
        setUserRole('');
        setMemberRole('');
      }
    };

    const init = async () => {
      await checkImpersonateToken();
      // impersonate 정보가 설정된 후에 주문 데이터 불러오기
      await fetchOrders();
    };

    init();
  }, []);

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

      if (!cashResponse.ok) {
        console.error('캐시 조회 실패:', cashResponse.status, cashResponse.statusText);
        throw new Error(`캐시 조회 실패: ${cashResponse.status}`);
      }

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

      if (!creditResponse.ok) {
        console.error('크레딧 조회 실패:', creditResponse.status, creditResponse.statusText);
        throw new Error(`크레딧 조회 실패: ${creditResponse.status}`);
      }

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

      // 기여점수 조회 (organizations.accumulated_points)
      const supabase = createClient();
      const effectiveUserId = impersonateUser?.userId || userId;

      if (effectiveUserId) {
        // 사용자의 primary_organization_id 조회
        const { data: userData } = await supabase
          .from('users')
          .select('primary_organization_id')
          .eq('id', effectiveUserId)
          .single();

        if (userData?.primary_organization_id) {
          // 조직의 accumulated_points 조회
          const { data: orgData } = await supabase
            .from('organizations')
            .select('accumulated_points')
            .eq('id', userData.primary_organization_id)
            .single();

          if (orgData) {
            setContributionPoints(orgData.accumulated_points || 0);
          }
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


      // API URL - 날짜 파라미터 제거 (프론트엔드에서만 필터링)
      const url = `/api/platform-orders`;

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
      cancelApprovedAt: order.cancel_approved_at, // 취소승인일시
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
      unitPrice: order.seller_supply_price_snapshot
        ? parseFloat(order.seller_supply_price_snapshot)
        : (order.seller_supply_price ? parseFloat(order.seller_supply_price) : undefined), // 발주확정 시점 스냅샷 우선, 없으면 현재값
      supplyPrice: order.product_amount ? parseFloat(order.product_amount) : undefined,
      discountAmount: order.discount_amount ? parseFloat(order.discount_amount) : 0, // 할인액 (DB 저장값)
      cashUsed: order.cash_used ? parseFloat(order.cash_used) : 0, // 사용캐시 (DB 저장값)
      settlementAmount: order.final_deposit_amount ? parseFloat(order.final_deposit_amount) : 0, // 정산금액 (최종입금액)
      refundAmount: order.refund_amount_canceled ? parseFloat(order.refund_amount_canceled) : undefined, // 환불액
      refundedAt: order.refund_amount_canceled_at, // 환불일
      marketName: order.market_name || '미지정', // 마켓명
      sellerMarketName: order.seller_market_name || '미지정', // 셀러 마켓명
      priceUpdatedAt: order.price_updated_at, // 공급가 갱신 일시
      subAccountId: order.sub_account_id || null, // 서브계정 ID
      updated_at: order.updated_at // 날짜 필터용
    } as any));

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

    if (tabParam && ['대시보드', '발주서등록', '건별등록', '정산관리', '옵션상품매핑', '판매자정보', '지갑'].includes(tabParam)) {
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

  // 서브계정 필터링된 주문 목록
  const filteredOrdersBySubAccount = useMemo(() => {
    if (selectedSubAccount === null) {
      // '전체' 선택: 모든 주문 표시
      return orders;
    } else if (selectedSubAccount === 'main') {
      // '메인계정' 선택: sub_account_id가 null인 주문만
      return orders.filter(order => !order.subAccountId);
    } else {
      // 특정 서브계정 선택: 해당 서브계정의 주문만
      return orders.filter(order => order.subAccountId === selectedSubAccount.id);
    }
  }, [orders, selectedSubAccount]);

  // 날짜 필터만 적용 (통계 계산용) - 서브계정 필터링된 주문 기준
  const dateFilteredOrders = useMemo(() => {
    return filteredOrdersBySubAccount.filter(order => {
      // 날짜 필터 (한국 시간 기준) - updated_at 기준
      let matchesDate = true;
      if (startDate || endDate) {
        // updated_at만 사용
        const dateValue = (order as any).updated_at;

        if (!dateValue) {
          return true; // updated_at 값이 없으면 필터 통과
        }

        // UTC 시간을 한국 시간(UTC+9)으로 변환
        const orderDate = new Date(dateValue);
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

      return matchesDate;
    });
  }, [filteredOrdersBySubAccount, startDate, endDate]);

  // 날짜, 상태, 테이블검색 필터 모두 적용 (테이블 표시용)
  const filteredOrders = useMemo(() => {
    return dateFilteredOrders.filter(order => {
      // 상태 필터
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

      // 테이블 검색 필터
      const matchesTableSearch = !tableSearchTerm || [
        order.orderer,
        order.ordererPhone,
        order.recipient,
        order.recipientPhone,
        order.address,
        order.optionName,
        order.products
      ].some(field => field && field.toLowerCase().includes(tableSearchTerm.toLowerCase()));

      return matchesStatus && matchesTableSearch;
    });
  }, [dateFilteredOrders, filterStatus, tableSearchTerm]);

  // 통계 데이터 (상태 필터 제외, 날짜 필터만 적용)
  const statsData: StatsData[] = [
    { status: 'registered', count: dateFilteredOrders.filter(o => o.status === 'registered').length, bgGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' },
    { status: 'confirmed', count: dateFilteredOrders.filter(o => o.status === 'confirmed').length, bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
    { status: 'preparing', count: dateFilteredOrders.filter(o => o.status === 'preparing').length, bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    { status: 'shipped', count: dateFilteredOrders.filter(o => o.status === 'shipped').length, bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
    { status: 'cancelRequested', count: dateFilteredOrders.filter(o => o.status === 'cancelRequested').length, bgGradient: 'linear-gradient(135deg, #f87171 0%, #fca5a5 100%)' },
    { status: 'cancelled', count: dateFilteredOrders.filter(o => o.status === 'cancelled').length, bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' },
    { status: 'refunded', count: dateFilteredOrders.filter(o => o.status === 'refunded').length, bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }
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

  // 발주서 양식 다운로드
  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/발주서_양식.xlsx';
    link.download = '달래마켓_발주서양식.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // 파일 타입 검증 (xlsx, xls, csv 모두 허용)
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error(`${file.name}은(는) 지원되지 않는 파일 형식입니다. (xlsx, xls, csv만 가능)`, {
        position: 'top-center',
        duration: 3000
      });
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();

      // SheetJS로 파일 읽기 (XLS, XLSX, CSV 모두 지원)
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // SheetJS로 JSON 변환 (배열 형식)
      const allData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,  // 배열 형식으로
        defval: '',  // 빈 셀 기본값
        raw: false   // 문자열로 변환
      }) as any[][];

      if (!allData || allData.length === 0) {
        toast.error('파일에 데이터가 없습니다.', {
          position: 'top-center',
          duration: 3000
        });
        return;
      }

      // 첫 번째 행을 헤더로 사용
      const headers = allData[0] || [];
      const jsonData: any[] = [];

      // 헤더 이후의 데이터만 처리
      for (let i = 1; i < allData.length; i++) {
        const rowArray = allData[i];
        const rowData: any = {};

        headers.forEach((header: any, colIndex: number) => {
          if (header) {
            rowData[String(header)] = rowArray[colIndex] || '';
          }
        });

        if (Object.keys(rowData).length > 0) {
          jsonData.push(rowData);
        }
      }


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

        // 옵션상품 검증용으로만 option_products 조회 (저장 시에는 서버에서 자동 처리)
        const uniqueOptionNames = [...new Set(jsonData.map((row: any) => String(row['옵션상품'] || '')).filter(Boolean))];

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

        // 검증용 Map 생성 (옵션상품 검증 모달에서 사용)
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
          optionName: String(row['옵션상품'] || ''),
          optionCode: String(row['옵션코드'] || ''),
          quantity: String(row['수량'] || '1'),
          specialRequest: String(row['특이/요청사항'] || ''),
          // DB 저장용 메타데이터 (검증 후 사용)
          _metadata: {
            sheet_date: utcTime.split('T')[0],
            created_by: user.id,
            market_name: '플랫폼',
            payment_date: utcTime.split('T')[0],
            shipping_status: '발주서등록',
            sub_account_id: (selectedSubAccount && selectedSubAccount !== 'main') ? selectedSubAccount.id : null
          }
        }));

        // 1단계: 옵션상품 매핑 적용
        const { orders: mappedOrders, mappingResults: results, totalOrders, mappedOrders: mappedCount } =
          await applyOptionMapping(ordersForValidation, user.id);

        ordersForValidation = mappedOrders;

        // 매핑 후 변환된 옵션상품도 검증용으로 조회
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

    } catch (error: any) {
      // 암호화된 파일 감지
      if (
        error.message && (
          error.message.includes('password') ||
          error.message.includes('encrypted') ||
          error.message.includes('Unsupported') ||
          error.message.includes('CFB') ||
          error.message.toLowerCase().includes('encryption')
        )
      ) {
        // 암호화된 파일 설정
        setCurrentPasswordFile(file);
        setShowPasswordModal(true);
        return;
      }

      console.error('엑셀 파일 읽기 오류:', error);
      toast.error('엑셀 파일을 읽는 중 오류가 발생했습니다. 양식을 확인해주세요.', {
        position: 'top-center',
        duration: 3000
      });
    }
  };

  // 비밀번호 제출 핸들러
  const handlePasswordSubmit = async (password: string) => {
    if (!currentPasswordFile) return;

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', currentPasswordFile);
      formData.append('password', password);

      // 서버에 복호화 요청
      const response = await fetch('/api/decrypt-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = '비밀번호가 올바르지 않습니다. 다시 시도해주세요.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // JSON 파싱 실패 시 기본 메시지 사용
        }

        toast.error(errorMessage, {
          duration: 3000,
          position: 'top-center',
        });
        return; // 모달을 닫지 않고 다시 입력 대기
      }

      // 복호화된 파일 받기
      const decryptedBuffer = await response.arrayBuffer();

      // 복호화된 파일을 새 File 객체로 생성
      const decryptedFile = new File([decryptedBuffer], currentPasswordFile.name, {
        type: currentPasswordFile.type,
        lastModified: currentPasswordFile.lastModified,
      });

      // 모달 닫기
      setShowPasswordModal(false);
      setCurrentPasswordFile(null);

      // 복호화된 파일로 다시 처리
      const fileList = new DataTransfer();
      fileList.items.add(decryptedFile);
      await handleFiles(fileList.files);
    } catch (error: any) {
      console.error('복호화 처리 오류:', error);
      toast.error('파일 처리 중 오류가 발생했습니다.', {
        duration: 3000,
        position: 'top-center',
      });
    }
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
          created_by: order._metadata.created_by,
          sub_account_id: order._metadata.sub_account_id,
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

      {/* 다크모드 스크롤바 & 반응형 스타일 */}
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

        /* 반응형 유틸리티 클래스 */
        .responsive-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .responsive-button {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .responsive-flex-wrap {
          flex-wrap: wrap;
          gap: 8px !important;
        }

        /* 모바일 대응 */
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none !important;
          }

          .mobile-full-width {
            width: 100% !important;
          }

          .mobile-small-text {
            font-size: 12px !important;
          }

          .mobile-small-padding {
            padding: 4px 8px !important;
          }

          .mobile-gap-small {
            gap: 4px !important;
          }
        }

        /* 태블릿 대응 */
        @media (max-width: 1024px) {
          .tablet-flex-wrap {
            flex-wrap: wrap !important;
          }

          .tablet-small-text {
            font-size: 13px !important;
          }
        }

        /* 작은 화면에서 버튼 텍스트 오버플로우 방지 */
        button {
          overflow: hidden;
          text-overflow: ellipsis;
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
      <div className="tablet-flex-wrap" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: '70px',
        height: 'auto',
        background: 'var(--color-background-secondary)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '8px 12px' : '0 24px',
        gap: isMobile ? '8px' : '16px',
        flexWrap: 'wrap'
      }}>
        {/* 왼쪽: 햄버거 메뉴(모바일) + 나가기 버튼 & 로그인 정보 */}
        <div className="tablet-flex-wrap mobile-gap-small" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto', minWidth: 0, flexWrap: 'wrap' }}>
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

          {/* 로그인 정보 */}
          {!isMobile && (
            <div className="tablet-flex-wrap" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              maxWidth: 'calc(100vw - 300px)'
            }}>
              {/* 셀러계정 정보 (등급 배지, 캐시, 크레딧, 기여점수 포함) */}
              {organizationName && (
                <div className="tablet-small-text" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px',
                  background: 'var(--color-primary-alpha)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--color-primary)',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}>
                  {/* 등급 배지 */}
                  {organizationTier && (
                    <div style={{ transform: 'scale(0.8)', display: 'flex', alignItems: 'center' }}>
                      <TierBadge tier={organizationTier} iconOnly glow={0} />
                    </div>
                  )}

                  {/* 셀러계정명 + 코드 */}
                  <div className="responsive-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: '1 1 auto' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{organizationName}</span>
                    {sellerCode && (
                      <>
                        <span style={{ opacity: 0.5, flexShrink: 0 }}>·</span>
                        <span style={{ fontFamily: 'monospace', flexShrink: 0 }}>{sellerCode}</span>
                      </>
                    )}
                  </div>

                  {/* 구분선 */}
                  {userId && userId !== 'guest' && (
                    <div style={{
                      width: '1px',
                      height: '16px',
                      background: 'currentColor',
                      opacity: 0.3
                    }} />
                  )}

                  {/* 캐시 */}
                  {userId && userId !== 'guest' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontFamily: 'Oxanium, monospace'
                    }}>
                      <span style={{ opacity: 0.7 }}>캐시</span>
                      <span>{cashBalance.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 서브계정 선택 배지 - 서브계정이 2개 이상일 때만 표시 */}
              {userId && userId !== 'guest' && organizationName && subAccounts.length > 0 && (
                <div className="responsive-flex-wrap" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 0',
                  flexWrap: 'wrap'
                }}>
                  {/* 전체 배지 */}
                  <button
                    onClick={() => setSelectedSubAccount(null)}
                    className="responsive-button mobile-small-padding"
                    style={{
                      padding: '4px 10px',
                      background: !selectedSubAccount ? 'var(--color-success)' : 'var(--color-surface)',
                      border: `1px solid ${!selectedSubAccount ? 'var(--color-success)' : 'var(--color-border)'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: !selectedSubAccount ? '#fff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSubAccount) {
                        e.currentTarget.style.background = 'var(--color-primary-alpha)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSubAccount) {
                        e.currentTarget.style.background = 'var(--color-surface)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                  >
                    전체
                  </button>

                  {/* 메인 계정 배지 */}
                  <button
                    onClick={() => setSelectedSubAccount('main')}
                    className="responsive-button mobile-small-padding"
                    style={{
                      padding: '4px 10px',
                      background: selectedSubAccount === 'main' ? 'var(--color-success)' : 'var(--color-surface)',
                      border: `1px solid ${selectedSubAccount === 'main' ? 'var(--color-success)' : 'var(--color-border)'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: selectedSubAccount === 'main' ? '#fff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSubAccount !== 'main') {
                        e.currentTarget.style.background = 'var(--color-primary-alpha)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSubAccount !== 'main') {
                        e.currentTarget.style.background = 'var(--color-surface)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                    title={organizationName}
                  >
                    메인계정
                  </button>

                  {/* 서브계정 배지들 */}
                  {subAccounts.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubAccount(sub)}
                      className="responsive-button mobile-small-padding"
                      style={{
                        padding: '4px 10px',
                        background: selectedSubAccount?.id === sub.id ? 'var(--color-success)' : 'var(--color-surface)',
                        border: `1px solid ${selectedSubAccount?.id === sub.id ? 'var(--color-success)' : 'var(--color-border)'}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: selectedSubAccount?.id === sub.id ? '#fff' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        maxWidth: '150px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSubAccount?.id !== sub.id) {
                          e.currentTarget.style.background = 'var(--color-primary-alpha)';
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.color = 'var(--color-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedSubAccount?.id !== sub.id) {
                          e.currentTarget.style.background = 'var(--color-surface)';
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }
                      }}
                      title={`${sub.business_name} (${sub.representative_name})`}
                    >
                      {sub.business_name}
                    </button>
                  ))}
                </div>
              )}

              {/* 사용자 이메일 */}
              <div className="responsive-text tablet-small-text" style={{
                fontSize: '14px',
                color: 'var(--color-text)',
                fontWeight: '500',
                maxWidth: '200px'
              }}>
                {userEmail || '로그인 정보 없음'}
              </div>

              {/* 조직 내 역할 */}
              {memberRole && (
                <div style={{
                  padding: '2px 8px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)'
                }}>
                  {memberRole}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Oxanium 폰트 로드 */}
        <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;700;800&display=swap" rel="stylesheet" />

        {/* 오른쪽: 새로고침 인디케이터 + 나가기 버튼 */}
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

          {/* 나가기 버튼 */}
          <button
            onClick={() => {
              window.close();
            }}
            className="mobile-small-padding"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '4px 8px' : '6px 12px',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-hover)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            나가기
          </button>
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

          {/* 옵션상품매핑 탭 */}
          <button
            onClick={() => handleTabChange('옵션상품매핑')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '옵션상품매핑' ? 'var(--color-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '옵션상품매핑' ? '600' : '400',
              color: 'var(--color-text)',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '옵션상품매핑') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '옵션상품매핑') {
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
            옵션상품매핑
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

          {/* 사이드바 하단: 다크모드 토글 */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              paddingBottom: '16px'
            }}>
              <LocalThemeToggle onThemeChange={handleThemeChange} currentTheme={localTheme} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div
        key={refreshKey}
        style={{
          marginLeft: isMobile ? '0' : '175px',
          paddingLeft: activeTab === '판매자정보' ? '0' : (isMobile ? '16px' : '24px'),
          paddingRight: activeTab === '판매자정보' ? '0' : (isMobile ? '16px' : '24px'),
          paddingTop: activeTab === '판매자정보' ? '0' : (isSampleMode ? '134px' : '90px'),
          paddingBottom: activeTab === '판매자정보' ? '0' : (isMobile ? '16px' : '24px'),
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
              orders={filteredOrdersBySubAccount}
              statusConfig={statusConfig}
              isSampleMode={isSampleMode}
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
              tableSearchTerm={tableSearchTerm}
              setTableSearchTerm={setTableSearchTerm}
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
              organizationId={organizationId}
              selectedSubAccount={selectedSubAccount}
              isSampleMode={isSampleMode}
              subAccounts={subAccounts}
              organizationName={organizationName}
              organizationTier={organizationTier}
            />
          </div>
        )}
        {activeTab === '건별등록' && (
          <MobileRegistrationTab
            isMobile={isMobile}
            onRefresh={fetchOrders}
            userEmail={userEmail}
            selectedSubAccount={selectedSubAccount}
          />
        )}
        {activeTab === '정산관리' && (
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto'
          }}>
            <SettlementTab
              isMobile={isMobile}
              orders={filteredOrdersBySubAccount}
            />
          </div>
        )}
        {activeTab === '옵션상품매핑' && (
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
          <div style={{
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            overflow: 'hidden'
          }}>
            <SellerInfoTab />
          </div>
        )}
        {activeTab === '지갑' && (
          <CashHistoryTab />
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
          onDownloadTemplate={handleDownloadTemplate}
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

        {/* 비밀번호 입력 모달 */}
        <PasswordModal
          show={showPasswordModal}
          fileName={currentPasswordFile?.name || ''}
          onSubmit={handlePasswordSubmit}
          onCancel={() => {
            setShowPasswordModal(false);
            setCurrentPasswordFile(null);
          }}
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
