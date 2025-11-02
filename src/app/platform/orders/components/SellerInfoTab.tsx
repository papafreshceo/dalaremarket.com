'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { showSuccessToast, showErrorToast } from '../utils/statusToast';

interface SellerInfo {
  // 기본 정보 (회원가입 시 입력)
  name: string;
  email: string;
  phone: string;

  // 사업자 정보
  business_name?: string;  // 사업자명
  business_address?: string;  // 주소
  business_number?: string;  // 사업자등록번호
  business_email?: string;  // 이메일 (계산서발행용)
  representative_name?: string;  // 대표자명
  representative_phone?: string;  // 대표전화번호

  // 담당자 정보
  manager_name?: string;  // 담당자명
  manager_phone?: string;  // 담당자전화번호

  // 정산 계좌 정보
  bank_account?: string;  // 정산계좌번호
  bank_name?: string;  // 은행명
  account_holder?: string;  // 예금주
  depositor_name?: string;  // 입금자명

  // 송장출력 정보
  store_name?: string;  // 업체명
  store_phone?: string;  // 전화번호
}

export default function SellerInfoTab({ userId }: { userId: string }) {
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSameAsBusinessName, setIsSameAsBusinessName] = useState(true);
  const [isSameAsEmail, setIsSameAsEmail] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // 회원가입 폼 상태
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  });
  const [signingUp, setSigningUp] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      loadSellerInfo();
    }
  }, [userId]);

  // 인증번호 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 사업자명과 동일 체크박스가 체크되어 있으면 사업자명을 스토어명에 자동 반영
  useEffect(() => {
    if (isSameAsBusinessName && sellerInfo.business_name) {
      setSellerInfo(prev => ({ ...prev, store_name: prev.business_name }));
    }
  }, [isSameAsBusinessName, sellerInfo.business_name]);

  // 기본 이메일과 동일 체크박스가 체크되어 있으면 기본 이메일을 사업자 이메일에 자동 반영
  useEffect(() => {
    if (isSameAsEmail && sellerInfo.email) {
      setSellerInfo(prev => ({ ...prev, business_email: prev.email }));
    }
  }, [isSameAsEmail, sellerInfo.email]);

  const loadSellerInfo = async () => {
    try {
      // 비회원 사용자인 경우
      if (userId === 'guest') {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const loadedInfo = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          business_name: data.business_name || '',
          business_address: data.business_address || '',
          business_number: data.business_number || '',
          business_email: data.business_email || data.email || '',
          representative_name: data.representative_name || '',
          representative_phone: data.representative_phone || '',
          manager_name: data.manager_name || '',
          manager_phone: data.manager_phone || '',
          bank_account: data.bank_account || '',
          bank_name: data.bank_name || '',
          account_holder: data.account_holder || '',
          depositor_name: data.depositor_name || '',
          store_name: data.store_name || data.business_name || '',
          store_phone: data.store_phone || '',
        };

        setSellerInfo(loadedInfo);

        // 스토어명이 사업자명과 같거나 없으면 체크박스를 체크 상태로
        if (!data.store_name || data.store_name === data.business_name) {
          setIsSameAsBusinessName(true);
        } else {
          setIsSameAsBusinessName(false);
        }

        // 사업자 이메일이 기본 이메일과 같거나 없으면 체크박스를 체크 상태로
        if (!data.business_email || data.business_email === data.email) {
          setIsSameAsEmail(true);
        } else {
          setIsSameAsEmail(false);
        }
      }
    } catch (error) {
      console.error('Error loading seller info:', error);
      toast.error('판매자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBusinessNumber = () => {
    if (!sellerInfo.business_number) {
      toast.error('사업자등록번호를 입력해주세요.');
      return;
    }

    const cleanNumber = sellerInfo.business_number.replace(/-/g, '');
    if (cleanNumber.length !== 10) {
      toast.error('사업자등록번호는 10자리여야 합니다.');
      return;
    }

    setVerifying(true);

    // 사업자등록번호 체크섬 검증
    const checksum = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNumber[i]) * checksum[i];
    }

    sum += Math.floor((parseInt(cleanNumber[8]) * 5) / 10);
    const remainder = (10 - (sum % 10)) % 10;
    const lastDigit = parseInt(cleanNumber[9]);

    setTimeout(() => {
      if (remainder === lastDigit) {
        showSuccessToast('유효한 사업자등록번호입니다');
      } else {
        showErrorToast('유효하지 않은 사업자등록번호입니다');
      }
      setVerifying(false);
    }, 500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 기본 필드 업데이트 (depositor_name 제외)
      const { error } = await supabase
        .from('users')
        .update({
          name: sellerInfo.name,
          email: sellerInfo.email,
          phone: sellerInfo.phone,
          business_name: sellerInfo.business_name,
          business_address: sellerInfo.business_address,
          business_number: sellerInfo.business_number,
          business_email: sellerInfo.business_email,
          representative_name: sellerInfo.representative_name,
          representative_phone: sellerInfo.representative_phone,
          manager_name: sellerInfo.manager_name,
          manager_phone: sellerInfo.manager_phone,
          bank_account: sellerInfo.bank_account,
          bank_name: sellerInfo.bank_name,
          account_holder: sellerInfo.account_holder,
          store_name: sellerInfo.store_name,
          store_phone: sellerInfo.store_phone,
        })
        .eq('id', userId);

      if (error) throw error;

      // depositor_name 별도 업데이트 (칼럼이 없을 수 있음)
      if (sellerInfo.depositor_name) {
        try {
          await supabase
            .from('users')
            .update({ depositor_name: sellerInfo.depositor_name })
            .eq('id', userId);
        } catch (e) {
          console.log('depositor_name 업데이트 건너뜀 (칼럼 없음, 마이그레이션 필요)');
        }
      }

      toast.success('판매자 정보가 저장되었습니다.');
    } catch (error) {
      console.error('Error saving seller info:', error);
      toast.error('판매자 정보 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SellerInfo, value: string) => {
    // 전화번호 필드인 경우 포맷팅 적용 (010-0000-0000)
    if (field === 'phone' || field === 'representative_phone' || field === 'manager_phone' || field === 'store_phone') {
      const numbers = value.replace(/[^\d]/g, ''); // 숫자만 추출
      let formatted = numbers;

      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }

      setSellerInfo(prev => ({ ...prev, [field]: formatted }));
    }
    // 사업자등록번호 필드인 경우 포맷팅 적용 (000-00-00000)
    else if (field === 'business_number') {
      const numbers = value.replace(/[^\d]/g, ''); // 숫자만 추출
      let formatted = numbers;

      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 5) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
      }

      setSellerInfo(prev => ({ ...prev, [field]: formatted }));
    }
    else {
      setSellerInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  // 이메일 인증번호 발송
  const handleSendVerificationCode = async () => {
    if (!signupForm.email.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupForm.email)) {
      toast.error('올바른 이메일 형식이 아닙니다.');
      return;
    }

    try {
      setSendingCode(true);

      // Supabase OTP 발송
      const { error } = await supabase.auth.signInWithOtp({
        email: signupForm.email,
        options: {
          shouldCreateUser: false, // 회원가입은 따로 처리
        },
      });

      if (error) throw error;

      setCodeSent(true);
      setCountdown(180); // 3분 타이머
      toast.success('인증번호가 발송되었습니다. 이메일을 확인해주세요.');
    } catch (error: any) {
      console.error('인증번호 발송 오류:', error);
      toast.error('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSendingCode(false);
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!signupForm.verificationCode.trim()) {
      toast.error('인증번호를 입력해주세요.');
      return;
    }

    try {
      setVerifyingCode(true);

      // Supabase OTP 확인
      const { error } = await supabase.auth.verifyOtp({
        email: signupForm.email,
        token: signupForm.verificationCode,
        type: 'email',
      });

      if (error) {
        if (error.message.includes('expired')) {
          toast.error('인증번호가 만료되었습니다. 다시 발송해주세요.');
        } else {
          toast.error('인증번호가 일치하지 않습니다.');
        }
        return;
      }

      setCodeVerified(true);
      toast.success('이메일 인증이 완료되었습니다.');
    } catch (error: any) {
      console.error('인증번호 확인 오류:', error);
      toast.error('인증번호 확인에 실패했습니다.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // 전화번호 포맷팅 (010-0000-0000)
  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/[^\d]/g, ''); // 숫자만 추출
    let formatted = numbers;

    if (numbers.length <= 3) {
      formatted = numbers;
    } else if (numbers.length <= 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }

    setSignupForm({ ...signupForm, phone: formatted });
  };

  // 회원가입 처리
  const handleSignup = async () => {
    // 필수 항목 검증
    if (!signupForm.name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    if (!signupForm.email.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    if (!codeVerified) {
      toast.error('이메일 인증을 완료해주세요.');
      return;
    }
    if (!signupForm.phone.trim()) {
      toast.error('전화번호를 입력해주세요.');
      return;
    }
    // 전화번호 형식 검증 (010-0000-0000)
    const phoneNumbers = signupForm.phone.replace(/[^\d]/g, '');
    if (phoneNumbers.length !== 11) {
      toast.error('올바른 전화번호 형식이 아닙니다. (11자리)');
      return;
    }
    if (!signupForm.password.trim()) {
      toast.error('비밀번호를 입력해주세요.');
      return;
    }
    if (signupForm.password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setSigningUp(true);

      // Supabase 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            name: signupForm.name,
            phone: signupForm.phone,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // users 테이블에 이름과 전화번호 저장
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: signupForm.name,
            phone: signupForm.phone,
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('사용자 정보 저장 실패:', updateError);
        }

        showSuccessToast('회원가입이 완료되었습니다. 로그인해주세요.');

        // 폼 초기화
        setSignupForm({ name: '', email: '', phone: '', password: '', confirmPassword: '', verificationCode: '' });
        setCodeSent(false);
        setCodeVerified(false);
        setCountdown(0);

        // 페이지 새로고침 (로그인 상태 갱신)
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      console.error('회원가입 오류:', error);

      if (error.message?.includes('already registered')) {
        toast.error('이미 가입된 이메일입니다.');
      } else {
        toast.error('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSigningUp(false);
    }
  };

  // 소셜 로그인 처리
  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    try {
      setSigningUp(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(`${provider} 로그인에 실패했습니다.`);
        setSigningUp(false);
        return;
      }

      // 소셜 로그인은 리다이렉트되므로 여기는 실행되지 않음
    } catch (err) {
      console.error('Social login error:', err);
      toast.error('소셜 로그인 중 오류가 발생했습니다.');
      setSigningUp(false);
    }
  };

  // 비회원 사용자 안내 및 회원가입 폼
  if (userId === 'guest') {
    return (
      <div style={{
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px 16px'
      }}>
        {/* 안내 헤더 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#9ca3af', margin: '0 auto 12px' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            판매자 정보 등록
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)'
          }}>
            판매자 정보를 등록하려면 먼저 회원가입이 필요합니다
          </div>
        </div>

        {/* 회원가입 폼 */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '20px'
          }}>
            회원가입
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 이름 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text)',
                marginBottom: '6px'
              }}>
                이름 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                placeholder="홍길동"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-background)',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 이메일 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text)',
                marginBottom: '6px'
              }}>
                이메일 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => {
                    setSignupForm({ ...signupForm, email: e.target.value });
                    // 이메일 변경 시 인증 상태 초기화
                    setCodeSent(false);
                    setCodeVerified(false);
                    setCountdown(0);
                  }}
                  disabled={codeVerified}
                  placeholder="example@example.com"
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: codeVerified ? 'var(--color-surface)' : 'var(--color-background)',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={handleSendVerificationCode}
                  disabled={sendingCode || codeVerified || countdown > 0}
                  style={{
                    padding: '10px 16px',
                    background: codeVerified ? '#10b981' : (sendingCode || countdown > 0) ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: (sendingCode || codeVerified || countdown > 0) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    minWidth: '90px'
                  }}
                >
                  {codeVerified ? '인증완료' : sendingCode ? '발송 중...' : countdown > 0 ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : '인증번호 발송'}
                </button>
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text)',
                marginBottom: '6px'
              }}>
                전화번호 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={signupForm.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="010-0000-0000"
                maxLength={13}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-background)',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 인증번호 입력 */}
            {codeSent && !codeVerified && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--color-text)',
                  marginBottom: '6px'
                }}>
                  인증번호 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={signupForm.verificationCode}
                    onChange={(e) => setSignupForm({ ...signupForm, verificationCode: e.target.value })}
                    placeholder="6자리 인증번호 입력"
                    maxLength={6}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: 'var(--color-background)',
                      color: 'var(--color-text)',
                      boxSizing: 'border-box'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyCode();
                    }}
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={verifyingCode}
                    style={{
                      padding: '10px 16px',
                      background: verifyingCode ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: verifyingCode ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      minWidth: '90px'
                    }}
                  >
                    {verifyingCode ? '확인 중...' : '인증확인'}
                  </button>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '4px'
                }}>
                  이메일로 발송된 6자리 인증번호를 입력해주세요
                </div>
              </div>
            )}

            {/* 비밀번호 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text)',
                marginBottom: '6px'
              }}>
                비밀번호 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                placeholder="6자 이상 입력"
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-background)',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text)',
                marginBottom: '6px'
              }}>
                비밀번호 확인 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                value={signupForm.confirmPassword}
                onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                placeholder="비밀번호 재입력"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-background)',
                  color: 'var(--color-text)',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSignup();
                }}
              />
              {signupForm.confirmPassword && (
                <div style={{
                  fontSize: '11px',
                  color: signupForm.password === signupForm.confirmPassword ? '#10b981' : '#ef4444',
                  marginTop: '4px'
                }}>
                  {signupForm.password === signupForm.confirmPassword ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다'}
                </div>
              )}
            </div>

            {/* 회원가입 버튼 */}
            <button
              onClick={handleSignup}
              disabled={signingUp}
              style={{
                width: '100%',
                padding: '11px',
                background: signingUp ? '#9ca3af' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: signingUp ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginTop: '4px'
              }}
              onMouseEnter={(e) => {
                if (!signingUp) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {signingUp ? '가입 중...' : '이메일로 가입하기'}
            </button>

            {/* 소셜 로그인 구분선 */}
            <div style={{ position: 'relative', textAlign: 'center', margin: '16px 0 12px' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                width: '100%',
                height: '1px',
                background: 'linear-gradient(to right, transparent, var(--color-border), transparent)'
              }}></div>
              <span style={{
                position: 'relative',
                background: 'var(--color-surface)',
                padding: '0 12px',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                fontWeight: '500'
              }}>간편 가입</span>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 구글 */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={signingUp}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: signingUp ? 'not-allowed' : 'pointer',
                  opacity: signingUp ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}
                onMouseEnter={(e) => {
                  if (!signingUp) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!signingUp) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                구글로 가입하기
              </button>

              {/* 카카오 */}
              <button
                type="button"
                onClick={() => handleSocialLogin('kakao')}
                disabled={signingUp}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#FEE500',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: signingUp ? 'not-allowed' : 'pointer',
                  opacity: signingUp ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s',
                  boxShadow: '0 1px 3px rgba(254, 229, 0, 0.3)'
                }}
                onMouseEnter={(e) => !signingUp && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => !signingUp && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                카카오로 가입하기
              </button>

              {/* 네이버 */}
              <button
                type="button"
                onClick={() => handleSocialLogin('naver')}
                disabled={signingUp}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#03C75A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: signingUp ? 'not-allowed' : 'pointer',
                  opacity: signingUp ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s',
                  boxShadow: '0 1px 3px rgba(3, 199, 90, 0.3)'
                }}
                onMouseEnter={(e) => !signingUp && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => !signingUp && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                네이버로 가입하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: 'var(--color-text-secondary)'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      padding: '24px'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--color-text)',
          margin: 0
        }}>
          판매자 정보
        </h2>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            background: saving ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!saving) e.currentTarget.style.background = '#059669';
          }}
          onMouseLeave={(e) => {
            if (!saving) e.currentTarget.style.background = '#10b981';
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 섹션들을 4열로 배치하는 그리드 컨테이너 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {/* 기본 정보 섹션 */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--color-border)'
        }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '16px'
        }}>
          기본
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              이름
            </label>
            <input
              type="text"
              value={sellerInfo.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              이메일
            </label>
            <input
              type="email"
              value={sellerInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              전화번호
            </label>
            <input
              type="tel"
              value={sellerInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              maxLength={13}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>
        </div>
        </div>

        {/* 사업자 정보 섹션 */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--color-border)'
        }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '16px'
        }}>
          사업자
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              사업자명
            </label>
            <input
              type="text"
              value={sellerInfo.business_name || ''}
              onChange={(e) => handleChange('business_name', e.target.value)}
              placeholder="사업자명"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              주소
            </label>
            <input
              type="text"
              value={sellerInfo.business_address || ''}
              onChange={(e) => handleChange('business_address', e.target.value)}
              placeholder="주소"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              사업자등록번호
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={sellerInfo.business_number || ''}
                onChange={(e) => handleChange('business_number', e.target.value)}
                placeholder="000-00-00000"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  paddingRight: '60px',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--color-text)',
                  cursor: 'text'
                }}
              />
              <button
                onClick={handleVerifyBusinessNumber}
                disabled={verifying}
                type="button"
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px 8px',
                  background: verifying ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: verifying ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!verifying) e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  if (!verifying) e.currentTarget.style.background = '#3b82f6';
                }}
              >
                {verifying ? '조회중' : '조회'}
              </button>
            </div>
          </div>

          <div>
            {/* 이메일 라벨과 체크박스를 한 줄로 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text)'
              }}>
                이메일 (계산서)
              </label>

              {/* 기본 이메일과 동일 체크박스 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <input
                  type="checkbox"
                  id="sameAsEmail"
                  checked={isSameAsEmail}
                  onChange={(e) => {
                    setIsSameAsEmail(e.target.checked);
                    if (e.target.checked && sellerInfo.email) {
                      setSellerInfo(prev => ({ ...prev, business_email: prev.email }));
                    }
                  }}
                  style={{
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer'
                  }}
                />
                <label
                  htmlFor="sameAsEmail"
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  기본 이메일과 동일
                </label>
              </div>
            </div>

            <input
              type="email"
              value={sellerInfo.business_email || ''}
              onChange={(e) => handleChange('business_email', e.target.value)}
              disabled={isSameAsEmail}
              placeholder="example@company.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isSameAsEmail ? 'var(--color-background-secondary)' : 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: isSameAsEmail ? 'var(--color-text-secondary)' : 'var(--color-text)',
                cursor: isSameAsEmail ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              대표자명
            </label>
            <input
              type="text"
              value={sellerInfo.representative_name || ''}
              onChange={(e) => handleChange('representative_name', e.target.value)}
              placeholder="대표자명"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              대표자 연락처
            </label>
            <input
              type="tel"
              value={sellerInfo.representative_phone || ''}
              onChange={(e) => handleChange('representative_phone', e.target.value)}
              placeholder="010-0000-0000"
              maxLength={13}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>
        </div>
        </div>

        {/* 담당자 정보 섹션 */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--color-border)'
        }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '16px'
        }}>
          담당자
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              이름
            </label>
            <input
              type="text"
              value={sellerInfo.manager_name || ''}
              onChange={(e) => handleChange('manager_name', e.target.value)}
              placeholder="담당자 이름"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              연락처
            </label>
            <input
              type="tel"
              value={sellerInfo.manager_phone || ''}
              onChange={(e) => handleChange('manager_phone', e.target.value)}
              placeholder="010-0000-0000"
              maxLength={13}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>
        </div>
        </div>

        {/* 정산 계좌 정보 섹션 */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--color-border)'
        }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '16px'
        }}>
          정산 계좌
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              은행명
            </label>
            <input
              type="text"
              value={sellerInfo.bank_name || ''}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              placeholder="예: 국민은행"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              계좌번호
            </label>
            <input
              type="text"
              value={sellerInfo.bank_account || ''}
              onChange={(e) => handleChange('bank_account', e.target.value)}
              placeholder="'-' 없이 입력"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              예금주
            </label>
            <input
              type="text"
              value={sellerInfo.account_holder || ''}
              onChange={(e) => handleChange('account_holder', e.target.value)}
              placeholder="예금주명"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>
        </div>
        </div>

        {/* 입금 섹션 */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--color-border)'
        }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '16px'
        }}>
          입금
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text)'
              }}>
                입금자명
              </label>

              {/* 정산계좌 예금주와 동일 체크박스 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <input
                  type="checkbox"
                  id="sameAsAccountHolder"
                  checked={sellerInfo.depositor_name === sellerInfo.account_holder}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange('depositor_name', sellerInfo.account_holder || '');
                    } else {
                      handleChange('depositor_name', '');
                    }
                  }}
                  style={{
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer'
                  }}
                />
                <label
                  htmlFor="sameAsAccountHolder"
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  정산계좌 예금주와 동일
                </label>
              </div>
            </div>
            <input
              type="text"
              value={sellerInfo.depositor_name || ''}
              onChange={(e) => handleChange('depositor_name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>
        </div>
        </div>

        {/* 스토어 정보 섹션 - 2칸 차지 */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--color-border)',
          gridColumn: 'span 2'
        }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-text)',
            margin: 0
          }}>
            송장출력
          </h3>
          <span style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)'
          }}>
            택배 송장에 출력할 정보를 설정해주세요
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            {/* 업체명 라벨과 체크박스를 한 줄로 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text)'
              }}>
                업체명
              </label>

              {/* 사업자명과 동일 체크박스 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <input
                  type="checkbox"
                  id="sameAsBusinessName"
                  checked={isSameAsBusinessName}
                  onChange={(e) => {
                    setIsSameAsBusinessName(e.target.checked);
                    if (e.target.checked && sellerInfo.business_name) {
                      setSellerInfo(prev => ({ ...prev, store_name: prev.business_name }));
                    }
                  }}
                  style={{
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer'
                  }}
                />
                <label
                  htmlFor="sameAsBusinessName"
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  사업자명과 동일
                </label>
              </div>
            </div>

            <input
              type="text"
              value={sellerInfo.store_name || ''}
              onChange={(e) => handleChange('store_name', e.target.value)}
              disabled={isSameAsBusinessName}
              placeholder="업체명"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isSameAsBusinessName ? 'var(--color-background-secondary)' : 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: isSameAsBusinessName ? 'var(--color-text-secondary)' : 'var(--color-text)',
                cursor: isSameAsBusinessName ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              전화번호
            </label>
            <input
              type="tel"
              value={sellerInfo.store_phone || ''}
              onChange={(e) => handleChange('store_phone', e.target.value)}
              placeholder="010-0000-0000"
              maxLength={13}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                cursor: 'text'
              }}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
