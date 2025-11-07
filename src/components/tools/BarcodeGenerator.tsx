'use client';

import { useState } from 'react';

export default function BarcodeGenerator() {
  const [barcodeType, setBarcodeType] = useState<'EAN13' | 'CODE128'>('EAN13');
  const [barcodeValue, setBarcodeValue] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');

  const [preview, setPreview] = useState<boolean>(false);

  const generateBarcode = () => {
    if (!barcodeValue.trim()) {
      alert('바코드 값을 입력해주세요.');
      return;
    }

    if (barcodeType === 'EAN13' && barcodeValue.length !== 13) {
      alert('EAN13 바코드는 13자리 숫자여야 합니다.');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      alert('수량은 1~100 사이로 입력해주세요.');
      return;
    }

    setPreview(true);
  };

  const handleReset = () => {
    setBarcodeValue('');
    setQuantity('1');
    setPreview(false);
  };

  return (
    <div>
      <p style={{
        fontSize: '14px',
        color: '#6c757d',
        lineHeight: '1.6',
        marginBottom: '24px'
      }}>
        상품 바코드를 생성하고 출력할 수 있습니다. (미리보기 기능)
      </p>

      {/* 입력 영역 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            바코드 타입
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setBarcodeType('EAN13')}
              style={{
                flex: 1,
                padding: '12px',
                background: barcodeType === 'EAN13' ? '#2563eb' : '#f8f9fa',
                color: barcodeType === 'EAN13' ? '#ffffff' : '#495057',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              EAN13 (13자리)
            </button>
            <button
              onClick={() => setBarcodeType('CODE128')}
              style={{
                flex: 1,
                padding: '12px',
                background: barcodeType === 'CODE128' ? '#2563eb' : '#f8f9fa',
                color: barcodeType === 'CODE128' ? '#ffffff' : '#495057',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              CODE128 (가변)
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            바코드 값
          </label>
          <input
            type="text"
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
            placeholder={barcodeType === 'EAN13' ? '13자리 숫자 (예: 8801234567890)' : '영문 또는 숫자'}
            maxLength={barcodeType === 'EAN13' ? 13 : undefined}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            생성 수량
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1~100"
            min="1"
            max="100"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={generateBarcode}
          style={{
            flex: 1,
            padding: '12px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          바코드 생성
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '12px 24px',
            background: '#6c757d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          초기화
        </button>
      </div>

      {/* 미리보기 */}
      {preview && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#495057'
          }}>
            바코드 미리보기
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {Array.from({ length: parseInt(quantity) || 1 }).map((_, index) => (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  textAlign: 'center'
                }}
              >
                {/* 바코드 시뮬레이션 (실제로는 라이브러리 필요) */}
                <div style={{
                  height: '80px',
                  background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)',
                  marginBottom: '8px',
                  borderRadius: '4px'
                }} />
                <div style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#495057',
                  fontWeight: '600'
                }}>
                  {barcodeValue}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            fontSize: '12px',
            color: '#6c757d',
            padding: '12px',
            background: '#e0f2fe',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            💡 실제 바코드 생성은 전문 라이브러리가 필요합니다. 현재는 미리보기 기능만 제공됩니다.
          </div>

          <button
            onClick={() => window.print()}
            style={{
              width: '100%',
              padding: '12px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            인쇄하기
          </button>
        </div>
      )}
    </div>
  );
}
