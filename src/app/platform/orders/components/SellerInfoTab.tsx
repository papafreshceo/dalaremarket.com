'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import OrganizationMembers from '@/components/organization/OrganizationMembers';
import InviteMember from '@/components/organization/InviteMember';
import InvitationsList from '@/components/organization/InvitationsList';

interface SellerInfo {
  // 사업자 정보
  business_name?: string;
  business_address?: string;
  business_number?: string;
  business_email?: string;
  representative_name?: string;
  representative_phone?: string;

  // 담당자 정보
  manager_name?: string;
  manager_phone?: string;

  // 정산 계좌 정보
  bank_account?: string;
  bank_name?: string;
  account_holder?: string;

  // 송장 출력 정보
  store_name?: string;
  store_phone?: string;
}

export default function SellerInfoTab() {
  const [userId, setUserId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [additionalAccounts, setAdditionalAccounts] = useState<any[]>([]);
  const [savingSubAccounts, setSavingSubAccounts] = useState<Record<string, boolean>>({});
  const [isSameAsBusinessName, setIsSameAsBusinessName] = useState(true);

  const supabase = createClient();

  // 티어별 최대 계정 수 계산
  const getMaxAccountsByTier = (tier: string | null | undefined) => {
    if (!tier) return 2;
    const lowerTier = tier.toLowerCase();
    switch (lowerTier) {
      case 'light':
      case 'standard':
        return 2;
      case 'advance':
      case 'elite':
      case 'legend':
        return 3;
      default:
        return 2;
    }
  };

  const maxAccounts = useMemo(() => {
    return user ? getMaxAccountsByTier(user.tier) : 1;
  }, [user]);

  const currentAccountCount = 1 + additionalAccounts.length;
  const canAddAccount = isOwner && currentAccountCount < maxAccounts;

  // 사용자 정보 로드
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUserId(authUser.id);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      initializeData();
    }
  }, [userId]);

  const initializeData = async () => {
    await loadUserProfile();
    await loadOrganizationInfo();
    await loadSubAccounts();
  };

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    }
  };

  const loadOrganizationInfo = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', authUser.id)
        .single();

      if (!userData?.primary_organization_id) {
        setLoading(false);
        return;
      }

      const { data: memberData } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', userData.primary_organization_id)
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .single();

      setMember(memberData);
      const ownerRole = memberData?.role === 'owner';
      const adminRole = memberData?.role === 'admin';
      setIsOwner(ownerRole);
      setCanManageMembers(ownerRole || adminRole);

      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.primary_organization_id)
        .single();

      if (orgData) {
        // organization에서 owner 정보 가져오기
        const ownerData = {
          seller_code: orgData.seller_code || null,
          business_name: orgData.business_name || null
        };

        // organization 객체에 owner 정보 추가
        const orgWithOwner = {
          ...orgData,
          owner: ownerData
        };

        setOrganization(orgWithOwner);
        setSellerInfo({
          business_name: orgData.business_name || '',
          business_address: orgData.address || '',
          business_number: orgData.business_number || '',
          business_email: orgData.email || '',
          representative_name: orgData.representative_name || '',
          representative_phone: orgData.phone || '',
          manager_name: orgData.manager_name || '',
          manager_phone: orgData.manager_phone || '',
          bank_account: orgData.bank_account || '',
          bank_name: orgData.bank_name || '',
          account_holder: orgData.account_holder || '',
          store_name: orgData.store_name || '',
          store_phone: orgData.store_phone || ''
        });

        // 체크박스 상태 설정
        setIsSameAsBusinessName(!orgData.store_name || orgData.store_name === orgData.business_name);
      }

      setLoading(false);
    } catch (error) {
      console.error('조직 정보 로드 오류:', error);
      setLoading(false);
    }
  };

  const loadSubAccounts = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userData } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', authUser.id)
        .single();

      if (!userData?.primary_organization_id) return;

      const response = await fetch(`/api/organizations/sub?org_id=${userData.primary_organization_id}`);
      const data = await response.json();

      if (data.success && data.subAccounts) {
        setAdditionalAccounts(data.subAccounts);
      }
    } catch (error) {
      console.error('서브계정 로드 오류:', error);
    }
  };

  const handleChange = (field: keyof SellerInfo, value: string) => {
    if (field === 'representative_phone' || field === 'manager_phone' || field === 'store_phone') {
      const numbers = value.replace(/[^\d]/g, '');
      let formatted = numbers;
      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }
      setSellerInfo({ ...sellerInfo, [field]: formatted });
    } else if (field === 'business_number') {
      const numbers = value.replace(/[^\d]/g, '');
      let formatted = numbers;
      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 5) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
      }
      setSellerInfo({ ...sellerInfo, [field]: formatted });
    } else {
      setSellerInfo({ ...sellerInfo, [field]: value });
    }
  };

  const handleSaveSellerAccount = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: sellerInfo.business_name,
          business_address: sellerInfo.business_address,
          business_number: sellerInfo.business_number,
          business_email: sellerInfo.business_email,
          representative_name: sellerInfo.representative_name,
          representative_phone: sellerInfo.representative_phone,
          manager_name: sellerInfo.manager_name,
          manager_phone: sellerInfo.manager_phone,
          bank_account: sellerInfo.bank_account,
          bank_name: sellerInfo.bank_name,
          account_holder: sellerInfo.account_holder,
          store_name: sellerInfo.store_name,
          store_phone: sellerInfo.store_phone
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('셀러계정 정보가 저장되었습니다.');
        await loadOrganizationInfo();
      } else {
        toast.error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubAccount = async (account: any) => {
    try {
      setSavingSubAccounts({ ...savingSubAccounts, [account.id]: true });

      if (!organization?.id) {
        toast.error('조직 정보를 찾을 수 없습니다.');
        return;
      }

      const isNewAccount = typeof account.id === 'string' || account.id > 1000000000000;

      const response = await fetch('/api/organizations/sub', {
        method: isNewAccount ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...account,
          organization_id: organization.id
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('서브계정이 저장되었습니다.');
        await loadSubAccounts();
      } else {
        toast.error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('서브계정 저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingSubAccounts({ ...savingSubAccounts, [account.id]: false });
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '16px',
        color: '#6c757d'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px'
    }}>
      {/* 셀러계정 설정 */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#212529',
            margin: 0
          }}>셀러계정 정보</h2>

          {/* 셀러계정명 배지 */}
          {(() => {
            const businessName = isOwner
              ? organization?.business_name
              : organization?.owner?.business_name;
            return businessName ? (
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#059669',
                background: '#d1fae5',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #6ee7b7'
              }}>
                {businessName}
              </span>
            ) : null;
          })()}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* 셀러코드 배지 */}
            {(() => {
              const sellerCode = isOwner
                ? organization?.seller_code
                : organization?.owner?.seller_code;
              return sellerCode ? (
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#3b82f6',
                  background: '#eff6ff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #dbeafe'
                }}>
                  {sellerCode}
                </span>
              ) : null;
            })()}
          </div>

          <div style={{ flex: 1 }} />

          {/* 저장 버튼 */}
          <button
            onClick={handleSaveSellerAccount}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: saving
                ? '#adb5bd'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>

          {/* 서브계정 추가 버튼 */}
          {canAddAccount ? (
            <button
              onClick={() => {
                const sampleNumber = additionalAccounts.length + 1;
                setAdditionalAccounts([...additionalAccounts, {
                  id: Date.now(),
                  business_name: `sub테스트사업자${sampleNumber}`,
                  business_address: `sub서울시 강남구 테헤란로 ${100 + sampleNumber}길`,
                  business_number: `${100 + sampleNumber}-${10 + sampleNumber}-${10000 + sampleNumber}`,
                  business_email: `sub${sampleNumber}@example.com`,
                  representative_name: `sub대표자${sampleNumber}`,
                  bank_account: `${1000000 + sampleNumber * 1111}`,
                  bank_name: 'sub국민은행',
                  account_holder: `sub예금주${sampleNumber}`,
                }]);
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              서브계정추가 (가능 {maxAccounts - currentAccountCount})
            </button>
          ) : isOwner && currentAccountCount >= maxAccounts ? (
            <div style={{
              padding: '10px 20px',
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              계정 한도 ({currentAccountCount}/{maxAccounts})
              {user?.tier && ['light', 'basic'].includes(user.tier.toLowerCase()) && (
                <span style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                  스탠다드 이상 등급 필요
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 2fr',
          gap: '24px'
        }}>
          {/* 사업자 정보 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#343a40',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e9ecef'
            }}>사업자 정보</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>사업자명</label>
                <input
                  type="text"
                  value={sellerInfo.business_name || ''}
                  onChange={(e) => handleChange('business_name', e.target.value)}
                  placeholder="사업자명"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>주소</label>
                <input
                  type="text"
                  value={sellerInfo.business_address || ''}
                  onChange={(e) => handleChange('business_address', e.target.value)}
                  placeholder="주소"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>사업자등록번호</label>
                <input
                  type="text"
                  value={sellerInfo.business_number || ''}
                  onChange={(e) => handleChange('business_number', e.target.value)}
                  placeholder="000-00-00000"
                  maxLength={12}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>이메일 (계산서)</label>
                <input
                  type="email"
                  value={sellerInfo.business_email || ''}
                  onChange={(e) => handleChange('business_email', e.target.value)}
                  placeholder="example@company.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>대표자명</label>
                <input
                  type="text"
                  value={sellerInfo.representative_name || ''}
                  onChange={(e) => handleChange('representative_name', e.target.value)}
                  placeholder="대표자명"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>대표자 연락처</label>
                <input
                  type="tel"
                  value={sellerInfo.representative_phone || ''}
                  onChange={(e) => handleChange('representative_phone', e.target.value)}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>
            </div>
          </div>

          {/* 담당자 및 정산 정보 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#343a40',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e9ecef'
            }}>담당자 정보</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>이름</label>
                <input
                  type="text"
                  value={sellerInfo.manager_name || ''}
                  onChange={(e) => handleChange('manager_name', e.target.value)}
                  placeholder="담당자 이름"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>연락처</label>
                <input
                  type="tel"
                  value={sellerInfo.manager_phone || ''}
                  onChange={(e) => handleChange('manager_phone', e.target.value)}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>
            </div>

            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#343a40',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e9ecef'
            }}>정산 계좌</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>은행명 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={sellerInfo.bank_name || ''}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  placeholder="예: 국민은행"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>계좌번호 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={sellerInfo.bank_account || ''}
                  onChange={(e) => handleChange('bank_account', e.target.value)}
                  placeholder="'-' 없이 입력"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>예금주 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={sellerInfo.account_holder || ''}
                  onChange={(e) => handleChange('account_holder', e.target.value)}
                  placeholder="예금주명"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>
            </div>
          </div>

          {/* 멤버 관리 */}
          {organization && user && (
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#343a40',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e9ecef'
              }}>멤버 관리</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 내 역할 */}
                {member && (
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#6c757d'
                    }}>내 역할</div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#212529'
                    }}>
                      {member.role === 'owner' ? '소유자' : member.role === 'admin' ? '관리자' : '담당자'}
                    </div>
                  </div>
                )}

                {/* 멤버 목록 */}
                {organization && user && (
                  <div>
                    <OrganizationMembers
                      organizationId={organization.id}
                      currentUserId={user.id}
                      canManage={canManageMembers}
                      isOwner={isOwner}
                      inviteButton={
                        canManageMembers ? (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%'
                          }}>
                            <div style={{
                              transform: 'scale(0.85)',
                              transformOrigin: 'center'
                            }}>
                              <InviteMember organizationId={organization.id} />
                            </div>
                          </div>
                        ) : undefined
                      }
                    />
                  </div>
                )}

                {/* 초대 목록 */}
                {canManageMembers && organization && (
                  <div>
                    <InvitationsList organizationId={organization.id} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 송장 출력 정보 - 전체 너비 */}
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e9ecef' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#343a40',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '2px solid #e9ecef'
          }}>송장 출력 정보</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px'
              }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057'
                }}>업체명</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <input
                    type="checkbox"
                    id="sameAsBusinessName"
                    checked={isSameAsBusinessName}
                    onChange={(e) => {
                      setIsSameAsBusinessName(e.target.checked);
                      if (e.target.checked && sellerInfo.business_name) {
                        setSellerInfo(prev => ({ ...prev, store_name: prev.business_name }));
                      }
                    }}
                    style={{
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor="sameAsBusinessName"
                    style={{
                      fontSize: '11px',
                      color: '#6c757d',
                      cursor: 'pointer'
                    }}
                  >
                    사업자명과 동일
                  </label>
                </div>
              </div>
              <input
                type="text"
                value={sellerInfo.store_name || ''}
                onChange={(e) => handleChange('store_name', e.target.value)}
                disabled={isSameAsBusinessName}
                placeholder="업체명"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  background: isSameAsBusinessName ? '#f8f9fa' : 'white',
                  color: isSameAsBusinessName ? '#6c757d' : '#212529',
                  cursor: isSameAsBusinessName ? 'not-allowed' : 'text',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => !isSameAsBusinessName && (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#495057',
                marginBottom: '6px'
              }}>전화번호</label>
              <input
                type="tel"
                value={sellerInfo.store_phone || ''}
                onChange={(e) => handleChange('store_phone', e.target.value)}
                placeholder="010-0000-0000"
                maxLength={13}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 서브계정들 */}
      {additionalAccounts.map((account, index) => (
        <div key={account.id} style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#212529',
              margin: 0
            }}>서브계정 {index + 1}</h2>

            {account.business_name && (
              <span style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#212529'
              }}>
                {account.business_name}
              </span>
            )}

            <div style={{ flex: 1 }} />

            {/* 저장 버튼 */}
            <button
              onClick={() => handleSaveSubAccount(account)}
              disabled={savingSubAccounts[account.id]}
              style={{
                padding: '10px 20px',
                background: savingSubAccounts[account.id]
                  ? '#adb5bd'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: savingSubAccounts[account.id] ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!savingSubAccounts[account.id]) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {savingSubAccounts[account.id] ? '저장 중...' : '저장'}
            </button>

            {/* 삭제 버튼 */}
            <button
              onClick={async () => {
                if (!window.confirm('⚠️ 경고\n\n이 서브계정을 완전히 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
                  return;
                }

                try {
                  if (typeof account.id === 'string' || account.id > 1000000000000) {
                    setAdditionalAccounts(additionalAccounts.filter(acc => acc.id !== account.id));
                    toast.success('서브계정이 제거되었습니다.');
                  } else {
                    const response = await fetch(`/api/organizations/sub?id=${account.id}`, {
                      method: 'DELETE',
                    });

                    const data = await response.json();

                    if (data.success) {
                      toast.success('서브계정이 완전히 삭제되었습니다.');
                      setAdditionalAccounts(additionalAccounts.filter(acc => acc.id !== account.id));
                    } else {
                      toast.error(data.error || '삭제에 실패했습니다.');
                    }
                  }
                } catch (error) {
                  console.error('서브계정 삭제 오류:', error);
                  toast.error('삭제 중 오류가 발생했습니다.');
                }
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              삭제
            </button>
          </div>

          {/* 서브계정 사업자 정보 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#343a40',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e9ecef'
            }}>사업자 정보</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 0.7fr 1fr 0.7fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>사업자명 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={account.business_name || ''}
                  onChange={(e) => {
                    const updated = additionalAccounts.map(acc =>
                      acc.id === account.id ? { ...acc, business_name: e.target.value } : acc
                    );
                    setAdditionalAccounts(updated);
                  }}
                  placeholder="사업자명"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>주소 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={account.business_address || ''}
                  onChange={(e) => {
                    const updated = additionalAccounts.map(acc =>
                      acc.id === account.id ? { ...acc, business_address: e.target.value } : acc
                    );
                    setAdditionalAccounts(updated);
                  }}
                  placeholder="주소"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>사업자등록번호 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={account.business_number || ''}
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/[^\d]/g, '');
                    let formatted = numbers;
                    if (numbers.length <= 3) {
                      formatted = numbers;
                    } else if (numbers.length <= 5) {
                      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
                    } else {
                      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
                    }
                    const updated = additionalAccounts.map(acc =>
                      acc.id === account.id ? { ...acc, business_number: formatted } : acc
                    );
                    setAdditionalAccounts(updated);
                  }}
                  placeholder="000-00-00000"
                  maxLength={12}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>이메일 (계산서) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  value={account.business_email || ''}
                  onChange={(e) => {
                    const updated = additionalAccounts.map(acc =>
                      acc.id === account.id ? { ...acc, business_email: e.target.value } : acc
                    );
                    setAdditionalAccounts(updated);
                  }}
                  placeholder="example@company.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>대표자명 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={account.representative_name || ''}
                  onChange={(e) => {
                    const updated = additionalAccounts.map(acc =>
                      acc.id === account.id ? { ...acc, representative_name: e.target.value } : acc
                    );
                    setAdditionalAccounts(updated);
                  }}
                  placeholder="대표자명"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>은행명 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={account.bank_name || ''}
                  onChange={(e) => {
                    const updated = additionalAccounts.map(acc =>
                      acc.id === account.id ? { ...acc, bank_name: e.target.value } : acc
                    );
                    setAdditionalAccounts(updated);
                  }}
                  placeholder="예: 국민은행"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>계좌번호 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={account.bank_account || ''}
                  onChange={(e) => {
                    const updated = additionalAccounts.map(acc =>
                      acc.id === account.id ? { ...acc, bank_account: e.target.value } : acc
                    );
                    setAdditionalAccounts(updated);
                  }}
                  placeholder="'-' 없이 입력"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '6px'
                }}>예금주 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={account.account_holder || ''}
                  onChange={(e) => {
                    const updated = additionalAccounts.map(acc =>
                      acc.id === account.id ? { ...acc, account_holder: e.target.value } : acc
                    );
                    setAdditionalAccounts(updated);
                  }}
                  placeholder="예금주명"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
