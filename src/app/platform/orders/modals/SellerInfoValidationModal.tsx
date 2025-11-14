'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SellerInfoValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userId: string;
  organizationId?: string;
}

interface OrgInfo {
  bank_account?: string;
  bank_name?: string;
  account_holder?: string;
  representative_name?: string;
  representative_phone?: string;
  manager_name?: string;
  manager_phone?: string;
}

export default function SellerInfoValidationModal({
  isOpen,
  onClose,
  onConfirm,
  userId,
  organizationId
}: SellerInfoValidationModalProps) {
  const [orgInfo, setOrgInfo] = useState<OrgInfo>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && organizationId) {
      loadOrgInfo();
    }
  }, [isOpen, organizationId]);

  const loadOrgInfo = async () => {
    try {
      setLoading(true);

      if (!organizationId) {
        throw new Error('조직 ID가 없습니다');
      }

      // 직접 supabase로 조직 정보 조회
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('bank_account, bank_name, account_holder, representative_name, representative_phone, manager_name, manager_phone')
        .eq('id', organizationId)
        .single();

      if (orgError || !orgData) {
        throw new Error('조직 정보 조회 실패');
      }

      setOrgInfo(orgData || {});
    } catch (error) {
      console.error('조직 정보 로드 실패:', error);
      toast.error('조직 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof OrgInfo, value: string) => {
    // 전화번호 필드인 경우 포맷팅 적용 (3-4-4)
    if (field === 'representative_phone' || field === 'manager_phone') {
      // 숫자만 추출
      const numbers = value.replace(/[^0-9]/g, '');

      // 최대 11자리까지만
      const limitedNumbers = numbers.slice(0, 11);

      // 포맷팅
      let formatted = limitedNumbers;
      if (limitedNumbers.length > 3 && limitedNumbers.length <= 7) {
        formatted = limitedNumbers.slice(0, 3) + '-' + limitedNumbers.slice(3);
      } else if (limitedNumbers.length > 7) {
        formatted = limitedNumbers.slice(0, 3) + '-' + limitedNumbers.slice(3, 7) + '-' + limitedNumbers.slice(7);
      }

      setOrgInfo(prev => ({ ...prev, [field]: formatted }));
    }
    // 계좌번호 필드인 경우 숫자만 허용
    else if (field === 'bank_account') {
      const numbers = value.replace(/[^0-9]/g, '');
      setOrgInfo(prev => ({ ...prev, [field]: numbers }));
    }
    // 그 외 필드
    else {
      setOrgInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateInfo = () => {
    const errors: string[] = [];

    if (!orgInfo.bank_account?.trim()) errors.push('정산 계좌번호');
    if (!orgInfo.bank_name?.trim()) errors.push('은행명');
    if (!orgInfo.account_holder?.trim()) errors.push('예금주');
    if (!orgInfo.representative_name?.trim()) errors.push('대표자명');
    if (!orgInfo.representative_phone?.trim()) errors.push('대표자 연락처');
    if (!orgInfo.manager_name?.trim()) errors.push('담당자명');
    if (!orgInfo.manager_phone?.trim()) errors.push('담당자 연락처');

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

    if (!organizationId) {
      toast.error('조직 ID가 없습니다');
      return;
    }

    try {
      setSaving(true);

      // 직접 supabase로 조직 정보 업데이트
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          bank_account: orgInfo.bank_account,
          bank_name: orgInfo.bank_name,
          account_holder: orgInfo.account_holder,
          representative_name: orgInfo.representative_name,
          representative_phone: orgInfo.representative_phone,
          manager_name: orgInfo.manager_name,
          manager_phone: orgInfo.manager_phone,
        })
        .eq('id', organizationId);

      if (updateError) {
        throw new Error('정보 저장 실패');
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

  // 각 섹션별 입력 여부 확인
  const hasAccountInfo = !!(orgInfo.bank_account?.trim() && orgInfo.bank_name?.trim() && orgInfo.account_holder?.trim());
  const hasRepresentativeInfo = !!(orgInfo.representative_name?.trim() && orgInfo.representative_phone?.trim());
  const hasManagerInfo = !!(orgInfo.manager_name?.trim() && orgInfo.manager_phone?.trim());

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
            셀러계정 정보 확인
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
                {/* 정산 계좌 정보 */}
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
                        value={orgInfo.bank_name || ''}
                        onChange={(e) => handleChange('bank_name', e.target.value)}
                        placeholder="은행명"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!orgInfo.bank_name?.trim() ? '#ef4444' : 'var(--color-border)'}`,
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
                        inputMode="numeric"
                        value={orgInfo.bank_account || ''}
                        onChange={(e) => handleChange('bank_account', e.target.value)}
                        placeholder="'-' 없이 숫자만 입력"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!orgInfo.bank_account?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text',
                          imeMode: 'disabled'
                        } as React.CSSProperties}
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
                        value={orgInfo.account_holder || ''}
                        onChange={(e) => handleChange('account_holder', e.target.value)}
                        placeholder="예금주명"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!orgInfo.account_holder?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 대표자 정보 */}
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
                        value={orgInfo.representative_name || ''}
                        onChange={(e) => handleChange('representative_name', e.target.value)}
                        placeholder="대표자명"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!orgInfo.representative_name?.trim() ? '#ef4444' : 'var(--color-border)'}`,
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
                        type="tel"
                        value={orgInfo.representative_phone || ''}
                        onChange={(e) => handleChange('representative_phone', e.target.value)}
                        placeholder="010-0000-0000"
                        maxLength={13}
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!orgInfo.representative_phone?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text',
                          imeMode: 'disabled'
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>

                {/* 담당자 정보 */}
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
                        value={orgInfo.manager_name || ''}
                        onChange={(e) => handleChange('manager_name', e.target.value)}
                        placeholder="담당자명"
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!orgInfo.manager_name?.trim() ? '#ef4444' : 'var(--color-border)'}`,
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
                        type="tel"
                        value={orgInfo.manager_phone || ''}
                        onChange={(e) => handleChange('manager_phone', e.target.value)}
                        placeholder="010-0000-0000"
                        maxLength={13}
                        disabled={saving}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--color-surface)',
                          border: `1px solid ${!orgInfo.manager_phone?.trim() ? '#ef4444' : 'var(--color-border)'}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          cursor: saving ? 'not-allowed' : 'text',
                          imeMode: 'disabled'
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>
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
