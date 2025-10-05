'use client';

import { Order } from '../types';

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
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            총 정산액
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            ₩{orders.reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            완료된 정산
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            ₩{orders.filter(o => o.status === 'shipped')
              .reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            미완료 정산
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            ₩{orders.filter(o => o.status !== 'shipped')
              .reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 월별 정산 테이블 */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          marginBottom: '24px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            월별 정산 내역
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  월
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  발주 건수
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  총 금액
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  완료 금액
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  미완료 금액
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  완료율
                </th>
              </tr>
            </thead>
            <tbody>
              {settlementData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}
                  >
                    정산 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                (settlementData as any[]).map((settlement) => {
                  const completionRate = settlement.totalAmount > 0
                    ? ((settlement.paidAmount / settlement.totalAmount) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={settlement.month} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {settlement.month}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937', textAlign: 'right' }}>
                        {settlement.totalOrders}건
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937', textAlign: 'right' }}>
                        {settlement.totalAmount.toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#10b981', textAlign: 'right' }}>
                        {settlement.paidAmount.toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#ef4444', textAlign: 'right' }}>
                        {settlement.unpaidAmount.toLocaleString()}원
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '60px',
                              height: '8px',
                              background: '#e5e7eb',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${completionRate}%`,
                                height: '100%',
                                background: '#10b981',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 결제 수단별 통계 */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
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
              style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                카드 결제
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                {paymentStats.card}건
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                전체의 {orders.length > 0 ? ((paymentStats.card / orders.length) * 100).toFixed(0) : 0}%
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                계좌 이체
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                {paymentStats.transfer}건
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                전체의 {orders.length > 0 ? ((paymentStats.transfer / orders.length) * 100).toFixed(0) : 0}%
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                현금 결제
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                {paymentStats.cash}건
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                전체의 {orders.length > 0 ? ((paymentStats.cash / orders.length) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
