'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  business_name: string | null;
  seller_code: string | null;
  business_number: string | null;
  business_address: string | null;
  business_email: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  bank_name: string | null;
  bank_account: string | null;
  account_holder: string | null;
  store_name: string | null;
  store_phone: string | null;
  tier: string | null;
  is_active: boolean;
  max_members: number | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  cash_balance?: number; // organization_cash 테이블에서 조회
  credit_balance?: number; // organization_credits 테이블에서 조회
  accumulated_points?: number; // 누적 기여점수
}

interface SubAccount {
  id: string;
  organization_id: string;
  business_name: string | null;
  business_number: string | null;
  representative_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  store_name: string | null;
  store_phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  users: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    profile_name: string | null;
  } | null;
}

export default function SellerAccountsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 캐시/크레딧 모달 상태
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [cashDescription, setCashDescription] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [cashLoading, setCashLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [cashHistory, setCashHistory] = useState<any[]>([]);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadSubAccounts(selectedOrg.id);
      loadMembers(selectedOrg.id);
    }
  }, [selectedOrg]);

  async function loadOrganizations() {
    try {
      const supabase = createClient();

      // 1. 조직 정보 조회 (accumulated_points 포함)
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*, accumulated_points')
        .order('created_at', { ascending: false});

      if (orgsError) {
        console.error('조직 로드 오류:', orgsError);
        alert('조직 데이터를 불러오는데 실패했습니다: ' + orgsError.message);
        setOrganizations([]);
        setLoading(false);
        return;
      }

      if (!orgsData || orgsData.length === 0) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      const orgIds = orgsData.map(o => o.id);

      // 2. 각 조직의 캐시 정보 조회
      const { data: cashData, error: cashError } = await supabase
        .from('organization_cash')
        .select('organization_id, balance')
        .in('organization_id', orgIds);

      if (cashError) {
        console.error('캐시 데이터 조회 오류:', cashError);
      }

      // 3. 각 조직의 크레딧 정보 조회
      const { data: creditsData, error: creditsError } = await supabase
        .from('organization_credits')
        .select('organization_id, balance')
        .in('organization_id', orgIds);

      if (creditsError) {
        console.error('크레딧 데이터 조회 오류:', creditsError);
      }

      // 4. 조직에 캐시/크레딧 정보 병합
      const orgsWithBalance = orgsData.map(org => {
        const cash = cashData?.find(c => c.organization_id === org.id);
        const credit = creditsData?.find(c => c.organization_id === org.id);

        return {
          ...org,
          cash_balance: cash?.balance || 0,
          credit_balance: credit?.balance || 0
        };
      });

      console.log('로드된 조직 수:', orgsWithBalance.length);
      setOrganizations(orgsWithBalance);
      if (orgsWithBalance.length > 0 && !selectedOrg) {
        setSelectedOrg(orgsWithBalance[0]);
      }
    } catch (error) {
      console.error('조직 로드 실패:', error);
      alert('조직 데이터 로드 중 오류 발생: ' + error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubAccounts(orgId: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('sub_accounts')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('서브계정 로드 오류:', error);
        setSubAccounts([]);
        return;
      }

      setSubAccounts(data || []);
    } catch (error) {
      console.error('서브계정 로드 실패:', error);
      setSubAccounts([]);
    }
  }

  async function loadMembers(orgId: string) {
    try {
      // API 라우트를 통해 서버사이드에서 멤버 정보 조회
      const response = await fetch(`/api/organizations/members?organization_id=${orgId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('멤버 조회 오류:', data.error);
        setMembers([]);
        return;
      }

      if (!data.members || data.members.length === 0) {
        console.log('멤버가 없습니다.');
        setMembers([]);
        return;
      }

      // API 응답 데이터 변환 (user 객체를 users로 변경)
      const formattedMembers = data.members.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        created_at: member.created_at,
        users: member.user ? {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          phone: member.user.phone,
          profile_name: member.user.profile_name
        } : null
      }));

      console.log('로드된 멤버 수:', formattedMembers.length);
      setMembers(formattedMembers);
    } catch (error) {
      console.error('멤버 로드 실패:', error);
      setMembers([]);
    }
  }

  const handleGrantCash = async () => {
    if (!selectedOrg || !cashAmount) {
      alert('캐시 금액을 입력해주세요.');
      return;
    }

    if (!cashDescription || cashDescription.trim() === '') {
      alert('지급 사유를 입력해주세요.');
      return;
    }

    const amount = parseInt(cashAmount);
    if (isNaN(amount) || amount === 0) {
      alert('유효한 캐시 금액을 입력해주세요.');
      return;
    }

    try {
      setCashLoading(true);

      // 조직 캐시 API 호출 (organization_id 기준)
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cash: amount,
          description: cashDescription || '관리자 지급'
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setCashAmount('');
        setCashDescription('');

        // 조직 목록 새로고침 후 selectedOrg 업데이트
        await loadOrganizations();

        // selectedOrg 업데이트
        if (selectedOrg) {
          const supabase = createClient();
          const { data: cashData } = await supabase
            .from('organization_cash')
            .select('balance')
            .eq('organization_id', selectedOrg.id)
            .single();

          setSelectedOrg({
            ...selectedOrg,
            cash_balance: cashData?.balance || 0
          });
        }

        // 내역 새로고침
        await loadCashHistory();
      } else {
        alert(data.error || '캐시 지급에 실패했습니다.');
      }
    } catch (error) {
      console.error('캐시 지급 오류:', error);
      alert('캐시 지급 중 오류가 발생했습니다.');
    } finally {
      setCashLoading(false);
    }
  };

  const loadCashHistory = async () => {
    if (!selectedOrg) return;

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/cash/history`);
      const data = await response.json();

      console.log('캐시 내역 API 응답:', data);

      if (data.success) {
        setCashHistory(data.history || []);
      } else {
        console.error('캐시 내역 조회 실패:', data.error);
        setCashHistory([]);
      }
    } catch (error) {
      console.error('캐시 내역 조회 오류:', error);
      setCashHistory([]);
    }
  };

  const loadCreditHistory = async () => {
    if (!selectedOrg) return;

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/credits/history`);
      const data = await response.json();

      console.log('크레딧 내역 API 응답:', data);

      if (data.success) {
        setCreditHistory(data.history || []);
      } else {
        console.error('크레딧 내역 조회 실패:', data.error);
        setCreditHistory([]);
      }
    } catch (error) {
      console.error('크레딧 내역 조회 오류:', error);
      setCreditHistory([]);
    }
  };

  const handleGrantCredit = async () => {
    if (!selectedOrg || !creditAmount) {
      alert('크레딧 금액을 입력해주세요.');
      return;
    }

    if (!creditDescription || creditDescription.trim() === '') {
      alert('지급 사유를 입력해주세요.');
      return;
    }

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) {
      alert('유효한 크레딧 금액을 입력해주세요.');
      return;
    }

    try {
      setCreditLoading(true);

      // 조직 크레딧 API 호출 (organization_id 기준)
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: amount,
          description: creditDescription || '관리자 지급'
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setCreditAmount('');
        setCreditDescription('');

        // 조직 목록 새로고침 후 selectedOrg 업데이트
        await loadOrganizations();

        // selectedOrg 업데이트
        if (selectedOrg) {
          const supabase = createClient();
          const { data: creditsData } = await supabase
            .from('organization_credits')
            .select('balance')
            .eq('organization_id', selectedOrg.id)
            .single();

          setSelectedOrg({
            ...selectedOrg,
            credit_balance: creditsData?.balance || 0
          });
        }

        // 내역 새로고침
        await loadCreditHistory();
      } else {
        alert(data.error || '크레딧 지급에 실패했습니다.');
      }
    } catch (error) {
      console.error('크레딧 지급 오류:', error);
      alert('크레딧 지급 중 오류가 발생했습니다.');
    } finally {
      setCreditLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    return (
      org.business_name?.toLowerCase().includes(searchLower) ||
      org.seller_code?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 64px)',
      background: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {/* 왼쪽 사이드바 (20%) */}
      <div style={{
        width: '20%',
        background: 'white',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 검색 영역 */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
            셀러계정 관리
          </h2>
          <input
            type="text"
            placeholder="계정명, 코드 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            총 {filteredOrganizations.length}개
          </div>
        </div>

        {/* 목록 영역 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {filteredOrganizations.map((org) => (
            <div
              key={org.id}
              onClick={() => setSelectedOrg(org)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                background: selectedOrg?.id === org.id ? '#f0f7ff' : 'white',
                transition: 'background 0.2s',
                ':hover': {
                  background: '#f9f9f9'
                }
              }}
              onMouseEnter={(e) => {
                if (selectedOrg?.id !== org.id) {
                  e.currentTarget.style.background = '#f9f9f9';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOrg?.id !== org.id) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {org.business_name || '(이름 없음)'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{org.seller_code || '-'}</span>
                {org.is_active ? (
                  <span style={{
                    color: '#10b981',
                    fontSize: '11px',
                    background: '#d1fae5',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    활성
                  </span>
                ) : (
                  <span style={{
                    color: '#ef4444',
                    fontSize: '11px',
                    background: '#fee2e2',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    비활성
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredOrganizations.length === 0 && (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#999',
              fontSize: '14px'
            }}>
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 우측 상세보기 (80%) */}
      <div style={{
        width: '80%',
        overflowY: 'auto',
        padding: '24px'
      }}>
        {selectedOrg ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {/* 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                  {selectedOrg.business_name || '(이름 없음)'}
                </h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    셀러코드: <strong>{selectedOrg.seller_code || '-'}</strong>
                  </span>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    등급: <strong>{selectedOrg.tier || '-'}</strong>
                  </span>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: selectedOrg.is_active ? '#d1fae5' : '#fee2e2',
                    color: selectedOrg.is_active ? '#10b981' : '#ef4444',
                    fontWeight: '600'
                  }}>
                    {selectedOrg.is_active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            </div>

            {/* 상세 정보 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 4fr 2fr', gap: '24px' }}>
              {/* 사업자 정보 */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: '#333',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  사업자 정보
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow label="사업자번호" value={selectedOrg.business_number} />
                  <InfoRow label="사업자주소" value={selectedOrg.business_address} />
                  <InfoRow label="이메일" value={selectedOrg.business_email} />
                </div>
              </div>

              {/* 대표자 정보 */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: '#333',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  대표자 정보
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow label="대표자명" value={selectedOrg.representative_name} />
                  <InfoRow label="대표전화" value={selectedOrg.representative_phone} />
                </div>
              </div>

              {/* 멤버현황 */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: '#333',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  멤버현황 ({members.length}명)
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {members.length > 0 ? (
                    members.map((member) => {
                      const isOwner = member.role === 'owner';
                      const isMember = member.role === 'member';

                      return (
                        <div
                          key={member.id}
                          style={{
                            padding: '8px 12px',
                            background: '#f9fafb',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            fontSize: '13px',
                            color: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}
                        >
                          {isOwner && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              fontWeight: '600'
                            }}>
                              소유자
                            </span>
                          )}
                          {isMember && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#fef3c7',
                              color: '#92400e',
                              fontWeight: '600'
                            }}>
                              담당자
                            </span>
                          )}
                          <span style={{ fontWeight: '600' }}>
                            {member.users?.name || '-'}
                          </span>
                          <span style={{ color: '#999' }}>·</span>
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            {member.users?.email || '-'}
                          </span>
                          <span style={{ color: '#999' }}>·</span>
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            {member.users?.phone || '-'}
                          </span>
                          <span style={{ color: '#999' }}>·</span>
                          <span style={{ color: '#666', fontSize: '12px' }}>
                            {member.users?.profile_name || '-'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '13px',
                      background: '#f9fafb',
                      borderRadius: '6px'
                    }}>
                      등록된 멤버가 없습니다
                    </div>
                  )}
                </div>
              </div>

              {/* 캐시/크레딧 관리 */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: '#333',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  캐시/크레딧 관리
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 조직 캐시/크레딧 잔액 표시 */}
                  <div style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '12px' }}>
                      조직 잔액
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '13px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>캐시</span>
                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#059669' }}>
                          {selectedOrg.cash_balance?.toLocaleString() || 0}원
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>크레딧</span>
                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#2563eb' }}>
                          {selectedOrg.credit_balance?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>기여점수</span>
                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#dc2626' }}>
                          {selectedOrg.accumulated_points?.toLocaleString() || 0}점
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 관리 버튼 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        loadCashHistory();
                        setShowCashModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '14px',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      캐시 관리
                    </button>
                    <button
                      onClick={() => {
                        loadCreditHistory();
                        setShowCreditModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '14px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      크레딧 관리
                    </button>
                  </div>
                </div>
              </div>

              {/* 담당자 정보 */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: '#333',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  담당자 정보
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow label="담당자명" value={selectedOrg.manager_name} />
                  <InfoRow label="담당전화" value={selectedOrg.manager_phone} />
                </div>
              </div>

              {/* 계좌 정보 */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: '#333',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  계좌 정보
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow label="은행명" value={selectedOrg.bank_name} />
                  <InfoRow label="계좌번호" value={selectedOrg.bank_account} />
                  <InfoRow label="예금주" value={selectedOrg.account_holder} />
                </div>
              </div>

              {/* 송장 출력 정보 */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: '#333',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  송장 출력 정보
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow label="출력상호명" value={selectedOrg.store_name} />
                  <InfoRow label="출력전화번호" value={selectedOrg.store_phone} />
                </div>
              </div>

              {/* 시스템 정보 */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: '#333',
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  시스템 정보
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow label="최대 멤버 수" value={selectedOrg.max_members?.toString() || '-'} />
                  <InfoRow label="생성일" value={selectedOrg.created_at ? new Date(selectedOrg.created_at).toLocaleDateString('ko-KR') : '-'} />
                  <InfoRow label="수정일" value={selectedOrg.updated_at ? new Date(selectedOrg.updated_at).toLocaleDateString('ko-KR') : '-'} />
                </div>
              </div>
            </div>

            {/* 서브계정 목록 */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '16px',
                color: '#333',
                borderBottom: '2px solid #e0e0e0',
                paddingBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>서브계정 ({subAccounts.length}개)</span>
              </h3>

              {subAccounts.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gap: '12px'
                }}>
                  {subAccounts.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>사업자명</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                          {sub.business_name || '-'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>출력상호명</div>
                        <div style={{ fontSize: '14px', color: '#333' }}>{sub.store_name || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>출력전화번호</div>
                        <div style={{ fontSize: '14px', color: '#333' }}>{sub.store_phone || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>은행명</div>
                        <div style={{ fontSize: '14px', color: '#333' }}>{sub.bank_name || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>계좌번호</div>
                        <div style={{ fontSize: '14px', color: '#333' }}>{sub.account_number || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>예금주</div>
                        <div style={{ fontSize: '14px', color: '#333' }}>{sub.account_holder || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>상태</div>
                        <div>
                          {sub.is_active ? (
                            <span style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: '#d1fae5',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>
                              활성
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: '#fee2e2',
                              color: '#ef4444',
                              fontWeight: '600'
                            }}>
                              비활성
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>생성일</div>
                        <div style={{ fontSize: '14px', color: '#333' }}>
                          {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  등록된 서브계정이 없습니다
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            color: '#999'
          }}>
            <p style={{ fontSize: '16px' }}>셀러계정을 선택해주세요</p>
          </div>
        )}
      </div>

      {/* 캐시 지급/회수 모달 */}
      {showCashModal && selectedOrg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '700px',
            maxWidth: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
              캐시 관리 - {selectedOrg.business_name}
            </h3>

            {/* 지급/회수 폼 */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  금액 (음수 입력 시 회수)
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="예: 10000 (지급) 또는 -5000 (회수)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  사유
                </label>
                <input
                  type="text"
                  value={cashDescription}
                  onChange={(e) => setCashDescription(e.target.value)}
                  placeholder="지급/회수 사유"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCashModal(false);
                    setCashAmount('');
                    setCashDescription('');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#e5e7eb',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  닫기
                </button>
                <button
                  onClick={handleGrantCash}
                  disabled={cashLoading}
                  style={{
                    padding: '8px 16px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: cashLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: cashLoading ? 0.7 : 1
                  }}
                >
                  {cashLoading ? '처리 중...' : '지급/회수'}
                </button>
              </div>
            </div>

            {/* 내역 */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                캐시 지급/회수 내역 (최근 50건)
              </h4>
              {cashHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cashHistory.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', color: item.amount > 0 ? '#059669' : '#dc2626' }}>
                          {item.amount > 0 ? '+' : ''}{item.amount?.toLocaleString()}원
                        </span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(item.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                        {item.description || '-'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        잔액: {item.balance_before?.toLocaleString()} → {item.balance_after?.toLocaleString()}원
                      </div>
                      {item.admin && (
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          지급한 관리자: {item.admin.name || item.admin.email}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
                  내역이 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 크레딧 지급/회수 모달 */}
      {showCreditModal && selectedOrg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '700px',
            maxWidth: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
              크레딧 관리 - {selectedOrg.business_name}
            </h3>

            {/* 지급/회수 폼 */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  크레딧 (음수 입력 시 회수)
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="예: 100 (지급) 또는 -50 (회수)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  사유
                </label>
                <input
                  type="text"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  placeholder="지급/회수 사유"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    setCreditAmount('');
                    setCreditDescription('');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#e5e7eb',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  닫기
                </button>
                <button
                  onClick={handleGrantCredit}
                  disabled={creditLoading}
                  style={{
                    padding: '8px 16px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: creditLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: creditLoading ? 0.7 : 1
                  }}
                >
                  {creditLoading ? '처리 중...' : '지급/회수'}
                </button>
              </div>
            </div>

            {/* 내역 */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                크레딧 지급/회수 내역 (최근 50건)
              </h4>
              {creditHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {creditHistory.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', color: item.amount > 0 ? '#2563eb' : '#dc2626' }}>
                          {item.amount > 0 ? '+' : ''}{item.amount?.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(item.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                        {item.description || '-'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        잔액: {item.balance_before?.toLocaleString()} → {item.balance_after?.toLocaleString()}
                      </div>
                      {item.admin && (
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          지급한 관리자: {item.admin.name || item.admin.email}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
                  내역이 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <div style={{
        width: '120px',
        fontSize: '14px',
        color: '#666',
        fontWeight: '500'
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        fontSize: '14px',
        color: '#333',
        fontWeight: '400'
      }}>
        {value || '-'}
      </div>
    </div>
  );
}
