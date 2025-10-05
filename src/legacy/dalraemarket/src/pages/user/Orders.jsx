// src/pages/user/OrderSystem.jsx
import { useState, useRef, useEffect } from 'react';
import UserHeader from '../../components/layout/UserHeader';

function Orders() {
  const [orders, setOrders] = useState([
    { id: 1, orderNo: 'ORD-2024-0001', products: '양파 외 3건', amount: 580000, quantity: 120, status: 'registered', date: '2024-01-15', registeredAt: '2024-01-15 09:30' },
    { id: 2, orderNo: 'ORD-2024-0002', products: '토마토 외 5건', amount: 1250000, quantity: 200, status: 'confirmed', date: '2024-01-15', confirmedAt: '2024-01-15 10:15', paymentMethod: '계좌이체' },
    { id: 3, orderNo: 'ORD-2024-0003', products: '감자 외 2건', amount: 380000, quantity: 80, status: 'preparing', date: '2024-01-14', confirmedAt: '2024-01-14 14:20' },
    { id: 4, orderNo: 'ORD-2024-0004', products: '대파 외 4건', amount: 920000, quantity: 150, status: 'shipped', date: '2024-01-14', shippedAt: '2024-01-14 16:00', trackingNo: 'CJ1234567890', expectedDelivery: '2024-01-16' },
    { id: 5, orderNo: 'ORD-2024-0005', products: '배추 외 1건', amount: 450000, quantity: 60, status: 'cancelRequested', date: '2024-01-13', cancelRequestedAt: '2024-01-14 11:00', cancelReason: '주문 실수' },
    { id: 6, orderNo: 'ORD-2024-0006', products: '당근 외 3건', amount: 680000, quantity: 100, status: 'cancelled', date: '2024-01-13', cancelledAt: '2024-01-13 15:30' },
    { id: 7, orderNo: 'ORD-2024-0007', products: '시금치 외 2건', amount: 320000, quantity: 70, status: 'shipped', date: '2024-01-13', shippedAt: '2024-01-13 14:00', trackingNo: 'CJ1234567891' },
    { id: 8, orderNo: 'ORD-2024-0008', products: '브로콜리 외 4건', amount: 890000, quantity: 130, status: 'confirmed', date: '2024-01-12', confirmedAt: '2024-01-12 11:30' },
    { id: 9, orderNo: 'ORD-2024-0009', products: '파프리카 외 3건', amount: 750000, quantity: 110, status: 'preparing', date: '2024-01-12', confirmedAt: '2024-01-12 09:45' },
    { id: 10, orderNo: 'ORD-2024-0010', products: '상추 외 2건', amount: 280000, quantity: 50, status: 'shipped', date: '2024-01-11', shippedAt: '2024-01-11 15:20', trackingNo: 'CJ1234567892' },
    { id: 11, orderNo: 'ORD-2024-0011', products: '오이 외 5건', amount: 420000, quantity: 90, status: 'registered', date: '2024-01-11', registeredAt: '2024-01-11 10:00' },
    { id: 12, orderNo: 'ORD-2024-0012', products: '가지 외 3건', amount: 560000, quantity: 85, status: 'confirmed', date: '2024-01-10', confirmedAt: '2024-01-10 14:15' },
    { id: 13, orderNo: 'ORD-2024-0013', products: '호박 외 2건', amount: 340000, quantity: 65, status: 'shipped', date: '2024-01-10', shippedAt: '2024-01-10 16:30', trackingNo: 'CJ1234567893' },
    { id: 14, orderNo: 'ORD-2024-0014', products: '고구마 외 4건', amount: 980000, quantity: 160, status: 'preparing', date: '2024-01-09', confirmedAt: '2024-01-09 11:00' },
    { id: 15, orderNo: 'ORD-2024-0015', products: '옥수수 외 1건', amount: 410000, quantity: 75, status: 'registered', date: '2024-01-09', registeredAt: '2024-01-09 08:45' },
    { id: 16, orderNo: 'ORD-2024-0016', products: '청경채 외 3건', amount: 520000, quantity: 95, status: 'confirmed', date: '2024-01-08', confirmedAt: '2024-01-08 13:20' },
    { id: 17, orderNo: 'ORD-2024-0017', products: '깻잎 외 2건', amount: 290000, quantity: 55, status: 'shipped', date: '2024-01-08', shippedAt: '2024-01-08 17:00', trackingNo: 'CJ1234567894' },
    { id: 18, orderNo: 'ORD-2024-0018', products: '미나리 외 4건', amount: 630000, quantity: 105, status: 'preparing', date: '2024-01-07', confirmedAt: '2024-01-07 10:30' },
    { id: 19, orderNo: 'ORD-2024-0019', products: '쪽파 외 2건', amount: 370000, quantity: 68, status: 'registered', date: '2024-01-07', registeredAt: '2024-01-07 09:15' },
    { id: 20, orderNo: 'ORD-2024-0020', products: '부추 외 3건', amount: 480000, quantity: 88, status: 'confirmed', date: '2024-01-06', confirmedAt: '2024-01-06 15:45' }
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const statusConfig = {
    registered: { label: '발주서등록', color: '#2563eb', bg: '#dbeafe' },
    confirmed: { label: '발주서확정', color: '#7c3aed', bg: '#ede9fe' },
    preparing: { label: '상품준비중', color: '#f59e0b', bg: '#fef3c7' },
    shipped: { label: '발송완료', color: '#10b981', bg: '#d1fae5' },
    cancelRequested: { label: '취소요청', color: '#ef4444', bg: '#fee2e2' },
    cancelled: { label: '취소완료', color: '#6b7280', bg: '#f3f4f6' }
  };

  const statsData = [
    { status: 'registered', count: orders.filter(o => o.status === 'registered').length, bgGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' },
    { status: 'confirmed', count: orders.filter(o => o.status === 'confirmed').length, bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
    { status: 'preparing', count: orders.filter(o => o.status === 'preparing').length, bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    { status: 'shipped', count: orders.filter(o => o.status === 'shipped').length, bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
    { status: 'cancelRequested', count: orders.filter(o => o.status === 'cancelRequested').length, bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' },
    { status: 'cancelled', count: orders.filter(o => o.status === 'cancelled').length, bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    console.log('Files:', files);
    alert('엑셀 파일이 업로드되었습니다.');
    setShowUploadModal(false);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.products.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <UserHeader />
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '70px',
        paddingLeft: isMobile ? '20px' : '40px',
        paddingRight: isMobile ? '20px' : '40px',
        paddingBottom: isMobile ? '20px' : '40px',
        minHeight: '100vh',
        overflow: 'hidden'
      }}>
        {/* 배경 그라데이션 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 300px, #93c5fd 600px, #bfdbfe 900px, #dbeafe 1200px, #f0f9ff 1500px, #ffffff 1800px, #ffffff 100%)',
          zIndex: -3
        }} />
        
        <div style={{
          position: 'absolute',
          top: '400px',
          left: 0,
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at 0% 50%, rgba(187, 247, 208, 0.4) 0%, transparent 60%)',
          zIndex: -2
        }} />
        
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1600px',
          height: '1200px',
          background: 'radial-gradient(ellipse at 100% 0%, rgba(139, 92, 246, 0.5) 0%, transparent 60%)',
          zIndex: -1
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* 헤더 영역 */}
          <div style={{
            marginBottom: '32px'
          }}>
            <h1 style={{
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: '600',
              color: '#212529',
              margin: 0,
              marginBottom: '8px'
            }}>
              나의 발주 관리
            </h1>
            <p style={{
              color: '#6c757d',
              margin: 0,
              fontSize: '14px'
            }}>
              발주 내역을 확인하고 새로운 주문을 등록하세요
            </p>
          </div>

          {/* 통계 대시보드 섹션 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '32px',
            marginBottom: '32px',
            border: '1px solid rgba(222, 226, 230, 0.5)'
          }}>
            {/* 대시보드 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: '600',
                color: '#212529',
                margin: 0
              }}>
                발주 통계 대시보드
              </h2>
              <select style={{
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#495057',
                background: '#ffffff',
                cursor: 'pointer'
              }}>
                <option>2025년 1월</option>
                <option>2024년 12월</option>
                <option>2024년 11월</option>
              </select>
            </div>

            {/* 발주 캘린더 */}
            <div style={{
              background: 'rgba(248, 249, 250, 0.8)',
              backdropFilter: 'blur(5px)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '28px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#212529',
                  margin: 0
                }}>
                  월간 발주 일정
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <button style={{
                    padding: '6px',
                    background: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="#6c757d" strokeWidth="2" fill="none">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#212529',
                    minWidth: '100px',
                    textAlign: 'center'
                  }}>
                    2025년 1월
                  </span>
                  <button style={{
                    padding: '6px',
                    background: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="#6c757d" strokeWidth="2" fill="none">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '12px'
              }}>
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                  <div key={idx} style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: idx === 0 ? '#ef4444' : idx === 6 ? '#2563eb' : '#6c757d',
                    padding: '4px 0'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px'
              }}>
                {/* 이전 달 날짜 (비활성) */}
                {[29, 30, 31].map(day => (
                  <div key={`prev-${day}`} style={{
                    padding: '8px 4px',
                    textAlign: 'center',
                    color: '#cbd5e1',
                    fontSize: '13px'
                  }}>
                    {day}
                  </div>
                ))}
                {/* 현재 달 날짜 */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                  const isToday = day === 15;
                  const hasOrder = [5, 8, 12, 15, 18, 22, 25, 28].includes(day);
                  const orderCount = hasOrder ? Math.floor(Math.random() * 5) + 1 : 0;
                  const dayOfWeek = (day + 2) % 7; // 1일이 수요일
                  
                  return (
                    <div key={day} style={{
                      position: 'relative',
                      background: isToday ? 'rgba(37, 99, 235, 0.1)' : hasOrder ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                      border: isToday ? '2px solid #2563eb' : hasOrder ? '1px solid #dee2e6' : 'none',
                      borderRadius: '8px',
                      padding: '8px 4px',
                      minHeight: '60px',
                      cursor: hasOrder ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (hasOrder && !isToday) {
                        e.currentTarget.style.background = 'rgba(219, 234, 254, 0.8)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasOrder && !isToday) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: isToday ? '600' : '500',
                        color: dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#2563eb' : isToday ? '#2563eb' : '#212529'
                      }}>
                        {day}
                      </span>
                      {hasOrder && (
                        <>
                          <div style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            {orderCount}건
                          </div>
                          <div style={{
                            fontSize: '9px',
                            color: '#10b981',
                            fontWeight: '500'
                          }}>
                            ₩{(orderCount * 450).toLocaleString()}K
                          </div>
                        </>
                      )}
                      {isToday && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          background: '#2563eb',
                          color: '#ffffff',
                          borderRadius: '3px',
                          padding: '1px 4px',
                          fontSize: '8px',
                          fontWeight: '600'
                        }}>
                          오늘
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* 다음 달 날짜 (비활성) */}
                {[1].map(day => (
                  <div key={`next-${day}`} style={{
                    padding: '8px 4px',
                    textAlign: 'center',
                    color: '#cbd5e1',
                    fontSize: '13px'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* 캘린더 범례 */}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(222, 226, 230, 0.5)',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    border: '2px solid #2563eb',
                    borderRadius: '3px'
                  }} />
                  <span style={{ color: '#6c757d' }}>오늘</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #dee2e6',
                    borderRadius: '3px'
                  }} />
                  <span style={{ color: '#6c757d' }}>발주일</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '9px',
                    fontWeight: '500'
                  }}>
                    N건
                  </div>
                  <span style={{ color: '#6c757d' }}>발주 건수</span>
                </div>
              </div>
            </div>

            {/* 주요 지표 카드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '28px'
            }}>
              {/* 이번달 발주액 */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                borderRadius: '12px',
                padding: '20px',
                color: '#ffffff'
              }}>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.9,
                  marginBottom: '8px'
                }}>
                  이번달 발주액
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  ₩8,450,000
                </div>
                <div style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ color: '#34d399' }}>▲</span>
                  <span>전월 대비 +12.5%</span>
                </div>
              </div>

              {/* 어제 발주액 */}
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                borderRadius: '12px',
                padding: '20px',
                color: '#ffffff'
              }}>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.9,
                  marginBottom: '8px'
                }}>
                  어제 발주액
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  ₩520,000
                </div>
                <div style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ color: '#fbbf24' }}>▼</span>
                  <span>전일 대비 -8.2%</span>
                </div>
              </div>

              {/* 평균 주문액 */}
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '12px',
                padding: '20px',
                color: '#ffffff'
              }}>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.9,
                  marginBottom: '8px'
                }}>
                  평균 주문액
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  ₩680,000
                </div>
                <div style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ color: '#34d399' }}>▲</span>
                  <span>전월 대비 +5.8%</span>
                </div>
              </div>

              {/* 총 발주 건수 */}
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                borderRadius: '12px',
                padding: '20px',
                color: '#ffffff'
              }}>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.9,
                  marginBottom: '8px'
                }}>
                  총 발주 건수
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  156건
                </div>
                <div style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ color: '#34d399' }}>▲</span>
                  <span>전월 대비 +22건</span>
                </div>
              </div>
            </div>

            {/* 차트 영역 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '20px'
            }}>
              {/* 월별 발주 추이 */}
              <div style={{
                background: 'rgba(248, 249, 250, 0.8)',
                backdropFilter: 'blur(5px)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: '16px'
                }}>
                  월별 발주 추이
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: '120px',
                  gap: '8px'
                }}>
                  {[60, 45, 75, 85, 70, 90, 95].map((height, idx) => (
                    <div key={idx} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{
                        width: '100%',
                        height: `${height}%`,
                        background: idx === 6 ? '#2563eb' : '#93c5fd',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s'
                      }} />
                      <span style={{
                        fontSize: '10px',
                        color: '#6c757d'
                      }}>
                        {['7월', '8월', '9월', '10월', '11월', '12월', '1월'][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 판매채널별 발주 비율 */}
              <div style={{
                background: 'rgba(248, 249, 250, 0.8)',
                backdropFilter: 'blur(5px)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: '16px'
                }}>
                  판매채널별 발주 비율
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  {/* 도넛 차트 */}
                  <div style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px'
                  }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="20" 
                        strokeDasharray="75.4 226.2" transform="rotate(-90 50 50)"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20"
                        strokeDasharray="62.8 226.2" strokeDashoffset="-75.4" transform="rotate(-90 50 50)"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20"
                        strokeDasharray="50.3 226.2" strokeDashoffset="-138.2" transform="rotate(-90 50 50)"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20"
                        strokeDasharray="37.7 226.2" strokeDashoffset="-188.5" transform="rotate(-90 50 50)"/>
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#212529'
                      }}>
                        100%
                      </div>
                    </div>
                  </div>
                  {/* 범례 */}
                  <div style={{ flex: 1 }}>
                    {[
                      { label: '온라인몰', value: '35%', color: '#2563eb' },
                      { label: '오프라인', value: '28%', color: '#10b981' },
                      { label: 'B2B', value: '22%', color: '#f59e0b' },
                      { label: '기타', value: '15%', color: '#8b5cf6' }
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            background: item.color,
                            borderRadius: '2px'
                          }} />
                          <span style={{
                            fontSize: '12px',
                            color: '#495057'
                          }}>
                            {item.label}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#212529'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 품목별 발주 TOP 5 */}
              <div style={{
                background: 'rgba(248, 249, 250, 0.8)',
                backdropFilter: 'blur(5px)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: '16px'
                }}>
                  품목별 발주 TOP 5
                </h3>
                <div>
                  {[
                    { name: '토마토', amount: '₩2,450,000', percent: 85 },
                    { name: '딸기', amount: '₩1,980,000', percent: 70 },
                    { name: '양파', amount: '₩1,520,000', percent: 55 },
                    { name: '감자', amount: '₩980,000', percent: 40 },
                    { name: '대파', amount: '₩650,000', percent: 25 }
                  ].map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '12px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#495057'
                        }}>
                          {idx + 1}. {item.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#212529'
                        }}>
                          {item.amount}
                        </span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: '#dee2e6',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${item.percent}%`,
                          height: '100%',
                          background: '#2563eb',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 일별 발주 현황 */}
              <div style={{
                background: 'rgba(248, 249, 250, 0.8)',
                backdropFilter: 'blur(5px)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: '16px'
                }}>
                  최근 7일 발주 현황
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: '100px',
                  gap: '8px'
                }}>
                  {[
                    { day: '월', value: 45, amount: '520K' },
                    { day: '화', value: 75, amount: '850K' },
                    { day: '수', value: 60, amount: '680K' },
                    { day: '목', value: 85, amount: '920K' },
                    { day: '금', value: 70, amount: '780K' },
                    { day: '토', value: 30, amount: '350K' },
                    { day: '일', value: 95, amount: '1.2M' }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        fontSize: '10px',
                        color: '#495057',
                        fontWeight: '500'
                      }}>
                        {item.amount}
                      </span>
                      <div style={{
                        width: '100%',
                        height: `${item.value}%`,
                        background: idx === 6 ? '#10b981' : '#93c5fd',
                        borderRadius: '4px 4px 0 0'
                      }} />
                      <span style={{
                        fontSize: '10px',
                        color: '#6c757d'
                      }}>
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 상단 통계 카드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {statsData.map((stat, index) => (
              <div
                key={stat.status}
                onClick={() => setFilterStatus(stat.status)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '16px',
                  padding: isMobile ? '16px' : '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  transform: filterStatus === stat.status ? 'translateY(-8px)' : 'translateY(0)',
                  boxShadow: filterStatus === stat.status 
                    ? '0 10px 30px rgba(0,0,0,0.1)' 
                    : '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                  <div style={{
                    width: isMobile ? '40px' : '48px',
                    height: isMobile ? '40px' : '48px',
                    background: stat.bgGradient,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: isMobile ? '20px' : '24px',
                      height: isMobile ? '20px' : '24px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '6px'
                    }} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: isMobile ? '11px' : '12px',
                      color: '#6c757d',
                      marginBottom: '4px'
                    }}>
                      {statusConfig[stat.status].label}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '18px' : '20px',
                      fontWeight: '600',
                      color: statusConfig[stat.status].color
                    }}>
                      {stat.count}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 액션 버튼 영역 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            marginBottom: '24px',
            border: '1px solid rgba(222, 226, 230, 0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => window.location.href = '/download/order-template.xlsx'}
                style={{
                  padding: '10px 20px',
                  background: '#ffffff',
                  border: '1px solid #2563eb',
                  borderRadius: '8px',
                  color: '#2563eb',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="2" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                엑셀 양식 다운로드
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="white" strokeWidth="2" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                엑셀 업로드
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#10b981';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="white" strokeWidth="2" fill="none">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                새 발주서 작성
              </button>
            </div>
          </div>

          {/* 필터 영역 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            marginBottom: '24px',
            border: '1px solid rgba(222, 226, 230, 0.5)',
            position: 'relative',
            overflow: 'visible'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {/* 검색 */}
              <div style={{
                position: 'relative',
                flex: 1,
                minWidth: '200px'
              }}>
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  stroke="#6c757d" 
                  strokeWidth="2" 
                  fill="none"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="발주번호, 상품명 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* 상태 필터 */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#495057',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <option value="all">전체 상태</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              {/* 날짜 범위 */}
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#495057',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: '#6c757d' }}>~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#495057',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 선택된 항목 액션바 */}
          {selectedOrders.length > 0 && (
            <div style={{
              background: '#eff6ff',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #93c5fd'
            }}>
              <span style={{ color: '#2563eb', fontWeight: '500', fontSize: '14px' }}>
                {selectedOrders.length}개 항목 선택됨
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    background: '#ffffff',
                    border: '1px solid #2563eb',
                    borderRadius: '6px',
                    color: '#2563eb',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  일괄 확정
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    background: '#ffffff',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  선택 취소
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  엑셀 다운로드
                </button>
              </div>
            </div>
          )}

          {/* 발주 목록 테이블 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(222, 226, 230, 0.5)',
            overflow: 'visible',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057',
                      background: '#f8f9fa'
                    }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedOrders.length === orders.length}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057',
                      background: '#f8f9fa'
                    }}>
                      발주번호
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057',
                      background: '#f8f9fa'
                    }}>
                      상품
                    </th>
                    {!isMobile && <th style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057',
                      background: '#f8f9fa'
                    }}>
                      수량
                    </th>}
                    <th style={{
                      padding: '16px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057',
                      background: '#f8f9fa'
                    }}>
                      금액
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057',
                      background: '#f8f9fa'
                    }}>
                      상태
                    </th>
                    {!isMobile && <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057',
                      background: '#f8f9fa'
                    }}>
                      발주일
                    </th>}
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#495057',
                      background: '#f8f9fa'
                    }}>
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid rgba(222, 226, 230, 0.5)',
                        background: 'transparent',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(219, 234, 254, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#2563eb',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailModal(true);
                      }}>
                        {order.orderNo}
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#495057'
                      }}>
                        {order.products}
                      </td>
                      {!isMobile && <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#212529',
                        textAlign: 'right'
                      }}>
                        {order.quantity}개
                      </td>}
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#212529',
                        fontWeight: '500',
                        textAlign: 'right'
                      }}>
                        ₩{order.amount.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: statusConfig[order.status].bg,
                          color: statusConfig[order.status].color
                        }}>
                          {statusConfig[order.status].label}
                        </span>
                      </td>
                      {!isMobile && <td style={{
                        padding: '16px',
                        fontSize: '13px',
                        color: '#6c757d',
                        textAlign: 'center'
                      }}>
                        {order.date}
                      </td>}
                      <td style={{
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          justifyContent: 'center'
                        }}>
                          {order.status === 'registered' && (
                            <button
                              style={{
                                padding: '6px 12px',
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              확정
                            </button>
                          )}
                          {order.status === 'shipped' && order.trackingNo && (
                            <button
                              style={{
                                padding: '6px 12px',
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              배송추적
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#ffffff',
                              color: '#6c757d',
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            상세
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div style={{
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              borderTop: '1px solid #dee2e6'
            }}>
              <button
                style={{
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  color: '#6c757d',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                이전
              </button>
              {[1, 2, 3, 4, 5].map(page => (
                <button
                  key={page}
                  style={{
                    padding: '8px 12px',
                    background: page === 1 ? '#2563eb' : '#ffffff',
                    border: '1px solid ' + (page === 1 ? '#2563eb' : '#dee2e6'),
                    borderRadius: '6px',
                    color: page === 1 ? '#ffffff' : '#6c757d',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minWidth: '36px'
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                style={{
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  color: '#6c757d',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                다음
              </button>
            </div>
          </div>
        </div>

        {/* 엑셀 업로드 모달 */}
        {showUploadModal && (
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
                  onChange={(e) => handleFiles(e.target.files)}
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
        )}

        {/* 상세 모달 */}
        {showDetailModal && selectedOrder && (
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
                  {['registered', 'confirmed', 'preparing', 'shipped'].map((status, idx) => {
                    const isActive = ['registered', 'confirmed', 'preparing', 'shipped'].indexOf(selectedOrder.status) >= idx;
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
        )}
      </div>
    </>
  );
}

export default Orders;