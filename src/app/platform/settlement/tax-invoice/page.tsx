'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast, { Toaster } from 'react-hot-toast';

interface TaxInvoiceItem {
  id: number;
  item_name: string;
  spec: string | null;
  qty: number;
  unit_cost: number;
  supply_cost: number;
  tax_amount: number;
  remark: string | null;
}

interface TaxInvoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  supply_cost: number;
  tax_amount: number;
  total_amount: number;
  pdf_url: string | null;
  xml_url: string | null;
  status: string;
  asp_provider: string | null;
  remark: string | null;
  created_at: string;
  tax_invoice_items: TaxInvoiceItem[];
}

export default function TaxInvoicePage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      // 인증 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 세금계산서 목록 조회
      const response = await fetch('/api/tax-invoice/my-list');
      const data = await response.json();

      if (data.success) {
        setInvoices(data.invoices);
      } else {
        toast.error(data.error || '세금계산서 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('세금계산서 조회 오류:', error);
      toast.error('세금계산서 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (invoice: TaxInvoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
    } else {
      toast.error('PDF 파일이 없습니다.');
    }
  };

  const handleViewDetail = (invoice: TaxInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'issued': '발급완료',
      'cancelled': '취소됨',
      'modified': '수정됨'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'issued': '#10b981',
      'cancelled': '#ef4444',
      'modified': '#f59e0b'
    };
    return colorMap[status] || '#6c757d';
  };

  return (
    <>
      <Toaster position="top-center" />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#212529',
            marginBottom: '8px'
          }}>세금계산서</h1>
          <p style={{
            fontSize: '14px',
            color: '#6c757d',
            margin: 0
          }}>발급받은 전자세금계산서를 조회하고 다운로드할 수 있습니다.</p>
        </div>

        {loading ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '16px',
              color: '#6c757d'
            }}>로딩 중...</div>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>📋</div>
            <div style={{
              fontSize: '16px',
              color: '#6c757d'
            }}>발급된 세금계산서가 없습니다.</div>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)',
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid #e9ecef',
                  background: '#f8f9fa'
                }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>발급일</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>승인번호</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>공급가액</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>세액</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>합계</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>상태</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} style={{
                    borderBottom: '1px solid #e9ecef',
                    transition: 'background 0.2s'
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px' }}>{invoice.issue_date}</td>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '13px' }}>
                      {invoice.invoice_number || '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>
                      {invoice.supply_cost.toLocaleString()}원
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#6c757d' }}>
                      {invoice.tax_amount.toLocaleString()}원
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#212529' }}>
                      {invoice.total_amount.toLocaleString()}원
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(invoice.status) + '20',
                        color: getStatusColor(invoice.status)
                      }}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleViewDetail(invoice)}
                          style={{
                            padding: '6px 12px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                        >
                          상세
                        </button>
                        {invoice.pdf_url && (
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            style={{
                              padding: '6px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                          >
                            PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {showDetailModal && selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>세금계산서 상세</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ✕
              </button>
            </div>

            {/* 기본 정보 */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>발급일</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedInvoice.issue_date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>승인번호</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'monospace' }}>
                    {selectedInvoice.invoice_number || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>공급가액</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    {selectedInvoice.supply_cost.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>세액</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    {selectedInvoice.tax_amount.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>합계</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>
                    {selectedInvoice.total_amount.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>상태</div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: getStatusColor(selectedInvoice.status) + '20',
                    color: getStatusColor(selectedInvoice.status)
                  }}>
                    {getStatusText(selectedInvoice.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* 품목 상세 */}
            {selectedInvoice.tax_invoice_items && selectedInvoice.tax_invoice_items.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>품목 내역</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e9ecef', background: '#f8f9fa' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>품목명</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>규격</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>수량</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>단가</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>공급가액</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>세액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.tax_invoice_items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                          <td style={{ padding: '8px' }}>{item.item_name}</td>
                          <td style={{ padding: '8px', color: '#6c757d' }}>{item.spec || '-'}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{item.qty}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {item.unit_cost.toLocaleString()}원
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: '500' }}>
                            {item.supply_cost.toLocaleString()}원
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#6c757d' }}>
                            {item.tax_amount.toLocaleString()}원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 비고 */}
            {selectedInvoice.remark && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                marginBottom: '24px'
              }}>
                <strong>비고:</strong> {selectedInvoice.remark}
              </div>
            )}

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {selectedInvoice.pdf_url && (
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                >
                  PDF 다운로드
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
