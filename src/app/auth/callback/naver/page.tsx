'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function NaverCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleNaverCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (!code || !state) {
        router.push('/auth/login?error=missing_code')
        return
      }

      try {
        // 네이버 액세스 토큰 받기
        const tokenResponse = await fetch(
          `/api/auth/naver/token?code=${code}&state=${state}`
        )

        const tokenData = await tokenResponse.json()

        if (!tokenResponse.ok || !tokenData.access_token) {
          console.error('Token error:', tokenData)
          router.push('/auth/login?error=token_failed')
          return
        }

        // 네이버 사용자 정보 가져오기
        const userResponse = await fetch('/api/auth/naver/user', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })

        const userData = await userResponse.json()

        if (!userResponse.ok || !userData.email) {
          console.error('User info error:', userData)
          router.push('/auth/login?error=user_info_failed')
          return
        }

        const { email, name, phone, naver_id } = userData

        // 서버 사이드 API로 로그인 처리
        const loginResponse = await fetch('/api/auth/naver/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, name, phone, naver_id }),
        })

        const loginData = await loginResponse.json()

        if (!loginResponse.ok || !loginData.success) {
          console.error('Login API error:', loginData)
          router.push('/auth/login?error=login_failed')
          return
        }

        // 신규 사용자 - 회원가입 페이지로 리다이렉트
        if (loginData.needs_registration) {
          const params = new URLSearchParams({
            provider: 'naver',
            email: loginData.email,
            name: loginData.name || '',
            phone: loginData.phone || '',
            naver_id: loginData.naver_id,
          })
          router.push(`/register?${params.toString()}`)
          return
        }

        // 기존 사용자 - 임시 비밀번호로 세션 생성
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.temp_password,
        })

        if (signInError) {
          console.error('Session creation error:', signInError)
          router.push('/auth/login?error=session_failed')
          return
        }

        // 최근 로그인 방법 업데이트
        if (signInData?.user) {
          await supabase
            .from('users')
            .update({ last_login_provider: 'naver' })
            .eq('id', signInData.user.id)
        }

        // 리다이렉트
        router.push(loginData.redirect)
      } catch (error) {
        console.error('Naver OAuth error:', error)
        router.push('/auth/login?error=oauth_failed')
      }
    }

    handleNaverCallback()
  }, [searchParams, router, supabase])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #03C75A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}
        ></div>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>네이버 로그인 처리 중...</p>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function NaverCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #03C75A',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}
            ></div>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>로딩 중...</p>
            <style jsx>{`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        </div>
      }
    >
      <NaverCallbackContent />
    </Suspense>
  )
}
