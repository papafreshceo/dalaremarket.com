'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

function RegisterContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // 이메일 인증
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [codeSendLoading, setCodeSendLoading] = useState(false)
  // SMS 인증 기능 제거됨
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const verificationCodeInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null)
  const [nameBlurred, setNameBlurred] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 이메일 가입 시작 여부
  const [startEmailSignup, setStartEmailSignup] = useState(false)
  // 스텝바이스텝 표시를 위한 state
  const [showStep, setShowStep] = useState(0)

  // 네이버 OAuth 정보
  const [naverInfo, setNaverInfo] = useState<{
    provider?: string
    email?: string
    name?: string
    phone?: string
    naver_id?: string
  }>({})

  // URL 파라미터에서 네이버 정보 추출
  useEffect(() => {
    const provider = searchParams.get('provider')
    if (provider === 'naver') {
      const naverData = {
        provider,
        email: searchParams.get('email') || '',
        name: searchParams.get('name') || '',
        phone: searchParams.get('phone') || '',
        naver_id: searchParams.get('naver_id') || '',
      }
      setNaverInfo(naverData)
      setEmail(naverData.email)
      setName(naverData.name)
      setPhone(naverData.phone)
    }
  }, [searchParams])

  // 이메일로 가입하기 클릭 시 이메일 입력란 표시
  useEffect(() => {
    if (startEmailSignup && !naverInfo.naver_id) {
      setShowStep(1) // 이메일 입력란
    }
  }, [startEmailSignup, naverInfo.naver_id])

  // 인증코드 발송 후 인증 입력란 표시
  useEffect(() => {
    if (isCodeSent && showStep < 2) {
      setShowStep(2)
    }
  }, [isCodeSent, showStep])

  // 이메일 인증 완료 → 이름 입력란
  useEffect(() => {
    if (emailVerified && showStep < 3) {
      setShowStep(3)
    }
  }, [emailVerified, showStep])

  // 이름 입력 완료 체크 (수동 트리거용)
  const checkNameComplete = () => {
    return name && name.trim().length >= 2 && !/[^가-힣\s]/.test(name)
  }

  // 전화번호 입력 완료 체크
  const checkPhoneComplete = () => {
    const phoneDigits = phone.replace(/[^\d]/g, '')
    return phoneDigits.length >= 11
  }

  // 비밀번호 입력 완료 체크
  const checkPasswordComplete = () => {
    return password.length >= 6
  }

  // 비밀번호 확인 완료 체크
  const checkConfirmPasswordComplete = () => {
    return confirmPassword && password === confirmPassword && password.length >= 6
  }

  // 자동 스텝 진행 (선택적 - 사용자가 입력 완료하면 자동으로 다음 단계)

  // 전화번호 완료 → 비밀번호 또는 약관
  useEffect(() => {
    if (checkPhoneComplete() && showStep === 4) {
      if (naverInfo.naver_id) {
        setShowStep(7) // 네이버 사용자는 약관으로
      } else {
        setShowStep(5) // 일반 사용자는 비밀번호로
      }
    }
  }, [phone, showStep, naverInfo.naver_id])

  // 비밀번호 완료 → 비밀번호 확인
  useEffect(() => {
    if (!naverInfo.naver_id && checkPasswordComplete() && showStep === 5) {
      setShowStep(6)
    }
  }, [password, showStep, naverInfo.naver_id])

  // 비밀번호 확인 완료 → 약관
  useEffect(() => {
    if (!naverInfo.naver_id && checkConfirmPasswordComplete() && showStep === 6) {
      setShowStep(7)
    }
  }, [confirmPassword, password, showStep, naverInfo.naver_id])

  // 이용약관 체크 → 개인정보처리방침
  useEffect(() => {
    if (agreeTerms && showStep < 8) {
      setShowStep(8)
    }
  }, [agreeTerms, showStep])

  // 개인정보처리방침 체크 → 마케팅 동의
  useEffect(() => {
    if (agreePrivacy && showStep < 9) {
      setShowStep(9)
    }
  }, [agreePrivacy, showStep])

  // 필수 약관 모두 체크 → 회원가입 버튼
  useEffect(() => {
    if (agreeTerms && agreePrivacy && showStep < 10) {
      setShowStep(10)
    }
  }, [agreeTerms, agreePrivacy, showStep])

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent, currentStep: number, nextStep: number, validator?: () => boolean) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (validator ? validator() : true) {
        setShowStep(nextStep)
      }
    }
  }

  // 자동 포커스 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showStep === 1 && emailInputRef.current && !naverInfo.naver_id) {
        emailInputRef.current.focus()
      } else if (showStep === 2 && verificationCodeInputRef.current) {
        verificationCodeInputRef.current.focus()
      } else if (showStep === 3 && nameInputRef.current) {
        nameInputRef.current.focus()
      } else if (showStep === 4 && phoneInputRef.current) {
        phoneInputRef.current.focus()
      } else if (showStep === 5 && passwordInputRef.current) {
        passwordInputRef.current.focus()
      } else if (showStep === 6 && confirmPasswordInputRef.current) {
        confirmPasswordInputRef.current.focus()
      }
    }, 400) // 애니메이션 후 포커스

    return () => clearTimeout(timer)
  }, [showStep, naverInfo.naver_id])



  const handleNaverLogin = () => {
    const state = Math.random().toString(36).substring(7)
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_NAVER_CALLBACK_URL || 'http://localhost:3002/auth/callback/naver')
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&auth_type=reprompt`

    window.location.href = naverAuthUrl
  }

  // 인증 코드 발송
  const handleSendCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요')
      return
    }

    setCodeSendLoading(true)
    setError(null)

    try {
      console.log('[Register] ===== 이메일 중복 확인 시작 =====')
      console.log('[Register] 입력된 이메일:', email)

      // 먼저 이메일 중복 확인
      const duplicateCheckResponse = await fetch('/api/email/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      console.log('[Register] API 응답 상태:', duplicateCheckResponse.status, duplicateCheckResponse.statusText)

      if (!duplicateCheckResponse.ok) {
        console.log('[Register] API 요청 실패')
      }

      const duplicateCheckData = await duplicateCheckResponse.json()
      console.log('[Register] API 응답 데이터:', JSON.stringify(duplicateCheckData, null, 2))
      console.log('[Register] isDuplicate 값:', duplicateCheckData.isDuplicate)
      console.log('[Register] success 값:', duplicateCheckData.success)

      // 이미 가입된 이메일인 경우
      if (duplicateCheckData.isDuplicate === true) {
        console.log('[Register] ❌ 중복된 이메일 감지!')
        setError(duplicateCheckData.error || '이미 가입된 이메일입니다. 로그인 페이지로 이동해주세요.')
        setCodeSendLoading(false)
        return
      }

      console.log('[Register] ✅ 사용 가능한 이메일, 인증 코드 발송 진행...')

      // 중복이 아니면 인증 코드 발송
      const response = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || '인증 코드 발송 실패')
        setCodeSendLoading(false)
        return
      }

      setIsCodeSent(true)
      showToast('인증 코드가 발송되었습니다', 'success')
      setCodeSendLoading(false)
    } catch (error) {
      console.error('인증 코드 발송 오류:', error)
      setError('인증 코드 발송 중 오류가 발생했습니다')
      setCodeSendLoading(false)
    }
  }

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('인증 코드를 입력해주세요')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || '인증 코드가 일치하지 않습니다')
        setLoading(false)
        return
      }

      setEmailVerified(true)
      showToast('이메일 인증이 완료되었습니다!', 'success')
      setLoading(false)
    } catch (error) {
      console.error('인증 코드 확인 오류:', error)
      setError('인증 코드 확인 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 이메일 인증 확인 (네이버 사용자 제외)
    if (!naverInfo.naver_id && !emailVerified) {
      setError('이메일 인증을 완료해주세요')
      return
    }

    // 네이버 사용자가 아닌 경우에만 비밀번호 확인
    if (!naverInfo.naver_id) {
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.')
        return
      }

      if (password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.')
        return
      }
    }

    if (!agreeTerms || !agreePrivacy) {
      setError('이용약관과 개인정보처리방침에 동의해주세요.')
      return
    }

    setLoading(true)

    try {
      // 네이버 사용자 회원가입
      if (naverInfo.naver_id) {
        const response = await fetch('/api/auth/naver/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            phone,
            naver_id: naverInfo.naver_id,
            agree_marketing: agreeMarketing,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error || '회원가입에 실패했습니다.')
          setLoading(false)
          return
        }

        // 세션 생성
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.temp_password,
        })

        if (signInError) {
          setError('로그인에 실패했습니다.')
          setLoading(false)
          return
        }

        showToast('회원가입이 완료되었습니다!', 'success')
        router.push('/auth/pending-approval')
        return
      }

      // 일반 사용자 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role: 'seller',
            approved: true,
            marketing_consent: agreeMarketing,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        // Database trigger가 users와 organization을 자동 생성
        // 생성 확인 (최대 5초 대기)
        let userCreated = false
        for (let i = 0; i < 10; i++) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('id', authData.user.id)
            .single()

          if (userData) {
            userCreated = true
            break
          }
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        if (!userCreated) {
          // Trigger 실패 시 수동으로 생성
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              name,
              phone,
              role: 'seller',
              approved: true,
              marketing_consent: agreeMarketing,
            })

          if (insertError) {
            console.error('사용자 생성 오류:', insertError)
            setError('회원가입 중 오류가 발생했습니다.')
            setLoading(false)
            return
          }

          // 조직도 수동으로 생성 (필수값만)
          const sellerCode = 'S' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
          const partnerCode = 'P' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0')

          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
              owner_id: authData.user.id,
              seller_code: sellerCode,
              partner_code: partnerCode,
            })
            .select('id')
            .single()

          if (!orgError && orgData) {
            // 조직 멤버 연결
            await supabase
              .from('organization_members')
              .insert({
                organization_id: orgData.id,
                user_id: authData.user.id,
                role: 'owner',
                status: 'active',
              })

            // primary_organization_id 업데이트
            await supabase
              .from('users')
              .update({ primary_organization_id: orgData.id })
              .eq('id', authData.user.id)
          }
        }

        // 환영 이메일 발송
        try {
          await fetch('/api/email/send-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: authData.user.id,
              email: authData.user.email,
              name: name || '고객',
            }),
          })
        } catch (emailError) {
          console.error('환영 이메일 발송 실패:', emailError)
          // 이메일 발송 실패는 회원가입 성공에 영향 없음
        }

        // 관리자에게 신규 회원 가입 알림
        try {
          await fetch('/api/notifications/admin-new-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: authData.user.id,
              email: authData.user.email,
              name: name || '신규회원',
            }),
          })
        } catch (notifError) {
          console.error('관리자 알림 발송 실패:', notifError)
          // 알림 발송 실패는 회원가입 성공에 영향 없음
        }

        showToast('회원가입이 완료되었습니다!', 'success')
        router.push('/platform')
        setLoading(false)
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  // 소셜 로그인 처리 (약관 동의는 자동으로 간주)
  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver') => {
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


  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) {
      setPhone(numbers)
    } else if (numbers.length <= 7) {
      setPhone(`${numbers.slice(0, 3)}-${numbers.slice(3)}`)
    } else {
      setPhone(`${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 300px, #93c5fd 600px, #bfdbfe 900px, #dbeafe 1200px, #f0f9ff 1500px, #ffffff 1800px, #ffffff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* 뒤로가기 버튼 - 섹션 밖 */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/platform');
          }
        }}
        style={{
          position: 'absolute',
          left: 'calc(50% - 650px)',
          top: '95px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#1f2937',
          cursor: 'pointer',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
          e.currentTarget.style.transform = 'translateX(-4px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
          e.currentTarget.style.transform = 'translateX(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        뒤로가기
      </button>

      <div style={{
        width: '100%',
        maxWidth: '1000px',
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '32px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            회원가입
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            달래마켓에 오신 것을 환영합니다
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c00',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ minHeight: '400px' }}>
          {/* 네이버 로그인 안내 */}
          {naverInfo.naver_id && (
            <div
              style={{
                padding: '12px',
                background: '#e8f5e9',
                border: '1px solid #4caf50',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#2e7d32',
              }}
            >
              네이버 계정으로 가입 중입니다. 약관에 동의하고 회원가입을 완료해주세요.
            </div>
          )}

          {/* 이메일로 가입하기 버튼 */}
          {!naverInfo.naver_id && !startEmailSignup && (
            <div style={{
              opacity: !startEmailSignup ? 1 : 0,
              transform: !startEmailSignup ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'all 0.3s ease-out',
              position: startEmailSignup ? 'absolute' : 'relative',
              width: '100%',
              pointerEvents: startEmailSignup ? 'none' : 'auto'
            }}>
              <button
                type="button"
                onClick={() => setStartEmailSignup(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1d4ed8'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563eb'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                이메일로 가입하기
              </button>
            </div>
          )}

          {/* 이메일 인증 - 일반 사용자만 */}
          {!naverInfo.naver_id && (
            <div style={{
              position: 'relative',
              minHeight: startEmailSignup ? '0' : '0'
            }}>
              {/* 이메일 입력란 + 인증코드발송 버튼 */}
              {startEmailSignup && showStep >= 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                maxWidth: '700px',
                opacity: showStep >= 1 ? 1 : 0,
                transform: showStep >= 1 ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'all 0.3s ease-out'
              }}>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="* 이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email) {
                      e.preventDefault()
                      handleSendCode()
                    }
                  }}
                  required
                  disabled={emailVerified}
                  style={{
                    width: '200px',
                    padding: '10px 12px',
                    border: '1px solid transparent',
                    background: emailVerified ? '#e5e7eb' : '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: emailVerified ? 'not-allowed' : 'text',
                  }}
                  onFocus={(e) => {
                    if (!emailVerified) {
                      e.currentTarget.style.borderColor = '#2563eb'
                      e.currentTarget.style.background = '#ffffff'
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.background = emailVerified ? '#e5e7eb' : '#f8f9fa'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={codeSendLoading || !email || emailVerified}
                  style={{
                    padding: '10px 16px',
                    background: email && !codeSendLoading && !emailVerified ? '#667eea' : '#e5e7eb',
                    color: email && !codeSendLoading && !emailVerified ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: email && !codeSendLoading && !emailVerified ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (email && !codeSendLoading && !emailVerified) {
                      e.currentTarget.style.background = '#5568d3'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (email && !codeSendLoading && !emailVerified) {
                      e.currentTarget.style.background = '#667eea'
                    }
                  }}
                >
                  {codeSendLoading ? '전송 중...' : '인증코드발송'}
                </button>
              </div>
              )}

              {/* 인증코드 입력란 */}
              {showStep >= 2 && isCodeSent && !emailVerified && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '8px',
                  maxWidth: '700px',
                  opacity: showStep >= 2 ? 1 : 0,
                  transform: showStep >= 2 ? 'translateY(0)' : 'translateY(-10px)',
                  transition: 'all 0.3s ease-out'
                }}>
                  <input
                    ref={verificationCodeInputRef}
                    type="text"
                    placeholder="인증코드"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && verificationCode.length === 6) {
                        e.preventDefault()
                        handleVerifyCode()
                      }
                    }}
                    maxLength={6}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid transparent',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'center',
                      letterSpacing: '2px',
                      fontWeight: '600',
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
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6}
                    style={{
                      padding: '10px 20px',
                      background: verificationCode.length === 6 ? '#667eea' : '#e5e7eb',
                      color: verificationCode.length === 6 ? 'white' : '#9ca3af',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: verificationCode.length === 6 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (verificationCode.length === 6) {
                        e.currentTarget.style.background = '#5568d3'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (verificationCode.length === 6) {
                        e.currentTarget.style.background = '#667eea'
                      }
                    }}
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={codeSendLoading}
                    style={{
                      padding: '10px 20px',
                      background: 'white',
                      color: '#667eea',
                      border: '1px solid #667eea',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: codeSendLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!codeSendLoading) {
                        e.currentTarget.style.background = '#f8f9fa'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!codeSendLoading) {
                        e.currentTarget.style.background = 'white'
                      }
                    }}
                  >
                    재발송
                  </button>
                </div>
              )}

              {/* 인증 완료 메시지 */}
              {emailVerified && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#d1fae5',
                    border: '1px solid #34d399',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#065f46',
                    textAlign: 'center',
                    marginBottom: '8px',
                    maxWidth: '700px',
                  }}
                >
                  ✓ 이메일 인증 완료
                </div>
              )}
            </div>
          )}

          {/* 네이버 사용자 이메일 표시 */}
          {naverInfo.naver_id && (
            <div style={{ marginBottom: '8px', maxWidth: '700px' }}>
              <input
                type="email"
                placeholder="* 이메일"
                value={email}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid transparent',
                  background: '#e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          )}

          {/* 이름 + 전화번호 + 비밀번호 + 비밀번호 확인 (한 줄 배치) */}
          {showStep >= 3 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px',
              maxWidth: '700px',
              opacity: showStep >= 3 ? 1 : 0,
              transform: showStep >= 3 ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* 이름 입력란 */}
              <input
                ref={nameInputRef}
                type="text"
                placeholder="* 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 3, 4, checkNameComplete)}
                required
                disabled={!!naverInfo.naver_id}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid transparent',
                  background: naverInfo.naver_id ? '#e5e7eb' : '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: naverInfo.naver_id ? 'not-allowed' : 'text',
                }}
                onFocus={(e) => {
                  setNameBlurred(false)
                  if (!naverInfo.naver_id) {
                    e.currentTarget.style.borderColor = '#2563eb'
                    e.currentTarget.style.background = '#ffffff'
                  }
                }}
                onBlur={(e) => {
                  setNameBlurred(true)
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.background = naverInfo.naver_id ? '#e5e7eb' : '#f8f9fa'
                }}
              />

              {/* 전화번호 입력란 */}
              {showStep >= 4 && (
                <input
                  ref={phoneInputRef}
                  type="tel"
                  placeholder="* 010-1234-5678"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 4, 5, checkPhoneComplete)}
                  required
                  disabled={!!naverInfo.naver_id}
                  style={{
                    flex: showStep >= 4 ? 1 : 0,
                    padding: '10px 12px',
                    border: '1px solid transparent',
                    background: naverInfo.naver_id ? '#e5e7eb' : '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: naverInfo.naver_id ? 'not-allowed' : 'text',
                    opacity: showStep >= 4 ? 1 : 0,
                    transform: showStep >= 4 ? 'translateX(0) scale(1)' : 'translateX(-20px) scale(0.8)',
                    maxWidth: showStep >= 4 ? '100%' : '0',
                    overflow: 'hidden',
                  }}
                  onFocus={(e) => {
                    if (!naverInfo.naver_id) {
                      e.currentTarget.style.borderColor = '#2563eb'
                      e.currentTarget.style.background = '#ffffff'
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.background = naverInfo.naver_id ? '#e5e7eb' : '#f8f9fa'
                  }}
                />
              )}

              {/* 비밀번호 입력란 */}
              {!naverInfo.naver_id && showStep >= 5 && (
                <div style={{
                  position: 'relative',
                  flex: showStep >= 5 ? 1 : 0,
                  opacity: showStep >= 5 ? 1 : 0,
                  transform: showStep >= 5 ? 'translateX(0) scale(1)' : 'translateX(-20px) scale(0.8)',
                  maxWidth: showStep >= 5 ? '100%' : '0',
                  transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  overflow: 'hidden',
                }}>
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="* 비밀번호 (최소 6자)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 5, 6, checkPasswordComplete)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 12px',
                      border: '1px solid transparent',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s',
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
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showPassword ? (
                      // 눈 가림 (비밀번호 표시 중)
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 0 0 3.5 3.5" />
                        <path d="M9.4 5.4A9 9 0 0 1 12 5c7 0 11 7 11 7a19 19 0 0 1-2 3M6.6 6.6C4 8.3 2 12 2 12s4 7 10 7c1.3 0 2.5-.3 3.6-.8" />
                      </svg>
                    ) : (
                      // 눈 (비밀번호 숨김)
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              )}

              {/* 비밀번호 확인 입력란 */}
              {!naverInfo.naver_id && showStep >= 6 && (
                <div style={{
                  position: 'relative',
                  flex: showStep >= 6 ? 1 : 0,
                  opacity: showStep >= 6 ? 1 : 0,
                  transform: showStep >= 6 ? 'translateX(0) scale(1)' : 'translateX(-20px) scale(0.8)',
                  maxWidth: showStep >= 6 ? '100%' : '0',
                  transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  overflow: 'hidden',
                }}>
                  <input
                    ref={confirmPasswordInputRef}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="* 비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 6, 7, checkConfirmPasswordComplete)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 12px',
                      border: '1px solid transparent',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s',
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showConfirmPassword ? (
                      // 눈 가림 (비밀번호 표시 중)
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 0 0 3.5 3.5" />
                        <path d="M9.4 5.4A9 9 0 0 1 12 5c7 0 11 7 11 7a19 19 0 0 1-2 3M6.6 6.6C4 8.3 2 12 2 12s4 7 10 7c1.3 0 2.5-.3 3.6-.8" />
                      </svg>
                    ) : (
                      // 눈 (비밀번호 숨김)
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 이름 입력 경고 메시지 */}
          {showStep >= 3 && nameBlurred && name && /[^가-힣\s]/.test(name) && (
            <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '-4px', marginBottom: '8px', maxWidth: '700px' }}>
              완성된 한글만 입력해주세요
            </p>
          )}

          {/* 이용약관 동의 */}
          {showStep >= 7 && (
          <div style={{
            flex: 1,
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '12px',
            opacity: showStep >= 7 ? 1 : 0,
            transform: showStep >= 7 ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#212529'
            }}>
              이용약관 (필수)
            </div>

            <div style={{
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '12px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '11px',
              lineHeight: '1.6',
              color: '#495057',
              whiteSpace: 'pre-wrap'
            }}>
{`제1조 (목적)
본 약관은 달래마켓(이하 "회사"라 합니다)이 운영하는 농산물 B2B 온라인 플랫폼 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "사이트"라 함은 회사가 운영하는 온라인 플랫폼을 의미합니다.
2. "회원"이라 함은 사이트에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.
3. "서비스"라 함은 회사가 제공하는 농산물 정보, 시세, 거래 관련 모든 서비스를 의미합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련 법령을 위반하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.

제4조 (회원가입)
1. 회원가입은 이용자가 약관의 내용에 대하여 동의를 한 다음 회원가입 신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.
2. 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않을 수 있습니다.
   ① 실명이 아니거나 타인의 명의를 이용한 경우
   ② 허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우
   ③ 기타 회원으로 등록하는 것이 기술상 현저히 지장이 있다고 판단되는 경우

제5조 (서비스의 제공 및 변경)
1. 회사는 다음과 같은 서비스를 제공합니다.
   ① 농산물 정보
   ② 농산물 위탁 발송 및 중개
   ③ 기타 회사가 정하는 서비스
2. 회사는 서비스의 내용을 변경할 수 있으며, 이 경우 변경된 서비스의 내용 및 제공일자를 명시하여 공지합니다.

제6조 (서비스의 중단)
1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우 서비스의 제공을 일시적으로 중단할 수 있습니다.
2. 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 서비스 제공을 중지할 수 있습니다.

제7조 (회원의 의무)
1. 회원은 다음 행위를 하여서는 안 됩니다.
   ① 신청 또는 변경 시 허위 내용의 등록
   ② 타인의 정보 도용
   ③ 회사가 게시한 정보의 변경
   ④ 회사가 금지한 정보의 송신 또는 게시
   ⑤ 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해
   ⑥ 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위
   ⑦ 외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보를 사이트에 공개 또는 게시하는 행위

제8조 (개인정보보호)
회사는 회원의 개인정보를 보호하기 위하여 개인정보처리방침을 수립하고 이를 준수합니다.

제9조 (회사의 의무)
1. 회사는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위하여 노력합니다.
2. 회사는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보보호를 위한 보안 시스템을 구축합니다.

제10조 (저작권의 귀속)
1. 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.
2. 회원은 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.

제11조 (분쟁해결)
1. 회사와 회원 간에 발생한 분쟁은 상호 협의하여 해결합니다.
2. 협의가 되지 않을 경우 관련 법령 및 관례에 따라 해결합니다.

부칙
본 약관은 2025년 9월 7일부터 시행합니다.`}
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#495057'
            }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontWeight: '500' }}>
                이용약관을 읽었으며 이에 동의합니다
              </span>
            </label>
          </div>
          )}

          {/* 개인정보처리방침 동의 */}
          {showStep >= 8 && (
          <div style={{
            flex: 1,
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '12px',
            opacity: showStep >= 8 ? 1 : 0,
            transform: showStep >= 8 ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#212529'
            }}>
              개인정보처리방침 (필수)
            </div>

            <div style={{
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '12px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '11px',
              lineHeight: '1.6',
              color: '#495057',
              whiteSpace: 'pre-wrap'
            }}>
{`달래마켓(이하 "회사")은 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.

1. 수집하는 개인정보 항목
회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
- 필수항목: 이름, 연락처, 이메일, 비밀번호
- 선택항목: 마케팅 수신 동의 여부(이메일, SMS)
- 판매자 추가항목: 사업자명, 사업자등록번호, 사업장 주소, 대표자명, 정산계좌정보
- 소셜 로그인(네이버, 카카오, 구글) 시: 이름, 이메일, 전화번호
- 서비스 이용 과정에서 자동 수집: IP주소, 쿠키, 방문일시, 서비스 이용기록

2. 개인정보의 수집 및 이용목적
- 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산
- 회원 관리 및 본인 확인
- 소셜 로그인을 통한 간편 회원가입 및 로그인
- 마케팅 및 광고에 활용 (동의한 회원에 한함)
- 농산물 거래 중개 및 배송 처리
- 서비스 이용기록 분석 및 통계

3. 개인정보의 보유 및 이용기간
원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
- 계약 또는 청약철회 기록: 5년 (전자상거래법)
- 대금결제 및 재화 공급 기록: 5년 (전자상거래법)
- 소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)

4. 개인정보의 파기절차 및 방법
회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다.
- 파기절차: 회원 탈퇴 시 즉시 파기 (법령에 따른 보관 필요 정보 제외)
- 파기방법: 전자적 파일은 복구 불가능한 방법으로 삭제

5. 개인정보 제공
회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 다음의 경우에는 예외로 합니다:
- 소셜 로그인(네이버, 카카오, 구글) 이용 시 해당 서비스 제공자로부터 최소한의 정보를 제공받습니다.
- 이용자가 사전에 동의한 경우
- 배송업체(택배사): 구매자명, 연락처, 수령인명, 연락처, 배송주소
- 결제대행사(PG사): 판매자명, 연락처, 이메일 (거래종료 후 5년 보관)
- 법령의 규정에 의하거나 수사기관의 요구가 있는 경우

6. 소셜 로그인 서비스
회사는 편리한 회원가입 및 로그인을 위해 네이버, 카카오, 구글의 소셜 로그인 서비스를 제공합니다. 소셜 로그인 이용 시 해당 서비스의 이용약관 및 개인정보처리방침이 함께 적용됩니다.

7. 이용자의 권리와 행사방법
이용자는 언제든지 본인의 개인정보를 조회하거나 수정, 삭제, 처리정지를 요구할 수 있습니다.
- 개인정보 조회/수정: 마이페이지에서 직접 열람 및 수정
- 회원탈퇴: 고객센터 문의 또는 이메일 요청
- 마케팅 수신거부: 마이페이지 또는 수신 메일/SMS 내 수신거부 링크

8. 개인정보의 안전성 확보조치
- 비밀번호 암호화 저장
- SSL 인증서를 통한 데이터 전송 암호화
- 개인정보 접근권한 제한 및 관리

9. 쿠키의 사용
회사는 로그인 유지, 이용 분석 등을 위해 쿠키를 사용합니다. 이용자는 브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나, 일부 서비스 이용에 제한이 있을 수 있습니다.

10. 만 14세 미만 아동의 개인정보
회사는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.

11. 개인정보보호책임자
성명: 김동수
연락처: 010-2688-1388
이메일: dalraemarket@gmail.com

13. 개인정보처리방침 변경
이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.

본 방침은 2025년 12월 1일부터 시행됩니다.`}
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#495057'
            }}>
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontWeight: '500' }}>
                개인정보처리방침을 읽었으며 이에 동의합니다
              </span>
            </label>
          </div>
          )}

          {/* 마케팅 정보 수신 동의 (선택) */}
          {showStep >= 9 && (
          <div style={{
            marginBottom: '12px',
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '10px',
            opacity: showStep >= 9 ? 1 : 0,
            transform: showStep >= 9 ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#212529'
            }}>
              마케팅 정보 수신 동의 <span style={{ color: '#2563eb' }}>(선택)</span>
            </div>

            <div style={{
              padding: '10px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              marginBottom: '8px',
              fontSize: '11px',
              lineHeight: '1.6',
              color: '#2563eb'
            }}>
              상품 출하 정보, 배송일정 안내, 공급가 변경 안내 등의 마케팅 정보를 이메일, SMS, 푸시 알림으로 수신하는 것에 동의합니다.
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#495057'
            }}>
              <input
                type="checkbox"
                checked={agreeMarketing}
                onChange={(e) => setAgreeMarketing(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontWeight: '500' }}>
                마케팅 정보 수신에 동의합니다
              </span>
            </label>
          </div>
          )}

          {showStep >= 10 && (
          <button
            type="submit"
            disabled={loading || !agreeTerms || !agreePrivacy}
            style={{
              opacity: showStep >= 10 ? 1 : 0,
              transform: showStep >= 10 ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              width: '100%',
              padding: '10px',
              background: (loading || !agreeTerms || !agreePrivacy) ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (loading || !agreeTerms || !agreePrivacy) ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading && agreeTerms && agreePrivacy) e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              if (!loading && agreeTerms && agreePrivacy) e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
          )}

          {/* 소셜 로그인 구분선 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            margin: '16px 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
            <span style={{
              fontSize: '13px',
              color: '#6b7280',
              fontWeight: '500'
            }}>간편 가입</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          </div>

          {/* 소셜 로그인 안내 */}
          <p style={{
            fontSize: '11px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '10px',
            lineHeight: '1.5'
          }}>
            소셜 로그인 시{' '}
            <Link
              href="/terms"
              target="_blank"
              style={{
                color: '#2563eb',
                textDecoration: 'underline'
              }}
            >
              이용약관
            </Link>
            {' '}및{' '}
            <Link
              href="/privacy"
              target="_blank"
              style={{
                color: '#2563eb',
                textDecoration: 'underline'
              }}
            >
              개인정보처리방침
            </Link>
            에 동의한 것으로 간주됩니다
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handleNaverLogin}
              style={{
                width: '100%',
                padding: '10px',
                background: '#03C75A',
                border: 'none',
                borderRadius: '8px',
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
              네이버로 가입하기
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: '#FEE500',
                border: 'none',
                borderRadius: '8px',
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
              카카오로 가입하기
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
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
              구글로 가입하기
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          이미 계정이 있으신가요?{' '}
          <Link
            href="/"
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
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 300px, #93c5fd 600px, #bfdbfe 900px, #dbeafe 1200px, #f0f9ff 1500px, #ffffff 1800px, #ffffff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}
            ></div>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>로딩 중...</p>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  )
}
