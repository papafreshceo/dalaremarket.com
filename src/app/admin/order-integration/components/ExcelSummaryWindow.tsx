'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface OrderData {
  field_11?: string; // 옵션상품
  field_12?: string; // 수량
  field_22?: string; // 벤더사
  field_27?: string; // 정산예정금액
}

interface OptionSummary {
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

interface UnmatchedOption {
  option_name: string;
  total_quantity: number;
  order_count: number;
}

interface ExcelSummaryWindowProps {
  orders: OrderData[];
}

export default function ExcelSummaryWindow({ orders }: ExcelSummaryWindowProps) {
  const [optionSummary, setOptionSummary] = useState<OptionSummary[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialSummary[]>([]);
  const [unmatchedOptions, setUnmatchedOptions] = useState<UnmatchedOption[]>([]);
  const [loading, setLoading] = useState(true);

  // 원물 필요량 계산
  const calculateRawMaterials = useCallback(async (optionData: OptionSummary[]) => {
    try {
      const supabase = createClient();

      // 옵션상품명 목록 추출
      const optionNames = [...new Set(optionData.map(o => o.option_name).filter(Boolean))];

      if (optionNames.length === 0) {
        setRawMaterials([]);
        return;
      }

      // 옵션상품 정보 조회
      const { data: optionProductsData, error: optionError } = await supabase
        .from('option_products')
        .select('id, option_name')
        .in('option_name', optionNames);

      if (optionError) {
        console.error('옵션상품 조회 오류:', optionError);
        setRawMaterials([]);
        return;
      }

      const optionProductIds = optionProductsData?.map(op => op.id) || [];
      const optionNameToId = new Map(
        optionProductsData?.map(op => [op.option_name, op.id]) || []
      );

      // 원물 링크 조회
      const { data: materialsLinksData, error: materialsLinksError } = await supabase
        .from('option_product_materials')
        .select('option_product_id, quantity, raw_material_id')
        .in('option_product_id', optionProductIds);

      if (materialsLinksError) {
        console.error('원물 링크 조회 오류:', materialsLinksError);
        setRawMaterials([]);
        return;
      }

      // 원물 ID 목록 추출
      const rawMaterialIds = [
        ...new Set(
          materialsLinksData
            ?.map(link => link.raw_material_id)
            .filter(Boolean) || []
        )
      ];

      if (rawMaterialIds.length === 0) {
        setRawMaterials([]);
        return;
      }

      // 원물 정보 조회
      const { data: rawMaterialsData, error: rawMaterialsError } = await supabase
        .from('raw_materials')
        .select('id, material_name, standard_unit, standard_quantity')
        .in('id', rawMaterialIds);

      if (rawMaterialsError) {
        console.error('원물 정보 조회 오류:', rawMaterialsError);
        setRawMaterials([]);
        return;
      }

      // 원물 ID로 매핑
      const rawMaterialsById = new Map(
        rawMaterialsData?.map(rm => [rm.id, rm]) || []
      );

      // 옵션상품ID별 원물 정보 매핑
      const optionToMaterials = new Map<number, Array<{
        rawMaterial: { id: string; material_name: string; standard_unit: string; standard_quantity: number };
        quantity: number;
      }>>();

      materialsLinksData?.forEach((link: any) => {
        if (!optionToMaterials.has(link.option_product_id)) {
          optionToMaterials.set(link.option_product_id, []);
        }

        const rawMaterial = rawMaterialsById.get(link.raw_material_id);
        if (rawMaterial) {
          optionToMaterials.get(link.option_product_id)!.push({
            rawMaterial,
            quantity: typeof link.quantity === 'string'
              ? parseFloat(link.quantity) || 0
              : link.quantity || 0,
          });
        }
      });

      // 원물 집계 + 매칭 안 된 옵션 추적
      const rawMaterialMap = new Map<string, RawMaterialSummary>();
      const unmatchedList: UnmatchedOption[] = [];

      optionData.forEach((option) => {
        const optionProductId = optionNameToId.get(option.option_name);

        // 옵션상품이 DB에 없는 경우
        if (!optionProductId) {
          unmatchedList.push({
            option_name: option.option_name,
            total_quantity: option.total_quantity,
            order_count: option.order_count,
          });
          return;
        }

        const materials = optionToMaterials.get(optionProductId);

        // 옵션상품은 있지만 원물 연결이 없는 경우
        if (!materials || materials.length === 0) {
          unmatchedList.push({
            option_name: option.option_name,
            total_quantity: option.total_quantity,
            order_count: option.order_count,
          });
          return;
        }

        // 원물 집계
        materials.forEach(({ rawMaterial, quantity: materialQuantity }) => {
          const totalUsage = materialQuantity * option.total_quantity;

          if (rawMaterialMap.has(rawMaterial.id)) {
            const existing = rawMaterialMap.get(rawMaterial.id)!;
            existing.total_usage += totalUsage;
          } else {
            rawMaterialMap.set(rawMaterial.id, {
              id: rawMaterial.id,
              name: rawMaterial.material_name,
              unit: rawMaterial.standard_unit || 'kg',
              total_usage: totalUsage,
              standard_quantity: typeof rawMaterial.standard_quantity === 'string'
                ? parseFloat(rawMaterial.standard_quantity) || 0
                : rawMaterial.standard_quantity || 0,
            });
          }
        });
      });

      const rawMaterialSummary = Array.from(rawMaterialMap.values())
        .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR')); // 가나다순

      setRawMaterials(rawMaterialSummary);
      setUnmatchedOptions(unmatchedList.sort((a, b) =>
        a.option_name.localeCompare(b.option_name, 'ko-KR')
      ));
    } catch (error) {
      console.error('원물 계산 오류:', error);
      setRawMaterials([]);
    }
  }, []);

  // 데이터 집계
  const calculateSummary = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 옵션별 집계
      const summaryMap = new Map<string, OptionSummary>();

      orders.forEach((order) => {
        const optionName = order.field_11 || '';
        const vendorName = order.field_22 || '';
        const quantity = parseInt(order.field_12 || '0', 10);
        const amount = parseFloat(order.field_27 || '0');

        const key = `${optionName}|${vendorName}`;

        if (summaryMap.has(key)) {
          const existing = summaryMap.get(key)!;
          existing.total_quantity += quantity;
          existing.total_amount += amount;
          existing.order_count += 1;
        } else {
          summaryMap.set(key, {
            option_name: optionName,
            vendor_name: vendorName,
            total_quantity: quantity,
            total_amount: amount,
            order_count: 1,
          });
        }
      });

      const optionData = Array.from(summaryMap.values())
        .filter(item => item.option_name) // 옵션명이 있는 것만
        .sort((a, b) => a.option_name.localeCompare(b.option_name, 'ko-KR')); // 가나다순

      setOptionSummary(optionData);

      // 2. 원물 필요량 계산
      await calculateRawMaterials(optionData);
    } catch (error) {
      console.error('집계 오류:', error);
      alert('집계 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [orders, calculateRawMaterials]);

  // 초기 로드
  useEffect(() => {
    calculateSummary();
  }, [orders]);

  // 총계 계산
  const totalSummary = optionSummary.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.total_quantity,
      amount: acc.amount + item.total_amount,
      orders: acc.orders + item.order_count,
    }),
    { quantity: 0, amount: 0, orders: 0 }
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 및 총계 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            통합된 주문: {orders.length}건
          </div>
          <button
            onClick={calculateSummary}
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
            <span className="text-gray-500">집계 데이터 계산중...</span>
          </div>
        ) : optionSummary.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            통합된 주문 데이터가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* 옵션별 집계 테이블 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200">
                <h3 className="font-bold text-gray-900" style={{ fontSize: '14px' }}>옵션별 주문 집계</h3>
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
                    {optionSummary.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                        <td className="px-2 py-2 text-gray-900 font-medium">{item.option_name}</td>
                        <td className="px-2 py-2 text-gray-700">{item.vendor_name || '-'}</td>
                        <td className="px-2 py-2 text-right text-gray-900">{item.order_count.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right font-medium text-green-600">{item.total_quantity.toLocaleString()}</td>
                      </tr>
                    ))}
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
              <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                <h3 className="font-bold text-gray-900" style={{ fontSize: '14px' }}>원물 필요량</h3>
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
                    {rawMaterials.length === 0 && unmatchedOptions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-gray-500">원물 정보가 없습니다</td>
                      </tr>
                    ) : (
                      <>
                        {rawMaterials.map((item, index) => {
                          const standardUnitCount = item.standard_quantity > 0
                            ? Math.ceil(item.total_usage / item.standard_quantity)
                            : 0;

                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-2 py-2 text-gray-500">{index + 1}</td>
                              <td className="px-2 py-2 text-gray-900 font-medium">{item.name}</td>
                              <td className="px-2 py-2 text-right font-medium text-blue-600">{Math.ceil(item.total_usage).toLocaleString()}</td>
                              <td className="px-2 py-2 text-center text-gray-700">{item.unit}</td>
                              <td className="px-2 py-2 text-right font-medium text-purple-600">{standardUnitCount.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                        {unmatchedOptions.map((item, index) => (
                          <tr key={`unmatched-${index}`} className="hover:bg-red-50 bg-red-50/50">
                            <td className="px-2 py-2 text-gray-500">{rawMaterials.length + index + 1}</td>
                            <td className="px-2 py-2 text-red-600 font-medium">
                              {item.option_name}
                              <span className="ml-2 text-xs text-red-500">(원물 연결 없음)</span>
                            </td>
                            <td className="px-2 py-2 text-right font-medium text-red-600">
                              {Math.ceil(item.total_quantity).toLocaleString()}
                              <span className="ml-1 text-xs text-red-500">개</span>
                            </td>
                            <td className="px-2 py-2 text-center text-red-500">-</td>
                            <td className="px-2 py-2 text-right text-red-500">-</td>
                          </tr>
                        ))}
                      </>
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
