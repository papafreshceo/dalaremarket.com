'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Search, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { getCurrentTimeUTC, formatDateTimeForDisplay } from '@/lib/date';
import AdminSettlementTab from './components/AdminSettlementTab';
import AdminRankingTab from './components/AdminRankingTab';

interface Order {
  id: number;
  order_number?: string;
  seller_id?: string; // 레거시 지원
  organization_id?: string; // 조직 기반
  vendor_name?: string;
  option_name: string;
  shipping_status?: string;
  quantity: string;
  seller_supply_price?: string;
  settlement_amount?: string;
  final_payment_amount?: string;
  final_deposit_amount?: string; // 캐시 차감 후 실제 입금액
  cash_used?: string; // 주문별 캐시 사용액
  payment_confirmed_at?: string;
  confirmed_at?: string;
  cancel_requested_at?: string;
  canceled_at?: string;
  refund_processed_at?: string;
  created_at: string;
  sheet_date: string;
  created_by?: string; // 발주확정 실행자 ID
  depositor_name?: string; // 입금자명
  bank_name?: string; // 조직 은행명
  bank_account?: string; // 조직 계좌번호
  account_holder?: string; // 조직 예금주
}

interface ConfirmedBatch {
  confirmed_at: string;
  총금액: number;
  캐시사용금액: number;
  최종입금액: number; // 캐시 차감 후 실제 입금액
  주문건수: number;
  입금확인: boolean;
  입금자명?: string;
  실행자_ID?: string;
  실행자_이름?: string;
  실행자_전화번호?: string;
}

interface StatusBatch {
  status: string;
  timestamp: string;  // 해당 상태로 변경된 시각
  주문건수: number;
  총금액: number;
  orders: Order[];
}

interface OrganizationStats {
  organization_id: string;
  organization_name: string;
  총금액: number;
  입금확인: boolean;
  업로드_건수: number;
  업로드_수량: number;
  발주서확정_건수: number;
  발주서확정_수량: number;
  결제완료_건수: number;
  결제완료_수량: number;
  상품준비중_건수: number;
  상품준비중_수량: number;
  발송완료_건수: number;
  발송완료_수량: number;
  취소요청_건수: number;
  취소요청_수량: number;
  취소완료_건수: number;
  취소완료_수량: number;
  환불예정액: number;
  환불완료_건수: number;
  환불완료_수량: number;
  환불완료액: number;
  발주확정_배치?: ConfirmedBatch[];
  결제완료_배치?: StatusBatch[];
  상품준비중_배치?: StatusBatch[];
  발송완료_배치?: StatusBatch[];
  취소요청_배치?: StatusBatch[];
  취소완료_배치?: StatusBatch[];
  환불완료_배치?: StatusBatch[];
}

