'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast, { Toaster } from 'react-hot-toast';

interface Organization {
  id: string;
  business_name: string;
  business_number: string | null;
  business_email: string | null;
  seller_code: string | null;
  tier: string | null;
}

interface InvoiceItem {
  item_name: string;
  spec: string;
  qty: number;
  unit_cost: number;
}

export default function AdminTaxInvoicePage() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuing, setIssuing] = useState(false);

  // 품목 정보
  const [items, setItems] = useState<InvoiceItem[]>([
    { item_name: '상품 판매', spec: '', qty: 1, unit_cost: 0 }
  ]);
  const [remark, setRemark] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminAndLoadOrgs();
  }, []);

  const checkAdminAndLoadOrgs = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || userData.role !== 'admin') {
        toast.error('관리자 권한이 필요합니다.');
        router.push('/platform');
        return;
      }

      // 조직 목록 조회
      const response = await fetch('/api/admin/tax-invoice/organizations');
      const data = await response.json();

      if (data.success) {
        setOrganizations(data.organizations);
      } else {
        toast.error('조직 목록 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('초기화 오류:', error);
      toast.error('초기화 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrgs.size === organizations.length) {
      setSelectedOrgs(new Set());
    } else {
      setSelectedOrgs(new Set(organizations.map(org => org.id)));
    }
  };

  const addItem = () => {
    setItems([...items, { item_name: '', spec: '', qty: 1, unit_cost: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    let supplyCost = 0;
    items.forEach(item => {
      supplyCost += item.unit_cost * item.qty;
    });
    const taxAmount = Math.round(supplyCost * 0.1);
    const total = supplyCost + taxAmount;
    return { supplyCost, taxAmount, total };
  };

  const handleBulkIssue = async () => {
    if (selectedOrgs.size === 0) {
      toast.error('발급할 조직을 선택해주세요.');
      return;
    }

    if (items.some(item => !item.item_name || item.unit_cost <= 0)) {
      toast.error('품목명과 단가를 올바르게 입력해주세요.');
      return;
    }

    if (!window.confirm(`선택한 ${selectedOrgs.size}개 조직에 세금계산서를 발급하시겠습니까?`)) {
      return;
    }

    setIssuing(true);

    try {
      const invoices = Array.from(selectedOrgs).map(org_id => ({
        organization_id: org_id,
        issue_date: issueDate,
        items: items.map(item => ({
          item_name: item.item_name,
          spec: item.spec || undefined,
          qty: item.qty,
          unit_cost: item.unit_cost
        })),
        remark: remark || undefined
      }));

      const response = await fetch('/api/admin/tax-invoice/bulk-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        // 선택 해제
        setSelectedOrgs(new Set());
        // 품목 초기화
        setItems([{ item_name: '상품 판매', spec: '', qty: 1, unit_cost: 0 }]);
        setRemark('');
      } else {
        toast.error(data.error || '발급에 실패했습니다.');
      }
    } catch (error) {
      console.error('발급 오류:', error);
      toast.error('발급 중 오류가 발생했습니다.');
    } finally {
      setIssuing(false);
    }
  };

  const { supplyCost, taxAmount, total } = calculateTotal();

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          세금계산서 일괄 발급
        </h1>
        <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '32px' }}>
          선택한 조직에 동일한 내용의 세금계산서를 일괄 발급합니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* 왼쪽: 조직 선택 */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                발급 대상 선택 ({selectedOrgs.size}/{organizations.length})
              </h2>
              <button
                onClick={handleSelectAll}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {selectedOrgs.size === organizations.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {organizations.map(org => (
                <div
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    border: `2px solid ${selectedOrgs.has(org.id) ? '#3b82f6' : '#e9ecef'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedOrgs.has(org.id) ? '#eff6ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {org.business_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {org.seller_code} | {org.business_number || '사업자번호 없음'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 발급 정보 */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              발급 정보
            </h2>

            {/* 발급일 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>발급일</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* 품목 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>품목</label>
                <button
                  onClick={addItem}
                  style={{
                    padding: '4px 10px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + 추가
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      placeholder="품목명"
                      value={item.item_name}
                      onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                      style={{
                        flex: 2,
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                    <input
                      placeholder="규격"
                      value={item.spec}
                      onChange={(e) => updateItem(index, 'spec', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="수량"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="단가"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(index, 'unit_cost', Number(e.target.value))}
                      style={{
                        flex: 2,
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        style={{
                          padding: '8px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 비고 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>비고 (선택)</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="필요한 경우 비고를 입력하세요"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* 금액 요약 */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                금액 요약
              </div>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>공급가액:</span>
                  <span>{supplyCost.toLocaleString()}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6c757d' }}>
                  <span>세액 (10%):</span>
                  <span>{taxAmount.toLocaleString()}원</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '2px solid #dee2e6',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#3b82f6'
                }}>
                  <span>합계:</span>
                  <span>{total.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 발급 버튼 */}
            <button
              onClick={handleBulkIssue}
              disabled={issuing || selectedOrgs.size === 0}
              style={{
                width: '100%',
                padding: '14px',
                background: issuing || selectedOrgs.size === 0 ? '#adb5bd' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: issuing || selectedOrgs.size === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {issuing ? '발급 중...' : `${selectedOrgs.size}개 조직에 일괄 발급`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
