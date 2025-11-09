'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Search, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { getCurrentTimeUTC, formatDateTimeForDisplay } from '@/lib/date';
import AdminSettlementTab from './components/AdminSettlementTab';
import AdminRankingTab from './components/AdminRankingTab';

interface Order {
  id: number;
  order_number?: string;
  seller_id?: string;
  vendor_name?: string;
  option_name: string;
  shipping_status?: string;
  quantity: string;
  seller_supply_price?: string;
  settlement_amount?: string;
  final_payment_amount?: string;
  payment_confirmed_at?: string;
  confirmed_at?: string;
  cancel_requested_at?: string;
  canceled_at?: string;
  refund_processed_at?: string;
  created_at: string;
  sheet_date: string;
}

interface ConfirmedBatch {
  confirmed_at: string;
  총금액: number;
  주문건수: number;
  입금확인: boolean;
}

interface SellerStats {
  seller_id: string;
  seller_name: string;
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
}

export default function OrderPlatformPage() {
  const [activeTab, setActiveTab] = useState<'주문관리' | '셀러별정산내역' | '셀러랭킹'>('주문관리');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerStatsExpanded, setSellerStatsExpanded] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterRefund, setFilterRefund] = useState<string>('all');
  const [sellerNames, setSellerNames] = useState<Map<string, string>>(new Map());
  const [expandedSellers, setExpandedSellers] = useState<Set<string>>(new Set());
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

  const [startDate, setStartDate] = useState<string>(get30DaysAgoDate());
  const [endDate, setEndDate] = useState<string>(getTodayDate());
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
    try {
      setLoading(true);
      // onlyWithSeller=true로 seller_id가 있는 주문만 DB에서 필터링
      // limit을 10000으로 설정하여 충분한 데이터 가져오기
      const response = await fetch('/api/integrated-orders?onlyWithSeller=true&limit=10000');
      const result = await response.json();

      if (result.success) {
        const sellerOrders = result.data || [];

        // 셀러 ID 수집
        const sellerIds = [...new Set(sellerOrders.map((o: Order) => o.seller_id).filter(Boolean))];

        // 셀러 정보 조회 (users 테이블에서 company_name 가져오기)
        let nameMap = new Map<string, string>();
        if (sellerIds.length > 0) {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          const { data: users, error } = await supabase
            .from('users')
            .select('id, company_name, name')
            .in('id', sellerIds);

          if (!error && users) {
            users.forEach((user: any) => {
              const displayName = user.company_name || user.name || user.id;
              nameMap.set(user.id, displayName);
            });
            setSellerNames(nameMap);
          }
        }

        setOrders(sellerOrders);
        calculateSellerStats(sellerOrders, nameMap);
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
  }, []);

  const calculateSellerStats = (orderData: Order[], nameMap?: Map<string, string>) => {
    const statsMap = new Map<string, SellerStats>();
    const names = nameMap || sellerNames;

    orderData.forEach((order) => {
      const sellerId = order.seller_id || '미지정';
      if (!statsMap.has(sellerId)) {
        statsMap.set(sellerId, {
          seller_id: sellerId,
          seller_name: names.get(sellerId) || sellerId,
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

      const stats = statsMap.get(sellerId)!;
      const status = order.shipping_status;
      if (!status) return; // shipping_status가 없으면 통계에서 제외
      const quantity = Number(order.quantity) || 0;
      const settlementAmount = Number(order.settlement_amount) || 0;
      // 최종입금액 (발주확정 시 저장된 값, 없으면 정산금액 사용)
      const finalAmount = Number(order.final_payment_amount) || settlementAmount;

      // 발주서확정 상태의 주문만 총금액에 합산 (입금확인 대상 금액)
      if (status === '발주서확정') {
        stats.총금액 += finalAmount;
      }

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
    statsArray.forEach(stat => {
      // 발주서확정 + 결제완료 상태의 주문 모두 확인 (confirmed_at이 있는 것만)
      const sellerOrdersWithConfirmedAt = orderData.filter(order =>
        (order.seller_id || '미지정') === stat.seller_id &&
        (order.shipping_status === '발주서확정' || order.shipping_status === '결제완료') &&
        order.confirmed_at
      );

      if (sellerOrdersWithConfirmedAt.length > 0) {
        // confirmed_at별로 그룹화
        const batchMap = new Map<string, ConfirmedBatch>();

        sellerOrdersWithConfirmedAt.forEach(order => {
          const confirmedAt = order.confirmed_at!;
          const finalAmount = Number(order.final_payment_amount) || Number(order.settlement_amount) || 0;
          const isPaymentConfirmed = order.shipping_status === '결제완료';

          if (!batchMap.has(confirmedAt)) {
            batchMap.set(confirmedAt, {
              confirmed_at: confirmedAt,
              총금액: 0,
              주문건수: 0,
              입금확인: false
            });
          }

          const batch = batchMap.get(confirmedAt)!;

          // 금액은 발주서확정 + 결제완료 모두 포함 (입금확인 취소 시 표시용)
          batch.총금액 += finalAmount;

          // 건수는 발주서확정 상태만 포함 (입금 대기중인 건수)
          if (order.shipping_status === '발주서확정') {
            batch.주문건수 += 1;
          }
        });

        // 각 배치의 입금확인 상태 계산
        batchMap.forEach((batch, confirmedAt) => {
          const batchOrders = sellerOrdersWithConfirmedAt.filter(o => o.confirmed_at === confirmedAt);
          const allPaymentConfirmed = batchOrders.every(o => o.shipping_status === '결제완료');
          batch.입금확인 = allPaymentConfirmed;
        });

        // 발주서확정 상태의 주문이 있는 배치만 포함
        const batches = Array.from(batchMap.values()).filter(b => b.주문건수 > 0);

        if (batches.length > 0) {
          stat.발주확정_배치 = batches.sort((a, b) =>
            new Date(b.confirmed_at).getTime() - new Date(a.confirmed_at).getTime()
          );
        }
      }
    });

    statsArray.sort((a, b) => (b.업로드_건수 + b.발주서확정_건수 + b.결제완료_건수 + b.상품준비중_건수 + b.발송완료_건수 + b.취소요청_건수 + b.취소완료_건수 + b.환불완료_건수) - (a.업로드_건수 + a.발주서확정_건수 + a.결제완료_건수 + a.상품준비중_건수 + a.발송완료_건수 + a.취소요청_건수 + a.취소완료_건수 + a.환불완료_건수));

    // 합계 계산
    const totalStats: SellerStats = {
      seller_id: 'total',
      seller_name: '합계',
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

    setSellerStats(statsArray);
  };

  const handlePaymentCheckToggle = async (sellerId: string, confirmedAt?: string) => {
    const currentStat = sellerStats.find(s => s.seller_id === sellerId);
    if (!currentStat) return;

    // 실제 orders 데이터에서 배치의 현재 상태 확인
    let currentBatchIsConfirmed = false;
    if (confirmedAt) {
      const batchOrders = orders.filter(order =>
        (order.seller_id || '미지정') === sellerId &&
        order.confirmed_at === confirmedAt
      );
      // 해당 배치의 모든 주문이 결제완료 상태면 입금확인 완료 상태
      currentBatchIsConfirmed = batchOrders.length > 0 && batchOrders.every(o => o.shipping_status === '결제완료');
    }

    // 토글: 현재 입금확인 완료 상태면 취소(false), 아니면 확인(true)
    const newCheckState = confirmedAt
      ? !currentBatchIsConfirmed
      : !currentStat.입금확인;

    if (newCheckState) {
      const sellerOrders = orders.filter(order => {
        const orderSellerId = order.seller_id || '미지정';
        const status = order.shipping_status;
        const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
        return orderSellerId === sellerId && status === '발주서확정' && matchesBatch;
      });

      if (sellerOrders.length === 0) {
        toast.error('해당 셀러의 발주서확정 상태 주문이 없습니다.');
        return;
      }

      try {
        const now = getCurrentTimeUTC();

        const updatedOrders = sellerOrders.map(order => ({
          id: order.id,
          order_number: order.order_number,
          seller_id: order.seller_id,
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
            if (order.seller_id === sellerId && order.shipping_status === '발주서확정' && matchesBatch) {
              return { ...order, shipping_status: '결제완료', payment_confirmed_at: now };
            }
            return order;
          }));

          // sellerStats 업데이트 (배치별 입금확인 상태 업데이트)
          setSellerStats(prev =>
            prev.map(stat => {
              if (stat.seller_id === sellerId) {
                if (confirmedAt && stat.발주확정_배치) {
                  // 특정 배치의 입금확인 상태 업데이트
                  const updatedBatches = stat.발주확정_배치.map(batch =>
                    batch.confirmed_at === confirmedAt
                      ? { ...batch, 입금확인: true }
                      : batch
                  );
                  // 모든 배치가 입금확인되었는지 체크
                  const allConfirmed = updatedBatches.every(b => b.입금확인);
                  return { ...stat, 발주확정_배치: updatedBatches, 입금확인: allConfirmed };
                } else {
                  // 전체 입금확인
                  return { ...stat, 입금확인: true };
                }
              }
              return stat;
            })
          );

          // total stat도 업데이트
          setTimeout(() => {
            const updatedOrders = orders.map(order => {
              const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
              if (order.seller_id === sellerId && order.shipping_status === '발주서확정' && matchesBatch) {
                return { ...order, shipping_status: '결제완료', payment_confirmed_at: now };
              }
              return order;
            });
            calculateSellerStats(updatedOrders);
          }, 0);

          const batchInfo = confirmedAt ? ` (${formatDateTimeForDisplay(confirmedAt).slice(0, 16)} 배치)` : '';
          toast.success(`${result.count}건의 주문이 결제완료로 변경되었습니다.${batchInfo}`);
        } else {
          toast.error('상태 변경 실패: ' + result.error);
        }
      } catch (error) {
        console.error('입금확인 처리 오류:', error);
        toast.error('입금확인 처리 중 오류가 발생했습니다.');
      }
    } else {
      const sellerOrders = orders.filter(order => {
        const orderSellerId = order.seller_id || '미지정';
        const status = order.shipping_status;
        const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
        return orderSellerId === sellerId && status === '결제완료' && matchesBatch;
      });

      if (sellerOrders.length === 0) {
        toast.error('해당 셀러의 결제완료 상태 주문이 없습니다.');
        return;
      }

      try {
        const updatedOrders = sellerOrders.map(order => ({
          id: order.id,
          order_number: order.order_number,
          seller_id: order.seller_id,
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
            if (order.seller_id === sellerId && order.shipping_status === '결제완료' && matchesBatch) {
              return { ...order, shipping_status: '발주서확정', payment_confirmed_at: null };
            }
            return order;
          }));

          // sellerStats 업데이트 (배치별 입금확인 상태 업데이트)
          setSellerStats(prev =>
            prev.map(stat => {
              if (stat.seller_id === sellerId) {
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
          setTimeout(() => {
            const updatedOrders = orders.map(order => {
              const matchesBatch = confirmedAt ? order.confirmed_at === confirmedAt : true;
              if (order.seller_id === sellerId && order.shipping_status === '결제완료' && matchesBatch) {
                return { ...order, shipping_status: '발주서확정', payment_confirmed_at: null };
              }
              return order;
            });
            calculateSellerStats(updatedOrders);
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

  const handleRefundComplete = async (sellerId: string) => {
    const sellerRefundOrders = orders.filter(order => {
      const orderSellerId = order.seller_id || '미지정';
      const status = order.shipping_status;
      return orderSellerId === sellerId && status === '취소요청';
    });

    if (sellerRefundOrders.length === 0) {
      toast.error('해당 셀러의 취소요청 상태 주문이 없습니다.');
      return;
    }

    try {
      const now = getCurrentTimeUTC();

      const updatedOrders = sellerRefundOrders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        seller_id: order.seller_id,
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
          const sellerRefundOrder = sellerRefundOrders.find(o => o.id === order.id);
          if (sellerRefundOrder) {
            return { ...order, refund_processed_at: now };
          }
          return order;
        }));

        // sellerStats 업데이트
        const formattedDateTime = new Date(now).toISOString().slice(0, 16).replace('T', ' ');
        setSellerStats(prev =>
          prev.map(stat =>
            stat.seller_id === sellerId
              ? { ...stat, 환불처리일시: formattedDateTime }
              : stat
          )
        );

        // total stat도 업데이트
        setTimeout(() => {
          const updatedOrders = orders.map(order => {
            const sellerRefundOrder = sellerRefundOrders.find(o => o.id === order.id);
            if (sellerRefundOrder) {
              return { ...order, refund_processed_at: now };
            }
            return order;
          });
          calculateSellerStats(updatedOrders);
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
          calculateSellerStats(updatedOrders);
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
          calculateSellerStats(updatedOrders);
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

        // sellerStats 재계산
        setTimeout(() => {
          const updatedOrders = orders.map(o =>
            o.id === orderId ? { ...o, shipping_status: '환불완료', refund_processed_at: now } : o
          );
          calculateSellerStats(updatedOrders);
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
    const sellerId = order.seller_id || '미지정';
    if (selectedSeller && sellerId !== selectedSeller) return false;

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

    // 검색어 필터 (주문번호, 옵션상품, 셀러명)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const sellerName = sellerNames.get(sellerId)?.toLowerCase() || '';
      const orderNumber = (order.order_number || '').toLowerCase();
      const optionName = (order.option_name || '').toLowerCase();

      if (!sellerName.includes(query) && !orderNumber.includes(query) && !optionName.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // 필터된 주문으로 통계 재계산
  const filteredStats = (() => {
    const statsMap = new Map<string, SellerStats>();

    filteredOrders.forEach((order) => {
      const sellerId = order.seller_id || '미지정';
      if (!statsMap.has(sellerId)) {
        statsMap.set(sellerId, {
          seller_id: sellerId,
          seller_name: sellerNames.get(sellerId) || sellerId,
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

      const stats = statsMap.get(sellerId)!;
      const status = order.shipping_status;
      if (!status) return; // shipping_status가 없으면 통계에서 제외
      const quantity = Number(order.quantity) || 0;
      const settlementAmount = Number(order.settlement_amount) || 0;
      // 최종입금액 (발주확정 시 저장된 값, 없으면 정산금액 사용)
      const finalAmount = Number(order.final_payment_amount) || settlementAmount;

      // 발주서확정 상태의 주문만 총금액에 합산 (입금확인 대상 금액)
      if (status === '발주서확정') {
        stats.총금액 += finalAmount;
      }

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
    statsArray.forEach(stat => {
      // 발주서확정 + 결제완료 상태의 주문 모두 확인 (confirmed_at이 있는 것만)
      const sellerOrdersWithConfirmedAt = filteredOrders.filter(order =>
        (order.seller_id || '미지정') === stat.seller_id &&
        (order.shipping_status === '발주서확정' || order.shipping_status === '결제완료') &&
        order.confirmed_at
      );

      if (sellerOrdersWithConfirmedAt.length > 0) {
        // confirmed_at별로 그룹화
        const batchMap = new Map<string, ConfirmedBatch>();

        sellerOrdersWithConfirmedAt.forEach(order => {
          const confirmedAt = order.confirmed_at!;
          const finalAmount = Number(order.final_payment_amount) || Number(order.settlement_amount) || 0;
          const isPaymentConfirmed = order.shipping_status === '결제완료';

          if (!batchMap.has(confirmedAt)) {
            batchMap.set(confirmedAt, {
              confirmed_at: confirmedAt,
              총금액: 0,
              주문건수: 0,
              입금확인: false
            });
          }

          const batch = batchMap.get(confirmedAt)!;

          // 금액은 발주서확정 + 결제완료 모두 포함 (입금확인 취소 시 표시용)
          batch.총금액 += finalAmount;

          // 건수는 발주서확정 상태만 포함 (입금 대기중인 건수)
          if (order.shipping_status === '발주서확정') {
            batch.주문건수 += 1;
          }
        });

        // 각 배치의 입금확인 상태 계산
        batchMap.forEach((batch, confirmedAt) => {
          const batchOrders = sellerOrdersWithConfirmedAt.filter(o => o.confirmed_at === confirmedAt);
          const allPaymentConfirmed = batchOrders.every(o => o.shipping_status === '결제완료');
          batch.입금확인 = allPaymentConfirmed;
        });

        // 발주서확정 상태의 주문이 있는 배치만 포함 (입금확인 완료된 배치도 표시)
        const batches = Array.from(batchMap.values()).filter(b => b.주문건수 > 0 || b.입금확인);

        if (batches.length > 0) {
          stat.발주확정_배치 = batches.sort((a, b) =>
            new Date(b.confirmed_at).getTime() - new Date(a.confirmed_at).getTime()
          );
        }
      }
    });

    statsArray.sort((a, b) => (b.업로드_건수 + b.발주서확정_건수 + b.결제완료_건수 + b.상품준비중_건수 + b.발송완료_건수 + b.취소요청_건수 + b.취소완료_건수 + b.환불완료_건수) - (a.업로드_건수 + a.발주서확정_건수 + a.결제완료_건수 + a.상품준비중_건수 + a.발송완료_건수 + a.취소요청_건수 + a.취소완료_건수 + a.환불완료_건수));

    const totalStats: SellerStats = {
      seller_id: 'total',
      seller_name: '합계',
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

  // 셀러별로 주문 그룹화
  const getSellerOrders = (sellerId: string) => {
    return filteredOrders.filter(order => (order.seller_id || '미지정') === sellerId);
  };

  const toggleSeller = (sellerId: string) => {
    const newExpanded = new Set(expandedSellers);
    if (newExpanded.has(sellerId)) {
      newExpanded.delete(sellerId);
    } else {
      newExpanded.add(sellerId);
    }
    setExpandedSellers(newExpanded);
  };

  const totalStat = filteredStats.find(s => s.seller_id === 'total');
  const sellerList = filteredStats.filter(s => s.seller_id !== 'total');

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
          <div className="bg-gray-100 border-b border-gray-300">
            <button
              onClick={() => setTotalExpanded(!totalExpanded)}
              className="w-full px-6 py-4 hover:bg-gray-200 transition-colors"
            >
              <div className="grid grid-cols-14 gap-4 items-center">
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

        {/* 셀러별 아코디언 */}
        {sellerList.map((stat) => {
          const isExpanded = expandedSellers.has(stat.seller_id);
          const sellerOrders = getSellerOrders(stat.seller_id);

          return (
            <div key={stat.seller_id} className="bg-white border border-gray-200">
              <button
                onClick={() => toggleSeller(stat.seller_id)}
                className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-14 gap-4 items-center">
                  <div className="col-span-2 flex items-center gap-2 font-semibold text-gray-900 text-left pl-8">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {stat.seller_name}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-purple-700">
                    {stat.업로드_건수 > 0 ? stat.업로드_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-indigo-700">
                    {stat.발주서확정_건수 > 0 ? stat.발주서확정_건수 : '-'}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-blue-600">
                    {stat.총금액 > 0 ? `${stat.총금액.toLocaleString()}원` : '-'}
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
                <div className="border-t border-gray-200 bg-gray-50">
                  {/* 발주확정 배치 정보 */}
                  {stat.발주확정_배치 && stat.발주확정_배치.length > 0 && (
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">발주확정 배치 (입금확인 대상)</h4>
                      <div className="space-y-2">
                        {stat.발주확정_배치.map((batch, idx) => (
                          <div
                            key={batch.confirmed_at}
                            className="flex items-center justify-between p-3 rounded-lg border"
                            style={{
                              backgroundColor: batch.입금확인 ? '#f0fdfa' : '#ffffff',
                              borderColor: batch.입금확인 ? '#5eead4' : '#bfdbfe'
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-xs text-gray-500">배치 {idx + 1}</div>
                              <div className="text-sm font-medium text-gray-700">
                                {formatDateTimeForDisplay(batch.confirmed_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')}
                              </div>
                              <div className="text-sm text-gray-600">
                                {batch.주문건수 > 0 ? `${batch.주문건수}건` : '입금완료'}
                              </div>
                              <div className="text-sm font-semibold text-blue-600">
                                {batch.총금액.toLocaleString()}원
                              </div>
                              {batch.입금확인 && (
                                <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full font-medium">
                                  입금확인 완료
                                </span>
                              )}
                            </div>
                            <div>
                              <div
                                onClick={() => handlePaymentCheckToggle(stat.seller_id, batch.confirmed_at)}
                                className="w-11 h-6 rounded-full cursor-pointer relative transition-colors"
                                style={{ backgroundColor: batch.입금확인 ? '#0891B2' : '#D1D5DB' }}
                                title={batch.입금확인 ? '클릭하여 입금확인 취소' : '클릭하여 입금확인'}
                              >
                                <div
                                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                                  style={{ left: batch.입금확인 ? '22px' : '2px' }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full seller-detail-table">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr className="text-gray-600">
                          <th className="px-4 py-2 text-center font-medium">주문번호</th>
                          <th className="px-4 py-2 text-center font-medium">벤더사</th>
                          <th className="px-4 py-2 text-center font-medium">옵션상품</th>
                          <th className="px-4 py-2 text-center font-medium">수량</th>
                          <th className="px-4 py-2 text-center font-medium">금액</th>
                          <th className="px-4 py-2 text-center font-medium">상태</th>
                          <th className="px-2 py-2 text-center font-medium" style={{ width: '180px' }}>발주확정</th>
                          <th className="px-2 py-2 text-center font-medium" style={{ width: '180px' }}>취소요청</th>
                          <th className="px-2 py-2 text-center font-medium" style={{ width: '180px' }}>취소승인</th>
                          <th className="px-2 py-2 text-center font-medium" style={{ width: '180px' }}>환불완료</th>
                          <th className="px-4 py-2 text-center font-medium">환불액</th>
                          <th className="px-4 py-2 text-center font-medium">관리자처리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sellerOrders.slice(0, 30).map((order) => {
                          const status = order.shipping_status;
                          // refunded 상태인 경우에만 환불액 표시
                          const refundAmount = (status === '환불완료')
                            ? Number(order.settlement_amount || 0)
                            : 0;

                          return (
                            <tr key={order.id} className="hover:bg-white transition-colors">
                              <td className="px-4 py-3 text-gray-900">{order.order_number || '-'}</td>
                              <td className="px-4 py-3 text-gray-900">{order.vendor_name || '-'}</td>
                              <td className="px-4 py-3 text-gray-900">{order.option_name}</td>
                              <td className="px-4 py-3 text-center text-gray-900">{order.quantity}</td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                {Number(order.settlement_amount || 0).toLocaleString()}원
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 ${getStatusColor(status)}`}>
                                  {getStatusDisplayName(status)}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-center text-gray-600" style={{ width: '180px', fontSize: '12px' }}>
                                {order.confirmed_at
                                  ? formatDateTimeForDisplay(order.confirmed_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')
                                  : '-'}
                              </td>
                              <td className="px-2 py-3 text-center text-gray-600" style={{ width: '180px', fontSize: '12px' }}>
                                {order.cancel_requested_at
                                  ? formatDateTimeForDisplay(order.cancel_requested_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')
                                  : '-'}
                              </td>
                              <td className="px-2 py-3 text-center text-gray-600" style={{ width: '180px', fontSize: '12px' }}>
                                {order.canceled_at
                                  ? formatDateTimeForDisplay(order.canceled_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')
                                  : '-'}
                              </td>
                              <td className="px-2 py-3 text-center text-gray-600" style={{ width: '180px', fontSize: '12px' }}>
                                {order.refund_processed_at
                                  ? formatDateTimeForDisplay(order.refund_processed_at).replace('. ', '-').replace('. ', '-').replace('. ', ' ')
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-right text-red-600 font-medium">
                                {refundAmount > 0 ? `${refundAmount.toLocaleString()}원` : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {status === '환불완료' ? (
                                  <span className="text-emerald-600 font-medium">환불완료</span>
                                ) : status === '취소요청' ? (
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelApprove(order.id);
                                      }}
                                      className="px-2 py-1 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded"
                                    >
                                      취소승인
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelReject(order.id);
                                      }}
                                      className="px-2 py-1 bg-gray-500 text-white hover:bg-gray-600 transition-colors rounded"
                                    >
                                      취소반려
                                    </button>
                                  </div>
                                ) : status === '취소완료' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSingleRefundComplete(order.id);
                                    }}
                                    className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 transition-colors rounded"
                                  >
                                    환불완료
                                  </button>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {sellerOrders.length > 30 && (
                      <div className="px-4 py-3 bg-gray-100 text-center text-xs text-gray-600">
                        총 {sellerOrders.length}건 중 30건 표시
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </>
    )}

        {/* 셀러별 정산내역 탭 컨텐츠 */}
        {activeTab === '셀러별정산내역' && (
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <AdminSettlementTab integratedOrders={orders} sellerNames={sellerNames} />
          </div>
        )}

        {/* 셀러 랭킹 탭 컨텐츠 */}
        {activeTab === '셀러랭킹' && (
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <AdminRankingTab />
          </div>
        )}
      </div>
    </div>
  );
}
