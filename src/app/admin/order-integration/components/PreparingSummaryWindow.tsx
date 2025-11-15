'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PreparingSummary {
  option_name: string;
  total_quantity: number;
  total_amount: number;
  order_count: number;
  vendor_name: string;
}

interface RawMaterialSummary {
  id: string;
  name: string;
  unit: string;
  total_usage: number;
  standard_quantity: number;
}

interface PreparingSummaryWindowProps {
  startDate: string;
  endDate: string;
}

export default function PreparingSummaryWindow({ startDate, endDate }: PreparingSummaryWindowProps) {
  const [data, setData] = useState<PreparingSummary[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialSummary[]>([]);
  const [unmappedOptions, setUnmappedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate,
    endDate,
  });

  // 데이터 조회
  const fetchData = async () => {
    if (!filters.startDate || !filters.endDate) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        // shippingStatus 파라미터 제거 - 전체 주문 집계
      });

      console.log('🔍 집계 조회 파라미터:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        url: `/api/integrated-orders/preparing-summary?${params}`
      });

      const res = await fetch(`/api/integrated-orders/preparing-summary?${params}`);
      const result = await res.json();

      console.log('📊 집계 조회 결과:', {
        success: result.success,
        orderCount: result.data?.orders?.length || 0,
        rawMaterialCount: result.data?.rawMaterials?.length || 0
      });

      if (result.success) {
        // 옵션상품 기준 가나다순 정렬
        const sortedOrders = (result.data?.orders || []).sort((a, b) =>
          a.option_name.localeCompare(b.option_name, 'ko-KR')
        );

        // 원물명 기준 가나다순 정렬
        const sortedRawMaterials = (result.data?.rawMaterials || []).sort((a, b) =>
          a.name.localeCompare(b.name, 'ko-KR')
        );

        setData(sortedOrders);
        setRawMaterials(sortedRawMaterials);
        setUnmappedOptions(result.data?.unmappedOptions || []);
      } else {
        alert('데이터 조회 실패: ' + result.error);
      }
    } catch (error) {
      console.error('집계 조회 오류:', error);
      alert('집계 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 날짜 변경 시 자동 조회
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchData();
    }
  }, [filters]);

  // 총계 계산
  const totalSummary = data.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.total_quantity,
      amount: acc.amount + item.total_amount,
      orders: acc.orders + item.order_count,
    }),
    { quantity: 0, amount: 0, orders: 0 }
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 필터 및 새로고침 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            기간: {filters.startDate} ~ {filters.endDate}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        {/* 총계 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">총 주문 건수</div>
            <div className="text-2xl font-bold text-blue-600">{totalSummary.orders.toLocaleString()}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-gray-600 mb-1">총 수량</div>
            <div className="text-2xl font-bold text-green-600">{totalSummary.quantity.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 테이블 영역 - 3개 테이블 */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-500">집계 데이터 로딩중...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            상품준비중 상태의 주문이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* 옵션별 집계 테이블 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900" style={{ fontSize: '14px' }}>옵션별 주문 집계</h3>
                <div className="text-xs">
                  <span className="text-gray-600">전체 {data.length}개 옵션</span>
                  {unmappedOptions.length > 0 && (
                    <span className="ml-2 text-red-600 font-semibold">미매핑 {unmappedOptions.length}개</span>
                  )}
                </div>
              </div>
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full" style={{ fontSize: '16px' }}>
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">번호</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">옵션상품</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">벤더</th>
                      <th className="px-2 py-2 text-right text-sm font-medium text-gray-500">건수</th>
                      <th className="px-2 py-2 text-right text-sm font-medium text-gray-500">수량</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => {
                      const isUnmapped = unmappedOptions.includes(item.option_name);
                      return (
                        <tr key={index} className={`hover:bg-gray-50 ${isUnmapped ? 'bg-red-50' : ''}`}>
                          <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                          <td className="px-2 py-2 font-medium flex items-center gap-1">
                            <span className={isUnmapped ? 'text-red-700' : 'text-gray-900'}>{item.option_name}</span>
                            {isUnmapped && <span className="text-xs text-red-600 font-bold">⚠️</span>}
                          </td>
                          <td className="px-2 py-2 text-gray-700">{item.vendor_name || '-'}</td>
                          <td className="px-2 py-2 text-right text-gray-900">{item.order_count.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right font-medium text-green-600">{item.total_quantity.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300 sticky bottom-0">
                    <tr>
                      <td colSpan={3} className="px-2 py-2 font-bold text-gray-900">합계</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-900">{totalSummary.orders.toLocaleString()}</td>
                      <td className="px-2 py-2 text-right font-bold text-green-600">{totalSummary.quantity.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 원물 필요량 테이블 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-green-50 px-4 py-2 border-b border-green-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900" style={{ fontSize: '14px' }}>원물 필요량</h3>
                <div className="text-xs text-gray-600">
                  매핑된 원물 {rawMaterials.length}개
                </div>
              </div>
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full" style={{ fontSize: '16px' }}>
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">번호</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">원물명</th>
                      <th className="px-2 py-2 text-right text-sm font-medium text-gray-500">필요량</th>
                      <th className="px-2 py-2 text-center text-sm font-medium text-gray-500">단위</th>
                      <th className="px-2 py-2 text-right text-sm font-medium text-gray-500">표준단위(박스/관)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rawMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-gray-500">원물 정보가 없습니다</td>
                      </tr>
                    ) : (
                      rawMaterials.map((item, index) => {
                        const standardUnitCount = item.standard_quantity > 0
                          ? (item.total_usage / item.standard_quantity)
                          : 0;

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                            <td className="px-2 py-2 text-gray-900 font-medium">{item.name}</td>
                            <td className="px-2 py-2 text-right font-medium text-blue-600">{item.total_usage.toFixed(2)}</td>
                            <td className="px-2 py-2 text-center text-gray-700">{item.unit}</td>
                            <td className="px-2 py-2 text-right font-medium text-purple-600">{standardUnitCount.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 자재 필요량 테이블 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-purple-50 px-4 py-2 border-b border-purple-200">
                <h3 className="font-bold text-gray-900" style={{ fontSize: '14px' }}>자재 필요량</h3>
              </div>
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full" style={{ fontSize: '16px' }}>
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">번호</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">자재명</th>
                      <th className="px-2 py-2 text-right text-sm font-medium text-gray-500">필요량</th>
                      <th className="px-2 py-2 text-center text-sm font-medium text-gray-500">단위</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center text-gray-500">자재 정보는 다음 단계에서 구현 예정</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
