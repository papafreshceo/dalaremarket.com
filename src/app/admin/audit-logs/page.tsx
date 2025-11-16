'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Filter, Download } from 'lucide-react';

interface AuditLog {
  id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  action: string;
  action_category: string;
  resource_type: string;
  resource_id: string;
  before_data: any;
  after_data: any;
  details: any;
  ip_address: string;
  request_method: string;
  request_path: string;
  severity: 'info' | 'warning' | 'critical';
  is_sensitive: boolean;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  delete_order: '주문 삭제',
  change_user_role: '사용자 권한 변경',
  grant_admin_access: '관리자 권한 부여',
  revoke_admin_access: '관리자 권한 회수',
  use_cash: '캐시 사용',
  refund_cash: '캐시 환불',
  grant_cash: '캐시 지급',
  revoke_cash: '캐시 회수',
  // 나중에 추가될 액션들
  payment_success: '결제 성공',
  payment_failed: '결제 실패',
  payment_refund: '결제 환불',
};

const severityColors = {
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  critical: 'text-red-600 bg-red-50 border-red-200',
};

const severityLabels = {
  info: '정보',
  warning: '경고',
  critical: '위험',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // 필터 상태
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    startDate: '',
    endDate: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
        setPagination(prev => ({ ...prev, ...result.pagination }));
      }
    } catch (error) {
      console.error('감사 로그 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.action && { action: filters.action }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        limit: '10000', // 전체 데이터
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const result = await response.json();

      if (result.success) {
        // CSV 변환
        const csv = [
          ['ID', '시간', '사용자', '액션', '심각도', '리소스', '상세'].join(','),
          ...result.data.map((log: AuditLog) =>
            [
              log.id,
              formatDate(log.created_at),
              log.user_name || log.user_email || '시스템',
              actionLabels[log.action] || log.action,
              severityLabels[log.severity],
              `${log.resource_type}:${log.resource_id}`,
              JSON.stringify(log.details || {}),
            ].join(',')
          ),
        ].join('\n');

        // 다운로드
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      }
    } catch (error) {
      console.error('내보내기 실패:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">감사 로그</h1>
          <p className="text-sm text-gray-600 mt-1">
            시스템에서 발생한 중요한 작업을 추적합니다
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Download className="w-4 h-4" />
            CSV 내보내기
          </button>
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">필터</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              액션
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              <option value="delete_order">주문 삭제</option>
              <option value="change_user_role">권한 변경</option>
              <option value="grant_admin_access">관리자 권한 부여</option>
              <option value="use_cash">캐시 사용</option>
              <option value="grant_cash">캐시 지급</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              심각도
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              <option value="info">정보</option>
              <option value="warning">경고</option>
              <option value="critical">위험</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작일
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료일
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  시간
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  사용자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  액션
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  리소스
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  심각도
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상세
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    로딩 중...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    감사 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {log.user_name || '시스템'}
                      </div>
                      <div className="text-xs text-gray-500">{log.user_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {actionLabels[log.action] || log.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.resource_type && (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.resource_type}:{log.resource_id?.substring(0, 8)}...
                        </code>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium border rounded ${
                          severityColors[log.severity]
                        }`}
                      >
                        {severityLabels[log.severity]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {log.details && (
                        <div className="truncate max-w-md">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              총 {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                이전
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">감사 로그 상세</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">액션</label>
                <p className="text-gray-900">{actionLabels[selectedLog.action] || selectedLog.action}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">사용자</label>
                <p className="text-gray-900">
                  {selectedLog.user_name} ({selectedLog.user_email}) - {selectedLog.user_role}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">시간</label>
                <p className="text-gray-900">{formatDate(selectedLog.created_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">IP 주소</label>
                <p className="text-gray-900">{selectedLog.ip_address || 'N/A'}</p>
              </div>

              {selectedLog.before_data && (
                <div>
                  <label className="text-sm font-medium text-gray-500">변경 전</label>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.before_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after_data && (
                <div>
                  <label className="text-sm font-medium text-gray-500">변경 후</label>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.after_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <label className="text-sm font-medium text-gray-500">상세 정보</label>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
