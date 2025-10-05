'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, approved')
          .eq('id', data.user.id)
          .single()

        if (!userData?.approved) {
          await supabase.auth.signOut()
          setError('계정이 아직 승인되지 않았습니다.')
          setLoading(false)
          return
        }

        onClose()
        showToast('로그인되었습니다.', 'success')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            name,
            phone,
            role: 'customer',
            approved: true,
          })

        if (profileError) {
          setError('프로필 생성 중 오류가 발생했습니다.')
          setLoading(false)
          return
        }

        showToast('회원가입이 완료되었습니다. 로그인해주세요.', 'success')
        setMode('login')
        setLoading(false)
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const handleNameChange = (value: string) => {
    const koreanOnly = value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')
    setName(koreanOnly)
  }

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 4) {
      setPhone(numbers)
    } else if (numbers.length <= 8) {
      setPhone(`${numbers.slice(0, 4)}-${numbers.slice(4)}`)
    } else {
      setPhone(`${numbers.slice(0, 4)}-${numbers.slice(4, 8)}`)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'relative',
        width: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9ca3af',
            lineHeight: 1
          }}
        >
          ×
        </button>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '32px',
          textAlign: 'center',
          color: '#212529'
        }}>{mode === 'login' ? '로그인' : '회원가입'}</h2>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
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

          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="이름 (한글만)"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
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
                  placeholder="0000-0000"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
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
            </>
          )}

          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid transparent',
              background: '#f8f9fa',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: mode === 'register' ? '12px' : '24px',
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

          {mode === 'register' && (
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
          )}

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
              marginBottom: '24px',
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
            {loading ? (mode === 'login' ? '로그인 중...' : '처리 중...') : (mode === 'login' ? '이메일로 로그인' : '회원가입')}
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
              }}>{mode === 'login' ? '간편 로그인' : '간편 가입'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button type="button" style={{
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
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                구글로 {mode === 'login' ? '로그인' : '가입하기'}
              </button>

              <button type="button" style={{
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
                카카오로 {mode === 'login' ? '로그인' : '가입하기'}
              </button>

              <button type="button" style={{
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
                네이버로 {mode === 'login' ? '로그인' : '가입하기'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {mode === 'login' ? (
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                아직 계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                >
                  회원가입
                </button>
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                >
                  로그인
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
