'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Download, Filter, Calendar, RefreshCw, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import { Modal } from '@/components/ui/Modal';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

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

interface SearchFilters {
  startDate: string;
  endDate: string;
  dateType: 'sheet' | 'payment';
  marketName: string;
  searchKeyword: string;
  shippingStatus: string;
  vendorName: string;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [vendorStatsExpanded, setVendorStatsExpanded] = useState(false);
  const [sellerStats, setSellerStats] = useState<SellerStats[]>([]);
  const [sellerStatsExpanded, setSellerStatsExpanded] = useState(false);
  const [optionStats, setOptionStats] = useState<OptionStats[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [marketTemplates, setMarketTemplates] = useState<Map<string, any>>(new Map());
  const [courierList, setCourierList] = useState<string[]>([]);

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

  // 상태 카드 필터
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 검색 필터 상태
  const [filters, setFilters] = useState<SearchFilters>(() => {
    // 한국 시간 기준으로 날짜 계산 (UTC+9)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const todayDate = koreaTime.toISOString().split('T')[0];

    // 7일 범위 (오늘 포함 6일 전) 계산
    const sevenDaysAgo = new Date(koreaTime.getTime() - (6 * 24 * 60 * 60 * 1000));
    const sevenDaysAgoDate = sevenDaysAgo.toISOString().split('T')[0];

    return {
      startDate: sevenDaysAgoDate,
      endDate: todayDate,
      dateType: 'sheet',
      marketName: '',
      searchKeyword: '',
      shippingStatus: '',
      vendorName: '',
    };
  });

  // 일괄적용 택배사 선택값 상태
  const [bulkApplyValue, setBulkApplyValue] = useState('');

  // 마켓 템플릿 먼저 로드한 후 표준 필드와 택배사 로드
  useEffect(() => {
    const loadInitialData = async () => {
      await loadMarketTemplates();
      await loadStandardFields();
      await loadCouriers();
      await loadCSTypes();
    };
    loadInitialData();
  }, []);

  // marketTemplates와 columns가 로드되면 마켓 컬럼과 주문번호 컬럼에 렌더러 추가
  useEffect(() => {
    if (columns.length > 0) {
      let needsUpdate = false;

      // 마켓 컬럼 체크
      const marketColumn = columns.find(c => c.key === 'market_name' || c.isMarketColumn);
      const needsMarketRenderer = marketColumn && !marketColumn.renderer && marketTemplates.size > 0;

      // 주문번호 컬럼 체크
      const orderNumberColumn = columns.find(c => c.key === 'order_number');
      const needsOrderNumberRenderer = orderNumberColumn && !orderNumberColumn.renderer;

      // 수량 컬럼 체크
      const quantityColumn = columns.find(c => c.isQuantityColumn);
      const needsQuantityRenderer = quantityColumn && !quantityColumn.renderer;

      // 결제일 컬럼 체크
      const paymentDateColumn = columns.find(c => c.isPaymentDateColumn);
      const needsPaymentDateRenderer = paymentDateColumn && !paymentDateColumn.renderer;

      if (needsMarketRenderer || needsOrderNumberRenderer || needsQuantityRenderer || needsPaymentDateRenderer) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updatedColumns = columns.map((column) => {
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

          // 결제일 컬럼 렌더러 (시분초 표시)
          if (column.isPaymentDateColumn && !column.renderer) {
            return {
              ...column,
              renderer: (value: any, row: any) => {
                if (!value) return '-';
                try {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) return value;

                  // YYYY-MM-DD HH:mm:ss 형식으로 포맷
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  const seconds = String(date.getSeconds()).padStart(2, '0');

                  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                } catch (e) {
                  return value;
                }
              }
            };
          }

          return column;
        });

        setColumns(updatedColumns);
      }
    }
  }, [marketTemplates, columns]);

  const loadMarketTemplates = async () => {
    try {
      const response = await fetch('/api/market-templates');
      const result = await response.json();

      console.log('🎯 마켓 템플릿 API 응답:', result);

      if (result.success) {
        const templateMap = new Map<string, any>();
        result.data.forEach((template: any) => {
          templateMap.set(template.market_name.toLowerCase(), template);
        });
        console.log('✅ 마켓 템플릿 로드 완료:', templateMap.size, '개');
        console.log('템플릿 샘플:', Array.from(templateMap.entries()).slice(0, 3));
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
                hour12: false,
              }).replace(/\. /g, '-').replace('.', '');
            }
          });

          // field_1 ~ field_44 표준 필드 순회
          for (let i = 1; i <= 44; i++) {
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

          console.log('Generated columns:', dynamicColumns.length, dynamicColumns);
          console.log('마켓 컬럼 확인:', dynamicColumns.find(c => c.key === 'market_name' || c.isMarketColumn));
          setColumns(dynamicColumns);
        }
      }
    } catch (error) {
      console.error('표준 필드 로드 실패:', error);
    }
  };

  // 주문 조회
  // 벤더사별 집계
  const calculateVendorStats = (orderData: Order[]) => {
    const statsMap = new Map<string, VendorStats>();

    orderData.forEach((order) => {
      const vendorName = order.vendor_name || '미지정';
      if (!statsMap.has(vendorName)) {
        statsMap.set(vendorName, {
          shipping_source: vendorName,
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
          취소완료_건수: 0,
          취소완료_수량: 0,
        });
      }

      const stats = statsMap.get(vendorName)!;
      const status = order.shipping_status || '결제완료';
      const quantity = Number(order.quantity) || 0;

      if (status === '접수') {
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
      } else if (status === '취소완료') {
        stats.취소완료_건수 += 1;
        stats.취소완료_수량 += quantity;
      }
    });

    const statsArray = Array.from(statsMap.values());
    statsArray.sort((a, b) => (b.접수_건수 + b.결제완료_건수 + b.상품준비중_건수 + b.발송완료_건수 + b.취소요청_건수 + b.취소완료_건수) - (a.접수_건수 + a.결제완료_건수 + a.상품준비중_건수 + a.발송완료_건수 + a.취소요청_건수 + a.취소완료_건수));
    setVendorStats(statsArray);
  };

  // 셀러별 집계
  const calculateSellerStats = (orderData: Order[]) => {
    const statsMap = new Map<string, SellerStats>();

    orderData.forEach((order) => {
      const sellerId = order.seller_id || '미지정';
      const sellerName = order.seller_name || '미지정';
      if (!statsMap.has(sellerId)) {
        statsMap.set(sellerId, {
          seller_id: sellerId,
          seller_name: sellerName,
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
      const supplyPrice = Number(order.seller_supply_price) || 0;

      // payment_confirmed_at이 있으면 입금확인 토글 ON
      if (order.payment_confirmed_at) {
        stats.입금확인 = true;
      }

      // refund_processed_at이 있고 환불처리일시가 설정되지 않았으면 설정
      if (order.refund_processed_at && !stats.환불처리일시) {
        const date = new Date(order.refund_processed_at);
        stats.환불처리일시 = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }

      // 총금액: 접수 상태인 주문의 공급가 합계
      if (status === '접수') {
        stats.총금액 += supplyPrice;
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
        // 환불예정액: 취소요청 상태 주문의 공급가 합계
        stats.환불예정액 += supplyPrice;
      } else if (status === '취소완료') {
        stats.취소완료_건수 += 1;
        stats.취소완료_수량 += quantity;
      }
    });

    const statsArray = Array.from(statsMap.values());
    statsArray.sort((a, b) => (b.접수_건수 + b.결제완료_건수 + b.상품준비중_건수 + b.발송완료_건수 + b.취소요청_건수 + b.취소완료_건수) - (a.접수_건수 + a.결제완료_건수 + a.상품준비중_건수 + a.발송완료_건수 + a.취소요청_건수 + a.취소완료_건수));
    setSellerStats(statsArray);
  };

  // 옵션별 집계
  const calculateOptionStats = (orderData: Order[]) => {
    const statsMap = new Map<string, OptionStats>();

    orderData.forEach((order) => {
      const optionName = order.option_name || '미지정';
      if (!statsMap.has(optionName)) {
        statsMap.set(optionName, {
          option_name: optionName,
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
          취소완료_건수: 0,
          취소완료_수량: 0,
        });
      }

      const stats = statsMap.get(optionName)!;
      const status = order.shipping_status || '결제완료';
      const quantity = Number(order.quantity) || 0;

      if (status === '접수') {
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
      } else if (status === '취소완료') {
        stats.취소완료_건수 += 1;
        stats.취소완료_수량 += quantity;
      }
    });

    const statsArray = Array.from(statsMap.values());
    // 옵션명 가나다순 정렬
    statsArray.sort((a, b) => a.option_name.localeCompare(b.option_name, 'ko'));
    setOptionStats(statsArray);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
      params.append('dateType', filters.dateType);
      if (filters.marketName) params.append('marketName', filters.marketName);
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
      if (filters.shippingStatus) params.append('shippingStatus', filters.shippingStatus);
      if (filters.vendorName) params.append('vendorName', filters.vendorName);
      params.append('limit', '1000');

      const response = await fetch(`/api/integrated-orders?${params}`);
      const result = await response.json();

      console.log('🔍 API Response:', {
        success: result.success,
        totalOrders: result.data?.length,
        markets: [...new Set(result.data?.map((o: Order) => o.market_name))],
        platformOrders: result.data?.filter((o: Order) => o.market_name === '플랫폼').length,
      });

      if (result.success) {
        setOrders(result.data || []);
        console.log('✅ Orders state updated:', result.data?.length);

        // 통계 계산
        const statusCounts = (result.data || []).reduce((acc: any, order: Order) => {
          const status = order.shipping_status || '결제완료';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log('📊 Status Counts:', statusCounts);

        setStats({
          total: result.data?.length || 0,
          접수: statusCounts['접수'] || 0,
          결제완료: statusCounts['결제완료'] || 0,
          상품준비중: statusCounts['상품준비중'] || 0,
          발송완료: statusCounts['발송완료'] || 0,
          취소요청: statusCounts['취소요청'] || 0,
          취소완료: statusCounts['취소완료'] || 0,
          환불완료: statusCounts['환불완료'] || 0,
        });

        // 벤더사별 집계 계산
        calculateVendorStats(result.data || []);
        // 셀러별 집계 계산
        calculateSellerStats(result.data || []);
        // 옵션별 집계 계산
        calculateOptionStats(result.data || []);
      } else {
        console.error('주문 조회 실패:', result.error);
        alert('주문 조회에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('주문 조회 오류:', error);
      alert('주문 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchOrders();
  }, []);

  // 빠른 날짜 필터 (한국 시간 기준)
  const setQuickDateFilter = (days: number) => {
    const now = new Date();
    const koreaEndDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const koreaStartDate = new Date(koreaEndDate);
    koreaStartDate.setDate(koreaStartDate.getDate() - days);

    setFilters({
      ...filters,
      startDate: koreaStartDate.toISOString().split('T')[0],
      endDate: koreaEndDate.toISOString().split('T')[0],
    });
  };

  // 선택된 빠른 날짜 필터 확인 (한국 시간 기준)
  const isQuickDateFilterActive = (days: number) => {
    const now = new Date();
    const koreaToday = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const expectedEnd = koreaToday.toISOString().split('T')[0];
    const koreaStart = new Date(koreaToday);
    koreaStart.setDate(koreaStart.getDate() - days);
    const expectedStartStr = koreaStart.toISOString().split('T')[0];

    return filters.startDate === expectedStartStr && filters.endDate === expectedEnd;
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
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

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문조회');

    const fileName = `주문조회_${filters.startDate}_${filters.endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 데이터 저장 핸들러
  const handleSaveData = async (updatedData: any[]) => {
    try {
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

  // 발주확인 핸들러 - 선택된 결제완료 상태 주문을 상품준비중으로 변경
  const handleOrderConfirm = async () => {
    // 선택된 주문만 필터링
    if (selectedOrders.length === 0) {
      alert('발주확인할 주문을 선택해주세요.');
      return;
    }

    // selectedOrders가 ID 배열인지 인덱스 배열인지 확인
    const confirmOrders = filteredOrders
      .filter(order => selectedOrders.includes(order.id))
      .filter(order => order && order.shipping_status === '결제완료');

    if (confirmOrders.length === 0) {
      alert('선택한 주문 중 결제완료 상태인 주문이 없습니다.');
      return;
    }

    if (!confirm(`${confirmOrders.length}개의 주문을 발주확인 하시겠습니까?\n상품준비중 상태로 변경됩니다.`)) {
      return;
    }

    try {
      // shipping_status만 업데이트 (id와 함께)
      const updates = confirmOrders.map(order => ({
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
        alert(`${result.count}개 주문이 발주확인 처리되었습니다.`);
        setSelectedOrders([]); // 선택 초기화
        fetchOrders();
      } else {
        alert('발주확인 실패: ' + result.error);
      }
    } catch (error) {
      console.error('발주확인 오류:', error);
      alert('발주확인 중 오류가 발생했습니다.');
    }
  };

  // 입금확인 핸들러 - 접수 상태 주문을 결제완료로 변경
  const handlePaymentConfirm = async (orderIds?: number[]) => {
    // orderIds가 전달되지 않으면 selectedOrders 사용 (접수 통계카드용)
    const targetOrderIds = Array.isArray(orderIds) ? orderIds : selectedOrders;

    if (!Array.isArray(targetOrderIds) || targetOrderIds.length === 0) {
      alert('입금확인할 주문을 선택해주세요.');
      return;
    }

    // 접수 상태인 주문만 필터링
    const ordersToConfirm = filteredOrders.filter(order =>
      targetOrderIds.includes(order.id) && order.shipping_status === '접수'
    );

    if (ordersToConfirm.length === 0) {
      alert('입금확인할 수 있는 주문이 없습니다. (접수 상태만 가능)');
      return;
    }

    if (!confirm(`${ordersToConfirm.length}건의 주문을 입금확인 하시겠습니까?\n상태가 '결제완료'로 변경됩니다.`)) {
      return;
    }

    try {
      console.log('💰 입금확인 시작:', ordersToConfirm.length, '건');

      const ordersToSave = ordersToConfirm.map(order => ({
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

      console.log('🔄 송장수정 시작:', ordersToSave.length, '건');

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
      console.log('📋 selectedOrders:', selectedOrders);
      console.log('📋 filteredOrders 개수:', filteredOrders.length);
      console.log('📋 filteredOrders 샘플 ID:', filteredOrders.slice(0, 3).map(o => o.id));

      // 선택된 주문만 필터링 (filteredOrders 사용)
      const selectedOrderList = filteredOrders.filter(order => selectedOrders.includes(order.id));

      console.log('✅ 필터링된 주문 개수:', selectedOrderList.length);

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

      console.log('🔙 송장회수 시작:', ordersToSave.length, '건');

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
    // 현재 필터된 주문(화면에 보이는 것) 중에서 상품준비중 상태이면서 해당 벤더사인 주문만 필터링
    const vendorOrders = filteredOrders.filter(
      (o) => o.shipping_status === '상품준비중' && (o.vendor_name || '미지정') === vendorName
    );

    if (vendorOrders.length === 0) {
      alert('다운로드할 주문이 없습니다.');
      return;
    }

    try {
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
    // 현재 필터된 주문 중에서 발송완료 상태이면서 해당 마켓인 주문만 필터링
    const marketOrders = filteredOrders.filter(
      (o) => o.shipping_status === '발송완료' && (o.market_name || '미지정') === marketName
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
      const worksheet = workbook.addWorksheet(marketName);

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

  // 전체 마켓 일괄 다운로드
  const handleAllMarketInvoiceDownload = async () => {
    const activeMarkets = uniqueMarkets.filter((market) => {
      const marketOrders = filteredOrders.filter(
        (o) => o.shipping_status === '발송완료' && (o.market_name || '미지정') === market
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

  // 셀러별 엑셀 다운로드
  const handleSellerExcelDownload = (sellerId: string) => {
    const sellerOrders = orders.filter((o) => (o.seller_id || '미지정') === sellerId);

    if (sellerOrders.length === 0) {
      alert('다운로드할 주문이 없습니다.');
      return;
    }

    const exportData = sellerOrders.map((order) => ({
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

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sellerId);

    const fileName = `${sellerId}_발송목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
      console.log('📄 선택된 파일:', bulkInvoiceFile.name, '크기:', bulkInvoiceFile.size, 'bytes');

      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, WTF: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        console.log('📊 엑셀에서 읽은 전체 행 수:', jsonData.length);
        console.log('📋 첫 번째 행 데이터:', jsonData[0]);
        console.log('📋 엑셀 컬럼명:', Object.keys(jsonData[0] || {}));

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
              console.log(`엑셀 ${idx + 1}행:`, {원본: orderNumber, 타입: typeof orderNumber, 변환후: key});
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

        console.log('📦 엑셀에서 읽은 송장 정보:', invoiceMap.size, '건');
        console.log('📦 엑셀 주문번호 샘플 (처음 5개):', Array.from(invoiceMap.keys()).slice(0, 5));

        // 현재 화면에 보이면서 '상품준비중' 상태인 주문들만 매칭하여 업데이트
        const updates: any[] = [];
        const shippedDateTime = getKoreanDateTime(); // 한국 시간으로 발송일 설정

        const targetOrders = filteredOrders.filter(order => order.shipping_status === '상품준비중');

        console.log('📋 현재 화면의 전체 주문 수:', filteredOrders.length, '건');
        console.log('📋 상품준비중 주문 수:', targetOrders.length, '건');
        console.log('📋 화면 주문번호 샘플 (처음 5개):', targetOrders.slice(0, 5).map(o => o.order_number));

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
                console.log(`✅ 매칭 성공 ${matchCount}:`, key);
              }
            } else {
              notMatchCount++;
              if (notMatchCount <= 3) {
                console.log(`❌ 매칭 실패 ${notMatchCount}:`, key, '(엑셀에 없음)');
              }
            }
          }
        });

        console.log(`📊 매칭 결과: 성공 ${matchCount}건, 실패 ${notMatchCount}건`);

        console.log('✅ 매칭된 주문:', updates.length, '건');

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
      console.log('📄 선택된 파일:', bulkInvoiceUpdateFile.name, '크기:', bulkInvoiceUpdateFile.size, 'bytes');

      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, WTF: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        console.log('📊 엑셀에서 읽은 전체 행 수:', jsonData.length);
        console.log('📋 첫 번째 행 데이터:', jsonData[0]);
        console.log('📋 엑셀 컬럼명:', Object.keys(jsonData[0] || {}));

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
              console.log(`엑셀 ${idx + 1}행:`, {원본: orderNumber, 타입: typeof orderNumber, 변환후: key});
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

        console.log('📦 엑셀에서 읽은 송장 정보:', invoiceMap.size, '건');
        console.log('📦 엑셀 주문번호 샘플 (처음 5개):', Array.from(invoiceMap.keys()).slice(0, 5));

        // 현재 화면에 보이면서 '발송완료' 상태인 주문들만 매칭하여 업데이트
        const updates: any[] = [];
        const shippedDateTime = getKoreanDateTime(); // 한국 시간으로 발송일 설정

        const targetOrders = filteredOrders.filter(order => order.shipping_status === '발송완료');

        console.log('📋 현재 화면의 전체 주문 수:', filteredOrders.length, '건');
        console.log('📋 발송완료 주문 수:', targetOrders.length, '건');
        console.log('📋 화면 주문번호 샘플 (처음 5개):', targetOrders.slice(0, 5).map(o => o.order_number));

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
                console.log(`✅ 매칭 성공 ${matchCount}:`, key);
              }
            } else {
              notMatchCount++;
              if (notMatchCount <= 3) {
                console.log(`❌ 매칭 실패 ${notMatchCount}:`, key, '(엑셀에 없음)');
              }
            }
          }
        });

        console.log(`📊 매칭 결과: 성공 ${matchCount}건, 실패 ${notMatchCount}건`);

        console.log('✅ 매칭된 주문:', updates.length, '건');

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
      const updates = cancelOrders.map(order => ({
        id: order.id,
        shipping_status: '취소완료',
        canceled_at: new Date().toISOString(),
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
      console.log('🔍 CS 중복 검증 시작:', selectedOrder.order_number);
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
          console.log('❌ 사용자가 중복 등록을 취소했습니다.');
          return;
        }
        console.log('✅ 사용자가 중복 등록을 승인했습니다.');
      } else {
        console.log('✅ 중복된 CS 기록 없음');
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

      console.log('📤 CS 기록 저장 요청 데이터:', csRecordData);

      const csResponse = await fetch('/api/cs-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(csRecordData),
      });

      console.log('📡 CS API 응답 상태:', csResponse.status);

      const csResult = await csResponse.json();

      console.log('📥 CS 기록 저장 응답:', csResult);

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

        // 옵션명으로 매핑 정보 가져오기
        const optionName = csFormData.resendOption || selectedOrder.option_name;
        const mappingData = await fetchMappingByOptionName(optionName);

        // 새 주문 데이터 생성 (한국 시간 기준)
        const koreanDate = getKoreanDate();
        const newOrderData = {
          sheet_date: koreanDate,
          market_name: 'CS발송',
          order_number: csOrderNumber,
          recipient_name: csFormData.receiver || selectedOrder.recipient_name,
          recipient_phone: csFormData.phone || selectedOrder.recipient_phone,
          recipient_address: csFormData.address || selectedOrder.recipient_address,
          delivery_message: csFormData.resendNote || '',
          option_name: optionName,
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
          // 옵션명 기준 자동 매핑 (없으면 원주문 정보 복사)
          seller_supply_price: mappingData?.seller_supply_price || selectedOrder.seller_supply_price,
          shipping_source: mappingData?.shipping_source || selectedOrder.shipping_source,
          invoice_issuer: mappingData?.invoice_issuer || selectedOrder.invoice_issuer,
          vendor_name: mappingData?.vendor_name || selectedOrder.vendor_name,
          shipping_location_name: mappingData?.shipping_location_name || selectedOrder.shipping_location_name,
          shipping_location_address: mappingData?.shipping_location_address || selectedOrder.shipping_location_address,
          shipping_location_contact: mappingData?.shipping_location_contact || selectedOrder.shipping_location_contact,
          shipping_cost: mappingData?.shipping_cost || selectedOrder.shipping_cost,
        };

        console.log('📤 재발송 주문 생성 요청 데이터:', newOrderData);

        // 주문 생성 API 호출
        const createOrderResponse = await fetch('/api/integrated-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrderData),
        });

        console.log('📡 재발송 주문 생성 응답 상태:', createOrderResponse.status);

        const createOrderResult = await createOrderResponse.json();

        console.log('📥 재발송 주문 생성 응답:', createOrderResult);

        if (!createOrderResult.success) {
          alert('재발송 주문 생성 실패: ' + createOrderResult.error);
          return;
        }

        console.log('✅ 재발송 주문 생성 완료:', csOrderNumber, '/ ID:', createOrderResult.data?.id);
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
        // 현재 시각 타임스탬프 생성
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
      const now = new Date().toISOString();
      const formattedDateTime = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

      // refund_processed_at 타임스탬프 저장
      const updatedOrders = sellerRefundOrders.map(order => ({
        ...order,
        refund_processed_at: now
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

  // 상태 카드 클릭 핸들러
  const handleStatusCardClick = (status: string | null) => {
    if (statusFilter === status) {
      // 이미 선택된 카드를 다시 클릭하면 필터 해제
      setStatusFilter(null);
    } else {
      setStatusFilter(status);
    }
  };

  // 필터링된 주문 데이터
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      // 날짜 필터
      if (filters.startDate || filters.endDate) {
        const orderDate = filters.dateType === 'payment'
          ? order.payment_date
          : order.sheet_date;

        if (orderDate) {
          const dateStr = orderDate.split('T')[0];
          if (filters.startDate && dateStr < filters.startDate) return false;
          if (filters.endDate && dateStr > filters.endDate) return false;
        }
      }

      // 마켓명 필터
      if (filters.marketName && order.market_name !== filters.marketName) {
        return false;
      }

      // 발송상태 필터
      if (filters.shippingStatus && order.shipping_status !== filters.shippingStatus) {
        return false;
      }

      // 벤더사 필터
      if (filters.vendorName && order.vendor_name !== filters.vendorName) {
        return false;
      }

      // 검색어 필터
      if (filters.searchKeyword) {
        const keyword = filters.searchKeyword.toLowerCase();
        const searchFields = [
          order.order_number,
          order.recipient_name,
          order.option_name,
        ].filter(Boolean).map(field => String(field).toLowerCase());

        if (!searchFields.some(field => field.includes(keyword))) {
          return false;
        }
      }

      // 상태카드 필터
      if (statusFilter) {
        const orderStatus = order.shipping_status || '결제완료';
        if (orderStatus !== statusFilter) return false;
      }

      return true;
    });

    // 정렬: 마켓 칼럼(field_13) 순서 (마켓이니셜+세자리연번)
    return filtered.sort((a, b) => {
      const field13A = a.field_13 || '';
      const field13B = b.field_13 || '';
      return field13A.localeCompare(field13B);
    });
  }, [orders, statusFilter, filters]);

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

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-8 gap-4">
        <div
          onClick={() => handleStatusCardClick(null)}
          className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
            statusFilter === null
              ? 'border-gray-900 shadow-md'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">전체</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.total.toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('접수')}
          className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
            statusFilter === '접수'
              ? 'border-purple-600 shadow-md'
              : 'border-gray-200 hover:border-purple-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">접수</div>
          <div className="text-2xl font-semibold text-purple-600">{(stats.접수 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('결제완료')}
          className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
            statusFilter === '결제완료'
              ? 'border-blue-600 shadow-md'
              : 'border-gray-200 hover:border-blue-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">결제완료</div>
          <div className="text-2xl font-semibold text-blue-600">{(stats.결제완료 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('상품준비중')}
          className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
            statusFilter === '상품준비중'
              ? 'border-yellow-600 shadow-md'
              : 'border-gray-200 hover:border-yellow-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">상품준비중</div>
          <div className="text-2xl font-semibold text-yellow-600">{(stats.상품준비중 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('발송완료')}
          className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
            statusFilter === '발송완료'
              ? 'border-green-600 shadow-md'
              : 'border-gray-200 hover:border-green-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">발송완료</div>
          <div className="text-2xl font-semibold text-green-600">{(stats.발송완료 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('취소요청')}
          className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
            statusFilter === '취소요청'
              ? 'border-orange-600 shadow-md'
              : 'border-gray-200 hover:border-orange-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">취소요청</div>
          <div className="text-2xl font-semibold text-orange-600">{(stats.취소요청 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('취소완료')}
          className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
            statusFilter === '취소완료'
              ? 'border-gray-600 shadow-md'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">취소완료</div>
          <div className="text-2xl font-semibold text-gray-600">{(stats.취소완료 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('환불완료')}
          className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
            statusFilter === '환불완료'
              ? 'border-red-600 shadow-md'
              : 'border-gray-200 hover:border-red-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">환불완료</div>
          <div className="text-2xl font-semibold text-red-600">{(stats.환불완료 || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* 벤더사별/셀러별 테이블 */}
      <div className="bg-white rounded-lg">
        <div className="px-4 py-3 flex items-center gap-4">
          <span
            onClick={() => {
              setVendorStatsExpanded(!vendorStatsExpanded);
              if (!vendorStatsExpanded) setSellerStatsExpanded(false);
            }}
            className={`text-lg font-semibold cursor-pointer transition-colors ${
              vendorStatsExpanded
                ? 'text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            벤더사별
          </span>
          <span
            onClick={() => {
              setSellerStatsExpanded(!sellerStatsExpanded);
              if (!sellerStatsExpanded) setVendorStatsExpanded(false);
            }}
            className={`text-lg font-semibold cursor-pointer transition-colors ${
              sellerStatsExpanded
                ? 'text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            셀러별
          </span>
        </div>

        {vendorStatsExpanded && (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'left', fontWeight: 500, color: '#4B5563' }}>벤더사</th>
                  <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>접수</th>
                  <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>결제완료</th>
                  <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>상품준비중</th>
                  <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>발송완료</th>
                  <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>취소요청</th>
                  <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>취소완료</th>
                  <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>전송파일</th>
                </tr>
              </thead>
              <tbody>
                {vendorStats.map((stat, idx) => (
                  <tr key={stat.shipping_source} style={{ borderTop: idx === 0 ? 'none' : '1px solid #E5E7EB' }} className="hover:bg-gray-50">
                    <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 500, color: '#111827' }}>{stat.shipping_source}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#7E22CE', fontWeight: 600 }}>{(stat.접수_건수 || 0) > 0 ? stat.접수_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#1D4ED8', fontWeight: 600 }}>{(stat.결제완료_건수 || 0) > 0 ? stat.결제완료_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#A16207', fontWeight: 600 }}>{(stat.상품준비중_건수 || 0) > 0 ? stat.상품준비중_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>{(stat.발송완료_건수 || 0) > 0 ? stat.발송완료_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#C2410C', fontWeight: 600 }}>{(stat.취소요청_건수 || 0) > 0 ? stat.취소요청_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>{(stat.취소완료_건수 || 0) > 0 ? stat.취소완료_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleVendorExcelDownload(stat.shipping_source)}
                        style={{ fontSize: '14px', padding: '4px 12px', backgroundColor: '#16A34A', color: 'white', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                      >
                        <Download className="w-3 h-3" />
                        엑셀
                      </button>
                    </td>
                  </tr>
                ))}
                {vendorStats.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ fontSize: '16px', padding: '24px 16px', textAlign: 'center', color: '#6B7280' }}>
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {sellerStatsExpanded && (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '120px', textAlign: 'left', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>셀러</th>
                  <th colSpan={3} style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>발주</th>
                  <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>결제완료</th>
                  <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>상품준비중</th>
                  <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>발송완료</th>
                  <th colSpan={3} style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>환불</th>
                  <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>취소완료</th>
                </tr>
                <tr className="bg-gray-50">
                  <th style={{ fontSize: '14px', padding: '4px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>접수</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', width: '100px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>금액</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>입금확인</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>취소요청</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', width: '100px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>환불예정액</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', width: '140px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>환불처리</th>
                </tr>
              </thead>
              <tbody>
                {sellerStats.map((stat, idx) => (
                  <tr key={stat.seller_id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #E5E7EB' }} className="hover:bg-gray-50">
                    <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 500, color: '#111827' }}>{stat.seller_name}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#7E22CE', fontWeight: 600 }}>{(stat.접수_건수 || 0) > 0 ? stat.접수_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'right', color: '#047857', fontWeight: 600 }}>{stat.총금액 > 0 ? stat.총금액.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center' }}>
                      <div
                        onClick={() => handlePaymentCheckToggle(stat.seller_id)}
                        style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '12px',
                          backgroundColor: stat.입금확인 ? '#0891B2' : '#D1D5DB',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background-color 0.3s',
                          display: 'inline-block'
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            position: 'absolute',
                            top: '3px',
                            left: stat.입금확인 ? '23px' : '3px',
                            transition: 'left 0.3s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#1D4ED8', fontWeight: 600 }}>{(stat.결제완료_건수 || 0) > 0 ? stat.결제완료_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#A16207', fontWeight: 600 }}>{(stat.상품준비중_건수 || 0) > 0 ? stat.상품준비중_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>{(stat.발송완료_건수 || 0) > 0 ? stat.발송완료_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#C2410C', fontWeight: 600 }}>{(stat.취소요청_건수 || 0) > 0 ? stat.취소요청_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>{stat.환불예정액 > 0 ? stat.환불예정액.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '14px', padding: '6px 16px', textAlign: 'center' }}>
                      {stat.환불처리일시 ? (
                        <span style={{ color: '#059669', fontWeight: 500 }}>{stat.환불처리일시}</span>
                      ) : (
                        <button
                          onClick={() => handleRefundComplete(stat.seller_id)}
                          style={{
                            fontSize: '13px',
                            padding: '4px 10px',
                            backgroundColor: '#DC2626',
                            color: 'white',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                        >
                          환불완료
                        </button>
                      )}
                    </td>
                    <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>{(stat.취소완료_건수 || 0) > 0 ? stat.취소완료_건수.toLocaleString() : ''}</td>
                  </tr>
                ))}
                {sellerStats.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ fontSize: '16px', padding: '24px 16px', textAlign: 'center', color: '#6B7280' }}>
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 검색 필터 */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          {/* 날짜 유형 */}
          <select
            value={filters.dateType}
            onChange={(e) => setFilters({ ...filters, dateType: e.target.value as 'sheet' | 'payment' })}
            className="px-2 border border-gray-300 rounded text-xs"
            style={{ width: '110px', height: '30px' }}
          >
            <option value="sheet">주문통합일</option>
            <option value="payment">결제일</option>
          </select>

          {/* 시작일 */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-2 border border-gray-300 rounded text-xs"
            style={{ width: '130px', height: '30px' }}
          />

          {/* 종료일 */}
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-2 border border-gray-300 rounded text-xs"
            style={{ width: '130px', height: '30px' }}
          />

          {/* 빠른 날짜 필터 */}
          <button
            onClick={() => setQuickDateFilter(0)}
            className={`px-1 text-xs rounded hover:bg-gray-50 ${
              isQuickDateFilterActive(0)
                ? 'border-2 border-blue-500 bg-blue-50'
                : 'border border-gray-300'
            }`}
            style={{ width: '60px', height: '30px' }}
          >
            오늘
          </button>
          <button
            onClick={() => setQuickDateFilter(6)}
            className={`px-1 text-xs rounded hover:bg-gray-50 ${
              isQuickDateFilterActive(6)
                ? 'border-2 border-blue-500 bg-blue-50'
                : 'border border-gray-300'
            }`}
            style={{ width: '60px', height: '30px' }}
          >
            7일
          </button>
          <button
            onClick={() => setQuickDateFilter(29)}
            className={`px-1 text-xs rounded hover:bg-gray-50 ${
              isQuickDateFilterActive(29)
                ? 'border-2 border-blue-500 bg-blue-50'
                : 'border border-gray-300'
            }`}
            style={{ width: '60px', height: '30px' }}
          >
            30일
          </button>
          <button
            onClick={() => setQuickDateFilter(89)}
            className={`px-1 text-xs rounded hover:bg-gray-50 ${
              isQuickDateFilterActive(89)
                ? 'border-2 border-blue-500 bg-blue-50'
                : 'border border-gray-300'
            }`}
            style={{ width: '60px', height: '30px' }}
          >
            90일
          </button>

          {/* 마켓명 */}
          <select
            value={filters.marketName}
            onChange={(e) => setFilters({ ...filters, marketName: e.target.value })}
            className="px-2 border border-gray-300 rounded text-xs"
            style={{ width: '90px', height: '30px' }}
          >
            <option value="">마켓전체</option>
            {uniqueMarkets.map(market => (
              <option key={market} value={market}>{market}</option>
            ))}
          </select>

          {/* 발송상태 */}
          <select
            value={filters.shippingStatus}
            onChange={(e) => setFilters({ ...filters, shippingStatus: e.target.value })}
            className="px-2 border border-gray-300 rounded text-xs"
            style={{ width: '90px', height: '30px' }}
          >
            <option value="">상태전체</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* 벤더사 */}
          <select
            value={filters.vendorName}
            onChange={(e) => setFilters({ ...filters, vendorName: e.target.value })}
            className="px-2 border border-gray-300 rounded text-xs"
            style={{ width: '120px', height: '30px' }}
          >
            <option value="">벤더전체</option>
            {uniqueVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>

          {/* 검색어 */}
          <div className="relative" style={{ width: '120px', height: '30px' }}>
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={filters.searchKeyword}
              onChange={(e) => setFilters({ ...filters, searchKeyword: e.target.value })}
              placeholder=""
              className="w-full h-full pl-7 pr-2 border-2 border-blue-500 rounded text-xs"
            />
          </div>
        </div>
      </div>

      {/* EditableAdminGrid */}
      <div>
        {columns.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">칼럼 로딩중...</span>
          </div>
        ) : (
          <EditableAdminGrid
            columns={columns}
            data={filteredOrders}
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
            height="calc(100vh - 480px)"
            enableCSVExport={true}
            enableCSVImport={false}
            enableAddRow={false}
            enableDelete={false}
            enableCopy={false}
            customActions={
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-1">
                  {statusFilter === '접수' && (
                    <button
                      onClick={handlePaymentConfirm}
                      className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                    >
                      입금확인
                    </button>
                  )}
                  {statusFilter === '결제완료' && (
                    <button
                      onClick={handleOrderConfirm}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                    >
                      발주확인
                    </button>
                  )}
                  {statusFilter === '취소요청' && (
                    <>
                      <button
                        onClick={handleCancelApprove}
                        className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700"
                      >
                        취소승인
                      </button>
                      <button
                        onClick={handleCancelReject}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600"
                      >
                        취소반려
                      </button>
                    </>
                  )}
                  {(statusFilter === '발송완료' || !statusFilter) && (
                    <button
                      onClick={() => {
                        if (selectedOrders.length === 0) {
                          alert('CS접수할 주문을 선택해주세요.');
                          return;
                        }
                        if (selectedOrders.length > 1) {
                          alert('CS 접수는 한 번에 하나의 주문만 처리할 수 있습니다.');
                          return;
                        }
                        // selectedOrders[0]는 이제 실제 ID이므로 find로 찾아야 함
                        const selectedOrder = filteredOrders.find(order => order.id === selectedOrders[0]);
                        if (!selectedOrder) {
                          alert('선택된 주문을 찾을 수 없습니다.');
                          return;
                        }
                        if (selectedOrder.shipping_status !== '발송완료') {
                          alert('CS접수는 발송완료 상태의 주문만 가능합니다.');
                          return;
                        }
                        setShowCSModal(true);
                      }}
                      className="px-2 py-1 bg-pink-600 text-white rounded text-xs font-medium hover:bg-pink-700"
                    >
                      CS접수
                    </button>
                  )}
                  {(statusFilter === '결제완료' || statusFilter === '상품준비중' || statusFilter === '발송완료' || !statusFilter) && (
                    <button
                      onClick={() => {
                        if (selectedOrders.length === 0) {
                          alert('추가주문할 원주문을 선택해주세요.');
                          return;
                        }
                        if (selectedOrders.length > 1) {
                          alert('추가주문은 한 번에 하나의 주문만 처리할 수 있습니다.');
                          return;
                        }
                        const selectedOrder = filteredOrders.find(order => order.id === selectedOrders[0]);
                        if (!selectedOrder) {
                          alert('선택된 주문을 찾을 수 없습니다.');
                          return;
                        }
                        setAdditionalOrderData({
                          ...selectedOrder,
                          // 새 주문번호 생성 준비
                          original_order_number: selectedOrder.order_number,
                        });
                        setShowAdditionalOrderModal(true);
                      }}
                      className="px-2 py-1 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700"
                    >
                      추가주문등록
                    </button>
                  )}
                </div>
                {(statusFilter === '상품준비중' || statusFilter === '발송완료') && (
                  <>
                    <div className="flex items-center gap-1">
                      <select
                        value={bulkApplyValue}
                        onChange={(e) => setBulkApplyValue(e.target.value)}
                        className="px-2 border border-gray-300 rounded text-xs h-[26px]"
                        style={{ width: '100px' }}
                      >
                        <option value="">택배사 선택</option>
                        {courierList.map(courier => (
                          <option key={courier} value={courier}>{courier}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkApply}
                        className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
                      >
                        일괄적용
                      </button>
                      {statusFilter !== '발송완료' && (
                        <button
                          onClick={handleTrackingRegister}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                        >
                          송장등록
                        </button>
                      )}
                      {statusFilter === '발송완료' && (
                        <button
                          onClick={handleTrackingUpdate}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          송장수정
                        </button>
                      )}
                      {statusFilter === '발송완료' && (
                        <button
                          onClick={handleTrackingRecall}
                          className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700"
                        >
                          송장회수
                        </button>
                      )}
                      {statusFilter !== '발송완료' && (
                        <button
                          onClick={handleBulkInvoiceUpload}
                          className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          송장일괄등록
                        </button>
                      )}
                      {statusFilter === '발송완료' && (
                        <button
                          onClick={handleBulkInvoiceUpdate}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          송장일괄수정
                        </button>
                      )}
                    </div>
                    {statusFilter === '상품준비중' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowVendorFileModal(true)}
                          disabled={orders.length === 0}
                          className="px-2 py-1 bg-cyan-600 text-white rounded text-xs font-medium hover:bg-cyan-700 disabled:bg-gray-400 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          벤더사전송파일
                        </button>
                      </div>
                    )}
                    {statusFilter === '발송완료' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowMarketInvoiceModal(true)}
                          disabled={orders.length === 0}
                          className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 disabled:bg-gray-400 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          마켓송장파일
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            }
          />
        )}
      </div>

      {/* 옵션별 집계 테이블 */}
      {optionStats.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 flex items-center gap-4">
            <span className="text-lg font-semibold text-gray-700">
              옵션별 집계
            </span>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'left', fontWeight: 500, color: '#4B5563', verticalAlign: 'middle', borderRight: '1px solid #E5E7EB' }}>옵션명</th>
                  <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#9333EA', borderRight: '1px solid #E5E7EB' }}>접수</th>
                  <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#2563EB', borderRight: '1px solid #E5E7EB' }}>결제완료</th>
                  <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#CA8A04', borderRight: '1px solid #E5E7EB' }}>상품준비중</th>
                  <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#16A34A', borderRight: '1px solid #E5E7EB' }}>발송완료</th>
                  <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#EA580C', borderRight: '1px solid #E5E7EB' }}>취소요청</th>
                  <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#DC2626' }}>취소완료</th>
                </tr>
                <tr className="bg-gray-50">
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
                  <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>수량</th>
                </tr>
              </thead>
              <tbody>
                {optionStats.map((stat, idx) => (
                  <tr key={stat.option_name} style={{ borderTop: idx === 0 ? 'none' : '1px solid #E5E7EB' }} className="hover:bg-gray-50">
                    <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 500, color: '#111827', borderRight: '1px solid #E5E7EB' }}>{stat.option_name}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#7C3AED', fontWeight: 600 }}>{(stat.접수_건수 || 0) > 0 ? stat.접수_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#7C3AED', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.접수_수량 || 0) > 0 ? stat.접수_수량.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#1D4ED8', fontWeight: 600 }}>{(stat.결제완료_건수 || 0) > 0 ? stat.결제완료_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#1D4ED8', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.결제완료_수량 || 0) > 0 ? stat.결제완료_수량.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#A16207', fontWeight: 600 }}>{(stat.상품준비중_건수 || 0) > 0 ? stat.상품준비중_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#A16207', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.상품준비중_수량 || 0) > 0 ? stat.상품준비중_수량.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>{(stat.발송완료_건수 || 0) > 0 ? stat.발송완료_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#15803D', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.발송완료_수량 || 0) > 0 ? stat.발송완료_수량.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#C2410C', fontWeight: 600 }}>{(stat.취소요청_건수 || 0) > 0 ? stat.취소요청_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#C2410C', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.취소요청_수량 || 0) > 0 ? stat.취소요청_수량.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>{(stat.취소완료_건수 || 0) > 0 ? stat.취소완료_건수.toLocaleString() : ''}</td>
                    <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#B91C1C', fontWeight: 500 }}>{(stat.취소완료_수량 || 0) > 0 ? stat.취소완료_수량.toLocaleString() : ''}</td>
                  </tr>
                ))}
                {/* 합계 행 */}
                <tr style={{ borderTop: '2px solid #374151', backgroundColor: '#F9FAFB' }}>
                  <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 700, color: '#111827', borderRight: '1px solid #E5E7EB' }}>합계</td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#7C3AED', fontWeight: 700 }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.접수_건수 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#7C3AED', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.접수_수량 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#1D4ED8', fontWeight: 700 }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.결제완료_건수 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#1D4ED8', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.결제완료_수량 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#A16207', fontWeight: 700 }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.상품준비중_건수 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#A16207', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.상품준비중_수량 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#15803D', fontWeight: 700 }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.발송완료_건수 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#15803D', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.발송완료_수량 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#C2410C', fontWeight: 700 }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.취소요청_건수 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#C2410C', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.취소요청_수량 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#B91C1C', fontWeight: 700 }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.취소완료_건수 || 0), 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>
                    {optionStats.reduce((sum, stat) => sum + (stat.취소완료_수량 || 0), 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirmModal && (
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              삭제 확인 ({ordersToDelete.length}건)
            </h3>

            <div className="overflow-x-auto mb-6">
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

            <div className="flex gap-3 justify-end">
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
            </div>
          </div>
        </div>
      )}

      {/* 송장일괄등록 모달 */}
      {showBulkInvoiceModal && (
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">송장일괄등록</h3>
            <p className="text-sm text-gray-600 mb-4">
              엑셀 파일에 다음 컬럼이 포함되어야 합니다:<br />
              - 주문번호<br />
              - 택배사<br />
              - 송장번호 (또는 운송장번호)
            </p>

            <div className="mb-4">
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

            <div className="flex gap-3 justify-end">
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
            </div>
          </div>
        </div>
      )}

      {/* 송장일괄수정 모달 */}
      {showBulkInvoiceUpdateModal && (
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">송장일괄수정</h3>
            <p className="text-sm text-gray-600 mb-4">
              엑셀 파일에 다음 컬럼이 포함되어야 합니다:<br />
              - 주문번호<br />
              - 택배사<br />
              - 송장번호 (또는 운송장번호)
            </p>

            <div className="mb-4">
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

            <div className="flex gap-3 justify-end">
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
            </div>
          </div>
        </div>
      )}

      {/* 삭제 결과 모달 */}
      {showDeleteResultModal && (
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">삭제 완료</h3>
            <p className="text-gray-700 mb-6">
              총 <span className="font-semibold text-blue-600">{deleteResult.count}건</span>의 주문이 삭제되었습니다.
            </p>
            <button
              onClick={() => setShowDeleteResultModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

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
                (o) => o.shipping_status === '발송완료' && (o.market_name || '미지정') === market
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
    </div>
  );
}
