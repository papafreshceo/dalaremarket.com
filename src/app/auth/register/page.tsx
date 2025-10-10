'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviteData, setInviteData] = useState<{ email: string; role: string; token: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // 초대 토큰 확인
  useEffect(() => {
    const inviteToken = searchParams.get('invite')
    if (inviteToken) {
      verifyInvitation(inviteToken)
    }
  }, [searchParams])

  const verifyInvitation = async (token: string) => {
    const { data, error } = await supabase
      .from('invitations')
      .select('email, role, expires_at, used')
      .eq('token', token)
      .maybeSingle()

    if (error || !data) {
      setError('유효하지 않은 초대 링크입니다.')
      return
    }

    if (data.used) {
      setError('이미 사용된 초대 링크입니다.')
      return
    }

    if (new Date(data.expires_at) < new Date()) {
      setError('만료된 초대 링크입니다.')
      return
    }

    setInviteData({ email: data.email, role: data.role, token })
    setFormData(prev => ({ ...prev, email: data.email }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // 한글만 입력 (이름 필드)
    if (name === 'name') {
      const koreanOnly = value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')
      setFormData({ ...formData, [name]: koreanOnly })
      return
    }

    // 전화번호 포맷팅
    if (name === 'phone') {
      const numbers = value.replace(/[^\d]/g, '')
      if (numbers.length <= 4) {
        setFormData({ ...formData, [name]: numbers })
      } else if (numbers.length <= 8) {
        setFormData({ ...formData, [name]: `${numbers.slice(0, 4)}-${numbers.slice(4)}` })
      } else {
        setFormData({ ...formData, [name]: `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}` })
      }
      return
    }

    setFormData({ ...formData, [name]: value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    // 초대 링크로 가입 시 이메일 확인
    if (inviteData && formData.email !== inviteData.email) {
      setError('초대된 이메일 주소와 일치해야 합니다.')
      return
    }

    setLoading(true)

    try {
      // 1. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        // 2. users 테이블에 추가 정보 저장
        const roleToInsert = inviteData ? inviteData.role : 'seller';
        console.log('🔍 회원가입 - 설정될 role:', roleToInsert);
        console.log('🔍 inviteData:', inviteData);

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            role: roleToInsert, // 일반 회원가입 = 셀러
            approved: inviteData ? false : true, // 초대 링크는 승인 대기, 일반 셀러는 자동 승인
          })

        if (profileError) {
          console.error('Profile creation error:', JSON.stringify(profileError, null, 2))
          console.error('Error details:', profileError.message, profileError.code, profileError.details)
          setError('프로필 생성 중 오류가 발생했습니다.')
          setLoading(false)
          return
        }

        // 3. 초대 링크로 가입한 경우 초대 상태 업데이트
        if (inviteData) {
          await supabase
            .from('invitations')
            .update({ used: true, used_at: new Date().toISOString() })
            .eq('token', inviteData.token)
        }

        // 4. 성공 - 로그인 페이지로 이동
        if (inviteData) {
          alert('회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.')
        } else {
          alert('회원가입이 완료되었습니다. 로그인해주세요.')
        }
        router.push('/auth/login')
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        width: '400px',
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '8px',
          textAlign: 'center',
          color: '#212529'
        }}>
          {inviteData ? '관리자 계정 가입' : '회원가입'}
        </h2>

        {inviteData && (
          <div style={{
            padding: '12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
              <strong>{inviteData.email}</strong> 계정으로 초대되었습니다.<br />
              역할: <strong>{inviteData.role === 'admin' ? '관리자' : inviteData.role === 'employee' ? '직원' : '최고관리자'}</strong>
            </p>
          </div>
        )}

        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '24px'
        }}>
          이미 계정이 있으신가요?{' '}
          <Link
            href="/auth/login"
            style={{
              color: '#2563eb',
              fontWeight: '500',
              textDecoration: 'none'
            }}
          >
            로그인
          </Link>
        </p>

        <form onSubmit={handleRegister}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fee2e2',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <p style={{ fontSize: '14px', color: '#dc2626' }}>{error}</p>
            </div>
          )}

          <input
            type="text"
            name="name"
            placeholder="이름 (한글만)"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid transparent',
              background: '#f8f9fa',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: '12px',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2563eb'
              e.currentTarget.style.background = '#ffffff'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.background = '#f8f9fa'
            }}
          />

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <span style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              color: '#495057',
              fontWeight: '500',
              pointerEvents: 'none'
            }}>010</span>
            <input
              type="tel"
              name="phone"
              placeholder="0000-0000"
              value={formData.phone}
              onChange={handleChange}
              maxLength={9}
              style={{
                width: '100%',
                padding: '14px 16px 14px 46px',
                border: '2px solid transparent',
                background: '#f8f9fa',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.background = '#ffffff'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.background = '#f8f9fa'
              }}
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="이메일 - 계정 ID로 사용됨"
            value={formData.email}
            onChange={handleChange}
            disabled={!!inviteData}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid transparent',
              background: inviteData ? '#e5e7eb' : '#f8f9fa',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: '12px',
              outline: 'none',
              transition: 'all 0.3s',
              cursor: inviteData ? 'not-allowed' : 'text'
            }}
            onFocus={(e) => {
              if (!inviteData) {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.background = '#ffffff'
              }
            }}
            onBlur={(e) => {
              if (!inviteData) {
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.background = '#f8f9fa'
              }
            }}
          />

          <input
            type="password"
            name="password"
            placeholder="비밀번호 (6자 이상)"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid transparent',
              background: '#f8f9fa',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: '12px',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2563eb'
              e.currentTarget.style.background = '#ffffff'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.background = '#f8f9fa'
            }}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid transparent',
              background: '#f8f9fa',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: '24px',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2563eb'
              e.currentTarget.style.background = '#ffffff'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.background = '#f8f9fa'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                width: '100%',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #e0e0e0, transparent)'
              }}></div>
              <span style={{
                position: 'relative',
                background: 'white',
                padding: '0 16px',
                fontSize: '12px',
                color: '#9ca3af',
                fontWeight: '500'
              }}>간편 가입</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={{
                width: '100%',
                padding: '14px',
                background: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                구글로 가입하기
              </button>

              <button style={{
                width: '100%',
                padding: '14px',
                background: '#FEE500',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
                boxShadow: '0 2px 8px rgba(254, 229, 0, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                카카오로 가입하기
              </button>

              <button style={{
                width: '100%',
                padding: '14px',
                background: '#03C75A',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
                boxShadow: '0 2px 8px rgba(3, 199, 90, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                네이버로 가입하기
              </button>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {inviteData
              ? '회원가입 후 관리자 승인이 필요합니다.'
              : '회원가입 후 바로 로그인하실 수 있습니다.'
            }
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{ color: '#6b7280' }}>로딩 중...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
