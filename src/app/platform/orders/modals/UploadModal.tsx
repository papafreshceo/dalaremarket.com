'use client';

import { RefObject } from 'react';

interface UploadModalProps {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  dragActive: boolean;
  handleDrag: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  handleFiles: (files: FileList) => void;
}

export default function UploadModal({
  showUploadModal,
  setShowUploadModal,
  dragActive,
  handleDrag,
  handleDrop,
  fileInputRef,
  handleFiles
}: UploadModalProps) {
  if (!showUploadModal) return null;

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
        width: '500px',
        maxWidth: '90%',
        padding: '32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#212529',
            margin: 0
          }}>
            발주서 엑셀 업로드
          </h2>
          <button
            onClick={() => setShowUploadModal(false)}
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

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#2563eb' : '#dee2e6'}`,
            borderRadius: '12px',
            padding: '48px 32px',
            textAlign: 'center',
            background: dragActive ? '#eff6ff' : '#fafafa',
            transition: 'all 0.2s'
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" stroke="#6c757d" strokeWidth="1.5" fill="none" style={{ margin: '0 auto 20px' }}>
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p style={{
            fontSize: '16px',
            color: '#212529',
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            파일을 드래그 앤 드롭하거나
          </p>
          <p style={{
            fontSize: '14px',
            color: '#6c757d',
            marginBottom: '20px'
          }}>
            아래 버튼을 클릭하여 선택하세요
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 24px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            파일 선택
          </button>
          <p style={{
            fontSize: '12px',
            color: '#6c757d',
            marginTop: '20px'
          }}>
            * .xlsx, .xls 파일만 업로드 가능합니다
          </p>
        </div>
      </div>
    </div>
  );
}
