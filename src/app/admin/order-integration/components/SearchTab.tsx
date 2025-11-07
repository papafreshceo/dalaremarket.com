'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import { Modal } from '@/components/ui/Modal';
import ModelessWindow from '@/components/ModelessWindow';
import ExcelJS from 'exceljs';
import { formatDateTimeForDisplay } from '@/lib/date';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import OrderStatistics from './OrderStatistics';
import OrderFilters, { type SearchFilters } from './OrderFilters';
import VendorSellerStats from './VendorSellerStats';
import OptionStatsTable from './OptionStatsTable';
import OrderActionButtons from './OrderActionButtons';
import PreparingSummaryWindow from './PreparingSummaryWindow';

interface Order {
  id: number;
  sheet_date: string;
  created_at: string;
  updated_at?: string;
  market_name: string;
  sequence_number?: string;
  payment_date?: string;
  order_number?: string;
  buyer_name?: string;
  buyer_phone?: string;
  recipient_name: string;
  recipient_phone?: string;
  recipient_address?: string;
  delivery_message?: string;
  option_name: string;
  quantity: string;
  market_check?: string;
  confirmation?: string;
  special_request?: string;
  shipping_request_date?: string;
  seller_supply_price?: string;
  shipping_source?: string;
  invoice_issuer?: string;
  vendor_name?: string;
  shipping_location_name?: string;
  shipping_location_address?: string;
  shipping_location_contact?: string;
  shipping_cost?: string;
  settlement_amount?: string;
  settlement_target_amount?: string;
  product_amount?: string;
  final_payment_amount?: string;
  discount_amount?: string;
  platform_discount?: string;
  seller_discount?: string;
  buyer_coupon_discount?: string;
  coupon_discount?: string;
  other_support_discount?: string;
  commission_1?: string;
  commission_2?: string;
  sell_id?: string;
  seller_id?: string;
  seller_name?: string;
  separate_shipping?: string;
  delivery_fee?: string;
  shipped_date?: string;
  courier_company?: string;
  tracking_number?: string;
  option_code?: string;
  shipping_status?: string;
  cs_status?: string;
  memo?: string;
  is_deleted?: boolean;
  is_canceled?: boolean;
  order_confirmed?: boolean;
  invoice_registered?: boolean;
  payment_confirmed_at?: string;
  refund_processed_at?: string;
}

