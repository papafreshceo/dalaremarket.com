'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';

interface CSRecord {
  id: number;
  order_id?: number;
  order_number: string;
  market_name: string;
  recipient_name: string;
  cs_type: string;
  cs_content: string;
  resolution_method?: string;
  resolution_content?: string;
  refund_amount?: number;
  status: string;
  received_date: string;
  processing_date?: string;
  processing_datetime?: string;
  memo?: string;
}

interface ResolutionStats {
  resolution_method: string;
  count: number;
}

export default function CSTab() {
  const [records, setRecords] = useState<CSRecord[]>([]);
  const [resolutionStats, setResolutionStats] = useState<ResolutionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // EditableAdminGrid 컬럼 정의
  const columns = [
    { field: 'received_date', headerName: '접수일', width: 100, type: 'date' as const },
    { field: 'market_name', headerName: '마켓명', width: 100 },
    { field: 'order_number', headerName: '주문번호', width: 150 },
    { field: 'recipient_name', headerName: '고객명', width: 100 },
    { field: 'cs_type', headerName: 'CS유형', width: 100 },
    { field: 'cs_content', headerName: 'CS내용', width: 250 },
    { field: 'status', headerName: '처리상태', width: 90 },
    { field: 'resolution_method', headerName: '처리방법', width: 120 },
    { field: 'resolution_content', headerName: '처리내용', width: 200 },
    { field: 'refund_amount', headerName: '환불금액', width: 100, type: 'number' as const },
    { field: 'processing_date', headerName: '처리일', width: 100, type: 'date' as const },
    { field: 'memo', headerName: '메모', width: 200 },
  ];

  useEffect(() => {
    // 기본값: 최근 30일
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadRecords();
    }
  }, [startDate, endDate, statusFilter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const [recordsResponse, statsResponse] = await Promise.all([
        fetch(`/api/cs-records?${params}`),
        fetch(`/api/cs-records/stats?${params}`),
      ]);

      const recordsResult = await recordsResponse.json();
      const statsResult = await statsResponse.json();

      if (recordsResult.success) {
        setRecords(recordsResult.data || []);
      }

      if (statsResult.success) {
        setResolutionStats(statsResult.data?.byResolutionMethod || []);
      }
    } catch (error) {
      console.error('CS 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveData = async (updatedData: any[]) => {
    try {
      const updates = updatedData.filter((row) => row.id);

      if (updates.length === 0) {
        return;
      }

      const response = await fetch('/api/cs-records/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 CS 기록이 수정되었습니다.`);
        loadRecords();
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleQuickDateFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const statusStats = {
    total: records.length,
    접수: records.filter((r) => r.status === '접수').length,
    완료: records.filter((r) => r.status === '완료').length,
  };

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">총 CS 건수</div>
          <div className="text-2xl font-semibold text-gray-900">{statusStats.total.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">접수</div>
          <div className="text-2xl font-semibold text-yellow-600">{statusStats.접수.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">완료</div>
          <div className="text-2xl font-semibold text-green-600">{statusStats.완료.toLocaleString()}</div>
        </div>
      </div>

      {/* 처리방법별 통계 */}
      {resolutionStats.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">처리방법별 통계</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">처리방법</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">건수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resolutionStats.map((stat) => (
                  <tr key={stat.resolution_method} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.resolution_method || '미지정'}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{stat.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* 날짜 범위 */}
          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 빠른 날짜 필터 */}
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickDateFilter(7)}
              className="px-3 py-2 text-sm border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50"
            >
              7일
            </button>
            <button
              onClick={() => handleQuickDateFilter(30)}
              className="px-3 py-2 text-sm border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50"
            >
              30일
            </button>
            <button
              onClick={() => handleQuickDateFilter(90)}
              className="px-3 py-2 text-sm border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50"
            >
              90일
            </button>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">처리상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="접수">접수</option>
              <option value="완료">완료</option>
            </select>
          </div>
        </div>
      </div>

      {/* EditableAdminGrid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            CS 기록 목록 ({records.length}건)
          </h3>
        </div>
        <EditableAdminGrid
          columns={columns}
          data={records}
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
