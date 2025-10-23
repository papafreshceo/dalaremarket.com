'use client';

import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export interface SearchFilters {
  startDate: string;
  endDate: string;
  dateType: 'sheet' | 'payment';
  marketName: string;
  searchKeyword: string;
  shippingStatus: string;
  vendorName: string;
}

interface OrderFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onQuickDateFilter: (days: number) => void;
  uniqueMarkets: string[];
  uniqueStatuses: string[];
  uniqueVendors: string[];
  isQuickDateFilterActive: (days: number) => boolean;
}

export default function OrderFilters({
  filters,
  onFiltersChange,
  onSearch,
  onQuickDateFilter,
  uniqueMarkets,
  uniqueStatuses,
  uniqueVendors,
  isQuickDateFilterActive,
}: OrderFiltersProps) {
  const isFirstRender = useRef(true);

  // 검색어 변경 시 자동 조회
  useEffect(() => {
    // 초기 렌더링은 제외
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchKeyword]); // onSearch는 의존성에서 제외 (무한 루프 방지)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        {/* 날짜 유형 */}
        <select
          value={filters.dateType}
          onChange={(e) => onFiltersChange({ ...filters, dateType: e.target.value as 'sheet' | 'payment' })}
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
          onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
          className="px-2 border border-gray-300 rounded text-xs"
          style={{ width: '130px', height: '30px' }}
        />

        {/* 종료일 */}
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
          className="px-2 border border-gray-300 rounded text-xs"
          style={{ width: '130px', height: '30px' }}
        />

        {/* 빠른 날짜 필터 */}
        <button
          onClick={() => onQuickDateFilter(0)}
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
          onClick={() => onQuickDateFilter(-1)}
          className={`px-1 text-xs rounded hover:bg-gray-50 ${
            isQuickDateFilterActive(-1)
              ? 'border-2 border-blue-500 bg-blue-50'
              : 'border border-gray-300'
          }`}
          style={{ width: '60px', height: '30px' }}
        >
          어제
        </button>
        <button
          onClick={() => onQuickDateFilter(6)}
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
          onClick={() => onQuickDateFilter(29)}
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
          onClick={() => onQuickDateFilter(89)}
          className={`px-1 text-xs rounded hover:bg-gray-50 ${
            isQuickDateFilterActive(89)
              ? 'border-2 border-blue-500 bg-blue-50'
              : 'border border-gray-300'
          }`}
          style={{ width: '60px', height: '30px' }}
        >
          90일
        </button>

        {/* 조회 버튼 */}
        <button
          onClick={onSearch}
          className="px-3 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700"
          style={{ height: '30px' }}
        >
          조회
        </button>

        {/* 마켓명 */}
        <select
          value={filters.marketName}
          onChange={(e) => onFiltersChange({ ...filters, marketName: e.target.value })}
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
          onChange={(e) => onFiltersChange({ ...filters, shippingStatus: e.target.value })}
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
          onChange={(e) => onFiltersChange({ ...filters, vendorName: e.target.value })}
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
            onChange={(e) => onFiltersChange({ ...filters, searchKeyword: e.target.value })}
            placeholder=""
            className="w-full h-full pl-7 pr-2 border-2 border-blue-500 rounded text-xs"
          />
        </div>
      </div>
    </div>
  );
}
