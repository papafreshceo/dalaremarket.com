'use client';

import { useEffect } from 'react';
import MarginCalculator from './MarginCalculator';
import PriceSimulator from './PriceSimulator';
import DiscountCalculator from './DiscountCalculator';
import BarcodeGenerator from './BarcodeGenerator';

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId?: string;
  toolName?: string;
}

export default function ToolModal({ isOpen, onClose, toolId, toolName }: ToolModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // 모달 열릴 때 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
        backdropFilter: 'blur(4px)',
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
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: 0
          }}>
            {toolName || '업무도구'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div style={{
          padding: '24px'
        }}>
          {/* 도구별 콘텐츠 */}
          {renderToolContent(toolId)}
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f8f9fa',
              color: '#495057',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e9ecef';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8f9fa';
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// 도구별 콘텐츠 렌더링
function renderToolContent(toolId?: string) {
  if (!toolId) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#6c757d'
      }}>
        도구를 선택해주세요.
      </div>
    );
  }

  // 각 도구별 컴포넌트
  const toolContents: Record<string, JSX.Element> = {
    'margin-calculator': <MarginCalculator />,
    'price-simulator': <PriceSimulator />,
    'discount-calculator': <DiscountCalculator />,
    'barcode-generator': <BarcodeGenerator />,
  };

  return toolContents[toolId] || (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
        {toolId}
      </h3>
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#495057'
      }}>
        <p style={{ marginBottom: '8px' }}>🚧 준비 중인 기능입니다</p>
        <p>곧 출시될 예정이오니 조금만 기다려주세요!</p>
      </div>
    </div>
  );
}
