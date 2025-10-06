'use client';

import { Order } from '../types';
import { useMemo } from 'react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';

interface SettlementTabProps {
  isMobile: boolean;
  orders: Order[];
}

export default function SettlementTab({ isMobile, orders }: SettlementTabProps) {
  // 월별 정산 데이터 계산
  const monthlySettlements = orders.reduce((acc: any, order) => {
    const month = order.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = {
        month,
        totalOrders: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        orders: []
      };
    }
    acc[month].totalOrders += 1;
    acc[month].totalAmount += order.amount || 0;

    // 결제 완료 상태인 경우
    if (order.status === 'shipped') {
      acc[month].paidAmount += order.amount || 0;
    } else {
      acc[month].unpaidAmount += order.amount || 0;
    }

    acc[month].orders.push(order);
    return acc;
  }, {});

  const settlementData = Object.values(monthlySettlements).sort((a: any, b: any) =>
    b.month.localeCompare(a.month)
  );

  // 결제 수단별 통계 (더미 데이터 - 실제로는 order 데이터에 payment_method 필드 필요)
  const paymentStats = {
    card: Math.floor(orders.length * 0.6),
    transfer: Math.floor(orders.length * 0.3),
    cash: Math.floor(orders.length * 0.1)
  };

  const columns = useMemo(() => [
    { key: 'month', title: '월', width: 150 },
    { key: 'totalOrders', title: '발주 건수', type: 'number' as const, width: 120, renderer: (value: any) => `${value}건` },
    { key: 'totalAmount', title: '총 금액', type: 'number' as const, width: 150, renderer: (value: any) => `${value?.toLocaleString()}원` },
    { key: 'paidAmount', title: '완료 금액', type: 'number' as const, width: 150, renderer: (value: any) => `${value?.toLocaleString()}원` },
    { key: 'unpaidAmount', title: '미완료 금액', type: 'number' as const, width: 150, renderer: (value: any) => `${value?.toLocaleString()}원` },
    {
      key: 'completionRate',
      title: '완료율',
      width: 200,
      renderer: (value: any, row: any) => {
        const rate = row.totalAmount > 0 ? ((row.paidAmount / row.totalAmount) * 100).toFixed(1) : '0.0';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '60px', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${rate}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{rate}%</span>
          </div>
        );
      }
    }
  ], []);

  return (
    <div>
      {/* 정산 요약 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div
          className="dark:bg-[#252526] dark:border-[#3e3e42]"
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            총 정산액
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            ₩{orders.reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>

        <div
          className="dark:bg-[#252526] dark:border-[#3e3e42]"
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            완료된 정산
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            ₩{orders.filter(o => o.status === 'shipped')
              .reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>

        <div
          className="dark:bg-[#252526] dark:border-[#3e3e42]"
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            미완료 정산
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            ₩{orders.filter(o => o.status !== 'shipped')
              .reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 월별 정산 테이블 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            월별 정산 내역
          </h3>
        </div>
        <EditableAdminGrid
          data={settlementData as any[]}
          columns={columns}
          height="400px"
          rowHeight={40}
          showRowNumbers={false}
          enableFilter={false}
          enableSort={true}
          enableCSVExport={false}
          enableCSVImport={false}
          enableAddRow={false}
          enableDelete={false}
          enableCheckbox={false}
        />
      </div>

      {/* 결제 수단별 통계 */}
      <div
        className="dark:bg-[#252526] dark:border-[#3e3e42]"
        style={{
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}
      >
        <div className="dark:border-[#3e3e42]" style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            결제 수단별 통계
          </h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '16px'
            }}
          >
            <div
              className="dark:bg-[#2d2d30] dark:border-[#3e3e42]"
              style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                카드 결제
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {paymentStats.card}건
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                전체의 {orders.length > 0 ? ((paymentStats.card / orders.length) * 100).toFixed(0) : 0}%
              </div>
            </div>

            <div
              className="dark:bg-[#2d2d30] dark:border-[#3e3e42]"
              style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                계좌 이체
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {paymentStats.transfer}건
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                전체의 {orders.length > 0 ? ((paymentStats.transfer / orders.length) * 100).toFixed(0) : 0}%
              </div>
            </div>

            <div
              className="dark:bg-[#2d2d30] dark:border-[#3e3e42]"
              style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                현금 결제
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {paymentStats.cash}건
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                전체의 {orders.length > 0 ? ((paymentStats.cash / orders.length) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
