// src/components/tools/BarcodeGenerator.jsx
import { useState } from 'react';

function BarcodeGenerator() {
  const [barcodeType, setBarcodeType] = useState('CODE128'); // CODE128, EAN13, QR
  const [inputMethod, setInputMethod] = useState('single'); // single, bulk
  
  const [singleInput, setSingleInput] = useState({
    value: '',
    label: '',
    price: '',
    quantity: 1
  });

  const [bulkInput, setBulkInput] = useState('');
  const [generatedBarcodes, setGeneratedBarcodes] = useState([]);
  const [printSettings, setPrintSettings] = useState({
    size: 'standard', // standard, small, large
    showLabel: true,
    showPrice: true,
    columns: 3,
    rows: 10
  });

  const generateBarcode = () => {
    if (inputMethod === 'single' && singleInput.value) {
      const newBarcode = {
        id: Date.now(),
        type: barcodeType,
        value: singleInput.value,
        label: singleInput.label,
        price: singleInput.price,
        quantity: parseInt(singleInput.quantity) || 1
      };
      setGeneratedBarcodes([...generatedBarcodes, newBarcode]);
      setSingleInput({ value: '', label: '', price: '', quantity: 1 });
    } else if (inputMethod === 'bulk' && bulkInput) {
      const lines = bulkInput.split('\n').filter(line => line.trim());
      const newBarcodes = lines.map((line, index) => {
        const [value, label, price] = line.split(',').map(item => item.trim());
        return {
          id: Date.now() + index,
          type: barcodeType,
          value: value || `ITEM${index + 1}`,
          label: label || '',
          price: price || '',
          quantity: 1
        };
      });
      setGeneratedBarcodes([...generatedBarcodes, ...newBarcodes]);
      setBulkInput('');
    }
  };

  const deleteBarcode = (id) => {
    setGeneratedBarcodes(generatedBarcodes.filter(barcode => barcode.id !== id));
  };

  const clearAll = () => {
    setGeneratedBarcodes([]);
  };

  const downloadCSV = () => {
    const csv = generatedBarcodes.map(barcode => 
      `${barcode.value},${barcode.label},${barcode.price}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barcodes.csv';
    a.click();
  };

  // 바코드 SVG 생성 (시뮬레이션)
  const BarcodeDisplay = ({ barcode }) => {
    const bars = Array(30).fill(0).map(() => Math.random() > 0.5 ? 1 : 0);
    
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center'
      }}>
        {barcodeType === 'QR' ? (
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 8px',
            background: '#ffffff',
            border: '1px solid #000',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            padding: '4px'
          }}>
            {Array(64).fill(0).map((_, idx) => (
              <div key={idx} style={{
                background: Math.random() > 0.5 ? '#000' : '#fff'
              }} />
            ))}
          </div>
        ) : (
          <svg width="120" height="60" style={{ margin: '0 auto' }}>
            {bars.map((bar, idx) => (
              <rect
                key={idx}
                x={idx * 4}
                y="10"
                width={bar ? 3 : 2}
                height="40"
                fill={bar ? '#000' : '#fff'}
                stroke={bar ? 'none' : '#000'}
                strokeWidth={bar ? 0 : 0.5}
              />
            ))}
          </svg>
        )}
        <div style={{ fontSize: '10px', fontFamily: 'monospace', marginTop: '4px' }}>
          {barcode.value}
        </div>
        {printSettings.showLabel && barcode.label && (
          <div style={{ fontSize: '12px', fontWeight: '500', marginTop: '4px' }}>
            {barcode.label}
          </div>
        )}
        {printSettings.showPrice && barcode.price && (
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', marginTop: '2px' }}>
            {barcode.price}원
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          바코드 생성기
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          상품 바코드를 대량으로 생성하고 인쇄합니다
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* 왼쪽: 입력 영역 */}
        <div>
          {/* 바코드 타입 선택 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              바코드 설정
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#495057',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                바코드 타입
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'CODE128', label: 'CODE-128' },
                  { value: 'EAN13', label: 'EAN-13' },
                  { value: 'QR', label: 'QR Code' }
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => setBarcodeType(type.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: barcodeType === type.value ? '#2563eb' : '#ffffff',
                      color: barcodeType === type.value ? '#ffffff' : '#495057',
                      border: `1px solid ${barcodeType === type.value ? '#2563eb' : '#dee2e6'}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#495057',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                입력 방식
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setInputMethod('single')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: inputMethod === 'single' ? '#2563eb' : '#ffffff',
                    color: inputMethod === 'single' ? '#ffffff' : '#495057',
                    border: `1px solid ${inputMethod === 'single' ? '#2563eb' : '#dee2e6'}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  개별 입력
                </button>
                <button
                  onClick={() => setInputMethod('bulk')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: inputMethod === 'bulk' ? '#2563eb' : '#ffffff',
                    color: inputMethod === 'bulk' ? '#ffffff' : '#495057',
                    border: `1px solid ${inputMethod === 'bulk' ? '#2563eb' : '#dee2e6'}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  일괄 입력
                </button>
              </div>
            </div>
          </div>

          {/* 입력 폼 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              바코드 정보 입력
            </h3>

            {inputMethod === 'single' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    바코드 값 *
                  </label>
                  <input
                    type="text"
                    value={singleInput.value}
                    onChange={(e) => setSingleInput({...singleInput, value: e.target.value})}
                    placeholder="123456789012"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    상품명
                  </label>
                  <input
                    type="text"
                    value={singleInput.label}
                    onChange={(e) => setSingleInput({...singleInput, label: e.target.value})}
                    placeholder="상품명 입력"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: '#495057',
                      marginBottom: '6px',
                      fontWeight: '500'
                    }}>
                      가격
                    </label>
                    <input
                      type="text"
                      value={singleInput.price}
                      onChange={(e) => setSingleInput({...singleInput, price: e.target.value})}
                      placeholder="10,000"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: '#495057',
                      marginBottom: '6px',
                      fontWeight: '500'
                    }}>
                      수량
                    </label>
                    <input
                      type="number"
                      value={singleInput.quantity}
                      onChange={(e) => setSingleInput({...singleInput, quantity: e.target.value})}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#495057',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  일괄 입력 (바코드값, 상품명, 가격)
                </label>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="123456789012, 상품1, 10000&#10;234567890123, 상품2, 20000&#10;345678901234, 상품3, 30000"
                  style={{
                    width: '100%',
                    height: '150px',
                    padding: '12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: '#6c757d',
                  marginTop: '8px'
                }}>
                  * 한 줄에 하나씩, 콤마로 구분
                </div>
              </div>
            )}

            <button
              onClick={generateBarcode}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '16px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              바코드 생성
            </button>
          </div>
        </div>

        {/* 오른쪽: 생성된 바코드 및 설정 */}
        <div>
          {/* 인쇄 설정 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              인쇄 설정
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#495057',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  크기
                </label>
                <select
                  value={printSettings.size}
                  onChange={(e) => setPrintSettings({...printSettings, size: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                >
                  <option value="small">소형 (30x20mm)</option>
                  <option value="standard">표준 (50x30mm)</option>
                  <option value="large">대형 (70x40mm)</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#495057',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  열 개수
                </label>
                <input
                  type="number"
                  value={printSettings.columns}
                  onChange={(e) => setPrintSettings({...printSettings, columns: e.target.value})}
                  min="1"
                  max="5"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '16px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={printSettings.showLabel}
                  onChange={(e) => setPrintSettings({...printSettings, showLabel: e.target.checked})}
                />
                <span style={{ fontSize: '13px' }}>상품명 표시</span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={printSettings.showPrice}
                  onChange={(e) => setPrintSettings({...printSettings, showPrice: e.target.checked})}
                />
                <span style={{ fontSize: '13px' }}>가격 표시</span>
              </label>
            </div>
          </div>

          {/* 생성된 바코드 목록 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600'
              }}>
                생성된 바코드 ({generatedBarcodes.length}개)
              </h3>
              {generatedBarcodes.length > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={downloadCSV}
                    style={{
                      padding: '6px 12px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    CSV 다운로드
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{
                      padding: '6px 12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    인쇄하기
                  </button>
                  <button
                    onClick={clearAll}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    전체 삭제
                  </button>
                </div>
              )}
            </div>

            {generatedBarcodes.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${printSettings.columns}, 1fr)`,
                gap: '12px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {generatedBarcodes.map(barcode => 
                  Array(barcode.quantity).fill(0).map((_, idx) => (
                    <div key={`${barcode.id}-${idx}`} style={{ position: 'relative' }}>
                      <BarcodeDisplay barcode={barcode} />
                      {idx === 0 && (
                        <button
                          onClick={() => deleteBarcode(barcode.id)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '20px',
                            height: '20px',
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '14px'
              }}>
                생성된 바코드가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarcodeGenerator;