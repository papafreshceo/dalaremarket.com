'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle, Clock, Search, Download, Edit } from 'lucide-react';

interface ShippingOrder {
  seq: number;
  marketName: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  optionName: string;
  quantity: number;
  paymentDate: string;
  shippingStatus: '발송대기' | '발송완료' | '배송중' | '배송완료';
  trackingNumber: string;
  shippingVendor: string;
  shippingDate: string;
}

export default function ShippingTab() {
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [editingTracking, setEditingTracking] = useState<number | null>(null);
  const [tempTrackingNumber, setTempTrackingNumber] = useState('');
  const [tempShippingVendor, setTempShippingVendor] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchKeyword, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // TODO: API 호출하여 발송 대상 주문 조회
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 임시 데이터
      const mockOrders: ShippingOrder[] = Array.from({ length: 20 }, (_, i) => ({
        seq: i + 1,
        marketName: ['스마트스토어', '쿠팡', '11번가'][i % 3],
        orderNumber: `ORD-${Date.now()}-${i}`,
        recipientName: `수취인${i + 1}`,
        recipientPhone: `010-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        recipientAddress: `서울시 강남구 테헤란로 ${i + 100}`,
        optionName: `상품명${i + 1}`,
        quantity: Math.floor(Math.random() * 5) + 1,
        paymentDate: new Date().toISOString().split('T')[0],
        shippingStatus: ['발송대기', '발송완료', '배송중', '배송완료'][i % 4] as any,
        trackingNumber: i % 2 === 0 ? `${Math.floor(Math.random() * 1000000000000)}` : '',
        shippingVendor: i % 2 === 0 ? ['CJ대한통운', '로젠택배', '한진택배'][i % 3] : '',
        shippingDate: i % 2 === 0 ? new Date().toISOString().split('T')[0] : '',
      }));

      setOrders(mockOrders);
    } catch (error) {
      console.error('주문 조회 실패:', error);
      alert('주문 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.shippingStatus === statusFilter);
    }

    // 검색어 필터
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(keyword) ||
        order.recipientName.toLowerCase().includes(keyword) ||
        order.trackingNumber.toLowerCase().includes(keyword)
      );
    }

    setFilteredOrders(filtered);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.seq)));
    }
  };

  const toggleSelect = (seq: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(seq)) {
      newSelected.delete(seq);
    } else {
      newSelected.add(seq);
    }
    setSelectedOrders(newSelected);
  };

  const startEditTracking = (order: ShippingOrder) => {
    setEditingTracking(order.seq);
    setTempTrackingNumber(order.trackingNumber);
    setTempShippingVendor(order.shippingVendor);
  };

  const saveTracking = (seq: number) => {
    const updated = orders.map(order => {
      if (order.seq === seq) {
        return {
          ...order,
          trackingNumber: tempTrackingNumber,
          shippingVendor: tempShippingVendor,
          shippingStatus: tempTrackingNumber ? '발송완료' as const : '발송대기' as const,
          shippingDate: tempTrackingNumber ? new Date().toISOString().split('T')[0] : '',
        };
      }
      return order;
    });

    setOrders(updated);
    setEditingTracking(null);
    setTempTrackingNumber('');
    setTempShippingVendor('');

    // TODO: API 호출하여 송장번호 저장
    console.log('송장 저장:', { seq, trackingNumber: tempTrackingNumber, vendor: tempShippingVendor });
  };

  const cancelEdit = () => {
    setEditingTracking(null);
    setTempTrackingNumber('');
    setTempShippingVendor('');
  };

  const handleBulkExport = () => {
    if (selectedOrders.size === 0) {
      alert('선택된 주문이 없습니다.');
      return;
    }

    console.log('엑셀 다운로드:', Array.from(selectedOrders));
    // TODO: 선택된 주문 엑셀 다운로드
    alert(`${selectedOrders.size}개 주문을 엑셀로 다운로드합니다.`);
  };

  const handleBulkShipping = () => {
    if (selectedOrders.size === 0) {
      alert('선택된 주문이 없습니다.');
      return;
    }

    const selectedOrdersList = filteredOrders.filter(o => selectedOrders.has(o.seq));
    const missingTracking = selectedOrdersList.filter(o => !o.trackingNumber);

    if (missingTracking.length > 0) {
      alert(`송장번호가 없는 주문이 ${missingTracking.length}개 있습니다.`);
      return;
    }

    console.log('일괄 발송 처리:', Array.from(selectedOrders));
    // TODO: 일괄 발송 처리 API 호출
    alert(`${selectedOrders.size}개 주문을 발송 처리합니다.`);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      '발송대기': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      '발송완료': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      '배송중': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      '배송완료': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return styles[status as keyof typeof styles] || styles['발송대기'];
  };

  const statusCounts = {
    all: orders.length,
    '발송대기': orders.filter(o => o.shippingStatus === '발송대기').length,
    '발송완료': orders.filter(o => o.shippingStatus === '발송완료').length,
    '배송중': orders.filter(o => o.shippingStatus === '배송중').length,
    '배송완료': orders.filter(o => o.shippingStatus === '배송완료').length,
  };

  return (
    <div className="space-y-6">
      {/* 상태 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === 'all'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <div className="text-sm text-text-secondary mb-1">전체</div>
            <div className="text-2xl font-semibold text-text">{statusCounts.all}</div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('발송대기')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === '발송대기'
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <div className="text-sm text-text-secondary mb-1">발송대기</div>
            <div className="text-2xl font-semibold text-yellow-600">{statusCounts['발송대기']}</div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('발송완료')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === '발송완료'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm text-text-secondary mb-1">발송완료</div>
            <div className="text-2xl font-semibold text-blue-600">{statusCounts['발송완료']}</div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('배송중')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === '배송중'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <Truck className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-sm text-text-secondary mb-1">배송중</div>
            <div className="text-2xl font-semibold text-purple-600">{statusCounts['배송중']}</div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('배송완료')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === '배송완료'
              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-sm text-text-secondary mb-1">배송완료</div>
            <div className="text-2xl font-semibold text-green-600">{statusCounts['배송완료']}</div>
          </div>
        </button>
      </div>

      {/* 검색 및 액션 */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="주문번호, 수취인명, 송장번호 검색"
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBulkExport}
              disabled={selectedOrders.size === 0}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-surface text-text rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드 ({selectedOrders.size})
            </button>
            <button
              onClick={handleBulkShipping}
              disabled={selectedOrders.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              일괄 발송 ({selectedOrders.size})
            </button>
          </div>
        </div>
      </div>

      {/* 주문 테이블 */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">주문이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-secondary sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-center border-b border-border">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">연번</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">마켓명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">수취인</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">전화번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">주소</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">상품명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">수량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">택배사</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">송장번호</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">액션</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.seq} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.seq)}
                        onChange={() => toggleSelect(order.seq)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{order.seq}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(order.shippingStatus)}`}>
                        {order.shippingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                        {order.marketName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{order.recipientName}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{order.recipientPhone}</td>
                    <td className="px-4 py-3 text-sm text-text max-w-xs truncate">{order.recipientAddress}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.optionName}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{order.quantity}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                      {editingTracking === order.seq ? (
                        <select
                          value={tempShippingVendor}
                          onChange={(e) => setTempShippingVendor(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-border rounded bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">선택</option>
                          <option value="CJ대한통운">CJ대한통운</option>
                          <option value="로젠택배">로젠택배</option>
                          <option value="한진택배">한진택배</option>
                          <option value="우체국택배">우체국택배</option>
                          <option value="롯데택배">롯데택배</option>
                        </select>
                      ) : (
                        order.shippingVendor || '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                      {editingTracking === order.seq ? (
                        <input
                          type="text"
                          value={tempTrackingNumber}
                          onChange={(e) => setTempTrackingNumber(e.target.value)}
                          placeholder="송장번호"
                          className="w-full px-2 py-1 text-xs border border-border rounded bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        order.trackingNumber || '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {editingTracking === order.seq ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => saveTracking(order.seq)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 text-xs border border-border bg-surface text-text rounded hover:bg-surface-hover transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditTracking(order)}
                          className="px-2 py-1 text-xs border border-border bg-surface text-text rounded hover:bg-surface-hover transition-colors"
                        >
                          <Edit className="w-3 h-3 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
