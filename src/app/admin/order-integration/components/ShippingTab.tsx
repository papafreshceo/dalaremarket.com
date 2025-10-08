'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle, Clock, Search, Download, Upload } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import * as XLSX from 'xlsx';

interface Order {
  id: number;
  sheet_date: string;
  market_name: string;
  order_number: string;
  recipient_name: string;
  recipient_phone?: string;
  recipient_address?: string;
  option_name: string;
  quantity: number;
  vendor_name?: string;
  shipping_status: string;
  tracking_number?: string;
  courier_company?: string;
  shipped_date?: string;
}

interface VendorStats {
  vendor_name: string;
  total_orders: number;
  total_quantity: number;
  shipped: number;
  unshipped: number;
}

export default function ShippingTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorStats, setVendorStats] = useState<VendorStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');

  // EditableAdminGrid 컬럼 정의
  const columns = [
    { field: 'vendor_name', headerName: '벤더사', width: 100 },
    { field: 'market_name', headerName: '마켓명', width: 100 },
    { field: 'order_number', headerName: '주문번호', width: 150 },
    { field: 'recipient_name', headerName: '수취인', width: 100 },
    { field: 'recipient_phone', headerName: '전화번호', width: 120 },
    { field: 'recipient_address', headerName: '주소', width: 250 },
    { field: 'option_name', headerName: '옵션명', width: 200 },
    { field: 'quantity', headerName: '수량', width: 70, type: 'number' as const },
    { field: 'shipping_status', headerName: '발송상태', width: 90 },
    { field: 'courier_company', headerName: '택배사', width: 100 },
    { field: 'tracking_number', headerName: '송장번호', width: 130 },
    { field: 'shipped_date', headerName: '발송일', width: 100, type: 'date' as const },
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // 미발송 + 발송준비 주문만 조회
      const params = new URLSearchParams();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      params.append('startDate', sevenDaysAgo.toISOString().split('T')[0]);
      params.append('endDate', new Date().toISOString().split('T')[0]);
      params.append('limit', '1000');

      const response = await fetch(`/api/integrated-orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data || []);
        calculateVendorStats(result.data || []);
      }
    } catch (error) {
      console.error('주문 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 벤더사별 집계
  const calculateVendorStats = (orderData: Order[]) => {
    const statsMap = new Map<string, VendorStats>();

    orderData.forEach((order) => {
      const vendor = order.vendor_name || '미지정';
      if (!statsMap.has(vendor)) {
        statsMap.set(vendor, {
          vendor_name: vendor,
          total_orders: 0,
          total_quantity: 0,
          shipped: 0,
          unshipped: 0,
        });
      }

      const stats = statsMap.get(vendor)!;
      stats.total_orders += 1;
      stats.total_quantity += order.quantity;

      if (order.shipping_status === '발송완료' || order.shipped_date) {
        stats.shipped += 1;
      } else {
        stats.unshipped += 1;
      }
    });

    const statsArray = Array.from(statsMap.values());
    statsArray.sort((a, b) => b.total_orders - a.total_orders);
    setVendorStats(statsArray);
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

  // 송장번호 업데이트
  const handleSaveData = async (updatedData: any[]) => {
    try {
      // 변경된 데이터만 추출
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
        loadOrders(); // 새로고침
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 필터링된 주문
  const filteredOrders = selectedVendor
    ? orders.filter((o) => (o.vendor_name || '미지정') === selectedVendor)
    : orders;

  const statusStats = {
    total: orders.length,
    미발송: orders.filter((o) => o.shipping_status === '미발송').length,
    발송준비: orders.filter((o) => o.shipping_status === '발송준비').length,
    발송완료: orders.filter((o) => o.shipping_status === '발송완료').length,
  };

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">총 주문</div>
          <div className="text-2xl font-semibold text-gray-900">{statusStats.total.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">미발송</div>
          <div className="text-2xl font-semibold text-red-600">{statusStats.미발송.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">발송준비</div>
          <div className="text-2xl font-semibold text-yellow-600">{statusStats.발송준비.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">발송완료</div>
          <div className="text-2xl font-semibold text-green-600">{statusStats.발송완료.toLocaleString()}</div>
        </div>
      </div>

      {/* 벤더사별 집계 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">벤더사별 집계</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">벤더사</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">총 주문</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">총 수량</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">발송완료</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">미발송</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendorStats.map((stat) => (
                <tr key={stat.vendor_name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.vendor_name}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">{stat.total_orders.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">{stat.total_quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600">{stat.shipped.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-center text-red-600">{stat.unshipped.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() =>
                          selectedVendor === stat.vendor_name
                            ? setSelectedVendor('')
                            : setSelectedVendor(stat.vendor_name)
                        }
                        className="px-3 py-1 text-xs border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50"
                      >
                        {selectedVendor === stat.vendor_name ? '전체 보기' : '필터'}
                      </button>
                      <button
                        onClick={() => handleVendorExcelDownload(stat.vendor_name)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EditableAdminGrid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedVendor ? `${selectedVendor} - 주문 목록` : '전체 주문 목록'} ({filteredOrders.length}건)
          </h3>
          {selectedVendor && (
            <button
              onClick={() => setSelectedVendor('')}
              className="px-3 py-1.5 text-sm border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50"
            >
              필터 해제
            </button>
          )}
        </div>
        <EditableAdminGrid
          columns={columns}
          data={filteredOrders}
          onSave={handleSaveData}
          height="calc(100vh - 580px)"
          enableExport={true}
          enableImport={false}
          pageSize={50}
        />
      </div>
    </div>
  );
}
