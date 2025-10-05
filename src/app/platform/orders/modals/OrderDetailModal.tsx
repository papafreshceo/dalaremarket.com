'use client';

import { Order, StatusConfig } from '../types';

interface OrderDetailModalProps {
  showDetailModal: boolean;
  setShowDetailModal: (show: boolean) => void;
  selectedOrder: Order | null;
  statusConfig: Record<Order['status'], StatusConfig>;
}

export default function OrderDetailModal({
  showDetailModal,
  setShowDetailModal,
  selectedOrder,
  statusConfig
}: OrderDetailModalProps) {
  if (!showDetailModal || !selectedOrder) return null;

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
      zIndex: 1000
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '600px',
        maxWidth: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        padding: '32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#212529',
            margin: 0
          }}>
            발주 상세정보
          </h2>
          <button
            onClick={() => setShowDetailModal(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#6c757d',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ×
          </button>
        </div>

        {/* 상태 진행바 */}
        <div style={{
          padding: '24px',
          background: 'rgba(248, 249, 250, 0.4)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '40px',
              right: '40px',
              height: '2px',
              background: '#dee2e6',
              zIndex: 0
            }}/>
            {(['registered', 'confirmed', 'preparing', 'shipped'] as const).map((status, idx) => {
              const isActive = (['registered', 'confirmed', 'preparing', 'shipped'] as const).indexOf(selectedOrder.status) >= idx;
              return (
                <div
                  key={status}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 1,
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isActive ? statusConfig[status].color : '#ffffff',
                    border: `2px solid ${isActive ? statusConfig[status].color : '#dee2e6'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: isActive ? statusConfig[status].color : '#6c757d',
                    fontWeight: isActive ? '500' : '400'
                  }}>
                    {statusConfig[status].label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 상세 정보 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              fontSize: '12px',
              color: '#6c757d',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              발주번호
            </label>
            <div style={{
              fontSize: '14px',
              color: '#212529',
              fontWeight: '500'
            }}>
              {selectedOrder.orderNo}
            </div>
          </div>
          <div>
            <label style={{
              fontSize: '12px',
              color: '#6c757d',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              발주일시
            </label>
            <div style={{
              fontSize: '14px',
              color: '#212529'
            }}>
              {selectedOrder.registeredAt || selectedOrder.date}
            </div>
          </div>
          <div>
            <label style={{
              fontSize: '12px',
              color: '#6c757d',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              현재 상태
            </label>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '500',
              background: statusConfig[selectedOrder.status].bg,
              color: statusConfig[selectedOrder.status].color
            }}>
              {statusConfig[selectedOrder.status].label}
            </span>
          </div>
          {selectedOrder.trackingNo && (
            <>
              <div>
                <label style={{
                  fontSize: '12px',
                  color: '#6c757d',
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  송장번호
                </label>
                <div style={{
                  fontSize: '14px',
                  color: '#2563eb',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  {selectedOrder.trackingNo}
                </div>
              </div>
              <div>
                <label style={{
                  fontSize: '12px',
                  color: '#6c757d',
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  예상 도착일
                </label>
                <div style={{
                  fontSize: '14px',
                  color: '#212529'
                }}>
                  {selectedOrder.expectedDelivery}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{
          borderTop: '1px solid #dee2e6',
          paddingTop: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#212529',
            marginBottom: '16px'
          }}>
            주문 상품
          </h3>
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#495057' }}>
                {selectedOrder.products}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  수량: {selectedOrder.quantity}개
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529' }}>
                  ₩{selectedOrder.amount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '28px'
        }}>
          <button
            onClick={() => setShowDetailModal(false)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#6c757d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            닫기
          </button>
          {selectedOrder.status === 'registered' && (
            <button
              style={{
                flex: 1,
                padding: '12px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              발주 확정
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
