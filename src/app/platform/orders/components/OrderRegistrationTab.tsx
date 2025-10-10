'use client';

import { useMemo, useState } from 'react';
import { Order, StatusConfig, StatsData } from '../types';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import DatePicker from '@/components/ui/DatePicker';
import * as XLSX from 'xlsx';

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
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  onRefresh?: () => void;
  userEmail: string;
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
  setEndDate,
  onRefresh,
  userEmail
}: OrderRegistrationTabProps) {

  // 툴팁 상태 관리 (최상단에 배치)
  const [hoveredStatus, setHoveredStatus] = useState<Order['status'] | null>(null);

  // 발주번호 생성 함수
  const generateOrderNumber = (userEmail: string, sequence: number): string => {
    // 이메일 앞 2글자 추출 (대문자로 변환)
    const emailPrefix = userEmail.substring(0, 2).toUpperCase();

    // 현재 날짜시간 (YYYYMMDDHHMMSS)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateTime = `${year}${month}${day}${hours}${minutes}${seconds}`;

    // 순번 (4자리)
    const seqStr = String(sequence).padStart(4, '0');

    // 발주번호: 이메일앞2글자 + YYYYMMDDHHMMSS + 순번4자리
    return `${emailPrefix}${dateTime}${seqStr}`;
  };

  // 주문 삭제 핸들러
  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('정말 이 주문을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase
        .from('integrated_orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('주문 삭제 오류:', error);
        alert('주문 삭제에 실패했습니다.');
        return;
      }

      alert('주문이 삭제되었습니다.');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('삭제 처리 오류:', error);
      alert('주문 삭제 중 오류가 발생했습니다.');
    }
  };

  // 일괄 삭제 핸들러
  const handleBatchDelete = async () => {
    if (selectedOrders.length === 0) {
      alert('삭제할 주문을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedOrders.length}개의 주문을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase
        .from('integrated_orders')
        .delete()
        .in('id', selectedOrders);

      if (error) {
        console.error('일괄 삭제 오류:', error);
        alert('주문 삭제에 실패했습니다.');
        return;
      }

      alert(`${selectedOrders.length}개의 주문이 삭제되었습니다.`);
      setSelectedOrders([]); // 선택 초기화
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('일괄 삭제 처리 오류:', error);
      alert('주문 삭제 중 오류가 발생했습니다.');
    }
  };

  // 취소요청 핸들러
  const handleCancelRequest = async (orderId: number) => {
    if (!confirm('이 주문의 취소를 요청하시겠습니까?')) {
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase
        .from('integrated_orders')
        .update({
          shipping_status: '취소요청',
          cancel_requested_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('취소요청 오류:', error);
        alert('취소요청에 실패했습니다.');
        return;
      }

      alert('취소요청이 완료되었습니다.');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('취소요청 처리 오류:', error);
      alert('취소요청 중 오류가 발생했습니다.');
    }
  };

  // 일괄 취소요청 핸들러
  const handleBatchCancelRequest = async () => {
    if (selectedOrders.length === 0) {
      alert('취소요청할 주문을 선택해주세요.');
      return;
    }

    // 취소 사유 입력 받기
    const cancelReason = prompt('취소 사유를 입력해주세요:');
    if (cancelReason === null) {
      // 사용자가 취소를 누른 경우
      return;
    }

    if (!cancelReason.trim()) {
      alert('취소 사유를 입력해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedOrders.length}개의 주문을 취소요청하시겠습니까?`)) {
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase
        .from('integrated_orders')
        .update({
          shipping_status: '취소요청',
          cancel_requested_at: new Date().toISOString(),
          cancel_reason: cancelReason.trim()
        })
        .in('id', selectedOrders);

      if (error) {
        console.error('일괄 취소요청 오류:', error);
        alert('취소요청에 실패했습니다.');
        return;
      }

      alert(`${selectedOrders.length}개의 주문 취소요청이 완료되었습니다.`);
      setSelectedOrders([]); // 선택 초기화
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('일괄 취소요청 처리 오류:', error);
      alert('취소요청 중 오류가 발생했습니다.');
    }
  };

  // 상태별 칼럼 정의
  const getColumnsByStatus = useMemo(() => {
    const baseColumns = [
      {
        key: 'date',
        title: filterStatus === 'registered' ? '등록일시' :
               filterStatus === 'cancelRequested' || filterStatus === 'cancelled' ? '취소요청일시' : '발주일시',
        width: 160,
        readOnly: true,
        align: 'center' as const,
        renderer: (value: any) => {
          if (!value) return '';
          const date = new Date(value);
          return (
            <span style={{ fontSize: '13px' }}>
              {date.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </span>
          );
        }
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
        title: '옵션명',
        readOnly: true,
        align: 'left' as const
      },
      {
        key: 'optionCode',
        title: '옵션코드',
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'quantity',
        title: '수량',
        type: 'number' as const,
        readOnly: true,
        align: 'center' as const
      },
      {
        key: 'specialRequest',
        title: '특이/요청사항',
        readOnly: true,
        align: 'left' as const
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
      }
    ];

    // 상태별 추가 칼럼
    if (filterStatus === 'registered') {
      // 발주서등록 단계: 발주번호 없음, 공급가만 표시
      return [
        {
          key: 'rowNumber',
          title: '연번',
          width: 60,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: any, index: number) => (
            <span style={{ fontSize: '13px' }}>{index + 1}</span>
          )
        },
        ...baseColumns,
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
    } else if (filterStatus === 'confirmed') {
      // 발주확정 이후: 발주번호 표시
      return [
        {
          key: 'rowNumber',
          title: '연번',
          width: 60,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: any, index: number) => (
            <span style={{ fontSize: '13px' }}>{index + 1}</span>
          )
        },
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        ...baseColumns,
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
    } else if (filterStatus === 'preparing') {
      // 상품준비중: 발주서확정과 동일한 구조
      return [
        {
          key: 'rowNumber',
          title: '연번',
          width: 60,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any, row: any, index: number) => (
            <span style={{ fontSize: '13px' }}>{index + 1}</span>
          )
        },
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        ...baseColumns,
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
    } else if (filterStatus === 'shipped') {
      return [
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        ...baseColumns,
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
        {
          key: 'orderNo',
          title: '발주번호',
          width: 180,
          readOnly: true,
          align: 'center' as const
        },
        ...baseColumns,
        {
          key: 'cancelRequestedAt',
          title: '취소요청일시',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any) => {
            if (!value) return '';
            const date = new Date(value);
            return (
              <span style={{ fontSize: '13px' }}>
                {date.toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </span>
            );
          }
        },
        {
          key: 'depositAmount',
          title: '입금액',
          width: 100,
          type: 'number' as const,
          readOnly: true,
          align: 'right' as const,
          renderer: (value: any) => (
            <span style={{ fontSize: '13px' }}>{value?.toLocaleString()}</span>
          )
        }
      ];

      if (filterStatus === 'cancelled') {
        cols.push({
          key: 'cancelledAt',
          title: '취소완료일시',
          width: 160,
          readOnly: true,
          align: 'center' as const,
          renderer: (value: any) => {
            if (!value) return '';
            const date = new Date(value);
            return (
              <span style={{ fontSize: '13px' }}>
                {date.toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </span>
            );
          }
        });
      }

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
      ...baseColumns,
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

  // 주문건수 및 공급가 합계 계산
  const orderSummary = useMemo(() => {
    const count = filteredOrders.length;
    const totalSupplyPrice = filteredOrders.reduce((sum, order) => {
      const price = parseFloat(order.supplyPrice || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    return { count, totalSupplyPrice };
  }, [filteredOrders]);

  // 상태별 설명 텍스트
  const statusDescriptions: Record<Order['status'], string> = {
    registered: '판매자가 발주서를 등록하는 단계. 엑셀파일 업로드 방식으로만 가능합니다. 업로드와 일괄삭제 또는 취소가 언제든 가능합니다.',
    confirmed: '판매자가 직접 발주를 확정한 발주서입니다. 판매자가 \'입금완료 및 발주확정\' 버튼을 실행했을 때 이 탭으로 이관되며, 공급자가 입금 내역을 확인하기 전 단계. 취소 요청은 공급자의 승인이 필요합니다.',
    preparing: '상품 발송을 준비를 하고 있습니다. 공급자가 발주서와 입금내역을 확인하고 상품을 준비/포장 하고 있는 주문건입니다. 취소 요청은 공급자의 승인이 필요합니다.',
    cancelRequested: '입금완료 및 발주확정한 주문건 중에서 판매자가 취소를 요청한 주문건 입니다. 공급자 확인 및 승인이 필요합니다. 반드시 별도의 연락을 주셔야 합니다.',
    shipped: '상품 발송을 완료한 단계. 송장번호를 다운로드 하실 수 있으며, 어떠한 경우라도 취소와 환불이 불가능합니다.',
    cancelled: '취소 요청건이 정상적으로 처리되어 발주 취소가 정상적으로 처리된 주문건입니다.'
  };

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
              className="card"
              style={{
                padding: '20px',
                borderRadius: '8px',
                border: isSelected ? `2px solid ${config.color}` : undefined,
                cursor: 'pointer',
                position: 'relative'
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
                  bottom: 'calc(100% + 12px)',
                  left: isLastCard ? 'auto' : '0',
                  right: isLastCard ? '0' : 'auto',
                  background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}25 100%)`,
                  backdropFilter: 'blur(10px)',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                  zIndex: 10000,
                  maxWidth: '600px',
                  minWidth: '450px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#1f2937',
                  pointerEvents: 'none',
                  whiteSpace: 'normal'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: isLastCard ? 'auto' : '24px',
                    right: isLastCard ? '24px' : 'auto',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: `8px solid ${config.color}20`
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
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* 필터 - 좌측 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'inline-block' }}>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="시작일"
              maxDate={endDate || undefined}
            />
          </div>

          <div style={{ display: 'inline-block' }}>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
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
            }}
            style={{
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              background: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
          >
            오늘
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(today.getDate() - 7);
              setStartDate(sevenDaysAgo);
              setEndDate(today);
            }}
            style={{
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              background: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
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
            }}
            style={{
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              background: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
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
            }}
            style={{
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              background: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
          >
            90일
          </button>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="전체 검색"
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
            onClick={handleDownloadTemplate}
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

      {/* 주문 요약 및 발주확정 버튼 */}
      <div style={{
        marginBottom: '16px',
        padding: '16px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px' }}>주문건수:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              {orderSummary.count.toLocaleString()}건
            </span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px' }}>공급가 합계:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
              {orderSummary.totalSupplyPrice.toLocaleString()}원
            </span>
          </div>
        </div>
        <button
          onClick={async () => {
            if (filteredOrders.length === 0) {
              alert('발주 확정할 주문이 없습니다.');
              return;
            }
            if (!confirm(`${filteredOrders.length}건의 주문을 발주 확정하시겠습니까?\n입금 완료 후 이 버튼을 눌러주세요.`)) {
              return;
            }

            try {
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();

              // 각 주문에 발주번호 생성 및 업데이트
              for (let i = 0; i < filteredOrders.length; i++) {
                const order = filteredOrders[i];
                const orderNo = generateOrderNumber(userEmail, i + 1);

                const { error } = await supabase
                  .from('integrated_orders')
                  .update({
                    shipping_status: '결제완료',
                    order_no: orderNo
                  })
                  .eq('id', order.id);

                if (error) {
                  console.error('발주확정 오류:', error);
                  alert(`발주 확정 중 오류가 발생했습니다: ${error.message}`);
                  return;
                }
              }

              alert(`${filteredOrders.length}건의 주문이 발주 확정되었습니다.`);

              // 주문 목록 새로고침
              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              console.error('발주확정 오류:', error);
              alert('발주 확정 중 오류가 발생했습니다.');
            }
          }}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          💳 입금완료 및 발주확정
        </button>
      </div>

      {/* 일괄 삭제 버튼 (발주서등록 단계만) */}
      {filterStatus === 'registered' && (
        <div className="mb-3 flex justify-start">
          <button
            onClick={handleBatchDelete}
            disabled={selectedOrders.length === 0}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              backgroundColor: selectedOrders.length === 0 ? '#d1d5db' : '#000000',
              color: selectedOrders.length === 0 ? '#6b7280' : '#ffffff',
              cursor: selectedOrders.length === 0 ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOrders.length > 0) {
                e.currentTarget.style.backgroundColor = '#000000';
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

      {/* 발주 테이블 */}
      <EditableAdminGrid
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
      />
    </div>
  );
}
