'use client';

import { X } from 'lucide-react';
import SellerExcelTab from '../components/SellerExcelTab';

interface MarketFileUploadModalProps {
  show: boolean;
  onClose: () => void;
  onOrdersUploaded: () => void;
  userId: string; // UUID
  userEmail: string; // Email for display
  selectedSubAccount?: any | null;
}

export default function MarketFileUploadModal({
  show,
  onClose,
  onOrdersUploaded,
  userId,
  userEmail,
  selectedSubAccount
}: MarketFileUploadModalProps) {
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
        zIndex: 9999,
        padding: '20px',
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
        id="modal-content-container"
        style={{
          background: 'var(--color-background)',
          borderRadius: '12px',
          width: '95%',
          maxWidth: '1400px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'scaleIn 0.3s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'var(--color-background)',
            borderBottom: '1px solid var(--color-border)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10
          }}
        >
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--color-text)'
          }}>
            마켓파일 업로드
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={24} style={{ color: 'var(--color-text)' }} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <SellerExcelTab
          onClose={onClose}
          onOrdersUploaded={onOrdersUploaded}
          userId={userId}
          userEmail={userEmail}
          selectedSubAccount={selectedSubAccount}
        />
      </div>
    </div>
  );
}
