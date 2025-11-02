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
  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      loadSellerInfo();
    }
  }, [userId]);

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

  // 비회원 사용자 안내
  if (userId === 'guest') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        gap: '16px'
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#9ca3af' }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div style={{
          fontSize: '16px',
          fontWeight: '500',
          color: 'var(--color-text)'
        }}>
          로그인이 필요합니다
        </div>
        <div style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          textAlign: 'center'
        }}>
          판매자 정보를 등록하려면 회원가입 후 로그인해주세요.
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
