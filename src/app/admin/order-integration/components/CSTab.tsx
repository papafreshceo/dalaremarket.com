'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Search, Filter } from 'lucide-react';

interface CSCase {
  seq: number;
  marketName: string;
  orderNumber: string;
  recipientName: string;
  csType: '교환' | '반품' | '환불' | '배송문의' | '상품문의' | '기타';
  csStatus: '접수' | '처리중' | '완료' | '보류';
  content: string;
  response: string;
  createdAt: string;
  updatedAt: string;
  priority: '높음' | '보통' | '낮음';
}

export default function CSTab() {
  const [cases, setCases] = useState<CSCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<CSCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<CSCase | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cases, searchKeyword, typeFilter, statusFilter]);

  const loadCases = async () => {
    setLoading(true);
    try {
      // TODO: API 호출하여 CS 건 조회
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 임시 데이터
      const mockCases: CSCase[] = Array.from({ length: 15 }, (_, i) => ({
        seq: i + 1,
        marketName: ['스마트스토어', '쿠팡', '11번가'][i % 3],
        orderNumber: `ORD-${Date.now()}-${i}`,
        recipientName: `고객${i + 1}`,
        csType: ['교환', '반품', '환불', '배송문의', '상품문의', '기타'][i % 6] as any,
        csStatus: ['접수', '처리중', '완료', '보류'][i % 4] as any,
        content: `CS 문의 내용 ${i + 1}. 배송이 지연되고 있습니다. 언제쯤 받을 수 있을까요?`,
        response: i % 3 === 0 ? `답변 내용 ${i + 1}` : '',
        createdAt: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        priority: ['높음', '보통', '낮음'][i % 3] as any,
      }));

      setCases(mockCases);
    } catch (error) {
      console.error('CS 조회 실패:', error);
      alert('CS 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cases];

    // 타입 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.csType === typeFilter);
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.csStatus === statusFilter);
    }

    // 검색어 필터
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(c =>
        c.orderNumber.toLowerCase().includes(keyword) ||
        c.recipientName.toLowerCase().includes(keyword) ||
        c.content.toLowerCase().includes(keyword)
      );
    }

    setFilteredCases(filtered);
  };

  const openDetail = (csCase: CSCase) => {
    setSelectedCase(csCase);
    setResponseText(csCase.response);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedCase(null);
    setResponseText('');
  };

  const handleSaveResponse = async () => {
    if (!selectedCase) return;

    try {
      // TODO: API 호출하여 답변 저장
      console.log('답변 저장:', { seq: selectedCase.seq, response: responseText });

      const updated = cases.map(c =>
        c.seq === selectedCase.seq
          ? { ...c, response: responseText, csStatus: '완료' as const, updatedAt: new Date().toISOString().split('T')[0] }
          : c
      );
      setCases(updated);

      alert('답변이 저장되었습니다.');
      closeDetail();
    } catch (error) {
      console.error('답변 저장 실패:', error);
      alert('답변 저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateStatus = async (seq: number, newStatus: CSCase['csStatus']) => {
    try {
      // TODO: API 호출하여 상태 변경
      console.log('상태 변경:', { seq, newStatus });

      const updated = cases.map(c =>
        c.seq === seq
          ? { ...c, csStatus: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
          : c
      );
      setCases(updated);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      '교환': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      '반품': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      '환불': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      '배송문의': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      '상품문의': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      '기타': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return styles[type as keyof typeof styles] || styles['기타'];
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      '접수': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      '처리중': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      '완료': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      '보류': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return styles[status as keyof typeof styles] || styles['접수'];
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      '높음': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      '보통': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      '낮음': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return styles[priority as keyof typeof styles] || styles['보통'];
  };

  const statusCounts = {
    all: cases.length,
    '접수': cases.filter(c => c.csStatus === '접수').length,
    '처리중': cases.filter(c => c.csStatus === '처리중').length,
    '완료': cases.filter(c => c.csStatus === '완료').length,
    '보류': cases.filter(c => c.csStatus === '보류').length,
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
          onClick={() => setStatusFilter('접수')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === '접수'
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <div className="text-sm text-text-secondary mb-1">접수</div>
            <div className="text-2xl font-semibold text-yellow-600">{statusCounts['접수']}</div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('처리중')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === '처리중'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm text-text-secondary mb-1">처리중</div>
            <div className="text-2xl font-semibold text-blue-600">{statusCounts['처리중']}</div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('완료')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === '완료'
              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-sm text-text-secondary mb-1">완료</div>
            <div className="text-2xl font-semibold text-green-600">{statusCounts['완료']}</div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('보류')}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === '보류'
              ? 'border-gray-500 bg-gray-50 dark:bg-gray-950/20'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="text-center">
            <MessageSquare className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <div className="text-sm text-text-secondary mb-1">보류</div>
            <div className="text-2xl font-semibold text-gray-600">{statusCounts['보류']}</div>
          </div>
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="주문번호, 고객명, 문의내용 검색"
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">전체 유형</option>
            <option value="교환">교환</option>
            <option value="반품">반품</option>
            <option value="환불">환불</option>
            <option value="배송문의">배송문의</option>
            <option value="상품문의">상품문의</option>
            <option value="기타">기타</option>
          </select>
        </div>
      </div>

      {/* CS 목록 */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-20">
              <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">CS 건이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-secondary sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">연번</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">우선순위</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">마켓명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">고객명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">문의내용</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">접수일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider border-b border-border">액션</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {filteredCases.map((csCase) => (
                  <tr key={csCase.seq} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{csCase.seq}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityBadge(csCase.priority)}`}>
                        {csCase.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadge(csCase.csType)}`}>
                        {csCase.csType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <select
                        value={csCase.csStatus}
                        onChange={(e) => handleUpdateStatus(csCase.seq, e.target.value as CSCase['csStatus'])}
                        className={`px-2 py-1 text-xs font-medium rounded border-0 focus:outline-none focus:ring-1 focus:ring-primary ${getStatusBadge(csCase.csStatus)}`}
                      >
                        <option value="접수">접수</option>
                        <option value="처리중">처리중</option>
                        <option value="완료">완료</option>
                        <option value="보류">보류</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                        {csCase.marketName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{csCase.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{csCase.recipientName}</td>
                    <td className="px-4 py-3 text-sm text-text max-w-md truncate">{csCase.content}</td>
                    <td className="px-4 py-3 text-sm text-text whitespace-nowrap">{csCase.createdAt}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => openDetail(csCase)}
                        className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 상세보기 모달 */}
      {showDetail && selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">CS 상세 정보</h3>
              <button
                onClick={closeDetail}
                className="text-text-secondary hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">주문번호</label>
                  <div className="text-sm text-text">{selectedCase.orderNumber}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">고객명</label>
                  <div className="text-sm text-text">{selectedCase.recipientName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">유형</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadge(selectedCase.csType)}`}>
                    {selectedCase.csType}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">상태</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(selectedCase.csStatus)}`}>
                    {selectedCase.csStatus}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">문의 내용</label>
                <div className="p-3 bg-surface-secondary border border-border rounded-lg text-sm text-text whitespace-pre-wrap">
                  {selectedCase.content}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">답변</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="답변을 입력하세요"
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closeDetail}
                  className="px-4 py-2 border border-border bg-surface text-text rounded-lg hover:bg-surface-hover transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveResponse}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
