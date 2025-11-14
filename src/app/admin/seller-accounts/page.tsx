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
  depositor_name: string | null;
  store_name: string | null;
  store_phone: string | null;
  tier: string | null;
  is_active: boolean;
  max_members: number | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
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
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('조직 로드 오류:', error);
        return;
      }

      setOrganizations(data || []);
      if (data && data.length > 0 && !selectedOrg) {
        setSelectedOrg(data[0]);
      }
    } catch (error) {
      console.error('조직 로드 실패:', error);
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
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          users (
            id,
            name,
            email,
            phone,
            profile_name
          )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('멤버 로드 오류:', error);
        setMembers([]);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('멤버 로드 실패:', error);
      setMembers([]);
    }
  }

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
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
                    members.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          padding: '12px',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                          {member.users?.name || '-'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                          {member.users?.email || '-'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                          {member.users?.phone || '-'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          프로필명: {member.users?.profile_name || '-'}
                        </div>
                      </div>
                    ))
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
                  <InfoRow label="입금자명" value={selectedOrg.depositor_name} />
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
