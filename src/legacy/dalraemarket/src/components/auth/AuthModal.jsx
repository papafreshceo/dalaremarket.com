import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

function AuthModal({ isOpen, onClose, initialMode = 'login', isMobile }) {
  const [mode, setMode] = useState(initialMode);

  // initialMode가 변경될 때마다 mode 업데이트
  useEffect(() => {
    if (isOpen) {  // 모달이 열릴 때만 모드 변경
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  const handleClose = () => {
    // 모달을 닫을 때 모드를 초기화하지 않음
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={handleClose}>
      <div style={{
        background: 'white',
        width: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '12px',
        padding: '40px',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        
        <button onClick={handleClose} style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          color: '#999',
          cursor: 'pointer'
        }}>×</button>

        {mode === 'login' ? (
          <LoginForm onClose={handleClose} onModeChange={setMode} />
        ) : (
          <SignupForm onClose={handleClose} onModeChange={setMode} />
        )}
      </div>
    </div>
  );
}

export default AuthModal;