// src/components/tools/OrderIntegration.jsx
import { useState } from 'react';

function OrderIntegration() {
  const [channels, setChannels] = useState([
    { id: 1, name: '쿠팡', enabled: true, orders: 234, lastSync: '2025-01-27 14:30' },
    { id: 2, name: '네이버 스토어팜', enabled: true, orders: 156, lastSync: '2025-01-27 14:25' },
    { id: 3, name: '11번가', enabled: false, orders: 89, lastSync: '2025-01-27 13:45' },
    { id: 4, name: 'G마켓', enabled: true, orders: 124, lastSync: '2025-01-27 14:15' },
    { id: 5, name: '위메프', enabled: false, orders: 45, lastSync: '2025-01-27 12:00' }
  ]);

  const [dateRange, setDateRange] = useState({
    start: '2025-01-20',
    end: '2025-01-27'
  });

  const [exportOptions, setExportOptions] = useState({
    includeCustomerInfo: true,
    includeProductDetails: true,
    includeShippingInfo: true,
    includePricing: true,
    separateByChannel: false,
    format: 'xlsx'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [recentExports, setRecentExports] = useState([
    { id: 1, date: '2025-01-26', channels: 4, orders: 523, filename: 'orders_20250126.xlsx' },
    { id: 2, date: '2025-01-25', channels: 3, orders: 412, filename: 'orders_20250125.xlsx' },
    { id: 3, date: '2025-01-24', channels: 4, orders: 489, filename: 'orders_20250124.xlsx' }
  ]);

  const toggleChannel = (id) => {
    setChannels(channels.map(ch => 
      ch.id === id ? { ...ch, enabled: !ch.enabled } : ch
    ));
  };

  const handleSync = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setChannels(channels.map(ch => ({
        ...ch,
        lastSync: ch.enabled ? now : ch.lastSync,
        orders: ch.enabled ? ch.orders + Math.floor(Math.random() * 10) : ch.orders
      })));
      setIsProcessing(false);
    }, 2000);
  };

  const handleExport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const totalOrders = channels.filter(ch => ch.enabled).reduce((sum, ch) => sum + ch.orders, 0);
      const newExport = {
        id: recentExports.length + 1,
        date: new Date().toLocaleDateString('ko-KR'),
        channels: channels.filter(ch => ch.enabled).length,
        orders: totalOrders,
        filename: `orders_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.${exportOptions.format}`
      };
      setRecentExports([newExport, ...recentExports].slice(0, 5));
      setIsProcessing(false);
      alert('Excel 파일이 다운로드되었습니다.');
    }, 2000);
  };

  const totalOrders = channels.filter(ch => ch.enabled).reduce((sum, ch) => sum + ch.orders, 0);

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
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          주문통합 (Excel)
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          여러 판매 채널의 주문을 하나의 Excel 파일로 통합 관리하세요
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* 왼쪽: 채널 선택 및 동기화 */}
        <div>
          {/* 채널 선택 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>판매 채널</h3>
              <button
                onClick={handleSync}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  background: isProcessing ? '#6c757d' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: isProcessing ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10C20.4 7.2 18.2 5 15.5 4.3V2L12 5.5L15.5 9V6.3C17.4 6.9 18.9 8.5 19.2 10.5C19.6 13 18 15.3 15.5 15.9C13 16.4 10.7 14.8 10.1 12.3C9.7 10.6 10.3 9 11.4 7.8L9.9 6.3C8.2 8 7.4 10.4 8 12.9C8.8 16.2 11.9 18.4 15.2 17.6C18.5 16.8 20.7 13.7 19.9 10.4L21 10Z" 
                    fill="currentColor"
                    style={{ animation: isProcessing ? 'spin 1s linear infinite' : 'none' }}
                  />
                </svg>
                {isProcessing ? '동기화 중...' : '전체 동기화'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {channels.map(channel => (
                <div
                  key={channel.id}
                  style={{
                    padding: '16px',
                    background: channel.enabled ? '#e7f3ff' : '#f8f9fa',
                    border: channel.enabled ? '1px solid #2563eb' : '1px solid #dee2e6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => toggleChannel(channel.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: channel.enabled ? '#2563eb' : '#ffffff',
                      border: channel.enabled ? 'none' : '2px solid #dee2e6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {channel.enabled && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="white"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{channel.name}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        마지막 동기화: {channel.lastSync}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    background: channel.enabled ? '#2563eb' : '#6c757d',
                    color: '#ffffff',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {channel.orders}건
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 기간 설정 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>기간 설정</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#495057',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  시작일
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
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
                  종료일
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
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

            {/* 빠른 선택 버튼 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px'
            }}>
              {['오늘', '어제', '최근 7일', '이번 달'].map(period => (
                <button
                  key={period}
                  style={{
                    padding: '6px 12px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e9ecef';
                    e.target.style.borderColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.borderColor = '#dee2e6';
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 내보내기 옵션 */}
        <div>
          {/* 내보내기 설정 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>내보내기 설정</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'includeCustomerInfo', label: '고객 정보 포함', desc: '이름, 연락처, 주소' },
                { key: 'includeProductDetails', label: '상품 상세 포함', desc: '옵션, SKU, 바코드' },
                { key: 'includeShippingInfo', label: '배송 정보 포함', desc: '송장번호, 배송사, 상태' },
                { key: 'includePricing', label: '금액 정보 포함', desc: '원가, 판매가, 할인, 마진' },
                { key: 'separateByChannel', label: '채널별 시트 분리', desc: '각 채널을 별도 시트로' }
              ].map(option => (
                <label
                  key={option.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: exportOptions[option.key] ? '#f8f9fa' : '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={exportOptions[option.key]}
                    onChange={(e) => setExportOptions({
                      ...exportOptions,
                      [option.key]: e.target.checked
                    })}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: exportOptions[option.key] ? '#2563eb' : '#ffffff',
                    border: exportOptions[option.key] ? 'none' : '2px solid #dee2e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    {exportOptions[option.key] && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="white"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{option.label}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* 파일 형식 선택 */}
            <div style={{ marginTop: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#495057',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                파일 형식
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'xlsx', label: 'Excel (.xlsx)' },
                  { value: 'csv', label: 'CSV (.csv)' },
                  { value: 'pdf', label: 'PDF (.pdf)' }
                ].map(format => (
                  <label
                    key={format.value}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: exportOptions.format === format.value ? '#2563eb' : '#ffffff',
                      color: exportOptions.format === format.value ? '#ffffff' : '#212529',
                      border: `1px solid ${exportOptions.format === format.value ? '#2563eb' : '#dee2e6'}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={exportOptions.format === format.value}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        format: e.target.value
                      })}
                      style={{ display: 'none' }}
                    />
                    {format.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 요약 및 내보내기 */}
          <div style={{
            background: 'linear-gradient(135deg, #e7f3ff 0%, #dbeafe 100%)',
            border: '1px solid #2563eb',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '16px' 
            }}>
              내보내기 요약
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#495057', marginBottom: '4px' }}>선택된 채널</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#2563eb' }}>
                  {channels.filter(ch => ch.enabled).length}개
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#495057', marginBottom: '4px' }}>총 주문 수</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#2563eb' }}>
                  {totalOrders.toLocaleString()}건
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={isProcessing || channels.filter(ch => ch.enabled).length === 0}
              style={{
                width: '100%',
                padding: '12px',
                background: isProcessing || channels.filter(ch => ch.enabled).length === 0 ? '#6c757d' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isProcessing || channels.filter(ch => ch.enabled).length === 0 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.02L12.01 11.01L8 15.01Z" fill="currentColor"/>
              </svg>
              {isProcessing ? '처리 중...' : 'Excel 파일로 내보내기'}
            </button>
          </div>
        </div>
      </div>

      {/* 최근 내보내기 기록 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>최근 내보내기 기록</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>날짜</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>채널 수</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>주문 수</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>파일명</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {recentExports.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{exp.date}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{exp.channels}개</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{exp.orders.toLocaleString()}건</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'monospace' }}>{exp.filename}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      다시 다운로드
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default OrderIntegration;