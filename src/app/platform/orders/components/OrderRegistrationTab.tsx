'use client';

import { useMemo, useState } from 'react';
import { Order, StatusConfig, StatsData } from '../types';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import DatePicker from '@/components/ui/DatePicker';
import { Modal } from '@/components/ui/Modal';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import toast, { Toaster } from 'react-hot-toast';
import { getCurrentTimeUTC, formatDateTimeForDisplay } from '@/lib/date';
import MarketFileUploadModal from '../modals/MarketFileUploadModal';
import OptionValidationModal from '../modals/OptionValidationModal';

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
  userId: string;
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
  userId,
  userEmail
}: OrderRegistrationTabProps) {

  // 툴팁 상태 관리 (최상단에 배치)
  const [hoveredStatus, setHoveredStatus] = useState<Order['status'] | null>(null);

  // 그리드 리마운트 트리거
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 마켓송장파일 모달 상태
  const [showMarketInvoiceModal, setShowMarketInvoiceModal] = useState(false);

  // 마켓파일 업로드 모달 상태
  const [showMarketFileUploadModal, setShowMarketFileUploadModal] = useState(false);

  // 옵션 검증 모달 상태 (발주확정 전 검증용)
  const [showOptionValidationModal, setShowOptionValidationModal] = useState(false);
  const [validatedOrders, setValidatedOrders] = useState<any[]>([]);
  const [optionProductsMap, setOptionProductsMap] = useState<Map<string, any>>(new Map());

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
  const generateOrderNumber = (userEmail: string, sequence: number): string => {
    // 이메일 앞 2글자 추출 (대문자로 변환)
    const emailPrefix = userEmail.substring(0, 2).toUpperCase();

    // 한국 시간 (서울 시간대: UTC+9)
    const utcNow = new Date();
    const now = new Date(utcNow.getTime() + (9 * 60 * 60 * 1000));

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const dateTime = `${year}${month}${day}${hours}${minutes}${seconds}`;

    // 순번 (4자리)
    const seqStr = String(sequence).padStart(4, '0');

    // 발주번호: 이메일앞2글자 + YYYYMMDDHHMMSS + 순번4자리
    return `${emailPrefix}${dateTime}${seqStr}`;
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
        title: '옵션명',
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
          title: '옵션명',
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
          title: '옵션명',
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
          title: '옵션명',
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
          title: '옵션명',
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
          title: '옵션명',
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
          title: '옵션명',
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
          title: '옵션명',
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
        title: '옵션명',
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
              // 계산 필드 (예: 상품명+옵션명)
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
          옵션명: order.optionName,
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
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
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
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
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
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
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
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '12px',
              height: '28px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
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
            onClick={() => setShowMarketFileUploadModal(true)}
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
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Upload size={14} />
            마켓파일 업로드
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
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Upload size={14} />
            발주서 업로드
          </button>
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
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            발주서 양식
          </button>
        </div>
      </div>

      {/* 주문 요약 및 발주확정 버튼 */}
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
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginRight: '8px' }}>주문건수:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text)' }}>
              {orderSummary.count.toLocaleString()}건
            </span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginRight: '8px' }}>공급가 합계:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>
              {orderSummary.totalSupplyPrice.toLocaleString()}원
            </span>
          </div>
        </div>
        <button
          onClick={async () => {
            if (filteredOrders.length === 0) {
              showModal('alert', '알림', '발주 확정할 주문이 없습니다.');
              return;
            }

            // 옵션명 검증 시작
            try {
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();

              // 모든 옵션명 수집 (중복 제거)
              const uniqueOptionNames = [...new Set(filteredOrders.map(order => order.products).filter(Boolean))];

              console.log('🔍 옵션명 검증 시작:', uniqueOptionNames);

              // option_products에서 공급단가 조회
              const { data: optionProducts, error: optionError} = await supabase
                .from('option_products')
                .select('option_name, option_code, seller_supply_price')
                .in('option_name', uniqueOptionNames);

              if (optionError) {
                console.error('❌ 옵션명 조회 오류:', optionError);
              } else {
                console.log('✅ 옵션명으로 조회된 데이터:', optionProducts);
              }

              console.log('💰 최종 조회된 옵션상품:', optionProducts);

              // 옵션상품 Map 저장 (옵션명 소문자 키로 저장)
              const productMap = new Map<string, any>();
              (optionProducts || []).forEach((product: any) => {
                if (product.option_name) {
                  const key = product.option_name.trim().toLowerCase();
                  productMap.set(key, product);
                }
              });
              setOptionProductsMap(productMap);

              // 검증 모달용 주문 데이터 준비
              const utcTime = getCurrentTimeUTC();
              const ordersForValidation = filteredOrders.map((order, index) => ({
                index,
                orderNumber: order.orderNumber || '',
                orderer: order.orderer || '',
                ordererPhone: order.ordererPhone || '',
                recipient: order.recipient || '',
                recipientPhone: order.recipientPhone || '',
                address: order.address || '',
                deliveryMessage: order.deliveryMessage || '',
                optionName: order.products || '',
                optionCode: '',
                quantity: String(order.quantity || 1),
                specialRequest: order.specialRequest || '',
                // DB 저장용 메타데이터 (검증 후 사용)
                _metadata: {
                  id: order.id, // 기존 주문 ID (업데이트용)
                  sheet_date: order.date?.split('T')[0] || utcTime.split('T')[0],
                  seller_id: userId,
                  created_by: userId,
                  market_name: order.marketName || '플랫폼',
                  payment_date: utcTime.split('T')[0],
                  shipping_status: '발주서확정'
                }
              }));

              // 검증 모달 표시
              setValidatedOrders(ordersForValidation);
              setShowOptionValidationModal(true);
            } catch (error) {
              console.error('옵션명 검증 오류:', error);
              showModal('alert', '오류', '옵션명 검증 중 오류가 발생했습니다.');
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

      {/* 발주 테이블 */}
      <EditableAdminGrid
        key={`grid-${refreshTrigger}`}
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

            // 각 주문에 발주번호 생성 및 업데이트
            const now = getCurrentTimeUTC();
            for (let i = 0; i < validatedOrders.length; i++) {
              const order = validatedOrders[i];
              const orderNo = generateOrderNumber(userEmail, i + 1);
              const quantity = parseInt(order.quantity) || 1;
              const unitPrice = order.unitPrice || 0;
              const supplyPrice = order.supplyPrice || (unitPrice * quantity);

              const { error } = await supabase
                .from('integrated_orders')
                .update({
                  shipping_status: '발주서확정',
                  order_number: orderNo,
                  confirmed_at: now,
                  option_name: order.optionName, // 수정된 옵션명
                  seller_supply_price: unitPrice,
                  settlement_amount: supplyPrice
                })
                .eq('id', order._metadata.id);

              if (error) {
                console.error('발주확정 오류:', error);
                showModal('alert', '오류', `발주 확정 중 오류가 발생했습니다: ${error.message}`);
                return;
              }
            }

            setShowOptionValidationModal(false);
            setValidatedOrders([]);
            setOptionProductsMap(new Map());

            showModal('alert', '완료', `${validatedOrders.length}건의 주문이 발주 확정되었습니다.`, () => {
              // 주문 목록 새로고침
              if (onRefresh) {
                onRefresh();
              }
            });
          } catch (error) {
            console.error('발주확정 오류:', error);
            showModal('alert', '오류', '발주 확정 중 오류가 발생했습니다.');
          }
        }}
        optionProducts={optionProductsMap}
      />
    </div>
  );
}
