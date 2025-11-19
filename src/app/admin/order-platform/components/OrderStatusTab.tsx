'use client';

import { useState, useMemo, useEffect } from 'react';
import { Package, TrendingUp, RefreshCw } from 'lucide-react';
import ModelessWindow from '@/components/ModelessWindow';

// 원물 집계 표시 컴포넌트
function RawMaterialSummaryContent({ data }: { data: any }) {
  const { options, rawMaterials, unmappedOptions } = data;

  const totalQuantity = options.reduce((sum: number, o: any) => sum + o.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 요약 카드 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">옵션상품</div>
            <div className="text-2xl font-bold text-blue-600">{options.length}개</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-gray-600 mb-1">총 수량</div>
            <div className="text-2xl font-bold text-green-600">{totalQuantity.toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-gray-600 mb-1">원물 종류</div>
            <div className="text-2xl font-bold text-purple-600">{rawMaterials.length}개</div>
          </div>
        </div>
        {unmappedOptions.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            ⚠️ 미매핑 옵션: {unmappedOptions.join(', ')}
          </div>
        )}
      </div>

      {/* 테이블 영역 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 옵션별 집계 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200">
              <h3 className="font-bold text-gray-900 text-sm">옵션별 집계</h3>
            </div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left font-medium text-gray-600">#</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600">옵션상품</th>
                    <th className="px-2 py-1 text-right font-medium text-gray-600">수량</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {options.map((opt: any, idx: number) => (
                    <tr key={idx} className={`hover:bg-gray-50 ${!opt.has_mapping ? 'bg-red-50' : ''}`}>
                      <td className="px-2 py-1 text-gray-500">{idx + 1}</td>
                      <td className="px-2 py-1">
                        <span className={!opt.has_mapping ? 'text-red-700' : 'text-gray-900'}>
                          {opt.option_name}
                          {!opt.has_mapping && <span className="ml-1 text-red-600">⚠️</span>}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right font-semibold text-green-600">
                        {opt.quantity.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 원물 필요량 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-green-50 px-4 py-2 border-b border-green-200">
              <h3 className="font-bold text-gray-900 text-sm">원물 필요량</h3>
            </div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left font-medium text-gray-600">#</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600">원물명</th>
                    <th className="px-2 py-1 text-right font-medium text-gray-600">필요량</th>
                    <th className="px-2 py-1 text-center font-medium text-gray-600">단위</th>
                    <th className="px-2 py-1 text-right font-medium text-gray-600">박스/관</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rawMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                        원물 정보가 없습니다
                      </td>
                    </tr>
                  ) : (
                    rawMaterials.map((rm: any, idx: number) => {
                      const standardUnitCount = rm.standard_quantity > 0
                        ? (rm.total_usage / rm.standard_quantity)
                        : 0;

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-1 text-gray-500">{idx + 1}</td>
                          <td className="px-2 py-1 text-gray-900 font-medium">{rm.name}</td>
                          <td className="px-2 py-1 text-right font-semibold text-blue-600">
                            {rm.total_usage.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 text-center text-gray-700">{rm.unit}</td>
                          <td className="px-2 py-1 text-right font-semibold text-purple-600">
                            {standardUnitCount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Order {
  id: number;
  order_number: string;
  organization_id: string;
  organization_name?: string;
  sub_account_id?: string;
  sub_account_name?: string;
  option_name: string;
  option_code?: string;
  quantity: number;
  product_amount?: string; // 원공급가 (공급단가 × 수량, 할인 전)
  discount_amount?: string; // 등급할인 금액
  settlement_amount: string;
  final_deposit_amount: number;
  cash_used: number;
  shipping_status: string;
  confirmed_at?: string;
  payment_confirmed_at?: string;
  cancel_requested_at?: string;
  canceled_at?: string;
  refund_processed_at?: string;
  created_at: string;
  vendor_name?: string;
}

interface OrderStatusTabProps {
  orders: Order[];
}

interface ProductAggregate {
  option_name: string;
  option_code: string;
  total_quantity: number;
  order_count: number;
  등록중: number;
  발주확정: number;
  결제완료: number;
  상품준비중: number;
  발송완료: number;
  취소요청: number;
  취소완료: number;
  환불완료: number;
}

export default function OrderStatusTab({ orders }: OrderStatusTabProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [selectedSubAccount, setSelectedSubAccount] = useState<string>('all');
  const [showRawMaterialSummary, setShowRawMaterialSummary] = useState(false);
  const [rawMaterialData, setRawMaterialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [optionCodeMap, setOptionCodeMap] = useState<Map<string, string>>(() => new Map());

  // 날짜 필터
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // 날짜 범위 설정 함수
  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1); // 오늘 포함

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // option_products에서 option_code 매핑 정보 조회
  useEffect(() => {
    const fetchOptionCodes = async () => {
      try {
        const uniqueOptionNames = [...new Set(orders.map(o => o.option_name).filter(Boolean))];

        if (uniqueOptionNames.length === 0) return;

        const response = await fetch('/api/option-products/codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_names: uniqueOptionNames })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const codeMap = new Map<string, string>();
            result.data.forEach((item: { option_name: string; option_code: string }) => {
              if (item.option_code) {
                codeMap.set(item.option_name, item.option_code);
              }
            });
            setOptionCodeMap(codeMap);
          }
        }
      } catch (error) {
        console.error('옵션코드 조회 실패:', error);
      }
    };

    fetchOptionCodes();
  }, [orders]);

  // 조직 목록 추출
  const organizations = useMemo(() => {
    const orgMap = new Map<string, string>();
    orders.forEach(order => {
      if (order.organization_id && order.organization_name) {
        orgMap.set(order.organization_id, order.organization_name);
      }
    });
    return Array.from(orgMap.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  // 서브계정 목록 추출 (선택된 조직 기준)
  const subAccounts = useMemo(() => {
    const subMap = new Map<string, string>();
    orders
      .filter(order => selectedOrg === 'all' || order.organization_id === selectedOrg)
      .forEach(order => {
        if (order.sub_account_id && order.sub_account_name) {
          subMap.set(order.sub_account_id, order.sub_account_name);
        }
      });
    return Array.from(subMap.entries()).map(([id, name]) => ({ id, name }));
  }, [orders, selectedOrg]);

  // 필터링된 주문
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 조직 필터
      if (selectedOrg !== 'all' && order.organization_id !== selectedOrg) return false;
      // 서브계정 필터
      if (selectedSubAccount !== 'all' && order.sub_account_id !== selectedSubAccount) return false;

      // 날짜 필터 (sheet_date 기준)
      if (order.sheet_date) {
        const orderDate = order.sheet_date.split('T')[0]; // YYYY-MM-DD 형식으로 변환
        if (orderDate < startDate || orderDate > endDate) return false;
      }

      return true;
    });
  }, [orders, selectedOrg, selectedSubAccount, startDate, endDate]);

  // 원물 집계 조회 함수
  const fetchRawMaterialSummary = async () => {
    if (filteredOrders.length === 0) {
      alert('조회된 주문이 없습니다.');
      return;
    }

    setLoading(true);
    try {
      // 현재 테이블에 보이는 옵션상품별 집계 사용
      const optionNames = [...new Set(filteredOrders.map(o => o.option_name).filter(Boolean))];

      // 옵션별 수량 집계
      const optionQuantities = new Map<string, number>();
      filteredOrders.forEach(order => {
        const current = optionQuantities.get(order.option_name) || 0;
        optionQuantities.set(order.option_name, current + Number(order.quantity || 0));
      });

      // 집계 데이터 준비
      const aggregatedOptions = Array.from(optionQuantities.entries()).map(([option_name, quantity]) => ({
        option_name,
        quantity
      }));

      // 테이블의 총수량 계산
      const tableTotal = productAggregates.reduce((sum, p) => sum + p.total_quantity, 0);
      const apiTotal = aggregatedOptions.reduce((sum, o) => sum + o.quantity, 0);

      console.log('🔍 원물집계 데이터 비교:', {
        테이블_총수량: tableTotal,
        API_총수량: apiTotal,
        테이블_옵션수: productAggregates.length,
        API_옵션수: aggregatedOptions.length,
        일치여부: tableTotal === apiTotal
      });

      // API에 옵션명과 수량 전달하여 원물 계산
      const response = await fetch('/api/raw-materials/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: aggregatedOptions
        })
      });

      const result = await response.json();

      if (result.success) {
        setRawMaterialData(result.data);
        setShowRawMaterialSummary(true);
      } else {
        alert('원물 집계 실패: ' + result.error);
      }
    } catch (error) {
      console.error('원물 집계 오류:', error);
      alert('원물 집계 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상태별 통계
  const statusStats = useMemo(() => {
    const stats = {
      등록중: { count: 0, quantity: 0, amount: 0 },
      발주확정: { count: 0, quantity: 0, amount: 0, cash: 0 },
      결제완료: { count: 0, quantity: 0, amount: 0, cash: 0 },
      상품준비중: { count: 0, quantity: 0, amount: 0, cash: 0 },
      발송완료: { count: 0, quantity: 0, amount: 0, cash: 0 },
      취소요청: { count: 0, quantity: 0, amount: 0, cash: 0 },
      취소완료: { count: 0, quantity: 0, amount: 0, cash: 0 },
      환불완료: { count: 0, quantity: 0, amount: 0, cash: 0 },
    };

    filteredOrders.forEach(order => {
      const status = order.shipping_status;
      const quantity = Number(order.quantity) || 0;
      const amount = Number(order.final_deposit_amount) || 0;
      const cash = Number(order.cash_used) || 0;

      if (status === '발주서등록' || status === '접수') {
        stats.등록중.count++;
        stats.등록중.quantity += quantity;
        stats.등록중.amount += Number(order.product_amount) || 0;
      } else if (status === '발주서확정') {
        stats.발주확정.count++;
        stats.발주확정.quantity += quantity;
        stats.발주확정.amount += amount;
        stats.발주확정.cash += cash;
      } else if (status === '결제완료') {
        stats.결제완료.count++;
        stats.결제완료.quantity += quantity;
        stats.결제완료.amount += amount;
        stats.결제완료.cash += cash;
      } else if (status === '상품준비중') {
        stats.상품준비중.count++;
        stats.상품준비중.quantity += quantity;
        stats.상품준비중.amount += amount;
        stats.상품준비중.cash += cash;
      } else if (status === '발송완료') {
        stats.발송완료.count++;
        stats.발송완료.quantity += quantity;
        stats.발송완료.amount += amount;
        stats.발송완료.cash += cash;
      } else if (status === '취소요청') {
        stats.취소요청.count++;
        stats.취소요청.quantity += quantity;
        stats.취소요청.amount += amount;
        stats.취소요청.cash += cash;
      } else if (status === '취소완료') {
        stats.취소완료.count++;
        stats.취소완료.quantity += quantity;
        stats.취소완료.amount += amount;
        stats.취소완료.cash += cash;
      } else if (status === '환불완료') {
        stats.환불완료.count++;
        stats.환불완료.quantity += quantity;
        stats.환불완료.amount += amount;
        stats.환불완료.cash += cash;
      }
    });

    return stats;
  }, [filteredOrders]);

  // 옵션상품별 집계
  const productAggregates = useMemo(() => {
    const productMap = new Map<string, ProductAggregate>();

    filteredOrders.forEach(order => {
      const optionName = order.option_name || '미지정';
      const optionCode = optionCodeMap.get(optionName) || order.option_code || '';
      const quantity = Number(order.quantity) || 0;
      const status = order.shipping_status;

      if (!productMap.has(optionName)) {
        productMap.set(optionName, {
          option_name: optionName,
          option_code: optionCode,
          total_quantity: 0,
          order_count: 0,
          등록중: 0,
          발주확정: 0,
          결제완료: 0,
          상품준비중: 0,
          발송완료: 0,
          취소요청: 0,
          취소완료: 0,
          환불완료: 0,
        });
      }

      const aggregate = productMap.get(optionName)!;
      aggregate.order_count++;
      aggregate.total_quantity += quantity;

      // 상태별 수량 집계
      if (status === '발주서등록' || status === '접수') {
        aggregate.등록중 += quantity;
      } else if (status === '발주서확정') {
        aggregate.발주확정 += quantity;
      } else if (status === '결제완료') {
        aggregate.결제완료 += quantity;
      } else if (status === '상품준비중') {
        aggregate.상품준비중 += quantity;
      } else if (status === '발송완료') {
        aggregate.발송완료 += quantity;
      } else if (status === '취소요청') {
        aggregate.취소요청 += quantity;
      } else if (status === '취소완료') {
        aggregate.취소완료 += quantity;
      } else if (status === '환불완료') {
        aggregate.환불완료 += quantity;
      }
    });

    // 옵션코드 오름차순으로 정렬
    return Array.from(productMap.values()).sort((a, b) => {
      // 코드가 있으면 코드로 정렬, 없으면 옵션명으로 정렬
      if (a.option_code && b.option_code) {
        return a.option_code.localeCompare(b.option_code);
      }
      return a.option_name.localeCompare(b.option_name, 'ko-KR');
    });
  }, [filteredOrders, optionCodeMap]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      등록중: 'bg-purple-100 text-purple-700',
      발주확정: 'bg-indigo-100 text-indigo-700',
      결제완료: 'bg-blue-100 text-blue-700',
      상품준비중: 'bg-yellow-100 text-yellow-700',
      발송완료: 'bg-green-100 text-green-700',
      취소요청: 'bg-orange-100 text-orange-700',
      취소완료: 'bg-gray-100 text-gray-700',
      환불완료: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        {/* 날짜 필터 */}
        <div className="mb-3 pb-3 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">기간 선택</label>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              />
              <span className="text-gray-500">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <button
              onClick={() => setDateRange(1)}
              className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200"
            >
              오늘
            </button>
            <button
              onClick={() => setDateRange(7)}
              className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200"
            >
              7일
            </button>
            <button
              onClick={() => setDateRange(30)}
              className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200"
            >
              30일
            </button>
          </div>
        </div>

        {/* 조직/서브계정 필터 */}
        <div className="flex gap-3 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">조직</label>
            <select
              value={selectedOrg}
              onChange={(e) => {
                setSelectedOrg(e.target.value);
                setSelectedSubAccount('all');
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 w-48"
            >
              <option value="all">전체 조직</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">서브계정</label>
            <select
              value={selectedSubAccount}
              onChange={(e) => setSelectedSubAccount(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 w-48"
              disabled={selectedOrg === 'all'}
            >
              <option value="all">전체 서브계정</option>
              {subAccounts.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-xs text-gray-600">
            총 <span className="font-semibold text-blue-600">{filteredOrders.length}</span>건
          </div>
        </div>
      </div>

      {/* 상태별 통계 카드 */}
      <div className="grid grid-cols-8 gap-2">
        {Object.entries(statusStats).map(([status, stat]) => (
          <div key={status} className={`${getStatusColor(status)} p-2 rounded-lg border`}>
            <div className="text-xs font-medium mb-1">{status}</div>
            <div className="text-base font-bold">{stat.count}건</div>
            <div className="text-sm font-semibold text-gray-700">수량: {stat.quantity.toLocaleString()}</div>
            <div className="text-xs mt-1">
              {stat.amount > 0 ? `${stat.amount.toLocaleString()}원` : '-'}
              {stat.cash > 0 && <span className="text-orange-600 ml-1">(-{stat.cash.toLocaleString()})</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 주문 목록 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">주문 목록</h3>
            </div>
          </div>
          <div className="overflow-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="px-2 py-1 text-left font-medium text-gray-600">조직/서브계정</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">옵션상품</th>
                  <th className="px-2 py-1 text-center font-medium text-gray-600">수량</th>
                  <th className="px-2 py-1 text-right font-medium text-gray-600">공급단가</th>
                  <th className="px-2 py-1 text-right font-medium text-gray-600">공급가</th>
                  <th className="px-2 py-1 text-right font-medium text-gray-600">할인액</th>
                  <th className="px-2 py-1 text-right font-medium text-gray-600">사용캐시</th>
                  <th className="px-2 py-1 text-right font-medium text-gray-600">최종입금액</th>
                  <th className="px-2 py-1 text-center font-medium text-gray-600">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-8 text-center text-gray-400">
                      조건에 맞는 주문이 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const status = order.shipping_status;
                    const sellerSupplyPrice = Number(order.seller_supply_price) || 0;
                    const productAmount = Number(order.product_amount) || 0;
                    const discountAmount = Number(order.discount_amount) || 0;
                    const cashUsed = Number(order.cash_used) || 0;
                    const finalDepositAmount = Number(order.final_deposit_amount) || 0;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-2 py-1">
                          <div className="text-gray-900">{order.organization_name || '-'}</div>
                          <div className="text-gray-500">{order.sub_account_name || '메인계정'}</div>
                        </td>
                        <td className="px-2 py-1 text-gray-900">{order.option_name}</td>
                        <td className="px-2 py-1 text-center text-gray-900">{order.quantity}</td>
                        <td className="px-2 py-1 text-right text-gray-700">
                          {sellerSupplyPrice > 0 ? sellerSupplyPrice.toLocaleString() : '-'}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-900 font-medium">
                          {productAmount > 0 ? productAmount.toLocaleString() : '-'}
                        </td>
                        <td className="px-2 py-1 text-right text-purple-600">
                          {discountAmount > 0 ? discountAmount.toLocaleString() : '-'}
                        </td>
                        <td className="px-2 py-1 text-right text-orange-600">
                          {cashUsed > 0 ? cashUsed.toLocaleString() : '-'}
                        </td>
                        <td className="px-2 py-1 text-right text-blue-600 font-semibold">
                          {finalDepositAmount > 0 ? finalDepositAmount.toLocaleString() : '-'}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 옵션상품별 집계표 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">옵션상품별 발주현황</h3>
              </div>
              <button
                onClick={fetchRawMaterialSummary}
                disabled={loading}
                className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    집계중...
                  </>
                ) : (
                  '원물집계'
                )}
              </button>
            </div>
          </div>
          <div className="overflow-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="px-1 py-1 text-left font-medium text-gray-600" style={{ width: '150px', maxWidth: '150px' }}>옵션상품</th>
                  <th className="px-1 py-1 text-center font-medium text-gray-600" style={{ width: '40px' }}>건수</th>
                  <th className="px-1 py-1 text-center font-medium text-gray-900" style={{ width: '45px' }}>총수량</th>
                  <th className="px-1 py-1 text-center font-medium text-purple-600" style={{ width: '42px' }}>등록중</th>
                  <th className="px-1 py-1 text-center font-medium text-indigo-600" style={{ width: '42px' }}>발주확정</th>
                  <th className="px-1 py-1 text-center font-medium text-blue-600" style={{ width: '42px' }}>결제완료</th>
                  <th className="px-1 py-1 text-center font-medium text-yellow-600" style={{ width: '42px' }}>준비중</th>
                  <th className="px-1 py-1 text-center font-medium text-green-600" style={{ width: '42px' }}>발송완료</th>
                  <th className="px-1 py-1 text-center font-medium text-orange-600" style={{ width: '42px' }}>취소요청</th>
                  <th className="px-1 py-1 text-center font-medium text-gray-600" style={{ width: '42px' }}>취소완료</th>
                  <th className="px-1 py-1 text-center font-medium text-red-600" style={{ width: '42px' }}>환불완료</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* 집계 행 */}
                {productAggregates.length > 0 && (
                  <tr className="bg-blue-50 border-b-2 border-blue-300 font-bold sticky" style={{ top: '28px' }}>
                    <td className="px-1 py-1 text-gray-900" style={{ width: '150px', maxWidth: '150px' }}>전체 집계</td>
                    <td className="px-1 py-1 text-center text-gray-900">
                      {productAggregates.reduce((sum, p) => sum + p.order_count, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-gray-900">
                      {productAggregates.reduce((sum, p) => sum + p.total_quantity, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-purple-600">
                      {productAggregates.reduce((sum, p) => sum + p.등록중, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-indigo-600">
                      {productAggregates.reduce((sum, p) => sum + p.발주확정, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-blue-600">
                      {productAggregates.reduce((sum, p) => sum + p.결제완료, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-yellow-600">
                      {productAggregates.reduce((sum, p) => sum + p.상품준비중, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-green-600">
                      {productAggregates.reduce((sum, p) => sum + p.발송완료, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-orange-600">
                      {productAggregates.reduce((sum, p) => sum + p.취소요청, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-gray-600">
                      {productAggregates.reduce((sum, p) => sum + p.취소완료, 0)}
                    </td>
                    <td className="px-1 py-1 text-center text-red-600">
                      {productAggregates.reduce((sum, p) => sum + p.환불완료, 0)}
                    </td>
                  </tr>
                )}

                {productAggregates.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-2 py-8 text-center text-gray-400">
                      집계 데이터가 없습니다
                    </td>
                  </tr>
                ) : (
                  productAggregates.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-1 py-1 text-gray-900 truncate" style={{ width: '150px', maxWidth: '150px' }} title={product.option_name}>{product.option_name}</td>
                      <td className="px-1 py-1 text-center text-gray-600">{product.order_count}</td>
                      <td className="px-1 py-1 text-center font-semibold text-gray-900">{product.total_quantity}</td>
                      <td className="px-1 py-1 text-center text-purple-600">{product.등록중 || '-'}</td>
                      <td className="px-1 py-1 text-center text-indigo-600">{product.발주확정 || '-'}</td>
                      <td className="px-1 py-1 text-center text-blue-600">{product.결제완료 || '-'}</td>
                      <td className="px-1 py-1 text-center text-yellow-600 font-semibold">{product.상품준비중 || '-'}</td>
                      <td className="px-1 py-1 text-center text-green-600 font-semibold">{product.발송완료 || '-'}</td>
                      <td className="px-1 py-1 text-center text-orange-600">{product.취소요청 || '-'}</td>
                      <td className="px-1 py-1 text-center text-gray-600">{product.취소완료 || '-'}</td>
                      <td className="px-1 py-1 text-center text-red-600">{product.환불완료 || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 원물집계 모달리스 윈도우 */}
      {showRawMaterialSummary && rawMaterialData && (
        <ModelessWindow
          title="원물 집계"
          isOpen={showRawMaterialSummary}
          onClose={() => setShowRawMaterialSummary(false)}
          defaultWidth={1100}
          defaultHeight={700}
          defaultX={150}
          defaultY={80}
        >
          <RawMaterialSummaryContent data={rawMaterialData} />
        </ModelessWindow>
      )}
    </div>
  );
}
