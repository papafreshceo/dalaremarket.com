'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'findId' | 'resetPassword'
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'findId' | 'resetPassword'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [foundEmail, setFoundEmail] = useState<string | null>(null)
  const [sendingSms, setSendingSms] = useState(false)
  const [verifyingSms, setVerifyingSms] = useState(false)
  const [smsCode, setSmsCode] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const [smsVerified, setSmsVerified] = useState(false)
  const [smsCountdown, setSmsCountdown] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  // initialMode가 변경될 때 mode 업데이트
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  // SMS 카운트다운 타이머
  useEffect(() => {
    if (smsCountdown > 0) {
      const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [smsCountdown])

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

  const handleNameChange = (value: string) => {
    const koreanOnly = value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')
    setName(koreanOnly)
  }

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) {
      setPhone(numbers)
    } else if (numbers.length <= 7) {
      setPhone(`${numbers.slice(0, 3)}-${numbers.slice(3)}`)
    } else {
      setPhone(`${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`)
    }

    // 전화번호 변경 시 인증 상태 초기화
    setSmsSent(false)
    setSmsVerified(false)
    setSmsCode('')
  }

  // SMS 인증번호 발송 (아이디 찾기용)
  const handleSendSms = async () => {
    if (!phone.trim()) {
      setError('전화번호를 입력해주세요.')
      return
    }

    const phoneNumbers = phone.replace(/[^\d]/g, '')
    if (phoneNumbers.length !== 11) {
      setError('올바른 전화번호를 입력해주세요.')
      return
    }

    setSendingSms(true)
    setError(null)

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'SMS 발송에 실패했습니다.')
        setSendingSms(false)
        return
      }

      setSmsSent(true)
      setSmsCountdown(180) // 3분
      showToast('인증번호가 발송되었습니다.', 'success')
      setSendingSms(false)
    } catch (err) {
      console.error('SMS send error:', err)
      setError('SMS 발송 중 오류가 발생했습니다.')
      setSendingSms(false)
    }
  }

  // SMS 인증번호 확인 (아이디 찾기용)
  const handleVerifySms = async () => {
    if (!smsCode.trim()) {
      setError('인증번호를 입력해주세요.')
      return
    }

    setVerifyingSms(true)
    setError(null)

    try {
      const response = await fetch('/api/sms/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '인증번호가 일치하지 않습니다.')
        setVerifyingSms(false)
        return
      }

      setSmsVerified(true)
      showToast('전화번호 인증이 완료되었습니다.', 'success')
      setVerifyingSms(false)
    } catch (err) {
      console.error('SMS verify error:', err)
      setError('인증번호 확인 중 오류가 발생했습니다.')
      setVerifyingSms(false)
    }
  }

  // 아이디 찾기
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setFoundEmail(null)

    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!phone.trim()) {
      setError('전화번호를 입력해주세요.')
      return
    }

    const phoneNumbers = phone.replace(/[^\d]/g, '')
    if (phoneNumbers.length !== 11) {
      setError('올바른 전화번호를 입력해주세요. (11자리)')
      return
    }

    if (!smsVerified) {
      setError('전화번호 인증을 완료해주세요.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('name', name)
        .eq('phone', phone)
        .single()

      if (error || !data) {
        setError('일치하는 계정을 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      setFoundEmail(data.email)
      setSuccess('아이디를 찾았습니다!')
      setLoading(false)
    } catch (err) {
      console.error('Find ID error:', err)
      setError('아이디 찾기 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  // 비밀번호 재설정
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError('비밀번호 재설정 이메일 발송에 실패했습니다.')
        setLoading(false)
        return
      }

      setSuccess('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.')
      setLoading(false)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('비밀번호 재설정 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  // 네이버 로그인
  const handleNaverLogin = () => {
    const state = Math.random().toString(36).substring(7)
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_NAVER_CALLBACK_URL || 'http://localhost:3002/auth/callback/naver')
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&auth_type=reprompt`

    window.location.href = naverAuthUrl
  }

  // 소셜 로그인
  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(`${provider} 로그인에 실패했습니다.`)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Social login error:', err)
      setError('소셜 로그인 중 오류가 발생했습니다.')
      setLoading(false)
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
      <div
        className="relative w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '40px',
          position: 'relative'
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
              color: '#9ca3af',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
              width: '24px',
              height: '24px'
            }}
          >
            ×
          </button>

          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {mode === 'login' ? '로그인' : mode === 'findId' ? '아이디 찾기' : '비밀번호 찾기'}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {mode === 'login' ? '달래마켓에 오신 것을 환영합니다' : mode === 'findId' ? '가입하신 정보로 아이디를 찾아드립니다' : '등록된 이메일로 비밀번호 재설정 링크를 보내드립니다'}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c00',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              background: '#efe',
              border: '1px solid #cfc',
              borderRadius: '8px',
              color: '#060',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              {success}
            </div>
          )}

          {foundEmail && (
            <div style={{
              padding: '16px',
              background: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '13px',
                color: '#1e40af',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                찾은 아이디
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e3a8a'
              }}>
                {foundEmail}
              </div>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : mode === 'findId' ? handleFindId : handleResetPassword}>
            {/* 이메일 입력 (로그인, 비밀번호 재설정) */}
            {(mode === 'login' || mode === 'resetPassword') && (
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid transparent',
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
            )}

            {/* 비밀번호 입력 (로그인만) */}
            {mode === 'login' && (
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid transparent',
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

            {/* 아이디 찾기 입력 필드 */}
            {mode === 'findId' && (
              <>
                <input
                  type="text"
                  placeholder="이름 (한글만 입력)"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid transparent',
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

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="tel"
                      placeholder="전화번호 (010-0000-0000)"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                      disabled={smsVerified}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        border: '1px solid transparent',
                        background: smsVerified ? '#e5e7eb' : '#f8f9fa',
                        borderRadius: '12px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s'
                      }}
                      onFocus={(e) => {
                        if (!smsVerified) {
                          e.currentTarget.style.borderColor = '#2563eb'
                          e.currentTarget.style.background = '#ffffff'
                        }
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.background = smsVerified ? '#e5e7eb' : '#f8f9fa'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendSms}
                      disabled={sendingSms || smsVerified || smsCountdown > 0}
                      style={{
                        padding: '14px 20px',
                        background: smsVerified ? '#10b981' : (sendingSms || smsCountdown > 0) ? '#9ca3af' : '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: (sendingSms || smsVerified || smsCountdown > 0) ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s'
                      }}
                    >
                      {smsVerified ? '인증완료' : smsCountdown > 0 ? `${Math.floor(smsCountdown / 60)}:${(smsCountdown % 60).toString().padStart(2, '0')}` : sendingSms ? '발송중...' : '인증번호'}
                    </button>
                  </div>
                </div>

                {smsSent && !smsVerified && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="인증번호 6자리"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                      maxLength={6}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        border: '1px solid transparent',
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
                    <button
                      type="button"
                      onClick={handleVerifySms}
                      disabled={verifyingSms}
                      style={{
                        padding: '14px 20px',
                        background: verifyingSms ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: verifyingSms ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s'
                      }}
                    >
                      {verifyingSms ? '확인중...' : '확인'}
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: mode === 'login' ? '16px' : '24px',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {loading
                ? (mode === 'login' ? '로그인 중...' : mode === 'findId' ? '찾는 중...' : '발송 중...')
                : (mode === 'login' ? '이메일로 로그인' : mode === 'findId' ? '아이디 찾기' : '비밀번호 재설정 이메일 발송')
              }
            </button>

            {/* 로그인 모드일 때 아이디/비밀번호 찾기 */}
            {mode === 'login' && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('findId')
                    setError(null)
                    setSuccess(null)
                    setFoundEmail(null)
                    setName('')
                    setPhone('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  아이디 찾기
                </button>
                <span style={{ color: '#d1d5db' }}>|</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('resetPassword')
                    setError(null)
                    setSuccess(null)
                    setEmail('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  비밀번호 찾기
                </button>
              </div>
            )}

            {/* 다른 모드일 때 로그인으로 돌아가기 */}
            {mode !== 'login' && !foundEmail && (
              <div style={{
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                    setSuccess(null)
                    setEmail('')
                    setPassword('')
                    setName('')
                    setPhone('')
                    setFoundEmail(null)
                    setSmsSent(false)
                    setSmsVerified(false)
                    setSmsCode('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  ← 로그인으로 돌아가기
                </button>
              </div>
            )}

            {/* 아이디를 찾은 후 로그인으로 이동 */}
            {foundEmail && (
              <div style={{
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setEmail(foundEmail)
                    setFoundEmail(null)
                    setError(null)
                    setSuccess(null)
                    setName('')
                    setPhone('')
                    setSmsSent(false)
                    setSmsVerified(false)
                    setSmsCode('')
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1d4ed8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2563eb'
                  }}
                >
                  이 아이디로 로그인하기
                </button>
              </div>
            )}
          </form>

          {/* 소셜 로그인 (로그인 모드일 때만) */}
          {mode === 'login' && (
            <>
              {/* 소셜 로그인 구분선 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                margin: '24px 0 16px'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                <span style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>간편 로그인</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {/* 네이버 로그인 */}
                <button
                  type="button"
                  onClick={handleNaverLogin}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#03C75A',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#02b350'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#03C75A'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M13.5 3.5H6.5C4.567 3.5 3 5.067 3 7V13C3 14.933 4.567 16.5 6.5 16.5H13.5C15.433 16.5 17 14.933 17 13V7C17 5.067 15.433 3.5 13.5 3.5Z" fill="white"/>
                    <path d="M10 6.5C8.067 6.5 6.5 8.067 6.5 10C6.5 11.933 8.067 13.5 10 13.5C11.933 13.5 13.5 11.933 13.5 10C13.5 8.067 11.933 6.5 10 6.5Z" fill="#03C75A"/>
                  </svg>
                  네이버로 시작하기
                </button>

                {/* 카카오 로그인 */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('kakao')}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#FEE500',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#000000',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#fdd835'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#FEE500'
                    }
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#000000" d="M9 3c-3.866 0-7 2.463-7 5.5 0 1.894 1.214 3.556 3.068 4.568l-.75 2.75a.3.3 0 00.434.345L8.28 14.32c.238.02.479.03.72.03 3.866 0 7-2.463 7-5.5S12.866 3 9 3z"/>
                  </svg>
                  카카오로 시작하기
                </button>

                {/* 구글 로그인 */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#f9fafb'
                      e.currentTarget.style.borderColor = '#d1d5db'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
                  </svg>
                  구글로 시작하기
                </button>
              </div>
            </>
          )}

          {/* 회원가입 링크 */}
          {mode === 'login' && (
            <div style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              계정이 없으신가요?{' '}
              <Link
                href="/register"
                onClick={onClose}
                style={{
                  color: '#2563eb',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
