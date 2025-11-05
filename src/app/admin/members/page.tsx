'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, UserPlus } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
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

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadge = (role: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      admin: { bg: '#dc2626', text: '#ffffff' },
      customer: { bg: '#3b82f6', text: '#ffffff' },
      seller: { bg: '#10b981', text: '#ffffff' },
    };
    const style = styles[role] || { bg: '#6b7280', text: '#ffffff' };

    const labels: Record<string, string> = {
      admin: '관리자',
      customer: '일반회원',
      seller: '판매자',
    };

    return (
      <span style={{
        padding: '4px 12px',
        background: style.bg,
        color: style.text,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {labels[role] || role}
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

      {/* 통계 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>전체 회원</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{members.length}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>관리자</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>
            {members.filter(m => m.role === 'admin').length}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>일반회원</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>
            {members.filter(m => m.role === 'customer').length}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>판매자</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>
            {members.filter(m => m.role === 'seller').length}
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
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
            placeholder="이름, 이메일, 프로필명, 회사명, 연락처, 사업자번호, 은행, 계좌, 예금주, 대표자, 담당자 등 검색..."
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
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #dee2e6',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            minWidth: '150px'
          }}
        >
          <option value="all">전체 역할</option>
          <option value="admin">관리자</option>
          <option value="customer">일반회원</option>
          <option value="seller">판매자</option>
        </select>
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
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', minWidth: '200px' }}>이메일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>이름</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>프로필명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>회사명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>사업자번호</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>연락처</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '150px' }}>주소</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '80px' }}>등급</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '80px' }}>역할</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>가입유형</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>할인율</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>캐시</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>크레딧</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>정산주기</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>은행명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>계좌번호</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>예금주</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '150px' }}>회사주소</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>대표자명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>대표전화</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>담당자명</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '120px' }}>담당자전화</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '150px' }}>전자계산서이메일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '200px' }}>메모</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>가입일</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', minWidth: '100px' }}>최근 로그인</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={26} style={{ padding: '60px', textAlign: 'center', color: '#6c757d' }}>
                      검색 결과가 없습니다
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.email}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{member.id.substring(0, 8)}...</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.name || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.profile_name || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.business_name || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.business_number || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.phone || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.address || '-'}>
                          {member.address || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.tier || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {getRoleBadge(member.role)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {getProviderBadge(member.last_login_provider)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.discount_rate ? `${member.discount_rate}%` : '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>{member.cash_balance?.toLocaleString() || '0'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>{member.credit_balance?.toLocaleString() || '0'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.settlement_cycle || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.bank_name || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.account_number || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.account_holder || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.company_address || '-'}>
                          {member.company_address || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.representative_name || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.representative_phone || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.manager_name || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{member.manager_phone || '-'}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.tax_invoice_email || '-'}>
                          {member.tax_invoice_email || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.memo || '-'}>
                          {member.memo || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                        {formatDate(member.created_at)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>
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
