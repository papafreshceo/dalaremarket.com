'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Order {
  id: number;
  order_number?: string;
  seller_id?: string;
  option_name: string;
  shipping_status?: string;
  quantity: string;
  seller_supply_price?: string;
  settlement_amount?: string;
  payment_confirmed_at?: string;
  order_confirmed_at?: string;
  refund_processed_at?: string;
  created_at: string;
  sheet_date: string;
}

interface SellerStats {
  seller_id: string;
  seller_name: string;
  총금액: number;
  입금확인: boolean;
  접수_건수: number;
  접수_수량: number;
  결제완료_건수: number;
  결제완료_수량: number;
  상품준비중_건수: number;
  상품준비중_수량: number;
  발송완료_건수: number;
  발송완료_수량: number;
  취소요청_건수: number;
  취소요청_수량: number;
  환불예정액: number;
  환불처리일시: string | null;
  취소완료_건수: number;
  취소완료_수량: number;
}

export default function OrderPlatformPage() {
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // onlyWithSeller=true로 seller_id가 있는 주문만 DB에서 필터링
      // limit을 10000으로 설정하여 충분한 데이터 가져오기
      const response = await fetch('/api/integrated-orders?onlyWithSeller=true&limit=10000');
      const result = await response.json();

      if (result.success) {
        const sellerOrders = result.data || [];
        console.log('📊 셀러 주문:', sellerOrders.length);

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
              console.log(`Seller mapping: ${user.id} => ${displayName}`);
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
          접수_건수: 0,
          접수_수량: 0,
          결제완료_건수: 0,
          결제완료_수량: 0,
          상품준비중_건수: 0,
          상품준비중_수량: 0,
          발송완료_건수: 0,
          발송완료_수량: 0,
          취소요청_건수: 0,
          취소요청_수량: 0,
          환불예정액: 0,
          환불처리일시: null,
          취소완료_건수: 0,
          취소완료_수량: 0,
        });
      }

      const stats = statsMap.get(sellerId)!;
      const status = order.shipping_status || '결제완료';
      const quantity = Number(order.quantity) || 0;
      const settlementAmount = Number(order.settlement_amount) || 0;

      // 모든 주문의 금액을 총금액에 합산
      stats.총금액 += settlementAmount;

      if (order.payment_confirmed_at) {
        stats.입금확인 = true;
      }

      if (order.refund_processed_at && !stats.환불처리일시) {
        const date = new Date(order.refund_processed_at);
        stats.환불처리일시 = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }

      if (status === '접수' || status === '입금확인전') {
        stats.접수_건수 += 1;
        stats.접수_수량 += quantity;
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
        stats.취소완료_건수 += 1;
        stats.취소완료_수량 += quantity;
      }
    });

    const statsArray = Array.from(statsMap.values());
    statsArray.sort((a, b) => (b.접수_건수 + b.결제완료_건수 + b.상품준비중_건수 + b.발송완료_건수 + b.취소요청_건수 + b.취소완료_건수) - (a.접수_건수 + a.결제완료_건수 + a.상품준비중_건수 + a.발송완료_건수 + a.취소요청_건수 + a.취소완료_건수));

    // 합계 계산
    const totalStats: SellerStats = {
      seller_id: 'total',
      seller_name: '합계',
      총금액: statsArray.reduce((sum, s) => sum + s.총금액, 0),
      입금확인: false,
      접수_건수: statsArray.reduce((sum, s) => sum + s.접수_건수, 0),
      접수_수량: statsArray.reduce((sum, s) => sum + s.접수_수량, 0),
      결제완료_건수: statsArray.reduce((sum, s) => sum + s.결제완료_건수, 0),
      결제완료_수량: statsArray.reduce((sum, s) => sum + s.결제완료_수량, 0),
      상품준비중_건수: statsArray.reduce((sum, s) => sum + s.상품준비중_건수, 0),
      상품준비중_수량: statsArray.reduce((sum, s) => sum + s.상품준비중_수량, 0),
      발송완료_건수: statsArray.reduce((sum, s) => sum + s.발송완료_건수, 0),
      발송완료_수량: statsArray.reduce((sum, s) => sum + s.발송완료_수량, 0),
      취소요청_건수: statsArray.reduce((sum, s) => sum + s.취소요청_건수, 0),
      취소요청_수량: statsArray.reduce((sum, s) => sum + s.취소요청_수량, 0),
      환불예정액: statsArray.reduce((sum, s) => sum + s.환불예정액, 0),
      환불처리일시: null,
      취소완료_건수: statsArray.reduce((sum, s) => sum + s.취소완료_건수, 0),
      취소완료_수량: statsArray.reduce((sum, s) => sum + s.취소완료_수량, 0),
    };

    // 합계를 맨 앞에 추가
    statsArray.unshift(totalStats);

    setSellerStats(statsArray);
  };

  const handlePaymentCheckToggle = async (sellerId: string) => {
    const currentStat = sellerStats.find(s => s.seller_id === sellerId);
    if (!currentStat) return;

    const newCheckState = !currentStat.입금확인;

    if (newCheckState) {
      const sellerOrders = orders.filter(order => {
        const orderSellerId = order.seller_id || '미지정';
        const status = order.shipping_status || '결제완료';
        return orderSellerId === sellerId && status === '접수';
      });

      if (sellerOrders.length === 0) {
        toast.error('해당 셀러의 접수 상태 주문이 없습니다.');
        return;
      }

      try {
        const now = new Date().toISOString();

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
          order_confirmed_at: order.order_confirmed_at,
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
            if (order.seller_id === sellerId && order.shipping_status === '접수') {
              return { ...order, shipping_status: '결제완료', payment_confirmed_at: now };
            }
            return order;
          }));

          // sellerStats 업데이트
          setSellerStats(prev =>
            prev.map(stat =>
              stat.seller_id === sellerId
                ? { ...stat, 입금확인: true }
                : stat
            )
          );

          // total stat도 업데이트
          setTimeout(() => {
            const updatedOrders = orders.map(order => {
              if (order.seller_id === sellerId && order.shipping_status === '접수') {
                return { ...order, shipping_status: '결제완료', payment_confirmed_at: now };
              }
              return order;
            });
            calculateSellerStats(updatedOrders);
          }, 0);

          toast.success(`${result.count}건의 주문이 결제완료로 변경되었습니다.`);
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
        const status = order.shipping_status || '결제완료';
        return orderSellerId === sellerId && status === '결제완료';
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
          shipping_status: '접수',
          quantity: order.quantity,
          seller_supply_price: order.seller_supply_price,
          settlement_amount: order.settlement_amount,
          payment_confirmed_at: null,
          order_confirmed_at: order.order_confirmed_at,
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
            if (order.seller_id === sellerId && order.shipping_status === '결제완료') {
              return { ...order, shipping_status: '접수', payment_confirmed_at: null };
            }
            return order;
          }));

          // sellerStats 업데이트
          setSellerStats(prev =>
            prev.map(stat =>
              stat.seller_id === sellerId
                ? { ...stat, 입금확인: false }
                : stat
            )
          );

          // total stat도 업데이트
          setTimeout(() => {
            const updatedOrders = orders.map(order => {
              if (order.seller_id === sellerId && order.shipping_status === '결제완료') {
                return { ...order, shipping_status: '접수', payment_confirmed_at: null };
              }
              return order;
            });
            calculateSellerStats(updatedOrders);
          }, 0);

          toast.success(`${result.count}건의 주문이 접수로 변경되었습니다.`);
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
      const status = order.shipping_status || '결제완료';
      return orderSellerId === sellerId && status === '취소요청';
    });

    if (sellerRefundOrders.length === 0) {
      toast.error('해당 셀러의 취소요청 상태 주문이 없습니다.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const formattedDateTime = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

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
        order_confirmed_at: order.order_confirmed_at,
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

  const handleSingleRefundComplete = async (orderId: number) => {
    try {
      const now = new Date().toISOString();
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedOrder = {
        id: order.id,
        order_number: order.order_number,
        seller_id: order.seller_id,
        option_name: order.option_name,
        shipping_status: order.shipping_status,
        quantity: order.quantity,
        seller_supply_price: order.seller_supply_price,
        settlement_amount: order.settlement_amount,
        payment_confirmed_at: order.payment_confirmed_at,
        order_confirmed_at: order.order_confirmed_at,
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
          o.id === orderId ? { ...o, refund_processed_at: now } : o
        ));

        // sellerStats 재계산
        setTimeout(() => {
          const updatedOrders = orders.map(o =>
            o.id === orderId ? { ...o, refund_processed_at: now } : o
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
    if (status === '접수') return 'bg-purple-100 text-purple-800';
    if (status === '결제완료') return 'bg-blue-100 text-blue-800';
    if (status === '상품준비중') return 'bg-yellow-100 text-yellow-800';
    if (status === '발송완료') return 'bg-green-100 text-green-800';
    if (status === '취소요청') return 'bg-orange-100 text-orange-800';
    if (status === '취소완료') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
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

    const status = order.shipping_status || '결제완료';
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

    return true;
  });

  // 셀러별로 주문 그룹화
  const getSellerOrders = (sellerId: string) => {
    return orders.filter(order => (order.seller_id || '미지정') === sellerId);
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

  const totalStat = sellerStats.find(s => s.seller_id === 'total');
  const sellerList = sellerStats.filter(s => s.seller_id !== 'total');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-0">
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

        {/* 헤더 아코디언 (컬럼명) */}
        <div className="bg-gray-100 border-b border-gray-300">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-700 uppercase">
            <div className="col-span-2"></div>
            <div className="col-span-1 text-center">금액</div>
            <div className="col-span-1 text-center">입금확인</div>
            <div className="col-span-1 text-center">접수</div>
            <div className="col-span-1 text-center">결제완료</div>
            <div className="col-span-1 text-center">상품준비중</div>
            <div className="col-span-1 text-center">발송완료</div>
            <div className="col-span-1 text-center">취소요청</div>
            <div className="col-span-1 text-center">취소완료</div>
            <div className="col-span-1 text-center">환불예정액</div>
            <div className="col-span-1 text-center">환불완료</div>
          </div>
        </div>

        {/* 합계 아코디언 */}
        {totalStat && (
          <div className="bg-gray-100 border-b border-gray-300">
            <button
              onClick={() => setTotalExpanded(!totalExpanded)}
              className="w-full px-6 py-4 hover:bg-gray-200 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2 flex items-center gap-2 font-bold text-gray-900">
                  {totalExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  합계
                </div>
                <div className="col-span-1 text-center font-bold text-blue-600">
                  {totalStat.총금액 > 0 ? `${totalStat.총금액.toLocaleString()}원` : '-'}
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-1 text-center font-semibold text-purple-700">
                  {totalStat.접수_건수 > 0 ? totalStat.접수_건수 : '-'}
                </div>
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
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2 flex items-center gap-2 font-semibold text-gray-900 text-left">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {stat.seller_name}
                  </div>
                  <div className="col-span-1 text-center font-semibold text-blue-600">
                    {stat.총금액 > 0 ? `${stat.총금액.toLocaleString()}원` : '-'}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaymentCheckToggle(stat.seller_id);
                      }}
                      className="w-11 h-6 rounded-full cursor-pointer relative transition-colors"
                      style={{ backgroundColor: stat.입금확인 ? '#0891B2' : '#D1D5DB' }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                        style={{ left: stat.입금확인 ? '22px' : '2px' }}
                      />
                    </div>
                  </div>
                  <div className="col-span-1 text-center font-semibold text-purple-700">
                    {stat.접수_건수 > 0 ? stat.접수_건수 : '-'}
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
                  <div className="col-span-1 text-center font-semibold text-red-600">
                    {stat.환불예정액 > 0 ? `${stat.환불예정액.toLocaleString()}원` : '-'}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {stat.환불처리일시 ? (
                      <span className="text-xs text-emerald-600 font-medium">완료</span>
                    ) : stat.취소요청_건수 > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefundComplete(stat.seller_id);
                        }}
                        className="text-xs px-3 py-1 bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        환불완료
                      </button>
                    ) : null}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr className="text-xs text-gray-600">
                          <th className="px-4 py-2 text-center font-medium">주문번호</th>
                          <th className="px-4 py-2 text-center font-medium">옵션명</th>
                          <th className="px-4 py-2 text-center font-medium">수량</th>
                          <th className="px-4 py-2 text-center font-medium">금액</th>
                          <th className="px-4 py-2 text-center font-medium">상태</th>
                          <th className="px-4 py-2 text-center font-medium">접수일시</th>
                          <th className="px-4 py-2 text-center font-medium">발주확정일시</th>
                          <th className="px-4 py-2 text-center font-medium">환불예정금액</th>
                          <th className="px-4 py-2 text-center font-medium">환불완료</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sellerOrders.slice(0, 30).map((order) => {
                          const status = order.shipping_status || '결제완료';
                          const refundAmount = status === '취소요청' ? Number(order.settlement_amount || 0) : 0;

                          return (
                            <tr key={order.id} className="hover:bg-white transition-colors">
                              <td className="px-4 py-3 text-gray-900">{order.order_number || '-'}</td>
                              <td className="px-4 py-3 text-gray-900">{order.option_name}</td>
                              <td className="px-4 py-3 text-center text-gray-900">{order.quantity}</td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                {Number(order.settlement_amount || 0).toLocaleString()}원
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 text-xs ${getStatusColor(status)}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600 text-xs">
                                {order.payment_confirmed_at
                                  ? new Date(order.payment_confirmed_at).toLocaleString('ko-KR', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false
                                    }).replace(/\. /g, '-').replace('.', '').replace(' ', ' ')
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600 text-xs">
                                {order.order_confirmed_at
                                  ? new Date(order.order_confirmed_at).toLocaleString('ko-KR', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false
                                    }).replace(/\. /g, '-').replace('.', '').replace(' ', ' ')
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-right text-red-600 font-medium">
                                {refundAmount > 0 ? `${refundAmount.toLocaleString()}원` : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {order.refund_processed_at ? (
                                  <span className="text-xs text-emerald-600 font-medium">완료</span>
                                ) : status === '취소요청' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSingleRefundComplete(order.id);
                                    }}
                                    className="text-xs px-3 py-1 bg-red-600 text-white hover:bg-red-700 transition-colors rounded"
                                  >
                                    환불완료
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
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
      </div>
    </div>
  );
}
