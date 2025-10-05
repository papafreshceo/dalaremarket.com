'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import DashboardTab from './components/DashboardTab';
import { Order, StatusConfig } from './types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [orders, setOrders] = useState<Order[]>([
    { id: 1, orderNo: 'ORD-2024-0001', products: '양파 외 3건', amount: 580000, quantity: 120, status: 'registered', date: '2024-01-15', registeredAt: '2024-01-15 09:30' },
    { id: 2, orderNo: 'ORD-2024-0002', products: '토마토 외 5건', amount: 1250000, quantity: 200, status: 'confirmed', date: '2024-01-15', confirmedAt: '2024-01-15 10:15', paymentMethod: '계좌이체' },
    { id: 3, orderNo: 'ORD-2024-0003', products: '감자 외 2건', amount: 380000, quantity: 80, status: 'preparing', date: '2024-01-14', confirmedAt: '2024-01-14 14:20' },
    { id: 4, orderNo: 'ORD-2024-0004', products: '대파 외 4건', amount: 920000, quantity: 150, status: 'shipped', date: '2024-01-14', shippedAt: '2024-01-14 16:00', trackingNo: 'CJ1234567890', expectedDelivery: '2024-01-16' },
    { id: 5, orderNo: 'ORD-2024-0005', products: '배추 외 1건', amount: 450000, quantity: 60, status: 'cancelRequested', date: '2024-01-13', cancelRequestedAt: '2024-01-14 11:00', cancelReason: '주문 실수' },
    { id: 6, orderNo: 'ORD-2024-0006', products: '당근 외 3건', amount: 680000, quantity: 100, status: 'cancelled', date: '2024-01-13', cancelledAt: '2024-01-13 15:30' },
    { id: 7, orderNo: 'ORD-2024-0007', products: '시금치 외 2건', amount: 320000, quantity: 70, status: 'shipped', date: '2024-01-13', shippedAt: '2024-01-13 14:00', trackingNo: 'CJ1234567891' },
    { id: 8, orderNo: 'ORD-2024-0008', products: '브로콜리 외 4건', amount: 890000, quantity: 130, status: 'confirmed', date: '2024-01-12', confirmedAt: '2024-01-12 11:30' }
  ]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userData?.approved || (userData.role !== 'admin' && userData.role !== 'employee' && userData.role !== 'super_admin')) {
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const statusConfig: Record<Order['status'], StatusConfig> = {
    registered: { label: '발주서등록', color: '#2563eb', bg: '#dbeafe' },
    confirmed: { label: '발주서확정', color: '#7c3aed', bg: '#ede9fe' },
    preparing: { label: '상품준비중', color: '#f59e0b', bg: '#fef3c7' },
    shipped: { label: '발송완료', color: '#10b981', bg: '#d1fae5' },
    cancelRequested: { label: '취소요청', color: '#ef4444', bg: '#fee2e2' },
    cancelled: { label: '취소완료', color: '#6b7280', bg: '#f3f4f6' }
  };

  return (
    <div style={{
      padding: isMobile ? '16px' : '24px',
      paddingTop: '90px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <DashboardTab
          isMobile={isMobile}
          orders={orders}
          statusConfig={statusConfig}
        />
      </div>
    </div>
  );
}
