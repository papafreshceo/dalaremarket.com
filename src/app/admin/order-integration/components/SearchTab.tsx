'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

interface IntegratedOrder {
  id: number;
  seq?: number;
  sheet_date: string;
  market_name: string;
  order_number: string;
  payment_date?: string;
  recipient_name: string;
  recipient_phone?: string;
  recipient_address?: string;
  delivery_message?: string;
  option_name: string;
  quantity: number;
  seller_supply_price?: number;
  shipping_status?: string;
  tracking_number?: string;
  courier_company?: string;
  shipped_date?: string;
  cs_status?: string;
  cs_type?: string;
  cs_memo?: string;
  memo?: string;
  created_at?: string;
  updated_at?: string;
}

export default function SearchTab() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [orders, setOrders] = useState<IntegratedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateType, setDateType] = useState('sheet'); // 'sheet' | 'payment'
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // 오늘 날짜를 기본값으로 설정
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        dateType,
        limit: '1000', // 최대 1000건
      });

      if (searchKeyword) {
        params.append('searchKeyword', searchKeyword);
      }

      const response = await fetch(`/api/integrated-orders?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data || []);
        setTotalCount(result.pagination?.total || 0);
      } else {
        console.error('검색 실패:', result.error);
        alert(`검색 실패: ${result.error}`);
        setOrders([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('주문 조회 실패:', error);
      alert('주문 조회 중 오류가 발생했습니다.');
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (orders.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // 엑셀 데이터 준비
    const excelData = orders.map((order, index) => ({
      '연번': index + 1,
      '주문통합일': order.sheet_date,
      '마켓명': order.market_name,
      '주문번호': order.order_number,
      '결제일': order.payment_date || '',
      '수취인': order.recipient_name,
      '전화번호': order.recipient_phone || '',
      '주소': order.recipient_address || '',
      '배송메시지': order.delivery_message || '',
      '옵션명': order.option_name,
      '수량': order.quantity,
      '셀러공급가': order.seller_supply_price || 0,
      '발송상태': order.shipping_status || '미발송',
      '송장번호': order.tracking_number || '',
      '택배사': order.courier_company || '',
      '발송일': order.shipped_date || '',
      'CS상태': order.cs_status || '',
      'CS유형': order.cs_type || '',
      'CS메모': order.cs_memo || '',
      '메모': order.memo || '',
    }));

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 자동 조정
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length * 2, 10)
    }));
    ws['!cols'] = colWidths;

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문조회');

    // 파일 다운로드
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `주문조회_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* 검색 섹션 */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-text mb-4">주문 검색</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 날짜 타입 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              기준 날짜
            </label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="sheet">주문통합일</option>
              <option value="payment">결제일</option>
            </select>
          </div>

          {/* 시작일 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 종료일 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              종료일
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 검색어 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              검색어
            </label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="주문번호, 수취인명 등"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? '검색 중...' : '검색'}
          </button>

          <button
            onClick={handleExport}
            disabled={orders.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-surface text-text rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 결과 섹션 */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">
            검색 결과 ({totalCount > 0 ? totalCount.toLocaleString() : 0}건)
          </h3>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">검색 결과가 없습니다.</p>
              <p className="text-text-muted text-sm mt-2">날짜와 검색어를 확인해주세요.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">연번</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">주문통합일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">마켓명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">수취인</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">옵션명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">수량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">결제일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">발송상태</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {orders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-sm text-text">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.sheet_date}</td>
                    <td className="px-4 py-3 text-sm text-text">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                        {order.market_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{order.order_number}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.recipient_name}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.option_name}</td>
                    <td className="px-4 py-3 text-sm text-text text-center">{order.quantity}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.payment_date || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.shipping_status === '발송완료' ? 'bg-green-100 text-green-800' :
                        order.shipping_status === '발송준비' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.shipping_status || '미발송'}
                      </span>
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
