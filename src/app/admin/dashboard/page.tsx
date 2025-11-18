'use client';

/**
 * 관리자 대시보드 페이지
 *
 * 플랫폼 전체 주문 통계를 보여줍니다:
 * - 판매자들의 발주확정 주문 (플랫폼 주문)
 * - 관리자 직접 판매 주문 (오픈마켓 주문)
 *
 * ※ platform/orders 대시보드와 차이점:
 *   - platform/orders: 로그인한 개별 셀러의 주문만 표시
 *   - admin/dashboard: 전체 셀러 + 관리자 주문 모두 표시
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import DashboardTab from './components/DashboardTab';
import { Order, StatusConfig } from './types';

const ITEMS_PER_PAGE = 50; // 페이지당 주문 수

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userData?.approved || (userData.role !== 'admin' && userData.role !== 'employee' && userData.role !== 'super_admin')) {
        router.push('/');
      }
    };

    checkAuth();
    fetchOrders(1);
  }, [router]);

  // 페이지 변경 시 주문 조회
  useEffect(() => {
    if (currentPage > 1) {
      fetchOrders(currentPage);
    }
  }, [currentPage]);

  /**
   * 관리자 대시보드 통계 데이터 조회 (페이지네이션 적용)
   *
   * integrated_orders 테이블의 주문 데이터를 페이지 단위로 조회합니다:
   * 1. 플랫폼 주문 (판매자들이 발주확정한 주문)
   * 2. 관리자 직접 판매 주문 (오픈마켓에서 판매한 주문)
   *
   * ※ 개별 셀러 필터링 없이 전체 주문 통계를 제공합니다.
   */
  const fetchOrders = async (page: number) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 시작/끝 인덱스 계산
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      // 페이지네이션 적용하여 주문 조회
      const { data, error, count } = await supabase
        .from('integrated_orders')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      // 총 개수 저장
      if (count !== null) {
        setTotalCount(count);
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
      const convertedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.id,
        orderNo: order.order_number || `TEMP${order.id}`,
        orderNumber: order.seller_order_number,
        products: order.option_name || '',
        amount: order.settlement_amount ? parseFloat(order.settlement_amount) : 0,
        quantity: parseInt(order.quantity) || 0,
        status: mapShippingStatus(order.shipping_status),
        date: order.created_at,
        registeredAt: order.created_at,
        confirmedAt: order.confirmed_at,
        shippedDate: order.shipped_date,
        courier: order.courier_company,
        trackingNo: order.tracking_number,
        cancelRequestedAt: order.cancel_requested_at,
        cancelledAt: order.canceled_at,
        cancelReason: order.cancel_reason,
        orderer: order.buyer_name,
        ordererPhone: order.buyer_phone,
        recipient: order.recipient_name,
        recipientPhone: order.recipient_phone,
        address: order.recipient_address,
        deliveryMessage: order.delivery_message,
        optionName: order.option_name || '',
        optionCode: order.option_code || '',
        specialRequest: order.special_request,
        unitPrice: order.seller_supply_price ? parseFloat(order.seller_supply_price) : undefined,
        supplyPrice: order.settlement_amount ? parseFloat(order.settlement_amount) : undefined,
        refundAmount: order.settlement_amount ? parseFloat(order.settlement_amount) : undefined,
        refundedAt: order.refund_processed_at,
        // 플랫폼 주문 구분: organization_id가 있으면 '플랫폼', 없으면 원래 market_name 사용
        marketName: order.organization_id ? '플랫폼' : (order.market_name || '자사판매'),
        sellerMarketName: order.seller_market_name || '미지정',
        priceUpdatedAt: order.price_updated_at,
        ...(order.organization_id && { organization_id: order.organization_id }) // organization_id 추가
      } as any));

      setOrders(convertedOrders);
    } catch (error) {
      console.error('주문 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<Order['status'] | 'refunded', StatusConfig> = {
    registered: { label: '발주서등록', color: '#2563eb', bg: '#dbeafe' },
    confirmed: { label: '발주서확정', color: '#7c3aed', bg: '#ede9fe' },
    preparing: { label: '상품준비중', color: '#f59e0b', bg: '#fef3c7' },
    shipped: { label: '발송완료', color: '#10b981', bg: '#d1fae5' },
    cancelRequested: { label: '취소요청', color: '#ef4444', bg: '#fee2e2' },
    cancelled: { label: '취소완료', color: '#6b7280', bg: '#f3f4f6' },
    refunded: { label: '환불완료', color: '#10b981', bg: '#d1fae5' }
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '40px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)'
      }}>
        로딩 중...
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div style={{ width: '100%', padding: '0 20px' }}>
      <DashboardTab
        isMobile={isMobile}
        orders={orders}
        statusConfig={statusConfig}
      />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '32px',
          paddingBottom: '32px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: currentPage === 1 ? 'var(--color-surface)' : 'var(--color-background)',
              color: currentPage === 1 ? 'var(--color-text-tertiary)' : 'var(--color-text)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            이전
          </button>

          <div style={{
            display: 'flex',
            gap: '4px'
          }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: currentPage === pageNum ? 'var(--color-primary)' : 'var(--color-background)',
                    color: currentPage === pageNum ? 'white' : 'var(--color-text)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: currentPage === pageNum ? '600' : '400'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: currentPage === totalPages ? 'var(--color-surface)' : 'var(--color-background)',
              color: currentPage === totalPages ? 'var(--color-text-tertiary)' : 'var(--color-text)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            다음
          </button>

          <div style={{
            marginLeft: '16px',
            color: 'var(--color-text-secondary)',
            fontSize: '14px'
          }}>
            {currentPage} / {totalPages} 페이지 (총 {totalCount.toLocaleString()}건)
          </div>
        </div>
      )}
    </div>
  );
}
