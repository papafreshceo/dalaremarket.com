'use client';

import { Order, StatusConfig, StatsData } from '../types';

interface OrderRegistrationTabProps {
  isMobile: boolean;
  orders: Order[];
  statsData: StatsData[];
  statusConfig: Record<Order['status'], StatusConfig>;
  filterStatus: 'all' | Order['status'];
  setFilterStatus: (status: 'all' | Order['status']) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedOrders: number[];
  setSelectedOrders: (orders: number[]) => void;
  setShowUploadModal: (show: boolean) => void;
  filteredOrders: Order[];
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectOrder: (id: number) => void;
  setSelectedOrder: (order: Order | null) => void;
  setShowDetailModal: (show: boolean) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

export default function OrderRegistrationTab({
  isMobile,
  orders,
  statsData,
  statusConfig,
  filterStatus,
  setFilterStatus,
  searchTerm,
  setSearchTerm,
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
  setEndDate
}: OrderRegistrationTabProps) {

  return (
    <div>
      {/* 상태 통계 카드 섹션 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {statsData.map((stat) => {
          const config = statusConfig[stat.status];
          return (
            <div
              key={stat.status}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                {config.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
                {stat.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* 발주서 관리 섹션 */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #e5e7eb'
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          발주서 관리
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <button
            style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#10b981';
            }}
          >
            엑셀 양식 다운로드
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '12px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2563eb';
            }}
          >
            엑셀 업로드
          </button>
          <button
            style={{
              padding: '12px 24px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7c3aed';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#8b5cf6';
            }}
          >
            새 발주서 작성
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div
        style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '12px'
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              상태
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">전체</option>
              {Object.entries(statusConfig).map(([key, config]: [string, any]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              종료일
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 발주 테이블 */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  발주번호
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  발주일
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  상품
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  수량
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  금액
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  상태
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}
                  >
                    발주 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const config = statusConfig[order.status];
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                        />
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>
                        {order.orderNo}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>
                        {order.date}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>
                        {order.products}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>
                        {order.quantity}개
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937', textAlign: 'right' }}>
                        ₩{order.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
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
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailModal(true);
                          }}
                          style={{
                            padding: '4px 12px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