export default function OrderPlatformPage() {
  const [activeTab, setActiveTab] = useState<'주문관리' | '조직별정산내역' | '조직랭킹'>('주문관리');
  const [orders, setOrders] = useState<Order[]>([]);
  const [organizationStats, setOrganizationStats] = useState<OrganizationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationStatsExpanded, setOrganizationStatsExpanded] = useState(true);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterRefund, setFilterRefund] = useState<string>('all');
  const [organizationNames, setOrganizationNames] = useState<Map<string, string>>(new Map());
  const [expandedOrganizations, setExpandedOrganizations] = useState<Set<string>>(new Set());
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [totalExpanded, setTotalExpanded] = useState(false);


  // 날짜 및 검색 필터
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const get30DaysAgoDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 30);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🔧 기본값을 빈 문자열로 설정하여 모든 주문 조회 (날짜 필터 없음)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 날짜 빠른 선택
  const setDateRange = (days: number | 'thisMonth') => {
    const today = new Date();
    const endDateStr = getTodayDate();

    if (days === 'thisMonth') {
      // 이번 달 1일부터 오늘까지
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const startDateStr = `${year}-${month}-01`;
      setStartDate(startDateStr);
      setEndDate(endDateStr);
    } else {
      // 7일, 30일
      const startDay = new Date(today);
      startDay.setDate(today.getDate() - days);
      const year = startDay.getFullYear();
      const month = String(startDay.getMonth() + 1).padStart(2, '0');
      const day = String(startDay.getDate()).padStart(2, '0');
      const startDateStr = `${year}-${month}-${day}`;
      setStartDate(startDateStr);
      setEndDate(endDateStr);
    }
  };

  const fetchOrders = async () => {
    console.log('🚀 [fetchOrders] 호출됨!', { startDate, endDate });
    try {
      setLoading(true);
      // onlyWithOrganization=true로 organization_id가 있는 주문만 DB에서 필터링
      // limit을 10000으로 설정하여 충분한 데이터 가져오기
      // 날짜 범위 필터 적용
      const params = new URLSearchParams({
        onlyWithOrganization: 'true',
        limit: '10000'
      });
      console.log('📤 [fetchOrders] API 호출 직전, params:', params.toString());

      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await fetch(`/api/integrated-orders?${params.toString()}`);
      const result = await response.json();

      console.log('📊 [admin/order-platform] API 응답:', {
        success: result.success,
        총주문수: result.data?.length || 0,
        조직별주문: result.data?.reduce((acc: any, order: Order) => {
          const orgId = order.organization_id || '미지정';
          acc[orgId] = (acc[orgId] || 0) + 1;
          return acc;
        }, {}),
        상태별주문: result.data?.reduce((acc: any, order: Order) => {
          const status = order.shipping_status || '미지정';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      });

      if (result.success) {
        const organizationOrders = result.data || [];
        console.log('📦 테스트1사업자 주문:', organizationOrders.filter((o: Order) =>
          o.organization_id?.startsWith('4bf281f4')
        ));

        // 조직 ID 수집
        const organizationIds = [...new Set(organizationOrders.map((o: Order) => o.organization_id).filter(Boolean))];

        // 조직 정보 조회 (organizations 테이블에서 name, 은행 정보 가져오기)
        let nameMap = new Map<string, string>();
        const orgBankInfoMap = new Map<string, { bank_name: string; bank_account: string; account_holder: string }>();

        if (organizationIds.length > 0) {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          const { data: organizations, error } = await supabase
            .from('organizations')
            .select('id, business_name, bank_name, bank_account, account_holder')
            .in('id', organizationIds);

          if (!error && organizations) {
            console.log('🏦 조직 은행 정보 조회 결과:', organizations);
            organizations.forEach((org: any) => {
              nameMap.set(org.id, org.business_name || org.id);
              const bankInfo = {
                bank_name: org.bank_name || '',
                bank_account: org.bank_account || '',
                account_holder: org.account_holder || ''
              };
              console.log(`🏦 조직 ${org.business_name} 은행 정보:`, bankInfo);
              orgBankInfoMap.set(org.id, bankInfo);
            });
            setOrganizationNames(nameMap);
          } else if (error) {
            console.error('❌ 조직 은행 정보 조회 실패:', error);
          }
        }

        // 주문에 은행 정보 매핑
        const ordersWithBankInfo = organizationOrders.map((order: Order) => ({
          ...order,
          bank_name: order.organization_id ? orgBankInfoMap.get(order.organization_id)?.bank_name : undefined,
          bank_account: order.organization_id ? orgBankInfoMap.get(order.organization_id)?.bank_account : undefined,
          account_holder: order.organization_id ? orgBankInfoMap.get(order.organization_id)?.account_holder : undefined
        }));

        console.log('🏦 은행 정보가 매핑된 주문 샘플 (처음 2개):', ordersWithBankInfo.slice(0, 2).map(o => ({
          id: o.id,
          organization_id: o.organization_id,
          bank_name: o.bank_name,
          bank_account: o.bank_account,
          account_holder: o.account_holder
        })));

        setOrders(ordersWithBankInfo);
        await calculateOrganizationStats(organizationOrders, nameMap);
      }
    } catch (error) {
      console.error('주문 조회 오류:', error);
      toast.error('주문 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate]);

  const calculateOrganizationStats = async (orderData: Order[], nameMap?: Map<string, string>) => {
    const statsMap = new Map<string, OrganizationStats>();
    const names = nameMap || organizationNames;

    orderData.forEach((order) => {
      const organizationId = order.organization_id || '미지정';
      if (!statsMap.has(organizationId)) {
        statsMap.set(organizationId, {
          organization_id: organizationId,
          organization_name: names.get(organizationId) || organizationId,
          총금액: 0,
          입금확인: false,
          업로드_건수: 0,
          업로드_수량: 0,
          발주서확정_건수: 0,
          발주서확정_수량: 0,
          결제완료_건수: 0,
          결제완료_수량: 0,
          상품준비중_건수: 0,
          상품준비중_수량: 0,
          발송완료_건수: 0,
          발송완료_수량: 0,
          취소요청_건수: 0,
          취소요청_수량: 0,
          취소완료_건수: 0,
          취소완료_수량: 0,
          환불예정액: 0,
          환불완료_건수: 0,
          환불완료_수량: 0,
          환불완료액: 0,
        });
      }

      const stats = statsMap.get(organizationId)!;
      const status = order.shipping_status;
      if (!status) return; // shipping_status가 없으면 통계에서 제외
      const quantity = Number(order.quantity) || 0;
      const settlementAmount = Number(order.settlement_amount) || 0;
      // 최종입금액 (발주확정 시 저장된 값, 없으면 정산금액 사용)
      const finalAmount = Number(order.final_payment_amount) || settlementAmount;

      // 총금액은 배치 기준으로 계산하므로 여기서는 계산하지 않음 (444번 라인에서 계산)

      if (order.payment_confirmed_at) {
        stats.입금확인 = true;
      }

      if (order.refund_processed_at && !stats.환불처리일시) {
        const date = new Date(order.refund_processed_at);
        // DB에 한국 시간으로 저장되어 있으므로 UTC로 파싱
        stats.환불처리일시 = date.toISOString().slice(0, 16).replace('T', ' ');
      }

      if (status === '발주서등록' || status === '접수') {
        stats.업로드_건수 += 1;
        stats.업로드_수량 += quantity;
      } else if (status === '발주서확정') {
        stats.발주서확정_건수 += 1;
        stats.발주서확정_수량 += quantity;
      } else if (status === '결제완료') {
        stats.결제완료_건수 += 1;
        stats.결제완료_수량 += quantity;
      } else if (status === '상품준비중') {
        stats.상품준비중_건수 += 1;
        stats.상품준비중_수량 += quantity;
      } else if (status === '발송완료') {
        stats.발송완료_건수 += 1;
        stats.발송완료_수량 += quantity;
      } else if (status === '취소요청') {
        stats.취소요청_건수 += 1;
        stats.취소요청_수량 += quantity;
        stats.환불예정액 += settlementAmount;
      } else if (status === '취소완료') {
        if (order.refund_processed_at) {
          // 환불처리까지 완료된 건
          stats.환불완료_건수 += 1;
          stats.환불완료_수량 += quantity;
          stats.환불완료액 += settlementAmount;
        } else {
          // 취소승인만 된 건 (환불 대기중)
          stats.취소완료_건수 += 1;
          stats.취소완료_수량 += quantity;
          stats.환불예정액 += settlementAmount;
        }
      } else if (status === '환불완료') {
        // 환불완료 상태
        stats.환불완료_건수 += 1;
        stats.환불완료_수량 += quantity;
        stats.환불완료액 += settlementAmount;
      }
    });

    const statsArray = Array.from(statsMap.values());

    // 발주확정 배치 계산 (confirmed_at별 그룹화)
    for (const stat of statsArray) {
      // 발주서확정 + 결제완료 상태의 주문 모두 확인 (confirmed_at이 있는 것만)
      const organizationOrdersWithConfirmedAt = orderData.filter(order =>
        (order.organization_id || '미지정') === stat.organization_id &&
        (order.shipping_status === '발주서확정' || order.shipping_status === '결제완료') &&
        order.confirmed_at
      );

      if (organizationOrdersWithConfirmedAt.length > 0) {
        // confirmed_at별로 그룹화
        const batchMap = new Map<string, ConfirmedBatch>();

        // order_batches 테이블에서 배치 정보 가져오기
        const confirmedAtList = [...new Set(organizationOrdersWithConfirmedAt.map(o => o.confirmed_at))];
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: batchesData } = await supabase
          .from('order_batches')
          .select('*')
          .eq('organization_id', stat.organization_id)
          .in('confirmed_at', confirmedAtList);

        const batchesMap = new Map();
        (batchesData || []).forEach(b => {
          batchesMap.set(b.confirmed_at, b);
        });

        organizationOrdersWithConfirmedAt.forEach(order => {
          const confirmedAt = order.confirmed_at!;
          const isPaymentConfirmed = order.shipping_status === '결제완료';

          if (!batchMap.has(confirmedAt)) {
            // order_batches 테이블에서 배치 정보 가져오기
            const savedBatch = batchesMap.get(confirmedAt);

            if (savedBatch) {
              // DB에 저장된 배치 정보 사용
              batchMap.set(confirmedAt, {
                confirmed_at: confirmedAt,
                총금액: Number(savedBatch.total_amount) || 0,
                캐시사용금액: Number(savedBatch.cash_used) || 0,
                최종입금액: Number(savedBatch.final_payment_amount) || 0,
                주문건수: 0, // 주문 수는 다시 계산
                입금확인: savedBatch.payment_confirmed || false,
                입금자명: savedBatch.depositor_name || undefined,
                실행자_ID: savedBatch.executor_id || undefined
              });
            } else {
              // DB에 없으면 기본값으로 생성 (레거시 데이터)
              batchMap.set(confirmedAt, {
                confirmed_at: confirmedAt,
                총금액: 0,
                캐시사용금액: 0,
                최종입금액: 0,
                주문건수: 0,
                입금확인: false,
                입금자명: order.depositor_name || undefined,
                실행자_ID: order.created_by || undefined
              });
            }
          }

          const batch = batchMap.get(confirmedAt)!;

          // 건수는 발주서확정 상태만 포함 (입금 대기중인 건수)
          if (order.shipping_status === '발주서확정') {
            batch.주문건수 += 1;
          }

          // 입금확인 상태 업데이트 (모든 주문이 결제완료면 입금확인)
          if (!isPaymentConfirmed) {
            batch.입금확인 = false;
          }
        });

        // DB에 배치 정보가 없는 경우 (레거시 데이터) 주문별 cash_used 합산
        batchMap.forEach((batch, confirmedAt) => {
          if (batch.총금액 === 0 && batch.캐시사용금액 === 0) {
            // 레거시 데이터: 주문별로 계산
            const batchOrders = organizationOrdersWithConfirmedAt.filter(o => o.confirmed_at === confirmedAt);
            batch.총금액 = batchOrders.reduce((sum, o) => sum + (Number(o.settlement_amount) || 0), 0);
            batch.캐시사용금액 = batchOrders.reduce((sum, o) => sum + (Number(o.cash_used) || 0), 0);
            batch.최종입금액 = batch.총금액 - batch.캐시사용금액; // 레거시 배치도 최종입금액 계산
          }
        });

        // 각 배치의 입금확인 상태 계산
        batchMap.forEach((batch, confirmedAt) => {
          const batchOrders = organizationOrdersWithConfirmedAt.filter(o => o.confirmed_at === confirmedAt);
          const allPaymentConfirmed = batchOrders.every(o => o.shipping_status === '결제완료');
          batch.입금확인 = allPaymentConfirmed;
        });

        // 발주서확정 상태의 주문이 있는 배치만 포함
        const batches = Array.from(batchMap.values()).filter(b => b.주문건수 > 0);

        // 실행자 정보 조회 (executor_id가 있는 배치만)
        const executorIds = [...new Set(batches.map(b => b.실행자_ID).filter(Boolean))];
        if (executorIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, name, phone')
            .in('id', executorIds);

          const userMap = new Map();
          (usersData || []).forEach(u => {
            userMap.set(u.id, { name: u.name, phone: u.phone });
          });

          // 배치에 실행자 정보 추가
          batches.forEach(batch => {
            if (batch.실행자_ID) {
              const user = userMap.get(batch.실행자_ID);
              if (user) {
                batch.실행자_이름 = user.name;
                batch.실행자_전화번호 = user.phone;
              }
            }
          });
        }

        if (batches.length > 0) {
          stat.발주확정_배치 = batches.sort((a, b) =>
            new Date(b.confirmed_at).getTime() - new Date(a.confirmed_at).getTime()
          );

          // 총금액을 배치의 최종입금액(캐시 사용 후) 합계로 재계산
          stat.총금액 = batches.reduce((sum, batch) => {
            console.log(`  배치 합산:`, { sum, batch최종입금액: batch.최종입금액, 계산: sum + (batch.최종입금액 || 0) });
            return sum + (batch.최종입금액 || 0);
          }, 0);

          console.log(`🔍 [조직 합계 계산] ${stat.organization_name}`, {
            배치수: batches.length,
            배치별_최종입금액: batches.map(b => ({
              confirmed_at: b.confirmed_at,
              총금액: b.총금액,
              캐시사용금액: b.캐시사용금액,
              최종입금액: b.최종입금액
            })),
            계산된_총금액: stat.총금액
          });
        } else {
          // 배치가 없는 경우 총금액은 0으로 유지 (발주확정이 없는 경우)
          stat.총금액 = 0;
        }
      } else {
        // confirmed_at이 없는 주문만 있는 경우 총금액 0
        stat.총금액 = 0;
      }
    }

    statsArray.sort((a, b) => (b.업로드_건수 + b.발주서확정_건수 + b.결제완료_건수 + b.상품준비중_건수 + b.발송완료_건수 + b.취소요청_건수 + b.취소완료_건수 + b.환불완료_건수) - (a.업로드_건수 + a.발주서확정_건수 + a.결제완료_건수 + a.상품준비중_건수 + a.발송완료_건수 + a.취소요청_건수 + a.취소완료_건수 + a.환불완료_건수));

    // 배치 실행자 정보 가져오기
    const allUserIds = new Set<string>();
    statsArray.forEach(stat => {
      stat.발주확정_배치?.forEach(batch => {
        if (batch.실행자_ID) {
          allUserIds.add(batch.실행자_ID);
        }
      });
    });

    if (allUserIds.size > 0) {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, phone')
        .in('id', Array.from(allUserIds));

      const userMap = new Map<string, { name: string; phone: string }>();
      (users || []).forEach(user => {
        userMap.set(user.id, { name: user.name || '미지정', phone: user.phone || '' });
      });

      // 배치에 실행자 정보 추가 (새로운 객체 생성으로 React 리렌더링 트리거)
      const statsArrayWithUserInfo = statsArray.map(stat => {
        if (stat.발주확정_배치) {
          return {
            ...stat,
            발주확정_배치: stat.발주확정_배치.map(batch => {
              if (batch.실행자_ID) {
                const userInfo = userMap.get(batch.실행자_ID);
                console.log('🔍 [배치 실행자 조회] 배치 실행자 ID:', batch.실행자_ID, '-> userInfo:', userInfo);
                if (userInfo) {
                  return {
                    ...batch,
                    실행자_이름: userInfo.name,
                    실행자_전화번호: userInfo.phone
                  };
                }
              }
              return batch;
            })
          };
        }
        return stat;
      });

      // 합계 계산
      const totalStats: OrganizationStats = {
        organization_id: 'total',
        organization_name: '합계',
        총금액: statsArrayWithUserInfo.reduce((sum, s) => sum + s.총금액, 0),
        입금확인: false,
        업로드_건수: statsArrayWithUserInfo.reduce((sum, s) => sum + s.업로드_건수, 0),
        업로드_수량: statsArrayWithUserInfo.reduce((sum, s) => sum + s.업로드_수량, 0),
        발주서확정_건수: statsArrayWithUserInfo.reduce((sum, s) => sum + s.발주서확정_건수, 0),
        발주서확정_수량: statsArrayWithUserInfo.reduce((sum, s) => sum + s.발주서확정_수량, 0),
        결제완료_건수: statsArrayWithUserInfo.reduce((sum, s) => sum + s.결제완료_건수, 0),
        결제완료_수량: statsArrayWithUserInfo.reduce((sum, s) => sum + s.결제완료_수량, 0),
        상품준비중_건수: statsArrayWithUserInfo.reduce((sum, s) => sum + s.상품준비중_건수, 0),
        상품준비중_수량: statsArrayWithUserInfo.reduce((sum, s) => sum + s.상품준비중_수량, 0),
        발송완료_건수: statsArrayWithUserInfo.reduce((sum, s) => sum + s.발송완료_건수, 0),
        발송완료_수량: statsArrayWithUserInfo.reduce((sum, s) => sum + s.발송완료_수량, 0),
        취소요청_건수: statsArrayWithUserInfo.reduce((sum, s) => sum + s.취소요청_건수, 0),
        취소요청_수량: statsArrayWithUserInfo.reduce((sum, s) => sum + s.취소요청_수량, 0),
        취소완료_건수: statsArrayWithUserInfo.reduce((sum, s) => sum + s.취소완료_건수, 0),
        취소완료_수량: statsArrayWithUserInfo.reduce((sum, s) => sum + s.취소완료_수량, 0),
        환불예정액: statsArrayWithUserInfo.reduce((sum, s) => sum + s.환불예정액, 0),
        환불완료_건수: statsArrayWithUserInfo.reduce((sum, s) => sum + s.환불완료_건수, 0),
        환불완료_수량: statsArrayWithUserInfo.reduce((sum, s) => sum + s.환불완료_수량, 0),
        환불완료액: statsArrayWithUserInfo.reduce((sum, s) => sum + s.환불완료액, 0),
      };

      // 합계를 맨 앞에 추가
      const finalStatsArray = [totalStats, ...statsArrayWithUserInfo];

      console.log('🔍 [최종 statsArray] 배치 정보:');
      finalStatsArray.forEach(s => {
        console.log(`  조직: ${s.organization_name}, 총금액: ${s.총금액} (타입: ${typeof s.총금액})`);
        if (s.발주확정_배치 && s.발주확정_배치.length > 0) {
          s.발주확정_배치.forEach((b, idx) => {
            console.log(`    배치 ${idx + 1}:`, {
              실행자_ID: b.실행자_ID,
              실행자_이름: b.실행자_이름,
              실행자_전화번호: b.실행자_전화번호,
              입금자명: b.입금자명
            });
          });
        }
      });

      console.log('✅ [setOrganizationStats 호출] finalStatsArray 전달됨');
      setOrganizationStats(finalStatsArray);
    } else {
      // 실행자 정보가 없는 경우
      // 합계 계산
      const totalStats: OrganizationStats = {
        organization_id: 'total',
        organization_name: '합계',
        총금액: statsArray.reduce((sum, s) => sum + s.총금액, 0),
        입금확인: false,
        업로드_건수: statsArray.reduce((sum, s) => sum + s.업로드_건수, 0),
        업로드_수량: statsArray.reduce((sum, s) => sum + s.업로드_수량, 0),
        발주서확정_건수: statsArray.reduce((sum, s) => sum + s.발주서확정_건수, 0),
        발주서확정_수량: statsArray.reduce((sum, s) => sum + s.발주서확정_수량, 0),
        결제완료_건수: statsArray.reduce((sum, s) => sum + s.결제완료_건수, 0),
        결제완료_수량: statsArray.reduce((sum, s) => sum + s.결제완료_수량, 0),
        상품준비중_건수: statsArray.reduce((sum, s) => sum + s.상품준비중_건수, 0),
        상품준비중_수량: statsArray.reduce((sum, s) => sum + s.상품준비중_수량, 0),
        발송완료_건수: statsArray.reduce((sum, s) => sum + s.발송완료_건수, 0),
        발송완료_수량: statsArray.reduce((sum, s) => sum + s.발송완료_수량, 0),
        취소요청_건수: statsArray.reduce((sum, s) => sum + s.취소요청_건수, 0),
        취소요청_수량: statsArray.reduce((sum, s) => sum + s.취소요청_수량, 0),
        취소완료_건수: statsArray.reduce((sum, s) => sum + s.취소완료_건수, 0),
        취소완료_수량: statsArray.reduce((sum, s) => sum + s.취소완료_수량, 0),
        환불예정액: statsArray.reduce((sum, s) => sum + s.환불예정액, 0),
        환불완료_건수: statsArray.reduce((sum, s) => sum + s.환불완료_건수, 0),
        환불완료_수량: statsArray.reduce((sum, s) => sum + s.환불완료_수량, 0),
        환불완료액: statsArray.reduce((sum, s) => sum + s.환불완료액, 0),
      };

      // 합계를 맨 앞에 추가
      statsArray.unshift(totalStats);

      setOrganizationStats(statsArray);
    }
  };

  const handlePaymentCheckToggle = async (organizationId: string, confirmedAt?: string) => {
    const currentStat = organizationStats.find(s => s.organization_id === organizationId);
    if (!currentStat) return;

    // 실제 orders 데이터에서 배치의 현재 상태 확인
    let currentBatchIsConfirmed = false;
    if (confirmedAt) {
      const batchOrders = orders.filter(order =>
        (order.organization_id || '미지정') === organizationId &&
        order.confirmed_at === confirmedAt
      );
      // 해당 배치의 모든 주문이 결제완료 이상 상태면 입금확인 완료 상태
      currentBatchIsConfirmed = batchOrders.length > 0 && batchOrders.every(o =>
        o.shipping_status !== '발주서확정' && o.shipping_status !== '발주서등록'
      );
    }

    // 토글: 현재 입금확인 완료 상태면 취소(false), 아니면 확인(true)
    const newCheckState = confirmedAt
      ? !currentBatchIsConfirmed
      : !currentStat.입금확인;

    if (newCheckState) {
      const organizationOrders = orders.filter(order => {
        const orderOrgId = order.organization_id || '미지정';
        const status = order.shipping_status;
        const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
        return orderOrgId === organizationId && status === '발주서확정' && matchesBatch;
      });

      if (organizationOrders.length === 0) {
        toast.error('해당 조직의 발주서확정 상태 주문이 없습니다.');
        return;
      }

      try {
        const now = getCurrentTimeUTC();

        const updatedOrders = organizationOrders.map(order => ({
          id: order.id,
          order_number: order.order_number,
          organization_id: order.organization_id,
          option_name: order.option_name,
          shipping_status: '결제완료',
          quantity: order.quantity,
          seller_supply_price: order.seller_supply_price,
          settlement_amount: order.settlement_amount,
          payment_confirmed_at: now,
          confirmed_at: order.confirmed_at,
          refund_processed_at: order.refund_processed_at,
          created_at: order.created_at,
          sheet_date: order.sheet_date
        }));

        const response = await fetch('/api/integrated-orders/bulk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: updatedOrders }),
        });

        const result = await response.json();

        if (result.success) {
          // 로컬 상태 업데이트 - orders 업데이트
          setOrders(prev => prev.map(order => {
            const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
            if (order.organization_id === organizationId && order.shipping_status === '발주서확정' && matchesBatch) {
              return { ...order, shipping_status: '결제완료', payment_confirmed_at: now };
            }
            return order;
          }));

          // organizationStats 업데이트 (배치별 입금확인 상태 + 건수 업데이트)
          setOrganizationStats(prev =>
            prev.map(stat => {
              if (stat.organization_id === organizationId) {
                if (confirmedAt && stat.발주확정_배치) {
                  // 특정 배치의 입금확인 상태 업데이트
                  const updatedBatches = stat.발주확정_배치.map(batch => {
                    if (batch.confirmed_at === confirmedAt) {
                      // 배치의 입금확인 상태 업데이트 + 주문건수를 0으로 (결제완료로 변경되었으므로)
                      return { ...batch, 입금확인: true, 주문건수: 0 };
                    }
                    return batch;
                  });
                  // 모든 배치가 입금확인되었는지 체크
                  const allConfirmed = updatedBatches.every(b => b.입금확인);

                  // 발주서확정 건수를 결제완료로 이동
                  const batchOrderCount = organizationOrders.length;
                  return {
                    ...stat,
                    발주확정_배치: updatedBatches,
                    입금확인: allConfirmed,
                    발주서확정_건수: Math.max(0, stat.발주서확정_건수 - batchOrderCount),
                    결제완료_건수: stat.결제완료_건수 + batchOrderCount
                  };
                } else {
                  // 전체 입금확인
                  return { ...stat, 입금확인: true };
                }
              }
              return stat;
            })
          );

          const batchInfo = confirmedAt ? ` (${formatDateTimeForDisplay(confirmedAt).slice(0, 16)} 배치)` : '';
          toast.success(`${result.count}건의 주문이 결제완료로 변경되었습니다.${batchInfo}`);

          // 배치내역 자동 펼치기 (조직 + 배치)
          setExpandedOrganizations(prev => {
            const newExpanded = new Set(prev);
            newExpanded.add(organizationId);
            return newExpanded;
          });

          // 해당 배치도 자동으로 펼치기
          if (confirmedAt) {
            const batchId = `${organizationId}-${confirmedAt}`;
            setExpandedBatches(prev => {
              const newExpanded = new Set(prev);
              newExpanded.add(batchId);
              return newExpanded;
            });
          }

          // 정산 레코드 자동 생성
          try {
            // 발주확정일자별로 정산 레코드 생성
            const confirmedDates = new Set(
              organizationOrders
                .filter(o => o.confirmed_at)
                .map(o => new Date(o.confirmed_at!).toISOString().split('T')[0])
            );

            for (const date of confirmedDates) {
              await fetch('/api/settlements/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  organizationId,
                  settlementDate: date,
                }),
              });
            }
          } catch (settlementError) {
            console.error('정산 레코드 생성 오류:', settlementError);
            // 정산 생성 실패해도 입금확인은 성공으로 처리
          }
        } else {
          toast.error('상태 변경 실패: ' + result.error);
        }
      } catch (error) {
        console.error('입금확인 처리 오류:', error);
        toast.error('입금확인 처리 중 오류가 발생했습니다.');
      }
    } else {
      const organizationOrders = orders.filter(order => {
        const orderOrgId = order.organization_id || '미지정';
        const status = order.shipping_status;
        const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
        return orderOrgId === organizationId && status === '결제완료' && matchesBatch;
      });

      if (organizationOrders.length === 0) {
        toast.error('해당 조직의 결제완료 상태 주문이 없습니다.');
        return;
      }

      try {
        const updatedOrders = organizationOrders.map(order => ({
          id: order.id,
          order_number: order.order_number,
          organization_id: order.organization_id,
          option_name: order.option_name,
          shipping_status: '발주서확정',
          quantity: order.quantity,
          seller_supply_price: order.seller_supply_price,
          settlement_amount: order.settlement_amount,
          payment_confirmed_at: null,
          confirmed_at: order.confirmed_at,
          refund_processed_at: order.refund_processed_at,
          created_at: order.created_at,
          sheet_date: order.sheet_date
        }));

        const response = await fetch('/api/integrated-orders/bulk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: updatedOrders }),
        });

        const result = await response.json();

        if (result.success) {
          // 로컬 상태 업데이트 - orders 업데이트
          setOrders(prev => prev.map(order => {
            const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
            if (order.organization_id === organizationId && order.shipping_status === '결제완료' && matchesBatch) {
              return { ...order, shipping_status: '발주서확정', payment_confirmed_at: null };
            }
            return order;
          }));

          // organizationStats 업데이트 (배치별 입금확인 상태 업데이트)
          setOrganizationStats(prev =>
            prev.map(stat => {
              if (stat.organization_id === organizationId) {
                if (confirmedAt && stat.발주확정_배치) {
                  // 특정 배치의 입금확인 상태 취소
                  const updatedBatches = stat.발주확정_배치.map(batch =>
                    batch.confirmed_at === confirmedAt
                      ? { ...batch, 입금확인: false }
                      : batch
                  );
                  // 모든 배치가 입금확인되었는지 체크
                  const allConfirmed = updatedBatches.every(b => b.입금확인);
                  return { ...stat, 발주확정_배치: updatedBatches, 입금확인: allConfirmed };
                } else {
                  // 전체 입금확인 취소
                  return { ...stat, 입금확인: false };
                }
              }
              return stat;
            })
          );

          // total stat도 업데이트
          setTimeout(async () => {
            const updatedOrders = orders.map(order => {
              const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
              if (order.organization_id === organizationId && order.shipping_status === '결제완료' && matchesBatch) {
                return { ...order, shipping_status: '발주서확정', payment_confirmed_at: null };
              }
              return order;
            });
            await calculateOrganizationStats(updatedOrders);
          }, 0);

          const batchInfo = confirmedAt ? ` (${formatDateTimeForDisplay(confirmedAt).slice(0, 16)} 배치)` : '';
          toast.success(`${result.count}건의 주문이 발주서확정으로 변경되었습니다.${batchInfo}`);
        } else {
          toast.error('상태 변경 실패: ' + result.error);
        }
      } catch (error) {
        console.error('입금확인 취소 처리 오류:', error);
        toast.error('입금확인 취소 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const handleRefundComplete = async (organizationId: string) => {
    const organizationRefundOrders = orders.filter(order => {
      const orderOrgId = order.organization_id || '미지정';
      const status = order.shipping_status;
      return orderOrgId === organizationId && status === '취소요청';
    });

    if (organizationRefundOrders.length === 0) {
      toast.error('해당 조직의 취소요청 상태 주문이 없습니다.');
      return;
    }

    try {
      const now = getCurrentTimeUTC();

      const updatedOrders = organizationRefundOrders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        organization_id: order.organization_id,
        option_name: order.option_name,
        shipping_status: order.shipping_status,
        quantity: order.quantity,
        seller_supply_price: order.seller_supply_price,
        settlement_amount: order.settlement_amount,
        payment_confirmed_at: order.payment_confirmed_at,
        confirmed_at: order.confirmed_at,
        refund_processed_at: now,
        created_at: order.created_at,
        sheet_date: order.sheet_date
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updatedOrders }),
      });

      const result = await response.json();

      if (result.success) {
        // 로컬 상태 업데이트 - orders 업데이트
        setOrders(prev => prev.map(order => {
          const organizationRefundOrder = organizationRefundOrders.find(o => o.id === order.id);
          if (organizationRefundOrder) {
            return { ...order, refund_processed_at: now };
          }
          return order;
        }));

        // organizationStats 업데이트
        const formattedDateTime = new Date(now).toISOString().slice(0, 16).replace('T', ' ');
        setOrganizationStats(prev =>
          prev.map(stat =>
            stat.organization_id === organizationId
              ? { ...stat, 환불처리일시: formattedDateTime }
              : stat
          )
        );

        // total stat도 업데이트
        setTimeout(() => {
          const updatedOrders = orders.map(order => {
            const organizationRefundOrder = organizationRefundOrders.find(o => o.id === order.id);
            if (organizationRefundOrder) {
              return { ...order, refund_processed_at: now };
            }
            return order;
          });
          calculateOrganizationStats(updatedOrders);
        }, 0);

        toast.success(`${result.count}건의 주문에 대해 환불처리가 완료되었습니다.`);
      } else {
        toast.error('환불처리 실패: ' + result.error);
      }
    } catch (error) {
      console.error('환불처리 오류:', error);
      toast.error('환불처리 중 오류가 발생했습니다.');
    }
  };

  // 취소승인: 취소요청 → 취소완료
  const handleCancelApprove = async (orderId: number) => {
    try {
      const now = getCurrentTimeUTC();
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedOrder = {
        id: order.id,
        order_number: order.order_number,
        seller_id: order.seller_id,
        option_name: order.option_name,
        shipping_status: '취소완료',
        quantity: order.quantity,
        seller_supply_price: order.seller_supply_price,
        settlement_amount: order.settlement_amount,
        payment_confirmed_at: order.payment_confirmed_at,
        confirmed_at: order.confirmed_at,
        cancel_requested_at: order.cancel_requested_at,
        canceled_at: now,  // 취소승인 일시 추가
        refund_processed_at: order.refund_processed_at,
        created_at: order.created_at,
        sheet_date: order.sheet_date
      };

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: [updatedOrder] }),
      });

      const result = await response.json();

      if (result.success) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, shipping_status: '취소완료', canceled_at: now } : o
        ));

        setTimeout(() => {
          const updatedOrders = orders.map(o =>
            o.id === orderId ? { ...o, shipping_status: '취소완료', canceled_at: now } : o
          );
          calculateOrganizationStats(updatedOrders);
        }, 0);

        toast.success('취소가 승인되었습니다.');
      } else {
        toast.error('취소승인 실패: ' + result.error);
      }
    } catch (error) {
      console.error('취소승인 오류:', error);
      toast.error('취소승인 중 오류가 발생했습니다.');
    }
  };

  // 취소반려: 취소요청 → 상품준비중
  const handleCancelReject = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedOrder = {
        id: order.id,
        order_number: order.order_number,
        seller_id: order.seller_id,
        option_name: order.option_name,
        shipping_status: '상품준비중',
        quantity: order.quantity,
        seller_supply_price: order.seller_supply_price,
        settlement_amount: order.settlement_amount,
        payment_confirmed_at: order.payment_confirmed_at,
        confirmed_at: order.confirmed_at,
        refund_processed_at: order.refund_processed_at,
        created_at: order.created_at,
        sheet_date: order.sheet_date
      };

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: [updatedOrder] }),
      });

      const result = await response.json();

      if (result.success) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, shipping_status: '상품준비중' } : o
        ));

        setTimeout(() => {
          const updatedOrders = orders.map(o =>
            o.id === orderId ? { ...o, shipping_status: '상품준비중' } : o
          );
          calculateOrganizationStats(updatedOrders);
        }, 0);

        toast.success('취소가 반려되었습니다. 상품준비중 상태로 변경되었습니다.');
      } else {
        toast.error('취소반려 실패: ' + result.error);
      }
    } catch (error) {
      console.error('취소반려 오류:', error);
      toast.error('취소반려 중 오류가 발생했습니다.');
    }
  };

  const handleSingleRefundComplete = async (orderId: number) => {
    try {
      const now = getCurrentTimeUTC();
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedOrder = {
        id: order.id,
        order_number: order.order_number,
        seller_id: order.seller_id,
        option_name: order.option_name,
        shipping_status: '환불완료',  // 상태를 refunded로 변경
        quantity: order.quantity,
        seller_supply_price: order.seller_supply_price,
        settlement_amount: order.settlement_amount,
        payment_confirmed_at: order.payment_confirmed_at,
        confirmed_at: order.confirmed_at,
        refund_processed_at: now,
        created_at: order.created_at,
        sheet_date: order.sheet_date
      };

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: [updatedOrder] }),
      });

      const result = await response.json();

      if (result.success) {
        // 로컬 상태 업데이트 - orders 업데이트
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, shipping_status: '환불완료', refund_processed_at: now } : o
        ));

        // organizationStats 재계산
        setTimeout(() => {
          const updatedOrders = orders.map(o =>
            o.id === orderId ? { ...o, shipping_status: '환불완료', refund_processed_at: now } : o
          );
          calculateOrganizationStats(updatedOrders);
        }, 0);

        toast.success('환불처리가 완료되었습니다.');
      } else {
        toast.error('환불처리 실패: ' + result.error);
      }
    } catch (error) {
      console.error('환불처리 오류:', error);
      toast.error('환불처리 중 오류가 발생했습니다.');
    }
  };

  const getStatusColor = (status?: string) => {
    if (status === '발주서등록' || status === '접수' || status === '발주서확정') return 'bg-purple-100 text-purple-800';
    if (status === '결제완료') return 'bg-blue-100 text-blue-800';
    if (status === '상품준비중') return 'bg-yellow-100 text-yellow-800';
    if (status === '발송완료') return 'bg-green-100 text-green-800';
    if (status === '취소요청') return 'bg-orange-100 text-orange-800';
    if (status === '취소완료') return 'bg-gray-100 text-gray-800';
    if (status === '환불완료') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // 관리자 UI 전용: 상태 표시명 변환
  const getStatusDisplayName = (status?: string) => {
    if (status === '발주서등록') return '업로드';
    if (status === '환불완료') return '환불완료';
    return status || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    const organizationId = order.organization_id || '미지정';
    if (selectedOrganization && organizationId !== selectedOrganization) return false;

    const status = order.shipping_status;
    if (filterStatus !== 'all' && status !== filterStatus) return false;

    if (filterPayment !== 'all') {
      const hasPayment = !!order.payment_confirmed_at;
      if (filterPayment === 'confirmed' && !hasPayment) return false;
      if (filterPayment === 'pending' && hasPayment) return false;
    }

    if (filterRefund !== 'all') {
      const hasRefund = !!order.refund_processed_at;
      if (filterRefund === 'processed' && !hasRefund) return false;
      if (filterRefund === 'pending' && hasRefund) return false;
    }

    // 날짜 필터 (created_at을 한국 시간으로 변환하여 날짜 비교)
    if (startDate || endDate) {
      const createdDate = new Date(order.created_at);
      // 한국 시간으로 변환하여 YYYY-MM-DD 형식으로
      const koreaDateStr = createdDate.toLocaleString('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).split(',')[0]; // "2025-10-16" 형식

      if (startDate && koreaDateStr < startDate) return false;
      if (endDate && koreaDateStr > endDate) return false;
    }

    // 검색어 필터 (주문번호, 옵션상품, 조직명)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const organizationName = organizationNames.get(organizationId)?.toLowerCase() || '';
      const orderNumber = (order.order_number || '').toLowerCase();
      const optionName = (order.option_name || '').toLowerCase();

      if (!organizationName.includes(query) && !orderNumber.includes(query) && !optionName.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // 필터된 주문으로 통계 재계산
  const filteredStats = (() => {
    const statsMap = new Map<string, OrganizationStats>();

    filteredOrders.forEach((order) => {
      const organizationId = order.organization_id || '미지정';
      if (!statsMap.has(organizationId)) {
        // organizationStats에서 배치 정보 가져오기 (실행자 정보 포함)
        const originalStat = organizationStats.find(s => s.organization_id === organizationId);
        statsMap.set(organizationId, {
          organization_id: organizationId,
          organization_name: organizationNames.get(organizationId) || organizationId,
          총금액: originalStat?.총금액 || 0, // organizationStats에서 계산된 총금액 사용
          입금확인: false,
          업로드_건수: 0,
          업로드_수량: 0,
          발주서확정_건수: 0,
          발주서확정_수량: 0,
          결제완료_건수: 0,
          결제완료_수량: 0,
          상품준비중_건수: 0,
          상품준비중_수량: 0,
          발송완료_건수: 0,
          발송완료_수량: 0,
          취소요청_건수: 0,
          취소요청_수량: 0,
          취소완료_건수: 0,
          취소완료_수량: 0,
          환불예정액: 0,
          환불완료_건수: 0,
          환불완료_수량: 0,
          환불완료액: 0,
          발주확정_배치: originalStat?.발주확정_배치 || undefined, // 배치 정보 복사 (실행자 정보 보존)
        });
      }

      const stats = statsMap.get(organizationId)!;
      const status = order.shipping_status;
      if (!status) return; // shipping_status가 없으면 통계에서 제외
      const quantity = Number(order.quantity) || 0;
      const settlementAmount = Number(order.settlement_amount) || 0;
      // 최종입금액 (발주확정 시 저장된 값, 없으면 정산금액 사용)
      const finalAmount = Number(order.final_payment_amount) || settlementAmount;

      // 총금액은 배치 기준으로 계산하므로 여기서는 계산하지 않음 (444번 라인에서 계산)

      if (order.payment_confirmed_at) {
        stats.입금확인 = true;
      }

      if (order.refund_processed_at && !stats.환불처리일시) {
        const date = new Date(order.refund_processed_at);
        // DB에 한국 시간으로 저장되어 있으므로 UTC로 파싱
        stats.환불처리일시 = date.toISOString().slice(0, 16).replace('T', ' ');
      }

      if (status === '발주서등록' || status === '접수') {
        stats.업로드_건수 += 1;
        stats.업로드_수량 += quantity;
      } else if (status === '발주서확정') {
        stats.발주서확정_건수 += 1;
        stats.발주서확정_수량 += quantity;
      } else if (status === '결제완료') {
        stats.결제완료_건수 += 1;
        stats.결제완료_수량 += quantity;
      } else if (status === '상품준비중') {
        stats.상품준비중_건수 += 1;
        stats.상품준비중_수량 += quantity;
      } else if (status === '발송완료') {
        stats.발송완료_건수 += 1;
        stats.발송완료_수량 += quantity;
      } else if (status === '취소요청') {
        stats.취소요청_건수 += 1;
        stats.취소요청_수량 += quantity;
        stats.환불예정액 += settlementAmount;
      } else if (status === '취소완료') {
        if (order.refund_processed_at) {
          // 환불처리까지 완료된 건
          stats.환불완료_건수 += 1;
          stats.환불완료_수량 += quantity;
          stats.환불완료액 += settlementAmount;
        } else {
          // 취소승인만 된 건 (환불 대기중)
          stats.취소완료_건수 += 1;
          stats.취소완료_수량 += quantity;
          stats.환불예정액 += settlementAmount;
        }
      } else if (status === '환불완료') {
        // 환불완료 상태
        stats.환불완료_건수 += 1;
        stats.환불완료_수량 += quantity;
        stats.환불완료액 += settlementAmount;
      }
    });

    const statsArray = Array.from(statsMap.values());

    // 🔧 발주확정 배치 정보는 organizationStats에서 이미 계산됨 (실행자 정보 포함)
    // filteredStats에서는 배치를 재계산하지 않고, organizationStats의 배치 정보를 그대로 사용
    // (이미 위에서 복사했으므로 추가 처리 불필요)

    statsArray.sort((a, b) => (b.업로드_건수 + b.발주서확정_건수 + b.결제완료_건수 + b.상품준비중_건수 + b.발송완료_건수 + b.취소요청_건수 + b.취소완료_건수 + b.환불완료_건수) - (a.업로드_건수 + a.발주서확정_건수 + a.결제완료_건수 + a.상품준비중_건수 + a.발송완료_건수 + a.취소요청_건수 + a.취소완료_건수 + a.환불완료_건수));

    const totalStats: OrganizationStats = {
      organization_id: 'total',
      organization_name: '합계',
      총금액: statsArray.reduce((sum, s) => sum + s.총금액, 0),
      입금확인: false,
      업로드_건수: statsArray.reduce((sum, s) => sum + s.업로드_건수, 0),
      업로드_수량: statsArray.reduce((sum, s) => sum + s.업로드_수량, 0),
      발주서확정_건수: statsArray.reduce((sum, s) => sum + s.발주서확정_건수, 0),
      발주서확정_수량: statsArray.reduce((sum, s) => sum + s.발주서확정_수량, 0),
      결제완료_건수: statsArray.reduce((sum, s) => sum + s.결제완료_건수, 0),
      결제완료_수량: statsArray.reduce((sum, s) => sum + s.결제완료_수량, 0),
      상품준비중_건수: statsArray.reduce((sum, s) => sum + s.상품준비중_건수, 0),
      상품준비중_수량: statsArray.reduce((sum, s) => sum + s.상품준비중_수량, 0),
      발송완료_건수: statsArray.reduce((sum, s) => sum + s.발송완료_건수, 0),
      발송완료_수량: statsArray.reduce((sum, s) => sum + s.발송완료_수량, 0),
      취소요청_건수: statsArray.reduce((sum, s) => sum + s.취소요청_건수, 0),
      취소요청_수량: statsArray.reduce((sum, s) => sum + s.취소요청_수량, 0),
      취소완료_건수: statsArray.reduce((sum, s) => sum + s.취소완료_건수, 0),
      취소완료_수량: statsArray.reduce((sum, s) => sum + s.취소완료_수량, 0),
      환불예정액: statsArray.reduce((sum, s) => sum + s.환불예정액, 0),
      환불완료_건수: statsArray.reduce((sum, s) => sum + s.환불완료_건수, 0),
      환불완료_수량: statsArray.reduce((sum, s) => sum + s.환불완료_수량, 0),
      환불완료액: statsArray.reduce((sum, s) => sum + s.환불완료액, 0),
    };

    statsArray.unshift(totalStats);
    return statsArray;
  })();

  // 조직별로 주문 그룹화
  const getOrganizationOrders = (organizationId: string) => {
    return filteredOrders.filter(order => (order.organization_id || '미지정') === organizationId);
  };

  // 상태별로 배치 생성 (confirmed_at, payment_confirmed_at, shipped_date 등 기준으로 그룹화)
  const groupOrdersByStatus = (orders: Order[], status: string): StatusBatch[] => {
    const batchMap = new Map<string, Order[]>();

    orders.filter(order => order.shipping_status === status).forEach(order => {
      let timestamp = '';

      // 상태별로 적절한 타임스탬프 선택
      if (status === '결제완료' || status === '상품준비중') {
        timestamp = order.payment_confirmed_at || order.confirmed_at || order.created_at;
      } else if (status === '발송완료') {
        timestamp = order.shipped_date || order.created_at;
      } else if (status === '취소요청') {
        timestamp = order.cancel_requested_at || order.created_at;
      } else if (status === '취소완료') {
        timestamp = order.canceled_at || order.created_at;
      } else if (status === '환불완료') {
        timestamp = order.refund_processed_at || order.created_at;
      } else {
        timestamp = order.created_at;
      }

      if (!timestamp) return;

      // 시간 단위로 그룹화 (분까지만)
      const batchKey = timestamp.slice(0, 16); // YYYY-MM-DDTHH:mm

      if (!batchMap.has(batchKey)) {
        batchMap.set(batchKey, []);
      }
      batchMap.get(batchKey)!.push(order);
    });

    // StatusBatch 배열로 변환
    const batches: StatusBatch[] = [];
    batchMap.forEach((orders, timestamp) => {
      const 총금액 = orders.reduce((sum, order) => sum + Number(order.settlement_amount || 0), 0);
      batches.push({
        status,
        timestamp,
        주문건수: orders.length,
        총금액,
        orders
      });
    });

    // 최신순 정렬
    return batches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const toggleOrganization = (organizationId: string) => {
    const newExpanded = new Set(expandedOrganizations);
    if (newExpanded.has(organizationId)) {
      newExpanded.delete(organizationId);
    } else {
      newExpanded.add(organizationId);
    }
    setExpandedOrganizations(newExpanded);
  };

  const toggleBatch = (batchId: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedBatches(newExpanded);
  };

  const totalStat = filteredStats.find(s => s.organization_id === 'total');
  const organizationList = filteredStats.filter(s => s.organization_id !== 'total');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="w-full space-y-0">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">플랫폼주문 관리</h1>
            <p className="mt-1 text-sm text-gray-600">셀러별 주문 현황 및 입금환불 관리</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white border-b border-gray-200 mb-4">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('주문관리')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === '주문관리'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              주문관리
            </button>
            <button
              onClick={() => setActiveTab('셀러별정산내역')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === '셀러별정산내역'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              셀러별 정산내역
            </button>
            <button
              onClick={() => setActiveTab('셀러랭킹')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === '셀러랭킹'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🏆 셀러 랭킹
            </button>
          </div>
        </div>

        {/* 주문관리 탭 컨텐츠 */}
        {activeTab === '주문관리' && (
          <>
        {/* 날짜 필터 및 검색 필터 */}
        <div className="bg-white border border-gray-200 p-4 mb-4 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 날짜 필터 */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">시작일:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[180px]">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">종료일:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 빠른 날짜 선택 버튼 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDateRange(7)}
                className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded transition-colors"
              >
                7일
              </button>
              <button
                onClick={() => setDateRange(30)}
                className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded transition-colors"
              >
                30일
              </button>
              <button
                onClick={() => setDateRange('thisMonth')}
                className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded transition-colors"
              >
                이번달
              </button>
            </div>

            {/* 검색 필터 */}
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="셀러명, 주문번호, 옵션상품 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 필터 초기화 버튼 */}
            {(startDate || endDate || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 rounded transition-colors"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* 필터 요약 */}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
            <span>전체 주문: {orders.length}건</span>
            <span className="text-blue-600 font-medium">필터된 주문: {filteredOrders.length}건</span>
          </div>
        </div>

        {/* 헤더 아코디언 (컬럼명) */}
        <div className="bg-gray-100 border-b border-gray-300">
          <div className="grid grid-cols-14 gap-4 px-6 py-3 text-xs font-semibold text-gray-700 uppercase">
            <div className="col-span-2"></div>
            <div className="col-span-1 text-center">업로드</div>
            <div className="col-span-1 text-center">발주서확정</div>
            <div className="col-span-1 text-center">최종입금액</div>
            <div className="col-span-1 text-center">입금확인</div>
            <div className="col-span-1 text-center">결제완료</div>
            <div className="col-span-1 text-center">상품준비중</div>
            <div className="col-span-1 text-center">발송완료</div>
            <div className="col-span-1 text-center">취소요청</div>
            <div className="col-span-1 text-center">취소완료</div>
            <div className="col-span-1 text-center">환불완료</div>
            <div className="col-span-1 text-center">환불액</div>
            <div className="col-span-1 text-center">처리</div>
          </div>
        </div>

        {/* 합계 아코디언 */}
        {totalStat && (
          <div className="bg-gray-100 border-b border-gray-200">
            <button
              onClick={() => setTotalExpanded(!totalExpanded)}
              className="w-full px-4 py-1.5 hover:bg-gray-200 transition-colors"
            >
              <div className="grid grid-cols-14 gap-2 items-center">
                <div className="col-span-2 flex items-center gap-2 font-bold text-gray-900">
                  {totalExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  합계
                </div>
                <div className="col-span-1 text-center font-semibold text-purple-700">
                  {totalStat.업로드_건수 > 0 ? totalStat.업로드_건수 : '-'}
                </div>
                <div className="col-span-1 text-center font-semibold text-indigo-700">
                  {totalStat.발주서확정_건수 > 0 ? totalStat.발주서확정_건수 : '-'}
                </div>
                <div className="col-span-1 text-center font-bold text-blue-600">
                  {totalStat.총금액 > 0 ? `${totalStat.총금액.toLocaleString()}원` : '-'}
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-1 text-center font-semibold text-blue-700">
                  {totalStat.결제완료_건수 > 0 ? totalStat.결제완료_건수 : '-'}
                </div>
                <div className="col-span-1 text-center font-semibold text-yellow-600">
                  {totalStat.상품준비중_건수 > 0 ? totalStat.상품준비중_건수 : '-'}
                </div>
                <div className="col-span-1 text-center font-semibold text-green-600">
                  {totalStat.발송완료_건수 > 0 ? totalStat.발송완료_건수 : '-'}
                </div>
                <div className="col-span-1 text-center font-semibold text-orange-600">
                  {totalStat.취소요청_건수 > 0 ? totalStat.취소요청_건수 : '-'}
                </div>
                <div className="col-span-1 text-center font-semibold text-gray-600">
                  {totalStat.취소완료_건수 > 0 ? totalStat.취소완료_건수 : '-'}
                </div>
                <div className="col-span-1 text-center font-bold text-emerald-600">
                  {totalStat.환불완료_건수 > 0 ? `${totalStat.환불완료_건수}건` : '-'}
                </div>
                <div className="col-span-1 text-center font-bold text-red-600">
                  {totalStat.환불예정액 > 0 ? `${totalStat.환불예정액.toLocaleString()}원` : '-'}
                </div>
                <div className="col-span-1"></div>
              </div>
            </button>

            {totalExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 max-h-[600px] overflow-y-auto">
                <div className="text-sm text-gray-600">전체 주문 통계</div>
              </div>
            )}
          </div>
        )}

        {/* 조직별 아코디언 */}
        {organizationList.map((stat) => {
          const isExpanded = expandedOrganizations.has(stat.organization_id);
          const organizationOrders = getOrganizationOrders(stat.organization_id);

          return (
            <div key={stat.organization_id} className="bg-white border-b border-gray-200">
              <button
                onClick={() => toggleOrganization(stat.organization_id)}
                className="w-full px-4 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-14 gap-2 items-center">
                  <div className="col-span-2 flex items-center gap-2 font-semibold text-gray-900 text-left pl-8">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {stat.organization_name}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-purple-700">
                    {stat.업로드_건수 > 0 ? stat.업로드_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-indigo-700">
                    {stat.발주서확정_건수 > 0 ? stat.발주서확정_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-blue-600">
                    {stat.총금액?.toLocaleString() || 0}원
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {stat.발주확정_배치 && stat.발주확정_배치.length > 0 ? (
                      (() => {
                        const pendingBatches = stat.발주확정_배치.filter(b => !b.입금확인).length;
                        const confirmedBatches = stat.발주확정_배치.filter(b => b.입금확인).length;
                        return (
                          <span
                            className="text-xs font-medium cursor-help"
                            title={`입금 대기: ${pendingBatches}개 | 입금 완료: ${confirmedBatches}개 (클릭하여 배치 확인)`}
                          >
                            <span className="text-orange-600">{pendingBatches}</span>
                            {confirmedBatches > 0 && (
                              <span className="text-cyan-600"> / {confirmedBatches}</span>
                            )}
                            <span className="text-gray-500"> 배치</span>
                          </span>
                        );
                      })()
                    ) : stat.결제완료_건수 > 0 ? (
                      <div
                        className="w-11 h-6 rounded-full relative opacity-50 cursor-not-allowed"
                        style={{ backgroundColor: '#0891B2' }}
                        title="발주서확정 상태의 주문만 입금확인 가능"
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                          style={{ left: '22px' }}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-blue-700">
                    {stat.결제완료_건수 > 0 ? stat.결제완료_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-yellow-600">
                    {stat.상품준비중_건수 > 0 ? stat.상품준비중_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-green-600">
                    {stat.발송완료_건수 > 0 ? stat.발송완료_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-orange-600">
                    {stat.취소요청_건수 > 0 ? stat.취소요청_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-gray-600">
                    {stat.취소완료_건수 > 0 ? stat.취소완료_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-emerald-600">
                    {stat.환불완료_건수 > 0 ? `${stat.환불완료_건수}건` : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-red-600">
                    {stat.환불예정액 > 0 ? `${stat.환불예정액.toLocaleString()}원` : '-'}
                  </div>
                  <div className="col-span-1"></div>
                </div>
              </button>

              {isExpanded && (
                <div className="bg-gray-50">
                  {/* 발주확정 배치 정보 */}
                  {stat.발주확정_배치 && stat.발주확정_배치.length > 0 && (
                    <div className="pl-8 pr-4 py-3">
                      <div className="space-y-3 bg-white p-3">
                        {stat.발주확정_배치.map((batch, idx) => {
                          // 해당 배치의 주문만 필터링
                          const batchOrders = organizationOrders.filter(order => order.confirmed_at === batch.confirmed_at);
                          const batchId = `${stat.organization_id}-${batch.confirmed_at}`;
                          const isBatchExpanded = expandedBatches.has(batchId);

                          return (
                            <div key={`${batch.confirmed_at}-${batch.실행자_ID}-${idx}`} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                              {/* 배치 헤더 */}
                              <div
                                className="flex items-center justify-between p-3 rounded-lg hover:shadow-md transition-shadow"
                                style={{
                                  backgroundColor: batch.입금확인 ? '#f0fdfa' : '#f9fafb'
                                }}
                              >
                                <div
                                  onClick={() => toggleBatch(batchId)}
                                  className="flex items-center gap-4 flex-1 cursor-pointer"
                                >
                                  <div className="text-xs text-gray-500">배치 {idx + 1}</div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {formatDateTimeForDisplay(batch.confirmed_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {batch.주문건수 > 0 ? `${batch.주문건수}건` : '입금완료'}
                                  </div>
                                  <div className="text-sm font-semibold text-blue-600">
                                    {batch.총금액.toLocaleString()} - {batch.캐시사용금액.toLocaleString()} = {(batch.총금액 - batch.캐시사용금액).toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    ({batch.입금자명 || '입금자명 없음'})
                                  </div>
                                  <div className="text-xs text-gray-500" style={{ color: '#666' }}>
                                    실행자: {batch.실행자_이름 || '미지정'} {batch.실행자_전화번호 ? `(${batch.실행자_전화번호})` : ''}
                                  </div>
                                  {batch.입금확인 && (
                                    <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full font-medium">
                                      입금확인 완료
                                    </span>
                                  )}
                                </div>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePaymentCheckToggle(stat.organization_id, batch.confirmed_at);
                                  }}
                                  className="w-11 h-6 rounded-full cursor-pointer relative transition-colors flex-shrink-0"
                                  style={{ backgroundColor: batch.입금확인 ? '#0891B2' : '#D1D5DB' }}
                                  title={batch.입금확인 ? '클릭하여 입금확인 취소' : '클릭하여 입금확인'}
                                >
                                  <div
                                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                                    style={{ left: batch.입금확인 ? '22px' : '2px' }}
                                  />
                                </div>
                              </div>

                              {/* 배치별 주문 테이블 */}
                              {isBatchExpanded && batchOrders.length > 0 && (
                                <div className="mt-3">
                                  <table className="w-full seller-detail-table">
                                    <thead className="bg-gray-100">
                                      <tr className="text-gray-600" style={{ height: '24px' }}>
                                        <th className="px-1 py-0 text-center font-medium text-xs">주문번호</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs">벤더사</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs">옵션상품</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs">수량</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs">금액</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs">상태</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: '180px' }}>발주확정</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: '180px' }}>취소요청</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: '180px' }}>취소승인</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: '180px' }}>환불완료</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs">환불액</th>
                                        <th className="px-1 py-0 text-center font-medium text-xs">관리자처리</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {batchOrders.map((order) => {
                                        const status = order.shipping_status;
                                        const refundAmount = (status === '환불완료')
                                          ? Number(order.settlement_amount || 0)
                                          : 0;

                                        return (
                                          <tr key={order.id} className="hover:bg-white transition-colors">
                                            <td className="px-2 py-0.5 text-xs text-gray-900">{order.order_number || '-'}</td>
                                            <td className="px-2 py-0.5 text-xs text-gray-900">{order.vendor_name || '-'}</td>
                                            <td className="px-2 py-0.5 text-xs text-gray-900">{order.option_name}</td>
                                            <td className="px-2 py-0.5 text-center text-xs text-gray-900">{order.quantity}</td>
                                            <td className="px-2 py-0.5 text-right text-xs text-gray-900">
                                              {Number(order.settlement_amount || 0).toLocaleString()}원
                                            </td>
                                            <td className="px-2 py-0.5 text-center">
                                              <span className={`px-1.5 py-0 text-xs ${getStatusColor(status)}`}>
                                                {getStatusDisplayName(status)}
                                              </span>
                                            </td>
                                            <td className="px-1 py-0.5 text-center text-gray-600 text-xs" style={{ width: '180px' }}>
                                              {order.confirmed_at
                                                ? formatDateTimeForDisplay(order.confirmed_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')
                                                : '-'}
                                            </td>
                                            <td className="px-1 py-0.5 text-center text-gray-600 text-xs" style={{ width: '180px' }}>
                                              {order.cancel_requested_at
                                                ? formatDateTimeForDisplay(order.cancel_requested_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')
                                                : '-'}
                                            </td>
                                            <td className="px-1 py-0.5 text-center text-gray-600 text-xs" style={{ width: '180px' }}>
                                              {order.canceled_at
                                                ? formatDateTimeForDisplay(order.canceled_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')
                                                : '-'}
                                            </td>
                                            <td className="px-1 py-0.5 text-center text-gray-600 text-xs" style={{ width: '180px' }}>
                                              {order.refund_processed_at
                                                ? formatDateTimeForDisplay(order.refund_processed_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')
                                                : '-'}
                                            </td>
                                            <td className="px-2 py-0.5 text-right text-xs text-gray-900">
                                              {refundAmount > 0 ? `${refundAmount.toLocaleString()}원` : '-'}
                                            </td>
                                            <td className="px-2 py-0.5 text-center">
                                              {status === '환불완료' ? (
                                                <span className="text-emerald-600 font-medium text-xs">환불완료</span>
                                              ) : status === '취소요청' ? (
                                                <div className="flex gap-1 justify-center">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleCancelApprove(order.id);
                                                    }}
                                                    className="px-1.5 py-0.5 text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded"
                                                  >
                                                    승인
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleCancelReject(order.id);
                                                    }}
                                                    className="px-1.5 py-0.5 text-xs bg-gray-500 text-white hover:bg-gray-600 transition-colors rounded"
                                                  >
                                                    반려
                                                  </button>
                                                </div>
                                              ) : status === '취소완료' ? (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSingleRefundComplete(order.id);
                                                  }}
                                                  className="px-1.5 py-0.5 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors rounded"
                                                >
                                                  환불완료
                                                </button>
                                              ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 다른 상태별 세부 내역 (배치 구조 없이) */}
                  {['결제완료', '상품준비중', '발송완료', '취소요청', '취소완료', '환불완료'].map(status => {
                    const statusOrders = organizationOrders.filter(order => order.shipping_status === status);
                    if (statusOrders.length === 0) return null;

                    const statusColors: Record<string, string> = {
                      '결제완료': 'bg-blue-50',
                      '상품준비중': 'bg-yellow-50',
                      '발송완료': 'bg-green-50',
                      '취소요청': 'bg-orange-50',
                      '취소완료': 'bg-gray-50',
                      '환불완료': 'bg-red-50'
                    };

                    return (
                      <div key={status} className="pl-8 pr-4 py-3">
                        <div className={`text-sm font-semibold text-gray-700 mb-2 p-2 rounded ${statusColors[status]}`}>
                          {status} ({statusOrders.length}건)
                        </div>
                        <div className="bg-white p-3">
                          <table className="w-full seller-detail-table">
                            <thead className="bg-gray-100">
                              <tr className="text-gray-600" style={{ height: '24px' }}>
                                <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: (status === '취소완료' || status === '환불완료') ? '10%' : '12%' }}>주문번호</th>
                                <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: (status === '취소완료' || status === '환불완료') ? '8%' : '10%' }}>벤더사</th>
                                <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: (status === '취소완료' || status === '환불완료') ? '15%' : '30%' }}>옵션상품</th>
                                <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: (status === '취소완료' || status === '환불완료') ? '6%' : '8%' }}>수량</th>
                                <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: (status === '취소완료' || status === '환불완료') ? '10%' : '12%' }}>
                                  {status === '취소완료' ? '환불예정금액' : status === '환불완료' ? '환불완료금액' : '금액'}
                                </th>
                                {(status === '취소완료' || status === '환불완료') && (
                                  <>
                                    <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: '8%' }}>
                                      {status === '취소완료' ? '환불예정캐시' : '환불완료캐시'}
                                    </th>
                                    <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: '18%' }}>환불계좌</th>
                                  </>
                                )}
                                <th className="px-1 py-0 text-center font-medium text-xs" style={{ width: '5%' }}>상태</th>
                                {status === '취소요청' && (
                                  <th className="px-1 py-0 text-center font-medium text-xs">작업</th>
                                )}
                                {status === '취소완료' && (
                                  <th className="px-1 py-0 text-center font-medium text-xs">작업</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {statusOrders.map((order) => {
                                return (
                                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-2 py-0.5 text-xs text-gray-900">{order.order_number || '-'}</td>
                                    <td className="px-2 py-0.5 text-xs text-gray-900">{order.vendor_name || '-'}</td>
                                    <td className="px-2 py-0.5 text-xs text-gray-900">{order.option_name}</td>
                                    <td className="px-2 py-0.5 text-center text-xs text-gray-900">{order.quantity}</td>
                                    <td className={`px-2 py-0.5 text-right text-xs ${(status === '취소완료' || status === '환불완료') ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                                      {Number(order.final_deposit_amount || 0).toLocaleString()}원
                                    </td>
                                    {(status === '취소완료' || status === '환불완료') && (
                                      <>
                                        <td className="px-2 py-0.5 text-right text-xs text-orange-600 font-semibold">
                                          {Number(order.cash_used || 0).toLocaleString()}캐시
                                        </td>
                                        <td className="px-2 py-0.5 text-xs text-gray-700">
                                          {order.bank_name || order.bank_account || order.account_holder ? (
                                            <span>
                                              {order.bank_name || '-'} {order.bank_account || '-'} ({order.account_holder || '-'})
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">정보 없음</span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                    <td className="px-2 py-0.5 text-center">
                                      <span className={`px-1.5 py-0 text-xs ${getStatusColor(order.shipping_status)}`}>
                                        {getStatusDisplayName(order.shipping_status)}
                                      </span>
                                    </td>
                                    {status === '취소요청' && (
                                    <td className="px-2 py-0.5 text-center">
                                      <div className="flex gap-1 justify-center">
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!confirm('취소를 승인하시겠습니까?')) return;

                                            try {
                                              const response = await fetch('/api/integrated-orders/bulk', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  orders: [{
                                                    id: order.id,
                                                    shipping_status: '취소완료',
                                                    canceled_at: new Date().toISOString()
                                                  }]
                                                }),
                                              });

                                              const result = await response.json();
                                              if (result.success) {
                                                toast.success('취소가 승인되었습니다.');
                                                // 로컬 상태 업데이트
                                                setOrders(prev => prev.map(o =>
                                                  o.id === order.id
                                                    ? { ...o, shipping_status: '취소완료', canceled_at: new Date().toISOString() }
                                                    : o
                                                ));
                                              } else {
                                                toast.error('처리 실패: ' + result.error);
                                              }
                                            } catch (error) {
                                              console.error('취소 승인 오류:', error);
                                              toast.error('처리 중 오류가 발생했습니다.');
                                            }
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded"
                                        >
                                          승인
                                        </button>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!confirm('취소를 반려하시겠습니까? 주문이 상품준비중 상태로 변경됩니다.')) return;

                                            try {
                                              const response = await fetch('/api/integrated-orders/bulk', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  orders: [{
                                                    id: order.id,
                                                    shipping_status: '상품준비중'
                                                  }]
                                                }),
                                              });

                                              const result = await response.json();
                                              if (result.success) {
                                                toast.success('취소가 반려되었습니다. 상품준비중으로 변경되었습니다.');
                                                // 로컬 상태 업데이트
                                                setOrders(prev => prev.map(o =>
                                                  o.id === order.id
                                                    ? { ...o, shipping_status: '상품준비중' }
                                                    : o
                                                ));
                                              } else {
                                                toast.error('처리 실패: ' + result.error);
                                              }
                                            } catch (error) {
                                              console.error('취소 반려 오류:', error);
                                              toast.error('처리 중 오류가 발생했습니다.');
                                            }
                                          }}
                                          className="px-2 py-1 text-xs bg-gray-500 text-white hover:bg-gray-600 transition-colors rounded"
                                        >
                                          반려
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                  {status === '취소완료' && (
                                    <td className="px-2 py-0.5 text-center">
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (!confirm('환불을 완료 처리하시겠습니까?')) return;

                                          try {
                                            // 1. 캐시 환불 (사용한 캐시가 있는 경우)
                                            const cashUsed = Number(order.cash_used || 0);
                                            if (cashUsed > 0 && order.organization_id) {
                                              const cashRefundResponse = await fetch('/api/cash/refund', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  organizationId: order.organization_id,
                                                  amount: cashUsed,
                                                  orderId: order.id,
                                                  orderNumber: order.order_number,
                                                }),
                                              });

                                              const cashRefundResult = await cashRefundResponse.json();
                                              if (!cashRefundResult.success) {
                                                toast.error('캐시 환불 실패: ' + cashRefundResult.error);
                                                return;
                                              }
                                            }

                                            // 2. 환불 정산 데이터 저장
                                            const settlementResponse = await fetch('/api/refund-settlements', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                orderId: order.id
                                              }),
                                            });

                                            const settlementResult = await settlementResponse.json();
                                            if (!settlementResult.success) {
                                              toast.error('정산 데이터 저장 실패: ' + settlementResult.error);
                                              return;
                                            }

                                            // 3. 주문 상태 업데이트
                                            const response = await fetch('/api/integrated-orders/bulk', {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                orders: [{
                                                  id: order.id,
                                                  shipping_status: '환불완료',
                                                  refund_processed_at: new Date().toISOString()
                                                }]
                                              }),
                                            });

                                            const result = await response.json();
                                            if (result.success) {
                                              const successMsg = cashUsed > 0
                                                ? `환불이 완료되었습니다. (캐시 ${cashUsed.toLocaleString()} 환불 포함)`
                                                : '환불이 완료되었습니다.';
                                              toast.success(successMsg);
                                              // 로컬 상태 업데이트
                                              setOrders(prev => prev.map(o =>
                                                o.id === order.id
                                                  ? { ...o, shipping_status: '환불완료', refund_processed_at: new Date().toISOString() }
                                                  : o
                                              ));
                                            } else {
                                              toast.error('처리 실패: ' + result.error);
                                            }
                                          } catch (error) {
                                            console.error('환불완료 처리 오류:', error);
                                            toast.error('처리 중 오류가 발생했습니다.');
                                          }
                                        }}
                                        className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors rounded"
                                      >
                                        환불완료
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </>
    )}

        {/* 조직별 정산내역 탭 컨텐츠 */}
        {activeTab === '조직별정산내역' && (
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <AdminSettlementTab integratedOrders={orders} organizationNames={organizationNames} />
          </div>
        )}

        {/* 조직 랭킹 탭 컨텐츠 */}
        {activeTab === '조직랭킹' && (
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <AdminRankingTab />
          </div>
        )}
      </div>
    </div>
  );
}
