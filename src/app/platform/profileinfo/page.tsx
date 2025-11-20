'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast, { Toaster } from 'react-hot-toast';

interface SellerInfo {
  name: string;
  email: string;
  phone: string;
  profile_name?: string;
}

export default function ProfileInfoPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState('');
  const [originalProfileName, setOriginalProfileName] = useState('');
  const [message, setMessage] = useState('');
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [checkingProfileName, setCheckingProfileName] = useState(false);
  const [profileNameCheckResult, setProfileNameCheckResult] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  // 회원탈퇴 state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadUserData();
    }
  }, [isMounted]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('사용자 데이터 로드 오류:', error);
        toast.error('사용자 정보를 불러오는데 실패했습니다.');
        return;
      }

      if (data) {
        const loadedInfo: SellerInfo = {
          name: data.name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          profile_name: data.profile_name || '',
        };

        setSellerInfo(prev => ({ ...prev, ...loadedInfo }));
        setProfileName(data.profile_name || '');
        setOriginalProfileName(data.profile_name || '');
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SellerInfo, value: string) => {
    setSellerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckProfileName = async () => {
    const trimmedName = profileName.trim();

    if (!trimmedName) {
      toast.error('프로필 이름을 입력해주세요.');
      return;
    }

    if (trimmedName === originalProfileName) {
      setProfileNameCheckResult({
        checked: true,
        available: true,
        message: '현재 사용 중인 프로필 이름입니다.'
      });
      return;
    }

    setCheckingProfileName(true);

    try {
      const response = await fetch('/api/users/check-profile-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_name: trimmedName })
      });

      const data = await response.json();

      setProfileNameCheckResult({
        checked: true,
        available: data.available,
        message: data.message
      });

      if (data.available) {
        toast.success('사용 가능한 프로필 이름입니다.');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('프로필 이름 확인 오류:', error);
      toast.error('프로필 이름 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingProfileName(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    const profileNameChanged = profileName.trim() !== originalProfileName;

    if (profileNameChanged) {
      if (!profileNameCheckResult || !profileNameCheckResult.available) {
        toast.error('프로필 이름 중복 확인을 완료해주세요.');
        return;
      }
    }

    setSavingBasicInfo(true);

    try {
      const response = await fetch('/api/users/update-basic-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sellerInfo.name,
          phone: sellerInfo.phone,
          profile_name: profileName.trim() || null
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('기본정보가 저장되었습니다.');
        setOriginalProfileName(profileName.trim());
        setProfileNameCheckResult(null);
        await loadUserData();
      } else {
        toast.error(data.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingBasicInfo(false);
    }
  };

  // 회원 탈퇴 처리
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '회원탈퇴') {
      toast.error('"회원탈퇴"를 정확히 입력해주세요.');
      return;
    }

    setDeleting(true);
    try {
      // API 호출로 auth.users 삭제 (CASCADE로 모든 데이터 자동 삭제)
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('회원 탈퇴 API 오류:', data);
        const errorMsg = data.details ? `${data.error}\n상세: ${data.details}` : data.error;
        throw new Error(errorMsg || '회원 탈퇴 중 오류가 발생했습니다.');
      }

      toast.success('회원 탈퇴가 완료되었습니다.');

      // 로그아웃 처리
      await supabase.auth.signOut();
      localStorage.removeItem('ordersActiveTab');

      // 메인 페이지로 이동
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error: any) {
      console.error('회원 탈퇴 오류:', error);
      toast.error(error.message || '회원 탈퇴 중 오류가 발생했습니다.');
      setDeleting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <Toaster position="top-center" />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#212529',
            marginBottom: '8px'
          }}>프로필 정보</h1>
        </div>

        {loading ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '16px',
              color: '#6c757d'
            }}>로딩 중...</div>
          </div>
        ) : (
          <>
            {/* 메시지 */}
            {message && (
              <div style={{
                padding: '12px 16px',
                background: message.includes('✅') ? '#d1e7dd' : '#f8d7da',
                color: message.includes('✅') ? '#0f5132' : '#842029',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                {message}
              </div>
            )}

            {/* 기본정보 섹션 */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '24px',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#212529',
                  margin: 0
                }}>기본정보</h2>

                <button
                  onClick={handleSaveBasicInfo}
                  disabled={savingBasicInfo}
                  style={{
                    padding: '10px 20px',
                    background: savingBasicInfo
                      ? '#adb5bd'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: savingBasicInfo ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!savingBasicInfo) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {savingBasicInfo ? '저장 중...' : '저장'}
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px'
              }}>
                {/* 이메일 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>이메일</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#f8f9fa',
                      color: '#6c757d'
                    }}
                  />
                </div>

                {/* 이름 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>이름</label>
                  <input
                    type="text"
                    value={sellerInfo.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  />
                </div>

                {/* 전화번호 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>전화번호</label>
                  <input
                    type="tel"
                    value={sellerInfo.phone || ''}
                    onChange={(e) => {
                      if (!(e.nativeEvent as any).isComposing) {
                        handleChange('phone', e.target.value);
                      }
                    }}
                    onCompositionEnd={(e) => {
                      handleChange('phone', (e.target as HTMLInputElement).value);
                    }}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  />
                </div>

                {/* 프로필 이름 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>프로필 이름</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => {
                        setProfileName(e.target.value);
                        setProfileNameCheckResult(null);
                      }}
                      placeholder="프로필 이름을 입력하세요"
                      maxLength={10}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        paddingRight: '80px',
                        border: `1px solid ${
                          profileNameCheckResult
                            ? (profileNameCheckResult.available ? '#10b981' : '#ef4444')
                            : '#dee2e6'
                        }`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border 0.2s'
                      }}
                      onFocus={(e) => {
                        if (!profileNameCheckResult) {
                          e.target.style.borderColor = '#3b82f6';
                        }
                      }}
                      onBlur={(e) => {
                        if (!profileNameCheckResult) {
                          e.target.style.borderColor = '#dee2e6';
                        }
                      }}
                    />
                    <button
                      onClick={handleCheckProfileName}
                      disabled={checkingProfileName || !profileName.trim()}
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '6px 12px',
                        background: checkingProfileName || !profileName.trim() ? '#adb5bd' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: checkingProfileName || !profileName.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!checkingProfileName && profileName.trim()) {
                          e.currentTarget.style.background = '#2563eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!checkingProfileName && profileName.trim()) {
                          e.currentTarget.style.background = '#3b82f6';
                        }
                      }}
                    >
                      {checkingProfileName ? '확인 중...' : '중복확인'}
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '6px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: profileNameCheckResult
                        ? (profileNameCheckResult.available ? '#10b981' : '#ef4444')
                        : '#6c757d'
                    }}>
                      {profileNameCheckResult
                        ? (profileNameCheckResult.available ? '✓ ' : '✗ ') + profileNameCheckResult.message
                        : (profileName.trim() !== originalProfileName && profileName.trim()
                          ? '프로필 이름 중복 확인이 필요합니다'
                          : '')}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d'
                    }}>
                      {profileName.length}/10자
                    </div>
                  </div>
                </div>
              </div>

              {/* 안내 메시지 */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#6c757d',
                lineHeight: '1.6'
              }}>
                프로필이름은 랭킹 프로필, 셀러피드 게시글과 댓글에 표시됩니다. 기본값으로 이메일 @앞부분이 표시됩니다. 최대 10자까지 설정가능합니다.
              </div>
            </div>

            {/* 회원 탈퇴 섹션 */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: isMounted && window.innerWidth <= 768 ? '20px' : '32px',
              marginTop: '24px',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)',
              border: '2px solid #fee',
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#dc3545'
              }}>회원 탈퇴</h3>

              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13px',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#856404', display: 'block', marginBottom: '8px' }}>
                  ⚠️ 회원 탈퇴 시 주의사항
                </strong>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: '#856404'
                }}>
                  <li>셀러계정 및 서브계정이 모두 삭제됩니다 (셀러계정의 담당자일 경우 소속된 셀러계정은 유지)</li>
                  <li><strong>이 작업은 되돌릴 수 없습니다</strong></li>
                </ul>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '12px 24px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#c82333'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dc3545'}
              >
                회원 탈퇴
              </button>
            </div>
          </>
        )}
      </div>

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#dc3545'
            }}>
              정말 탈퇴하시겠습니까?
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#6c757d',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              회원 탈퇴를 진행하시려면 아래 입력란에 <strong>"회원탈퇴"</strong>를 입력해주세요.
              <br />
              <strong style={{ color: '#dc3545' }}>이 작업은 되돌릴 수 없습니다.</strong>
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="회원탈퇴"
              disabled={deleting}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '20px',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#dc3545'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            />

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== '회원탈퇴'}
                style={{
                  padding: '10px 20px',
                  background: deleteConfirmText === '회원탈퇴' && !deleting ? '#dc3545' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: deleteConfirmText === '회원탈퇴' && !deleting ? 'pointer' : 'not-allowed',
                }}
              >
                {deleting ? '탈퇴 처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
