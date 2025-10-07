'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Calendar } from 'lucide-react';

export default function SearchTab() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateType, setDateType] = useState('sheet'); // 'sheet' | 'payment'

  useEffect(() => {
    // 오늘 날짜를 기본값으로 설정
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // TODO: API 호출하여 주문 조회
      console.log('검색:', { startDate, endDate, searchKeyword, dateType });

      // 임시 데이터
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders([]);
    } catch (error) {
      console.error('주문 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log('엑셀 다운로드');
    // TODO: 엑셀 다운로드 기능
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
            검색 결과 ({orders.length}건)
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">마켓명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">수취인</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">옵션명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">수량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">결제일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {orders.map((order, index) => (
                  <tr key={index} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-sm text-text">{order.seq}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.marketName}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.recipient}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.optionName}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.quantity}</td>
                    <td className="px-4 py-3 text-sm text-text">{order.paymentDate}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {order.status}
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
