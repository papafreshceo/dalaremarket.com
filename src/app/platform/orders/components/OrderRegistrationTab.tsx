'use client';

import { useMemo } from 'react';
import { Order, StatusConfig, StatsData } from '../types';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';

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

  // 상태별 칼럼 정의
  const getColumnsByStatus = useMemo(() => {
    const baseColumns = [
      {
        key: 'orderNo',
        title: filterStatus === 'registered' ? '등록번호' : '발주번호',
        width: 100,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'date',
        title: filterStatus === 'registered' ? '등록일시' :
               filterStatus === 'cancelRequested' || filterStatus === 'cancelled' ? '취소요청일시' : '발주일시',
        width: 150,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'orderNumber',
        title: '주문번호',
        width: 120,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'orderer',
        title: '주문자',
        width: 100,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'ordererPhone',
        title: '주문자전화번호',
        width: 120,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'recipient',
        title: '수령인',
        width: 100,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'recipientPhone',
        title: '수령인전화번호',
        width: 120,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'address',
        title: '주소',
        width: 250,
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'optionName',
        title: '옵션명',
        width: 150,
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'quantity',
        title: '수량',
        width: 80,
        type: 'number' as const,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'unitPrice',
        title: '공급단가',
        width: 100,
        type: 'number' as const,
        readOnly: true,
        align: 'right' as const,
        renderer: (value: any) => (
          <span style={{ fontSize: '13px' }}>₩{value?.toLocaleString()}</span>
        )
      }
    ];

    // 상태별 추가 칼럼
    if (filterStatus === 'registered') {
      return [
        ...baseColumns,
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>₩{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'delete',
          title: '삭제',
          width: 80,
          readOnly: true,
          align: 'center' as const,
          renderer: () => (
            <button
              className="bg-danger"
              style={{
                padding: '4px 12px',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              삭제
            </button>
          )
        }
      ];
    } else if (filterStatus === 'confirmed') {
      return [
        ...baseColumns,
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>₩{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'cancelRequest',
          title: '취소요청',
          width: 80,
          readOnly: true,
          align: 'center' as const,
          renderer: () => (
            <button
              className="bg-warning"
              style={{
                padding: '4px 12px',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              요청
            </button>
          )
        }
      ];
    } else if (filterStatus === 'preparing') {
      return [
        ...baseColumns,
        {
          key: 'depositAmount',
          title: '입금액',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>₩{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'cancelRequest',
          title: '취소요청',
          width: 80,
          readOnly: true,
          align: 'center' as const,
          renderer: () => (
            <button
              className="bg-warning"
              style={{
                padding: '4px 12px',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              요청
            </button>
          )
        }
      ];
    } else if (filterStatus === 'shipped') {
      return [
        ...baseColumns,
        {
          key: 'supplyPrice',
          title: '공급가',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>₩{value?.toLocaleString()}</span>
          )
        },
        {
          key: 'shippedDate',
          title: '발송일',
          width: 100,
          readOnly: true,
          align: 'center' as const
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
        }
      ];
    } else if (filterStatus === 'cancelRequested' || filterStatus === 'cancelled') {
      const cols = [
        ...baseColumns,
        {
          key: 'depositAmount',
          title: '입금액',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>₩{value?.toLocaleString()}</span>
          )
        }
      ];

      if (filterStatus === 'cancelled') {
        cols.push({
          key: 'cancelledAt',
          title: '취소완료일시',
          width: 150,
          readOnly: true,
          align: 'center' as const
        });
      }

      return cols;
    }

    // 전체 보기일 때
    return [
      ...baseColumns,
      {
        key: 'supplyPrice',
        title: '공급가',
        width: 100,
        type: 'number' as const,
        readOnly: true,
        align: 'right' as const,
        renderer: (value: any) => (
          <span style={{ fontSize: '13px' }}>₩{value?.toLocaleString()}</span>
        )
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
  }, [filterStatus, statusConfig]);

  return (
    <div>
      {/* 상태 통계 카드 섹션 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        {statsData.map((stat) => {
          const config = statusConfig[stat.status];
          const isSelected = filterStatus === stat.status;
          return (
            <div
              key={stat.status}
              onClick={() => setFilterStatus(stat.status)}
              className="card"
              style={{
                padding: '20px',
                borderRadius: '8px',
                border: isSelected ? `2px solid ${config.color}` : undefined,
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '13px', color: config.color, marginBottom: '8px', fontWeight: '600' }}>
                {config.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: config.color }}>
                {stat.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* 필터 및 버튼 섹션 */}
      <div className="card" style={{
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* 필터 - 좌측 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="filter-input"
            style={{
              width: '120px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px'
            }}
          >
            <option value="all">전체</option>
            {Object.entries(statusConfig).map(([key, config]: [string, any]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-input"
            style={{
              width: '140px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px'
            }}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-input"
            style={{
              width: '140px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px'
            }}
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="발주번호, 상품명 검색"
            className="filter-input"
            style={{
              width: '180px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px'
            }}
          />
        </div>

        {/* 발주서 관리 버튼들 - 우측 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="bg-success hover:bg-success-hover"
            style={{
              padding: '6px 16px',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '28px'
            }}
          >
            엑셀 양식 다운로드
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-primary hover:bg-primary-hover"
            style={{
              padding: '6px 16px',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '28px'
            }}
          >
            엑셀 업로드
          </button>
          <button
            className="bg-purple hover:bg-purple-hover"
            style={{
              padding: '6px 16px',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '28px'
            }}
          >
            새 발주서 작성
          </button>
        </div>
      </div>

      {/* 발주 테이블 */}
      <EditableAdminGrid
        data={filteredOrders}
        columns={getColumnsByStatus}
        height="600px"
        rowHeight={32}
        showRowNumbers={true}
        enableFilter={false}
        enableSort={true}
        enableCSVExport={false}
        enableCSVImport={false}
        enableAddRow={false}
        enableDelete={false}
        enableCheckbox={false}
      />
    </div>
  );
}
