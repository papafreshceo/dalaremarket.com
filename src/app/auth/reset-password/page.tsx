'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // URL에서 에러 확인
  useEffect(() => {
    // URL hash에서 에러 확인 (#error=access_denied&error_code=otp_expired)
    const hash = window.location.hash
    if (hash.includes('error=access_denied') || hash.includes('error_code=otp_expired')) {
      setLinkExpired(true)
      setError('비밀번호 재설정 링크가 만료되었습니다. 링크는 1시간 동안만 유효합니다.')
    }

    // URL search params에서도 에러 확인 (?error=access_denied)
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'access_denied' || params.get('error_code') === 'otp_expired') {
      setLinkExpired(true)
      setError('비밀번호 재설정 링크가 만료되었습니다. 링크는 1시간 동안만 유효합니다.')
    }
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError('비밀번호 재설정에 실패했습니다.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      console.error('Password reset error:', err)
      setError('비밀번호 재설정 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '8px',
          textAlign: 'center',
          color: '#212529'
        }}>
          비밀번호 재설정
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          새로운 비밀번호를 입력해주세요
        </p>

        {linkExpired ? (
          <div>
            <div style={{
              padding: '20px',
              background: '#fee2e2',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '16px', color: '#dc2626', fontWeight: '600', marginBottom: '8px' }}>
                링크가 만료되었습니다
              </p>
              <p style={{ fontSize: '14px', color: '#dc2626', marginBottom: '12px' }}>
                비밀번호 재설정 링크는 1시간 동안만 유효합니다.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                메인 페이지로 돌아가서 로그인 창의 "비밀번호 찾기"를 다시 클릭해주세요.
              </p>
            </div>
            <button
              onClick={handleBackToLogin}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        ) : success ? (
          <div style={{
            padding: '20px',
            background: '#d1fae5',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '16px', color: '#059669', fontWeight: '600', marginBottom: '8px' }}>
              비밀번호가 성공적으로 변경되었습니다!
            </p>
            <p style={{ fontSize: '14px', color: '#059669' }}>
              메인 페이지로 이동합니다...
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529',
                marginBottom: '8px'
              }}>
                새 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#212529',
                marginBottom: '8px'
              }}>
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              />
              {confirmPassword && (
                <p style={{
                  fontSize: '12px',
                  color: password === confirmPassword ? '#10b981' : '#ef4444',
                  marginTop: '6px'
                }}>
                  {password === confirmPassword ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다'}
                </p>
              )}
            </div>

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
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
