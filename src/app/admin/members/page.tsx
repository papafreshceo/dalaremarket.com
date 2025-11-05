'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, UserPlus, ChevronUp, ChevronDown } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  name: string | null;
  profile_name: string | null;
  business_name: string | null;
  business_number: string | null;
  role: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string | null;
  last_login: string | null;
  tier: string | null;
  last_login_provider: string | null; // 로그인 제공자
  // 정산 관련 필드
  settlement_cycle: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  memo: string | null;
  discount_rate: number | null; // 티어별 할인율
  // 포인트/캐시
  cash_balance: number;
  credit_balance: number;
  // 사업자 정보
  company_address: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  tax_invoice_email: string | null;
  [key: string]: any; // 기타 필드
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 20;

  useEffect(() => {
    loadMembers();
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profile_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.business_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.account_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.account_holder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.representative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.representative_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.manager_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.tax_invoice_email?.toLowerCase().includes(searchTerm.toLowerCase());

    // 역할 필터 로직
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'super_admin' && member.role === 'super_admin') ||
      (roleFilter === 'admin' && member.role === 'admin') ||
      (roleFilter === 'employee' && member.role === 'employee') ||
      (roleFilter === 'seller' && !['super_admin', 'admin', 'employee'].includes(member.role));

    // 티어 필터 로직
    const matchesTier =
      tierFilter === 'all' ||
      (tierFilter === 'none' && !member.tier) ||
      member.tier === tierFilter;

    return matchesSearch && matchesRole && matchesTier;
  });

  // 정렬 적용
  const sortedMembers = [...filteredMembers].sort((a, b) => {
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

  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const paginatedMembers = sortedMembers.slice(
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

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { bg: string; text: string; label: string }> = {
      super_admin: { bg: '#7c3aed', text: '#ffffff', label: '최고관리자' },
      admin: { bg: '#dc2626', text: '#ffffff', label: '관리자' },
      employee: { bg: '#f59e0b', text: '#ffffff', label: '직원' },
    };

    // 내부 역할이 아니면 모두 판매자로 표시
    const config = roleConfig[role] || { bg: '#10b981', text: '#ffffff', label: '판매자' };

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
    <div>
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
            { label: '최고관리자', value: 'super_admin', count: members.filter(m => m.role === 'super_admin').length },
            { label: '관리자', value: 'admin', count: members.filter(m => m.role === 'admin').length },
            { label: '직원', value: 'employee', count: members.filter(m => m.role === 'employee').length },
            { label: '판매자', value: 'seller', count: members.filter(m => !['super_admin', 'admin', 'employee'].includes(m.role)).length },
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
          { label: '전체', value: 'all', count: members.filter(m => !['super_admin', 'admin', 'employee'].includes(m.role)).length },
          { label: 'LEGEND', value: 'LEGEND', count: members.filter(m => m.tier === 'LEGEND').length },
          { label: 'ELITE', value: 'ELITE', count: members.filter(m => m.tier === 'ELITE').length },
          { label: 'ADVANCE', value: 'ADVANCE', count: members.filter(m => m.tier === 'ADVANCE').length },
          { label: 'STANDARD', value: 'STANDARD', count: members.filter(m => m.tier === 'STANDARD').length },
          { label: 'LIGHT', value: 'LIGHT', count: members.filter(m => m.tier === 'LIGHT').length },
          { label: '티어없음', value: 'none', count: members.filter(m => !m.tier && !['super_admin', 'admin', 'employee'].includes(m.role)).length },
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
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '60px' }}>연번</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '80px' }}>
                    전환
                  </th>
                  <th onClick={() => handleSort('email')} style={{ padding: '8px', textAlign: 'left', fontWeight: '600', minWidth: '200px', cursor: 'pointer', userSelect: 'none' }}>
                    이메일{getSortIcon('email')}
                  </th>
                  <th onClick={() => handleSort('name')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    이름{getSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('profile_name')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    프로필명{getSortIcon('profile_name')}
                  </th>
                  <th onClick={() => handleSort('business_name')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    회사명{getSortIcon('business_name')}
                  </th>
                  <th onClick={() => handleSort('business_number')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    사업자번호{getSortIcon('business_number')}
                  </th>
                  <th onClick={() => handleSort('phone')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    연락처{getSortIcon('phone')}
                  </th>
                  <th onClick={() => handleSort('address')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}>
                    주소{getSortIcon('address')}
                  </th>
                  <th onClick={() => handleSort('tier')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '80px', cursor: 'pointer', userSelect: 'none' }}>
                    등급{getSortIcon('tier')}
                  </th>
                  <th onClick={() => handleSort('role')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    역할{getSortIcon('role')}
                  </th>
                  <th onClick={() => handleSort('last_login_provider')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    가입유형{getSortIcon('last_login_provider')}
                  </th>
                  <th onClick={() => handleSort('discount_rate')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    할인율{getSortIcon('discount_rate')}
                  </th>
                  <th onClick={() => handleSort('cash_balance')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    캐시{getSortIcon('cash_balance')}
                  </th>
                  <th onClick={() => handleSort('credit_balance')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    크레딧{getSortIcon('credit_balance')}
                  </th>
                  <th onClick={() => handleSort('bank_name')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    은행명{getSortIcon('bank_name')}
                  </th>
                  <th onClick={() => handleSort('account_number')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    계좌번호{getSortIcon('account_number')}
                  </th>
                  <th onClick={() => handleSort('account_holder')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    예금주{getSortIcon('account_holder')}
                  </th>
                  <th onClick={() => handleSort('company_address')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}>
                    회사주소{getSortIcon('company_address')}
                  </th>
                  <th onClick={() => handleSort('representative_name')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    대표자명{getSortIcon('representative_name')}
                  </th>
                  <th onClick={() => handleSort('representative_phone')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    대표전화{getSortIcon('representative_phone')}
                  </th>
                  <th onClick={() => handleSort('manager_name')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    담당자명{getSortIcon('manager_name')}
                  </th>
                  <th onClick={() => handleSort('manager_phone')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '120px', cursor: 'pointer', userSelect: 'none' }}>
                    담당자전화{getSortIcon('manager_phone')}
                  </th>
                  <th onClick={() => handleSort('tax_invoice_email')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}>
                    전자계산서이메일{getSortIcon('tax_invoice_email')}
                  </th>
                  <th onClick={() => handleSort('memo')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '200px', cursor: 'pointer', userSelect: 'none' }}>
                    메모{getSortIcon('memo')}
                  </th>
                  <th onClick={() => handleSort('created_at')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    가입일{getSortIcon('created_at')}
                  </th>
                  <th onClick={() => handleSort('last_login')} style={{ padding: '8px', textAlign: 'center', fontWeight: '600', minWidth: '100px', cursor: 'pointer', userSelect: 'none' }}>
                    최근 로그인{getSortIcon('last_login')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={27} style={{ padding: '60px', textAlign: 'center', color: '#6c757d' }}>
                      검색 결과가 없습니다
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member, index) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleImpersonate(member.id, member.email)}
                          style={{
                            padding: '6px 12px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
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
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.email}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.name || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.profile_name || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.business_name || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.business_number || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.phone || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.address || '-'}>
                          {member.address || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.tier || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {getRoleBadge(member.role)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {getProviderBadge(member.last_login_provider)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.discount_rate ? `${member.discount_rate}%` : '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>{member.cash_balance?.toLocaleString() || '0'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>{member.credit_balance?.toLocaleString() || '0'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.bank_name || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.account_number || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.account_holder || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.company_address || '-'}>
                          {member.company_address || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.representative_name || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.representative_phone || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.manager_name || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.manager_phone || '-'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.tax_invoice_email || '-'}>
                          {member.tax_invoice_email || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.memo || '-'}>
                          {member.memo || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>
                        {formatDate(member.created_at)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>
                        {formatDate(member.last_login)}
                      </td>
                    </tr>
                  ))
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
    </div>
  );
}
