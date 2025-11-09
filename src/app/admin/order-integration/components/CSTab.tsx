'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';
import { Modal } from '@/components/ui/Modal';

interface CSRecord {
  id: number;
  order_id?: number;
  order_number: string;
  market_name: string;
  orderer_name?: string;
  recipient_name: string;
  recipient_phone?: string;
  recipient_address?: string;
  option_name?: string;
  quantity?: number;
  cs_type: string;
  cs_reason?: string;
  cs_content: string;
  resolution_method?: string;
  processing_content?: string;
  refund_amount?: number;
  status: string;
  receipt_date: string;
  processing_datetime?: string;
  resend_tracking_number?: string;
  resend_option?: string;
  resend_quantity?: number;
  resend_receiver?: string;
  resend_phone?: string;
  resend_address?: string;
  resend_note?: string;
  additional_amount?: number;
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
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
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);

  // 해결방법 코드를 한글로 변환
  const resolutionMethodMap: Record<string, string> = {
    'exchange': '교환',
    'return': '반품',
    'full_refund': '전체환불',
    'partial_refund': '부분환불',
    'full_resend': '전체재발송',
    'partial_resend': '부분재발송',
    'other_action': '기타조치',
  };

  // 원주문 상세 정보 조회
  const fetchOrderDetail = async (orderNumber: string, marketName: string) => {
    try {
      const response = await fetch(`/api/integrated-orders?order_number=${orderNumber}&market_name=${marketName}`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        setSelectedOrderDetail(result.data[0]);
        setShowOrderDetailModal(true);
      } else {
        alert('주문 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      alert('주문 정보 조회 중 오류가 발생했습니다.');
    }
  };

  // EditableAdminGrid 컬럼 정의 (key와 title 형식 사용)
  const columns = [
    { key: 'receipt_date', title: '접수일', width: 100, type: 'text' as const },
    { key: 'market_name', title: '마켓명', width: 100, type: 'text' as const },
    {
      key: 'order_number',
      title: '원주문번호',
      width: 150,
      type: 'text' as const,
      renderer: (value: any, row: any) => {
        return (
          <button
            onClick={() => fetchOrderDetail(row.order_number, row.market_name)}
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
          >
            {value || '-'}
          </button>
        );
      }
    },
    { key: 'orderer_name', title: '주문자', width: 100, type: 'text' as const },
    { key: 'recipient_name', title: '수령인', width: 100, type: 'text' as const },
    { key: 'recipient_phone', title: '수령인전화', width: 120, type: 'text' as const },
    { key: 'option_name', title: '옵션상품', width: 200, type: 'text' as const },
    { key: 'quantity', title: '수량', width: 60, type: 'number' as const },
    { key: 'cs_type', title: 'CS유형', width: 100, type: 'text' as const },
    { key: 'cs_content', title: 'CS내용', width: 250, type: 'text' as const },
    {
      key: 'resolution_method',
      title: '해결방법',
      width: 120,
      type: 'text' as const,
      renderer: (value: any) => {
        return resolutionMethodMap[value] || value || '-';
      }
    },
    { key: 'status', title: '처리상태', width: 90, type: 'text' as const },
    { key: 'resend_tracking_number', title: '재발송번호', width: 150, type: 'text' as const },
    { key: 'refund_amount', title: '환불금액', width: 100, type: 'number' as const },
    { key: 'resend_option', title: '재발송상품', width: 150, type: 'text' as const },
    { key: 'resend_quantity', title: '재발송수량', width: 80, type: 'number' as const },
    { key: 'resend_receiver', title: '재발송수령인', width: 100, type: 'text' as const },
    { key: 'bank_name', title: '은행', width: 100, type: 'text' as const },
    { key: 'account_holder', title: '예금주', width: 100, type: 'text' as const },
    { key: 'account_number', title: '계좌번호', width: 150, type: 'text' as const },
    { key: 'processing_content', title: '처리내용', width: 200, type: 'text' as const },
    { key: 'processing_datetime', title: '처리일시', width: 150, type: 'text' as const },
    { key: 'memo', title: '메모', width: 200, type: 'text' as const },
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
      } else {
        console.error('CS 기록 로드 실패:', recordsResult.error);
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
          enableCSVExport={true}
          enableCSVImport={false}
          enableAddRow={false}
          enableDelete={false}
          enableCheckbox={false}
          exportFilePrefix="cs_records"
        />
      </div>

      {/* 주문 상세 정보 모달 */}
      {showOrderDetailModal && selectedOrderDetail && (
        <Modal
          isOpen={showOrderDetailModal}
          onClose={() => {
            setShowOrderDetailModal(false);
            setSelectedOrderDetail(null);
          }}
          title="주문 상세 정보"
          size="lg"
          footer={
            <button
              onClick={() => {
                setShowOrderDetailModal(false);
                setSelectedOrderDetail(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              닫기
            </button>
          }
        >
          <div className="space-y-5" style={{ fontSize: '13px' }}>
            {/* 주문 기본 정보 - 전체 너비 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="grid grid-cols-3 gap-x-6 gap-y-2.5">
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">주문번호</span>
                  <span className="text-gray-900 font-semibold">{selectedOrderDetail.order_number || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">마켓명</span>
                  <span className="text-gray-900 font-medium">{selectedOrderDetail.market_name || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">결제일</span>
                  <span className="text-gray-900 font-medium">{selectedOrderDetail.payment_date || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">주문자</span>
                  <span className="text-gray-900 font-medium">{selectedOrderDetail.buyer_name || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">주문자 전화</span>
                  <span className="text-gray-900 font-medium">{selectedOrderDetail.buyer_phone || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-24 flex-shrink-0">발송 상태</span>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {selectedOrderDetail.shipping_status || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2단 레이아웃 */}
            <div className="grid grid-cols-2 gap-5">
              {/* 수령인 정보 */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-28 flex-shrink-0">수령인</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.recipient_name || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-28 flex-shrink-0">전화번호</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.recipient_phone || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">배송 주소</span>
                    <span className="text-gray-900 font-medium leading-relaxed bg-white rounded px-3 py-2 border border-green-200">
                      {selectedOrderDetail.recipient_address || '-'}
                    </span>
                  </div>
                  {selectedOrderDetail.delivery_message && (
                    <div className="flex flex-col">
                      <span className="text-gray-600 mb-1">배송 메시지</span>
                      <span className="text-gray-700 italic bg-white rounded px-3 py-2 border border-green-200">
                        {selectedOrderDetail.delivery_message}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 상품 정보 */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="space-y-2.5">
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">옵션상품</span>
                    <span className="text-gray-900 font-semibold bg-white rounded px-3 py-2 border border-purple-200">
                      {selectedOrderDetail.option_name || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-600 block mb-1">수량</span>
                      <span className="text-gray-900 font-bold text-base bg-white rounded px-3 py-2 border border-purple-200 block text-center">
                        {selectedOrderDetail.quantity || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">옵션코드</span>
                      <span className="text-gray-700 font-mono text-xs bg-white rounded px-3 py-2 border border-purple-200 block text-center">
                        {selectedOrderDetail.option_code || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">택배사</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.courier_company || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">송장번호</span>
                    <span className="text-gray-900 font-semibold">{selectedOrderDetail.tracking_number || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">발송일</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.shipped_date || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">발송요청일</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.shipping_request_date || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 셀러/벤더 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">셀러</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.seller_name || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">벤더사</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.vendor_name || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-24 flex-shrink-0">출고처</span>
                    <span className="text-gray-900 font-medium">{selectedOrderDetail.shipping_source || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 금액 정보 - 전체 너비 */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-100">
              <div className="grid grid-cols-3 gap-x-6 gap-y-2.5">
                <div className="flex items-center">
                  <span className="text-gray-600 w-28 flex-shrink-0">셀러 공급가</span>
                  <span className="text-gray-900 font-semibold">{selectedOrderDetail.seller_supply_price || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-28 flex-shrink-0">정산금액</span>
                  <span className="text-gray-900 font-semibold">{selectedOrderDetail.settlement_amount || '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 w-28 flex-shrink-0">최종결제금액</span>
                  <span className="text-emerald-700 font-bold text-base">{selectedOrderDetail.final_payment_amount || '-'}</span>
                </div>
              </div>
            </div>

            {/* 메모 */}
            {selectedOrderDetail.memo && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-gray-700 whitespace-pre-wrap bg-white rounded px-3 py-2 border border-amber-200 leading-relaxed">
                  {selectedOrderDetail.memo}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
