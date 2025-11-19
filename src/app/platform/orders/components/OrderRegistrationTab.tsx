'use client';

import { useMemo, useState, useEffect } from 'react';
import { Order, StatusConfig, StatsData } from '../types';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import DatePicker from '@/components/ui/DatePicker';
import { Modal } from '@/components/ui/Modal';
import { Download, Upload, RefreshCw, Check, X } from 'lucide-react';
import ExcelJS from 'exceljs';
import toast, { Toaster } from 'react-hot-toast';
import { getCurrentTimeUTC, formatDateTimeForDisplay } from '@/lib/date';
import MarketFileUploadModal from '../modals/MarketFileUploadModal';
import OptionValidationModal from '../modals/OptionValidationModal';
import SellerInfoValidationModal from '../modals/SellerInfoValidationModal';

interface OrderRegistrationTabProps {
  isMobile: boolean;
  orders: Order[];
  statsData: StatsData[];
  statusConfig: Record<Order['status'], StatusConfig>;
  filterStatus: 'all' | Order['status'];
  setFilterStatus: (status: 'all' | Order['status']) => void;
  tableSearchTerm: string;
  setTableSearchTerm: (term: string) => void;
  selectedOrders: number[];
  setSelectedOrders: (orders: number[]) => void;
  setShowUploadModal: (show: boolean) => void;
  filteredOrders: Order[];
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectOrder: (id: number) => void;
  setSelectedOrder: (order: Order | null) => void;
  setShowDetailModal: (show: boolean) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  onRefresh?: () => void;
  userEmail: string;
  organizationId: string;
  selectedSubAccount: any | null;
  isSampleMode?: boolean;
  subAccounts?: any[];
  organizationName?: string;
  organizationTier?: string;
}

