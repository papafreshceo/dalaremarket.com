// src/components/tools/ToolModal.jsx
import { useEffect } from 'react';
import { toolComponents } from './index';

function ToolModal({ isOpen, onClose, toolId, toolName }) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 선택된 도구 컴포넌트 가져오기
  const ToolComponent = toolComponents[toolId];
  
  console.log('ToolModal - toolId:', toolId);
  console.log('ToolModal - toolComponents:', toolComponents);
  console.log('ToolModal - ToolComponent found:', !!ToolComponent);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8f9fa'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: 0
          }}>
            {toolName}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#6c757d',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8f9fa';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ffffff';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>

        {/* 모달 바디 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '32px'
        }}>
          {ToolComponent ? (
            <ToolComponent onClose={onClose} />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6c757d'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                opacity: 0.5
              }}>
                🔧
              </div>
              <p style={{ fontSize: '16px' }}>
                도구를 불러오는 중 문제가 발생했습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default ToolModal;