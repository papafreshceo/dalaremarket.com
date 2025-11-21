'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, Search, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';

interface RefundSettlement {
  id: number;
  refund_processed_at: string;
  refund_amount: number;
  cash_refund_amount: number;
  settlement_amount: number;
  order_id: number;
  order_number: string;
  market_name: string;
  vendor_name: string;
  option_name: string;
  quantity: string;
  seller_supply_price: number;
  organization_id: string;
  organization_name: string;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  orderer_name: string;
  orderer_phone: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cs_type: string | null;
  cs_content: string | null;
  resolution_method: string | null;
  refund_ratio: number | null;
  processed_by: string;
  processed_by_name: string;
}

interface Organization {
  id: string;
  business_name: string;
}

export default function RefundHistoryPage() {
  const [refunds, setRefunds] = useState<RefundSettlement[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [selectedCSType, setSelectedCSType] = useState<string>('all');
  const [selectedResolution, setSelectedResolution] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 상세보기 모달
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundSettlement | null>(null);

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
      fetchRefunds();
      fetchOrganizations();
    }
  }, [startDate, endDate]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedOrg !== 'all') params.append('organizationId', selectedOrg);

      const response = await fetch(`/api/refund-settlements?${params}`);
      const result = await response.json();

      if (result.success) {
        setRefunds(result.data || []);
      } else {
        toast.error('환불 내역 조회 실패');
      }
    } catch (error) {
      console.error('환불 내역 조회 오류:', error);
      toast.error('환불 내역 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const result = await response.json();

      if (result.success) {
        setOrganizations(result.data || []);
      }
    } catch (error) {
      console.error('조직 목록 조회 오류:', error);
    }
  };

  const handleQuickDateFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleShowAll = () => {
    setStartDate('2020-01-01');
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  // 필터링된 데이터
  const filteredRefunds = refunds.filter(refund => {
    // CS 유형 필터
    if (selectedCSType !== 'all') {
      if (selectedCSType === 'none' && refund.cs_type !== null) return false;
      if (selectedCSType !== 'none' && refund.cs_type !== selectedCSType) return false;
    }

    // 해결방법 필터
    if (selectedResolution !== 'all') {
      if (refund.resolution_method !== selectedResolution) return false;
    }

    // 검색어 필터
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      const matchOrder = refund.order_number?.toLowerCase().includes(keyword);
      const matchOrderer = refund.orderer_name?.toLowerCase().includes(keyword);
      const matchRecipient = refund.recipient_name?.toLowerCase().includes(keyword);

      if (!matchOrder && !matchOrderer && !matchRecipient) return false;
    }

    return true;
  });

  // 통계 계산
  const stats = {
    총환불건수: filteredRefunds.length,
    총환불금액: filteredRefunds.reduce((sum, r) => sum + Number(r.refund_amount || 0), 0),
    캐시환불액: filteredRefunds.reduce((sum, r) => sum + Number(r.cash_refund_amount || 0), 0),
    계좌환불액: filteredRefunds.reduce((sum, r) => {
      const total = Number(r.refund_amount || 0);
      const cash = Number(r.cash_refund_amount || 0);
      return sum + (total - cash);
    }, 0),
  };
  stats['평균환불액'] = stats.총환불건수 > 0
    ? Math.floor(stats.총환불금액 / stats.총환불건수)
    : 0;

  // CSV 다운로드
  const handleDownloadCSV = () => {
    if (filteredRefunds.length === 0) {
      toast.error('다운로드할 데이터가 없습니다.');
      return;
    }

    const headers = [
      '환불처리일', '주문번호', '조직명', '주문자', '주문자전화', '수령인', '수령인전화',
      '마켓', '벤더', '옵션상품', '수량', '셀러공급가',
      'CS구분', '해결방법', '환불비율', 'CS내용',
      '총환불액', '캐시환불액', '계좌환불액',
      '은행', '계좌번호', '예금주', '처리자'
    ];

    const rows = filteredRefunds.map(r => [
      new Date(r.refund_processed_at).toLocaleString('ko-KR'),
      r.order_number || '',
      r.organization_name || '',
      r.orderer_name || '',
      r.orderer_phone || '',
      r.recipient_name || '',
      r.recipient_phone || '',
      r.market_name || '',
      r.vendor_name || '',
      r.option_name || '',
      r.quantity || '',
      r.seller_supply_price || '',
      r.cs_type || '발주단계환불',
      r.resolution_method || '-',
      r.refund_ratio ? `${r.refund_ratio}%` : '-',
      r.cs_content || '-',
      r.refund_amount || 0,
      r.cash_refund_amount || 0,
      (Number(r.refund_amount || 0) - Number(r.cash_refund_amount || 0)),
      r.bank_name || '',
      r.bank_account || '',
      r.account_holder || '',
      r.processed_by_name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const filename = `환불내역_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.success('CSV 파일이 다운로드되었습니다.');
  };

  // 고유 CS 유형 목록
  const csTypes = Array.from(new Set(refunds.map(r => r.cs_type).filter(Boolean))) as string[];

  // 고유 해결방법 목록
  const resolutionMethods = Array.from(new Set(refunds.map(r => r.resolution_method).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">환불 내역 관리</h1>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download size={18} />
              CSV 다운로드
            </button>
            <button
              onClick={fetchRefunds}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              새로고침
            </button>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">총 환불건수</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.총환불건수.toLocaleString()}건
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">총 환불금액</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.총환불금액.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">캐시 환불액</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.캐시환불액.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">계좌 환불액</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.계좌환불액.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">평균 환불액</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.평균환불액.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-gray-600" />
            <span className="font-medium text-gray-700">필터</span>
          </div>

          {/* 날짜 필터 */}
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-gray-600">날짜:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded"
            />
            <span className="text-gray-600">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded"
            />
            <button
              onClick={() => handleQuickDateFilter(7)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              7일
            </button>
            <button
              onClick={() => handleQuickDateFilter(30)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              30일
            </button>
            <button
              onClick={() => handleQuickDateFilter(90)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              90일
            </button>
            <button
              onClick={handleShowAll}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              전체
            </button>
          </div>

          {/* 조직/CS유형/해결방법 필터 */}
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-gray-600">조직:</label>
            <select
              value={selectedOrg}
              onChange={(e) => {
                setSelectedOrg(e.target.value);
                fetchRefunds();
              }}
              className="px-3 py-1.5 border border-gray-300 rounded"
            >
              <option value="all">전체</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.business_name}</option>
              ))}
            </select>

            <label className="text-sm text-gray-600 ml-4">CS유형:</label>
            <select
              value={selectedCSType}
              onChange={(e) => setSelectedCSType(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded"
            >
              <option value="all">전체</option>
              <option value="none">발주단계환불</option>
              {csTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <label className="text-sm text-gray-600 ml-4">해결방법:</label>
            <select
              value={selectedResolution}
              onChange={(e) => setSelectedResolution(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded"
            >
              <option value="all">전체</option>
              {resolutionMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* 검색 */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">검색:</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="주문번호 / 주문자 / 수령인"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded"
              />
              <Search size={18} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">환불처리일</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">주문번호</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">조직</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">주문자</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">CS유형</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">해결방법</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">환불금액</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">상세</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      환불 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((refund) => (
                    <tr key={refund.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(refund.refund_processed_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {refund.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm">{refund.organization_name}</td>
                      <td className="px-4 py-3 text-sm">{refund.orderer_name}</td>
                      <td className="px-4 py-3 text-sm">
                        {refund.cs_type ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            {refund.cs_type}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            발주단계환불
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{refund.resolution_method || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {Number(refund.refund_amount).toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedRefund(refund);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세보기 모달 */}
      {selectedRefund && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRefund(null);
          }}
          title="환불 상세 내역"
          size="lg"
        >
          <div className="space-y-4">
            {/* 주문 정보 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">📦 주문 정보</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">주문번호:</span>
                  <span className="ml-2 font-medium">{selectedRefund.order_number}</span>
                </div>
                <div>
                  <span className="text-gray-600">마켓:</span>
                  <span className="ml-2 font-medium">{selectedRefund.market_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">벤더:</span>
                  <span className="ml-2 font-medium">{selectedRefund.vendor_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">수량:</span>
                  <span className="ml-2 font-medium">{selectedRefund.quantity}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">옵션상품:</span>
                  <span className="ml-2 font-medium">{selectedRefund.option_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">셀러공급가:</span>
                  <span className="ml-2 font-medium">
                    {Number(selectedRefund.seller_supply_price || 0).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* 주문자/수령인 정보 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">👤 주문자/수령인 정보</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">주문자:</span>
                  <span className="ml-2 font-medium">{selectedRefund.orderer_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">주문자 전화:</span>
                  <span className="ml-2 font-medium">{selectedRefund.orderer_phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">수령인:</span>
                  <span className="ml-2 font-medium">{selectedRefund.recipient_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">수령인 전화:</span>
                  <span className="ml-2 font-medium">{selectedRefund.recipient_phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">주소:</span>
                  <span className="ml-2 font-medium">{selectedRefund.recipient_address}</span>
                </div>
              </div>
            </div>

            {/* 환불 금액 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">💰 환불 금액</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">총 환불액:</span>
                  <span className="ml-2 font-bold text-purple-600">
                    {Number(selectedRefund.refund_amount).toLocaleString()}원
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">캐시 환불:</span>
                  <span className="ml-2 font-medium text-orange-600">
                    {Number(selectedRefund.cash_refund_amount || 0).toLocaleString()}원
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">계좌 환불:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {(Number(selectedRefund.refund_amount) - Number(selectedRefund.cash_refund_amount || 0)).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* 환불 계좌 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">🏦 환불 계좌</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">조직:</span>
                  <span className="ml-2 font-medium">{selectedRefund.organization_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">은행:</span>
                  <span className="ml-2 font-medium">{selectedRefund.bank_name || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">계좌번호:</span>
                  <span className="ml-2 font-medium">{selectedRefund.bank_account || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">예금주:</span>
                  <span className="ml-2 font-medium">{selectedRefund.account_holder || '-'}</span>
                </div>
              </div>
            </div>

            {/* CS 정보 */}
            {selectedRefund.cs_type && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📞 CS 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">CS 구분:</span>
                    <span className="ml-2 font-medium">{selectedRefund.cs_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">해결방법:</span>
                    <span className="ml-2 font-medium">{selectedRefund.resolution_method || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">환불비율:</span>
                    <span className="ml-2 font-medium">
                      {selectedRefund.refund_ratio ? `${selectedRefund.refund_ratio}%` : '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">CS 내용:</span>
                    <div className="ml-2 mt-1 p-2 bg-white rounded border">
                      {selectedRefund.cs_content || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 처리 정보 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">⚙️ 처리 정보</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">환불처리일:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedRefund.refund_processed_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">처리자:</span>
                  <span className="ml-2 font-medium">{selectedRefund.processed_by_name}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
