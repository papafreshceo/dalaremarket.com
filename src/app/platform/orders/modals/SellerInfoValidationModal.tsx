'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SellerInfoValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userId: string;
}

interface UserInfo {
  bank_account?: string;
  bank_name?: string;
  account_holder?: string;
  depositor_name?: string;
  representative_name?: string;
  representative_phone?: string;
  manager_name?: string;
  manager_phone?: string;
}

export default function SellerInfoValidationModal({
  isOpen,
  onClose,
  onConfirm,
  userId
}: SellerInfoValidationModalProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAllRequiredInfo, setHasAllRequiredInfo] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserInfo();
    }
  }, [isOpen, userId]);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('bank_account, bank_name, account_holder, representative_name, representative_phone, manager_name, manager_phone')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // depositor_name은 선택적으로 추가 조회 (칼럼이 없을 수도 있음)
      let depositorName = '';
      try {
        const { data: extraData } = await supabase
          .from('users')
          .select('depositor_name')
          .eq('id', userId)
          .single();
        depositorName = extraData?.depositor_name || '';
      } catch (e) {
        // depositor_name 칼럼이 없으면 빈 값으로 처리
      }

      const loadedInfo = {
        bank_account: data?.bank_account || '',
        bank_name: data?.bank_name || '',
        account_holder: data?.account_holder || '',
        depositor_name: depositorName,
        representative_name: data?.representative_name || '',
        representative_phone: data?.representative_phone || '',
        manager_name: data?.manager_name || '',
        manager_phone: data?.manager_phone || '',
      };

      setUserInfo(loadedInfo);

      // 필수 정보가 모두 입력되어 있는지 확인 (입금자명 제외)
      const allRequired =
        loadedInfo.bank_account?.trim() &&
        loadedInfo.bank_name?.trim() &&
        loadedInfo.account_holder?.trim() &&
        loadedInfo.representative_name?.trim() &&
        loadedInfo.representative_phone?.trim() &&
        loadedInfo.manager_name?.trim() &&
        loadedInfo.manager_phone?.trim();

      setHasAllRequiredInfo(!!allRequired);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      toast.error('사용자 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UserInfo, value: string) => {
    // 전화번호 필드인 경우 포맷팅 적용 (3-4-4)
    if (field === 'representative_phone' || field === 'manager_phone') {
      const numbers = value.replace(/[^0-9]/g, '');
      let formatted = numbers;

      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 7) {
        formatted = numbers.slice(0, 3) + '-' + numbers.slice(3);
      } else {
        formatted = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
      }

      setUserInfo(prev => ({ ...prev, [field]: formatted }));
    } else {
      setUserInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  // 각 섹션별 입력 여부 확인
  const hasDepositorName = !!userInfo.depositor_name?.trim();
  const hasAccountInfo = !!(userInfo.bank_account?.trim() && userInfo.bank_name?.trim() && userInfo.account_holder?.trim());
  const hasRepresentativeInfo = !!(userInfo.representative_name?.trim() && userInfo.representative_phone?.trim());
  const hasManagerInfo = !!(userInfo.manager_name?.trim() && userInfo.manager_phone?.trim());

  const validateInfo = () => {
    const errors: string[] = [];

    if (!userInfo.bank_account || !userInfo.bank_account.trim()) {
      errors.push('정산 계좌번호');
    }
    if (!userInfo.bank_name || !userInfo.bank_name.trim()) {
      errors.push('은행명');
    }
    if (!userInfo.account_holder || !userInfo.account_holder.trim()) {
      errors.push('예금주');
    }
    if (!userInfo.depositor_name || !userInfo.depositor_name.trim()) {
      errors.push('입금자명');
    }
    if (!userInfo.representative_name || !userInfo.representative_name.trim()) {
      errors.push('대표자명');
    }
    if (!userInfo.representative_phone || !userInfo.representative_phone.trim()) {
      errors.push('대표자 연락처');
    }
    if (!userInfo.manager_name || !userInfo.manager_name.trim()) {
      errors.push('담당자명');
    }
    if (!userInfo.manager_phone || !userInfo.manager_phone.trim()) {
      errors.push('담당자 연락처');
    }

    if (errors.length > 0) {
      toast.error(`다음 정보를 입력해주세요: ${errors.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleSaveAndConfirm = async () => {
    if (!validateInfo()) {
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();

      // 기본 정보 업데이트
      const { error } = await supabase
        .from('users')
        .update({
          bank_account: userInfo.bank_account,
          bank_name: userInfo.bank_name,
          account_holder: userInfo.account_holder,
          representative_name: userInfo.representative_name,
          representative_phone: userInfo.representative_phone,
          manager_name: userInfo.manager_name,
          manager_phone: userInfo.manager_phone,
        })
        .eq('id', userId);

      if (error) throw error;

      // depositor_name은 별도로 업데이트 시도 (칼럼이 없을 수도 있음)
      if (userInfo.depositor_name) {
        try {
          await supabase
            .from('users')
            .update({ depositor_name: userInfo.depositor_name })
            .eq('id', userId);
        } catch (e) {
        }
      }

      toast.success('정보가 저장되었습니다');
      onConfirm();
    } catch (error) {
      console.error('정보 저장 실패:', error);
      toast.error('정보 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--color-surface)',
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--color-text)',
            margin: 0
          }}>
            판매자 정보 확인
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-secondary)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: saving ? 0.5 : 1
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 본문 */}
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
              정보를 불러오는 중...
            </div>
          ) : (
            <>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                marginBottom: '24px',
                lineHeight: '1.6'
              }}>
                입금완료 및 발주확정을 진행하기 위해서는 아래 정보가 필요합니다.<br />
                빈 항목을 모두 입력해주세요.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 입금자명 - 입력되지 않은 경우만 표시 */}
                {!hasDepositorName && (
                  <div style={{
                    padding: '16px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24'
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#92400e',
                      marginBottom: '12px'
                    }}>
                      입금 정보
                    </h3>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#92400e',
                        marginBottom: '6px'
                      }}>
                        입금자명 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.depositor_name || ''}
                        onChange={(e) => handleChange('depositor_name', e.target.value)}
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#ffffff',
                          border: `2px solid ${!userInfo.depositor_name?.trim() ? '#ef4444' : '#fbbf24'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#000',
                          cursor: saving ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 정산 계좌 정보 - 입력되지 않은 경우만 표시 */}
                {!hasAccountInfo && (
                <div style={{
                  padding: '16px',
                  background: 'var(--color-background-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '12px'
                  }}>
                    정산 계좌 정보
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
                        은행명 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.bank_name || ''}
                        onChange={(e) => handleChange('bank_name', e.target.value)}
                        placeholder="은행명"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!userInfo.bank_name?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text'
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
                        계좌번호 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.bank_account || ''}
                        onChange={(e) => handleChange('bank_account', e.target.value)}
                        placeholder="'-' 없이 입력"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!userInfo.bank_account?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text'
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
                        예금주 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.account_holder || ''}
                        onChange={(e) => handleChange('account_holder', e.target.value)}
                        placeholder="예금주명"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!userInfo.account_holder?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* 대표자 정보 - 입력되지 않은 경우만 표시 */}
                {!hasRepresentativeInfo && (
                <div style={{
                  padding: '16px',
                  background: 'var(--color-background-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '12px'
                  }}>
                    대표자 정보
                  </h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        marginBottom: '6px'
                      }}>
                        대표자명 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.representative_name || ''}
                        onChange={(e) => handleChange('representative_name', e.target.value)}
                        placeholder="대표자명"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!userInfo.representative_name?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        marginBottom: '6px'
                      }}>
                        대표자 연락처 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.representative_phone || ''}
                        onChange={(e) => handleChange('representative_phone', e.target.value)}
                        placeholder="010-0000-0000"
                        maxLength={13}
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!userInfo.representative_phone?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>
                </div>
                )}

                {/* 담당자 정보 - 입력되지 않은 경우만 표시 */}
                {!hasManagerInfo && (
                <div style={{
                  padding: '16px',
                  background: 'var(--color-background-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: '12px'
                  }}>
                    담당자 정보
                  </h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        marginBottom: '6px'
                      }}>
                        담당자명 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.manager_name || ''}
                        onChange={(e) => handleChange('manager_name', e.target.value)}
                        placeholder="담당자명"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!userInfo.manager_name?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        marginBottom: '6px'
                      }}>
                        담당자 연락처 <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userInfo.manager_phone || ''}
                        onChange={(e) => handleChange('manager_phone', e.target.value)}
                        placeholder="010-0000-0000"
                        maxLength={13}
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!userInfo.manager_phone?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>
                </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          background: 'var(--color-surface)'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--color-text)',
              background: 'var(--color-surface)',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            취소
          </button>
          <button
            onClick={handleSaveAndConfirm}
            disabled={saving || loading}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              cursor: (saving || loading) ? 'not-allowed' : 'pointer',
              opacity: (saving || loading) ? 0.7 : 1
            }}
          >
            {saving ? '저장 중...' : '확인 및 계속'}
          </button>
        </div>
      </div>
    </div>
  );
}