interface VendorStats {
  shipping_source: string;
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
  취소완료_건수: number;
  취소완료_수량: number;
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

interface OptionStats {
  option_name: string;
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
  취소완료_건수: number;
  취소완료_수량: number;
}

export default function SearchTab() {
  // ⚡ React Query 클라이언트
  const queryClient = useQueryClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    접수: 0,
    결제완료: 0,
    상품준비중: 0,
    발송완료: 0,
    취소요청: 0,
    취소완료: 0,
    환불완료: 0,
  });
  const [vendorStats, setVendorStats] = useState<VendorStats[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats[]>([]);
  const [optionStats, setOptionStats] = useState<OptionStats[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [marketTemplates, setMarketTemplates] = useState<Map<string, any>>(new Map());
  const [courierList, setCourierList] = useState<string[]>([]);

  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 100;

  // 삭제 모달 상태
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteResultModal, setShowDeleteResultModal] = useState(false);
  const [ordersToDelete, setOrdersToDelete] = useState<Order[]>([]);
  const [deleteResult, setDeleteResult] = useState({ count: 0 });

  // 송장일괄등록 모달 상태
  const [showBulkInvoiceModal, setShowBulkInvoiceModal] = useState(false);
  const [bulkInvoiceFile, setBulkInvoiceFile] = useState<File | null>(null);
  const [selectedOrdersForConfirm, setSelectedOrdersForConfirm] = useState<number[]>([]);
  const bulkInvoiceFileInputRef = useRef<HTMLInputElement>(null);

  // 송장일괄수정 모달 상태
  const [showBulkInvoiceUpdateModal, setShowBulkInvoiceUpdateModal] = useState(false);
  const [bulkInvoiceUpdateFile, setBulkInvoiceUpdateFile] = useState<File | null>(null);
  const bulkInvoiceUpdateFileInputRef = useRef<HTMLInputElement>(null);

  // 테이블 컨테이너 참조 (무한 스크롤용)
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 선택된 주문 상태
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  // CS 모달 상태
  const [showCSModal, setShowCSModal] = useState(false);
  const [csTypes, setCSTypes] = useState<Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    display_order: number;
  }>>([]);
  // CS 폼 초기 상태
  const initialCSFormData = {
    category: '',
    content: '',
    solution: '',
    otherSolution: '', // 기타 해결방법
    paymentAmount: 0,
    refundPercent: 0,
    refundAmount: 0,
    bank: '', // 은행
    accountHolder: '', // 예금주
    accountNumber: '', // 계좌번호
    resendOption: '',
    resendQty: 1,
    additionalAmount: 0,
    resendNote: 'CS재발송, 싱싱하고 맛있는 것',
    receiver: '',
    phone: '',
    address: '',
    requestDate: ''
  };

  const [csFormData, setCSFormData] = useState(initialCSFormData);

  // 주문 상세 모달 상태
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // 추가주문등록 모달 상태
  const [showAdditionalOrderModal, setShowAdditionalOrderModal] = useState(false);
  const [additionalOrderData, setAdditionalOrderData] = useState<any>({});

  // 벤더사전송파일 모달 상태
  const [showVendorFileModal, setShowVendorFileModal] = useState(false);
  const [showMarketInvoiceModal, setShowMarketInvoiceModal] = useState(false);
  const [marketInvoiceStats, setMarketInvoiceStats] = useState<Array<{market: string, count: number}>>([]);

  // 상품준비중 집계 모달리스 윈도우 상태
  const [showPreparingSummary, setShowPreparingSummary] = useState(false);

  // 벤더사 선택 모달 상태
  const [showVendorSelectModal, setShowVendorSelectModal] = useState(false);
  const [vendorList, setVendorList] = useState<Array<{id: string, name: string}>>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [ordersNeedingVendor, setOrdersNeedingVendor] = useState<typeof filteredOrders>([]);

  // 상태 카드 필터
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 검색 필터 상태
  // 초기 날짜 계산 (7일 범위)
  const getInitialDates = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const todayDate = koreaTime.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(koreaTime.getTime() - (6 * 24 * 60 * 60 * 1000));
    const sevenDaysAgoDate = sevenDaysAgo.toISOString().split('T')[0];
    return { startDate: sevenDaysAgoDate, endDate: todayDate };
  };

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const { startDate, endDate } = getInitialDates();
    return {
      startDate,
      endDate,
      dateType: 'sheet',
      marketName: '',
      searchKeyword: '',
      shippingStatus: '',
      vendorName: '',
    };
  });

  // 검색어 debounce 제거 (즉시 반응)
  // const debouncedSearchKeyword = useDebounce(filters.searchKeyword, 300);

  // 일괄적용 택배사 선택값 상태
  const [bulkApplyValue, setBulkApplyValue] = useState('');

  // 초기 데이터 병렬 로드 (성능 최적화)
  useEffect(() => {
    const loadInitialData = async () => {
      // 4개 API를 병렬로 호출하여 로딩 시간 단축
      await Promise.all([
        loadMarketTemplates(),
        loadStandardFields(),
        loadCouriers(),
        loadCSTypes(),
      ]);
    };
    loadInitialData();
  }, []);

  // marketTemplates와 columns가 로드되면 마켓 컬럼과 주문번호 컬럼에 렌더러 추가
  // 무한루프 방지: columns.length와 marketTemplates.size만 의존성으로 사용
  useEffect(() => {
    if (columns.length === 0) return;

    // 렌더러가 필요한지 체크
    const marketColumn = columns.find(c => c.key === 'market_name' || c.isMarketColumn);
    const orderNumberColumn = columns.find(c => c.key === 'order_number');
    const quantityColumn = columns.find(c => c.isQuantityColumn);
    const paymentDateColumn = columns.find(c => c.isPaymentDateColumn);

    const needsMarketRenderer = marketColumn && !marketColumn.renderer && marketTemplates.size > 0;
    const needsOrderNumberRenderer = orderNumberColumn && !orderNumberColumn.renderer;
    const needsQuantityRenderer = quantityColumn && !quantityColumn.renderer;
    const needsPaymentDateRenderer = paymentDateColumn && !paymentDateColumn.renderer;

    const needsUpdate = needsMarketRenderer || needsOrderNumberRenderer || needsQuantityRenderer || needsPaymentDateRenderer;

    if (needsUpdate) {
      setColumns(prevColumns => prevColumns.map((column) => {
          // 마켓 컬럼 렌더러
          if ((column.key === 'market_name' || column.isMarketColumn) && !column.renderer && marketTemplates.size > 0) {
            return {
              ...column,
              renderer: (value: any, row: any) => {
                const marketName = value || row.market_name;
                if (!marketName) return '';

                const template = marketTemplates.get(String(marketName).toLowerCase());
                let marketColor = '#6B7280';

                if (template?.color_rgb) {
                  if (template.color_rgb.includes(',')) {
                    marketColor = `rgb(${template.color_rgb})`;
                  } else {
                    marketColor = template.color_rgb;
                  }
                }

                return (
                  <span
                    className="px-2 py-0.5 rounded text-white font-medium"
                    style={{ backgroundColor: marketColor, fontSize: '12px' }}
                  >
                    {marketName}
                  </span>
                );
              }
            };
          }

          // 주문번호 컬럼 렌더러
          if (column.key === 'order_number' && !column.renderer) {
            return {
              ...column,
              renderer: (value: any, row: any) => {
                return (
                  <button
                    onClick={() => {
                      setSelectedOrderDetail(row);
                      setShowOrderDetailModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                  >
                    {value || '-'}
                  </button>
                );
              }
            };
          }

          // 수량 컬럼 렌더러
          if (column.isQuantityColumn && !column.renderer) {
            return {
              ...column,
              renderer: (value: any, row: any) => {
                const qty = Number(value) || 0;
                if (qty >= 2) {
                  return (
                    <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-900 font-bold rounded">
                      {value}
                    </span>
                  );
                }
                return <span>{value || '-'}</span>;
              }
            };
          }

          // 결제일 컬럼 렌더러 (created_at을 한국 시간으로 변환하여 시분초까지 표시)
          if (column.isPaymentDateColumn && !column.renderer) {
            return {
              ...column,
              renderer: (value: any, row: any) => {
                // payment_date는 날짜만 있으므로, created_at을 한국 시간으로 변환하여 표시
                if (!row.created_at) return value || '-';
                try {
                  // UTC created_at을 한국 시간으로 변환하여 YYYY-MM-DD HH:mm:ss 형식으로 표시
                  const date = new Date(row.created_at);
                  return date.toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  }).replace(/\. /g, '-').replace(/\. /g, '-').replace(/\. /g, ' ');
                } catch (e) {
                  return value || '-';
                }
              }
            };
          }

          return column;
        }));
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length, marketTemplates.size]);

  const loadMarketTemplates = async () => {
    try {
      const response = await fetch('/api/market-templates');
      const result = await response.json();


      if (result.success) {
        const templateMap = new Map<string, any>();
        result.data.forEach((template: any) => {
          templateMap.set(template.market_name.toLowerCase(), template);
        });
        setMarketTemplates(templateMap);
        return templateMap;
      }
    } catch (error) {
      console.error('마켓 템플릿 로드 실패:', error);
    }
    return new Map();
  };

  const loadCouriers = async () => {
    try {
      const response = await fetch('/api/courier-settings');
      const result = await response.json();

      if (result.success) {
        const couriers = result.data.map((c: any) => c.courier_name);
        setCourierList(couriers);
      }
    } catch (error) {
      console.error('택배사 목록 로드 실패:', error);
    }
  };

  const loadCSTypes = async () => {
    try {
      const response = await fetch('/api/cs-types');
      const result = await response.json();

      if (result.success) {
        setCSTypes(result.data.filter((type: any) => type.is_active));
      }
    } catch (error) {
      console.error('CS 유형 목록 로드 실패:', error);
    }
  };

  const loadStandardFields = async () => {
    try {
      const response = await fetch('/api/mapping-settings/fields');
      const result = await response.json();

      if (result.success && result.data) {
        const standardRow = result.data.find((row: any) => row.market_name === '표준필드');

        if (standardRow) {
          // field_N을 실제 DB 컬럼명으로 매핑 (migration 008 기준)
          const fieldToColumnMap = [
            null,                       // 0번 인덱스 (사용 안 함)
            'market_name',              // field_1 - 마켓명
            'sequence_number',          // field_2 - 연번
            'payment_date',             // field_3 - 결제일
            'order_number',             // field_4 - 주문번호
            'buyer_name',               // field_5 - 주문자
            'buyer_phone',              // field_6 - 주문자전화번호
            'recipient_name',           // field_7 - 수령인
            'recipient_phone',          // field_8 - 수령인전화번호
            'recipient_address',        // field_9 - 주소
            'delivery_message',         // field_10 - 배송메세지
            'option_name',              // field_11 - 옵션명
            'quantity',                 // field_12 - 수량
            'market_check',             // field_13 - 마켓
            'confirmation',             // field_14 - 확인
            'special_request',          // field_15 - 특이/요청사항
            'shipping_request_date',    // field_16 - 발송요청일
            'option_code',              // field_17 - 옵션코드 (새로 추가)
            'seller_id',                // field_18 - 셀러ID (이전 field_17)
            'seller_supply_price',      // field_19 - 셀러공급가 (이전 field_18)
            'shipping_source',          // field_20 - 출고처 (이전 field_19)
            'invoice_issuer',           // field_21 - 송장주체 (이전 field_20)
            'vendor_name',              // field_22 - 벤더사 (이전 field_21)
            'shipping_location_name',   // field_23 - 발송지명 (이전 field_22)
            'shipping_location_address', // field_24 - 발송지주소 (이전 field_23)
            'shipping_location_contact', // field_25 - 발송지연락처 (이전 field_24)
            'shipping_cost',            // field_26 - 출고비용 (이전 field_25)
            'settlement_amount',        // field_27 - 정산예정금액 (이전 field_26)
            'settlement_target_amount', // field_28 - 정산대상금액 (이전 field_27)
            'product_amount',           // field_29 - 상품금액 (이전 field_28)
            'final_payment_amount',     // field_30 - 최종결제금액 (이전 field_29)
            'discount_amount',          // field_31 - 할인금액 (이전 field_30)
            'platform_discount',        // field_32 - 마켓부담할인금액 (이전 field_31)
            'seller_discount',          // field_33 - 판매자할인쿠폰할인 (이전 field_32)
            'buyer_coupon_discount',    // field_34 - 구매쿠폰적용금액 (이전 field_33)
            'coupon_discount',          // field_35 - 쿠폰할인금액 (이전 field_34)
            'other_support_discount',   // field_36 - 기타지원금할인금 (이전 field_35)
            'commission_1',             // field_37 - 수수료1 (이전 field_36)
            'commission_2',             // field_38 - 수수료2 (이전 field_37)
            'sell_id',                  // field_39 - 판매아이디 (이전 field_38)
            'separate_shipping',        // field_40 - 분리배송 Y/N (이전 field_39)
            'delivery_fee',             // field_41 - 택배비 (이전 field_40)
            'shipped_date',             // field_42 - 발송일(송장입력일) (이전 field_41)
            'courier_company',          // field_43 - 택배사 (이전 field_42)
            'tracking_number',          // field_44 - 송장번호 (이전 field_43)
            'field_45',                 // field_45 - 추가필드1 (예: 묶음배송번호)
            'field_46',                 // field_46 - 추가필드2
            'field_47',                 // field_47 - 추가필드3
            'field_48',                 // field_48 - 추가필드4
            'field_49',                 // field_49 - 추가필드5
            'field_50',                 // field_50 - 추가필드6
          ];

          const dynamicColumns = [];

          // shipping_status (상태) - 배지 형태
          dynamicColumns.push({
            key: 'shipping_status',
            title: '상태',
            width: 100,
            renderer: (value: any, row: any) => {
              const status = value || '결제완료';
              const statusColors: Record<string, string> = {
                '접수': 'bg-purple-100 text-purple-800',
                '결제완료': 'bg-blue-100 text-blue-800',
                '상품준비중': 'bg-yellow-100 text-yellow-800',
                '발송완료': 'bg-green-100 text-green-800',
                '취소요청': 'bg-orange-100 text-orange-800',
                '취소완료': 'bg-gray-100 text-gray-800',
                '환불완료': 'bg-red-100 text-red-800',
              };
              const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
              return (
                <span className={`px-2 py-0.5 rounded font-medium ${colorClass}`} style={{ fontSize: '13px' }}>
                  {status}
                </span>
              );
            }
          });

          // created_at (주문확정일시) - 시분초 포함
          dynamicColumns.push({
            key: 'created_at',
            title: '주문확정일시',
            width: 150,
            renderer: (value: any) => {
              if (!value) return '';
              const date = new Date(value);
              return date.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).replace(/\. /g, '-').replace('.', '');
            }
          });

          // field_1 ~ field_50 표준 필드 순회 (확장)
          for (let i = 1; i <= 50; i++) {
            // field_4(주문번호) 차례가 되면 먼저 택배사(43), 송장번호(44) 삽입
            if (i === 4) {
              // 택배사(field_43)
              const courierFieldValue = standardRow['field_43'];
              const courierDbColumn = fieldToColumnMap[43];
              if (courierFieldValue && courierFieldValue.trim() && courierDbColumn) {
                dynamicColumns.push({
                  key: courierDbColumn,
                  title: courierFieldValue,
                  width: 100
                });
              }

              // 송장번호(field_44)
              const trackingFieldValue = standardRow['field_44'];
              const trackingDbColumn = fieldToColumnMap[44];
              if (trackingFieldValue && trackingFieldValue.trim() && trackingDbColumn) {
                dynamicColumns.push({
                  key: trackingDbColumn,
                  title: trackingFieldValue,
                  width: 120
                });
              }
            }

            // 43, 44는 이미 주문번호 앞에 추가했으므로 스킵
            if (i === 43 || i === 44) {
              continue;
            }

            const fieldKey = `field_${i}`;
            const fieldValue = standardRow[fieldKey];
            const dbColumn = fieldToColumnMap[i];

            if (fieldValue && fieldValue.trim() && dbColumn) {
              const column: any = {
                key: dbColumn,
                title: fieldValue
              };

              // 특정 필드 너비 설정
              if (i === 3) column.width = 150; // 결제일
              if (i === 4) column.width = 150; // 주문번호
              if (i === 5) column.width = 100; // 주문자
              if (i === 6) column.width = 120; // 주문자전화번호
              if (i === 7) column.width = 100; // 수령인
              if (i === 8) column.width = 120; // 수령인전화번호
              if (i === 9) column.width = 250; // 주소
              if (i === 10) column.width = 120; // 배송메시지
              if (i === 11) column.width = 200; // 옵션명
              if (i === 12) column.width = 40; // 수량

              // field_1 (마켓명) - 마켓 배지 렌더러는 제거 (useEffect에서 처리)
              if (i === 1) {
                column.isMarketColumn = true; // 마커 추가
              }

              // field_3 (결제일) - 시분초 표시 렌더러 (useEffect에서 처리)
              if (i === 3) {
                column.isPaymentDateColumn = true; // 마커 추가
              }

              // field_12 (수량) - 마커 추가 (렌더러는 useEffect에서 처리)
              if (i === 12) {
                column.isQuantityColumn = true; // 마커 추가
              }

              // field_18 (셀러ID) - seller_name 표시
              if (i === 18) {
                column.renderer = (value: any, row: any) => {
                  return <span style={{ fontSize: '13px' }}>{row.seller_name || '-'}</span>;
                };
              }

              dynamicColumns.push(column);
            }
          }

          setColumns(dynamicColumns);
        }
      }
    } catch (error) {
      console.error('표준 필드 로드 실패:', error);
    }
  };

  // ✅ 개선: calculateAllStats 함수 제거 (이제 서버에서 계산)

  // ⚡ React Query: 통계 데이터 조회 (자동 캐싱, 리페치 관리)
  const statsQuery = useQuery({
    queryKey: ['order-stats', filters, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (statusFilter) params.append('shippingStatus', statusFilter);
      else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);


      const response = await fetch(`/api/integrated-orders/stats?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '통계 조회 실패');
      }

      return result.data;
    },
    enabled: false, // 수동 트리거 (fetchOrders에서 호출)
    staleTime: 1000 * 60 * 2, // 2분간 fresh
  });

  // ⚡ React Query: 주문 데이터 조회 (자동 캐싱, 리페치 관리)
  const ordersQuery = useQuery({
    queryKey: ['orders', filters, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (statusFilter) params.append('shippingStatus', statusFilter);
      else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);
      params.append('limit', '10000');


      const response = await fetch(`/api/integrated-orders?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '주문 조회 실패');
      }

      return result.data || [];
    },
    enabled: false, // 수동 트리거
    staleTime: 1000 * 60 * 2, // 2분간 fresh
  });

  // ⚡ React Query의 로딩 상태 통합 (orders 또는 stats 중 하나라도 로딩 중이면 true)
  const loading = ordersQuery.isFetching || statsQuery.isFetching;

  // 🔧 공통 데이터 조회 함수 (중복 제거)
  const fetchData = async (
    targetFilters: SearchFilters,
    targetStatus: string | null,
    logPrefix = '',
    options: { page?: number } = {}
  ) => {
    setIsLoading(true);
    try {
      const { page = 1 } = options;
      const offset = (page - 1) * itemsPerPage;

      // 주문 데이터 조회 함수
      const fetchOrdersData = async () => {
      const params = new URLSearchParams();
      params.append('startDate', targetFilters.startDate);
      params.append('endDate', targetFilters.endDate);
      params.append('dateType', targetFilters.dateType);
      if (targetFilters.marketName) params.append('marketName', targetFilters.marketName);
      if (targetFilters.searchKeyword) params.append('searchKeyword', targetFilters.searchKeyword);
      if (targetStatus) params.append('shippingStatus', targetStatus);
      else if (targetFilters.shippingStatus) params.append('shippingStatus', targetFilters.shippingStatus);
      if (targetFilters.vendorName) params.append('vendorName', targetFilters.vendorName);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/integrated-orders?${params}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || '주문 조회 실패');

      // 페이지네이션 정보 업데이트
      if (result.pagination) {
        setTotalCount(result.pagination.total);
        setTotalPages(Math.ceil(result.pagination.total / itemsPerPage));
      }

      return result.data || [];
    };

    // 통계 데이터 조회 함수
    // ⚠️ 중요: 통계는 항상 전체 데이터 기준으로 집계 (statusFilter 제외)
    // 통계카드는 전체 상태 집계를 보여주고, 테이블만 필터링
    const fetchStatsData = async () => {
      const params = new URLSearchParams();
      params.append('startDate', targetFilters.startDate);
      params.append('endDate', targetFilters.endDate);
      params.append('dateType', targetFilters.dateType);
      if (targetFilters.marketName) params.append('marketName', targetFilters.marketName);
      if (targetFilters.searchKeyword) params.append('searchKeyword', targetFilters.searchKeyword);
      // ✅ targetStatus는 통계에 적용하지 않음 (전체 상태 집계)
      // if (targetStatus) params.append('shippingStatus', targetStatus); // 제거!
      // ✅ targetFilters.shippingStatus도 통계에 적용하지 않음 (전체 상태 집계)
      // if (targetFilters.shippingStatus) params.append('shippingStatus', targetFilters.shippingStatus); // 제거!
      if (targetFilters.vendorName) params.append('vendorName', targetFilters.vendorName);

      const response = await fetch(`/api/integrated-orders/stats?${params}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || '통계 조회 실패');
      return result.data;
    };

      // 주문 + 통계 병렬 조회
      const [ordersData, statsData] = await Promise.all([
        fetchOrdersData(),
        fetchStatsData(),
      ]);

      // 주문 데이터 처리
      setOrders(ordersData);

      // 통계 데이터 처리
      setStats(statsData.stats);
      setVendorStats(statsData.vendorStats);
      setSellerStats(statsData.sellerStats);
      setOptionStats(statsData.optionStats);
    } finally {
      setIsLoading(false);
    }
  };

  // ⚡ React Query를 사용한 데이터 조회 (병렬 처리 + 캐싱)
  // customFilters 파라미터를 받아서 특정 필터로 조회 가능
  const fetchOrders = async (customFilters?: SearchFilters, page: number = 1) => {
    try {
      const targetFilters = customFilters || filters;
      setCurrentPage(page);
      await fetchData(targetFilters, statusFilter, '[React Query]', { page });
    } catch (error) {
      console.error('❌ [React Query] 조회 오류:', error);
      alert('데이터 조회 중 오류가 발생했습니다.');
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchOrders(filters, page);
  };

  // 초기 로드
  useEffect(() => {
    fetchOrders();
  }, []);

  // 날짜 필터 변경 감지 (초기 로드 제외)
  const isFirstDateFilterRender = useRef(true);
  useEffect(() => {
    // 초기 렌더링은 제외
    if (isFirstDateFilterRender.current) {
      isFirstDateFilterRender.current = false;
      return;
    }

    // 날짜 필터가 변경되면 자동 조회
    fetchOrders(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.dateType]);

  // 빠른 날짜 필터 (한국 시간 기준)
  const setQuickDateFilter = async (days: number) => {
    const now = new Date();
    const koreaEndDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const koreaStartDate = new Date(koreaEndDate);

    // days가 -1이면 어제~어제, 아니면 기존 로직 (오늘부터 days일 전까지)
    if (days === -1) {
      // 어제~어제
      koreaStartDate.setDate(koreaStartDate.getDate() - 1);
      koreaEndDate.setDate(koreaEndDate.getDate() - 1);
    } else {
      // 기존 로직: 오늘부터 days일 전까지
      koreaStartDate.setDate(koreaStartDate.getDate() - days);
    }

    const newFilters = {
      ...filters,
      startDate: koreaStartDate.toISOString().split('T')[0],
      endDate: koreaEndDate.toISOString().split('T')[0],
    };

    setFilters(newFilters);

    // ✅ 수정: 업데이트된 필터로 즉시 조회 (상태 업데이트 대기 없이)
    await fetchOrdersWithFilters(newFilters);
  };

  // 특정 필터로 주문 조회 (헬퍼 함수)
  const fetchOrdersWithFilters = async (customFilters: SearchFilters) => {
    // 먼저 필터를 업데이트
    setFilters(customFilters);

    // customFilters를 직접 전달하여 즉시 조회 (상태 업데이트 대기 없이)
    await fetchOrders(customFilters);
  };

  // 선택된 빠른 날짜 필터 확인 (한국 시간 기준)
  const isQuickDateFilterActive = (days: number) => {
    const now = new Date();
    const koreaToday = new Date(now.getTime() + (9 * 60 * 60 * 1000));

    let expectedEnd: string;
    let expectedStart: string;

    if (days === -1) {
      // 어제~어제
      const koreaYesterday = new Date(koreaToday);
      koreaYesterday.setDate(koreaYesterday.getDate() - 1);
      expectedEnd = koreaYesterday.toISOString().split('T')[0];
      expectedStart = koreaYesterday.toISOString().split('T')[0];
    } else {
      // 기존 로직: 오늘부터 days일 전까지
      expectedEnd = koreaToday.toISOString().split('T')[0];
      const koreaStart = new Date(koreaToday);
      koreaStart.setDate(koreaStart.getDate() - days);
      expectedStart = koreaStart.toISOString().split('T')[0];
    }

    return filters.startDate === expectedStart && filters.endDate === expectedEnd;
  };

  // 엑셀 다운로드
  const handleExcelDownload = async () => {
    if (orders.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    const exportData = orders.map((order) => ({
      주문통합일: order.sheet_date,
      마켓명: order.market_name,
      주문번호: order.order_number,
      결제일: order.payment_date || '',
      수취인: order.recipient_name,
      전화번호: order.recipient_phone || '',
      주소: order.recipient_address || '',
      옵션명: order.option_name,
      수량: order.quantity,
      셀러공급가: order.seller_supply_price || '',
      출고처: order.shipping_source || '',
      송장주체: order.invoice_issuer || '',
      벤더사: order.vendor_name || '',
      발송상태: order.shipping_status,
      송장번호: order.tracking_number || '',
      택배사: order.courier_company || '',
      발송일: order.shipped_date || '',
      CS상태: order.cs_status || '',
      메모: order.memo || '',
    }));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('주문조회');

    if (exportData.length > 0) {
      ws.addRow(Object.keys(exportData[0]));
      exportData.forEach(row => ws.addRow(Object.values(row)));
    }

    const fileName = `주문조회_${filters.startDate}_${filters.endDate}.xlsx`;
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // 데이터 저장 핸들러
  const handleSaveData = async (updatedData?: any[]) => {
    try {
      // updatedData가 없거나 비어있으면 리턴
      if (!updatedData || updatedData.length === 0) {
        return;
      }

      // 변경된 데이터만 추출 (id가 있는 것들)
      const updates = updatedData.filter((row) => row.id);

      if (updates.length === 0) {
        return;
      }

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 주문이 수정되었습니다.`);
        fetchOrders(); // 새로고침
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 일괄적용 핸들러 - 선택된 주문에 택배사 적용 (그리드에만 반영, DB 저장은 저장 버튼 클릭 시)
  const handleBulkApply = () => {
    if (!bulkApplyValue.trim()) {
      alert('택배사를 선택해주세요.');
      return;
    }
    if (selectedOrders.length === 0) {
      alert('적용할 주문을 선택해주세요.');
      return;
    }

    // 전체 orders 배열 업데이트 - 완전히 새로운 배열 생성
    const updatedOrders = orders.map(order => {
      if (selectedOrders.includes(order.id)) {
        return {
          ...order,
          courier_company: bulkApplyValue,
        };
      }
      return order;
    });

    // 새 배열로 상태 업데이트 (깜빡임 없이)
    // orders 배열만 업데이트하면 filteredOrders도 자동으로 업데이트됨 (useMemo)
    setOrders(updatedOrders);

    // 선택 유지 (제거: setSelectedOrders([]))
  };

  // 단골고객 등록 핸들러
  const handleRegisterAsRegularCustomer = async () => {
    if (selectedOrders.length === 0) {
      alert('고객으로 등록할 주문을 선택해주세요.');
      return;
    }

    const selectedOrdersList = orders.filter(order => selectedOrders.includes(order.id));

    // 중복 제거 (전화번호 기준)
    const uniqueCustomers = new Map<string, any>();
    selectedOrdersList.forEach(order => {
      if (order.buyer_phone && !uniqueCustomers.has(order.buyer_phone)) {
        uniqueCustomers.set(order.buyer_phone, {
          name: order.buyer_name || order.recipient_name,
          phone: order.buyer_phone,
          recipient_name: order.recipient_name,
          recipient_phone: order.recipient_phone,
          road_address: order.recipient_address,
        });
      }
    });

    if (uniqueCustomers.size === 0) {
      alert('등록할 수 있는 고객 정보가 없습니다.');
      return;
    }

    if (!confirm(`${uniqueCustomers.size}명의 고객을 단골고객으로 등록하시겠습니까?`)) {
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const customerIdMap = new Map<string, string>(); // phone -> customerId

      // Step 1: 고객 등록
      for (const [phone, customerData] of uniqueCustomers) {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...customerData,
            customer_types: ['regular'], // 배열로 전송
          }),
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
          customerIdMap.set(phone, result.data.id); // 생성된 customer ID 저장
        } else {
          errorCount++;
          console.error(`고객 등록 실패 (${phone}):`, result.error);
        }
      }

      // Step 2: 선택된 주문에 customer_id 연결
      if (customerIdMap.size > 0) {
        const ordersToUpdate = selectedOrdersList
          .map(order => {
            if (!order.buyer_phone) return null;
            const customerId = customerIdMap.get(order.buyer_phone);
            return customerId ? { id: order.id, customer_id: customerId } : null;
          })
          .filter((order): order is { id: number; customer_id: string } => order !== null);

        if (ordersToUpdate.length > 0) {
          const updateResponse = await fetch('/api/integrated-orders/bulk', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders: ordersToUpdate }),
          });

          const updateResult = await updateResponse.json();
          if (!updateResult.success) {
            console.error('주문 customer_id 업데이트 실패:', updateResult.error);
          }
        }
      }

      if (successCount > 0) {
        alert(`${successCount}명의 단골고객이 등록되었습니다.${errorCount > 0 ? `\n(${errorCount}명 실패 - 이미 등록된 고객일 수 있습니다)` : ''}`);
        // 데이터 새로고침
        fetchOrders();
      } else {
        alert('고객 등록에 실패했습니다. (이미 등록된 고객일 수 있습니다)');
      }
    } catch (error) {
      console.error('고객 등록 오류:', error);
      alert('고객 등록 중 오류가 발생했습니다.');
    }
  };

  // 마케팅대상고객 등록 핸들러
  const handleRegisterAsMarketingCustomer = async () => {
    if (selectedOrders.length === 0) {
      alert('고객으로 등록할 주문을 선택해주세요.');
      return;
    }

    const selectedOrdersList = orders.filter(order => selectedOrders.includes(order.id));

    // 중복 제거 (전화번호 기준)
    const uniqueCustomers = new Map<string, any>();
    selectedOrdersList.forEach(order => {
      if (order.buyer_phone && !uniqueCustomers.has(order.buyer_phone)) {
        uniqueCustomers.set(order.buyer_phone, {
          name: order.buyer_name || order.recipient_name,
          phone: order.buyer_phone,
        });
      }
    });

    if (uniqueCustomers.size === 0) {
      alert('등록할 수 있는 고객 정보가 없습니다.');
      return;
    }

    if (!confirm(`${uniqueCustomers.size}명의 고객을 마케팅대상고객으로 등록하시겠습니까?`)) {
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const customerIdMap = new Map<string, string>();

      // Step 1: 고객 등록 및 ID 저장
      for (const [phone, customerData] of uniqueCustomers) {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...customerData,
            customer_types: ['marketing'], // 배열로 전송
          }),
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
          customerIdMap.set(phone, result.data.id);
        } else {
          errorCount++;
          console.error(`고객 등록 실패 (${phone}):`, result.error);
        }
      }

      // Step 2: 선택된 주문에 customer_id 연결
      if (customerIdMap.size > 0) {
        const ordersToUpdate = selectedOrdersList
          .map(order => {
            if (!order.buyer_phone) return null;
            const customerId = customerIdMap.get(order.buyer_phone);
            return customerId ? { id: order.id, customer_id: customerId } : null;
          })
          .filter((order): order is { id: number; customer_id: string } => order !== null);

        if (ordersToUpdate.length > 0) {
          const updateResponse = await fetch('/api/integrated-orders/bulk', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders: ordersToUpdate }),
          });

          const updateResult = await updateResponse.json();
          if (!updateResult.success) {
            console.error('주문 customer_id 업데이트 실패:', updateResult.error);
          }
        }
      }

      if (successCount > 0) {
        alert(`${successCount}명의 마케팅대상고객이 등록되었습니다.${errorCount > 0 ? `\n(${errorCount}명 실패 - 이미 등록된 고객일 수 있습니다)` : ''}`);
        // 데이터 새로고침
        fetchOrders();
      } else {
        alert('고객 등록에 실패했습니다. (이미 등록된 고객일 수 있습니다)');
      }
    } catch (error) {
      console.error('고객 등록 오류:', error);
      alert('고객 등록 중 오류가 발생했습니다.');
    }
  };

  // 벤더사 목록 조회
  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/partners?partner_type=벤더사');
      const result = await response.json();

      if (result.success) {
        setVendorList(result.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error('벤더사 조회 오류:', error);
    }
  };

  // 발주확인 핸들러 - 선택된 결제완료 상태 주문을 상품준비중으로 변경
  const handleOrderConfirm = async () => {
    try {
      // 서버에서 현재 필터 조건으로 전체 주문 가져오기
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      params.append('limit', '0'); // 전체 데이터
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (statusFilter) params.append('shippingStatus', statusFilter);
      else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);

      const res = await fetch(`/api/integrated-orders?${params}`);
      const data = await res.json();

      if (!data.success) {
        alert('데이터 조회 실패');
        return;
      }

      const allOrders = data.data || [];

      // 선택된 주문이 있으면 선택된 주문만, 없으면 전체 주문
      const confirmOrders = selectedOrders.length > 0
        ? allOrders.filter((order: Order) => selectedOrders.includes(order.id) && order.shipping_status === '결제완료')
        : allOrders.filter((order: Order) => order.shipping_status === '결제완료');

      if (confirmOrders.length === 0) {
        alert(selectedOrders.length > 0
          ? '선택한 주문 중 결제완료 상태인 주문이 없습니다.'
          : '결제완료 상태인 주문이 없습니다.');
        return;
      }

      // 벤더사가 비어있는 주문 확인
      const ordersWithoutVendor = confirmOrders.filter((order: Order) => !order.vendor_name);

      if (ordersWithoutVendor.length > 0) {
        // 벤더사가 없는 주문이 있으면 모달 표시
        setOrdersNeedingVendor(ordersWithoutVendor);
        await fetchVendors();
        setShowVendorSelectModal(true);
        return;
      }

      // 벤더사가 모두 있으면 바로 처리
      await proceedOrderConfirm(confirmOrders);
    } catch (error) {
      console.error('발주확인 오류:', error);
      alert('발주확인 중 오류가 발생했습니다.');
    }
  };

  // 실제 발주확인 처리
  const proceedOrderConfirm = async (confirmOrders: typeof filteredOrders, vendorName?: string) => {
    if (!confirm(`${confirmOrders.length}개의 주문을 발주확인 하시겠습니까?\n상품준비중 상태로 변경됩니다.`)) {
      return;
    }

    try {
      // shipping_status 업데이트 (벤더사가 지정된 경우 함께 업데이트)
      const updates = confirmOrders.map(order => ({
        id: order.id,
        shipping_status: '상품준비중',
        ...(vendorName && !order.vendor_name ? { vendor_name: vendorName } : {}),
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 주문이 발주확인 처리되었습니다.`);
        setSelectedOrders([]); // 선택 초기화
        setShowVendorSelectModal(false);
        setSelectedVendor('');
        setOrdersNeedingVendor([]);
        fetchOrders();
      } else {
        alert('발주확인 실패: ' + result.error);
      }
    } catch (error) {
      console.error('발주확인 오류:', error);
      alert('발주확인 중 오류가 발생했습니다.');
    }
  };

  // 벤더사 선택 후 발주확인 진행
  const handleVendorSelectConfirm = () => {
    if (!selectedVendor) {
      alert('벤더사를 선택해주세요.');
      return;
    }

    const vendor = vendorList.find(v => v.id === selectedVendor);
    if (!vendor) return;

    proceedOrderConfirm(ordersNeedingVendor, vendor.name);
  };

  // 입금확인 핸들러 - 접수 상태 주문을 결제완료로 변경
  const handlePaymentConfirm = async (orderIds?: number[]) => {
    try {
      // 서버에서 현재 필터 조건으로 전체 주문 가져오기
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      params.append('limit', '0'); // 전체 데이터
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (statusFilter) params.append('shippingStatus', statusFilter);
      else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);

      const res = await fetch(`/api/integrated-orders?${params}`);
      const data = await res.json();

      if (!data.success) {
        alert('데이터 조회 실패');
        return;
      }

      const allOrders = data.data || [];

      // orderIds가 전달되지 않으면 selectedOrders 사용
      const targetOrderIds = Array.isArray(orderIds) ? orderIds : selectedOrders;

      // 접수 상태인 주문만 필터링
      const ordersToConfirm = targetOrderIds.length > 0
        ? allOrders.filter((order: Order) => targetOrderIds.includes(order.id) && order.shipping_status === '접수')
        : allOrders.filter((order: Order) => order.shipping_status === '접수');

      if (ordersToConfirm.length === 0) {
        alert(targetOrderIds.length > 0
          ? '선택한 주문 중 입금확인할 수 있는 주문이 없습니다. (접수 상태만 가능)'
          : '입금확인할 수 있는 주문이 없습니다. (접수 상태만 가능)');
        return;
      }

      if (!confirm(`${ordersToConfirm.length}건의 주문을 입금확인 하시겠습니까?\n상태가 '결제완료'로 변경됩니다.`)) {
        return;
      }


      const ordersToSave = ordersToConfirm.map((order: Order) => ({
        id: order.id,
        shipping_status: '결제완료',
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToSave }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${ordersToConfirm.length}건의 입금확인이 완료되었습니다.`);
        setSelectedOrders([]); // 선택 초기화
        await fetchOrders();
      } else {
        alert(`입금확인 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('입금확인 오류:', error);
      alert('입금확인 중 오류가 발생했습니다.');
    }
  };

  // 한국 시간 구하기 (UTC+9)
  const getKoreanDateTime = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreaTime.toISOString().replace('T', ' ').substring(0, 19);
  };

  const getKoreanDate = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreaTime.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // 송장등록 핸들러 - 택배사, 송장번호, 발송일(송장입력일) DB에 저장
  const handleTrackingRegister = async () => {
    // 선택된 주문 확인
    if (selectedOrders.length === 0) {
      alert('송장을 등록할 주문을 선택해주세요.');
      return;
    }

    // 선택된 주문만 필터링 (orders 배열에서 가져와야 일괄적용 후 최신 데이터 반영됨)
    const selectedOrdersList = orders.filter(order => selectedOrders.includes(order.id));

    // 유효성 검사: 택배사와 송장번호가 모두 입력되었는지 확인
    const invalidOrders = selectedOrdersList.filter(order =>
      !order.courier_company || !order.courier_company.trim() ||
      !order.tracking_number || !order.tracking_number.trim()
    );

    if (invalidOrders.length > 0) {
      const missingFields = invalidOrders.map(order => {
        const missing = [];
        if (!order.courier_company || !order.courier_company.trim()) missing.push('택배사');
        if (!order.tracking_number || !order.tracking_number.trim()) missing.push('송장번호');
        return `  • ${order.order_number || `주문 ID ${order.id}`} - ${missing.join(', ')} 누락`;
      }).slice(0, 5).join('\n');

      alert(`⚠️ 송장 정보 입력 오류\n\n다음 주문의 정보를 입력해주세요:\n\n${missingFields}${invalidOrders.length > 5 ? `\n  • ... 외 ${invalidOrders.length - 5}건 더 있음` : ''}\n\n✓ 택배사와 송장번호를 모두 입력해야 등록할 수 있습니다.`);
      return;
    }

    try {
      // 한국 시간으로 발송일 설정
      const shippedDateTime = getKoreanDateTime();

      // 택배사, 송장번호, 발송일 저장 + 상태를 '발송완료'로 변경
      const ordersToSave = selectedOrdersList.map(order => ({
        id: order.id,
        courier_company: order.courier_company,
        tracking_number: order.tracking_number,
        shipped_date: shippedDateTime, // 발송일(송장입력일) - 현재 날짜와 시간
        shipping_status: '발송완료', // 상태를 발송완료로 변경
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToSave }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${ordersToSave.length}건의 송장이 등록되었습니다.`);

        // DB에서 최신 데이터로 orders 상태 업데이트 (빨간 폰트 해제)
        await fetchOrders();

        // 선택 유지 (제거: setSelectedOrders([]))
      } else {
        alert(`송장 등록 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('송장등록 오류:', error);
      alert('송장 등록 중 오류가 발생했습니다.');
    }
  };

  // 송장수정 핸들러 - 송장등록과 동일한 동작 (발송완료 상태에서만 사용)
  const handleTrackingUpdate = async () => {
    // 선택된 주문 확인
    if (selectedOrders.length === 0) {
      alert('송장을 수정할 주문을 선택해주세요.');
      return;
    }

    // 선택된 주문만 필터링 (orders 배열에서 가져와야 일괄적용 후 최신 데이터 반영됨)
    const selectedOrdersList = orders.filter(order => selectedOrders.includes(order.id));

    // 유효성 검사: 택배사와 송장번호가 모두 입력되었는지 확인
    const invalidOrders = selectedOrdersList.filter(order =>
      !order.courier_company || !order.courier_company.trim() ||
      !order.tracking_number || !order.tracking_number.trim()
    );

    if (invalidOrders.length > 0) {
      const missingFields = invalidOrders.map(order => {
        const missing = [];
        if (!order.courier_company || !order.courier_company.trim()) missing.push('택배사');
        if (!order.tracking_number || !order.tracking_number.trim()) missing.push('송장번호');
        return `  • ${order.order_number || `주문 ID ${order.id}`} - ${missing.join(', ')} 누락`;
      }).slice(0, 5).join('\n');

      alert(`⚠️ 송장 정보 입력 오류\n\n다음 주문의 정보를 입력해주세요:\n\n${missingFields}${invalidOrders.length > 5 ? `\n  • ... 외 ${invalidOrders.length - 5}건 더 있음` : ''}\n\n✓ 택배사와 송장번호를 모두 입력해야 등록할 수 있습니다.`);
      return;
    }

    try {
      // 한국 시간으로 발송일 설정
      const shippedDateTime = getKoreanDateTime();

      // 택배사, 송장번호, 발송일 저장 + 상태를 '발송완료'로 변경
      const ordersToSave = selectedOrdersList.map(order => ({
        id: order.id,
        courier_company: order.courier_company,
        tracking_number: order.tracking_number,
        shipped_date: shippedDateTime, // 발송일(송장입력일) - 현재 날짜와 시간
        shipping_status: '발송완료', // 상태를 발송완료로 변경
      }));


      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToSave }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${ordersToSave.length}건의 송장이 수정되었습니다.`);

        // DB에서 최신 데이터로 orders 상태 업데이트 (빨간 폰트 해제)
        await fetchOrders();

        // 선택 유지 (제거: setSelectedOrders([]))
      } else {
        alert(`송장 수정 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('송장수정 오류:', error);
      alert('송장 수정 중 오류가 발생했습니다.');
    }
  };

  // 송장회수 핸들러 - 선택한 주문의 택배사, 송장번호, 발송일 비우고 상품준비중으로 변경
  const handleTrackingRecall = async () => {
    if (selectedOrders.length === 0) {
      alert('송장을 회수할 주문을 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedOrders.length}개 주문의 송장 정보를 회수하고 상품준비중 상태로 되돌리시겠습니까?`)) {
      return;
    }

    try {

      // 선택된 주문만 필터링 (filteredOrders 사용)
      const selectedOrderList = filteredOrders.filter(order => selectedOrders.includes(order.id));


      if (selectedOrderList.length === 0) {
        alert('선택된 주문을 찾을 수 없습니다.');
        return;
      }

      // 택배사, 송장번호, 발송일 모두 비우고 상태를 상품준비중으로 변경
      const ordersToSave = selectedOrderList.map(order => ({
        id: order.id,
        courier_company: null,
        tracking_number: null,
        shipped_date: null,
        shipping_status: '상품준비중',
      }));


      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToSave }),
      });

      const result = await response.json();

      if (result.success) {
        alert('송장이 회수되었습니다.');
      } else {
        alert(`송장 회수 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('송장회수 오류:', error);
      alert('송장 회수 중 오류가 발생했습니다.');
    }
  };

  // 벤더사별 엑셀 다운로드
  const handleVendorExcelDownload = async (vendorName: string) => {
    try {
      // 서버에서 현재 필터 조건으로 전체 주문 가져오기 (페이지네이션 없이)
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      params.append('limit', '0'); // limit=0으로 전체 데이터 요청
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (statusFilter) params.append('shippingStatus', statusFilter);
      else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);

      const res = await fetch(`/api/integrated-orders?${params}`);
      const data = await res.json();

      if (!data.success) {
        alert('데이터 조회 실패');
        return;
      }

      // 필터된 전체 주문에서 상품준비중 + 해당 벤더사만
      const vendorOrders = (data.data || []).filter(
        (o: Order) => o.shipping_status === '상품준비중' && (o.vendor_name || '미지정') === vendorName
      );

      if (vendorOrders.length === 0) {
        alert('다운로드할 주문이 없습니다.');
        return;
      }
      // 벤더사 템플릿 가져오기
      const response = await fetch(`/api/vendor-templates/${encodeURIComponent(vendorName)}`);
      const result = await response.json();

      let exportData;

      if (result.success && result.data && result.data.columns.length > 0) {
        // 템플릿이 있는 경우: 템플릿에 맞게 데이터 변환
        const template = result.data;

        // order 필드로 컬럼 정렬
        const sortedColumns = [...template.columns].sort((a, b) => (a.order || 0) - (b.order || 0));

        exportData = vendorOrders.map((order: any) => {
          const row: any = {};
          sortedColumns.forEach((col: any) => {
            const fieldType = col.field_type || 'db';

            if (fieldType === 'db') {
              // DB 필드: 실제 값 가져오기
              const value = order[col.db_field];
              row[col.header_name] = value || '';
            } else if (fieldType === 'fixed') {
              // 고정값: 설정된 값 사용
              row[col.header_name] = col.fixed_value || '';
            } else if (fieldType === 'empty') {
              // 빈칸: 빈 문자열
              row[col.header_name] = '';
            }
          });
          return row;
        });
      } else {
        // 템플릿이 없는 경우: 기본 양식 사용
        exportData = vendorOrders.map((order) => ({
          주문번호: order.order_number,
          수취인: order.recipient_name,
          전화번호: order.recipient_phone || '',
          주소: order.recipient_address || '',
          옵션명: order.option_name,
          수량: order.quantity,
          발송상태: order.shipping_status,
          택배사: order.courier_company || '',
          송장번호: order.tracking_number || '',
          발송일: order.shipped_date || '',
        }));
      }

      // ExcelJS를 사용하여 스타일이 적용된 엑셀 생성
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(vendorName);

      if (exportData.length > 0) {
        // 헤더 추가 (템플릿이 있으면 width와 headerColor 사용)
        const headers = Object.keys(exportData[0]);
        if (result.success && result.data && result.data.columns.length > 0) {
          const template = result.data;
          const sortedColumns = [...template.columns].sort((a, b) => (a.order || 0) - (b.order || 0));

          worksheet.columns = headers.map((header, index) => ({
            header: header,
            key: header,
            width: sortedColumns[index]?.width || 20,
          }));

          // 데이터 추가
          exportData.forEach((row: any) => {
            worksheet.addRow(row);
          });

          // 헤더 스타일 적용 (각 칼럼별 색상 적용)
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell, colNumber) => {
            const columnConfig = sortedColumns[colNumber - 1];
            const headerColor = columnConfig?.headerColor || '#4472C4';

            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF' + headerColor.replace('#', '') },
            };
            cell.font = {
              bold: true,
              color: { argb: 'FFFFFFFF' },
            };
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
          });
        } else {
          // 템플릿이 없으면 기본 설정 사용
          worksheet.columns = headers.map(header => ({
            header: header,
            key: header,
            width: 20,
          }));

          // 데이터 추가
          exportData.forEach((row: any) => {
            worksheet.addRow(row);
          });

          // 헤더 스타일 적용 (기본 색상)
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF4472C4' },
            };
            cell.font = {
              bold: true,
              color: { argb: 'FFFFFFFF' },
            };
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
          });
        }

        // 모든 데이터 셀 정렬 (템플릿 설정에 따라)
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // 헤더 제외
            row.eachCell((cell, colNumber) => {
              if (result.success && result.data && result.data.columns.length > 0) {
                const template = result.data;
                const sortedColumns = [...template.columns].sort((a, b) => (a.order || 0) - (b.order || 0));
                const columnConfig = sortedColumns[colNumber - 1];
                const alignment = columnConfig?.alignment || 'center';

                cell.alignment = {
                  horizontal: alignment,
                  vertical: 'middle',
                };
              } else {
                cell.alignment = {
                  horizontal: 'center',
                  vertical: 'middle',
                };
              }
            });
          }
        });
      }

      // 파일 다운로드
      const fileName = `${vendorName}_발송목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 마켓별 송장파일 다운로드
  const handleMarketInvoiceDownload = async (marketName: string) => {

    try {
      // 서버에서 현재 필터 조건으로 전체 주문 가져오기 (페이지네이션 없이)
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      params.append('limit', '0'); // limit=0으로 전체 데이터 요청
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (statusFilter) params.append('shippingStatus', statusFilter);
      else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);

      const res = await fetch(`/api/integrated-orders?${params}`);
      const data = await res.json();

      if (!data.success) {
        alert('데이터 조회 실패');
        return;
      }


      // 필터된 전체 주문에서 발송완료 + 해당 마켓만
      const marketOrders = (data.data || []).filter(
        (o: Order) => o.shipping_status === '발송완료' && (o.market_name || '미지정') === marketName
      );


      if (marketOrders.length === 0) {
        alert('다운로드할 주문이 없습니다.');
        return;
      }

      // 마켓 송장 템플릿 가져오기
      const apiUrl = `/api/market-invoice-templates/${encodeURIComponent(marketName)}`;

      const response = await fetch(apiUrl);
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
              // DB 필드: 실제 값 가져오기
              const value = order[col.db_field];
              row[col.header_name] = value || '';
            } else if (fieldType === 'fixed') {
              // 고정값: 설정된 값 사용
              row[col.header_name] = col.fixed_value || '';
            } else if (fieldType === 'empty') {
              // 빈칸: 빈 문자열
              row[col.header_name] = '';
            }
          });
          return row;
        });

      } else {
        // 템플릿이 없는 경우: 기본 양식 사용
        exportData = marketOrders.map((order) => ({
          주문번호: order.order_number,
          수취인: order.recipient_name,
          전화번호: order.recipient_phone || '',
          주소: order.recipient_address || '',
          택배사: order.courier_company || '',
          송장번호: order.tracking_number || '',
        }));
      }

      // ExcelJS를 사용하여 스타일이 적용된 엑셀 생성
      const workbook = new ExcelJS.Workbook();

      // 템플릿에 시트명이 설정되어 있으면 사용, 없으면 마켓명 사용
      const sheetName = (result.success && result.data?.sheet_name)
        ? result.data.sheet_name
        : marketName;

      const worksheet = workbook.addWorksheet(sheetName);

      if (exportData.length > 0) {
        // 헤더 추가 (템플릿이 있으면 width와 headerColor 사용)
        const headers = Object.keys(exportData[0]);
        if (result.success && result.data && result.data.columns.length > 0) {
          const template = result.data;
          const sortedColumns = [...template.columns].sort((a, b) => (a.order || 0) - (b.order || 0));

          worksheet.columns = headers.map((header, index) => ({
            header: header,
            key: header,
            width: sortedColumns[index]?.width || 20,
          }));

          // 데이터 추가
          exportData.forEach((row: any) => {
            worksheet.addRow(row);
          });

          // 헤더 스타일 적용 (각 칼럼별 색상 적용)
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell, colNumber) => {
            const columnConfig = sortedColumns[colNumber - 1];
            const headerColor = columnConfig?.headerColor || '#4472C4';

            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF' + headerColor.replace('#', '') },
            };
            cell.font = {
              bold: true,
              color: { argb: 'FFFFFFFF' },
            };
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
          });
        } else {
          // 템플릿이 없으면 기본 설정 사용
          worksheet.columns = headers.map(header => ({
            header: header,
            key: header,
            width: 20,
          }));

          // 데이터 추가
          exportData.forEach((row: any) => {
            worksheet.addRow(row);
          });

          // 헤더 스타일 적용 (기본 색상)
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF4472C4' },
            };
            cell.font = {
              bold: true,
              color: { argb: 'FFFFFFFF' },
            };
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
            };
          });
        }

        // 모든 데이터 셀 정렬 (템플릿 설정에 따라)
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // 헤더 제외
            row.eachCell((cell, colNumber) => {
              if (result.success && result.data && result.data.columns.length > 0) {
                const template = result.data;
                const sortedColumns = [...template.columns].sort((a, b) => (a.order || 0) - (b.order || 0));
                const columnConfig = sortedColumns[colNumber - 1];
                const alignment = columnConfig?.alignment || 'center';

                cell.alignment = {
                  horizontal: alignment,
                  vertical: 'middle',
                };
              } else {
                cell.alignment = {
                  horizontal: 'center',
                  vertical: 'middle',
                };
              }
            });
          }
        });
      }

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

  // 마켓 송장 모달을 열 때 전체 데이터 기반으로 마켓별 통계 계산
  const handleOpenMarketInvoiceModal = async () => {
    try {
      // 서버에서 현재 필터 조건으로 전체 주문 가져오기
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      params.append('limit', '0'); // 전체 데이터
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (statusFilter) params.append('shippingStatus', statusFilter);
      else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);

      const res = await fetch(`/api/integrated-orders?${params}`);
      const data = await res.json();

      if (!data.success) {
        alert('데이터 조회 실패');
        return;
      }

      const allOrders = data.data || [];

      // 발송완료 주문만 필터링
      const shippedOrders = allOrders.filter(
        (o: Order) => o.shipping_status === '발송완료'
      );

      // 마켓별 건수 계산
      const marketCountMap = new Map<string, number>();
      shippedOrders.forEach((order: Order) => {
        const marketName = order.market_name || '미지정';
        // CS발송, 전화주문 제외
        if (marketName === 'CS발송' || marketName === '전화주문') {
          return;
        }
        marketCountMap.set(marketName, (marketCountMap.get(marketName) || 0) + 1);
      });

      // 통계 배열로 변환 (건수 많은 순으로 정렬)
      const stats = Array.from(marketCountMap.entries())
        .map(([market, count]) => ({ market, count }))
        .sort((a, b) => b.count - a.count);

      setMarketInvoiceStats(stats);
      setShowMarketInvoiceModal(true);
    } catch (error) {
      console.error('마켓 통계 조회 실패:', error);
      alert('마켓 통계 조회 중 오류가 발생했습니다.');
    }
  };

  // 전체 마켓 일괄 다운로드
  const handleAllMarketInvoiceDownload = async () => {
    try {
      if (marketInvoiceStats.length === 0) {
        alert('다운로드할 마켓이 없습니다.');
        return;
      }

      // 각 마켓별로 다운로드
      for (const stat of marketInvoiceStats) {
        await handleMarketInvoiceDownload(stat.market);
        // 다운로드 사이에 약간의 딜레이 추가 (브라우저가 여러 파일을 처리할 시간 확보)
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      alert(`${marketInvoiceStats.length}개 마켓의 송장파일이 다운로드되었습니다.`);
    } catch (error) {
      console.error('마켓 송장 일괄 다운로드 실패:', error);
      alert('마켓 송장 일괄 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 셀러별 엑셀 다운로드
  const handleSellerExcelDownload = async (sellerId: string) => {
    try {
      // 서버에서 현재 필터 조건으로 전체 주문 가져오기
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      params.append('limit', '0'); // 전체 데이터
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (statusFilter) params.append('shippingStatus', statusFilter);
      else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);

      const res = await fetch(`/api/integrated-orders?${params}`);
      const data = await res.json();

      if (!data.success) {
        alert('데이터 조회 실패');
        return;
      }

      const allOrders = data.data || [];
      const sellerOrders = allOrders.filter((o: Order) => (o.seller_id || '미지정') === sellerId);

      if (sellerOrders.length === 0) {
        alert('다운로드할 주문이 없습니다.');
        return;
      }

      const exportData = sellerOrders.map((order: Order) => ({
        주문번호: order.order_number,
        수취인: order.recipient_name,
        전화번호: order.recipient_phone || '',
        주소: order.recipient_address || '',
        옵션명: order.option_name,
        수량: order.quantity,
        발송상태: order.shipping_status,
        택배사: order.courier_company || '',
        송장번호: order.tracking_number || '',
        발송일: order.shipped_date || '',
      }));

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(sellerId);

      if (exportData.length > 0) {
        ws.addRow(Object.keys(exportData[0]));
        exportData.forEach(row => ws.addRow(Object.values(row)));
      }

      const fileName = `${sellerId}_발송목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('셀러 엑셀 다운로드 실패:', error);
      alert('셀러 엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 송장일괄등록 핸들러
  const handleBulkInvoiceUpload = () => {
    setShowBulkInvoiceModal(true);
    // 모달이 열린 직후 파일 선택 창 자동 열기
    setTimeout(() => {
      bulkInvoiceFileInputRef.current?.click();
    }, 100);
  };

  // 송장일괄등록 엑셀 처리
  const processBulkInvoiceFile = async () => {
    if (!bulkInvoiceFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    try {

      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);
        const worksheet = workbook.worksheets[0];
        const jsonData: any[] = [];
        const headers: any[] = [];
        worksheet.getRow(1).eachCell((cell) => {
          headers.push(cell.value);
        });
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) rowData[header] = cell.value;
          });
          jsonData.push(rowData);
        });


        if (jsonData.length === 0) {
          alert('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // 엑셀 데이터에서 주문번호, 택배사, 송장번호 추출
        const invoiceMap = new Map<string, { courier: string; tracking: string }>();

        jsonData.forEach((row, idx) => {
          const orderNumber = row['주문번호'] || row['order_number'];
          const courier = row['택배사'] || row['courier_company'];
          const tracking = row['송장번호'] || row['운송장번호'] || row['tracking_number'];

          if (orderNumber && courier && tracking) {
            // 주문번호 정규화: 숫자/문자열 상관없이 통일된 형식으로 변환
            let key: string;

            if (typeof orderNumber === 'number') {
              // 숫자형: 지수 표기 방지하고 정수로 변환
              key = orderNumber.toFixed(0);
            } else {
              // 문자열형: 그대로 사용
              key = String(orderNumber).trim();

              // 지수 표기법이 포함된 경우 (e+16 등)
              if (key.includes('e+') || key.includes('E+')) {
                key = Number(orderNumber).toFixed(0);
              }
            }

            if (idx < 3) {
            }

            invoiceMap.set(key, {
              courier: String(courier).trim(),
              tracking: String(tracking).trim(),
            });
          }
        });

        if (invoiceMap.size === 0) {
          alert('유효한 데이터가 없습니다.\n엑셀 파일에 "주문번호", "택배사", "송장번호" 컬럼이 있는지 확인해주세요.');
          return;
        }


        // 서버에서 현재 필터 조건으로 전체 주문 가져오기
        const params = new URLSearchParams();
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
        params.append('dateType', filters.dateType);
        params.append('limit', '0'); // 전체 데이터
        if (filters.marketName) params.append('marketName', filters.marketName);
        if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
        if (statusFilter) params.append('shippingStatus', statusFilter);
        else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
        if (filters.vendorName) params.append('vendorName', filters.vendorName);

        const res = await fetch(`/api/integrated-orders?${params}`);
        const allData = await res.json();

        if (!allData.success) {
          alert('데이터 조회 실패');
          return;
        }

        const allOrders = allData.data || [];

        // 전체 주문 중에서 '상품준비중' 상태인 주문들만 매칭하여 업데이트
        const updates: any[] = [];
        const shippedDateTime = getKoreanDateTime(); // 한국 시간으로 발송일 설정

        const targetOrders = allOrders.filter((order: Order) => order.shipping_status === '상품준비중');


        let matchCount = 0;
        let notMatchCount = 0;

        targetOrders.forEach((order, index) => {
          if (order.order_number) {
            // 주문번호 정규화: 숫자/문자열 상관없이 통일된 형식으로 변환
            let key: string;

            if (typeof order.order_number === 'number') {
              // 숫자형: 지수 표기 방지하고 정수로 변환
              key = order.order_number.toFixed(0);
            } else {
              // 문자열형: 그대로 사용
              key = String(order.order_number).trim();

              // 지수 표기법이 포함된 경우 (e+16 등)
              if (key.includes('e+') || key.includes('E+')) {
                key = Number(order.order_number).toFixed(0);
              }
            }

            if (invoiceMap.has(key)) {
              const invoice = invoiceMap.get(key)!;
              updates.push({
                id: order.id,
                courier_company: invoice.courier,
                tracking_number: invoice.tracking,
                shipped_date: shippedDateTime, // 발송일 자동 설정 (한국 시간)
                shipping_status: '발송완료', // 상태 자동 변경
              });
              matchCount++;
              if (matchCount <= 3) {
              }
            } else {
              notMatchCount++;
              if (notMatchCount <= 3) {
              }
            }
          }
        });



        if (updates.length === 0) {
          alert('매칭되는 주문이 없습니다.');
          return;
        }

        if (!confirm(`${updates.length}개의 주문에 송장 정보를 업데이트하고 발송완료 상태로 변경하시겠습니까?`)) {
          return;
        }

        // DB 업데이트
        const response = await fetch('/api/integrated-orders/bulk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: updates }),
        });

        const result = await response.json();

        if (result.success) {
          alert(`${result.count}개 주문에 송장 정보가 업데이트되었습니다.`);
          setShowBulkInvoiceModal(false);
          setBulkInvoiceFile(null);
          fetchOrders();
        } else {
          alert('업데이트 실패: ' + result.error);
        }
      };

      reader.readAsBinaryString(bulkInvoiceFile);
    } catch (error) {
      console.error('송장일괄등록 오류:', error);
      alert('송장일괄등록 중 오류가 발생했습니다.');
    }
  };

  // 송장일괄수정 핸들러
  const handleBulkInvoiceUpdate = () => {
    setShowBulkInvoiceUpdateModal(true);
    // 모달이 열린 직후 파일 선택 창 자동 열기
    setTimeout(() => {
      bulkInvoiceUpdateFileInputRef.current?.click();
    }, 100);
  };

  // 송장일괄수정 엑셀 처리 (발송완료 상태만 대상)
  const processBulkInvoiceUpdateFile = async () => {
    if (!bulkInvoiceUpdateFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    try {

      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);
        const worksheet = workbook.worksheets[0];
        const jsonData: any[] = [];
        const headers: any[] = [];
        worksheet.getRow(1).eachCell((cell) => {
          headers.push(cell.value);
        });
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) rowData[header] = cell.value;
          });
          jsonData.push(rowData);
        });


        if (jsonData.length === 0) {
          alert('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // 엑셀 데이터에서 주문번호, 택배사, 송장번호 추출
        const invoiceMap = new Map<string, { courier: string; tracking: string }>();

        jsonData.forEach((row, idx) => {
          const orderNumber = row['주문번호'] || row['order_number'];
          const courier = row['택배사'] || row['courier_company'];
          const tracking = row['송장번호'] || row['운송장번호'] || row['tracking_number'];

          if (orderNumber && courier && tracking) {
            // 주문번호 정규화: 숫자/문자열 상관없이 통일된 형식으로 변환
            let key: string;

            if (typeof orderNumber === 'number') {
              // 숫자형: 지수 표기 방지하고 정수로 변환
              key = orderNumber.toFixed(0);
            } else {
              // 문자열형: 그대로 사용
              key = String(orderNumber).trim();

              // 지수 표기법이 포함된 경우 (e+16 등)
              if (key.includes('e+') || key.includes('E+')) {
                key = Number(orderNumber).toFixed(0);
              }
            }

            if (idx < 3) {
            }

            invoiceMap.set(key, {
              courier: String(courier).trim(),
              tracking: String(tracking).trim(),
            });
          }
        });

        if (invoiceMap.size === 0) {
          alert('유효한 데이터가 없습니다.\n엑셀 파일에 "주문번호", "택배사", "송장번호" 컬럼이 있는지 확인해주세요.');
          return;
        }


        // 서버에서 현재 필터 조건으로 전체 주문 가져오기
        const params = new URLSearchParams();
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
        params.append('dateType', filters.dateType);
        params.append('limit', '0'); // 전체 데이터
        if (filters.marketName) params.append('marketName', filters.marketName);
        if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
        if (statusFilter) params.append('shippingStatus', statusFilter);
        else if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
        if (filters.vendorName) params.append('vendorName', filters.vendorName);

        const res = await fetch(`/api/integrated-orders?${params}`);
        const allData = await res.json();

        if (!allData.success) {
          alert('데이터 조회 실패');
          return;
        }

        const allOrders = allData.data || [];

        // 전체 주문 중에서 '발송완료' 상태인 주문들만 매칭하여 업데이트
        const updates: any[] = [];
        const shippedDateTime = getKoreanDateTime(); // 한국 시간으로 발송일 설정

        const targetOrders = allOrders.filter((order: Order) => order.shipping_status === '발송완료');


        let matchCount = 0;
        let notMatchCount = 0;

        targetOrders.forEach((order, index) => {
          if (order.order_number) {
            // 주문번호 정규화: 숫자/문자열 상관없이 통일된 형식으로 변환
            let key: string;

            if (typeof order.order_number === 'number') {
              // 숫자형: 지수 표기 방지하고 정수로 변환
              key = order.order_number.toFixed(0);
            } else {
              // 문자열형: 그대로 사용
              key = String(order.order_number).trim();

              // 지수 표기법이 포함된 경우 (e+16 등)
              if (key.includes('e+') || key.includes('E+')) {
                key = Number(order.order_number).toFixed(0);
              }
            }

            if (invoiceMap.has(key)) {
              const invoice = invoiceMap.get(key)!;
              updates.push({
                id: order.id,
                courier_company: invoice.courier,
                tracking_number: invoice.tracking,
                shipped_date: shippedDateTime, // 발송일 자동 설정 (한국 시간)
                shipping_status: '발송완료', // 상태 유지
              });
              matchCount++;
              if (matchCount <= 3) {
              }
            } else {
              notMatchCount++;
              if (notMatchCount <= 3) {
              }
            }
          }
        });



        if (updates.length === 0) {
          alert('매칭되는 주문이 없습니다.');
          return;
        }

        if (!confirm(`${updates.length}개의 주문에 송장 정보를 수정하시겠습니까?`)) {
          return;
        }

        // DB 업데이트
        const response = await fetch('/api/integrated-orders/bulk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: updates }),
        });

        const result = await response.json();

        if (result.success) {
          alert(`${result.count}개 주문의 송장 정보가 수정되었습니다.`);
          setShowBulkInvoiceUpdateModal(false);
          setBulkInvoiceUpdateFile(null);
          fetchOrders();
        } else {
          alert('업데이트 실패: ' + result.error);
        }
      };

      reader.readAsBinaryString(bulkInvoiceUpdateFile);
    } catch (error) {
      console.error('송장일괄수정 오류:', error);
      alert('송장일괄수정 중 오류가 발생했습니다.');
    }
  };

  // 취소승인 핸들러 - 선택된 취소요청 주문을 취소완료로 변경
  const handleCancelApprove = async () => {
    // 선택된 주문만 필터링
    if (selectedOrders.length === 0) {
      alert('취소승인할 주문을 선택해주세요.');
      return;
    }

    const cancelOrders = filteredOrders
      .filter(order => selectedOrders.includes(order.id))
      .filter(order => order && order.shipping_status === '취소요청');

    if (cancelOrders.length === 0) {
      alert('선택한 주문 중 취소요청 상태인 주문이 없습니다.');
      return;
    }

    if (!confirm(`${cancelOrders.length}개의 주문을 취소승인 하시겠습니까?\n취소완료 상태로 변경됩니다.`)) {
      return;
    }

    try {
      // 한국 시간 생성
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));

      const updates = cancelOrders.map(order => ({
        id: order.id,
        shipping_status: '취소완료',
        canceled_at: koreaTime.toISOString(),
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 주문이 취소승인 처리되었습니다.`);
        setSelectedOrders([]); // 선택 초기화
        fetchOrders();
      } else {
        alert('취소승인 실패: ' + result.error);
      }
    } catch (error) {
      console.error('취소승인 오류:', error);
      alert('취소승인 중 오류가 발생했습니다.');
    }
  };

  // 취소반려 핸들러 - 선택된 취소요청 주문을 상품준비중으로 변경
  const handleCancelReject = async () => {
    // 선택된 주문만 필터링
    if (selectedOrders.length === 0) {
      alert('취소반려할 주문을 선택해주세요.');
      return;
    }

    const rejectOrders = filteredOrders
      .filter(order => selectedOrders.includes(order.id))
      .filter(order => order && order.shipping_status === '취소요청');

    if (rejectOrders.length === 0) {
      alert('선택한 주문 중 취소요청 상태인 주문이 없습니다.');
      return;
    }

    if (!confirm(`${rejectOrders.length}개의 주문을 취소반려 하시겠습니까?\n상품준비중 상태로 변경됩니다.`)) {
      return;
    }

    try {
      const updates = rejectOrders.map(order => ({
        id: order.id,
        shipping_status: '상품준비중',
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 주문이 취소반려 처리되었습니다. 상품준비중 상태로 변경되었습니다.`);
        setSelectedOrders([]); // 선택 초기화
        fetchOrders();
      } else {
        alert('취소반려 실패: ' + result.error);
      }
    } catch (error) {
      console.error('취소반려 오류:', error);
      alert('취소반려 중 오류가 발생했습니다.');
    }
  };

  // 옵션명으로 매핑 정보 가져오기
  const fetchMappingByOptionName = async (optionName: string) => {
    try {
      const response = await fetch(`/api/option-products?option_name=${encodeURIComponent(optionName)}`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const mapping = result.data[0];
        return {
          seller_supply_price: mapping.seller_supply_price || '',
          shipping_source: mapping.shipping_source || '',
          invoice_issuer: mapping.invoice_issuer || '',
          vendor_name: mapping.vendor_name || '',
          shipping_location_name: mapping.shipping_location_name || '',
          shipping_location_address: mapping.shipping_location_address || '',
          shipping_location_contact: mapping.shipping_location_contact || '',
          shipping_cost: mapping.shipping_cost || '',
        };
      }
      return null;
    } catch (error) {
      console.error('옵션명 매핑 조회 실패:', error);
      return null;
    }
  };

  // CS 접수 제출 핸들러
  // CS 모달 엔터키 핸들러 (입력란에서 빠져나오기)
  const handleCSKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // 현재 input에서 blur 처리
      const target = e.target as HTMLInputElement;
      target.blur();
    }
  };

  const handleCSSubmit = async () => {
    // 필수 필드 확인
    if (!csFormData.category) {
      alert('CS구분을 선택해주세요.');
      return;
    }
    if (!csFormData.content) {
      alert('CS 내용을 입력해주세요.');
      return;
    }
    if (!csFormData.solution) {
      alert('해결방법을 선택해주세요.');
      return;
    }
    if (csFormData.solution === 'other_action' && !csFormData.otherSolution) {
      alert('기타 조치 내용을 입력해주세요.');
      return;
    }

    const selectedOrder = filteredOrders.find(order => order.id === selectedOrders[0]);
    if (!selectedOrder) {
      alert('선택된 주문을 찾을 수 없습니다.');
      return;
    }

    try {
      // 0. CS 기록 중복 검증
      const duplicateCheckResponse = await fetch(
        `/api/cs-records?orderNumber=${encodeURIComponent(selectedOrder.order_number)}`
      );
      const duplicateCheckResult = await duplicateCheckResponse.json();

      if (duplicateCheckResult.success && duplicateCheckResult.data && duplicateCheckResult.data.length > 0) {
        const existingCS = duplicateCheckResult.data[0];
        const confirmMessage = `⚠️ 이미 CS 접수된 주문입니다.\n\n` +
          `접수일: ${existingCS.receipt_date}\n` +
          `CS구분: ${existingCS.cs_reason || '-'}\n` +
          `해결방법: ${existingCS.resolution_method || '-'}\n` +
          `처리상태: ${existingCS.status || '-'}\n\n` +
          `그래도 중복 등록하시겠습니까?`;

        if (!confirm(confirmMessage)) {
          return;
        }
      } else {
      }

      // 1. CS 기록 저장
      const csRecordData = {
        receipt_date: new Date().toISOString().split('T')[0], // 오늘 날짜
        cs_type: csFormData.category,
        resolution_method: csFormData.solution === 'other_action' ? csFormData.otherSolution : csFormData.solution,
        order_number: selectedOrder.order_number || '',
        market_name: selectedOrder.market_name || '',
        orderer_name: selectedOrder.buyer_name || '',
        recipient_name: selectedOrder.recipient_name || '',
        recipient_phone: selectedOrder.recipient_phone || '',
        recipient_address: selectedOrder.recipient_address || '',
        option_name: selectedOrder.option_name || '',
        quantity: selectedOrder.quantity || 0,
        cs_reason: csFormData.category,
        cs_content: csFormData.content,
        status: '접수',
        // 환불 정보 (부분환불일 경우)
        refund_amount: csFormData.solution === 'partial_refund' ? csFormData.refundAmount : null,
        // 재발송 정보 (재발송일 경우)
        resend_option: (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') ? csFormData.resendOption : null,
        resend_quantity: (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') ? csFormData.resendQty : null,
        resend_receiver: (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') ? csFormData.receiver : null,
        resend_phone: (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') ? csFormData.phone : null,
        resend_address: (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') ? csFormData.address : null,
        resend_note: (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') ? csFormData.resendNote : null,
        additional_amount: (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') ? csFormData.additionalAmount : null,
        // 부분환불 계좌 정보
        bank_name: csFormData.solution === 'partial_refund' ? csFormData.bank : null,
        account_holder: csFormData.solution === 'partial_refund' ? csFormData.accountHolder : null,
        account_number: csFormData.solution === 'partial_refund' ? csFormData.accountNumber : null,
      };


      const csResponse = await fetch('/api/cs-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(csRecordData),
      });


      const csResult = await csResponse.json();


      if (!csResult.success) {
        console.error('❌ CS 기록 저장 실패 상세:', csResult);
        console.error('❌ 에러 메시지:', csResult.error);
        alert('CS 기록 저장 실패: ' + (csResult.error || 'Unknown error'));
        return;
      }

      // 2. 재발송일 경우 새로운 주문 생성
      if (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') {
        // CS 주문번호 생성: CS+접수일시(YYYYMMDDHHmmss)+001
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const csOrderNumber = `CS${year}${month}${day}${hours}${minutes}${seconds}001`;

        // 옵션명 (서버에서 자동 매핑됨)
        const optionName = csFormData.resendOption || selectedOrder.option_name;

        // 새 주문 데이터 생성 (한국 시간 기준)
        // ✅ 옵션명만 전달하면 서버(/api/integrated-orders POST)에서 자동으로 공급단가, 발송정보 등을 매핑함
        const koreanDate = getKoreanDate();
        const newOrderData = {
          sheet_date: koreanDate,
          market_name: 'CS발송',
          order_number: csOrderNumber,
          recipient_name: csFormData.receiver || selectedOrder.recipient_name,
          recipient_phone: csFormData.phone || selectedOrder.recipient_phone,
          recipient_address: csFormData.address || selectedOrder.recipient_address,
          delivery_message: csFormData.resendNote || '',
          option_name: optionName, // ✅ 이 옵션명 기준으로 서버에서 자동 매핑됨
          quantity: csFormData.resendQty || selectedOrder.quantity,
          shipping_status: '접수',
          memo: `원주문: ${selectedOrder.order_number} / CS유형: ${csFormData.category}`,
          // 주문자 정보 추가
          buyer_name: selectedOrder.buyer_name,
          buyer_phone: selectedOrder.buyer_phone,
          // 추가금액을 정산예정금액에 저장
          settlement_amount: csFormData.additionalAmount || null,
          // 발송요청일과 CS유형(해결방법) 추가
          shipping_request_date: csFormData.requestDate || null,
          cs_type: csFormData.solution || null,
        };


        // 주문 생성 API 호출
        const createOrderResponse = await fetch('/api/integrated-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrderData),
        });


        const createOrderResult = await createOrderResponse.json();


        if (!createOrderResult.success) {
          alert('재발송 주문 생성 실패: ' + createOrderResult.error);
          return;
        }

      }

      // 3. 원주문의 cs_status 업데이트
      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: [{
            id: selectedOrder.id,
            cs_status: csFormData.category
          }]
        }),
      });

      const result = await response.json();

      if (result.success) {
        const message = (csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend')
          ? 'CS접수가 완료되었습니다.\n재발송 주문이 생성되었습니다.'
          : 'CS접수가 완료되었습니다.';
        alert(message);
        setShowCSModal(false);
        setSelectedOrders([]);
        // 폼 초기화
        setCSFormData(initialCSFormData);
        fetchOrders();
      } else {
        alert('CS접수 실패: ' + result.error);
      }
    } catch (error) {
      console.error('CS접수 오류:', error);
      alert('CS접수 중 오류가 발생했습니다.');
    }
  };

  // 환불금액 계산
  const calculateRefundAmount = () => {
    const amount = csFormData.paymentAmount * (csFormData.refundPercent / 100);
    setCSFormData(prev => ({ ...prev, refundAmount: Math.floor(amount) }));
  };

  // 추가주문 제출 핸들러
  const handleAdditionalOrderSubmit = async () => {
    if (!additionalOrderData.option_name) {
      alert('옵션명을 입력해주세요.');
      return;
    }
    if (!additionalOrderData.recipient_name) {
      alert('수령인을 입력해주세요.');
      return;
    }

    try {
      // 추가 주문번호 생성: ADD+접수일시(YYYYMMDDHHmmss)+001
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const additionalOrderNumber = `ADD${year}${month}${day}${hours}${minutes}${seconds}001`;

      // 옵션명으로 매핑 정보 가져오기
      const mappingData = await fetchMappingByOptionName(additionalOrderData.option_name);

      // 새 주문 데이터 생성 (한국 시간 기준)
      const koreanDate = getKoreanDate();
      const newOrderData = {
        sheet_date: koreanDate,
        market_name: additionalOrderData.market_name || '추가주문',
        order_number: additionalOrderNumber,
        payment_date: koreanDate,
        recipient_name: additionalOrderData.recipient_name,
        recipient_phone: additionalOrderData.recipient_phone,
        recipient_address: additionalOrderData.recipient_address,
        delivery_message: additionalOrderData.delivery_message,
        option_name: additionalOrderData.option_name,
        quantity: additionalOrderData.quantity || 1,
        shipping_status: '접수',
        shipping_request_date: additionalOrderData.shipping_request_date || null,
        memo: `원주문: ${additionalOrderData.original_order_number}`,
        // 옵션명 기준 자동 매핑
        seller_supply_price: mappingData?.seller_supply_price || '',
        shipping_source: mappingData?.shipping_source || '',
        invoice_issuer: mappingData?.invoice_issuer || '',
        vendor_name: mappingData?.vendor_name || '',
        shipping_location_name: mappingData?.shipping_location_name || '',
        shipping_location_address: mappingData?.shipping_location_address || '',
        shipping_location_contact: mappingData?.shipping_location_contact || '',
        shipping_cost: mappingData?.shipping_cost || '',
      };

      // 주문 생성 API 호출
      const response = await fetch('/api/integrated-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderData),
      });

      const result = await response.json();

      if (result.success) {
        alert('추가주문이 등록되었습니다.');
        setShowAdditionalOrderModal(false);
        setAdditionalOrderData({});
        fetchOrders();
      } else {
        alert('추가주문 등록 실패: ' + result.error);
      }
    } catch (error) {
      console.error('추가주문 등록 오류:', error);
      alert('추가주문 등록 중 오류가 발생했습니다.');
    }
  };

  // 셀러별 입금확인 토글 핸들러
  const handlePaymentCheckToggle = async (sellerId: string) => {
    const currentStat = sellerStats.find(s => s.seller_id === sellerId);
    if (!currentStat) return;

    const newCheckState = !currentStat.입금확인;

    // ON으로 전환할 때만 주문 상태 변경
    if (newCheckState) {
      // 해당 셀러의 접수 상태 주문들을 필터링
      const sellerOrders = orders.filter(order => {
        const orderSellerId = order.seller_id || '미지정';
        const status = order.shipping_status || '결제완료';
        return orderSellerId === sellerId && status === '접수';
      });

      if (sellerOrders.length === 0) {
        alert('해당 셀러의 접수 상태 주문이 없습니다.');
        return;
      }

      if (!confirm(`${sellerId}의 접수 상태 주문 ${sellerOrders.length}건을 결제완료로 변경하시겠습니까?`)) {
        return;
      }

      try {
        // UTC 시간으로 타임스탬프 저장 (DB는 TIMESTAMPTZ)
        const now = new Date().toISOString();

        // 상태를 결제완료로 변경하고 payment_confirmed_at 타임스탬프 저장
        const updatedOrders = sellerOrders.map(order => ({
          ...order,
          shipping_status: '결제완료',
          payment_confirmed_at: now
        }));

        const response = await fetch('/api/integrated-orders/bulk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: updatedOrders }),
        });

        const result = await response.json();

        if (result.success) {
          // 토글 상태 변경
          setSellerStats(prev =>
            prev.map(stat =>
              stat.seller_id === sellerId
                ? { ...stat, 입금확인: true }
                : stat
            )
          );
          alert(`${result.count}건의 주문이 결제완료로 변경되었습니다.`);
          fetchOrders(); // 주문 목록 새로고침
        } else {
          alert('상태 변경 실패: ' + result.error);
        }
      } catch (error) {
        console.error('입금확인 처리 오류:', error);
        alert('입금확인 처리 중 오류가 발생했습니다.');
      }
    } else {
      // ON -> OFF: 결제완료 상태 주문들을 접수로 되돌림
      const sellerOrders = orders.filter(order => {
        const orderSellerId = order.seller_id || '미지정';
        const status = order.shipping_status || '결제완료';
        return orderSellerId === sellerId && status === '결제완료';
      });

      if (sellerOrders.length === 0) {
        alert('해당 셀러의 결제완료 상태 주문이 없습니다.');
        return;
      }

      if (!confirm(`${sellerId}의 결제완료 상태 주문 ${sellerOrders.length}건을 접수로 되돌리시겠습니까?`)) {
        return;
      }

      try {
        // 상태를 접수로 변경하고 payment_confirmed_at 타임스탬프 제거
        const updatedOrders = sellerOrders.map(order => ({
          ...order,
          shipping_status: '접수',
          payment_confirmed_at: null
        }));

        const response = await fetch('/api/integrated-orders/bulk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: updatedOrders }),
        });

        const result = await response.json();

        if (result.success) {
          // 토글 상태 변경
          setSellerStats(prev =>
            prev.map(stat =>
              stat.seller_id === sellerId
                ? { ...stat, 입금확인: false }
                : stat
            )
          );
          alert(`${result.count}건의 주문이 접수로 변경되었습니다.`);
          fetchOrders(); // 주문 목록 새로고침
        } else {
          alert('상태 변경 실패: ' + result.error);
        }
      } catch (error) {
        console.error('입금확인 취소 처리 오류:', error);
        alert('입금확인 취소 처리 중 오류가 발생했습니다.');
      }
    }
  };

  // 환불완료 버튼 클릭 핸들러
  const handleRefundComplete = async (sellerId: string) => {
    // 해당 셀러의 취소요청 상태 주문들 필터링
    const sellerRefundOrders = orders.filter(order => {
      const orderSellerId = order.seller_id || '미지정';
      const status = order.shipping_status || '결제완료';
      return orderSellerId === sellerId && status === '취소요청';
    });

    if (sellerRefundOrders.length === 0) {
      alert('해당 셀러의 취소요청 상태 주문이 없습니다.');
      return;
    }

    if (!confirm(`${sellerId}의 취소요청 주문 ${sellerRefundOrders.length}건에 대해 환불처리를 완료하시겠습니까?`)) {
      return;
    }

    try {
      // 한국 시간 생성
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const koreaTimeISO = koreaTime.toISOString();
      const formattedDateTime = koreaTimeISO.slice(0, 16).replace('T', ' ');

      // refund_processed_at 타임스탬프 저장
      const updatedOrders = sellerRefundOrders.map(order => ({
        ...order,
        refund_processed_at: koreaTimeISO
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updatedOrders }),
      });

      const result = await response.json();

      if (result.success) {
        // UI 상태 업데이트
        setSellerStats(prev =>
          prev.map(stat =>
            stat.seller_id === sellerId
              ? { ...stat, 환불처리일시: formattedDateTime }
              : stat
          )
        );
        alert(`${result.count}건의 주문에 대해 환불처리가 완료되었습니다.`);
        fetchOrders(); // 주문 목록 새로고침
      } else {
        alert('환불처리 실패: ' + result.error);
      }
    } catch (error) {
      console.error('환불처리 오류:', error);
      alert('환불처리 중 오류가 발생했습니다.');
    }
  };

  // 상태 카드 클릭 핸들러 (개선: 클릭 시 데이터 재조회)
  const handleStatusCardClick = async (status: string | null) => {
    const newStatus = statusFilter === status ? null : status;
    setStatusFilter(newStatus);

    // statusFilter를 즉시 반영하여 조회 (현재 filters + 새로운 statusFilter)
    await fetchOrdersWithStatus(newStatus);
  };

  // statusFilter를 파라미터로 받아서 조회하는 헬퍼 함수
  const fetchOrdersWithStatus = async (targetStatus: string | null) => {
    try {
      await fetchData(filters, targetStatus, '[Status Card]');
    } catch (error) {
      console.error('❌ [Status Card] 조회 오류:', error);
      alert('데이터 조회 중 오류가 발생했습니다.');
    }
  };

  // 필터링된 주문 데이터 (개선: 서버에서 이미 필터링됨, 클라이언트는 정렬만)
  const filteredOrders = useMemo(() => {
    // ✅ 개선: 모든 필터링은 서버에서 처리되므로 클라이언트는 정렬만 수행
    // 정렬: 마켓 칼럼(field_13) 순서 (마켓이니셜+세자리연번)
    return orders.sort((a, b) => {
      const field13A = a.field_13 || '';
      const field13B = b.field_13 || '';
      return field13A.localeCompare(field13B);
    });
  }, [orders]);

  // 드롭다운 옵션 추출 (테이블 데이터 기준)
  const uniqueMarkets = useMemo(() => {
    const markets = new Set<string>();
    orders.forEach(order => {
      if (order.market_name) {
        markets.add(order.market_name);
      }
    });
    return Array.from(markets).sort();
  }, [orders]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    orders.forEach(order => {
      if (order.shipping_status) {
        statuses.add(order.shipping_status);
      }
    });
    return Array.from(statuses).sort();
  }, [orders]);

  const uniqueVendors = useMemo(() => {
    const vendors = new Set<string>();
    // 현재 필터된 주문(화면에 보이는 것)에서만 벤더사 목록 추출
    filteredOrders.forEach(order => {
      if (order.vendor_name) {
        vendors.add(order.vendor_name);
      }
    });
    return Array.from(vendors).sort();
  }, [filteredOrders]);

  // 행 삭제 핸들러 (소프트 삭제)
  const handleDeleteRows = (indices: number[]) => {
    // 인덱스로 실제 주문 데이터 가져오기
    const rowsToDelete = indices.map(index => filteredOrders[index]);
    setOrdersToDelete(rowsToDelete);
    setShowDeleteConfirmModal(true);
  };

  // 삭제 확인 후 실제 삭제 실행
  const executeDelete = async () => {
    setShowDeleteConfirmModal(false);

    try {
      const ids = ordersToDelete.map((row) => row.id).filter((id) => id);

      const response = await fetch('/api/integrated-orders/soft-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      const result = await response.json();

      if (result.success) {
        setDeleteResult({ count: result.count });
        setShowDeleteResultModal(true);
        fetchOrders(); // 새로고침
      } else {
        alert('삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 완전 삭제 핸들러 (접수 상태만)
  const handleHardDelete = async () => {
    if (selectedOrders.length === 0) {
      alert('삭제할 주문을 선택해주세요.');
      return;
    }

    // 선택된 주문들이 모두 접수 상태인지 확인
    const selectedOrderData = filteredOrders.filter(order => selectedOrders.includes(order.id));
    const nonRegisteredOrders = selectedOrderData.filter(order => order.shipping_status !== '접수');

    if (nonRegisteredOrders.length > 0) {
      alert('접수 상태가 아닌 주문은 완전 삭제할 수 없습니다.');
      return;
    }

    const confirmed = confirm(
      `선택한 ${selectedOrders.length}건의 주문을 DB에서 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/integrated-orders/hard-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedOrders }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}건의 주문이 완전히 삭제되었습니다.`);
        setSelectedOrders([]);
        fetchOrders(); // 새로고침
      } else {
        alert('완전 삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('완전 삭제 오류:', error);
      alert('완전 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* 전역 로딩 오버레이 (통계 카드 + 필터 영역) */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4 pointer-events-auto">
            <RefreshCw className="w-12 h-12 animate-spin text-blue-600" />
            <div className="text-xl font-bold text-gray-900">주문 데이터 로딩중...</div>
            <div className="text-sm text-gray-600">잠시만 기다려주세요</div>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className={isLoading ? 'pointer-events-none opacity-70' : ''}>
        <OrderStatistics
          stats={stats}
          statusFilter={statusFilter}
          onStatusClick={handleStatusCardClick}
          onPreparingButtonClick={() => setShowPreparingSummary(true)}
        />
      </div>

      {/* 벤더사별/셀러별 테이블 */}
      <div className={isLoading ? 'pointer-events-none opacity-70' : ''}>
        <VendorSellerStats
          vendorStats={vendorStats}
          sellerStats={sellerStats}
          onVendorExcelDownload={handleVendorExcelDownload}
          onPaymentCheckToggle={handlePaymentCheckToggle}
          onRefundComplete={handleRefundComplete}
        />
      </div>

      {/* 검색 필터 */}
      <div className={isLoading ? 'pointer-events-none opacity-70' : ''}>
        <OrderFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={fetchOrders}
          onQuickDateFilter={setQuickDateFilter}
          uniqueMarkets={uniqueMarkets}
          uniqueStatuses={uniqueStatuses}
          uniqueVendors={uniqueVendors}
          isQuickDateFilterActive={isQuickDateFilterActive}
        />
      </div>

      {/* EditableAdminGrid */}
      {columns.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">칼럼 로딩중...</span>
        </div>
      ) : (
        <div ref={tableContainerRef} className={`relative ${isLoading ? 'pointer-events-none opacity-70' : ''}`}>
            <EditableAdminGrid
              columns={columns}
              data={filteredOrders}
              startIndex={(currentPage - 1) * itemsPerPage}
              onDataChange={(newData) => {
                // filteredOrders 기반으로 변경된 데이터를 orders 전체에 반영
                const updatedOrders = orders.map(order => {
                  const updatedOrder = newData.find(n => n.id === order.id);
                  return updatedOrder || order;
                });
                setOrders(updatedOrders);
              }}
              onSave={handleSaveData}
              onDeleteSelected={handleDeleteRows}
              onSelectionChange={(selectedIndices) => {
                // 선택된 행 인덱스를 실제 주문 ID로 변환
                const selectedIds = Array.from(selectedIndices).map(index => {
                  const order = filteredOrders[index];
                  return order?.id;
                }).filter(id => id !== undefined);
                setSelectedOrders(selectedIds);
              }}
              enableCSVExport={true}
              enableCSVImport={false}
              enableAddRow={false}
              enableDelete={false}
              enableCopy={false}
              customActions={
                <OrderActionButtons
                  statusFilter={statusFilter}
                  selectedOrders={selectedOrders}
                  filteredOrders={filteredOrders}
                  bulkApplyValue={bulkApplyValue}
                  courierList={courierList}
                  orders={orders}
                  onPaymentConfirm={handlePaymentConfirm}
                  onOrderConfirm={handleOrderConfirm}
                  onCancelApprove={handleCancelApprove}
                  onCancelReject={handleCancelReject}
                  onCSModal={() => setShowCSModal(true)}
                  onAdditionalOrderModal={(orderData) => {
                    setAdditionalOrderData(orderData);
                    setShowAdditionalOrderModal(true);
                  }}
                  onBulkApplyChange={setBulkApplyValue}
                  onBulkApply={handleBulkApply}
                  onTrackingRegister={handleTrackingRegister}
                  onTrackingUpdate={handleTrackingUpdate}
                  onTrackingRecall={handleTrackingRecall}
                  onBulkInvoiceUpload={handleBulkInvoiceUpload}
                  onBulkInvoiceUpdate={handleBulkInvoiceUpdate}
                  onVendorFileModal={() => setShowVendorFileModal(true)}
                  onMarketInvoiceModal={handleOpenMarketInvoiceModal}
                  onRegisterAsRegularCustomer={handleRegisterAsRegularCustomer}
                  onRegisterAsMarketingCustomer={handleRegisterAsMarketingCustomer}
                  onHardDelete={handleHardDelete}
                />
              }
            />

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 py-3">
                {/* 이전 페이지 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {/* 페이지 번호들 */}
                {(() => {
                  const pages = [];
                  const maxVisible = 10;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                  // startPage 조정
                  if (endPage - startPage + 1 < maxVisible) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  // 첫 페이지
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="dots1" className="px-1 text-xs">...</span>);
                    }
                  }

                  // 중간 페이지들
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-2 py-0.5 text-xs border rounded ${
                          i === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // 마지막 페이지
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="dots2" className="px-1 text-xs">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}

                {/* 다음 페이지 */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>

                {/* 페이지 정보 */}
                <span className="ml-3 text-xs text-gray-600">
                  {currentPage} / {totalPages} 페이지 (총 {totalCount.toLocaleString()}건)
                </span>
              </div>
            )}
          </div>
        )
      }

      {/* 옵션별 집계 테이블 */}
      <OptionStatsTable optionStats={optionStats} />

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title={`삭제 확인 (${ordersToDelete.length}건)`}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowDeleteConfirmModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={executeDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              삭제
            </button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">마켓명</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">주문번호</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">주문자</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">옵션명</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">수량</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersToDelete.map((order, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{order.market_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{order.order_number}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{order.recipient_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{order.option_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{order.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* 송장일괄등록 모달 */}
      <Modal
        isOpen={showBulkInvoiceModal}
        onClose={() => {
          setShowBulkInvoiceModal(false);
          setBulkInvoiceFile(null);
        }}
        title="송장일괄등록"
        description="엑셀 파일에 다음 컬럼이 포함되어야 합니다: 주문번호, 택배사, 송장번호 (또는 운송장번호)"
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                setShowBulkInvoiceModal(false);
                setBulkInvoiceFile(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={processBulkInvoiceFile}
              disabled={!bulkInvoiceFile}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
            >
              등록
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            엑셀 파일 선택
          </label>
          <input
            ref={bulkInvoiceFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setBulkInvoiceFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          {bulkInvoiceFile && (
            <p className="mt-2 text-sm text-gray-600">
              선택된 파일: {bulkInvoiceFile.name}
            </p>
          )}
        </div>
      </Modal>

      {/* 송장일괄수정 모달 */}
      <Modal
        isOpen={showBulkInvoiceUpdateModal}
        onClose={() => {
          setShowBulkInvoiceUpdateModal(false);
          setBulkInvoiceUpdateFile(null);
        }}
        title="송장일괄수정"
        description="엑셀 파일에 다음 컬럼이 포함되어야 합니다: 주문번호, 택배사, 송장번호 (또는 운송장번호)"
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                setShowBulkInvoiceUpdateModal(false);
                setBulkInvoiceUpdateFile(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={processBulkInvoiceUpdateFile}
              disabled={!bulkInvoiceUpdateFile}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            >
              수정
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            엑셀 파일 선택
          </label>
          <input
            ref={bulkInvoiceUpdateFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setBulkInvoiceUpdateFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          {bulkInvoiceUpdateFile && (
            <p className="mt-2 text-sm text-gray-600">
              선택된 파일: {bulkInvoiceUpdateFile.name}
            </p>
          )}
        </div>
      </Modal>

      {/* 삭제 결과 모달 */}
      <Modal
        isOpen={showDeleteResultModal}
        onClose={() => setShowDeleteResultModal(false)}
        title="삭제 완료"
        size="sm"
        footer={
          <button
            onClick={() => setShowDeleteResultModal(false)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        }
      >
        <p className="text-gray-700">
          총 <span className="font-semibold text-blue-600">{deleteResult.count}건</span>의 주문이 삭제되었습니다.
        </p>
      </Modal>

      {/* CS 접수 모달 */}
      <Modal
        isOpen={showCSModal}
        onClose={() => {
          setShowCSModal(false);
          setCSFormData(initialCSFormData);
        }}
        title="CS 접수"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setShowCSModal(false);
                setCSFormData(initialCSFormData);
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleCSSubmit}
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
            >
              접수
            </button>
          </>
        }
      >
        <div>
              {/* 주문 정보 */}
              {selectedOrders.length > 0 && (() => {
                const selectedOrder = filteredOrders.find(order => order.id === selectedOrders[0]);
                return selectedOrder ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">주문번호:</span>
                        <span className="ml-2 font-medium">{selectedOrder.order_number || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">주문자:</span>
                        <span className="ml-2 font-medium">{selectedOrder.buyer_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">주문자전화번호:</span>
                        <span className="ml-2 font-medium">{selectedOrder.buyer_phone || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">수령인:</span>
                        <span className="ml-2 font-medium">{selectedOrder.recipient_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">수령인전화번호:</span>
                        <span className="ml-2 font-medium">{selectedOrder.recipient_phone || '-'}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-gray-600">주소:</span>
                        <span className="ml-2 font-medium">{selectedOrder.recipient_address || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">옵션명:</span>
                        <span className="ml-2 font-medium">{selectedOrder.option_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">수량:</span>
                        <span className="ml-2 font-medium">{selectedOrder.quantity || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">셀러:</span>
                        <span className="ml-2 font-medium">{selectedOrder.seller_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">벤더사:</span>
                        <span className="ml-2 font-medium">{selectedOrder.vendor_name || '-'}</span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* CS 구분, 내용, 해결방법 */}
              <div className="flex gap-3 mb-4">
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CS구분 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={csFormData.category}
                    onChange={(e) => setCSFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="파손">파손</option>
                    <option value="썩음/상함">썩음/상함</option>
                    <option value="맛 불만족">맛 불만족</option>
                    <option value="분실">분실</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CS 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={csFormData.content}
                    onChange={(e) => setCSFormData(prev => ({ ...prev, content: e.target.value }))}
                    onFocus={(e) => e.target.placeholder = ''}
                    onBlur={(e) => e.target.placeholder = 'CS 내용을 입력하세요'}
                    placeholder="CS 내용을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                <div className="w-40">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    해결방법 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={csFormData.solution}
                    onChange={(e) => {
                      const newSolution = e.target.value;
                      setCSFormData(prev => ({ ...prev, solution: newSolution }));

                      // 재발송 옵션이면 원주문 데이터 자동 채우기
                      if (newSolution === 'partial_resend' || newSolution === 'full_resend') {
                        if (selectedOrders.length > 0) {
                          const order = filteredOrders.find(o => o.id === selectedOrders[0]);
                          if (order) {
                            setCSFormData(prev => ({
                              ...prev,
                              resendOption: order.option_name || '',
                              receiver: order.recipient_name || '',
                              phone: order.recipient_phone || '',
                              address: order.recipient_address || ''
                            }));
                          }
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {csTypes.map((type) => (
                      <option key={type.id} value={type.code}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 기타 조치 입력란 */}
              {csFormData.solution === 'other_action' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기타 조치 내용 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={csFormData.otherSolution}
                    onChange={(e) => setCSFormData(prev => ({ ...prev, otherSolution: e.target.value }))}
                    onKeyDown={handleCSKeyDown}
                    onFocus={(e) => e.target.placeholder = ''}
                    onBlur={(e) => e.target.placeholder = '기타 조치 내용을 입력하세요'}
                    placeholder="기타 조치 내용을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* 교환 안내 메시지 */}
              {csFormData.solution === 'exchange' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-red-800 font-medium">
                    💡 접수를 완료한 후 업무처리 : 택배사 프로그램에서 반품접수 후 사이트에서 환불처리 하세요 (교환은 불가)
                  </div>
                </div>
              )}

              {/* 반품 안내 메시지 */}
              {csFormData.solution === 'return' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-orange-800 font-medium">
                    💡 접수를 완료한 후 업무처리 : 택배사 프로그램에서 반품접수 후 사이트에서 반품완료처리 하세요
                  </div>
                </div>
              )}

              {/* 전체환불 안내 메시지 */}
              {csFormData.solution === 'full_refund' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-blue-800 font-medium">
                    💡 접수를 완료한 후 업무처리 : 사이트에서 환불처리 해주세요
                  </div>
                </div>
              )}

              {/* 부분환불 섹션 */}
              {csFormData.solution === 'partial_refund' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 space-y-3">
                  <div className="text-xs text-yellow-700">
                    ※ 결제금액은 결제내역을 확인할 수 있는 캡쳐사진으로 확인해야 합니다
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">결제금액</label>
                      <input
                        type="number"
                        value={csFormData.paymentAmount || ''}
                        onChange={(e) => {
                          setCSFormData(prev => ({ ...prev, paymentAmount: Number(e.target.value) || 0 }));
                          setTimeout(calculateRefundAmount, 0);
                        }}
                        onKeyDown={handleCSKeyDown}
                        placeholder="결제금액"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">환불 비율(%)</label>
                      <input
                        type="number"
                        value={csFormData.refundPercent || ''}
                        onChange={(e) => {
                          setCSFormData(prev => ({ ...prev, refundPercent: Number(e.target.value) || 0 }));
                          setTimeout(calculateRefundAmount, 0);
                        }}
                        onKeyDown={handleCSKeyDown}
                        min="0"
                        max="100"
                        placeholder="환불 비율"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">환불금액</label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-lg font-semibold text-blue-600">
                        {csFormData.refundAmount.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                      <input
                        type="text"
                        value={csFormData.bank}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, bank: e.target.value }))}
                        onKeyDown={handleCSKeyDown}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = '은행명'}
                        placeholder="은행명"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                      <input
                        type="text"
                        value={csFormData.accountHolder}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                        onKeyDown={handleCSKeyDown}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = '예금주명'}
                        placeholder="예금주명"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                      <input
                        type="text"
                        value={csFormData.accountNumber}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                        onKeyDown={handleCSKeyDown}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = '계좌번호'}
                        placeholder="계좌번호"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 재발송 섹션 */}
              {(csFormData.solution === 'partial_resend' || csFormData.solution === 'full_resend') && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 space-y-3">
                  {/* 첫째 줄 */}
                  <div className="flex gap-2">
                    <div className="flex-[2]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">재발송 상품</label>
                      <input
                        type="text"
                        value={csFormData.resendOption}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, resendOption: e.target.value }))}
                        onKeyDown={handleCSKeyDown}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = '옵션명'}
                        placeholder="옵션명"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                      <input
                        type="number"
                        value={csFormData.resendQty}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, resendQty: Number(e.target.value) }))}
                        onKeyDown={handleCSKeyDown}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-sm font-medium text-gray-700 mb-1">추가금액</label>
                      <input
                        type="number"
                        value={csFormData.additionalAmount}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, additionalAmount: Number(e.target.value) }))}
                        onKeyDown={handleCSKeyDown}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = '0'}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">특이/요청사항</label>
                      <input
                        type="text"
                        value={csFormData.resendNote}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, resendNote: e.target.value }))}
                        onKeyDown={handleCSKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 둘째 줄 */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">수령인</label>
                      <input
                        type="text"
                        value={csFormData.receiver}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, receiver: e.target.value }))}
                        onKeyDown={handleCSKeyDown}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = '수령인'}
                        placeholder="수령인"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">수령인 전화번호</label>
                      <input
                        type="text"
                        value={csFormData.phone}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, phone: e.target.value }))}
                        onKeyDown={handleCSKeyDown}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = '수령인 전화번호'}
                        placeholder="수령인 전화번호"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 셋째 줄 */}
                  <div className="flex gap-2">
                    <div className="flex-[3]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                      <input
                        type="text"
                        value={csFormData.address}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, address: e.target.value }))}
                        onKeyDown={handleCSKeyDown}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = '배송 주소'}
                        placeholder="배송 주소"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-36">
                      <label className="block text-sm font-medium text-gray-700 mb-1">발송요청일</label>
                      <input
                        type="date"
                        value={csFormData.requestDate}
                        onChange={(e) => setCSFormData(prev => ({ ...prev, requestDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
        </div>
      </Modal>

      {/* 주문 상세 모달 */}
      {selectedOrderDetail && (
        <Modal
          isOpen={showOrderDetailModal}
          onClose={() => {
            setShowOrderDetailModal(false);
            setSelectedOrderDetail(null);
          }}
          title="주문 상세 정보"
          size="lg"
          footer={
            <>
              <button
                onClick={() => {
                  setShowOrderDetailModal(false);
                  setSelectedOrderDetail(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                닫기
              </button>
              {selectedOrderDetail.shipping_status === '접수' && (
                <button
                  onClick={async () => {
                    await handlePaymentConfirm([selectedOrderDetail.id]);
                    setShowOrderDetailModal(false);
                    setSelectedOrderDetail(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  입금확인
                </button>
              )}
              {selectedOrderDetail.shipping_status === '발송완료' && (
                <button
                  onClick={() => {
                    // 주문 상세 모달 닫기
                    setShowOrderDetailModal(false);

                    // 선택된 주문의 인덱스를 찾아서 설정
                    const orderIndex = filteredOrders.findIndex(o => o.id === selectedOrderDetail.id);
                    if (orderIndex !== -1) {
                      setSelectedOrders([orderIndex]);
                    }

                    // CS 모달 열기
                    setShowCSModal(true);
                  }}
                  className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                >
                  CS접수
                </button>
              )}
            </>
          }
        >
          <div className="space-y-5" style={{ fontSize: '13px' }}>
            {/* 주문 기본 정보 - 전체 너비 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="grid grid-cols-3 gap-x-6 gap-y-2.5">
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">주문번호</span>
                  <span className="text-gray-900 font-semibold">{selectedOrderDetail.order_number || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">마켓명</span>
                  <span className="text-gray-900 font-medium">{selectedOrderDetail.market_name || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">결제일</span>
                  <span className="text-gray-900 font-medium">{selectedOrderDetail.payment_date || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">주문자</span>
                  <span className="text-gray-900 font-medium">{selectedOrderDetail.buyer_name || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">주문자 전화</span>
                  <span className="text-gray-900 font-medium">{selectedOrderDetail.buyer_phone || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">발송 상태</span>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {selectedOrderDetail.shipping_status || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2단 레이아웃 */}
            <div className="grid grid-cols-2 gap-5">
              {/* 수령인 정보 */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-28 flex-shrink-0">수령인</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.recipient_name || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-28 flex-shrink-0">전화번호</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.recipient_phone || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">배송 주소</span>
                    <span className="text-gray-900 font-medium leading-relaxed bg-white rounded px-3 py-2 border border-green-200">
                      {selectedOrderDetail.recipient_address || '-'}
                    </span>
                  </div>
                  {selectedOrderDetail.delivery_message && (
                    <div className="flex flex-col">
                      <span className="text-gray-600 mb-1">배송 메시지</span>
                      <span className="text-gray-700 italic bg-white rounded px-3 py-2 border border-green-200">
                        {selectedOrderDetail.delivery_message}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 상품 정보 */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="space-y-2.5">
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">옵션명</span>
                    <span className="text-gray-900 font-semibold bg-white rounded px-3 py-2 border border-purple-200">
                      {selectedOrderDetail.option_name || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-600 block mb-1">수량</span>
                      <span className="text-gray-900 font-bold text-base bg-white rounded px-3 py-2 border border-purple-200 block text-center">
                        {selectedOrderDetail.quantity || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">옵션코드</span>
                      <span className="text-gray-700 font-mono text-xs bg-white rounded px-3 py-2 border border-purple-200 block text-center">
                        {selectedOrderDetail.option_code || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">택배사</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.courier_company || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">송장번호</span>
                    <span className="text-gray-900 font-semibold">{selectedOrderDetail.tracking_number || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">발송일</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.shipped_date || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">발송요청일</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.shipping_request_date || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 셀러/벤더 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">셀러</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.seller_name || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">벤더사</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.vendor_name || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">출고처</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.shipping_source || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 금액 정보 - 전체 너비 */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-100">
              <div className="grid grid-cols-3 gap-x-6 gap-y-2.5">
                <div className="flex items-center">
                  <span className="text-gray-600 w-28 flex-shrink-0">셀러 공급가</span>
                  <span className="text-gray-900 font-semibold">{selectedOrderDetail.seller_supply_price || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-28 flex-shrink-0">정산금액</span>
                  <span className="text-gray-900 font-semibold">{selectedOrderDetail.settlement_amount || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-28 flex-shrink-0">최종결제금액</span>
                  <span className="text-emerald-700 font-bold text-base">{selectedOrderDetail.final_payment_amount || '-'}</span>
                </div>
              </div>
            </div>

            {/* 메모 */}
            {selectedOrderDetail.memo && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-gray-700 whitespace-pre-wrap bg-white rounded px-3 py-2 border border-amber-200 leading-relaxed">
                  {selectedOrderDetail.memo}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 추가주문등록 모달 */}
      {showAdditionalOrderModal && (
        <Modal
          isOpen={showAdditionalOrderModal}
          onClose={() => {
            setShowAdditionalOrderModal(false);
            setAdditionalOrderData({});
          }}
          title="추가주문 등록"
          size="xl"
          footer={
            <>
              <button
                onClick={() => {
                  setShowAdditionalOrderModal(false);
                  setAdditionalOrderData({});
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAdditionalOrderSubmit}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                접수
              </button>
            </>
          }
        >
          <div className="space-y-6">
            {/* 원주문 정보 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">원주문 정보</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">주문번호:</span>
                  <span className="ml-2 font-medium">{additionalOrderData.original_order_number}</span>
                </div>
                <div>
                  <span className="text-gray-600">마켓명:</span>
                  <span className="ml-2 font-medium">{additionalOrderData.market_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">수령인:</span>
                  <span className="ml-2 font-medium">{additionalOrderData.recipient_name}</span>
                </div>
              </div>
            </div>

            {/* 추가주문 정보 */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">추가주문 정보 (수정 가능)</h4>

              <div className="grid grid-cols-2 gap-4">
                {/* 옵션명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    옵션명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={additionalOrderData.option_name || ''}
                    onChange={(e) => setAdditionalOrderData({ ...additionalOrderData, option_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* 수량 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                  <input
                    type="number"
                    value={additionalOrderData.quantity || 1}
                    onChange={(e) => setAdditionalOrderData({ ...additionalOrderData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* 발송요청일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발송요청일</label>
                  <input
                    type="date"
                    value={additionalOrderData.shipping_request_date || ''}
                    onChange={(e) => setAdditionalOrderData({ ...additionalOrderData, shipping_request_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* 빈 공간 (그리드 균형) */}
                <div></div>

                {/* 수령인 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    수령인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={additionalOrderData.recipient_name || ''}
                    onChange={(e) => setAdditionalOrderData({ ...additionalOrderData, recipient_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                  <input
                    type="text"
                    value={additionalOrderData.recipient_phone || ''}
                    onChange={(e) => setAdditionalOrderData({ ...additionalOrderData, recipient_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* 배송 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배송 주소</label>
                <textarea
                  value={additionalOrderData.recipient_address || ''}
                  onChange={(e) => setAdditionalOrderData({ ...additionalOrderData, recipient_address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* 배송 메시지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배송 메시지</label>
                <textarea
                  value={additionalOrderData.delivery_message || ''}
                  onChange={(e) => setAdditionalOrderData({ ...additionalOrderData, delivery_message: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                💡 옵션명을 기준으로 셀러공급가, 출고처, 벤더사 등의 정보가 자동으로 매핑됩니다.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* 벤더사전송파일 모달 */}
      <Modal
        isOpen={showVendorFileModal}
        onClose={() => setShowVendorFileModal(false)}
        title="벤더사 전송파일 다운로드"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            각 벤더사별로 엑셀 파일을 다운로드할 수 있습니다.
          </p>
          <div className="space-y-2">
            {uniqueVendors.map((vendor) => (
              <div
                key={vendor}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">{vendor}</span>
                <button
                  onClick={() => handleVendorExcelDownload(vendor)}
                  className="px-3 py-1.5 bg-cyan-600 text-white rounded text-sm font-medium hover:bg-cyan-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  다운로드
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 마켓 송장파일 다운로드 모달 */}
      <Modal
        isOpen={showMarketInvoiceModal}
        onClose={() => {
          setShowMarketInvoiceModal(false);
          setMarketInvoiceStats([]);
        }}
        title="마켓별 송장파일 다운로드"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            각 마켓별로 송장파일을 다운로드하거나 전체 마켓을 일괄 다운로드할 수 있습니다.
          </p>

          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-medium text-gray-700">
              총 {marketInvoiceStats.reduce((sum, stat) => sum + stat.count, 0)}건
            </div>
            <button
              onClick={handleAllMarketInvoiceDownload}
              disabled={marketInvoiceStats.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              전체 다운로드
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {marketInvoiceStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                발송완료 상태의 주문이 없습니다.
              </div>
            ) : (
              marketInvoiceStats.map((stat) => (
                <div
                  key={stat.market}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {stat.market}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({stat.count.toLocaleString()}건)
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarketInvoiceDownload(stat.market)}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* 벤더사 선택 모달 */}
      <Modal
        isOpen={showVendorSelectModal}
        onClose={() => {
          setShowVendorSelectModal(false);
          setSelectedVendor('');
          setOrdersNeedingVendor([]);
        }}
        title="벤더사 선택"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              벤더사가 지정되지 않은 주문 <span className="font-semibold">{ordersNeedingVendor.length}건</span>이 있습니다.
              <br />
              발주확인을 위해 벤더사를 선택해주세요.
            </p>
          </div>

          {/* 벤더사가 없는 주문 목록 */}
          <div className="max-h-40 overflow-auto border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">주문번호</th>
                  <th className="px-3 py-2 text-left">수령인</th>
                  <th className="px-3 py-2 text-left">옵션명</th>
                </tr>
              </thead>
              <tbody>
                {ordersNeedingVendor.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="px-3 py-2">{order.order_number}</td>
                    <td className="px-3 py-2">{order.recipient_name}</td>
                    <td className="px-3 py-2">{order.option_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 벤더사 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              벤더사 선택 *
            </label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">벤더사를 선택하세요</option>
              {vendorList.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setShowVendorSelectModal(false);
                setSelectedVendor('');
                setOrdersNeedingVendor([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleVendorSelectConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              확인 및 발주확인
            </button>
          </div>
        </div>
      </Modal>

      {/* 상품준비중 집계 모달리스 윈도우 */}
      <ModelessWindow
        title="상품준비중 주문 집계"
        isOpen={showPreparingSummary}
        onClose={() => setShowPreparingSummary(false)}
        defaultWidth={1100}
        defaultHeight={700}
        defaultX={150}
        defaultY={80}
      >
        <PreparingSummaryWindow
          startDate={filters.startDate}
          endDate={filters.endDate}
        />
      </ModelessWindow>
    </div>
  );
}
