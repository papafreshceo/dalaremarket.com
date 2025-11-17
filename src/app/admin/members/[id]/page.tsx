'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Mail, Phone, Building2, Calendar, Shield, CheckCircle, XCircle, Trash2 } from 'lucide-react'

interface MemberDetail {
  id: string
  email: string
  name: string
  phone: string
  role: string
  approved: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  primary_organization_id: string | null
  email_verified: boolean
  marketing_consent: boolean
  organization?: {
    id: string
    business_name: string
    representative_name: string
    role: string
  }
}

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMemberDetail()
  }, [memberId])

  const fetchMemberDetail = async () => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}`)
      const data = await response.json()

      if (data.success) {
        setMember(data.member)
      } else {
        setError(data.error || '회원 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      setError('회원 정보 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('이 회원을 승인하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      })

      const data = await response.json()
      if (data.success) {
        alert('승인되었습니다.')
        fetchMemberDetail()
      } else {
        alert(data.error || '승인 실패')
      }
    } catch (error) {
      alert('승인 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async () => {
    if (!confirm('이 회원을 거부하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false })
      })

      const data = await response.json()
      if (data.success) {
        alert('거부되었습니다.')
        fetchMemberDetail()
      } else {
        alert(data.error || '거부 실패')
      }
    } catch (error) {
      alert('거부 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        alert('삭제되었습니다.')
        router.push('/admin/members')
      } else {
        alert(data.error || '삭제 실패')
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px' }}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            marginBottom: '24px'
          }}
        >
          <ArrowLeft size={16} />
          뒤로가기
        </button>
        <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>
          {error || '회원을 찾을 수 없습니다.'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={16} />
          뒤로가기
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              회원 상세 정보
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              회원 ID: {member.id}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {!member.approved && (
              <button
                onClick={handleApprove}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                승인
              </button>
            )}
            {/* {member.approved && (
              <button
                onClick={handleReject}
                style={{
                  padding: '8px 16px',
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                승인 취소
              </button>
            )}
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={14} />
              삭제
            </button> */}
          </div>
        </div>
      </div>

      {/* 상태 배지 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <span style={{
          padding: '4px 12px',
          background: member.approved ? '#d1fae5' : '#fee2e2',
          color: member.approved ? '#065f46' : '#991b1b',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {member.approved ? '승인됨' : '미승인'}
        </span>
        <span style={{
          padding: '4px 12px',
          background: member.is_deleted ? '#fee2e2' : '#dbeafe',
          color: member.is_deleted ? '#991b1b' : '#1e40af',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {member.is_deleted ? '탈퇴' : '활성'}
        </span>
        {member.email_verified && (
          <span style={{
            padding: '4px 12px',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            이메일 인증됨
          </span>
        )}
      </div>

      {/* 기본 정보 */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '16px'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          기본 정보
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <User size={16} color="#6b7280" />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>이름</span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>{member.name}</p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Mail size={16} color="#6b7280" />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>이메일</span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>{member.email}</p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Phone size={16} color="#6b7280" />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>전화번호</span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>{member.phone || '-'}</p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Shield size={16} color="#6b7280" />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>권한</span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>
              {member.role === 'super_admin' && '최고관리자'}
              {member.role === 'admin' && '관리자'}
              {member.role === 'employee' && '직원'}
              {member.role === 'seller' && '판매자'}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Calendar size={16} color="#6b7280" />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>가입일</span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>
              {new Date(member.created_at).toLocaleString('ko-KR')}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Calendar size={16} color="#6b7280" />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>최종 수정</span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>
              {new Date(member.updated_at).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>
      </div>

      {/* 조직 정보 */}
      {member.organization && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            소속 조직
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Building2 size={16} color="#6b7280" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>상호명</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>{member.organization.business_name}</p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <User size={16} color="#6b7280" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>대표자명</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>{member.organization.representative_name}</p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Shield size={16} color="#6b7280" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>조직 내 역할</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {member.organization.role === 'owner' ? '소유자' : '멤버'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          추가 정보
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {member.email_verified ? (
              <CheckCircle size={16} color="#10b981" />
            ) : (
              <XCircle size={16} color="#ef4444" />
            )}
            <span style={{ fontSize: '13px' }}>
              이메일 인증: {member.email_verified ? '완료' : '미완료'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {member.marketing_consent ? (
              <CheckCircle size={16} color="#10b981" />
            ) : (
              <XCircle size={16} color="#6b7280" />
            )}
            <span style={{ fontSize: '13px' }}>
              마케팅 수신 동의: {member.marketing_consent ? '동의' : '미동의'}
            </span>
          </div>

          {member.deleted_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={16} color="#ef4444" />
              <span style={{ fontSize: '13px' }}>
                탈퇴일: {new Date(member.deleted_at).toLocaleString('ko-KR')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
