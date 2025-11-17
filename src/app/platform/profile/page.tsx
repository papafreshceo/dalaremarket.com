'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast, { Toaster } from 'react-hot-toast';
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

  // 송장출력 정보
  store_name?: string;
  store_phone?: string;
}

export default function ProfilePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [savingSellerAccount, setSavingSellerAccount] = useState(false);
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

  // 추가 셀러계정 state
  const [additionalAccounts, setAdditionalAccounts] = useState<any[]>([]);
  const [savingSubAccounts, setSavingSubAccounts] = useState<Record<string, boolean>>({});

  // 회원탈퇴 state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  /**
   * ============================================================
   * 서브계정 추가 한도 설정
   * ============================================================
   *
   * 계정 구조:
   * - 메인 셀러계정 1개 (organizations 테이블)
   * - 메인 서브계정 1개 (sub_accounts, is_main=true) - DB에만 존재, UI에 표시 안함
   * - 추가 서브계정 N개 (sub_accounts, is_main=false) - 사용자가 추가 가능
   *
   * maxAccounts = 메인 셀러계정(1) + 추가 서브계정 최대 개수
   * 예: maxAccounts = 3 → 메인 1개 + 추가 서브계정 2개까지 가능
   */
  const getMaxAccountsByTier = (tier: string | null | undefined) => {
    // 티어 없으면 기본값 3개 (메인 1 + 서브 2)
    if (!tier) return 3;

    const lowerTier = tier.toLowerCase();
    switch (lowerTier) {
      case 'light':
        return 3; // 메인 1 + 서브 2개
      case 'standard':
        return 3; // 메인 1 + 서브 2개
      case 'advance':
        return 3; // 메인 1 + 서브 2개
      case 'elite':
        return 3; // 메인 1 + 서브 2개
      case 'legend':
        return 3; // 메인 1 + 서브 2개
      default:
        return 3;
    }
  };

  // 현재 보유 가능한 최대 계정 수
  const maxAccounts = useMemo(() => {
    return organization ? getMaxAccountsByTier(organization.tier) : 1;
  }, [organization]);

  // 현재 보유 중인 계정 수 = 메인 셀러계정(1) + 추가 서브계정 개수
  // additionalAccounts는 is_main=false인 서브계정만 포함 (API에서 필터링됨)
  const currentAccountCount = 1 + additionalAccounts.length;

  // 계정 추가 가능 여부 = 소유자 && 현재 개수 < 최대 개수
  const canAddAccount = isOwner && currentAccountCount < maxAccounts;

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const initializeData = async () => {
      await loadUserProfile();  // 먼저 실행
      await loadOrganizationInfo();  // 그 다음 실행 (덮어쓰지 않도록)
      await loadSubAccounts();
    };
    initializeData();
  }, []);

  // 사업자명과 동일 체크박스가 체크되어 있으면 사업자명을 스토어명에 자동 반영
  useEffect(() => {
    if (isSameAsBusinessName && sellerInfo.business_name) {
      setSellerInfo(prev => ({ ...prev, store_name: prev.business_name }));
    }
  }, [isSameAsBusinessName, sellerInfo.business_name]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      console.log('🔍 프로필 API 응답:', data);

      if (data.success) {
        console.log('👤 User 데이터:', {
          id: data.user.id,
          email: data.user.email,
          primary_organization_id: data.user.primary_organization_id,
          business_name: data.user.business_name,
        });
        setUser(data.user);
        // 프로필 이름이 없으면 이메일 앞부분을 기본값으로 설정
        const defaultProfileName = data.user.profile_name || data.user.email?.split('@')[0] || '';
        setProfileName(defaultProfileName);
        setOriginalProfileName(data.user.profile_name || ''); // 원래 프로필 이름 저장

        // 기본 정보만 로드 (셀러계정 정보는 loadOrganizationInfo에서 가져옴)
        const loadedInfo = {
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          profile_name: data.user.profile_name || '',
        };

        console.log('📝 sellerInfo 기본정보 설정:', loadedInfo);
        setSellerInfo(prev => ({ ...prev, ...loadedInfo }));
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

      // 사용자 role 확인
      const { data: userData } = await supabase
        .from('users')
        .select('primary_organization_id, role')
        .eq('id', authUser.id)
        .single();

      console.log('🏢 Organization 로드 - userData:', userData);

      if (!userData?.primary_organization_id) {
        console.warn('⚠️ primary_organization_id 없음');
        return;
      }

      console.log('🔍 Organization ID:', userData.primary_organization_id);

      // Organization 정보 가져오기
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          owner_id,
          is_active,
          seller_code,
          partner_code,
          business_name,
          business_number,
          business_address,
          business_email,
          representative_name,
          representative_phone,
          manager_name,
          manager_phone,
          bank_account,
          bank_name,
          account_holder,
          store_name,
          store_phone,
          tier,
          created_at,
          updated_at
        `)
        .eq('id', userData.primary_organization_id)
        .single();

      if (orgError) {
        console.error('Organization 로드 오류:', orgError);
        console.error('Error details:', JSON.stringify(orgError, null, 2));
        return;
      }

      if (orgData) {
        console.log('Organization owner_id:', orgData.owner_id);

        // organization에서 owner 정보 가져오기
        // business_name만 사용 (없으면 null)
        const ownerData = {
          seller_code: orgData.seller_code || null,
          business_name: orgData.business_name || null
        };
        console.log('Organization에서 owner 정보 사용:', ownerData);

        // organization 객체에 owner 정보 추가
        const orgWithOwner = {
          ...orgData,
          owner: ownerData
        };

        console.log('최종 Organization 데이터:', orgWithOwner);
        setOrganization(orgWithOwner);
        setIsOwner(orgData.owner_id === authUser.id);

        // 셀러계정 정보 업데이트 (모든 조직 멤버가 조회 가능)
        console.log('📝 셀러계정 정보 로드:', {
          business_name: orgData.business_name,
          is_owner: orgData.owner_id === authUser.id
        });

        setSellerInfo(prev => ({
          ...prev,
          business_name: orgData.business_name || '',
          business_address: orgData.business_address || '',
          business_number: orgData.business_number || '',
          business_email: orgData.business_email || '',
          representative_name: orgData.representative_name || '',
          representative_phone: orgData.representative_phone || '',
          manager_name: orgData.manager_name || '',
          manager_phone: orgData.manager_phone || '',
          bank_account: orgData.bank_account || '',
          bank_name: orgData.bank_name || '',
          account_holder: orgData.account_holder || '',
          store_name: orgData.store_name || '',
          store_phone: orgData.store_phone || '',
        }));

        // 체크박스 상태 설정
        setIsSameAsBusinessName(!orgData.store_name || orgData.store_name === orgData.business_name);
      } else {
        console.warn('Organization 데이터가 없습니다');
      }

      // Member 정보 가져오기 (탈퇴한 소유자는 멤버 레코드가 없을 수 있음)
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', userData.primary_organization_id)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (memberData) {
        setMember(memberData);
        setCanManageMembers(memberData.can_manage_members || false);
      } else if (orgData?.owner_id === authUser.id) {
        // 소유자인 경우 멤버 레코드가 없어도 관리 권한 부여
        setCanManageMembers(true);
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
    console.log('📝 handleChange 호출:', { field, value, currentValue: sellerInfo[field] });

    // 전화번호 필드인 경우 포맷팅 적용 (010-0000-0000)
    if (field === 'phone' || field === 'representative_phone' || field === 'manager_phone' || field === 'store_phone') {
      // 전각 숫자를 반각 숫자로 변환 후 숫자만 추출
      const halfWidth = value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      const numbers = halfWidth.replace(/[^\d]/g, '');
      let formatted = numbers;

      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }

      console.log('📞 전화번호 포맷팅:', { numbers, formatted, currentValue: sellerInfo[field] });

      // 값이 실제로 변경되었을 때만 업데이트
      if (formatted !== sellerInfo[field]) {
        setSellerInfo(prev => ({ ...prev, [field]: formatted }));
      }
    }
    // 사업자등록번호 필드인 경우 포맷팅 적용 (000-00-00000)
    else if (field === 'business_number') {
      // 전각 숫자를 반각 숫자로 변환 후 숫자만 추출
      const halfWidth = value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      const numbers = halfWidth.replace(/[^\d]/g, '');
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

  // 기본정보 저장
  const handleSaveBasicInfo = async () => {
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
      setSavingBasicInfo(true);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_name: profileName.trim(),
          name: sellerInfo.name,
          phone: sellerInfo.phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('기본정보가 저장되었습니다.');
        setOriginalProfileName(profileName.trim());
        setProfileNameCheckResult(null);
      } else {
        toast.error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingBasicInfo(false);
    }
  };

  // 셀러계정 정보 저장 (메인 계정)
  const handleSaveSellerAccount = async () => {
    try {
      setSavingSellerAccount(true);

      console.log('💾 셀러계정 정보 저장 시도:', {
        business_name: sellerInfo.business_name,
        business_address: sellerInfo.business_address,
        business_number: sellerInfo.business_number,
      });

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
          store_phone: sellerInfo.store_phone,
        }),
      });

      const data = await response.json();

      console.log('💾 저장 응답:', data);

      if (data.success) {
        toast.success('셀러계정 정보가 저장되었습니다.');
        // 저장 후 조직 정보 다시 로드
        await loadOrganizationInfo();
      } else {
        toast.error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingSellerAccount(false);
    }
  };

  // 서브 계정 목록 불러오기
  const loadSubAccounts = async () => {
    try {
      const response = await fetch('/api/organizations/sub');
      const data = await response.json();

      if (data.success && data.sub_organizations) {
        // 서브 계정 목록을 additionalAccounts에 설정
        const subAccounts = data.sub_organizations.map((org: any) => ({
          id: org.id,
          business_name: org.business_name || '',
          business_address: org.address || '',
          business_number: org.business_number || '',
          business_email: org.email || '',
          representative_name: org.representative_name || '',
          representative_phone: org.phone || '',
          bank_account: org.account_number || '',
          bank_name: org.bank_name || '',
          account_holder: org.account_holder || '',
          store_name: org.store_name || '',
          store_phone: org.store_phone || '',
        }));
        setAdditionalAccounts(subAccounts);
      }
    } catch (error) {
      console.error('서브 계정 목록 조회 오류:', error);
    }
  };

  // 회원 탈퇴 처리
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '회원탈퇴') {
      toast.error('"회원탈퇴"를 정확히 입력해주세요.');
      return;
    }

    setDeleting(true);
    try {
      // API 호출로 auth.users 삭제 (CASCADE로 모든 데이터 자동 삭제)
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('회원 탈퇴 API 오류:', data);
        const errorMsg = data.details ? `${data.error}\n상세: ${data.details}` : data.error;
        throw new Error(errorMsg || '회원 탈퇴 중 오류가 발생했습니다.');
      }

      toast.success('회원 탈퇴가 완료되었습니다.');

      // 로그아웃 처리
      await supabase.auth.signOut();
      localStorage.removeItem('ordersActiveTab');

      // 메인 페이지로 이동
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error: any) {
      console.error('회원 탈퇴 오류:', error);
      toast.error(error.message || '회원 탈퇴 중 오류가 발생했습니다.');
      setDeleting(false);
    }
  };

  // 서브 계정 저장
  const handleSaveSubAccount = async (account: any) => {
    console.log('🔄 서브 계정 저장 시작:', account);

    // 저장 중 상태 설정
    setSavingSubAccounts(prev => ({ ...prev, [account.id]: true }));

    try {
      // 필수 입력 확인
      if (!account.business_name) {
        toast.error('사업자명을 입력해주세요.');
        setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
        return;
      }
      if (!account.business_address) {
        toast.error('주소를 입력해주세요.');
        setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
        return;
      }
      if (!account.business_number) {
        toast.error('사업자등록번호를 입력해주세요.');
        setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
        return;
      }
      if (!account.business_email) {
        toast.error('이메일을 입력해주세요.');
        setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
        return;
      }
      if (!account.representative_name) {
        toast.error('대표자명을 입력해주세요.');
        setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
        return;
      }
      if (!account.bank_name) {
        toast.error('은행명을 입력해주세요.');
        setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
        return;
      }
      if (!account.bank_account) {
        toast.error('계좌번호를 입력해주세요.');
        setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
        return;
      }
      if (!account.account_holder) {
        toast.error('예금주를 입력해주세요.');
        setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
        return;
      }

      // 신규 생성인지 수정인지 구분 (임시 ID는 timestamp로 큰 숫자)
      const isNewAccount = typeof account.id === 'number' && account.id > 1000000000000;
      const method = isNewAccount ? 'POST' : 'PUT';

      console.log(`📤 API 요청 전송 중... (${isNewAccount ? '신규 생성' : '수정'})`);

      const requestBody = {
        business_name: account.business_name,
        business_number: account.business_number,
        address: account.business_address,
        email: account.business_email,
        representative_name: account.representative_name,
        phone: account.representative_phone,
        bank_name: account.bank_name,
        account_number: account.bank_account,
        account_holder: account.account_holder,
        store_name: account.store_name,
        store_phone: account.store_phone,
      };

      // 수정인 경우 ID 포함
      if (!isNewAccount) {
        requestBody.id = account.id;
      }

      const response = await fetch('/api/organizations/sub', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 API 응답 상태:', response.status);
      const data = await response.json();
      console.log('📥 API 응답 데이터:', data);

      if (data.success) {
        console.log('✅ 저장 성공!');
        toast.success(isNewAccount ? '서브 셀러계정이 생성되었습니다.' : '서브 셀러계정이 수정되었습니다.');

        // 서브 계정 목록 다시 불러오기
        await loadSubAccounts();
      } else {
        console.log('❌ 저장 실패:', data.error || data.message);
        toast.error(data.message || data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 서브 계정 저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      // 저장 완료 후 상태 해제
      setSavingSubAccounts(prev => ({ ...prev, [account.id]: false }));
    }
  };

  if (!isMounted) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
      paddingTop: '70px'
    }}>
      <Toaster position="top-center" />
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
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
        }}>
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
          }}>기본정보 및 셀러계정 정보를 관리하세요</p>
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#212529',
                  margin: 0
                }}>기본정보</h2>

                <button
                  onClick={handleSaveBasicInfo}
                  disabled={savingBasicInfo}
                  style={{
                    padding: '10px 20px',
                    background: savingBasicInfo
                      ? '#adb5bd'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: savingBasicInfo ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!savingBasicInfo) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {savingBasicInfo ? '저장 중...' : '저장'}
                </button>
              </div>

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
                    value={sellerInfo.phone || ''}
                    onChange={(e) => {
                      // IME 조합 중이 아닐 때만 처리
                      if (!(e.nativeEvent as any).isComposing) {
                        handleChange('phone', e.target.value);
                      }
                    }}
                    onCompositionEnd={(e) => {
                      // IME 입력 완료 시 처리
                      handleChange('phone', (e.target as HTMLInputElement).value);
                    }}
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
                  // 소유자: organization.business_name만 표시 (없으면 표시 안함)
                  // 담당자: organization.owner.business_name만 표시 (없으면 표시 안함)
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
                    // 소유자: organization.seller_code
                    // 담당자: organization.owner.seller_code
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
                  disabled={savingSellerAccount}
                  style={{
                    padding: '10px 20px',
                    background: savingSellerAccount
                      ? '#adb5bd'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: savingSellerAccount ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!savingSellerAccount) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {savingSellerAccount ? '저장 중...' : '저장'}
                </button>

                {/* 본인이 소유자이고 계정 추가 가능한 경우만 버튼 표시 */}
                {canAddAccount ? (
                  <button
                    onClick={() => {
                      // 새 셀러계정 추가 (테스트용 샘플 데이터)
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
                          background: 'white',
                          color: '#212529',
                          cursor: 'text',
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
                            {member.role === 'owner' ? '소유자' : '담당자'}
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

            {/* 추가된 셀러계정들 */}
            {additionalAccounts.map((account, index) => (
              <div key={account.id} style={{
                background: 'white',
                borderRadius: '20px',
                padding: '32px',
                marginTop: '24px',
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

                  <button
                    onClick={async () => {
                      // 삭제 확인
                      if (!window.confirm('⚠️ 경고\n\n이 서브계정을 완전히 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
                        return;
                      }

                      try {
                        // DB에 저장된 계정인지 확인 (id가 숫자가 아니면 임시 계정)
                        if (typeof account.id === 'string' || account.id > 1000000000000) {
                          // 임시 계정 (아직 저장 안됨) - state에서만 제거
                          setAdditionalAccounts(additionalAccounts.filter(acc => acc.id !== account.id));
                          toast.success('서브계정이 제거되었습니다.');
                        } else {
                          // DB에 저장된 계정 - API로 삭제
                          const response = await fetch(`/api/organizations/sub?id=${account.id}`, {
                            method: 'DELETE',
                          });

                          const data = await response.json();

                          if (data.success) {
                            toast.success('서브계정이 완전히 삭제되었습니다.');
                            // state에서도 제거
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
                  </div>

                  {/* 정산 정보 및 송장 출력 정보 */}
                  <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* 정산 계좌 */}
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#343a40',
                        marginBottom: '16px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #e9ecef'
                      }}>정산 계좌</h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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

                    {/* 송장 출력 정보 */}
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#343a40',
                        marginBottom: '16px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #e9ecef'
                      }}>송장 출력 정보</h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#495057',
                        marginBottom: '6px'
                      }}>업체명</label>
                      <input
                        type="text"
                        value={account.store_name || ''}
                        onChange={(e) => {
                          const updated = additionalAccounts.map(acc =>
                            acc.id === account.id ? { ...acc, store_name: e.target.value } : acc
                          );
                          setAdditionalAccounts(updated);
                        }}
                        placeholder="업체명"
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
                      }}>전화번호</label>
                      <input
                        type="tel"
                        value={account.store_phone || ''}
                        onChange={(e) => {
                          const numbers = e.target.value.replace(/[^\d]/g, '');
                          let formatted = numbers;
                          if (numbers.length <= 3) {
                            formatted = numbers;
                          } else if (numbers.length <= 7) {
                            formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
                          } else {
                            formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
                          }
                          const updated = additionalAccounts.map(acc =>
                            acc.id === account.id ? { ...acc, store_phone: formatted } : acc
                          );
                          setAdditionalAccounts(updated);
                        }}
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
              </div>
            ))}

            {/* 셀러계정 시스템 안내 */}
            {organization && user && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '32px',
                marginTop: '24px',
                boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
              }}>
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

            {/* 회원 탈퇴 섹션 */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: isMounted && window.innerWidth <= 768 ? '20px' : '32px',
              marginTop: '24px',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)',
              border: '2px solid #fee',
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#dc3545'
              }}>회원 탈퇴</h3>

              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13px',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#856404', display: 'block', marginBottom: '8px' }}>
                  ⚠️ 회원 탈퇴 시 주의사항
                </strong>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: '#856404'
                }}>
                  <li>조직 및 서브계정이 모두 삭제됩니다</li>
                  <li>캐시, 크레딧 등 모든 포인트가 삭제됩니다</li>
                  <li>멤버 정보 및 초대 내역이 삭제됩니다</li>
                  <li>알림 및 활동 이력이 삭제됩니다</li>
                  <li>주문 기록은 정산 목적으로 보존되며, 조직명만 기록에 남습니다</li>
                  <li><strong>이 작업은 되돌릴 수 없습니다</strong></li>
                </ul>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '12px 24px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#c82333'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dc3545'}
              >
                회원 탈퇴
              </button>
            </div>
          </>
        )}
      </div>

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div style={{
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
        }}
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#dc3545'
            }}>
              정말 탈퇴하시겠습니까?
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#6c757d',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              회원 탈퇴를 진행하시려면 아래 입력란에 <strong>"회원탈퇴"</strong>를 입력해주세요.
              <br />
              <strong style={{ color: '#dc3545' }}>이 작업은 되돌릴 수 없습니다.</strong>
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="회원탈퇴"
              disabled={deleting}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '20px',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#dc3545'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            />

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== '회원탈퇴'}
                style={{
                  padding: '10px 20px',
                  background: deleteConfirmText === '회원탈퇴' && !deleting ? '#dc3545' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: deleteConfirmText === '회원탈퇴' && !deleting ? 'pointer' : 'not-allowed',
                }}
              >
                {deleting ? '탈퇴 처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
