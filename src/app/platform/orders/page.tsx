'use client';

import { useState, useRef, useEffect } from 'react';
import { Order, StatusConfig, StatsData, Tab } from './types';
import DashboardTab from './components/DashboardTab';
import OrderRegistrationTab from './components/OrderRegistrationTab';
import SettlementTab from './components/SettlementTab';
import UploadModal from './modals/UploadModal';
import OrderDetailModal from './modals/OrderDetailModal';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('대시보드');
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
    <>
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
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: '700',
              color: '#212529',
              margin: 0,
              marginBottom: '8px'
            }}>
              발주관리
            </h1>
            <p style={{
              color: '#6c757d',
              margin: 0,
              fontSize: '14px'
            }}>
              발주 내역을 확인하고 새로운 주문을 등록하세요
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid #e0e0e0',
            marginBottom: '32px'
          }}>
            {(['대시보드', '발주서등록', '정산관리'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: activeTab === tab ? '#2563eb' : '#6b7280',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                  marginBottom: '-2px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === tab ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === '대시보드' && (
            <DashboardTab
              isMobile={isMobile}
              orders={orders}
              statusConfig={statusConfig}
            />
          )}
          {activeTab === '발주서등록' && (
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
          )}
          {activeTab === '정산관리' && (
            <SettlementTab
              isMobile={isMobile}
              orders={orders}
            />
          )}
        </div>

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
    </>
  );
}
