'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Filter, Calendar, RefreshCw } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import * as XLSX from 'xlsx';

interface Order {
  id: number;
  sheet_date: string;
  market_name: string;
  order_number: string;
  payment_date?: string;
  recipient_name: string;
  recipient_phone?: string;
  recipient_address?: string;
  option_name: string;
  quantity: number;
  seller_supply_price?: number;
  shipping_source?: string;
  invoice_issuer?: string;
  vendor_name?: string;
  shipping_status: string;
  tracking_number?: string;
  courier_company?: string;
  shipped_date?: string;
  cs_status?: string;
  memo?: string;
  created_at: string;
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

export default function SearchTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    미발송: 0,
    발송준비: 0,
    발송완료: 0,
  });

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

  // EditableAdminGrid 컬럼 정의
  const columns = [
    { key: 'sheet_date', title: '주문통합일', width: 100, type: 'date' as const },
    { key: 'market_name', title: '마켓명', width: 100 },
    { key: 'order_number', title: '주문번호', width: 150 },
    { key: 'payment_date', title: '결제일', width: 100, type: 'date' as const },
    { key: 'recipient_name', title: '수취인', width: 100 },
    { key: 'recipient_phone', title: '전화번호', width: 120 },
    { key: 'recipient_address', title: '주소', width: 250 },
    { key: 'option_name', title: '옵션명', width: 200 },
    { key: 'quantity', title: '수량', width: 70, type: 'number' as const },
    { key: 'seller_supply_price', title: '셀러공급가', width: 100, type: 'number' as const },
    { key: 'shipping_source', title: '출고처', width: 100 },
    { key: 'invoice_issuer', title: '송장주체', width: 100 },
    { key: 'vendor_name', title: '벤더사', width: 100 },
    { key: 'shipping_status', title: '발송상태', width: 90 },
    { key: 'tracking_number', title: '송장번호', width: 130 },
    { key: 'courier_company', title: '택배사', width: 100 },
    { key: 'shipped_date', title: '발송일', width: 100, type: 'date' as const },
    { key: 'cs_status', title: 'CS상태', width: 90 },
    { key: 'memo', title: '메모', width: 150 },
  ];

  // 주문 조회
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
          const status = order.shipping_status || '미발송';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        setStats({
          total: result.data?.length || 0,
          미발송: statusCounts['미발송'] || 0,
          발송준비: statusCounts['발송준비'] || 0,
          발송완료: statusCounts['발송완료'] || 0,
        });
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

  // 행 삭제 핸들러
  const handleDeleteRows = async (rowsToDelete: any[]) => {
    if (!confirm(`선택한 ${rowsToDelete.length}개 주문을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const ids = rowsToDelete.map((row) => row.id).filter((id) => id);

      const response = await fetch('/api/integrated-orders/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 주문이 삭제되었습니다.`);
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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">총 주문</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">미발송</div>
          <div className="text-2xl font-semibold text-red-600">{stats.미발송.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">발송준비</div>
          <div className="text-2xl font-semibold text-yellow-600">{stats.발송준비.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">발송완료</div>
          <div className="text-2xl font-semibold text-green-600">{stats.발송완료.toLocaleString()}</div>
        </div>
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
              <option value="미발송">미발송</option>
              <option value="발송준비">발송준비</option>
              <option value="발송완료">발송완료</option>
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
      <div className="bg-white rounded-lg border border-gray-200">
        <EditableAdminGrid
          columns={columns}
          data={orders}
          onDataChange={(newData) => setOrders(newData)}
          onSave={handleSaveData}
          onDelete={handleDeleteRows}
          height="calc(100vh - 480px)"
          enableCSVExport={true}
          enableCSVImport={false}
        />
      </div>
    </div>
  );
}
