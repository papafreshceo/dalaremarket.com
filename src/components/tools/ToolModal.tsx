'use client';

import { useEffect, useState, useRef } from 'react';
import MarginCalculator from './MarginCalculator';
import PriceSimulator from './PriceSimulator';
import OptionPricing from './OptionPricing';
import TrendAnalysis from './TrendAnalysis';
import CompetitorMonitor from './CompetitorMonitor';
import OrderIntegration from './OrderIntegration';

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId?: string;
  toolName?: string;
  onOpenSimulator?: () => void;
  zIndex?: number;
}

export default function ToolModal({ isOpen, onClose, toolId, toolName, onOpenSimulator, zIndex = 10000 }: ToolModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // 초기 위치 설정 (모달마다 약간씩 다르게)
  useEffect(() => {
    if (isOpen) {
      const offset = (zIndex - 10000) * 30;
      setPosition({ x: offset, y: offset });
    }
  }, [isOpen, zIndex]);

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // 버튼 클릭은 드래그 안함

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // 드래그 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: zIndex,
        pointerEvents: 'none'
      }}
    >
      <div
        ref={modalRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '1410px',
          width: 'calc(100vw - 100px)',
          maxHeight: '90vh',
          overflow: 'visible',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 (드래그 가능) */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            padding: '24px',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: 0
            }}>
              {toolName || '업무도구'}
            </h2>
            {toolId === 'order-integration' && (
              <p style={{
                fontSize: '14px',
                color: '#6c757d',
                margin: 0
              }}>
                여러 마켓의 주문 파일을 업로드하고 하나로 통합하세요
              </p>
            )}
          </div>

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
          maxHeight: 'calc(90vh - 120px)',
          overflowY: 'auto',
          paddingBottom: '40px'
        }}>
          {/* 도구별 콘텐츠 */}
          {renderToolContent(toolId, onOpenSimulator)}
        </div>
      </div>
    </div>
  );
}

// 도구별 콘텐츠 렌더링
function renderToolContent(toolId?: string, onOpenSimulator?: () => void) {
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
    'margin-calculator': <MarginCalculator onOpenSimulator={onOpenSimulator} />,
    'price-simulator': <PriceSimulator />,
    'option-pricing': <OptionPricing />,
    'order-integration': <OrderIntegration />,
    'trend-analysis': <TrendAnalysis />,
    'competitor-monitor': <CompetitorMonitor />,
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
