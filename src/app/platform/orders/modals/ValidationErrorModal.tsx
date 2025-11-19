'use client';

interface ValidationErrorModalProps {
  show: boolean;
  onClose: () => void;
  errors: string[];
  onDownloadTemplate?: () => void;
}

export default function ValidationErrorModal({ show, onClose, errors, onDownloadTemplate }: ValidationErrorModalProps) {
  if (!show) return null;

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
        animation: 'fadeIn 0.3s ease-in-out'
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '70vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'scaleIn 0.3s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#ef4444',
              fontWeight: '700'
            }}>
              !
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444', margin: 0 }}>
              필수 칼럼 누락
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            업로드하신 파일에 필수 칼럼이 누락된 주문건이 있습니다. 파일을 수정한 후 다시 업로드해주세요.
          </p>
        </div>

        {/* 에러 목록 */}
        <div style={{
          background: '#fef2f2',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {errors.map((error, index) => (
            <div
              key={index}
              style={{
                padding: '8px 0',
                borderBottom: index < errors.length - 1 ? '1px solid #fecaca' : 'none',
                fontSize: '13px',
                color: '#991b1b'
              }}
            >
              • {error}
            </div>
          ))}
        </div>

        {/* 필수 칼럼 안내 */}
        <div style={{
          background: '#f0f9ff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
            필수 칼럼 목록
          </div>
          <div style={{ fontSize: '13px', color: '#075985', lineHeight: '1.6' }}>
            • 수령인<br />
            • 수령인전화번호<br />
            • 주소<br />
            • 옵션상품 또는 옵션코드 (둘 중 하나는 필수)<br />
            • 수량
          </div>
        </div>

        {/* 안내 문구 */}
        <div
          onClick={onDownloadTemplate}
          style={{
          textAlign: 'center',
          fontSize: '13px',
          color: onDownloadTemplate ? '#2563eb' : '#6b7280',
          marginBottom: '16px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '6px',
          cursor: onDownloadTemplate ? 'pointer' : 'default',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (onDownloadTemplate) {
            e.currentTarget.style.background = '#eff6ff';
            e.currentTarget.style.color = '#1d4ed8';
          }
        }}
        onMouseLeave={(e) => {
          if (onDownloadTemplate) {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.color = '#2563eb';
          }
        }}
        >
          발주서 양식을 사용하세요
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ef4444';
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
