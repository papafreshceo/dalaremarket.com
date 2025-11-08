'use client';

import { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface PasswordModalProps {
  show: boolean;
  fileName: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export default function PasswordModal({
  show,
  fileName,
  onSubmit,
  onCancel
}: PasswordModalProps) {
  const [password, setPassword] = useState('');

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
      setPassword('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '500px',
        maxWidth: '95%',
        border: '1px solid #dee2e6',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={20} color="white" />
            </div>
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#212529',
                margin: 0
              }}>
                암호화된 파일
              </h2>
              <p style={{
                fontSize: '13px',
                color: '#6c757d',
                margin: '4px 0 0 0'
              }}>
                비밀번호를 입력하세요
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#6c757d',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* 크롬 비밀번호 저장 방지용 숨겨진 필드 */}
          <input type="text" style={{ display: 'none' }} autoComplete="off" />
          <input type="password" style={{ display: 'none' }} autoComplete="new-password" />

          <div style={{ padding: '24px' }}>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#212529',
                margin: '0 0 4px 0',
                fontWeight: '500'
              }}>
                파일명:
              </p>
              <p style={{
                fontSize: '13px',
                color: '#6c757d',
                margin: '0 0 12px 0',
                wordBreak: 'break-all'
              }}>
                {fileName}
              </p>
              <div style={{
                padding: '12px',
                background: '#fef3c7',
                borderRadius: '6px',
                border: '1px solid #fbbf24'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#92400e',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  💡 <strong>도움말:</strong> 비밀번호가 작동하지 않으면 엑셀에서 "다른 이름으로 저장" → "도구" → "일반 옵션"에서 암호를 제거한 후 다시 업로드해주세요.
                </p>
              </div>
            </div>

            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#212529',
              marginBottom: '8px'
            }}>
              비밀번호
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="파일 비밀번호를 입력하세요"
              autoFocus
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              name={`pwd-${Date.now()}`}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#212529',
                background: '#ffffff',
                boxSizing: 'border-box',
                WebkitTextSecurity: 'disc' as any
              }}
            />
          </div>

          {/* 푸터 */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                background: '#ffffff',
                color: '#212529',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!password.trim()}
              style={{
                padding: '10px 20px',
                background: password.trim() ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' : '#dee2e6',
                color: password.trim() ? 'white' : '#6c757d',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: password.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
