'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import OrganizationMembers from '@/components/organization/OrganizationMembers';
import InviteMember from '@/components/organization/InviteMember';
import InvitationsList from '@/components/organization/InvitationsList';

interface SellerInfo {
  // 기본 정보
  name: string;
  email: string;
  phone: string;
  profile_name?: string;

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
  depositor_name?: string;

  // 송장출력 정보
  store_name?: string;
  store_phone?: string;
}

export default function ProfilePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState('');
  const [originalProfileName, setOriginalProfileName] = useState(''); // 원래 프로필 이름 저장
  const [message, setMessage] = useState('');
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [isSameAsBusinessName, setIsSameAsBusinessName] = useState(true);
  const [isSameAsEmail, setIsSameAsEmail] = useState(true);
  const [checkingProfileName, setCheckingProfileName] = useState(false);
  const [profileNameCheckResult, setProfileNameCheckResult] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  // 셀러계정 관리 state
  const [organization, setOrganization] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
    loadUserProfile();
    loadOrganizationInfo();
  }, []);

  // 사업자명과 동일 체크박스가 체크되어 있으면 사업자명을 스토어명에 자동 반영
  useEffect(() => {
    if (isSameAsBusinessName && sellerInfo.business_name) {
      setSellerInfo(prev => ({ ...prev, store_name: prev.business_name }));
    }
  }, [isSameAsBusinessName, sellerInfo.business_name]);

  // 기본 이메일과 동일 체크박스가 체크되어 있으면 기본 이메일을 사업자 이메일에 자동 반영
  useEffect(() => {
    if (isSameAsEmail && sellerInfo.email) {
      setSellerInfo(prev => ({ ...prev, business_email: prev.email }));
    }
  }, [isSameAsEmail, sellerInfo.email]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        // 프로필 이름이 없으면 이메일 앞부분을 기본값으로 설정
        const defaultProfileName = data.user.profile_name || data.user.email?.split('@')[0] || '';
        setProfileName(defaultProfileName);
        setOriginalProfileName(data.user.profile_name || ''); // 원래 프로필 이름 저장

        // 판매자 정보 로드
        const loadedInfo = {
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          profile_name: data.user.profile_name || '',
          business_name: data.user.business_name || '',
          business_address: data.user.business_address || '',
          business_number: data.user.business_number || '',
          business_email: data.user.business_email || data.user.email || '',
          representative_name: data.user.representative_name || '',
          representative_phone: data.user.representative_phone || '',
          manager_name: data.user.manager_name || '',
          manager_phone: data.user.manager_phone || '',
          bank_account: data.user.bank_account || '',
          bank_name: data.user.bank_name || '',
          account_holder: data.user.account_holder || '',
          depositor_name: data.user.depositor_name || '',
          store_name: data.user.store_name || data.user.business_name || '',
          store_phone: data.user.store_phone || '',
        };

        setSellerInfo(loadedInfo);

        // 스토어명이 사업자명과 같거나 없으면 체크박스를 체크 상태로
        if (!data.user.store_name || data.user.store_name === data.user.business_name) {
          setIsSameAsBusinessName(true);
        } else {
          setIsSameAsBusinessName(false);
        }

        // 사업자 이메일이 기본 이메일과 같거나 없으면 체크박스를 체크 상태로
        if (!data.user.business_email || data.user.business_email === data.user.email) {
          setIsSameAsEmail(true);
        } else {
          setIsSameAsEmail(false);
        }
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationInfo = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // 사용자의 organization 정보 가져오기
      const { data: userData } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', authUser.id)
        .single();

      if (!userData?.primary_organization_id) return;

      // Organization 정보 가져오기
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.primary_organization_id)
        .single();

      if (orgData) {
        setOrganization(orgData);
        setIsOwner(orgData.owner_id === authUser.id);
      }

      // Member 정보 가져오기
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', userData.primary_organization_id)
        .eq('user_id', authUser.id)
        .single();

      if (memberData) {
        setMember(memberData);
        setCanManageMembers(memberData.can_manage_members || false);
      }
    } catch (error) {
      console.error('셀러계정 정보 로드 오류:', error);
    }
  };

  const handleCheckProfileName = async () => {
    if (!profileName.trim()) {
      toast.error('프로필 이름을 입력해주세요.');
      return;
    }

    if (profileName.length > 10) {
      toast.error('프로필 이름은 최대 10자까지 입력 가능합니다.');
      return;
    }

    try {
      setCheckingProfileName(true);
      const response = await fetch('/api/user/check-profile-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_name: profileName.trim() }),
      });

      const data = await response.json();

      if (data.success && data.available) {
        setProfileNameCheckResult({
          checked: true,
          available: true,
          message: data.message,
        });
        toast.success(data.message);
      } else {
        setProfileNameCheckResult({
          checked: true,
          available: false,
          message: data.message || data.error,
        });
        toast.error(data.message || data.error);
      }
    } catch (error) {
      console.error('프로필 이름 확인 오류:', error);
      toast.error('프로필 이름 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingProfileName(false);
    }
  };

  const handleChange = (field: keyof SellerInfo, value: string) => {
    // 전화번호 필드인 경우 포맷팅 적용 (010-0000-0000)
    if (field === 'phone' || field === 'representative_phone' || field === 'manager_phone' || field === 'store_phone') {
      const numbers = value.replace(/[^\d]/g, ''); // 숫자만 추출
      let formatted = numbers;

      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }

      setSellerInfo(prev => ({ ...prev, [field]: formatted }));
    }
    // 사업자등록번호 필드인 경우 포맷팅 적용 (000-00-00000)
    else if (field === 'business_number') {
      const numbers = value.replace(/[^\d]/g, ''); // 숫자만 추출
      let formatted = numbers;

      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 5) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
      }

      setSellerInfo(prev => ({ ...prev, [field]: formatted }));
    }
    else {
      setSellerInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    // 프로필 이름이 변경되었는지 확인
    const profileNameChanged = profileName.trim() !== originalProfileName;

    // 프로필 이름이 변경되었는데 중복 확인을 하지 않은 경우
    if (profileNameChanged && profileName.trim() && !profileNameCheckResult) {
      toast.error('프로필 이름 중복 확인이 필요합니다.');
      return;
    }

    // 프로필 이름이 중복 확인 결과 사용 불가능한 경우
    if (profileNameChanged && profileName.trim() && profileNameCheckResult && !profileNameCheckResult.available) {
      toast.error('사용할 수 없는 프로필 이름입니다.');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_name: profileName.trim(),
          name: sellerInfo.name,
          phone: sellerInfo.phone,
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
          depositor_name: sellerInfo.depositor_name,
          store_name: sellerInfo.store_name,
          store_phone: sellerInfo.store_phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ 저장되었습니다!');
        toast.success('프로필이 저장되었습니다.');
        setOriginalProfileName(profileName.trim()); // 저장 후 원래 프로필 이름 업데이트
        setProfileNameCheckResult(null); // 저장 후 중복 확인 결과 초기화
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ ' + (data.error || '저장에 실패했습니다.'));
        toast.error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setMessage('❌ 저장 중 오류가 발생했습니다.');
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
      paddingTop: '70px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* 헤더 */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '8px',
              color: '#212529'
            }}>회원정보 설정</h1>
            <p style={{
              fontSize: '14px',
              color: '#6c757d',
              margin: 0
            }}>기본정보 및 셀러계정 설정을 관리하세요</p>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: saving
                ? '#adb5bd'
                : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
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
        ) : (
          <>
            {/* 메시지 */}
            {message && (
              <div style={{
                padding: '12px 16px',
                background: message.includes('✅') ? '#d1e7dd' : '#f8d7da',
                color: message.includes('✅') ? '#0f5132' : '#842029',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                {message}
              </div>
            )}

            {/* 프로필 이름 설정 섹션 */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '24px',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '24px',
                color: '#212529'
              }}>기본정보</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px'
              }}>
                {/* 이메일 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>이메일</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#f8f9fa',
                      color: '#6c757d'
                    }}
                  />
                </div>

                {/* 이름 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>이름</label>
                  <input
                    type="text"
                    value={sellerInfo.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  />
                </div>

                {/* 전화번호 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>전화번호</label>
                  <input
                    type="tel"
                    value={sellerInfo.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  />
                </div>

                {/* 프로필 이름 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>프로필 이름</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => {
                        setProfileName(e.target.value);
                        setProfileNameCheckResult(null); // 프로필 이름 변경 시 확인 결과 초기화
                      }}
                      placeholder="프로필 이름을 입력하세요"
                      maxLength={10}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        paddingRight: '80px',
                        border: `1px solid ${
                          profileNameCheckResult
                            ? (profileNameCheckResult.available ? '#10b981' : '#ef4444')
                            : '#dee2e6'
                        }`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border 0.2s'
                      }}
                      onFocus={(e) => {
                        if (!profileNameCheckResult) {
                          e.target.style.borderColor = '#3b82f6';
                        }
                      }}
                      onBlur={(e) => {
                        if (!profileNameCheckResult) {
                          e.target.style.borderColor = '#dee2e6';
                        }
                      }}
                    />
                    <button
                      onClick={handleCheckProfileName}
                      disabled={checkingProfileName || !profileName.trim()}
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '6px 12px',
                        background: checkingProfileName || !profileName.trim() ? '#adb5bd' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: checkingProfileName || !profileName.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!checkingProfileName && profileName.trim()) {
                          e.currentTarget.style.background = '#2563eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!checkingProfileName && profileName.trim()) {
                          e.currentTarget.style.background = '#3b82f6';
                        }
                      }}
                    >
                      {checkingProfileName ? '확인 중...' : '중복확인'}
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '6px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: profileNameCheckResult
                        ? (profileNameCheckResult.available ? '#10b981' : '#ef4444')
                        : '#6c757d'
                    }}>
                      {profileNameCheckResult
                        ? (profileNameCheckResult.available ? '✓ ' : '✗ ') + profileNameCheckResult.message
                        : (profileName.trim() !== originalProfileName && profileName.trim()
                          ? '프로필 이름 중복 확인이 필요합니다'
                          : '')}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d'
                    }}>
                      {profileName.length}/10자
                    </div>
                  </div>
                </div>
              </div>

              {/* 안내 메시지 */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#6c757d',
                lineHeight: '1.6'
              }}>
                프로필이름은 랭킹 프로필, 셀러피드 게시글과 댓글에 표시됩니다. 기본값으로 이메일 @앞부분이 표시됩니다. 최대 10자까지 설정가능합니다.
              </div>
            </div>

            {/* 판매자 정보 섹션 */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '24px',
                color: '#212529'
              }}>셀러계정 설정</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
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
                        }}>이메일 (계산서)</label>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <input
                            type="checkbox"
                            id="sameAsEmail"
                            checked={isSameAsEmail}
                            onChange={(e) => {
                              setIsSameAsEmail(e.target.checked);
                              if (e.target.checked && sellerInfo.email) {
                                setSellerInfo(prev => ({ ...prev, business_email: prev.email }));
                              }
                            }}
                            style={{
                              width: '14px',
                              height: '14px',
                              cursor: 'pointer'
                            }}
                          />
                          <label
                            htmlFor="sameAsEmail"
                            style={{
                              fontSize: '11px',
                              color: '#6c757d',
                              cursor: 'pointer'
                            }}
                          >
                            기본 이메일과 동일
                          </label>
                        </div>
                      </div>
                      <input
                        type="email"
                        value={sellerInfo.business_email || ''}
                        onChange={(e) => handleChange('business_email', e.target.value)}
                        disabled={isSameAsEmail}
                        placeholder="example@company.com"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          fontSize: '13px',
                          outline: 'none',
                          background: isSameAsEmail ? '#f8f9fa' : 'white',
                          color: isSameAsEmail ? '#6c757d' : '#212529',
                          cursor: isSameAsEmail ? 'not-allowed' : 'text',
                          transition: 'border 0.2s'
                        }}
                        onFocus={(e) => !isSameAsEmail && (e.target.style.borderColor = '#3b82f6')}
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
                      }}>은행명</label>
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
                      }}>계좌번호</label>
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
                      }}>예금주</label>
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

            {/* 셀러계정 관리 섹션 */}
            {organization && user && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '32px',
                marginTop: '24px',
                boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '24px',
                  color: '#212529'
                }}>셀러계정 관리</h2>

                {/* 셀러계정 정보 헤더 */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  color: 'white'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '22px',
                        fontWeight: '700',
                        marginBottom: '12px'
                      }}>
                        {organization.name?.includes('의 조직')
                          ? organization.name.replace('의 조직', '님의 셀러계정')
                          : organization.name}
                      </h3>
                      <div style={{
                        fontSize: '13px',
                        opacity: 0.9,
                        lineHeight: '1.6'
                      }}>
                        {organization.business_number && (
                          <p>사업자번호: {organization.business_number}</p>
                        )}
                        {organization.representative_name && (
                          <p>대표자: {organization.representative_name}</p>
                        )}
                        {organization.address && <p>주소: {organization.address}</p>}
                        {organization.phone && <p>전화: {organization.phone}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 내 정보 */}
                {member && (
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '20px'
                    }}>
                      <div>
                        <p style={{
                          fontSize: '13px',
                          color: '#6c757d',
                          marginBottom: '6px'
                        }}>내 역할</p>
                        <p style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#212529'
                        }}>
                          {member.role === 'owner'
                            ? '소유자'
                            : member.role === 'admin'
                            ? '관리자'
                            : '일반 멤버'}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          fontSize: '13px',
                          color: '#6c757d',
                          marginBottom: '6px'
                        }}>가입일</p>
                        <p style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#212529'
                        }}>
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleDateString('ko-KR')
                            : '-'}
                        </p>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <p style={{
                          fontSize: '13px',
                          color: '#6c757d',
                          marginBottom: '8px'
                        }}>권한</p>
                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}>
                          {member.can_manage_orders && (
                            <span style={{
                              display: 'inline-block',
                              background: '#d1f2eb',
                              color: '#0c5132',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              주문관리
                            </span>
                          )}
                          {member.can_manage_products && (
                            <span style={{
                              display: 'inline-block',
                              background: '#d1f2eb',
                              color: '#0c5132',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              상품관리
                            </span>
                          )}
                          {member.can_manage_members && (
                            <span style={{
                              display: 'inline-block',
                              background: '#e0cffc',
                              color: '#6f42c1',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              멤버관리
                            </span>
                          )}
                          {member.can_view_financials && (
                            <span style={{
                              display: 'inline-block',
                              background: '#cfe2ff',
                              color: '#084298',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              재무조회
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 멤버 초대 */}
                {canManageMembers && (
                  <div style={{ marginBottom: '24px' }}>
                    <InviteMember organizationId={organization.id} />
                  </div>
                )}

                {/* 셀러계정 멤버 목록 */}
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <OrganizationMembers
                    organizationId={organization.id}
                    currentUserId={user.id}
                    canManageMembers={canManageMembers}
                  />
                </div>

                {/* 발송된 초대 목록 */}
                {canManageMembers && (
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px'
                  }}>
                    <InvitationsList organizationId={organization.id} />
                  </div>
                )}

                {/* 안내 */}
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '13px',
                  color: '#6c757d',
                  lineHeight: '1.8'
                }}>
                  <h4 style={{
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: '#495057'
                  }}>셀러계정 시스템 안내</h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    listStyle: 'disc'
                  }}>
                    <li>같은 셀러계정의 모든 멤버는 주문, 발주서 등의 데이터를 공유합니다</li>
                    <li>소유자와 관리자는 멤버를 초대하고 관리할 수 있습니다</li>
                    <li>각 멤버별로 세부 권한을 설정할 수 있습니다</li>
                    <li>캐시와 크레딧은 셀러계정 단위로 관리됩니다</li>
                    <li>멤버가 등록한 주문은 자동으로 셀러계정에 연결되어 모든 멤버가 조회 가능합니다</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
