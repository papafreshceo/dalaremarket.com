interface ValidationErrorModalProps {
  show: boolean;
  onClose: () => void;
  errors: string[];
}

export default function ValidationErrorModal({ show, onClose, errors }: ValidationErrorModalProps) {
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
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '70vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
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
              fontSize: '20px'
            }}>
              ⚠️
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
            📋 필수 칼럼 목록
          </div>
          <div style={{ fontSize: '13px', color: '#075985', lineHeight: '1.6' }}>
            • 수령인<br />
            • 수령인전화번호<br />
            • 주소<br />
            • 옵션명 또는 옵션코드 (둘 중 하나는 필수)<br />
            • 수량
          </div>
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
