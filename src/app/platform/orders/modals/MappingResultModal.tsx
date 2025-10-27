'use client';

import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface MappingResult {
  original: string;
  mapped: string;
  count: number;
}

interface MappingResultModalProps {
  show: boolean;
  onClose: () => void;
  onContinue: () => void;
  results: MappingResult[];
  totalOrders: number;
  mappedOrders: number;
}

export default function MappingResultModal({
  show,
  onClose,
  onContinue,
  results,
  totalOrders,
  mappedOrders
}: MappingResultModalProps) {
  if (!show) return null;

  const unmappedCount = totalOrders - mappedOrders;

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
      zIndex: 2500,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        width: '600px',
        maxWidth: '95%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-border)'
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--color-text)',
              margin: '0 0 8px 0'
            }}>
              옵션명 자동 변환 결과
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              margin: 0
            }}>
              옵션명매핑 설정에 따라 자동으로 변환되었습니다
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 통계 */}
        <div style={{
          padding: '20px 24px',
          background: 'var(--color-surface-hover)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          gap: '24px',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>전체 주문:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text)', marginLeft: '8px' }}>
              {totalOrders}건
            </span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>변환 성공:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#059669', marginLeft: '8px' }}>
              {mappedOrders}건
            </span>
          </div>
          {unmappedCount > 0 && (
            <div>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>변환 실패:</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626', marginLeft: '8px' }}>
                {unmappedCount}건
              </span>
            </div>
          )}
        </div>

        {/* 변환 결과 목록 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 24px',
          background: 'var(--color-surface-hover)'
        }}>
          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    background: 'var(--color-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <CheckCircle size={18} color="#059669" />
                    <span style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      fontWeight: '500'
                    }}>
                      {result.count}건 변환됨
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      flex: 1,
                      fontSize: '14px',
                      color: '#dc2626',
                      fontWeight: '500',
                      textDecoration: 'line-through'
                    }}>
                      {result.original}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: 'var(--color-text-secondary)'
                    }}>
                      →
                    </span>
                    <span style={{
                      flex: 1,
                      fontSize: '14px',
                      color: '#059669',
                      fontWeight: '600'
                    }}>
                      {result.mapped}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--color-text-secondary)'
            }}>
              변환된 옵션명이 없습니다
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-surface-hover)'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {unmappedCount > 0 ? (
              <>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} color="#dc2626" />
                변환되지 않은 옵션명이 {unmappedCount}건 있습니다
              </>
            ) : (
              <>
                <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} color="#059669" />
                모든 옵션명이 성공적으로 변환되었습니다
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              onClick={onContinue}
              style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {unmappedCount > 0 ? '계속 진행' : '발주서 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
