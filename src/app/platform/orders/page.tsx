'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Order, StatusConfig, StatsData, Tab } from './types';
import DashboardTab from './components/DashboardTab';
import OrderRegistrationTab from './components/OrderRegistrationTab';
import SettlementTab from './components/SettlementTab';
import UploadModal from './modals/UploadModal';
import OrderDetailModal from './modals/OrderDetailModal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('대시보드');
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([
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

  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const supabase = createClientComponentClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });
  }, []);

  const statusConfig: Record<Order['status'], StatusConfig> = {
    registered: { label: '발주서등록', color: '#2563eb', bg: '#dbeafe' },
    confirmed: { label: '발주서확정', color: '#7c3aed', bg: '#ede9fe' },
    preparing: { label: '상품준비중', color: '#f59e0b', bg: '#fef3c7' },
    shipped: { label: '발송완료', color: '#10b981', bg: '#d1fae5' },
    cancelRequested: { label: '취소요청', color: '#ef4444', bg: '#fee2e2' },
    cancelled: { label: '취소완료', color: '#6b7280', bg: '#f3f4f6' }
  };

  const statsData: StatsData[] = [
    { status: 'registered', count: orders.filter(o => o.status === 'registered').length, bgGradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' },
    { status: 'confirmed', count: orders.filter(o => o.status === 'confirmed').length, bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
    { status: 'preparing', count: orders.filter(o => o.status === 'preparing').length, bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    { status: 'shipped', count: orders.filter(o => o.status === 'shipped').length, bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
    { status: 'cancelRequested', count: orders.filter(o => o.status === 'cancelRequested').length, bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' },
    { status: 'cancelled', count: orders.filter(o => o.status === 'cancelled').length, bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' }
  ];

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    console.log('Files:', files);
    alert('엑셀 파일이 업로드되었습니다.');
    setShowUploadModal(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: number) => {
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
    <div className="platform-orders-page bg-background" style={{ minHeight: '100vh' }}>
      {/* 발주관리 전용 헤더 */}
      <div className="bg-surface border-border" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '70px',
        background: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        {/* 왼쪽: 나가기 버튼 & 로그인 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 나가기 버튼 */}
          <button
            onClick={() => { router.push('/'); }}
            className="bg-surface border-border text-text hover:bg-surface-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1f2937',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!document.documentElement.classList.contains('dark')) {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (!document.documentElement.classList.contains('dark')) {
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            나가기
          </button>

          {/* 로그인 정보 */}
          <div className="text-text" style={{
            fontSize: '14px',
            color: '#1f2937',
            fontWeight: '500'
          }}>
            {userEmail || '로그인 정보 없음'}
          </div>
        </div>

        {/* 오른쪽: 다크모드 토글 */}
        <ThemeToggle />
      </div>

      {/* Sidebar */}
      <div className="bg-background-secondary border-border" style={{
        position: 'fixed',
        top: '70px',
        left: 0,
        width: isMobile ? '42px' : '175px',
        height: 'calc(100vh - 70px)',
        background: '#f5f5f5',
        borderRight: '1px solid #e0e0e0',
        zIndex: 100
      }}>
        <div style={{
          paddingTop: '16px',
          paddingLeft: isMobile ? '6px' : '12px',
          paddingRight: isMobile ? '6px' : '12px'
        }}>
          {/* 대시보드 탭 */}
          <button
            onClick={() => setActiveTab('대시보드')}
            className={`text-text ${activeTab === '대시보드' ? 'bg-surface-hover' : ''}`}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '대시보드' ? '#e8e8e8' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '대시보드' ? '700' : '400',
              color: '#1f2937',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '대시보드') {
                const isDark = document.documentElement.classList.contains('dark');
                e.currentTarget.style.background = isDark ? '#3e3e42' : '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '대시보드') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            {!isMobile && '대시보드'}
          </button>

          {/* 발주서등록 탭 */}
          <button
            onClick={() => setActiveTab('발주서등록')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '발주서등록' ? '#e8e8e8' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '발주서등록' ? '700' : '400',
              color: '#1f2937',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '발주서등록') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '발주서등록') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {!isMobile && '발주서등록'}
          </button>

          {/* 정산관리 탭 */}
          <button
            onClick={() => setActiveTab('정산관리')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isMobile ? '10px 8px' : '10px 16px',
              margin: isMobile ? '4px 6px' : '2px 8px',
              background: activeTab === '정산관리' ? '#e8e8e8' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === '정산관리' ? '700' : '400',
              color: '#1f2937',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== '정산관리') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== '정산관리') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width={isMobile ? '16' : '20'} height={isMobile ? '16' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            {!isMobile && '정산관리'}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="bg-background" style={{
        marginLeft: isMobile ? '42px' : '175px',
        padding: isMobile ? '16px' : '24px',
        paddingTop: '90px',
        background: '#f5f5f5',
        minHeight: '100vh',
        overflowY: 'auto'
      }}>
        {/* Tab Content */}
        {activeTab === '대시보드' && (
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto'
          }}>
            <DashboardTab
              isMobile={isMobile}
              orders={orders}
              statusConfig={statusConfig}
            />
          </div>
        )}
        {activeTab === '발주서등록' && (
          <div style={{
            width: '100%'
          }}>
            <OrderRegistrationTab
              isMobile={isMobile}
              orders={orders}
              statsData={statsData}
              statusConfig={statusConfig}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedOrders={selectedOrders}
              setSelectedOrders={setSelectedOrders}
              setShowUploadModal={setShowUploadModal}
              filteredOrders={filteredOrders}
              handleSelectAll={handleSelectAll}
              handleSelectOrder={handleSelectOrder}
              setSelectedOrder={setSelectedOrder}
              setShowDetailModal={setShowDetailModal}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
          </div>
        )}
        {activeTab === '정산관리' && (
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto'
          }}>
            <SettlementTab
              isMobile={isMobile}
              orders={orders}
            />
          </div>
        )}

        {/* 모달들 */}
        <UploadModal
          showUploadModal={showUploadModal}
          setShowUploadModal={setShowUploadModal}
          dragActive={dragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
          fileInputRef={fileInputRef}
          handleFiles={handleFiles}
        />

        <OrderDetailModal
          showDetailModal={showDetailModal}
          setShowDetailModal={setShowDetailModal}
          selectedOrder={selectedOrder}
          statusConfig={statusConfig}
        />
      </div>
    </div>
  );
}
