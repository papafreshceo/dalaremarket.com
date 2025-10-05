// src/components/tools/InventoryTracker.jsx
import { useState } from 'react';

function InventoryTracker() {
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [inventory, setInventory] = useState([
    { 
      id: 1, 
      name: '유기농 토마토 1kg', 
      sku: 'TOM-001',
      current: 45, 
      minimum: 20, 
      maximum: 100,
      incoming: 50,
      reserved: 12,
      available: 33,
      lastUpdate: '2025-01-27 14:30',
      status: 'normal',
      trend: 'up'
    },
    {
      id: 2,
      name: '프리미엄 딸기 500g',
      sku: 'STR-002',
      current: 15,
      minimum: 30,
      maximum: 150,
      incoming: 100,
      reserved: 8,
      available: 7,
      lastUpdate: '2025-01-27 13:15',
      status: 'low',
      trend: 'down'
    },
    {
      id: 3,
      name: '친환경 사과 3kg',
      sku: 'APL-003',
      current: 0,
      minimum: 25,
      maximum: 120,
      incoming: 80,
      reserved: 0,
      available: 0,
      lastUpdate: '2025-01-27 12:00',
      status: 'out',
      trend: 'stable'
    },
    {
      id: 4,
      name: '신선 양배추',
      sku: 'CAB-004',
      current: 180,
      minimum: 50,
      maximum: 200,
      incoming: 0,
      reserved: 45,
      available: 135,
      lastUpdate: '2025-01-27 15:00',
      status: 'overstock',
      trend: 'up'
    }
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'low', message: '프리미엄 딸기 재고 부족 (15개)', time: '10분 전' },
    { id: 2, type: 'out', message: '친환경 사과 품절', time: '2시간 전' },
    { id: 3, type: 'incoming', message: '토마토 50개 입고 예정', time: '내일 오전' }
  ]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'normal': return '#10b981';
      case 'low': return '#f59e0b';
      case 'out': return '#ef4444';
      case 'overstock': return '#8b5cf6';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'normal': return '정상';
      case 'low': return '부족';
      case 'out': return '품절';
      case 'overstock': return '과잉';
      default: return '알 수 없음';
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateStock = (id, field, value) => {
    setInventory(inventory.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          재고 추적기
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          실시간 재고 현황을 모니터링하고 알림을 설정하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          { label: '전체 상품', value: inventory.length, color: '#2563eb', icon: '📦' },
          { label: '정상 재고', value: inventory.filter(i => i.status === 'normal').length, color: '#10b981', icon: '✅' },
          { label: '재고 부족', value: inventory.filter(i => i.status === 'low').length, color: '#f59e0b', icon: '⚠️' },
          { label: '품절', value: inventory.filter(i => i.status === 'out').length, color: '#ef4444', icon: '❌' }
        ].map((stat, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: `${stat.color}15`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: stat.color }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 알림 섹션 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>실시간 알림</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{
              padding: '12px',
              background: alert.type === 'out' ? '#fee2e2' : alert.type === 'low' ? '#fef3c7' : '#dbeafe',
              borderLeft: `3px solid ${alert.type === 'out' ? '#ef4444' : alert.type === 'low' ? '#f59e0b' : '#2563eb'}`,
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '13px', color: '#495057' }}>{alert.message}</span>
              <span style={{ fontSize: '11px', color: '#6c757d' }}>{alert.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'normal', 'low', 'out', 'overstock'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '8px 16px',
                background: filterStatus === status ? '#2563eb' : '#ffffff',
                color: filterStatus === status ? '#ffffff' : '#495057',
                border: `1px solid ${filterStatus === status ? '#2563eb' : '#dee2e6'}`,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {status === 'all' ? '전체' : getStatusLabel(status)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="상품명 또는 SKU 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '250px',
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px',
                background: viewMode === 'grid' ? '#2563eb' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#6c757d',
                border: '1px solid #dee2e6',
                borderRadius: '6px 0 0 6px',
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px',
                background: viewMode === 'list' ? '#2563eb' : '#ffffff',
                color: viewMode === 'list' ? '#ffffff' : '#6c757d',
                border: '1px solid #dee2e6',
                borderRadius: '0 6px 6px 0',
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 재고 목록 */}
      {viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {filteredInventory.map(item => (
            <div key={item.id} style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '16px'
              }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                    {item.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    SKU: {item.sku}
                  </div>
                </div>
                <span style={{
                  padding: '4px 8px',
                  background: `${getStatusColor(item.status)}15`,
                  color: getStatusColor(item.status),
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {getStatusLabel(item.status)}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>현재 재고</div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: '600',
                    color: getStatusColor(item.status),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {item.current}
                    <span style={{ fontSize: '14px' }}>{getTrendIcon(item.trend)}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>가용 재고</div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {item.available}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>최소</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.minimum}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>입고예정</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#2563eb' }}>+{item.incoming}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>예약</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#ef4444' }}>-{item.reserved}</div>
                </div>
              </div>

              <div style={{ 
                fontSize: '11px', 
                color: '#6c757d',
                textAlign: 'center'
              }}>
                마지막 업데이트: {item.lastUpdate}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>상품명</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>SKU</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>현재</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>가용</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>최소</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>입고예정</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>상태</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{item.name}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontFamily: 'monospace' }}>{item.sku}</td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: getStatusColor(item.status)
                  }}>
                    {item.current} {getTrendIcon(item.trend)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{item.available}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{item.minimum}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#2563eb' }}>+{item.incoming}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: `${getStatusColor(item.status)}15`,
                      color: getStatusColor(item.status),
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button style={{
                      padding: '6px 12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InventoryTracker;