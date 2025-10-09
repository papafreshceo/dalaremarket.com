'use client';

import { useState, useEffect } from 'react';
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
  seller_name?: string;
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
  seller_id?: string;
  separate_shipping?: string;
  delivery_fee?: string;
  shipped_date?: string;
  courier_company?: string;
  tracking_number?: string;
  shipping_status?: string;
  cs_status?: string;
  memo?: string;
  is_deleted?: boolean;
  is_canceled?: boolean;
  order_confirmed?: boolean;
  invoice_registered?: boolean;
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
    결제완료: 0,
    상품준비중: 0,
    발송완료: 0,
    취소요청: 0,
    취소완료: 0,
  });
  const [vendorStats, setVendorStats] = useState<VendorStats[]>([]);
  const [vendorStatsExpanded, setVendorStatsExpanded] = useState(true);
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

  // 검색 필터 상태
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7일 전
    endDate: new Date().toISOString().split('T')[0], // 오늘
    dateType: 'sheet',
    marketName: '',
    searchKeyword: '',
    shippingStatus: '',
    vendorName: '',
  });

  // 일괄적용 택배사 선택값 상태
  const [bulkApplyValue, setBulkApplyValue] = useState('');

  // 마켓 템플릿 먼저 로드한 후 표준 필드와 택배사 로드
  useEffect(() => {
    const loadInitialData = async () => {
      const templates = await loadMarketTemplates();
      await loadStandardFields(templates);
      await loadCouriers();
    };
    loadInitialData();
  }, []);

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

  // 마켓명 배지 렌더러
  const renderMarketBadge = (value: any, row: any) => {
    const marketName = value || row.market_name;
    if (!marketName) return '';

    // 마켓 템플릿에서 색상 가져오기
    const template = marketTemplates.get(marketName.toLowerCase());
    let marketColor = '#6B7280'; // 기본 회색

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
  };

  const loadStandardFields = async (templates?: Map<string, any>) => {
    try {
      const response = await fetch('/api/mapping-settings/fields');
      const result = await response.json();

      if (result.success && result.data) {
        const standardRow = result.data.find((row: any) => row.market_name === '표준필드');
        const templateMap = templates || marketTemplates;

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
            'seller_name',              // field_17 - 셀러
            'seller_supply_price',      // field_18 - 셀러공급가
            'shipping_source',          // field_19 - 출고처
            'invoice_issuer',           // field_20 - 송장주체
            'vendor_name',              // field_21 - 벤더사
            'shipping_location_name',   // field_22 - 발송지명
            'shipping_location_address', // field_23 - 발송지주소
            'shipping_location_contact', // field_24 - 발송지연락처
            'shipping_cost',            // field_25 - 출고비용
            'settlement_amount',        // field_26 - 정산예정금액
            'settlement_target_amount', // field_27 - 정산대상금액
            'product_amount',           // field_28 - 상품금액
            'final_payment_amount',     // field_29 - 최종결제금액
            'discount_amount',          // field_30 - 할인금액
            'platform_discount',        // field_31 - 마켓부담할인금액
            'seller_discount',          // field_32 - 판매자할인쿠폰할인
            'buyer_coupon_discount',    // field_33 - 구매쿠폰적용금액
            'coupon_discount',          // field_34 - 쿠폰할인금액
            'other_support_discount',   // field_35 - 기타지원금할인금
            'commission_1',             // field_36 - 수수료1
            'commission_2',             // field_37 - 수수료2
            'seller_id',                // field_38 - 판매아이디
            'separate_shipping',        // field_39 - 분리배송 Y/N
            'delivery_fee',             // field_40 - 택배비
            'shipped_date',             // field_41 - 발송일(송장입력일)
            'courier_company',          // field_42 - 택배사
            'tracking_number',          // field_43 - 송장번호
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

          // field_1 ~ field_43 표준 필드 순회
          for (let i = 1; i <= 43; i++) {
            // field_4(주문번호) 차례가 되면 먼저 택배사(42), 송장번호(43) 삽입
            if (i === 4) {
              // 택배사(field_42)
              const courierFieldValue = standardRow['field_42'];
              const courierDbColumn = fieldToColumnMap[42];
              if (courierFieldValue && courierFieldValue.trim() && courierDbColumn) {
                dynamicColumns.push({
                  key: courierDbColumn,
                  title: courierFieldValue,
                  width: 100
                });
              }

              // 송장번호(field_43)
              const trackingFieldValue = standardRow['field_43'];
              const trackingDbColumn = fieldToColumnMap[43];
              if (trackingFieldValue && trackingFieldValue.trim() && trackingDbColumn) {
                dynamicColumns.push({
                  key: trackingDbColumn,
                  title: trackingFieldValue,
                  width: 120
                });
              }
            }

            // 42, 43은 이미 주문번호 앞에 추가했으므로 스킵
            if (i === 42 || i === 43) {
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

              // field_1 (마켓명) - 마켓 배지 렌더러
              if (i === 1 && templateMap.size > 0) {
                column.renderer = (value: any, row: any) => renderMarketBadge(value, row);
              }

              dynamicColumns.push(column);
            }
          }

          console.log('Generated columns:', dynamicColumns.length, dynamicColumns);
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

      if (status === '결제완료') {
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
    statsArray.sort((a, b) => (b.결제완료_건수 + b.상품준비중_건수 + b.발송완료_건수 + b.취소요청_건수 + b.취소완료_건수) - (a.결제완료_건수 + a.상품준비중_건수 + a.발송완료_건수 + a.취소요청_건수 + a.취소완료_건수));
    setVendorStats(statsArray);
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

      if (result.success) {
        setOrders(result.data || []);

        // 통계 계산
        const statusCounts = (result.data || []).reduce((acc: any, order: Order) => {
          const status = order.shipping_status || '결제완료';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setStats({
          total: result.data?.length || 0,
          결제완료: statusCounts['결제완료'] || 0,
          상품준비중: statusCounts['상품준비중'] || 0,
          발송완료: statusCounts['발송완료'] || 0,
          취소요청: statusCounts['취소요청'] || 0,
          취소완료: statusCounts['취소완료'] || 0,
        });

        // 벤더사별 집계 계산
        calculateVendorStats(result.data || []);
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

  // 발주확인 핸들러 - 결제완료 상태 주문을 상품준비중으로 변경
  const handleOrderConfirm = async () => {
    const confirmOrders = orders.filter(order => order.shipping_status === '결제완료');

    if (confirmOrders.length === 0) {
      alert('발주확인할 주문이 없습니다. (결제완료 상태만 가능)');
      return;
    }

    if (!confirm(`${confirmOrders.length}개의 주문을 발주확인 하시겠습니까?\n상품준비중 상태로 변경됩니다.`)) {
      return;
    }

    try {
      const updates = confirmOrders.map(order => ({
        ...order,
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
        fetchOrders();
      } else {
        alert('발주확인 실패: ' + result.error);
      }
    } catch (error) {
      console.error('발주확인 오류:', error);
      alert('발주확인 중 오류가 발생했습니다.');
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
        const workbook = XLSX.read(data, { type: 'binary' });
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

  // 취소승인 핸들러
  const handleCancelApprove = () => {
    alert('취소승인 기능은 개발 예정입니다.');
  };

  // 행 삭제 핸들러 (소프트 삭제)
  const handleDeleteRows = (indices: number[]) => {
    // 인덱스로 실제 주문 데이터 가져오기
    const rowsToDelete = indices.map(index => orders[index]);
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
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">전체</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">결제완료</div>
          <div className="text-2xl font-semibold text-blue-600">{stats.결제완료.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">상품준비중</div>
          <div className="text-2xl font-semibold text-yellow-600">{stats.상품준비중.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">발송완료</div>
          <div className="text-2xl font-semibold text-green-600">{stats.발송완료.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">취소요청</div>
          <div className="text-2xl font-semibold text-orange-600">{stats.취소요청.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">취소완료</div>
          <div className="text-2xl font-semibold text-red-600">{stats.취소완료.toLocaleString()}</div>
        </div>
      </div>

      {/* 벤더사별 집계 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">벤더사별 집계</h3>
            <button
              onClick={() => setVendorStatsExpanded(!vendorStatsExpanded)}
              className="p-1 hover:bg-blue-100 rounded bg-blue-50"
            >
              {vendorStatsExpanded ? (
                <ChevronUp className="w-4 h-4 text-blue-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600" />
              )}
            </button>
          </div>
        </div>
        {vendorStatsExpanded && (
          <div className="overflow-x-auto" style={{ fontSize: '14px !important' }}>
            <table className="w-full" style={{ fontSize: '14px !important' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th rowSpan={2} className="px-4 py-3 text-left font-medium text-gray-600 border-r border-gray-200">벤더사</th>
                  <th colSpan={2} className="px-4 py-2 text-center font-medium text-blue-600 border-r border-gray-200">결제완료</th>
                  <th colSpan={2} className="px-4 py-2 text-center font-medium text-yellow-600 border-r border-gray-200">상품준비중</th>
                  <th colSpan={2} className="px-4 py-2 text-center font-medium text-green-600 border-r border-gray-200">발송완료</th>
                  <th colSpan={2} className="px-4 py-2 text-center font-medium text-orange-600 border-r border-gray-200">취소요청</th>
                  <th colSpan={2} className="px-4 py-2 text-center font-medium text-red-600 border-r border-gray-200">취소완료</th>
                  <th rowSpan={2} className="px-4 py-3 text-center font-medium text-gray-600">전송파일</th>
                </tr>
                <tr>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">건수</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">수량</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">건수</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">수량</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">건수</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">수량</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">건수</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">수량</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">건수</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200">수량</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendorStats.map((stat) => (
                  <tr key={stat.shipping_source} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">{stat.shipping_source}</td>
                    <td className="px-2 py-3 text-center text-blue-700 border-r border-gray-200">{(stat.결제완료_건수 || 0) > 0 ? stat.결제완료_건수.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-blue-700 border-r border-gray-200">{(stat.결제완료_수량 || 0) > 0 ? stat.결제완료_수량.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-yellow-700 border-r border-gray-200">{(stat.상품준비중_건수 || 0) > 0 ? stat.상품준비중_건수.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-yellow-700 border-r border-gray-200">{(stat.상품준비중_수량 || 0) > 0 ? stat.상품준비중_수량.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-green-700 border-r border-gray-200">{(stat.발송완료_건수 || 0) > 0 ? stat.발송완료_건수.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-green-700 border-r border-gray-200">{(stat.발송완료_수량 || 0) > 0 ? stat.발송완료_수량.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-orange-700 border-r border-gray-200">{(stat.취소요청_건수 || 0) > 0 ? stat.취소요청_건수.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-orange-700 border-r border-gray-200">{(stat.취소요청_수량 || 0) > 0 ? stat.취소요청_수량.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-red-700 border-r border-gray-200">{(stat.취소완료_건수 || 0) > 0 ? stat.취소완료_건수.toLocaleString() : ''}</td>
                    <td className="px-2 py-3 text-center text-red-700 border-r border-gray-200">{(stat.취소완료_수량 || 0) > 0 ? stat.취소완료_수량.toLocaleString() : ''}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleVendorExcelDownload(stat.shipping_source)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          엑셀
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vendorStats.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
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
            data={orders}
            onDataChange={(newData) => setOrders(newData)}
            onSave={handleSaveData}
            onDeleteSelected={handleDeleteRows}
            onSelectionChange={setSelectedOrders}
            height="calc(100vh - 480px)"
            enableCSVExport={true}
            enableCSVImport={false}
            customActions={
              <>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50">
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
                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50">
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
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50">
                  <button
                    onClick={handleExcelDownload}
                    disabled={orders.length === 0}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 disabled:bg-gray-400 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    마켓송장파일
                  </button>
                </div>
              </>
            }
          />
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
