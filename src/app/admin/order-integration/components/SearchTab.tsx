'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter, Calendar, RefreshCw, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import * as XLSX from 'xlsx';

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

  // 선택된 주문 상태
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  // 상태 카드 필터
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 검색 필터 상태
  const [filters, setFilters] = useState<SearchFilters>(() => {
    // 한국 시간 기준으로 날짜 계산 (UTC+9)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const todayDate = koreaTime.toISOString().split('T')[0];

    return {
      startDate: todayDate,
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
    };
    loadInitialData();
  }, []);

  // marketTemplates와 columns가 로드되면 마켓 컬럼에 렌더러 추가
  useEffect(() => {
    if (marketTemplates.size > 0 && columns.length > 0) {
      // 이미 렌더러가 있는지 확인 (무한 루프 방지)
      const marketColumn = columns.find(c => c.key === 'market_name' || c.isMarketColumn);
      if (marketColumn && !marketColumn.renderer) {
        console.log('🎨 마켓 컬럼 렌더러 추가 시작, marketTemplates:', marketTemplates.size);
        const updatedColumns = columns.map((column) => {
          if (column.key === 'market_name' || column.isMarketColumn) {
            console.log('  - 마켓 컬럼 발견:', column.key, column.title);
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
                    className="px-2 py-0.5 rounded text-white text-xs font-medium"
                    style={{ backgroundColor: marketColor }}
                  >
                    {marketName}
                  </span>
                );
              }
            };
          }
          return column;
        });

        setColumns(updatedColumns);
        console.log('✓ 마켓 렌더러 추가 완료');
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
              };
              const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
              return (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
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
              if (i === 4) column.width = 150; // 주문번호
              if (i === 5) column.width = 100; // 주문자
              if (i === 6) column.width = 100; // 주문자전화번호
              if (i === 7) column.width = 100; // 수령인
              if (i === 9) column.width = 250; // 주소
              if (i === 10) column.width = 120; // 배송메시지

              // field_1 (마켓명) - 마켓 배지 렌더러는 제거 (useEffect에서 처리)
              if (i === 1) {
                column.isMarketColumn = true; // 마커 추가
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
      if (!statsMap.has(sellerId)) {
        statsMap.set(sellerId, {
          seller_id: sellerId,
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

        setStats({
          total: result.data?.length || 0,
          접수: statusCounts['접수'] || 0,
          결제완료: statusCounts['결제완료'] || 0,
          상품준비중: statusCounts['상품준비중'] || 0,
          발송완료: statusCounts['발송완료'] || 0,
          취소요청: statusCounts['취소요청'] || 0,
          취소완료: statusCounts['취소완료'] || 0,
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

  // 빠른 날짜 필터
  const setQuickDateFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    setFilters({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
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

  // 일괄적용 핸들러 - 선택된 주문에 택배사 적용
  const handleBulkApply = () => {
    console.log('일괄적용 시작:', { bulkApplyValue, selectedOrders, ordersLength: orders.length });

    if (!bulkApplyValue.trim()) {
      alert('택배사를 선택해주세요.');
      return;
    }
    if (selectedOrders.length === 0) {
      alert('적용할 주문을 선택해주세요.');
      return;
    }

    // 선택된 주문에 택배사 일괄 적용
    const updatedOrders = [...orders];
    selectedOrders.forEach(index => {
      console.log(`  - 주문 ${index} 업데이트:`, updatedOrders[index]?.order_number);
      updatedOrders[index] = {
        ...updatedOrders[index],
        courier_company: bulkApplyValue,
      };
    });

    setOrders(updatedOrders);
    console.log('일괄적용 완료');
  };

  // 발주확인 핸들러 - 선택된 결제완료 상태 주문을 상품준비중으로 변경
  const handleOrderConfirm = async () => {
    // 선택된 주문만 필터링
    if (selectedOrders.length === 0) {
      alert('발주확인할 주문을 선택해주세요.');
      return;
    }

    const confirmOrders = selectedOrders
      .map(index => orders[index])
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

  // 입금확인 핸들러 - 선택된 접수 상태 주문을 결제완료로 변경
  const handlePaymentConfirm = async () => {
    // 선택된 주문만 필터링
    if (selectedOrders.length === 0) {
      alert('입금확인할 주문을 선택해주세요.');
      return;
    }

    // 접수 상태인 주문만 필터링
    const confirmOrders = selectedOrders.filter(order => {
      const status = order.shipping_status || '결제완료';
      return status === '접수';
    });

    if (confirmOrders.length === 0) {
      alert('접수 상태인 주문만 입금확인할 수 있습니다.');
      return;
    }

    if (!confirm(`${confirmOrders.length}개의 주문을 입금확인 하시겠습니까?\n결제완료 상태로 변경됩니다.`)) {
      return;
    }

    try {
      // 상태를 결제완료로 변경한 주문 데이터 생성
      const updatedOrders = confirmOrders.map(order => ({
        ...order,
        shipping_status: '결제완료'
      }));

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: updatedOrders }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 주문이 입금확인 처리되었습니다.`);
        setSelectedOrders([]); // 선택 초기화
        fetchOrders();
      } else {
        alert('입금확인 실패: ' + result.error);
      }
    } catch (error) {
      console.error('입금확인 오류:', error);
      alert('입금확인 중 오류가 발생했습니다.');
    }
  };

  // 송장등록 핸들러 - 현재 화면의 모든 주문을 DB에 저장
  const handleTrackingRegister = async () => {
    if (orders.length === 0) return;

    try {
      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });

      const result = await response.json();

      if (result.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error('송장등록 오류:', error);
    }
  };

  // 벤더사별 엑셀 다운로드
  const handleVendorExcelDownload = (vendorName: string) => {
    const vendorOrders = orders.filter((o) => (o.vendor_name || '미지정') === vendorName);

    if (vendorOrders.length === 0) {
      alert('다운로드할 주문이 없습니다.');
      return;
    }

    const exportData = vendorOrders.map((order) => ({
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
    XLSX.utils.book_append_sheet(wb, ws, vendorName);

    const fileName = `${vendorName}_발송목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, WTF: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          alert('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // 엑셀 데이터에서 주문번호, 택배사, 송장번호 추출
        const invoiceMap = new Map<string, { courier: string; tracking: string }>();

        jsonData.forEach((row) => {
          const orderNumber = row['주문번호'] || row['order_number'];
          const courier = row['택배사'] || row['courier_company'];
          const tracking = row['송장번호'] || row['운송장번호'] || row['tracking_number'];

          if (orderNumber && courier && tracking) {
            invoiceMap.set(String(orderNumber).trim(), {
              courier: String(courier).trim(),
              tracking: String(tracking).trim(),
            });
          }
        });

        if (invoiceMap.size === 0) {
          alert('유효한 데이터가 없습니다.\n엑셀 파일에 "주문번호", "택배사", "송장번호" 컬럼이 있는지 확인해주세요.');
          return;
        }

        // UI 테이블의 주문과 매칭하여 업데이트
        const updates: Order[] = [];
        orders.forEach((order) => {
          if (order.order_number && invoiceMap.has(order.order_number)) {
            const invoice = invoiceMap.get(order.order_number)!;
            updates.push({
              ...order,
              courier_company: invoice.courier,
              tracking_number: invoice.tracking,
            });
          }
        });

        if (updates.length === 0) {
          alert('매칭되는 주문이 없습니다.');
          return;
        }

        if (!confirm(`${updates.length}개의 주문에 송장 정보를 업데이트 하시겠습니까?`)) {
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

  // 취소승인 핸들러 - 선택된 취소요청 주문을 취소완료로 변경
  const handleCancelApprove = async () => {
    // 선택된 주문만 필터링
    if (selectedOrders.length === 0) {
      alert('취소승인할 주문을 선택해주세요.');
      return;
    }

    const cancelOrders = selectedOrders
      .map(index => orders[index])
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
    if (!statusFilter) {
      return orders;
    }
    return orders.filter(order => {
      const orderStatus = order.shipping_status || '결제완료';
      return orderStatus === statusFilter;
    });
  }, [orders, statusFilter]);

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
      <div className="grid grid-cols-7 gap-4">
        <div
          onClick={() => handleStatusCardClick(null)}
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
            statusFilter === null
              ? 'border-gray-900 border-2 shadow-md'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">전체</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.total.toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('접수')}
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
            statusFilter === '접수'
              ? 'border-purple-600 border-2 shadow-md'
              : 'border-gray-200 hover:border-purple-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">접수</div>
          <div className="text-2xl font-semibold text-purple-600">{(stats.접수 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('결제완료')}
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
            statusFilter === '결제완료'
              ? 'border-blue-600 border-2 shadow-md'
              : 'border-gray-200 hover:border-blue-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">결제완료</div>
          <div className="text-2xl font-semibold text-blue-600">{(stats.결제완료 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('상품준비중')}
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
            statusFilter === '상품준비중'
              ? 'border-yellow-600 border-2 shadow-md'
              : 'border-gray-200 hover:border-yellow-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">상품준비중</div>
          <div className="text-2xl font-semibold text-yellow-600">{(stats.상품준비중 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('발송완료')}
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
            statusFilter === '발송완료'
              ? 'border-green-600 border-2 shadow-md'
              : 'border-gray-200 hover:border-green-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">발송완료</div>
          <div className="text-2xl font-semibold text-green-600">{(stats.발송완료 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('취소요청')}
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
            statusFilter === '취소요청'
              ? 'border-orange-600 border-2 shadow-md'
              : 'border-gray-200 hover:border-orange-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">취소요청</div>
          <div className="text-2xl font-semibold text-orange-600">{(stats.취소요청 || 0).toLocaleString()}</div>
        </div>
        <div
          onClick={() => handleStatusCardClick('취소완료')}
          className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
            statusFilter === '취소완료'
              ? 'border-red-600 border-2 shadow-md'
              : 'border-gray-200 hover:border-red-400'
          }`}
        >
          <div className="text-sm text-gray-600 mb-1">취소완료</div>
          <div className="text-2xl font-semibold text-red-600">{(stats.취소완료 || 0).toLocaleString()}</div>
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
                    <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 500, color: '#111827' }}>{stat.seller_id}</td>
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          {/* 날짜 유형 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜 기준</label>
            <select
              value={filters.dateType}
              onChange={(e) => setFilters({ ...filters, dateType: e.target.value as 'sheet' | 'payment' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="sheet">주문통합일</option>
              <option value="payment">결제일</option>
            </select>
          </div>

          {/* 시작일 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* 종료일 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* 빠른 날짜 필터 */}
          <div className="col-span-6 flex gap-2">
            <button
              onClick={() => setQuickDateFilter(1)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              오늘
            </button>
            <button
              onClick={() => setQuickDateFilter(7)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              7일
            </button>
            <button
              onClick={() => setQuickDateFilter(30)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              30일
            </button>
            <button
              onClick={() => setQuickDateFilter(90)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
            >
              90일
            </button>
          </div>

          {/* 마켓명 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">마켓명</label>
            <select
              value={filters.marketName}
              onChange={(e) => setFilters({ ...filters, marketName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">전체</option>
              <option value="스마트스토어">스마트스토어</option>
              <option value="쿠팡">쿠팡</option>
              <option value="11번가">11번가</option>
              <option value="토스">토스</option>
              <option value="전화주문">전화주문</option>
              <option value="플랫폼">플랫폼</option>
            </select>
          </div>

          {/* 발송상태 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">발송상태</label>
            <select
              value={filters.shippingStatus}
              onChange={(e) => setFilters({ ...filters, shippingStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">전체</option>
              <option value="접수">접수</option>
              <option value="결제완료">결제완료</option>
              <option value="상품준비중">상품준비중</option>
              <option value="발송완료">발송완료</option>
              <option value="취소요청">취소요청</option>
              <option value="취소완료">취소완료</option>
            </select>
          </div>

          {/* 벤더사 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">벤더사</label>
            <input
              type="text"
              value={filters.vendorName}
              onChange={(e) => setFilters({ ...filters, vendorName: e.target.value })}
              placeholder="벤더사명"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* 검색어 */}
          <div className="col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색어</label>
            <input
              type="text"
              value={filters.searchKeyword}
              onChange={(e) => setFilters({ ...filters, searchKeyword: e.target.value })}
              placeholder="주문번호, 수취인, 옵션명"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* 검색 버튼 */}
          <div className="col-span-2 flex gap-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              검색
            </button>
            <button
              onClick={handleExcelDownload}
              disabled={orders.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              엑셀
            </button>
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
            onDataChange={(newData) => setOrders(newData)}
            onSave={handleSaveData}
            onDeleteSelected={handleDeleteRows}
            onSelectionChange={setSelectedOrders}
            height="calc(100vh - 480px)"
            enableCSVExport={true}
            enableCSVImport={false}
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
                  <button
                    onClick={handleOrderConfirm}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                  >
                    발주확인
                  </button>
                  <button
                    onClick={handleCancelApprove}
                    className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700"
                  >
                    취소승인
                  </button>
                </div>
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
                  <button
                    onClick={handleTrackingRegister}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                  >
                    송장등록
                  </button>
                  <button
                    onClick={handleBulkInvoiceUpload}
                    className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    송장일괄등록
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExcelDownload}
                    disabled={orders.length === 0}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 disabled:bg-gray-400 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    마켓송장파일
                  </button>
                </div>
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
    </div>
  );
}
