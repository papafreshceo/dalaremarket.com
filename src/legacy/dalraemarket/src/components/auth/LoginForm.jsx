import { useState, useEffect } from 'react';

// ==================== LoginForm.jsx ====================
function LoginForm({ onClose, onModeChange }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = () => {
    if (!formData.email || !formData.password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    console.log('로그인 시도:', { email: formData.email });
    alert('로그인 되었습니다!');
    onClose();
  };

  return (
    <>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        marginBottom: '32px', 
        textAlign: 'center' 
      }}>로그인</h2>

      <input 
        type="email" 
        placeholder="이메일" 
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: '2px solid transparent',
          background: '#f8f9fa',
          borderRadius: '12px',
          fontSize: '14px',
          marginBottom: '12px',
          outline: 'none',
          transition: 'all 0.3s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#2563eb';
          e.target.style.background = '#ffffff';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'transparent';
          e.target.style.background = '#f8f9fa';
        }}
      />
      
      <input 
        type="password" 
        placeholder="비밀번호" 
        value={formData.password || ''}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: '2px solid transparent',
          background: '#f8f9fa',
          borderRadius: '12px',
          fontSize: '14px',
          marginBottom: '24px',
          outline: 'none',
          transition: 'all 0.3s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#2563eb';
          e.target.style.background = '#ffffff';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'transparent';
          e.target.style.background = '#f8f9fa';
        }}
      />

      <button 
        onClick={handleLogin}
        style={{
          width: '100%',
          padding: '14px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          marginBottom: '24px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        이메일로 로그인
      </button>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            width: '100%', 
            height: '1px', 
            background: 'linear-gradient(to right, transparent, #e0e0e0, transparent)' 
          }}></div>
          <span style={{ 
            position: 'relative', 
            background: 'white', 
            padding: '0 16px', 
            fontSize: '12px', 
            color: '#9ca3af', 
            fontWeight: '500' 
          }}>간편 로그인</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button style={{
            width: '100%',
            padding: '14px',
            background: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            구글로 로그인
          </button>
          
          <button style={{
            width: '100%',
            padding: '14px',
            background: '#FEE500',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 8px rgba(254, 229, 0, 0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            카카오로 로그인
          </button>
          
          <button style={{
            width: '100%',
            padding: '14px',
            background: '#03C75A',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 8px rgba(3, 199, 90, 0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            네이버로 로그인
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <a style={{
          fontSize: '13px',
          color: '#6b7280',
          cursor: 'pointer',
          textDecoration: 'none',
          marginRight: '16px'
        }}
        onMouseEnter={(e) => e.target.style.color = '#2563eb'}
        onMouseLeave={(e) => e.target.style.color = '#6b7280'}>
          비밀번호 찾기
        </a>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          아직 계정이 없으신가요?{' '}
          <a 
            onClick={() => onModeChange('signup')} 
            style={{
              color: '#2563eb',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >회원가입</a>
        </span>
      </div>
    </>
  );
}

export default LoginForm;