export default function OrderRegistrationTab({
  isMobile,
  orders,
  isSampleMode = false,
  statsData,
  statusConfig,
  filterStatus,
  setFilterStatus,
  tableSearchTerm,
  setTableSearchTerm,
  selectedOrders,
  setSelectedOrders,
  setShowUploadModal,
  filteredOrders,
  handleSelectAll,
  handleSelectOrder,
  setSelectedOrder,
  setShowDetailModal,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onRefresh,
  userEmail,
  organizationId: propOrganizationId,
  selectedSubAccount,
  subAccounts = [],
  organizationName = '',
  organizationTier = null
}: OrderRegistrationTabProps) {

  // 사용자 정보 (내부에서 조회)
  const [userId, setUserId] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>(propOrganizationId);

  // 툴팁 상태 관리 (최상단에 배치)
  const [hoveredStatus, setHoveredStatus] = useState<Order['status'] | null>(null);

  // 선택된 날짜 필터 상태
  const [selectedDateFilter, setSelectedDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | '90days' | null>('7days');

  // 그리드 리마운트 트리거
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 마켓송장파일 모달 상태
  const [showMarketInvoiceModal, setShowMarketInvoiceModal] = useState(false);

  // 마켓파일 업로드 모달 상태
  const [showMarketFileUploadModal, setShowMarketFileUploadModal] = useState(false);

  // 옵션 검증 모달 상태 (발주확정 전 검증용)
  const [showOptionValidationModal, setShowOptionValidationModal] = useState(false);
  const [validatedOrders, setValidatedOrders] = useState<any[]>([]);

  // 안내문구 펼침/접기 상태 (처음엔 접힌 상태)
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const [optionProductsMap, setOptionProductsMap] = useState<Map<string, any>>(new Map());

  // 다크모드 상태 추적
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 판매자 정보 검증 모달 상태
  const [showSellerInfoValidationModal, setShowSellerInfoValidationModal] = useState(false);

  // 입금자명 입력 모달 상태
  const [showDepositorNameModal, setShowDepositorNameModal] = useState(false);
  const [depositorNameInput, setDepositorNameInput] = useState('');
  const [defaultDepositorName, setDefaultDepositorName] = useState('');

  // 캐시 관련 state
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [cashToUse, setCashToUse] = useState<string>(''); // 입력 중인 값 (문자열로 관리)
  const [appliedCashToUse, setAppliedCashToUse] = useState<number>(0); // 실제 적용된 값
  const [isCashEnabled, setIsCashEnabled] = useState<boolean>(false);

  // 공급가 갱신 상태
  const [isPriceUpdated, setIsPriceUpdated] = useState<boolean>(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState<boolean>(false);
  const [lastPriceUpdateTime, setLastPriceUpdateTime] = useState<string>('');

  // 티어 할인율 관련 state
  const [discountRate, setDiscountRate] = useState<number | null>(null);

  // DB에서 티어 할인율 조회
  useEffect(() => {
    const fetchTierDiscountRate = async () => {
      if (!organizationTier) {
        setDiscountRate(0);
        return;
      }

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data, error } = await supabase
          .from('tier_criteria')
          .select('discount_rate')
          .eq('tier', organizationTier.toUpperCase())
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('티어 할인율 조회 실패:', error);
          setDiscountRate(0);
          return;
        }

        if (data) {
          setDiscountRate(Number(data.discount_rate) || 0);
        } else {
          setDiscountRate(0);
        }
      } catch (error) {
        console.error('티어 할인율 조회 오류:', error);
        setDiscountRate(0);
      }
    };

    fetchTierDiscountRate();
  }, [organizationTier]);

  // organizationId prop 변경 시 state 업데이트
  useEffect(() => {
    if (propOrganizationId) {
      setOrganizationId(propOrganizationId);
    }
  }, [propOrganizationId]);

  // 사용자 정보 및 조직 정보 조회
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);

          // props로 organizationId를 받지 못한 경우에만 직접 조회
          if (!propOrganizationId) {
            const { data: userData } = await supabase
              .from('users')
              .select('primary_organization_id')
              .eq('id', user.id)
              .single();

            if (userData?.primary_organization_id) {
              setOrganizationId(userData.primary_organization_id);
            }
          }
        } else {
          setUserId('guest');
        }
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
        setUserId('guest');
      }
    };

    fetchUserInfo();
  }, [propOrganizationId]);

  // 다크모드 감지
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    // 초기 다크모드 상태 설정
    const initialDarkMode = document.documentElement.classList.contains('dark');
    console.log('🌓 초기 다크모드 상태:', initialDarkMode);
    setIsDarkMode(initialDarkMode);

    // MutationObserver로 dark 클래스 변경 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const newDarkMode = document.documentElement.classList.contains('dark');
          console.log('🌓 다크모드 변경 감지:', newDarkMode, 'classList:', document.documentElement.className);
          setIsDarkMode(newDarkMode);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // 조직의 tier와 할인율 조회 (prop에서 받은 tier 사용)
  useEffect(() => {
    const fetchDiscountRate = async () => {
      if (!organizationTier) {
        return;
      }

      const tier = organizationTier.toUpperCase();

      try {
        console.log('🔍 티어 할인율 조회 시작:', { tier });

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // tier_criteria에서 할인율 조회
        const { data: criteriaData, error: criteriaError } = await supabase
          .from('tier_criteria')
          .select('discount_rate, description')
          .eq('tier', tier)
          .single();

        if (criteriaError) {
          console.error('❌ 티어 기준 조회 오류:', criteriaError);
          return;
        }

        if (criteriaData) {
          const rate = Number(criteriaData.discount_rate) || 0;
          setDiscountRate(rate);
          console.log('✅ 티어 할인율 적용:', {
            조직명: organizationName,
            티어: tier,
            할인율: `${rate}%`,
            설명: criteriaData.description
          });
        }
      } catch (error) {
        console.error('❌ 티어 할인율 조회 중 오류:', error);
      }
    };

    fetchDiscountRate();
  }, [organizationTier, organizationName]);

  // 필터 상태 변경 시 공급가 갱신 상태 확인
  useEffect(() => {
    // 발주서등록 상태가 아니면 초기화
    if (filterStatus !== 'registered') {
      setIsPriceUpdated(false);
      setIsCashEnabled(false);
      setCashToUse(0);
      return;
    }

    // 주문이 없으면 갱신 불필요 (입금완료 버튼에서 체크됨)
    if (filteredOrders.length === 0) {
      setIsPriceUpdated(false);
      setIsCashEnabled(false);
      setCashToUse(0);
      return;
    }

    // 오늘 날짜 (한국 시간 기준)
    const today = new Date();
    const koreaToday = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    const todayStr = koreaToday.toISOString().split('T')[0]; // YYYY-MM-DD

    // 모든 주문이 오늘 갱신되었는지 체크 (하나라도 오늘이 아니면 갱신 필요)
    const allUpdatedToday = filteredOrders.every(order => {
      if (!order.priceUpdatedAt) return false; // 갱신 이력 없음

      const updatedDate = new Date(order.priceUpdatedAt);
      const koreaUpdatedDate = new Date(updatedDate.getTime() + (9 * 60 * 60 * 1000));
      const updatedDateStr = koreaUpdatedDate.toISOString().split('T')[0];

      return updatedDateStr === todayStr; // 오늘이어야 함
    });

    // 모든 주문이 오늘 갱신되었을 때만 다음 단계 진행 가능
    setIsPriceUpdated(allUpdatedToday);
    if (!allUpdatedToday) {
      setIsCashEnabled(false);
      setCashToUse(0);
    }
  }, [filterStatus, filteredOrders]);

  // 캐시 잔액 조회
  useEffect(() => {
    const fetchCashBalance = async () => {
      try {
        const response = await fetch('/api/cash');
        const data = await response.json();

        if (data.success) {
          setCashBalance(data.balance);
        }
      } catch (error) {
        console.error('캐시 잔액 조회 실패:', error);
      }
    };

    fetchCashBalance();
  }, []);

  // 공급가 갱신 핸들러
  const handlePriceUpdate = async () => {
    if (filteredOrders.length === 0) {
      showModal('alert', '알림', '처리할 주문이 없습니다.');
      return;
    }

    setIsUpdatingPrice(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // 모든 옵션상품 수집 (중복 제거)
      const uniqueOptionNames = [...new Set(filteredOrders.map(order => order.products).filter(Boolean))];


      // option_products에서 최신 공급단가 조회
      const { data: optionProducts, error: optionError } = await supabase
        .from('option_products')
        .select('option_name, seller_supply_price')
        .in('option_name', uniqueOptionNames);

      if (optionError) {
        console.error('❌ 옵션 상품 조회 오류:', optionError);
        showModal('alert', '오류', '옵션 상품 조회 중 오류가 발생했습니다.');
        setIsUpdatingPrice(false);
        return;
      }


      // 옵션상품 -> 공급단가 맵 생성
      const priceMap = new Map<string, number>();
      (optionProducts || []).forEach((product: any) => {
        if (product.option_name && product.seller_supply_price) {
          const key = product.option_name.trim().toLowerCase();
          priceMap.set(key, Number(product.seller_supply_price));
        }
      });

      // 각 주문의 공급가 업데이트
      let updatedCount = 0;
      let notFoundCount = 0;
      const now = getCurrentTimeUTC();

      for (const order of filteredOrders) {
        const optionName = order.products || '';
        const key = optionName.trim().toLowerCase();
        const newUnitPrice = priceMap.get(key);

        if (newUnitPrice === undefined) {
          notFoundCount++;
          continue;
        }

        const quantity = Number(order.quantity) || 1;
        const newSupplyPrice = newUnitPrice * quantity;

        // 🔒 샘플 모드일 때는 DB 업데이트 건너뛰기
        if (isSampleMode) {
          updatedCount++;
          continue;
        }

        // DB 업데이트 (price_updated_at 필드에 갱신 일시 저장)
        // 할인 없이 순수 공급단가만 갱신
        if (updatedCount === 0) {
          console.log('💰 공급단가 갱신:', {
            단가: newUnitPrice,
            수량: quantity,
            공급가: newSupplyPrice
          });
        }

        const { error: updateError } = await supabase
          .from('integrated_orders')
          .update({
            seller_supply_price: newUnitPrice.toString(),
            product_amount: newSupplyPrice.toString(),  // 원공급가 (할인 없이)
            price_updated_at: now
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`❌ 주문 ${order.id} 업데이트 오류:`, updateError);
        } else {
          updatedCount++;
        }
      }

      setIsUpdatingPrice(false);
      setIsPriceUpdated(true);

      // 갱신 시간 저장
      const currentTime = new Date();
      const timeStr = currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastPriceUpdateTime(timeStr);

      const message = notFoundCount > 0
        ? `${updatedCount}건의 공급가가 업데이트되었습니다.\n(${notFoundCount}건은 공급단가를 찾을 수 없어 제외되었습니다.)`
        : `${updatedCount}건의 공급가가 최신 공급단가로 업데이트되었습니다.`;

      showModal('alert', '완료', message, () => {
        // 주문 목록 새로고침
        if (onRefresh) {
          onRefresh();
        }
      });

    } catch (error) {
      console.error('공급가 갱신 오류:', error);
      showModal('alert', '오류', '공급가 업데이트 중 오류가 발생했습니다.');
      setIsUpdatingPrice(false);
    }
  };

  // 입금완료 및 발주확정 핸들러 (재사용 가능)
  const handlePaymentConfirmation = async () => {
    if (filteredOrders.length === 0) {
      showModal('alert', '알림', '발주 확정할 주문이 없습니다.');
      return;
    }

    let finalDepositorName = '';

    // 1단계: 셀러계정(조직 또는 서브계정) 정보 검증
    try {
      if (!organizationId) {
        showModal('alert', '오류', '셀러계정 정보가 없습니다.');
        return;
      }

      // 서브계정이 선택된 경우 서브계정 정보 사용
      if (selectedSubAccount && selectedSubAccount !== 'main') {
        console.log('🔍 선택된 서브계정:', selectedSubAccount);

        // 필수 정보 확인
        const missingFields = [];
        if (!selectedSubAccount?.account_number?.trim()) missingFields.push('정산계좌번호');
        if (!selectedSubAccount?.bank_name?.trim()) missingFields.push('은행명');
        if (!selectedSubAccount?.account_holder?.trim()) missingFields.push('예금주');
        if (!selectedSubAccount?.representative_name?.trim()) missingFields.push('대표자명');

        if (missingFields.length > 0) {
          showModal('alert', '오류', `서브계정 정보가 불완전합니다.\n부족한 정보: ${missingFields.join(', ')}\n\n프로필 페이지에서 서브계정 정보를 완성해주세요.`);
          return;
        }

        // 서브계정의 예금주를 입금자명으로 사용
        setDefaultDepositorName(selectedSubAccount.account_holder);
        setDepositorNameInput(selectedSubAccount.account_holder);
        setShowDepositorNameModal(true);
        return;
      }

      // 메인 계정 정보 조회
      console.log('🔍 메인 셀러계정 정보 조회 시작:', { organizationId });
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('bank_account, bank_name, account_holder, representative_name, representative_phone, seller_code')
        .eq('id', organizationId)
        .single();

      console.log('🔍 조회 결과:', { orgData, orgError });

      if (orgError || !orgData) {
        console.error('셀러계정 정보 조회 실패:', orgError);
        showModal('alert', '오류', '셀러계정 정보를 불러오는데 실패했습니다.');
        return;
      }

      // 필수 정보 확인 (정산계좌정보, 대표자명, 대표자 연락처)
      const missingFields = [];
      if (!orgData?.bank_account?.trim()) missingFields.push('정산계좌번호');
      if (!orgData?.bank_name?.trim()) missingFields.push('은행명');
      if (!orgData?.account_holder?.trim()) missingFields.push('예금주');
      if (!orgData?.representative_name?.trim()) missingFields.push('대표자명');
      if (!orgData?.representative_phone?.trim()) missingFields.push('대표자 연락처');

      if (missingFields.length > 0) {
        // 판매자 정보가 불완전하면 검증 모달 표시
        setShowSellerInfoValidationModal(true);
        return;
      }

      // 입금자명 입력 모달 표시
      setDefaultDepositorName(orgData?.account_holder || '');
      setDepositorNameInput(orgData?.account_holder || '');
      setShowDepositorNameModal(true);

    } catch (error) {
      console.error('판매자 정보 검증 오류:', error);
      showModal('alert', '오류', '판매자 정보 검증 중 오류가 발생했습니다.');
      return;
    }
  };

  // 입금자명 확인 후 발주확정 진행
  const proceedWithPaymentConfirmation = async () => {
    if (!depositorNameInput?.trim()) {
      showModal('alert', '알림', '입금자명을 입력해주세요.');
      return;
    }

    const finalDepositorName = depositorNameInput.trim();
    setShowDepositorNameModal(false);

    // 발주확정 직접 처리 (옵션상품 검증 없이)
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // 서브계정의 seller_code 및 ID 조회
      let subAccountSellerCode = 'S000000'; // 기본값
      let subAccountId: string | null = null;

      if (selectedSubAccount && selectedSubAccount !== 'main') {
        // 선택된 서브계정의 seller_code 및 ID 사용
        subAccountSellerCode = selectedSubAccount.seller_code || 'S000000';
        subAccountId = selectedSubAccount.id;
      } else {
        // 'main' 또는 미선택 시 메인 서브계정의 seller_code 및 ID 조회
        const { data: mainSubAccount } = await supabase
          .from('sub_accounts')
          .select('id, seller_code')
          .eq('organization_id', organizationId)
          .eq('is_main', true)
          .single();

        if (mainSubAccount) {
          subAccountSellerCode = mainSubAccount.seller_code || 'S000000';
          subAccountId = mainSubAccount.id;
        }
      }

      // 각 주문에 발주번호 생성 및 업데이트
      const now = getCurrentTimeUTC();

      // DB에서 최신 product_amount 조회 (공급가 갱신 후 값)
      const orderIds = filteredOrders.map(o => o.id);
      const { data: latestOrders, error: fetchError } = await supabase
        .from('integrated_orders')
        .select('id, product_amount')
        .in('id', orderIds);

      if (fetchError) {
        console.error('❌ 주문 정보 조회 오류:', fetchError);
        showModal('alert', '오류', '주문 정보를 불러오는 중 오류가 발생했습니다.');
        return;
      }

      // product_amount 맵 생성
      const productAmountMap = new Map<number, number>();
      (latestOrders || []).forEach((order: any) => {
        productAmountMap.set(order.id, Number(order.product_amount) || 0);
      });

      // 총 공급가 계산 (DB에서 가져온 최신 product_amount 사용)
      const totalSupplyPrice = filteredOrders.reduce((sum, order) => {
        const productAmount = productAmountMap.get(order.id) || 0;
        return sum + productAmount;
      }, 0);

      console.log('💰 총 공급가 계산:', {
        filteredOrders: filteredOrders.length,
        totalSupplyPrice,
        sampleSettlement: latestOrders?.[0]
      });

      // 주문당 캐시 차감액 계산
      const cashPerOrder = appliedCashToUse / filteredOrders.length;

      // 캐시를 원 단위로 분산하여 각 주문에 할당
      let remainingCash = appliedCashToUse;
      const cashPerOrderList: number[] = [];

      for (let i = 0; i < filteredOrders.length; i++) {
        const order = filteredOrders[i];
        const supplyPrice = productAmountMap.get(order.id) || 0;

        // 주문별 캐시 사용액 계산 (비율 분배, 원 단위로 반올림)
        let orderCashUsed = 0;
        if (totalSupplyPrice > 0) {
          if (i === filteredOrders.length - 1) {
            // 마지막 주문은 남은 캐시 전부 사용 (반올림 오차 보정)
            orderCashUsed = remainingCash;
          } else {
            orderCashUsed = Math.round((supplyPrice / totalSupplyPrice) * appliedCashToUse);
            remainingCash -= orderCashUsed;
          }
        }
        cashPerOrderList.push(orderCashUsed);
      }

      // 등급할인 금액 계산 및 배분
      const totalDiscountAmount = discountRate !== null && discountRate > 0
        ? Math.floor((totalSupplyPrice * discountRate / 100) / 10) * 10
        : 0;

      let remainingDiscount = totalDiscountAmount;
      const discountPerOrderList: number[] = [];

      for (let i = 0; i < filteredOrders.length; i++) {
        const order = filteredOrders[i];
        const supplyPrice = productAmountMap.get(order.id) || 0;

        // 주문별 할인 금액 계산 (비율 분배, 10원 단위로 절사)
        let orderDiscount = 0;
        if (totalSupplyPrice > 0 && totalDiscountAmount > 0) {
          if (i === filteredOrders.length - 1) {
            // 마지막 주문은 남은 할인 금액 전부 (오차 보정)
            orderDiscount = remainingDiscount;
          } else {
            // 10원 단위로 절사
            orderDiscount = Math.floor(((supplyPrice / totalSupplyPrice) * totalDiscountAmount) / 10) * 10;
            remainingDiscount -= orderDiscount;
          }
        }
        discountPerOrderList.push(orderDiscount);
      }

      console.log('💳 주문별 캐시 사용액 및 최종 입금액 계산:', {
        totalSupplyPrice,
        appliedCashToUse,
        totalDiscountAmount,
        orderCount: filteredOrders.length,
        cashPerOrderList,
        discountPerOrderList
      });

      // 셀러코드 결정: 무조건 서브계정의 seller_code 사용
      const sellerCodeToUse = subAccountSellerCode;

      console.log('📋 발주번호 생성에 사용할 셀러코드:', {
        selectedSubAccount: selectedSubAccount ? (selectedSubAccount === 'main' ? 'main' : selectedSubAccount.seller_code) : 'none',
        subAccountSellerCode: subAccountSellerCode,
        finalSellerCode: sellerCodeToUse
      });

      for (let i = 0; i < filteredOrders.length; i++) {
        const order = filteredOrders[i];
        const orderNo = generateOrderNumber(sellerCodeToUse, i + 1);
        const supplyPrice = productAmountMap.get(order.id) || 0;
        const orderCashUsed = cashPerOrderList[i];
        const orderDiscount = discountPerOrderList[i];
        const finalPaymentAmount = supplyPrice - orderDiscount - orderCashUsed;

        console.log(`📝 주문 ${i + 1} 업데이트:`, {
          orderId: order.id,
          supplyPrice,
          orderDiscount,
          orderCashUsed,
          finalDepositAmount: Math.round(finalPaymentAmount)
        });

        const { error } = await supabase
          .from('integrated_orders')
          .update({
            shipping_status: '발주서확정',
            order_number: orderNo,
            confirmed_at: now,
            organization_id: organizationId, // 조직 ID 저장
            sub_account_id: subAccountId, // 메인 또는 선택된 서브계정 ID 저장
            created_by: userId, // 등록자 ID 저장
            discount_amount: orderDiscount, // 등급할인 금액 저장
            final_deposit_amount: Math.round(finalPaymentAmount), // 최종입금액 저장 (product_amount - discount_amount - cash_used)
            cash_used: orderCashUsed, // 주문별 캐시 사용액 저장
            depositor_name: (selectedSubAccount && selectedSubAccount !== 'main') ? selectedSubAccount.account_holder : finalDepositorName, // 서브계정 예금주 또는 메인계정 입금자명
          })
          .eq('id', order.id);

        if (error) {
          console.error('❌ 발주확정 오류:', error);
          showModal('alert', '오류', `발주 확정 중 오류가 발생했습니다: ${error.message}`);
          return;
        }
      }

      console.log('✅ 모든 주문 업데이트 완료');

      // 관리자에게 알림 전송 (발주확정)
      try {
        const orderIdsToNotify = filteredOrders.map(o => o.id);
        await fetch('/api/orders/notify-status-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderIds: orderIdsToNotify,
            status: '발주서확정',
            totalAmount: totalSupplyPrice
          })
        });
      } catch (notifyError) {
        console.error('알림 전송 오류:', notifyError);
        // 알림 전송 실패해도 발주확정은 성공으로 처리
      }

      // 배치 정보 저장
      const finalPaymentAmountTotal = totalSupplyPrice - totalDiscountAmount - appliedCashToUse;
      console.log('📦 배치 정보 저장 시작:', {
        organization_id: organizationId,
        confirmed_at: now,
        total_amount: totalSupplyPrice,
        discount_amount: totalDiscountAmount,
        cash_used: appliedCashToUse,
        final_deposit_amount: finalPaymentAmountTotal,
        order_count: filteredOrders.length,
        depositor_name: finalDepositorName,
        executor_id: userId
      });

      try {
        const { data: batchData, error: batchError } = await supabase
          .from('order_batches')
          .upsert({
            organization_id: organizationId,
            confirmed_at: now,
            total_amount: totalSupplyPrice,
            discount_amount: totalDiscountAmount,
            cash_used: appliedCashToUse,
            final_deposit_amount: finalPaymentAmountTotal,
            order_count: filteredOrders.length,
            depositor_name: finalDepositorName,
            executor_id: userId,
            payment_confirmed: false
          }, {
            onConflict: 'organization_id,confirmed_at'
          })
          .select();

        if (batchError) {
          console.error('❌ 배치 정보 저장 오류:', batchError);
        } else {
          console.log('✅ 배치 정보 저장 성공:', batchData);
        }
      } catch (batchSaveError) {
        console.error('❌ 배치 저장 실패:', batchSaveError);
      }

      // 캐시 차감 처리
      if (appliedCashToUse > 0) {
        try {
          const cashResponse = await fetch('/api/cash/use', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: appliedCashToUse,
              description: `발주서 확정 (${filteredOrders.length}건)`,
              metadata: {
                orderCount: filteredOrders.length,
                totalSupplyPrice: totalSupplyPrice,
                cashUsed: appliedCashToUse
              }
            })
          });

          const cashData = await cashResponse.json();

          if (!cashData.success) {
            console.error('캐시 차감 실패:', cashData);
            showModal('alert', '경고', `주문은 확정되었으나 캐시 차감에 실패했습니다. 관리자에게 문의해주세요.`);
          } else {
            // 캐시 잔액 업데이트
            setCashBalance(cashData.newBalance);
            toast.success(`${appliedCashToUse.toLocaleString()}캐시가 차감되었습니다!`);
          }
        } catch (cashError) {
          console.error('캐시 차감 오류:', cashError);
          showModal('alert', '경고', `주문은 확정되었으나 캐시 처리 중 오류가 발생했습니다.`);
        }
      }

      // 캐시 사용 금액 초기화
      setCashToUse('');
      setAppliedCashToUse(0);

      // 토스트로 완료 메시지 표시
      const message = appliedCashToUse > 0
        ? `${filteredOrders.length}건의 주문이 발주 확정되었습니다! (${appliedCashToUse.toLocaleString()}캐시 차감)`
        : `${filteredOrders.length}건의 주문이 발주 확정되었습니다!`;

      toast.success(message);

      // 주문 목록 새로고침
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('발주확정 처리 오류:', error);
      showModal('alert', '오류', '발주확정 처리 중 오류가 발생했습니다.');
    }
  };

  // Modal 상태 관리
  const [modalState, setModalState] = useState<{
    type: 'confirm' | 'alert' | 'prompt' | null;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    inputValue?: string;
    showInput?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    type: null,
    title: '',
    message: '',
    inputValue: ''
  });

  const showModal = (
    type: 'confirm' | 'alert' | 'prompt',
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    showInput = false,
    confirmText = '확인',
    cancelText = '취소'
  ) => {
    setModalState({
      type,
      title,
      message,
      onConfirm,
      onCancel,
      inputValue: '',
      showInput,
      confirmText,
      cancelText
    });
  };

  const closeModal = () => {
    setModalState({ type: null, title: '', message: '', inputValue: '' });
  };

  // 발주번호 생성 함수
  const generateOrderNumber = (sellerCode: string, sequence: number): string => {
    // 한국 시간 (서울 시간대: UTC+9)
    const utcNow = new Date();
    const now = new Date(utcNow.getTime() + (9 * 60 * 60 * 1000));

    const year = String(now.getUTCFullYear()).substring(2); // YY (2자리)
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const dateTime = `${year}${month}${day}${hours}${minutes}${seconds}`; // YYMMDDHHMMSS (12자리)

    // 순번 (4자리)
    const seqStr = String(sequence).padStart(4, '0');

    // 발주번호: 셀러코드 + YYMMDDHHMMSS + 순번4자리
    // 예: S123456-250119153045-0001 또는 SA123456-250119153045-0001
    return `${sellerCode}-${dateTime}-${seqStr}`;
  };

  // 주문 삭제 핸들러
  const handleDeleteOrder = async (orderId: number) => {
    showModal(
      'confirm',
      '주문 삭제',
      '정말 이 주문을 삭제하시겠습니까?',
      async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          const { error } = await supabase
            .from('integrated_orders')
            .delete()
            .eq('id', orderId);

          if (error) {
            console.error('주문 삭제 오류:', error);
            showModal('alert', '오류', '주문 삭제에 실패했습니다.');
            return;
          }

          showModal('alert', '완료', '주문이 삭제되었습니다.', () => {
            if (onRefresh) {
              onRefresh();
            }
          });
        } catch (error) {
          console.error('삭제 처리 오류:', error);
          showModal('alert', '오류', '주문 삭제 중 오류가 발생했습니다.');
        }
      }
    );
  };

  // 일괄 삭제 핸들러
  const handleBatchDelete = async () => {
    if (selectedOrders.length === 0) {
      showModal('alert', '알림', '삭제할 주문을 선택해주세요.');
      return;
    }

    showModal(
      'confirm',
      '일괄 삭제',
      `선택한 ${selectedOrders.length}개의 주문을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          const { error } = await supabase
            .from('integrated_orders')
            .delete()
            .in('id', selectedOrders);

          if (error) {
            console.error('일괄 삭제 오류:', error);
            showModal('alert', '오류', '주문 삭제에 실패했습니다.');
            return;
          }

          showModal('alert', '완료', `${selectedOrders.length}개의 주문이 삭제되었습니다.`, () => {
            setSelectedOrders([]); // 선택 초기화
            if (onRefresh) {
              onRefresh();
            }
          });
        } catch (error) {
          console.error('일괄 삭제 처리 오류:', error);
          showModal('alert', '오류', '주문 삭제 중 오류가 발생했습니다.');
        }
      },
      undefined,
      false,
      '삭제',
      '취소'
    );
  };


  // 취소요청 핸들러
  const handleCancelRequest = async (orderId: number) => {
    showModal(
      'confirm',
      '취소 요청',
      '이 주문의 취소를 요청하시겠습니까?',
      async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          const { error } = await supabase
            .from('integrated_orders')
            .update({
              shipping_status: '취소요청',
              cancel_requested_at: getCurrentTimeUTC()
            })
            .eq('id', orderId);

          if (error) {
            console.error('취소요청 오류:', error);
            showModal('alert', '오류', '취소요청에 실패했습니다.');
            return;
          }

          // 관리자에게 알림 전송
          try {
            await fetch('/api/orders/notify-status-change', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderIds: [orderId],
                status: '취소요청'
              })
            });
          } catch (notifyError) {
            console.error('알림 전송 오류:', notifyError);
            // 알림 전송 실패해도 취소요청은 성공으로 처리
          }

          showModal('alert', '완료', '취소요청이 완료되었습니다.', () => {
            if (onRefresh) {
              onRefresh();
            }
          });
        } catch (error) {
          console.error('취소요청 처리 오류:', error);
          showModal('alert', '오류', '취소요청 중 오류가 발생했습니다.');
        }
      }
    );
  };

  // 일괄 취소요청 핸들러
  const handleBatchCancelRequest = async () => {
    if (selectedOrders.length === 0) {
      showModal('alert', '알림', '취소요청할 주문을 선택해주세요.');
      return;
    }

    // 취소 사유 입력 모달 표시 (입력 즉시 취소요청 실행)
    setModalState({
      type: 'prompt',
      title: '취소 사유 입력',
      message: '취소 사유를 입력해주세요:',
      inputValue: '',
      showInput: true,
      confirmText: '취소요청',
      cancelText: '취소',
      onConfirm: async () => {
        // DOM에서 직접 input 값 가져오기
        const inputElement = document.getElementById('modal-prompt-input') as HTMLInputElement;
        const inputValue = inputElement?.value?.trim() || '';

        if (!inputValue) {
          // 입력이 없으면 경고 toast 표시
          toast.error('취소 사유를 입력해주세요.', {
            duration: 3000,
            position: 'top-center',
            style: {
              marginTop: 'calc(50vh - 50px)',
              fontSize: '14px',
              padding: '12px 24px',
            }
          });
          return;
        }

        // 모달 닫기
        closeModal();

        // 바로 취소요청 실행
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          const { error } = await supabase
            .from('integrated_orders')
            .update({
              shipping_status: '취소요청',
              cancel_requested_at: getCurrentTimeUTC(),
              cancel_reason: inputValue
            })
            .in('id', selectedOrders);

          if (error) {
            console.error('일괄 취소요청 오류:', error);
            toast.error('취소요청에 실패했습니다.', {
              duration: 3000,
              position: 'top-center',
              style: {
                marginTop: 'calc(50vh - 50px)',
                fontSize: '14px',
                padding: '12px 24px',
              }
            });
            return;
          }

          // 관리자에게 알림 전송
          try {
            await fetch('/api/orders/notify-status-change', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderIds: selectedOrders,
                status: '취소요청'
              })
            });
          } catch (notifyError) {
            console.error('알림 전송 오류:', notifyError);
            // 알림 전송 실패해도 취소요청은 성공으로 처리
          }

          // 토스트 메시지 (화면 정중앙)
          const count = selectedOrders.length;
          toast.success(`${count}개의 주문 취소요청이 완료되었습니다.`, {
            duration: 3000,
            position: 'top-center',
            style: {
              marginTop: 'calc(50vh - 50px)',
              fontSize: '14px',
              padding: '12px 24px',
            }
          });

          // 선택 해제
          setSelectedOrders([]);

          // 그리드 리마운트 트리거 (체크박스 초기화)
          setRefreshTrigger(prev => prev + 1);

          // 새로고침
          if (onRefresh) {
            onRefresh();
          }
        } catch (error) {
          console.error('일괄 취소요청 처리 오류:', error);
          toast.error('취소요청 중 오류가 발생했습니다.', {
            duration: 3000,
            position: 'top-center',
            style: {
              marginTop: 'calc(50vh - 50px)',
              fontSize: '14px',
              padding: '12px 24px',
            }
          });
        }
      },
      onCancel: () => {
        closeModal();
      }
    });
  };

  // 서브계정 ID로 사업자명 찾기 헬퍼 함수
  const getAccountName = (subAccountId: string | null | undefined): string => {
    if (!subAccountId) {
      return organizationName || '메인계정';
    }
    const subAccount = subAccounts.find(sub => sub.id === subAccountId);
    return subAccount?.business_name || '알 수 없음';
  };

  // 상태별 칼럼 정의
  const getColumnsByStatus = useMemo(() => {
    // 날짜 렌더러 함수 - UTC를 한국 시간으로 변환하여 표시
    const dateRenderer = (value: any) => {
      if (!value) return '';
      return (
        <span style={{ fontSize: '13px' }}>
          {formatDateTimeForDisplay(value)}
        </span>
      );
    };

    const baseColumns = [
      {
        key: 'orderNumber',
        title: '셀러주문번호',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'orderer',
        title: '주문자',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'ordererPhone',
        title: '주문자전화번호',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'recipient',
        title: '수령인',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'recipientPhone',
        title: '수령인전화번호',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'address',
        title: '주소',
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'deliveryMessage',
        title: '배송메세지',
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'optionName',
        title: '옵션상품',
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'quantity',
        title: '수량',
        type: 'number' as const,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'unitPrice',
        title: '공급단가',
        type: 'number' as const,
        readOnly: true,
        align: 'right' as const,
        renderer: (value: any) => (
          <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
        )
      },
      {
        key: 'specialRequest',
        title: '특이/요청사항',
        readOnly: true,
        align: 'left' as const
      }
    ];

    // 상태별 추가 칼럼
    if (filterStatus === 'registered') {
      // 발주서등록 단계: 발주번호 없음, 공급가만 표시
      return [
        {
          key: 'rowNumber',
          title: '#',
          width: 60,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: any, index: number) => (
            <span style={{ fontSize: '13px' }}>{index + 1}</span>
          )
        },
        {
          key: 'accountName',
          title: '계정',
          width: 120,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: Order) => (
            <span style={{ fontSize: '13px' }}>{getAccountName(row.subAccountId)}</span>
          )
        },
        {
          key: 'date',
          title: '등록일시',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'orderNumber',
          title: '셀러주문번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderer',
          title: '주문자',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'ordererPhone',
          title: '주문자전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipient',
          title: '수령인',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipientPhone',
          title: '수령인전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'address',
          title: '주소',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'deliveryMessage',
          title: '배송메세지',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'optionName',
          title: '옵션상품',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'quantity',
          title: '수량',
          type: 'number' as const,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'unitPrice',
          title: '공급단가',
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'specialRequest',
          title: '특이/요청사항',
          readOnly: true,
          align: 'left' as const
        }
      ];
    } else if (filterStatus === 'confirmed') {
      // 발주확정 이후: 발주번호 표시
      return [
        {
          key: 'rowNumber',
          title: '#',
          width: 60,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: any, index: number) => (
            <span style={{ fontSize: '13px' }}>{index + 1}</span>
          )
        },
        {
          key: 'accountName',
          title: '계정',
          width: 120,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: Order) => (
            <span style={{ fontSize: '13px' }}>{getAccountName(row.subAccountId)}</span>
          )
        },
        {
          key: 'confirmedAt',
          title: '발주확정',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderNumber',
          title: '셀러주문번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderer',
          title: '주문자',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'ordererPhone',
          title: '주문자전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipient',
          title: '수령인',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipientPhone',
          title: '수령인전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'address',
          title: '주소',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'deliveryMessage',
          title: '배송메세지',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'optionName',
          title: '옵션상품',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'quantity',
          title: '수량',
          type: 'number' as const,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'unitPrice',
          title: '공급단가',
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'specialRequest',
          title: '특이/요청사항',
          readOnly: true,
          align: 'left' as const
        }
      ];
    } else if (filterStatus === 'preparing') {
      // 상품준비중: 발주서확정과 동일한 구조
      return [
        {
          key: 'rowNumber',
          title: '#',
          width: 60,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: any, index: number) => (
            <span style={{ fontSize: '13px' }}>{index + 1}</span>
          )
        },
        {
          key: 'accountName',
          title: '계정',
          width: 120,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: Order) => (
            <span style={{ fontSize: '13px' }}>{getAccountName(row.subAccountId)}</span>
          )
        },
        {
          key: 'confirmedAt',
          title: '발주확정',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderNumber',
          title: '셀러주문번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderer',
          title: '주문자',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'ordererPhone',
          title: '주문자전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipient',
          title: '수령인',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipientPhone',
          title: '수령인전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'address',
          title: '주소',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'deliveryMessage',
          title: '배송메세지',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'optionName',
          title: '옵션상품',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'quantity',
          title: '수량',
          type: 'number' as const,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'unitPrice',
          title: '공급단가',
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'specialRequest',
          title: '특이/요청사항',
          readOnly: true,
          align: 'left' as const
        }
      ];
    } else if (filterStatus === 'shipped') {
      return [
        {
          key: 'shippedDate',
          title: '발송일',
          width: 100,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any) => {
            if (!value) return '';
            const date = new Date(value);
            return (
              <span style={{ fontSize: '13px' }}>
                {date.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </span>
            );
          }
        },
        {
          key: 'accountName',
          title: '계정',
          width: 120,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: Order) => (
            <span style={{ fontSize: '13px' }}>{getAccountName(row.subAccountId)}</span>
          )
        },
        {
          key: 'courier',
          title: '택배사',
          width: 100,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'trackingNo',
          title: '송장번호',
          width: 120,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'confirmedAt',
          title: '발주확정',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderNumber',
          title: '셀러주문번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderer',
          title: '주문자',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'ordererPhone',
          title: '주문자전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipient',
          title: '수령인',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipientPhone',
          title: '수령인전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'address',
          title: '주소',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'deliveryMessage',
          title: '배송메세지',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'optionName',
          title: '옵션상품',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'quantity',
          title: '수량',
          type: 'number' as const,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'unitPrice',
          title: '공급단가',
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'specialRequest',
          title: '특이/요청사항',
          readOnly: true,
          align: 'left' as const
        }
      ];
    } else if (filterStatus === 'cancelRequested') {
      // 취소요청 상태: 취소승인일시 칼럼 제외
      const cols = [
        {
          key: 'cancelRequestedAt',
          title: '취소요청',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'accountName',
          title: '계정',
          width: 120,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: Order) => (
            <span style={{ fontSize: '13px' }}>{getAccountName(row.subAccountId)}</span>
          )
        },
        {
          key: 'cancelReason',
          title: '취소사유',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'confirmedAt',
          title: '발주확정',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'orderNumber',
          title: '셀러주문번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderer',
          title: '주문자',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'ordererPhone',
          title: '주문자전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipient',
          title: '수령인',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipientPhone',
          title: '수령인전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'address',
          title: '주소',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'deliveryMessage',
          title: '배송메세지',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'optionName',
          title: '옵션상품',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'quantity',
          title: '수량',
          type: 'number' as const,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'unitPrice',
          title: '공급단가',
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        }
      ];

      return cols;
    } else if (filterStatus === 'cancelled') {
      // 취소완료 상태: 취소승인 -> 취소요청 -> 취소사유 순서
      const cols = [
        {
          key: 'cancelledAt',
          title: '취소승인',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'accountName',
          title: '계정',
          width: 120,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: Order) => (
            <span style={{ fontSize: '13px' }}>{getAccountName(row.subAccountId)}</span>
          )
        },
        {
          key: 'cancelRequestedAt',
          title: '취소요청',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'cancelReason',
          title: '취소사유',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'confirmedAt',
          title: '발주확정',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'orderNumber',
          title: '셀러주문번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderer',
          title: '주문자',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'ordererPhone',
          title: '주문자전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipient',
          title: '수령인',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipientPhone',
          title: '수령인전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'address',
          title: '주소',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'deliveryMessage',
          title: '배송메세지',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'optionName',
          title: '옵션상품',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'quantity',
          title: '수량',
          type: 'number' as const,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'unitPrice',
          title: '공급단가',
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        }
      ];

      return cols;
    } else if (filterStatus === 'refunded') {
      // 환불완료 상태: 환불일 -> 환불금액 -> 취소승인 -> 취소요청 -> 취소사유 순서
      const cols = [
        {
          key: 'refundedAt',
          title: '환불일',
          width: 100,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any) => {
            if (!value) return '';
            const date = new Date(value);
            return (
              <span style={{ fontSize: '13px' }}>
                {date.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </span>
            );
          }
        },
        {
          key: 'accountName',
          title: '계정',
          width: 120,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: Order) => (
            <span style={{ fontSize: '13px' }}>{getAccountName(row.subAccountId)}</span>
          )
        },
        {
          key: 'refundAmount',
          title: '환불금액',
          width: 120,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>
              {value?.toLocaleString()}원
            </span>
          )
        },
        {
          key: 'cancelledAt',
          title: '취소승인',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'cancelRequestedAt',
          title: '취소요청',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'cancelReason',
          title: '취소사유',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'confirmedAt',
          title: '발주확정',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: dateRenderer
        },
        {
          key: 'orderNumber',
          title: '셀러주문번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'orderer',
          title: '주문자',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'ordererPhone',
          title: '주문자전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipient',
          title: '수령인',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'recipientPhone',
          title: '수령인전화번호',
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'address',
          title: '주소',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'deliveryMessage',
          title: '배송메세지',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'optionName',
          title: '옵션상품',
          readOnly: true,
          align: 'left' as const
        },
        {
          key: 'quantity',
          title: '수량',
          type: 'number' as const,
          readOnly: true,
          align: 'center' as const
        },
        {
          key: 'unitPrice',
          title: '공급단가',
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        }
      ];

      return cols;
    }

    // 전체 보기일 때
    return [
      {
        key: 'orderNo',
        title: '발주번호',
        width: 180,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'orderNumber',
        title: '주문번호',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'orderer',
        title: '주문자',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'ordererPhone',
        title: '주문자전화번호',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'recipient',
        title: '수령인',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'recipientPhone',
        title: '수령인전화번호',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'address',
        title: '주소',
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'deliveryMessage',
        title: '배송메세지',
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'optionName',
        title: '옵션상품',
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'quantity',
        title: '수량',
        type: 'number' as const,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'unitPrice',
        title: '공급단가',
        type: 'number' as const,
        readOnly: true,
        align: 'right' as const,
        renderer: (value: any) => (
          <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
        )
      },
      {
        key: 'supplyPrice',
        title: '공급가',
        width: 100,
        type: 'number' as const,
        readOnly: true,
        align: 'right' as const,
        renderer: (value: any) => (
          <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
        )
      },
      {
        key: 'specialRequest',
        title: '특이/요청사항',
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'status',
        title: '상태',
        width: 120,
        readOnly: true,
        align: 'center' as const,
        renderer: (value: Order['status']) => {
          const config = statusConfig[value];
          return (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                background: config.bg,
                color: config.color
              }}
            >
              {config.label}
            </span>
          );
        }
      }
    ];
  }, [filterStatus, statusConfig, subAccounts, organizationName]);

  // 엑셀 양식 다운로드 핸들러
  const handleDownloadTemplate = () => {
    // public 폴더의 엑셀 파일 다운로드
    const link = document.createElement('a');
    link.href = '/templates/발주서_양식.xlsx';
    link.download = '달래마켓_발주서양식.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 마켓 목록 추출 (발송완료 주문의 마켓만)
  const uniqueMarkets = useMemo(() => {
    const markets = new Set<string>();
    filteredOrders.forEach(order => {
      if (order.marketName) {
        markets.add(order.marketName);
      }
    });
    return Array.from(markets).sort();
  }, [filteredOrders]);

  // 마켓별 송장파일 다운로드
  const handleMarketInvoiceDownload = async (marketName: string) => {
    const marketOrders = filteredOrders.filter(
      (o) => (o.marketName || '미지정') === marketName
    );

    if (marketOrders.length === 0) {
      alert('다운로드할 주문이 없습니다.');
      return;
    }

    try {
      // 마켓 송장 템플릿 가져오기
      const response = await fetch(`/api/market-invoice-templates/${encodeURIComponent(marketName)}`);
      const result = await response.json();

      let exportData;

      if (result.success && result.data && result.data.columns.length > 0) {
        // 템플릿이 있는 경우: 템플릿에 맞게 데이터 변환
        const template = result.data;

        // order 필드로 컬럼 정렬
        const sortedColumns = [...template.columns].sort((a, b) => (a.order || 0) - (b.order || 0));

        exportData = marketOrders.map((order: any) => {
          const row: any = {};
          sortedColumns.forEach((col: any) => {
            const fieldType = col.field_type || 'db';

            if (fieldType === 'db') {
              // DB 필드
              const fieldName = col.field_name;
              row[col.column_name] = order[fieldName] || '';
            } else if (fieldType === 'static') {
              // 고정값
              row[col.column_name] = col.static_value || '';
            } else if (fieldType === 'computed') {
              // 계산 필드 (예: 상품명+옵션상품)
              const computedLogic = col.computed_logic;
              if (computedLogic === 'product_option') {
                row[col.column_name] = `${order.optionName || ''}`;
              } else {
                row[col.column_name] = '';
              }
            }
          });
          return row;
        });
      } else {
        // 템플릿이 없는 경우: 기본 구조
        exportData = marketOrders.map((order: any) => ({
          주문번호: order.orderNumber,
          수취인: order.recipient,
          전화번호: order.recipientPhone || '',
          주소: order.address || '',
          옵션상품: order.optionName,
          수량: order.quantity,
          택배사: order.courier || '',
          송장번호: order.trackingNo || '',
          발송일: order.shippedDate || '',
        }));
      }

      // ExcelJS를 사용하여 엑셀 파일 생성
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('송장정보');

      // 헤더 추가
      const headers = Object.keys(exportData[0]);
      worksheet.addRow(headers);

      // 데이터 추가
      exportData.forEach((row: any) => {
        worksheet.addRow(Object.values(row));
      });

      // 스타일 적용
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          if (rowNumber === 1) {
            cell.font = { bold: true, size: 11 };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD3D3D3' }
            };
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
          } else if (cell.value && typeof cell.value === 'string' && cell.value.includes('\n')) {
            cell.alignment = {
              wrapText: true,
              horizontal: 'left',
              vertical: 'middle',
            };
          } else {
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
          }
        });
      });

      // 파일 다운로드
    const today = new Date().toISOString().split('T')[0];
    const fileName = `${marketName}_${today}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('마켓 송장파일 다운로드 오류:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  // 전체 마켓 일괄 다운로드
  const handleAllMarketInvoiceDownload = async () => {
    const activeMarkets = uniqueMarkets.filter((market) => {
      const marketOrders = filteredOrders.filter(
        (o) => (o.marketName || '미지정') === market
      );
      return marketOrders.length > 0;
    });

    if (activeMarkets.length === 0) {
      alert('다운로드할 마켓이 없습니다.');
      return;
    }

    // 각 마켓별로 다운로드
    for (const market of activeMarkets) {
      await handleMarketInvoiceDownload(market);
      // 다운로드 사이에 약간의 딜레이 추가 (브라우저가 여러 파일을 처리할 시간 확보)
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    alert(`${activeMarkets.length}개 마켓의 송장파일이 다운로드되었습니다.`);
  };

  // 주문건수 및 공급가 합계 계산
  const orderSummary = useMemo(() => {
    const count = filteredOrders.length;

    // 공급가 합계
    const totalSupplyPrice = filteredOrders.reduce((sum, order) => {
      const price = Number(order.supplyPrice) || 0;
      return sum + price;
    }, 0);

    // 할인액 합계
    let totalDiscountAmount = 0;
    if (filterStatus === 'registered') {
      // 발주서등록 단계: discountRate로 실시간 계산 (10원 단위 절사)
      if (discountRate !== null && discountRate > 0) {
        totalDiscountAmount = Math.floor((totalSupplyPrice * discountRate / 100) / 10) * 10;
      }
    } else {
      // 다른 상태: DB 저장값 사용
      totalDiscountAmount = filteredOrders.reduce((sum, order) => {
        const discount = Number(order.discountAmount) || 0;
        return sum + discount;
      }, 0);
    }

    // 사용캐시 합계 (DB 저장값)
    const totalCashUsed = filteredOrders.reduce((sum, order) => {
      const cash = Number(order.cashUsed) || 0;
      return sum + cash;
    }, 0);

    // 정산금액 합계 (DB 저장값)
    const totalSettlementAmount = filteredOrders.reduce((sum, order) => {
      const settlement = Number(order.settlementAmount) || 0;
      return sum + settlement;
    }, 0);

    return {
      count,
      totalSupplyPrice,
      totalDiscountAmount,
      totalCashUsed,
      totalSettlementAmount
    };
  }, [filteredOrders, filterStatus, discountRate]);

  // 상태별 설명 텍스트
  const statusDescriptions: Record<Order['status'], string> = {
    registered: '판매자가 발주서를 등록하는 단계. 엑셀파일 업로드 방식으로만 가능합니다. 업로드와 일괄삭제 또는 취소가 언제든 가능합니다.',
    confirmed: '판매자가 직접 발주를 확정한 발주서입니다. 판매자가 \'입금완료 및 발주확정\' 버튼을 실행했을 때 이 탭으로 이관되며, 공급자가 입금 내역을 확인하기 전 단계. 취소 요청은 공급자의 승인이 필요합니다.',
    preparing: '상품 발송을 준비를 하고 있습니다. 공급자가 발주서와 입금내역을 확인하고 상품을 준비/포장 하고 있는 주문건입니다. 취소 요청은 공급자의 승인이 필요합니다.',
    cancelRequested: '입금완료 및 발주확정한 주문건 중에서 판매자가 취소를 요청한 주문건 입니다. 공급자 확인 및 승인이 필요합니다. 반드시 별도의 연락을 주셔야 합니다.',
    shipped: '상품 발송을 완료한 단계. 송장번호를 다운로드 하실 수 있으며, 어떠한 경우라도 취소와 환불이 불가능합니다.',
    cancelled: '취소 요청건이 정상적으로 처리되어 발주 취소가 정상적으로 처리된 주문건입니다.',
    refunded: '취소 완료된 주문건 중 환불이 완료된 주문건입니다. 공급자가 환불 처리를 완료한 상태로, 모든 거래가 종료되었습니다.'
  };

  return (
    <div>
      {/* Toast Container */}
      <Toaster />

      {/* 상태 통계 카드 섹션 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(145px, 1fr))',
          gap: '10px',
          marginBottom: '32px'
        }}
      >
        {statsData.map((stat, index) => {
          const config = statusConfig[stat.status];
          const isSelected = filterStatus === stat.status;
          const showTooltip = hoveredStatus === stat.status;
          // 마지막 카드는 툴팁을 왼쪽으로 더 이동
          const isLastCard = index === statsData.length - 1;

          return (
            <div
              key={stat.status}
              onClick={() => setFilterStatus(stat.status)}
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                position: 'relative',
                background: 'var(--color-surface)',
                border: isSelected ? `1px solid ${config.color}` : '1px solid var(--color-border)',
                boxShadow: isSelected ? `0 4px 12px ${config.color}30` : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13px', color: config.color, marginBottom: '8px', fontWeight: '600' }}>
                  {config.label}
                </div>
                <div
                  onMouseEnter={() => setHoveredStatus(stat.status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `1.5px solid ${config.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: config.color,
                    cursor: 'help',
                    flexShrink: 0
                  }}
                >
                  ?
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: config.color }}>
                {stat.count}
              </div>

              {/* 툴팁 */}
              {showTooltip && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  left: isLastCard ? 'auto' : '0',
                  right: isLastCard ? '0' : 'auto',
                  background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}25 100%)`,
                  backdropFilter: 'blur(10px)',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                  zIndex: 99999,
                  maxWidth: '600px',
                  minWidth: '450px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: 'var(--color-text)',
                  pointerEvents: 'none',
                  whiteSpace: 'normal',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    left: isLastCard ? 'auto' : '24px',
                    right: isLastCard ? '24px' : 'auto',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: `8px solid ${config.color}20`
                  }} />
                  {statusDescriptions[stat.status]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 필터 및 버튼 섹션 */}
      <div className="card" style={{
        padding: isMobile ? '12px' : '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* 필터 - 좌측 */}
        <div style={{ display: 'flex', gap: isMobile ? '4px' : '8px', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ display: 'inline-block' }}>
            <DatePicker
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setSelectedDateFilter(null); // 수동 선택 시 필터 해제
              }}
              placeholder="시작일"
              maxDate={endDate || undefined}
            />
          </div>

          <div style={{ display: 'inline-block' }}>
            <DatePicker
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                setSelectedDateFilter(null); // 수동 선택 시 필터 해제
              }}
              placeholder="종료일"
              minDate={startDate || undefined}
            />
          </div>

          {/* 날짜 빠른 선택 버튼들 */}
          <button
            onClick={() => {
              const today = new Date();
              setStartDate(today);
              setEndDate(today);
              setSelectedDateFilter('today');
            }}
            style={{
              padding: isMobile ? '4px 8px' : '4px 12px',
              border: selectedDateFilter === 'today'
                ? '2px solid #3b82f6'
                : isDarkMode
                  ? '0.2px solid var(--color-border)'
                  : '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: isMobile ? '11px' : '12px',
              height: '28px',
              background: selectedDateFilter === 'today' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-surface)',
              color: selectedDateFilter === 'today' ? '#3b82f6' : 'var(--color-text)',
              fontWeight: selectedDateFilter === 'today' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (selectedDateFilter !== 'today') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedDateFilter !== 'today') {
                e.currentTarget.style.background = 'var(--color-surface)';
              }
            }}
          >
            오늘
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const yesterday = new Date();
              yesterday.setDate(today.getDate() - 1);
              setStartDate(yesterday);
              setEndDate(yesterday);
              setSelectedDateFilter('yesterday');
            }}
            style={{
              padding: isMobile ? '4px 8px' : '4px 12px',
              border: selectedDateFilter === 'yesterday'
                ? '2px solid #3b82f6'
                : isDarkMode
                  ? '0.2px solid var(--color-border)'
                  : '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: isMobile ? '11px' : '12px',
              height: '28px',
              background: selectedDateFilter === 'yesterday' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-surface)',
              color: selectedDateFilter === 'yesterday' ? '#3b82f6' : 'var(--color-text)',
              fontWeight: selectedDateFilter === 'yesterday' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (selectedDateFilter !== 'yesterday') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedDateFilter !== 'yesterday') {
                e.currentTarget.style.background = 'var(--color-surface)';
              }
            }}
          >
            어제
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(today.getDate() - 7);
              setStartDate(sevenDaysAgo);
              setEndDate(today);
              setSelectedDateFilter('7days');
            }}
            style={{
              padding: isMobile ? '4px 8px' : '4px 12px',
              border: selectedDateFilter === '7days'
                ? '2px solid #3b82f6'
                : isDarkMode
                  ? '0.2px solid var(--color-border)'
                  : '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: isMobile ? '11px' : '12px',
              height: '28px',
              background: selectedDateFilter === '7days' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-surface)',
              color: selectedDateFilter === '7days' ? '#3b82f6' : 'var(--color-text)',
              fontWeight: selectedDateFilter === '7days' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (selectedDateFilter !== '7days') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedDateFilter !== '7days') {
                e.currentTarget.style.background = 'var(--color-surface)';
              }
            }}
          >
            7일
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(today.getDate() - 30);
              setStartDate(thirtyDaysAgo);
              setEndDate(today);
              setSelectedDateFilter('30days');
            }}
            style={{
              padding: isMobile ? '4px 8px' : '4px 12px',
              border: selectedDateFilter === '30days'
                ? '2px solid #3b82f6'
                : isDarkMode
                  ? '0.2px solid var(--color-border)'
                  : '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: isMobile ? '11px' : '12px',
              height: '28px',
              background: selectedDateFilter === '30days' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-surface)',
              color: selectedDateFilter === '30days' ? '#3b82f6' : 'var(--color-text)',
              fontWeight: selectedDateFilter === '30days' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (selectedDateFilter !== '30days') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedDateFilter !== '30days') {
                e.currentTarget.style.background = 'var(--color-surface)';
              }
            }}
          >
            30일
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const ninetyDaysAgo = new Date();
              ninetyDaysAgo.setDate(today.getDate() - 90);
              setStartDate(ninetyDaysAgo);
              setEndDate(today);
              setSelectedDateFilter('90days');
            }}
            style={{
              padding: isMobile ? '4px 8px' : '4px 12px',
              border: selectedDateFilter === '90days'
                ? '2px solid #3b82f6'
                : isDarkMode
                  ? '0.2px solid var(--color-border)'
                  : '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: isMobile ? '11px' : '12px',
              height: '28px',
              background: selectedDateFilter === '90days' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-surface)',
              color: selectedDateFilter === '90days' ? '#3b82f6' : 'var(--color-text)',
              fontWeight: selectedDateFilter === '90days' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (selectedDateFilter !== '90days') {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedDateFilter !== '90days') {
                e.currentTarget.style.background = 'var(--color-surface)';
              }
            }}
          >
            90일
          </button>

          <input
            type="text"
            value={tableSearchTerm}
            onChange={(e) => setTableSearchTerm(e.target.value)}
            placeholder="테이블 검색 (주문자/수령인/주소/옵션)"
            className="filter-input"
            style={{
              width: isMobile ? '150px' : '250px',
              minWidth: isMobile ? '130px' : '200px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: isMobile ? '11px' : '12px',
              height: '28px',
              flex: isMobile ? '1 1 auto' : '0 0 auto',
              border: '2px solid #3b82f6',
              backgroundColor: 'var(--color-surface)'
            }}
          />
        </div>

        {/* 발주서 관리 버튼들 - 우측 (발주서등록 상태만) */}
        {filterStatus === 'registered' && (
          <div style={{ display: 'flex', gap: isMobile ? '4px' : '8px', flexWrap: 'wrap', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => {
                  // 서브계정이 있는 경우에만 선택 검증
                  if (subAccounts && subAccounts.length > 0 && !selectedSubAccount) {
                    toast.error('발주 계정을 먼저 선택해주세요', {
                      duration: 3000,
                      position: 'top-center',
                    });
                    return;
                  }
                  setShowMarketFileUploadModal(true);
                }}
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.style.visibility = 'visible';
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.style.visibility = 'hidden';
                  e.currentTarget.style.background = 'transparent';
                }}
                style={{
                  padding: isMobile ? '6px 10px' : '6px 16px',
                  color: '#8b5cf6',
                  background: 'transparent',
                  border: '1px solid #8b5cf6',
                  borderRadius: '6px',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 0
                }}
              >
                <Upload size={isMobile ? 12 : 14} />
                {isMobile ? '마켓파일' : '마켓파일 업로드'}
              </button>
              <div style={{
                visibility: 'hidden',
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                padding: '8px 12px',
                background: '#1f2937',
                color: 'white',
                fontSize: '11px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
                zIndex: 1000
              }}>
                <strong>지원마켓</strong> 스마트스토어 쿠팡 11번가 토스 ESM 카카오 올웨이즈 및 셀러요청 마켓
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid #1f2937'
                }}></div>
              </div>
            </div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => {
                  // 서브계정이 있는 경우에만 선택 검증
                  if (subAccounts && subAccounts.length > 0 && !selectedSubAccount) {
                    toast.error('발주 계정을 먼저 선택해주세요', {
                      duration: 3000,
                      position: 'top-center',
                    });
                    return;
                  }
                  setShowUploadModal(true);
                }}
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.style.visibility = 'visible';
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.style.visibility = 'hidden';
                  e.currentTarget.style.background = 'transparent';
                }}
                style={{
                  padding: isMobile ? '6px 10px' : '6px 16px',
                  color: '#2563eb',
                  background: 'transparent',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 0
                }}
              >
                <Upload size={isMobile ? 12 : 14} />
                {isMobile ? '발주서' : '발주서 업로드'}
              </button>
              <div style={{
                visibility: 'hidden',
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                padding: '8px 12px',
                background: '#1f2937',
                color: 'white',
                fontSize: '11px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
                zIndex: 1000
              }}>
                달래마켓 양식 사용
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid #1f2937'
                }}></div>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              style={{
                padding: isMobile ? '6px 10px' : '6px 16px',
                color: '#10b981',
                background: 'transparent',
                border: '1px solid #10b981',
                borderRadius: '6px',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexShrink: 0
              }}
            >
              <Download size={isMobile ? 12 : 14} />
              {isMobile ? '양식' : '발주서 양식'}
            </button>
          </div>
        )}
      </div>

      {/* 주문 요약 섹션 - 발주서등록: 캐시 사용 기능 포함 */}
      {filterStatus === 'registered' && filteredOrders.length > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          background: 'var(--color-surface)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          {/* 주문건수 */}
          <div>
            <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>주문건수</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {orderSummary.count.toLocaleString()}건
            </span>
          </div>

          {/* 공급가 합계 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>공급가 합계</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {orderSummary.totalSupplyPrice.toLocaleString()}원
              </span>
            </div>
            {isPriceUpdated ? (
              <Check size={20} style={{ color: '#10b981', flexShrink: 0 }} />
            ) : (
              <X size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            )}
          </div>

          {/* 할인액 - (티어 할인율% 할인액) 할인차감금액 형식 */}
          <div>
            <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>
              ({(organizationTier || 'LIGHT').toUpperCase()} {discountRate || 0}% {orderSummary.totalDiscountAmount.toLocaleString()}원)
            </span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626', marginLeft: '4px' }}>
              {(orderSummary.totalSupplyPrice - orderSummary.totalDiscountAmount).toLocaleString()}원
            </span>
          </div>

          {/* 캐시 사용 입력 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>사용캐시</span>

            {/* 전액 버튼 */}
            <button
              onClick={() => {
                const maxCash = Math.min(cashBalance, orderSummary.totalSupplyPrice - orderSummary.totalDiscountAmount);
                // 10원 단위로 절사
                const roundedCash = Math.floor(maxCash / 10) * 10;
                setCashToUse(roundedCash.toLocaleString());
              }}
              style={{
                padding: '6px 12px',
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0891b2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#06b6d4';
              }}
            >
              전액
            </button>

            {/* 입력란 */}
            <input
              type="text"
              value={cashToUse}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, ''); // 콤마 제거
                if (value === '') {
                  setCashToUse('');
                  return;
                }
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) return;

                // 10원 단위로 자동 절사
                const rounded = Math.floor(numValue / 10) * 10;
                if (rounded <= cashBalance) {
                  setCashToUse(rounded.toLocaleString());
                }
              }}
              style={{
                width: '120px',
                padding: '6px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'right',
                color: '#0f172a'
              }}
            />

            <span style={{ fontSize: '14px', color: '#64748b' }}>캐시</span>

            {/* 사용 버튼 */}
            <button
              onClick={() => {
                const numValue = Number(cashToUse.replace(/,/g, '')) || 0;
                setAppliedCashToUse(numValue);
              }}
              style={{
                padding: '6px 12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10b981';
              }}
            >
              사용
            </button>
          </div>

          {/* 최종 입금액 */}
          <div>
            <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>최종 입금액</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>
              {(orderSummary.totalSupplyPrice - orderSummary.totalDiscountAmount - appliedCashToUse).toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 공급가 갱신 및 발주확정 버튼 영역 */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* 공급가 갱신 버튼 */}
          <button
            onClick={handlePriceUpdate}
            disabled={isUpdatingPrice}
            style={{
              padding: '12px 24px',
              background: isUpdatingPrice ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isUpdatingPrice ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isUpdatingPrice) e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              if (!isUpdatingPrice) e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <RefreshCw size={16} className={isUpdatingPrice ? 'animate-spin' : ''} />
            {isUpdatingPrice ? '처리 중...' : '공급가 갱신'}
          </button>

          {/* 발주확정 버튼 */}
          <button
            onClick={handlePaymentConfirmation}
            disabled={!isPriceUpdated}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: !isPriceUpdated ? '#9ca3af' : '#2563eb',
              border: !isPriceUpdated ? '1px solid #9ca3af' : '1px solid #2563eb',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              cursor: !isPriceUpdated ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (isPriceUpdated) {
                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (isPriceUpdated) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            💳 입금완료 및 발주확정
          </button>
        </div>
        </div>
      )}

      {/* 주문 요약 섹션 - 발주확정 ~ 환불완료: 간단한 통계만 (회색) */}
      {['confirmed', 'preparing', 'shipped', 'cancel_requested', 'cancelled', 'refunded'].includes(filterStatus) && filteredOrders.length > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          background: 'var(--color-surface)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 주문건수 */}
            <div>
              <span style={{ fontSize: '13px', color: '#9ca3af', marginRight: '8px' }}>주문건수</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#6b7280' }}>
                {orderSummary.count.toLocaleString()}건
              </span>
            </div>

            {/* 공급가 합계 */}
            <div>
              <span style={{ fontSize: '13px', color: '#9ca3af', marginRight: '8px' }}>공급가 합계</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#6b7280' }}>
                {orderSummary.totalSupplyPrice.toLocaleString()}원
              </span>
            </div>

            {/* 할인액 */}
            <div>
              <span style={{ fontSize: '13px', color: '#9ca3af', marginRight: '8px' }}>할인액</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#6b7280' }}>
                {orderSummary.totalDiscountAmount.toLocaleString()}원
              </span>
            </div>

            {/* 사용캐시 */}
            <div>
              <span style={{ fontSize: '13px', color: '#9ca3af', marginRight: '8px' }}>사용캐시</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#6b7280' }}>
                {orderSummary.totalCashUsed.toLocaleString()}원
              </span>
            </div>

            {/* 정산금액 */}
            <div>
              <span style={{ fontSize: '13px', color: '#9ca3af', marginRight: '8px' }}>정산금액</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#6b7280' }}>
                {orderSummary.totalSettlementAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 삭제 버튼 (발주서등록 단계이고 주문이 있을 때만) */}
      {filterStatus === 'registered' && filteredOrders.length > 0 && (
        <div className="mb-3 flex justify-start gap-2">
          <button
            onClick={handleBatchDelete}
            disabled={selectedOrders.length === 0}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: selectedOrders.length === 0 ? 'var(--color-border)' : '#1f2937',
              color: selectedOrders.length === 0 ? 'var(--color-text-secondary)' : '#ffffff',
              cursor: selectedOrders.length === 0 ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
          >
            삭제 ({selectedOrders.length})
          </button>
        </div>
      )}

      {/* 일괄 취소요청 버튼 (발주서확정, 상품준비중 단계) */}
      {(filterStatus === 'confirmed' || filterStatus === 'preparing') && (
        <div className="mb-3 flex justify-start">
          <button
            onClick={handleBatchCancelRequest}
            disabled={selectedOrders.length === 0}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: selectedOrders.length === 0 ? '#d1d5db' : '#ef4444',
              color: selectedOrders.length === 0 ? '#6b7280' : '#ffffff',
              cursor: selectedOrders.length === 0 ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#ef4444';
              }
            }}
          >
            취소요청 ({selectedOrders.length})
          </button>
        </div>
      )}

      {/* CS접수 및 마켓송장파일 버튼 (발송완료 단계만) */}
      {filterStatus === 'shipped' && (
        <div className="mb-3 flex justify-start gap-2">
          <button
            onClick={() => {
              if (selectedOrders.length === 0) {
                showModal('alert', '알림', 'CS접수할 주문을 선택해주세요.');
                return;
              }
              if (selectedOrders.length > 1) {
                showModal('alert', '알림', 'CS접수는 한 번에 하나의 주문만 처리할 수 있습니다.');
                return;
              }
              // CS접수 로직 추가 예정
              showModal('alert', '알림', 'CS접수 기능은 준비 중입니다.');
            }}
            disabled={selectedOrders.length === 0}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: selectedOrders.length === 0 ? '#d1d5db' : '#ec4899',
              color: selectedOrders.length === 0 ? '#6b7280' : '#ffffff',
              cursor: selectedOrders.length === 0 ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#db2777';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#ec4899';
              }
            }}
          >
            CS접수
          </button>
          <button
            onClick={() => setShowMarketInvoiceModal(true)}
            disabled={filteredOrders.length === 0}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: filteredOrders.length === 0 ? '#d1d5db' : '#4b5563',
              color: filteredOrders.length === 0 ? '#6b7280' : '#ffffff',
              cursor: filteredOrders.length === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onMouseEnter={(e) => {
              if (filteredOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (filteredOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }
            }}
          >
            <Download size={12} />
            마켓송장파일
          </button>
        </div>
      )}

      {/* 주문이 없을 때 안내 문구 (발주서등록 상태만) */}
      {filterStatus === 'registered' && filteredOrders.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '2px dashed var(--color-border)',
          marginTop: '20px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            opacity: 0.3
          }}>
            📦
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '16px'
          }}>
            등록된 주문이 없습니다
          </h3>

          <div style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <p style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--color-text)' }}>마켓파일 업로드:</strong> 스마트스토어, 쿠팡, 11번가, 토스, ESM, 카카오, 올웨이즈 및 셀러요청 마켓 지원
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--color-text)' }}>발주서 업로드:</strong> 달래마켓 전용 양식 사용
            </p>
            <p style={{ marginTop: '16px', fontSize: '13px' }}>
              주문 등록 후 <strong style={{ color: 'var(--color-text)' }}>공급가 갱신</strong> 버튼으로 최신 공급가를 적용하고,<br />
              <strong style={{ color: 'var(--color-text)' }}>등급할인</strong>이 자동 적용되며 <strong style={{ color: '#2563eb' }}>캐시</strong>를 사용하여 최종 입금액을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 발주 테이블 (주문이 있을 때만) */}
      {filteredOrders.length > 0 && (
      <EditableAdminGrid
        key={`grid-${refreshTrigger}-${isDarkMode ? 'dark' : 'light'}-${tableSearchTerm}`}
        data={filteredOrders}
        columns={getColumnsByStatus}
        height="600px"
        rowHeight={32}
        showRowNumbers={filterStatus !== 'registered' && filterStatus !== 'confirmed' && filterStatus !== 'preparing'}
        enableFilter={false}
        enableSort={filterStatus !== 'registered' && filterStatus !== 'confirmed' && filterStatus !== 'preparing'}
        enableCSVExport={false}
        enableCSVImport={false}
        enableAddRow={false}
        enableDelete={false}
        enableCopy={false}
        enableCheckbox={filterStatus === 'registered' || filterStatus === 'confirmed' || filterStatus === 'preparing'}
        onSelectionChange={(indices) => {
          const selectedIds = indices.map(index => filteredOrders[index]?.id).filter(Boolean);
          setSelectedOrders(selectedIds);
        }}
        getRowStyle={filterStatus === 'registered' ? (row: Order) => {
          if (!row.priceUpdatedAt) {
            // 미갱신 - 밝은 빨간색 계열
            const bgColor = isDarkMode ? 'rgba(252, 165, 165, 0.05)' : '#fef2f2';
            return {
              backgroundColor: bgColor,
            };
          }

          // 오늘 날짜 체크 (한국 시간 기준)
          const today = new Date();
          const koreaToday = new Date(today.getTime() + (9 * 60 * 60 * 1000));
          const todayStr = koreaToday.toISOString().split('T')[0];

          const updatedDate = new Date(row.priceUpdatedAt);
          const koreaUpdatedDate = new Date(updatedDate.getTime() + (9 * 60 * 60 * 1000));
          const updatedDateStr = koreaUpdatedDate.toISOString().split('T')[0];

          const isToday = updatedDateStr === todayStr;

          if (isToday) {
            // 오늘 갱신 완료 - 밝은 하늘색 계열
            const bgColor = isDarkMode ? 'rgba(125, 211, 252, 0.05)' : '#f0f9ff';
            return {
              backgroundColor: bgColor,
            };
          } else {
            // 과거 갱신 - 녹색 계열
            const bgColor = isDarkMode ? 'rgba(134, 239, 172, 0.05)' : '#f0fdf4';
            return {
              backgroundColor: bgColor,
            };
          }
        } : undefined}
      />
      )}

      {/* 테이블 아래 설명 문구 (발주서등록 상태이고 주문이 있을 때만) */}
      {filterStatus === 'registered' && filteredOrders.length > 0 && (
        <div style={{
          marginTop: '16px',
          position: 'relative'
        }}>
          {/* 펼치기/접기 버튼 - 왼쪽 상단에 작게 */}
          <button
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              zIndex: 10,
              width: '24px',
              height: '24px',
              background: isDarkMode ? 'var(--color-surface)' : '#ffffff',
              border: isDarkMode ? '0.2px solid #3b82f6' : '0.5px solid #3b82f6',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(59,130,246,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'var(--color-surface-hover)' : '#eff6ff';
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode ? 'var(--color-surface)' : '#ffffff';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                transform: isGuideExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              {/* 오른쪽 하단 대각선 화살표 */}
              <path
                d="M6 6L10 10"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M10 7L10 10L7 10"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            style={{
              transformOrigin: 'top left',
              transform: isGuideExpanded ? 'scale(1)' : 'scale(0)',
              opacity: isGuideExpanded ? 1 : 0,
              transition: 'all 0.6s ease-in-out',
              overflow: 'hidden',
              marginTop: '32px'
            }}
          >
          <div
            style={{
              padding: '16px 20px 16px 40px'
            }}
          >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
                📌 행 배경색 안내
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    backgroundColor: isDarkMode ? 'rgba(252, 165, 165, 0.05)' : '#fef2f2',
                    border: isDarkMode ? 'none' : '1px solid #fecaca',
                    borderRadius: '3px',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}></span>
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>빨간색</span>: 공급가 미갱신
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.05)' : '#f0fdf4',
                    border: isDarkMode ? 'none' : '1px solid #86efac',
                    borderRadius: '3px',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}></span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>녹색</span>: 과거 갱신됨
                </div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    backgroundColor: isDarkMode ? 'rgba(125, 211, 252, 0.05)' : '#f0f9ff',
                    border: isDarkMode ? 'none' : '1px solid #7dd3fc',
                    borderRadius: '3px',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}></span>
                  <span style={{ color: '#0ea5e9', fontWeight: '600' }}>파란색</span>: 오늘 갱신 완료
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
                ℹ️ 발주확정 절차
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '4px' }}>
                  1. <span style={{ fontWeight: '600', color: 'var(--color-warning, #f59e0b)' }}>공급가 갱신</span>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  2. <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>등급할인</span> 자동 적용
                </div>
                <div style={{ marginBottom: '4px' }}>
                  3. <span style={{ fontWeight: '600', color: 'var(--color-primary, #2563eb)' }}>캐시 사용</span> (10원 단위)
                </div>
                <div>
                  4. <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>입금완료 및 발주확정</span>
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '8px' }}>
                <button
                  style={{
                    padding: '4px 12px',
                    background: 'var(--color-purple, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'default',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none',
                    opacity: 0.9
                  }}
                >
                  <Upload size={12} />
                  마켓파일 업로드
                </button>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--color-purple, #8b5cf6)' }}>✓ 1분 안에 발주 완료</span>
                </div>
                <div style={{ marginBottom: '4px', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                  주문 파일을 <strong style={{ color: 'var(--color-text)' }}>수정 없이 그대로</strong> 업로드하면 자동 통합
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary, #94a3b8)' }}>
                  마켓별/상품별 통계, 차트 완벽 활용
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
                🏢 서브계정 분리 정산
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--color-cyan, #0891b2)' }}>✓ 사업자별 자동 분리</span>
                </div>
                <div style={{ marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
                  서브계정별 발주서 등록 및 <strong style={{ color: 'var(--color-text)' }}>자동 정산 처리</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary, #94a3b8)', marginTop: '4px' }}>
                  거래명세서, 세금계산서 등 모든 정산 서류 자동 분리 발행
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary, #94a3b8)', lineHeight: '1.5' }}>
              <strong style={{ color: 'var(--color-text-secondary)' }}>💡 파일 업로드:</strong> <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>마켓파일</span> (스마트스토어, 쿠팡, 11번가, 토스, ESM, 카카오, 올웨이즈 등) 또는 <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>발주서</span> (달래마켓 양식) 업로드 가능 •
              <strong style={{ color: 'var(--color-text-secondary)' }}>공급가 갱신은 매일 필요</strong>하며, 어제 이전 갱신 주문(주황색)은 오늘 다시 갱신해야 합니다.
            </p>
          </div>
          </div>
          </div>
        </div>
      )}

      {/* Modal 컴포넌트 */}
      {modalState.type && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (modalState.onCancel) {
              modalState.onCancel();
            }
            closeModal();
          }}
          title={modalState.title}
          size="sm"
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ whiteSpace: 'pre-line', marginBottom: modalState.showInput ? '16px' : '0' }}>
              {modalState.message}
            </p>
            {modalState.showInput && (
              <input
                id="modal-prompt-input"
                type="text"
                value={modalState.inputValue}
                onChange={(e) => setModalState({ ...modalState, inputValue: e.target.value })}
                placeholder="입력해주세요..."
                className="filter-input"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && modalState.onConfirm) {
                    e.preventDefault();
                    modalState.onConfirm();
                    if (modalState.type !== 'prompt') {
                      closeModal();
                    }
                  }
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            {modalState.type === 'confirm' || modalState.type === 'prompt' ? (
              <>
                <button
                  onClick={() => {
                    if (modalState.onCancel) {
                      modalState.onCancel();
                    }
                    closeModal();
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#374151',
                    transition: 'all 0.2s'
                  }}
                >
                  {modalState.cancelText || '취소'}
                </button>
                <button
                  onClick={() => {
                    if (modalState.onConfirm) {
                      modalState.onConfirm();
                    }
                    // ⚠️ prompt 타입이 아닐 때만 자동으로 closeModal 호출
                    // prompt 타입은 onConfirm 내부에서 직접 closeModal을 호출함
                    if (modalState.type !== 'prompt') {
                      closeModal();
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    transition: 'all 0.2s'
                  }}
                >
                  {modalState.confirmText || '확인'}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (modalState.onConfirm) {
                    modalState.onConfirm();
                  }
                  closeModal();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  transition: 'all 0.2s'
                }}
              >
                확인
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* 마켓 송장파일 다운로드 모달 */}
      <Modal
        isOpen={showMarketInvoiceModal}
        onClose={() => setShowMarketInvoiceModal(false)}
        title="마켓별 송장파일 다운로드"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            각 마켓별로 송장파일을 다운로드하거나 전체 마켓을 일괄 다운로드할 수 있습니다.
          </p>

          <div className="flex justify-end mb-3">
            <button
              onClick={handleAllMarketInvoiceDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              전체 다운로드
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {uniqueMarkets.map((market) => {
              const marketOrders = filteredOrders.filter(
                (o) => (o.marketName || '미지정') === market
              );
              const orderCount = marketOrders.length;
              const isActive = orderCount > 0;

              return (
                <div
                  key={market}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'bg-gray-100 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex-1">
                    <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {market}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({orderCount}건)
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarketInvoiceDownload(market)}
                    disabled={!isActive}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 마켓파일 업로드 모달 */}
      <MarketFileUploadModal
        show={showMarketFileUploadModal}
        onClose={() => setShowMarketFileUploadModal(false)}
        onOrdersUploaded={() => {
          if (onRefresh) {
            onRefresh();
          }
        }}
        userId={userId}
        userEmail={userEmail}
        selectedSubAccount={selectedSubAccount}
      />

      {/* 옵션 검증 모달 (발주확정용) */}
      <OptionValidationModal
        show={showOptionValidationModal}
        onClose={() => setShowOptionValidationModal(false)}
        orders={validatedOrders}
        onSave={async (validatedOrders: any[]) => {
          try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            // 서브계정의 seller_code 및 ID 조회
            let subAccountSellerCode = 'S000000'; // 기본값
            let subAccountId: string | null = null;

            if (selectedSubAccount && selectedSubAccount !== 'main') {
              // 선택된 서브계정의 seller_code 및 ID 사용
              subAccountSellerCode = selectedSubAccount.seller_code || 'S000000';
              subAccountId = selectedSubAccount.id;
            } else {
              // 'main' 또는 미선택 시 메인 서브계정의 seller_code 및 ID 조회
              const { data: mainSubAccount } = await supabase
                .from('sub_accounts')
                .select('id, seller_code')
                .eq('organization_id', organizationId)
                .eq('is_main', true)
                .single();

              if (mainSubAccount) {
                subAccountSellerCode = mainSubAccount.seller_code || 'S000000';
                subAccountId = mainSubAccount.id;
              }
            }

            // 각 주문에 발주번호 생성 및 업데이트
            const now = getCurrentTimeUTC();

            // 총 공급가 계산 (할인 금액 10원 단위 절사)
            const totalSupplyPrice = validatedOrders.reduce((sum, order) => {
              const price = order.supplyPrice || 0;
              const discountAmount = Math.floor((price * discountRate / 100) / 10) * 10;
              const finalPrice = price - discountAmount;
              return sum + finalPrice;
            }, 0);
            // 주문당 캐시 차감액 계산
            const cashPerOrder = cashToUse / validatedOrders.length;

            // 셀러코드 결정: 무조건 서브계정의 seller_code 사용
            const sellerCodeToUse = subAccountSellerCode;

            for (let i = 0; i < validatedOrders.length; i++) {
              const order = validatedOrders[i];
              const orderNo = generateOrderNumber(sellerCodeToUse, i + 1);
              const quantity = parseInt(order.quantity) || 1;
              const unitPrice = order.unitPrice || 0;
              const supplyPrice = order.supplyPrice || (unitPrice * quantity);
              // 할인 금액 계산 후 10원 단위 절사
              const discountAmount = Math.floor((supplyPrice * discountRate / 100) / 10) * 10;
              const finalSupplyPrice = supplyPrice - discountAmount;

              // 주문별 최종입금액 계산 (할인된 공급가 - 캐시사용액 비율 분배)
              const orderCashDeduction = totalSupplyPrice > 0 ? (finalSupplyPrice / totalSupplyPrice) * cashToUse : 0;
              const finalPaymentAmount = finalSupplyPrice - orderCashDeduction;
              const roundedFinalPayment = Math.floor(finalPaymentAmount / 10) * 10;

              const { error } = await supabase
                .from('integrated_orders')
                .update({
                  shipping_status: '발주서확정',
                  order_number: orderNo,
                  confirmed_at: now,
                  organization_id: organizationId, // 조직 ID 저장
                  sub_account_id: subAccountId, // 메인 또는 선택된 서브계정 ID 저장
                  created_by: userId, // 등록자 ID 저장
                  option_name: order.optionName, // 수정된 옵션상품
                  seller_supply_price: unitPrice,
                  settlement_amount: finalSupplyPrice,
                  final_deposit_amount: roundedFinalPayment.toString() // 최종입금액 저장 (10원 단위 절사)
                })
                .eq('id', order._metadata.id);

              if (error) {
                console.error('발주확정 오류:', error);
                showModal('alert', '오류', `발주 확정 중 오류가 발생했습니다: ${error.message}`);
                return;
              }
            }

            // 캐시 차감 처리
            if (cashToUse > 0) {
              try {
                const cashResponse = await fetch('/api/cash/use', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    amount: cashToUse,
                    description: `발주서 확정 (${validatedOrders.length}건)`,
                    metadata: {
                      orderCount: validatedOrders.length,
                      totalSupplyPrice: validatedOrders.reduce((sum, order) => sum + (order.supplyPrice || 0), 0),
                      cashUsed: cashToUse
                    }
                  })
                });

                const cashData = await cashResponse.json();

                if (!cashData.success) {
                  console.error('캐시 차감 실패:', cashData);
                  showModal('alert', '경고', `주문은 확정되었으나 캐시 차감에 실패했습니다. 관리자에게 문의해주세요.`);
                } else {
                  // 캐시 잔액 업데이트
                  setCashBalance(cashData.newBalance);
                  toast.success(`${cashToUse.toLocaleString()}캐시가 차감되었습니다!`);
                }
              } catch (cashError) {
                console.error('캐시 차감 오류:', cashError);
                showModal('alert', '경고', `주문은 확정되었으나 캐시 처리 중 오류가 발생했습니다.`);
              }
            }

            // 캐시 사용 금액 초기화
            setCashToUse(0);

            setShowOptionValidationModal(false);
            setValidatedOrders([]);
            setOptionProductsMap(new Map());

            // 토스트로 완료 메시지 표시
            const message = cashToUse > 0
              ? `${validatedOrders.length}건의 주문이 발주 확정되었습니다! (${cashToUse.toLocaleString()}캐시 차감)`
              : `${validatedOrders.length}건의 주문이 발주 확정되었습니다!`;

            toast.success(message);

            // 주문 목록 새로고침
            if (onRefresh) {
              onRefresh();
            }
          } catch (error) {
            console.error('발주확정 오류:', error);
            showModal('alert', '오류', '발주 확정 중 오류가 발생했습니다.');
          }
        }}
        optionProducts={optionProductsMap}
      />

      {/* 입금자명 입력 모달 */}
      {showDepositorNameModal && (
        <Modal
          isOpen={showDepositorNameModal}
          onClose={() => setShowDepositorNameModal(false)}
          title="입금자명 입력"
        >
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              입금자명을 입력해주세요.
            </p>
            <input
              type="text"
              value={depositorNameInput}
              onChange={(e) => setDepositorNameInput(e.target.value)}
              placeholder="입금자명을 입력하세요"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '20px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  proceedWithPaymentConfirmation();
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDepositorNameModal(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={proceedWithPaymentConfirmation}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#10b981',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                확인
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 판매자 정보 검증 모달 */}
      <SellerInfoValidationModal
        isOpen={showSellerInfoValidationModal}
        onClose={() => setShowSellerInfoValidationModal(false)}
        onConfirm={() => {
          // 정보 입력 완료 후 모달 닫고 발주확정 프로세스 재실행
          setShowSellerInfoValidationModal(false);
          setTimeout(() => {
            handlePaymentConfirmation();
          }, 100);
        }}
        userId={userId}
        organizationId={organizationId}
      />
    </div>
  );
}
