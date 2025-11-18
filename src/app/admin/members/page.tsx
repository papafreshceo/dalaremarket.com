'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, UserPlus, ChevronUp, ChevronDown } from 'lucide-react';

interface Member {
  // 멤버 식별자
  member_id: string; // organization_members.id
  organization_id: string;

  // 사용자 정보
  id: string;
  email: string;
  name: string | null;
  profile_name: string | null;
  phone: string | null;
  user_role: string; // 회원구분 (super_admin, admin, employee, seller, partner)
  created_at: string;
  updated_at: string | null;
  last_login_provider: string | null;

  // 조직 내 역할
  org_role: string; // owner, member
  org_status: string; // active, invited, suspended

  // 조직 정보
  business_name: string | null;
  business_number: string | null;
  business_address: string | null;
  business_email: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  depositor_name: string | null;
  store_name: string | null;
  store_phone: string | null;
  tier: string | null;
  seller_code: string | null;

  // 조직 잔액
  cash_balance: number;
  credit_balance: number;

  [key: string]: any;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 20;

  // 크레딧 지급 모달 상태
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);

  // 캐시 지급 모달 상태
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashDescription, setCashDescription] = useState('');
  const [cashLoading, setCashLoading] = useState(false);
  const [cashHistory, setCashHistory] = useState<any[]>([]);
  const [showCashHistory, setShowCashHistory] = useState(false);
  const [cashHistoryLoading, setCashHistoryLoading] = useState(false);

  // 크레딧 내역 상태
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [showCreditHistory, setShowCreditHistory] = useState(false);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);

  useEffect(() => {
    loadMembers();
    loadOrganizations();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/members');
      const data = await response.json();

      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('회원 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('조직 목록 로드 오류:', error);
        return;
      }

      setOrganizations(data || []);
    } catch (error) {
      console.error('조직 목록 로드 오류:', error);
    }
  };

  const handleImpersonate = async (memberId: string, memberEmail: string) => {
    try {
      // 임시 토큰 생성
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // 새 창에서 platform/orders 열기
        const url = `/platform/orders?impersonate_token=${data.token}`;
        window.open(url, '_blank', 'width=1920,height=1080');
      } else {
        alert('회원 전환에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원 전환 오류:', error);
      alert('회원 전환 중 오류가 발생했습니다.');
    }
  };

  const handleSetTier = async (memberId: string, tier: string | null) => {
    try {
      const confirmMessage = tier
        ? `등급을 ${tier.toUpperCase()}로 수동 설정하시겠습니까?\n\n수동 설정된 등급은 자동 계산에 영향받지 않습니다.`
        : '수동 설정을 해제하고 자동 등급 계산으로 전환하시겠습니까?';

      if (!confirm(confirmMessage)) {
        return;
      }

      const response = await fetch(`/api/admin/users/${memberId}/tier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        loadMembers(); // 목록 새로고침
      } else {
        alert(data.error || '등급 설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('등급 설정 오류:', error);
      alert('등급 설정 중 오류가 발생했습니다.');
    }
  };

  const handleGrantCredit = async () => {
    if (!selectedMember || !creditAmount) {
      alert('크레딧 금액을 입력해주세요.');
      return;
    }

    if (!creditDescription || creditDescription.trim() === '') {
      alert('지급 사유를 입력해주세요.');
      return;
    }

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('유효한 크레딧 금액을 입력해주세요.');
      return;
    }

    try {
      setCreditLoading(true);

      const response = await fetch(`/api/admin/users/${selectedMember.id}/credits`, {
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
        setShowCreditModal(false);
        setCreditAmount('');
        setCreditDescription('');
        setSelectedMember(null);
        loadMembers(); // 목록 새로고침
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

  const openCreditModal = (member: Member) => {
    setSelectedMember(member);
    setShowCreditModal(true);
  };

  const handleGrantCash = async () => {
    if (!selectedMember || !cashAmount) {
      alert('캐시 금액을 입력해주세요.');
      return;
    }

    if (!cashDescription || cashDescription.trim() === '') {
      alert('지급 사유를 입력해주세요.');
      return;
    }

    const amount = parseInt(cashAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('유효한 캐시 금액을 입력해주세요.');
      return;
    }

    try {
      setCashLoading(true);

      const response = await fetch(`/api/admin/users/${selectedMember.id}/cash`, {
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
        setShowCashModal(false);
        setCashAmount('');
        setCashDescription('');
        setSelectedMember(null);
        loadMembers(); // 목록 새로고침
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

  const openCashModal = async (member: Member) => {
    setSelectedMember(member);
    setShowCashModal(true);
    setShowCashHistory(false);
    // 내역 로드
    await loadCashHistory(member.id);
  };

  const loadCashHistory = async (userId: string) => {
    try {
      setCashHistoryLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/cash/history`);
      const data = await response.json();

      if (data.success) {
        setCashHistory(data.history || []);
      }
    } catch (error) {
      console.error('캐시 내역 조회 오류:', error);
    } finally {
      setCashHistoryLoading(false);
    }
  };

  const handleRevokeCash = async (historyId: string) => {
    if (!confirm('이 캐시 지급을 회수하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/cash/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        if (selectedMember) {
          await loadCashHistory(selectedMember.id);
          loadMembers();
        }
      } else {
        alert(data.error || '캐시 회수에 실패했습니다.');
      }
    } catch (error) {
      console.error('캐시 회수 오류:', error);
      alert('캐시 회수 중 오류가 발생했습니다.');
    }
  };

  const loadCreditHistory = async (userId: string) => {
    setCreditHistoryLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits/history`);
      const data = await response.json();

      if (data.success) {
        setCreditHistory(data.history);
      }
    } catch (error) {
      console.error('크레딧 내역 로드 오류:', error);
    } finally {
      setCreditHistoryLoading(false);
    }
  };

  const handleRevokeCredit = async (historyId: string) => {
    if (!confirm('이 크레딧 지급을 회수하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/credits/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        if (selectedMember) {
          await loadCreditHistory(selectedMember.id);
          loadMembers();
        }
      } else {
        alert(data.error || '크레딧 회수에 실패했습니다.');
      }
    } catch (error) {
      console.error('크레딧 회수 오류:', error);
      alert('크레딧 회수 중 오류가 발생했습니다.');
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 조직별로 그룹핑 (organization_id 기준으로 owner만 표시)
  const organizationMembers = new Map<string, Member>();
  members.forEach(member => {
    // 조직별로 첫 번째 멤버만 또는 owner만 저장
    if (!organizationMembers.has(member.organization_id)) {
      organizationMembers.set(member.organization_id, member);
    } else if (member.org_role === 'owner') {
      // owner가 있으면 owner로 교체
      organizationMembers.set(member.organization_id, member);
    }
  });

  const uniqueOrganizations = Array.from(organizationMembers.values());

  // 필터링 적용
  const filteredOrgs = uniqueOrganizations.filter(member => {
    const matchesSearch =
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profile_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.business_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.business_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.business_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.account_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.account_holder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.representative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.representative_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.manager_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.store_phone?.toLowerCase().includes(searchTerm.toLowerCase());

    // 역할 필터 로직 (회원구분 기준)
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'super_admin' && member.user_role === 'super_admin') ||
      (roleFilter === 'admin' && member.user_role === 'admin') ||
      (roleFilter === 'employee' && member.user_role === 'employee') ||
      (roleFilter === 'seller' && !['super_admin', 'admin', 'employee'].includes(member.user_role));

    // 티어 필터 로직
    const matchesTier =
      tierFilter === 'all' ||
      (tierFilter === 'none' && !member.tier && !['super_admin', 'admin', 'employee'].includes(member.user_role)) ||
      (member.tier?.toUpperCase() === tierFilter && !['super_admin', 'admin', 'employee'].includes(member.user_role));

    return matchesSearch && matchesRole && matchesTier;
  });

  // 정렬 적용
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any = a[sortField as keyof Member];
    let bValue: any = b[sortField as keyof Member];

    // null/undefined 처리
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // 숫자 비교
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // 문자열 비교
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (aStr < bStr) return sortOrder === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedOrgs.length / itemsPerPage);
  const paginatedMembers = sortedOrgs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp size={16} style={{ display: 'inline', marginLeft: '4px' }} />
    ) : (
      <ChevronDown size={16} style={{ display: 'inline', marginLeft: '4px' }} />
    );
  };

  const getUserRoleBadge = (userRole: string) => {
    const roleConfig: Record<string, { bg: string; text: string; label: string }> = {
      super_admin: { bg: '#7c3aed', text: '#ffffff', label: '최고관리자' },
      admin: { bg: '#dc2626', text: '#ffffff', label: '관리자' },
      employee: { bg: '#f59e0b', text: '#ffffff', label: '직원' },
      seller: { bg: '#10b981', text: '#ffffff', label: '셀러' },
      partner: { bg: '#3b82f6', text: '#ffffff', label: '파트너' },
    };

    const config = roleConfig[userRole] || { bg: '#10b981', text: '#ffffff', label: '셀러' };

    return (
      <span style={{
        padding: '4px 12px',
        background: config.bg,
        color: config.text,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {config.label}
      </span>
    );
  };

  const getOrgRoleBadge = (orgRole: string) => {
    const roleConfig: Record<string, { bg: string; text: string; label: string }> = {
      owner: { bg: '#8b5cf6', text: '#ffffff', label: '소유자' },
      member: { bg: '#6b7280', text: '#ffffff', label: '담당자' },
    };

    const config = roleConfig[orgRole] || { bg: '#6b7280', text: '#ffffff', label: '담당자' };

    return (
      <span style={{
        padding: '4px 12px',
        background: config.bg,
        color: config.text,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {config.label}
      </span>
    );
  };

  const getProviderBadge = (provider: string | null) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      email: { bg: '#6b7280', text: '#ffffff', label: '이메일' },
      kakao: { bg: '#FEE500', text: '#000000', label: '카카오' },
      naver: { bg: '#03C75A', text: '#ffffff', label: '네이버' },
      google: { bg: '#4285F4', text: '#ffffff', label: '구글' },
    };
    const style = styles[provider || 'email'] || { bg: '#6b7280', text: '#ffffff', label: provider || '이메일' };

    return (
      <span style={{
        padding: '4px 12px',
        background: style.bg,
        color: style.text,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {style.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            회원 관리
          </h1>
          <p style={{ fontSize: '14px', color: '#6c757d' }}>
            전체 회원 정보를 조회하고 관리합니다
          </p>
        </div>
      </div>

      {/* 역할별 통계 카드 + 검색 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          {[
            { label: '전체', value: 'all', count: members.length },
            { label: '최고관리자', value: 'super_admin', count: members.filter(m => m.user_role === 'super_admin').length },
            { label: '관리자', value: 'admin', count: members.filter(m => m.user_role === 'admin').length },
            { label: '직원', value: 'employee', count: members.filter(m => m.user_role === 'employee').length },
            { label: '판매자', value: 'seller', count: members.filter(m => !['super_admin', 'admin', 'employee'].includes(m.user_role)).length },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setRoleFilter(item.value)}
              style={{
                background: roleFilter === item.value ? '#3b82f6' : 'white',
                color: roleFilter === item.value ? '#ffffff' : '#111827',
                border: `1px solid ${roleFilter === item.value ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '11px', opacity: 0.7 }}>{item.label}</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{item.count}</div>
            </button>
          ))}
        </div>

        {/* 검색 입력란 */}
        <div style={{ position: 'relative', width: '400px' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}
            size={20}
          />
          <input
            type="text"
            placeholder="이름, 이메일, 프로필명, 회사명, 연락처 등 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* 티어별 통계 카드 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px'
      }}>
        {[
          { label: '전체', value: 'all', count: members.filter(m => !['super_admin', 'admin', 'employee'].includes(m.user_role)).length },
          { label: 'LEGEND', value: 'LEGEND', count: members.filter(m => m.tier?.toUpperCase() === 'LEGEND' && !['super_admin', 'admin', 'employee'].includes(m.user_role)).length },
          { label: 'ELITE', value: 'ELITE', count: members.filter(m => m.tier?.toUpperCase() === 'ELITE' && !['super_admin', 'admin', 'employee'].includes(m.user_role)).length },
          { label: 'ADVANCE', value: 'ADVANCE', count: members.filter(m => m.tier?.toUpperCase() === 'ADVANCE' && !['super_admin', 'admin', 'employee'].includes(m.user_role)).length },
          { label: 'STANDARD', value: 'STANDARD', count: members.filter(m => m.tier?.toUpperCase() === 'STANDARD' && !['super_admin', 'admin', 'employee'].includes(m.user_role)).length },
          { label: 'LIGHT', value: 'LIGHT', count: members.filter(m => m.tier?.toUpperCase() === 'LIGHT' && !['super_admin', 'admin', 'employee'].includes(m.user_role)).length },
          { label: '티어없음', value: 'none', count: members.filter(m => !m.tier && !['super_admin', 'admin', 'employee'].includes(m.user_role)).length },
        ].map(item => (
          <button
            key={item.value}
            onClick={() => setTierFilter(item.value)}
            style={{
              background: tierFilter === item.value ? '#10b981' : 'white',
              color: tierFilter === item.value ? '#ffffff' : '#111827',
              border: `1px solid ${tierFilter === item.value ? '#10b981' : '#e5e7eb'}`,
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '11px', opacity: 0.7 }}>{item.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{item.count}</div>
          </button>
        ))}
      </div>

      {/* 회원 목록 테이블 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d' }}>
          로딩 중...
        </div>
      ) : (
        <>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'auto',
            border: '1px solid #dee2e6'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '60px' }}>연번</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '80px' }}>
                    전환
                  </th>
                  <th onClick={() => handleSort('seller_code')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    셀러코드{getSortIcon('seller_code')}
                  </th>
                  <th onClick={() => handleSort('business_name')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}>
                    셀러계정(사업자명){getSortIcon('business_name')}
                  </th>
                  <th onClick={() => handleSort('email')} style={{ padding: '8px', textAlign: 'left', fontWeight: '600', minWidth: '200px', cursor: 'pointer', userSelect: 'none' }}>
                    이메일{getSortIcon('email')}
                  </th>
                  <th onClick={() => handleSort('name')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    이름{getSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('profile_name')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    프로필명{getSortIcon('profile_name')}
                  </th>
                  <th onClick={() => handleSort('business_number')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    사업자번호{getSortIcon('business_number')}
                  </th>
                  <th onClick={() => handleSort('phone')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    연락처{getSortIcon('phone')}
                  </th>
                  <th onClick={() => handleSort('business_address')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}>
                    사업자주소{getSortIcon('business_address')}
                  </th>
                  <th onClick={() => handleSort('org_role')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    역할{getSortIcon('org_role')}
                  </th>
                  <th onClick={() => handleSort('tier')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '220px', cursor: 'pointer', userSelect: 'none' }}>
                    등급설정{getSortIcon('tier')}
                  </th>
                  <th onClick={() => handleSort('user_role')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    회원구분{getSortIcon('user_role')}
                  </th>
                  <th onClick={() => handleSort('last_login_provider')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    가입유형{getSortIcon('last_login_provider')}
                  </th>
                  <th onClick={() => handleSort('cash_balance')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '70px', cursor: 'pointer', userSelect: 'none' }}>
                    캐시{getSortIcon('cash_balance')}
                  </th>
                  <th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '70px' }}>
                    캐시 지급
                  </th>
                  <th onClick={() => handleSort('credit_balance')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '70px', cursor: 'pointer', userSelect: 'none' }}>
                    크레딧{getSortIcon('credit_balance')}
                  </th>
                  <th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '70px' }}>
                    크레딧 지급
                  </th>
                  <th onClick={() => handleSort('bank_name')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    은행명{getSortIcon('bank_name')}
                  </th>
                  <th onClick={() => handleSort('account_number')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    계좌번호{getSortIcon('account_number')}
                  </th>
                  <th onClick={() => handleSort('account_holder')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    예금주{getSortIcon('account_holder')}
                  </th>
                  <th onClick={() => handleSort('business_email')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}>
                    사업자이메일{getSortIcon('business_email')}
                  </th>
                  <th onClick={() => handleSort('representative_name')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    대표자명{getSortIcon('representative_name')}
                  </th>
                  <th onClick={() => handleSort('representative_phone')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    대표전화{getSortIcon('representative_phone')}
                  </th>
                  <th onClick={() => handleSort('manager_name')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    담당자명{getSortIcon('manager_name')}
                  </th>
                  <th onClick={() => handleSort('manager_phone')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    담당자전화{getSortIcon('manager_phone')}
                  </th>
                  <th onClick={() => handleSort('store_name')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    매장명{getSortIcon('store_name')}
                  </th>
                  <th onClick={() => handleSort('store_phone')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    매장전화{getSortIcon('store_phone')}
                  </th>
                  <th onClick={() => handleSort('created_at')} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    가입일{getSortIcon('created_at')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={29} style={{ padding: '60px', textAlign: 'center', color: '#6c757d' }}>
                      검색 결과가 없습니다
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member, index) => {
                    return (
                    <tr key={member.member_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleImpersonate(member.id, member.email)}
                          style={{
                            padding: '4px 8px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3b82f6';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          전환
                        </button>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.seller_code || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.business_name || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>{member.email}</span>
                          {(() => {
                            const createdDate = new Date(member.created_at);
                            const now = new Date();
                            const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                            return diffDays <= 7 ? (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                color: '#ef4444',
                                background: '#fee2e2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #fecaca'
                              }}>
                                NEW
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.name || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.profile_name || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.business_number || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.phone || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.business_address || '-'}>
                          {member.business_address || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        {getOrgRoleBadge(member.org_role)}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          {/* 현재 등급 아이콘 */}
                          {member.tier && (
                            <div style={{
                              width: '24px',
                              height: '24px',
                              color: (() => {
                                const tierColors: Record<string, string> = {
                                  'light': '#7BE9FF',
                                  'standard': '#4BB3FF',
                                  'advance': '#B05CFF',
                                  'elite': '#24E3A8',
                                  'legend': '#FFD447'
                                };
                                return tierColors[member.tier.toLowerCase()] || '#6b7280';
                              })()
                            }}>
                              {(() => {
                                const tier = member.tier.toLowerCase();
                                if (tier === 'light') return (
                                  <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                                    <path d="M12 2 C9 6 6 9 6 13 C6 16.5 8.5 20 12 20 C15.5 20 18 16.5 18 13 C18 9 15 6 12 2 Z" fill="currentColor" opacity="0.9"/>
                                    <ellipse cx="10" cy="10" rx="2" ry="3" fill="currentColor" opacity="0.3"/>
                                  </svg>
                                );
                                if (tier === 'standard') return (
                                  <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                                    <path d="M12 2 L5 6 L5 12 C5 16.5 8 20 12 22 C16 20 19 16.5 19 12 L19 6 Z" fill="currentColor" opacity="0.9"/>
                                    <path d="M12 4 L7 7 L7 12 C7 15.5 9.5 18.5 12 20 C14.5 18.5 17 15.5 17 12 L17 7 Z" fill="currentColor" opacity="0.4"/>
                                  </svg>
                                );
                                if (tier === 'advance') return (
                                  <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                                    <path d="M12 2C12 2 9 6 9 10v7l3 3 3-3v-7C15 6 12 2 12 2z" fill="currentColor"/>
                                    <path d="M9 12L6 14v4l3-2v-4z" fill="currentColor" opacity="0.7"/>
                                    <path d="M15 12l3 2v4l-3-2v-4z" fill="currentColor" opacity="0.7"/>
                                    <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.3"/>
                                    <path d="M10 20l-1 2 1-1.5z" fill="currentColor" opacity="0.5"/>
                                    <path d="M12 20v3l0-2z" fill="currentColor" opacity="0.6"/>
                                    <path d="M14 20l1 2-1-1.5z" fill="currentColor" opacity="0.5"/>
                                  </svg>
                                );
                                if (tier === 'elite') return (
                                  <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                                    <path d="M12 2l2.5 5.5 6 .9-4.3 4.2 1 6-5.2-3-5.2 3 1-6-4.3-4.2 6-.9L12 2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                  </svg>
                                );
                                if (tier === 'legend') return (
                                  <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                                    <path d="M4 16h16v2H4v-2z" fill="currentColor" opacity="0.9"/>
                                    <path d="M5 8l2.5 3 2-4.5 2.5 4.5 2.5-4.5 2 4.5 2.5-3v8H5v-8z" fill="currentColor"/>
                                    <circle cx="12" cy="6.5" r="1.5" fill="currentColor" opacity="0.4"/>
                                    <circle cx="8" cy="9" r="1" fill="currentColor" opacity="0.4"/>
                                    <circle cx="16" cy="9" r="1" fill="currentColor" opacity="0.4"/>
                                    <path d="M7 7l.5-1.5L8 7z" fill="currentColor" opacity="0.8"/>
                                    <path d="M11.5 4l.5-2 .5 2z" fill="currentColor" opacity="0.8"/>
                                    <path d="M16 7l.5-1.5L17 7z" fill="currentColor" opacity="0.8"/>
                                  </svg>
                                );
                                return null;
                              })()}
                            </div>
                          )}

                          {/* 등급 설정 드롭다운 */}
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                            <select
                              value={member.tier?.toLowerCase() || ''}
                              onChange={(e) => handleSetTier(member.id, e.target.value || null)}
                              style={{
                                padding: '6px 8px',
                                border: member.manual_tier ? '2px solid #f59e0b' : '1px solid #dee2e6',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: member.manual_tier ? '700' : '500',
                                background: member.manual_tier ? '#fffbeb' : 'white',
                                cursor: 'pointer',
                                color: member.manual_tier ? '#f59e0b' : '#111827',
                              }}
                            >
                              <option value="">자동</option>
                              <option value="light">LIGHT</option>
                              <option value="standard">STANDARD</option>
                              <option value="advance">ADVANCE</option>
                              <option value="elite">ELITE</option>
                              <option value="legend">LEGEND</option>
                            </select>
                            {member.manual_tier && (
                              <span style={{
                                fontSize: '10px',
                                color: '#f59e0b',
                                fontWeight: '600',
                                background: '#fef3c7',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                              }}>
                                수동
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        {getUserRoleBadge(member.user_role)}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        {getProviderBadge(member.last_login_provider)}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>{member.cash_balance?.toLocaleString() || '0'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <button
                            onClick={() => openCashModal(member)}
                            style={{
                              padding: '4px 8px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            지급
                          </button>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#8b5cf6' }}>{member.credit_balance?.toLocaleString() || '0'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <button
                            onClick={() => openCreditModal(member)}
                            style={{
                              padding: '4px 8px',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            지급
                          </button>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.bank_name || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.account_number || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.account_holder || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.business_email || '-'}>
                          {member.business_email || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.representative_name || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.representative_phone || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.manager_name || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.manager_phone || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.store_name || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.store_phone || '-'}</div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '14px' }}>
                        {formatDate(member.created_at)}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  background: currentPage === 1 ? '#f8f9fa' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                이전
              </button>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  background: currentPage === totalPages ? '#f8f9fa' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* 조직 현황 테이블 */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
          조직 현황 ({organizations.length}개)
        </h2>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'auto',
          border: '1px solid #dee2e6'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '60px' }}>No</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '150px' }}>사업자명</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>사업자번호</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '200px' }}>사업자주소</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '150px' }}>사업자이메일</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>대표자명</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>대표전화</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>담당자명</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>담당자전화</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>은행명</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '150px' }}>계좌번호</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>예금주</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>입금자명</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>매장명</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>매장전화</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>등급</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>셀러코드</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>파트너코드</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>생성일</th>
              </tr>
            </thead>
            <tbody>
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={19} style={{ padding: '60px', textAlign: 'center', color: '#6c757d' }}>
                    조직이 없습니다
                  </td>
                </tr>
              ) : (
                organizations.map((org, index) => (
                  <tr key={org.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{index + 1}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.business_name || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.business_number || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>{org.business_address || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.business_email || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.representative_name || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.representative_phone || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.manager_name || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.manager_phone || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.bank_name || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.bank_account || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.account_holder || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.depositor_name || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.store_name || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.store_phone || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.tier || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.seller_code || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{org.partner_code || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>{formatDate(org.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 크레딧 지급 모달 */}
      {showCreditModal && selectedMember && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: showCreditHistory ? '800px' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            transition: 'width 0.3s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                크레딧 지급
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setShowCreditHistory(!showCreditHistory);
                    if (!showCreditHistory && selectedMember) {
                      loadCreditHistory(selectedMember.id);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  {showCreditHistory ? '지급 폼 보기' : '내역 보기'}
                </button>
                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    setSelectedMember(null);
                    setShowCreditHistory(false);
                    setCreditAmount('');
                    setCreditDescription('');
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    color: '#6b7280',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    fontWeight: '700',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>대상 회원</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{selectedMember.email}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                현재 크레딧: <span style={{ fontWeight: '600', color: '#8b5cf6' }}>{selectedMember.credit_balance?.toLocaleString() || '0'}</span>
              </div>
            </div>

            {!showCreditHistory ? (
              <>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                지급할 크레딧 *
              </label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="지급할 크레딧 금액"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                지급 사유 *
              </label>
              <textarea
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                placeholder="지급 사유를 입력하세요 (필수)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setCreditAmount('');
                  setCreditDescription('');
                  setSelectedMember(null);
                }}
                disabled={creditLoading}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: creditLoading ? 'not-allowed' : 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleGrantCredit}
                disabled={creditLoading || !creditAmount || !creditDescription.trim()}
                style={{
                  padding: '10px 20px',
                  background: creditLoading || !creditAmount || !creditDescription.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: creditLoading || !creditAmount || !creditDescription.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {creditLoading ? '처리 중...' : '지급하기'}
              </button>
            </div>
              </>
            ) : (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>크레딧 지급 내역</h3>
                {creditHistoryLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    로딩 중...
                  </div>
                ) : creditHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    지급 내역이 없습니다
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {creditHistory.map((item) => (
                      <div key={item.id} style={{
                        padding: '16px',
                        marginBottom: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        background: item.transaction_type === 'grant' ? '#faf5ff' : '#fef2f2'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: item.transaction_type === 'grant' ? '#8b5cf6' : '#ef4444' }}>
                              {item.transaction_type === 'grant' ? '지급' : '회수'}: {Math.abs(item.amount).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              {new Date(item.created_at).toLocaleString('ko-KR')}
                            </div>
                          </div>
                          {item.transaction_type === 'grant' && !item.is_revoked && (
                            <button
                              onClick={() => handleRevokeCredit(item.id)}
                              style={{
                                padding: '4px 12px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              회수
                            </button>
                          )}
                          {item.transaction_type === 'grant' && item.is_revoked && (
                            <span style={{
                              padding: '4px 12px',
                              background: '#e5e7eb',
                              color: '#6b7280',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              회수됨
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                          {item.description}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          잔액: {item.balance_before.toLocaleString()} → {item.balance_after.toLocaleString()}
                          {item.admin?.email && ` | 처리자: ${item.admin.email}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 캐시 지급 모달 */}
      {showCashModal && selectedMember && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: showCashHistory ? '800px' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            transition: 'width 0.3s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                캐시 지급
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setShowCashHistory(!showCashHistory)}
                  style={{
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  {showCashHistory ? '지급 폼 보기' : '내역 보기'}
                </button>
                <button
                  onClick={() => {
                    setShowCashModal(false);
                    setSelectedMember(null);
                    setShowCashHistory(false);
                    setCashAmount('');
                    setCashDescription('');
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    color: '#6b7280',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    fontWeight: '700',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>대상 회원</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{selectedMember.email}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                현재 캐시: <span style={{ fontWeight: '600', color: '#10b981' }}>{selectedMember.cash_balance?.toLocaleString() || '0'}원</span>
              </div>
            </div>

            {!showCashHistory ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    지급할 캐시 *
                  </label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="지급할 캐시 금액 (원)"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    지급 사유 *
                  </label>
                  <textarea
                    value={cashDescription}
                    onChange={(e) => setCashDescription(e.target.value)}
                    placeholder="지급 사유를 입력하세요 (필수)"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowCashModal(false);
                      setCashAmount('');
                      setCashDescription('');
                      setSelectedMember(null);
                    }}
                    disabled={cashLoading}
                    style={{
                      padding: '10px 20px',
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: cashLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleGrantCash}
                    disabled={cashLoading || !cashAmount || !cashDescription.trim()}
                    style={{
                      padding: '10px 20px',
                      background: cashLoading || !cashAmount || !cashDescription.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: cashLoading || !cashAmount || !cashDescription.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {cashLoading ? '처리 중...' : '지급하기'}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>캐시 지급 내역</h3>
                {cashHistoryLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    로딩 중...
                  </div>
                ) : cashHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    지급 내역이 없습니다
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {cashHistory.map((item) => (
                      <div key={item.id} style={{
                        padding: '16px',
                        marginBottom: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        background: item.transaction_type === 'grant' ? '#f0fdf4' : '#fef2f2'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: item.transaction_type === 'grant' ? '#10b981' : '#ef4444' }}>
                              {item.transaction_type === 'grant' ? '지급' : '회수'}: {Math.abs(item.amount).toLocaleString()}원
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              {new Date(item.created_at).toLocaleString('ko-KR')}
                            </div>
                          </div>
                          {item.transaction_type === 'grant' && !item.is_revoked && (
                            <button
                              onClick={() => handleRevokeCash(item.id)}
                              style={{
                                padding: '4px 12px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              회수
                            </button>
                          )}
                          {item.transaction_type === 'grant' && item.is_revoked && (
                            <span style={{
                              padding: '4px 12px',
                              background: '#e5e7eb',
                              color: '#6b7280',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              회수됨
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                          {item.description}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          잔액: {item.balance_before.toLocaleString()}원 → {item.balance_after.toLocaleString()}원
                          {item.admin?.email && ` | 처리자: ${item.admin.email}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
