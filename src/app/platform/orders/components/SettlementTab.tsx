'use client';

import { Order } from '../types';
import { useMemo, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { downloadMonthlySettlementExcel, downloadPeriodSettlementExcel } from '@/lib/downloads/settlement-excel';
import { downloadMonthlyStatementPDF, downloadPeriodStatementPDF } from '@/lib/downloads/statement-pdf';
import DatePicker from '@/components/ui/DatePicker';

interface SettlementTabProps {
  isMobile: boolean;
  orders: Order[];
}

interface CompanyInfo {
  company_name: string;
  business_number: string;
  ceo_name: string;
  address: string;
  address_detail?: string;
  phone: string;
  email: string;
}

interface UserInfo {
  name: string;
  email: string;
  business_number?: string;
  company_address?: string;
  representative_name?: string;
  representative_phone?: string;
}

export default function SettlementTab({ isMobile, orders }: SettlementTabProps) {
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<'월별' | '기간설정'>('월별');
  // 확장/축소된 월 상태 관리
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  // 툴팁 호버 상태 관리 (yearMonth + 'excel' or 'statement')
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  // 기본 회사 정보
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  // 로그인한 사용자 정보
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  // 기간설정 상태 (기본값: 오늘부터 1달 전)
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const year = oneMonthAgo.getFullYear();
    const month = String(oneMonthAgo.getMonth() + 1).padStart(2, '0');
    const day = String(oneMonthAgo.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // UTC를 KST(한국시간, UTC+9)로 변환하여 날짜 추출
  const getKSTDate = (utcDateString: string): string => {
    const utcDate = new Date(utcDateString);
    // UTC+9 시간 추가
    const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
    return kstDate.toISOString().substring(0, 10); // YYYY-MM-DD
  };

  // 기간별 집계 데이터
  const periodStats = useMemo(() => {
    const stats = {
      confirmedCount: 0,
      confirmedAmount: 0,
      cancelCount: 0,
      cancelAmount: 0,
      shippedCount: 0,
      shippedAmount: 0,
      refundAmount: 0
    };

    // 날짜가 모두 선택되었는지 확인
    const hasPeriod = startDate && endDate;

    orders.forEach(order => {
      if (!order.confirmedAt) return;

      // 기간이 선택되지 않았으면 전체 집계, 선택되었으면 기간 내 집계
      let shouldCount = true;
      if (hasPeriod) {
        const confirmedDate = getKSTDate(order.confirmedAt);
        shouldCount = confirmedDate >= startDate && confirmedDate <= endDate;
      }

      if (shouldCount) {
        // 발주확정
        stats.confirmedCount++;
        stats.confirmedAmount += order.amount || 0;

        // 취소
        if (order.status === 'cancelled' || order.status === 'cancelRequested' || order.status === 'refunded') {
          stats.cancelCount++;
          stats.cancelAmount += order.amount || 0;
        }

        // 발송완료
        if (order.status === 'shipped') {
          stats.shippedCount++;
          stats.shippedAmount += order.amount || 0;
        }

        // 환불
        if (order.status === 'refunded') {
          const refundAmt = order.refundAmount || order.amount || 0;
          stats.refundAmount += refundAmt;
        }
      }
    });

    return stats;
  }, [orders, startDate, endDate]);

  // 기본 회사 정보 및 사용자 정보 로드
  useEffect(() => {
    const loadInfo = async () => {
      const supabase = createClient();

      // 1. 기본 회사 정보 로드
      try {
        const { data, error } = await supabase
          .from('company_info')
          .select('company_name, business_number, ceo_name, address, address_detail, phone, email')
          .eq('is_default', true)
          .single();

        if (error) {
          console.error('회사 정보 로드 오류:', error);
          // 기본값 설정
          setCompanyInfo({
            company_name: '달래마켓',
            business_number: '107-30-96371',
            ceo_name: '대표자명',
            address: '서울시 강남구 테헤란로 123',
            phone: '02-1234-5678',
            email: 'contact@dalraemarket.com'
          });
        } else if (data) {
          setCompanyInfo(data);
        }
      } catch (error) {
        console.error('회사 정보 로드 실패:', error);
        // 기본값 설정
        setCompanyInfo({
          company_name: '달래마켓',
          business_number: '107-30-96371',
          ceo_name: '대표자명',
          address: '서울시 강남구 테헤란로 123',
          phone: '02-1234-5678',
          email: 'contact@dalraemarket.com'
        });
      }

      // 2. 로그인한 사용자 정보 로드
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, email, business_number, company_address, representative_name, representative_phone')
            .eq('id', user.id)
            .single();

          if (userError) {
            console.error('사용자 정보 로드 오류:', userError);
          } else if (userData) {
            setUserInfo(userData);
          }
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };

    loadInfo();
  }, []);

  // 월별 + 일별 정산 데이터 계산 (발주확정일자 기준)
  const monthlySettlements = useMemo(() => {
    const monthlyMap = new Map<string, any>();

    // 모든 주문을 발주확정일자 기준으로 집계
    orders.forEach(order => {
      // 발주확정일자가 없는 주문은 제외 (발주서등록 상태 등)
      if (!order.confirmedAt) return;

      // UTC를 KST로 변환하여 날짜 추출
      const confirmedDate = getKSTDate(order.confirmedAt);
      const yearMonth = confirmedDate.substring(0, 7); // YYYY-MM

      // 월별 데이터 초기화
      if (!monthlyMap.has(yearMonth)) {
        monthlyMap.set(yearMonth, {
          yearMonth,
          confirmedCount: 0,
          confirmedAmount: 0,
          cancelCount: 0,
          cancelAmount: 0,
          shippedCount: 0,
          shippedAmount: 0,
          refundAmount: 0,
          dailyData: new Map<string, any>()
        });
      }

      const monthData = monthlyMap.get(yearMonth);

      // 일별 데이터 초기화
      if (!monthData.dailyData.has(confirmedDate)) {
        monthData.dailyData.set(confirmedDate, {
          no: 0,
          date: confirmedDate,
          confirmedCount: 0,
          confirmedAmount: 0,
          cancelCount: 0,
          cancelAmount: 0,
          shippedCount: 0,
          shippedAmount: 0,
          refundAmount: 0
        });
      }

      const dayData = monthData.dailyData.get(confirmedDate);

      // 발주확정: 발주확정일자가 있는 모든 주문 (상태 무관)
      monthData.confirmedCount++;
      monthData.confirmedAmount += order.amount || 0;
      dayData.confirmedCount++;
      dayData.confirmedAmount += order.amount || 0;

      // 취소: cancelled, cancelRequested, refunded 상태
      if (order.status === 'cancelled' || order.status === 'cancelRequested' || order.status === 'refunded') {
        monthData.cancelCount++;
        monthData.cancelAmount += order.amount || 0;
        dayData.cancelCount++;
        dayData.cancelAmount += order.amount || 0;
      }

      // 발송완료: shipped 상태
      if (order.status === 'shipped') {
        monthData.shippedCount++;
        monthData.shippedAmount += order.amount || 0;
        dayData.shippedCount++;
        dayData.shippedAmount += order.amount || 0;
      }

      // 환불금액: refunded 상태의 금액 (별도 환불금액 필드가 있으면 사용, 없으면 주문금액)
      if (order.status === 'refunded') {
        const refundAmt = order.refundAmount || order.amount || 0;
        monthData.refundAmount += refundAmt;
        dayData.refundAmount += refundAmt;
      }
    });

    // Map을 배열로 변환하고 최신 월부터 정렬
    const monthlyArray = Array.from(monthlyMap.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

    // 각 월의 일별 데이터를 배열로 변환하고 정렬
    monthlyArray.forEach(month => {
      const dailyArray = Array.from(month.dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));

      // 연번 재설정
      dailyArray.forEach((dayData, index) => {
        dayData.no = index + 1;
      });

      month.dailyData = dailyArray;
    });

    return monthlyArray;
  }, [orders]);

  // 월 토글 핸들러
  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(yearMonth)) {
        newSet.delete(yearMonth);
      } else {
        newSet.add(yearMonth);
      }
      return newSet;
    });
  };

  // 엑셀 다운로드 함수 (유틸리티 함수로 위임)
  const downloadExcel = async (monthData: any) => {
    await downloadMonthlySettlementExcel(monthData);
  };

  // PDF 거래명세서 다운로드 함수 (유틸리티 함수로 위임)
  const downloadPDF = async (monthData: any) => {
    const [year, month] = monthData.yearMonth.split('-');

    // 회사 정보가 로드되지 않았으면 대기
    if (!companyInfo) {
      alert('회사 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 주소 조합 (주소 + 상세주소)
    const fullAddress = companyInfo.address_detail
      ? `${companyInfo.address} ${companyInfo.address_detail}`
      : companyInfo.address;

    // 구매자 정보 설정 (로그인한 사용자 정보 사용)
    const buyerInfo = userInfo ? {
      name: userInfo.name || '구매자명',
      businessNumber: userInfo.business_number || '',
      representative: userInfo.representative_name || '',
      address: userInfo.company_address || '',
      phone: userInfo.representative_phone || '',
      email: userInfo.email || ''
    } : {
      name: '구매자명',
      businessNumber: '',
      representative: '',
      address: '',
      phone: '',
      email: ''
    };

    // 공급자 정보 설정
    const sellerInfo = {
      name: companyInfo.company_name,
      businessNumber: companyInfo.business_number,
      representative: companyInfo.ceo_name,
      address: fullAddress,
      phone: companyInfo.phone,
      email: companyInfo.email
    };

    // 유틸리티 함수 호출
    await downloadMonthlyStatementPDF(year, month, orders, buyerInfo, sellerInfo);
  };

  return (
    <div style={{ maxWidth: 'calc(100% - 200px)', margin: '0 auto' }}>
      {/* 정산 요약 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '48px'
        }}
      >
        {/* 발주 */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            발주
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
            {orders.filter(o => o.confirmedAt).length}건
          </div>
          <div style={{ fontSize: '16px', color: 'var(--color-text)', marginLeft: 'auto' }}>
            {orders.filter(o => o.confirmedAt).reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>

        {/* 취소 */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            취소
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
            {orders.filter(o => o.status === 'cancelled' || o.status === 'cancelRequested').length}건
          </div>
          <div style={{ fontSize: '16px', color: 'var(--color-text)', marginLeft: 'auto' }}>
            {orders.filter(o => o.status === 'cancelled' || o.status === 'cancelRequested')
              .reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>

        {/* 발송 */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            발송
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
            {orders.filter(o => o.status === 'shipped').length}건
          </div>
          <div style={{ fontSize: '16px', color: 'var(--color-text)', marginLeft: 'auto' }}>
            {orders.filter(o => o.status === 'shipped')
              .reduce((sum, o) => sum + (o.amount || 0), 0).toLocaleString()}
          </div>
        </div>

        {/* 환불 */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            환불
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
            {orders.filter(o => o.status === 'refunded').length}건
          </div>
          <div style={{ fontSize: '16px', color: 'var(--color-text)', marginLeft: 'auto' }}>
            {orders.filter(o => o.status === 'refunded')
              .reduce((sum, o) => sum + (o.refundAmount || o.amount || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 탭 및 정산 내역 */}
      <div style={{ marginBottom: '24px' }}>
        {/* 탭 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('월별')}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              fontWeight: activeTab === '월별' ? '600' : '400',
              color: activeTab === '월별' ? 'var(--color-text)' : 'var(--color-text-secondary)',
              background: activeTab === '월별' ? 'var(--color-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === '월별' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            월별 정산 내역
          </button>
          <button
            onClick={() => setActiveTab('기간설정')}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              fontWeight: activeTab === '기간설정' ? '600' : '400',
              color: activeTab === '기간설정' ? 'var(--color-text)' : 'var(--color-text-secondary)',
              background: activeTab === '기간설정' ? 'var(--color-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === '기간설정' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            기간설정
          </button>
        </div>

        {/* 월별 정산 내역 탭 */}
        {activeTab === '월별' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {monthlySettlements.map((month, monthIndex) => {
            const isExpanded = expandedMonths.has(month.yearMonth);
            const [year, monthNum] = month.yearMonth.split('-');
            const isLast = monthIndex === monthlySettlements.length - 1;

            return (
              <div
                key={month.yearMonth}
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  transition: 'box-shadow 0.2s ease',
                  boxShadow: isExpanded ? 'none' : '2px 2px 3px rgba(0, 0, 0, 0.15)'
                }}
              >
                {/* 월별 집계 헤더 (클릭 가능) */}
                <div
                  onClick={() => toggleMonth(month.yearMonth)}
                  style={{
                    padding: '18px 20px',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                    transition: 'background-color 0.15s ease',
                    borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* 아이콘 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-secondary)',
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 17 18 12 13 7"/>
                      <polyline points="6 17 11 12 6 7"/>
                    </svg>
                  </div>

                  {/* 년월 */}
                  <div style={{ fontSize: '15px', fontWeight: '400', color: 'var(--color-text)', minWidth: '100px', flexShrink: 0 }}>
                    {year}년 {monthNum}월
                  </div>

                  {/* 통계 배지 그룹 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '60px', marginLeft: '100px' }}>
                    {/* 발주 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: month.confirmedCount > 0 ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                      border: month.confirmedCount > 0 ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid transparent',
                      flex: '0 0 auto',
                      minWidth: '165px',
                      visibility: month.confirmedCount > 0 ? 'visible' : 'hidden'
                    }}>
                      <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>{month.confirmedAmount.toLocaleString()}</span>
                      <span style={{ color: 'var(--color-text)', fontWeight: '400', fontSize: '12px' }}> / {month.confirmedCount}</span>
                    </div>

                    {/* 취소 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: month.cancelCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                      border: month.cancelCount > 0 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid transparent',
                      flex: '0 0 auto',
                      minWidth: '165px',
                      visibility: month.cancelCount > 0 ? 'visible' : 'hidden'
                    }}>
                      <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>{month.cancelAmount.toLocaleString()}</span>
                      <span style={{ color: 'var(--color-text)', fontWeight: '400', fontSize: '12px' }}> / {month.cancelCount}</span>
                    </div>

                    {/* 발송 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: month.shippedCount > 0 ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                      border: month.shippedCount > 0 ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid transparent',
                      flex: '0 0 auto',
                      minWidth: '165px',
                      visibility: month.shippedCount > 0 ? 'visible' : 'hidden'
                    }}>
                      <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>{month.shippedAmount.toLocaleString()}</span>
                      <span style={{ color: 'var(--color-text)', fontWeight: '400', fontSize: '12px' }}> / {month.shippedCount}</span>
                    </div>

                    {/* 환불 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: month.refundAmount > 0 ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                      border: month.refundAmount > 0 ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid transparent',
                      flex: '0 0 auto',
                      minWidth: '132px',
                      visibility: month.refundAmount > 0 ? 'visible' : 'hidden'
                    }}>
                      <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>{month.refundAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 다운로드 아이콘 영역 */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px' }}>
                    {/* 엑셀 다운로드 */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadExcel(month);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                          setHoveredTooltip(month.yearMonth + '-excel');
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          setHoveredTooltip(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s ease',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      {/* 툴팁 */}
                      {hoveredTooltip === month.yearMonth + '-excel' && (
                        <div style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 8px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0, 0, 0, 0.9)',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                          animation: 'fadeIn 0.15s ease-in-out'
                        }}>
                          엑셀 다운로드
                          {/* 화살표 */}
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '5px solid rgba(0, 0, 0, 0.9)'
                          }} />
                        </div>
                      )}
                    </div>

                    {/* 거래명세서 다운로드 */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPDF(month);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                          setHoveredTooltip(month.yearMonth + '-statement');
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          setHoveredTooltip(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s ease',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                      </button>
                      {/* 툴팁 */}
                      {hoveredTooltip === month.yearMonth + '-statement' && (
                        <div style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 8px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0, 0, 0, 0.9)',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                          animation: 'fadeIn 0.15s ease-in-out'
                        }}>
                          PDF 다운로드
                          {/* 화살표 */}
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '5px solid rgba(0, 0, 0, 0.9)'
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 일별 상세 테이블 (확장 시 표시) */}
                {isExpanded && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th rowSpan={2} style={{
                  padding: '14px 12px',
                  fontWeight: '500',
                  fontSize: '13px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '50px',
                  borderBottom: '1px solid var(--color-border)'
                }}>연번</th>
                <th rowSpan={2} style={{
                  padding: '14px 12px',
                  fontWeight: '500',
                  fontSize: '13px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '100px',
                  borderBottom: '1px solid var(--color-border)'
                }}>일자</th>
                <th colSpan={2} style={{
                  padding: '10px 12px',
                  fontWeight: '500',
                  fontSize: '13px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  borderBottom: '1px solid var(--color-border)'
                }}>발주</th>
                <th colSpan={2} style={{
                  padding: '10px 12px',
                  fontWeight: '500',
                  fontSize: '13px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  borderBottom: '1px solid var(--color-border)'
                }}>취소</th>
                <th colSpan={2} style={{
                  padding: '10px 12px',
                  fontWeight: '500',
                  fontSize: '13px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  borderBottom: '1px solid var(--color-border)'
                }}>발송</th>
                <th rowSpan={2} style={{
                  padding: '14px 12px',
                  fontWeight: '500',
                  fontSize: '13px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '90px',
                  borderBottom: '1px solid var(--color-border)'
                }}>환불</th>
              </tr>

              {/* 2차 헤더 */}
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{
                  padding: '10px 8px',
                  fontWeight: '400',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '50px'
                }}>건수</th>
                <th style={{
                  padding: '10px 8px',
                  fontWeight: '400',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '90px'
                }}>금액</th>
                <th style={{
                  padding: '10px 8px',
                  fontWeight: '400',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '50px'
                }}>건수</th>
                <th style={{
                  padding: '10px 8px',
                  fontWeight: '400',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '90px'
                }}>금액</th>
                <th style={{
                  padding: '10px 8px',
                  fontWeight: '400',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '50px'
                }}>건수</th>
                <th style={{
                  padding: '10px 8px',
                  fontWeight: '400',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  minWidth: '90px'
                }}>금액</th>
              </tr>
            </thead>

                      <tbody>
                        {/* 일별 데이터 행 */}
                        {month.dailyData.map((row, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)'
                  }}>{row.no}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'center',
                    color: 'var(--color-text)'
                  }}>{row.date}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'center',
                    color: 'var(--color-text)'
                  }}>{row.confirmedCount > 0 ? row.confirmedCount : ''}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>{row.confirmedAmount > 0 ? row.confirmedAmount.toLocaleString() : ''}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'center',
                    color: 'var(--color-text)'
                  }}>{row.cancelCount > 0 ? row.cancelCount : ''}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>{row.cancelAmount > 0 ? row.cancelAmount.toLocaleString() : ''}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'center',
                    color: 'var(--color-text)'
                  }}>{row.shippedCount > 0 ? row.shippedCount : ''}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>{row.shippedAmount > 0 ? row.shippedAmount.toLocaleString() : ''}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: '13px',
                    textAlign: 'right',
                    color: 'var(--color-text)'
                  }}>{row.refundAmount > 0 ? row.refundAmount.toLocaleString() : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}

        {/* 기간설정 탭 */}
        {activeTab === '기간설정' && (
          <div
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              boxShadow: '2px 2px 3px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
              }}
            >
              {/* 날짜 선택 영역 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px', flexShrink: 0 }}>
                <DatePicker
                  value={startDate ? new Date(startDate) : null}
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setStartDate(`${year}-${month}-${day}`);
                    } else {
                      setStartDate('');
                    }
                  }}
                  placeholder="시작일"
                  maxDate={endDate ? new Date(endDate) : undefined}
                />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>~</span>
                <DatePicker
                  value={endDate ? new Date(endDate) : null}
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setEndDate(`${year}-${month}-${day}`);
                    } else {
                      setEndDate('');
                    }
                  }}
                  placeholder="종료일"
                  minDate={startDate ? new Date(startDate) : undefined}
                />
              </div>

              {/* 통계 배지 그룹 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '60px' }}>
                {/* 발주 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: periodStats.confirmedCount > 0 ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  border: periodStats.confirmedCount > 0 ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid transparent',
                  flex: '0 0 auto',
                  minWidth: '165px',
                  visibility: periodStats.confirmedCount > 0 ? 'visible' : 'hidden'
                }}>
                  <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>{periodStats.confirmedAmount.toLocaleString()}</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: '400', fontSize: '12px' }}> / {periodStats.confirmedCount}</span>
                </div>

                {/* 취소 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: periodStats.cancelCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                  border: periodStats.cancelCount > 0 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid transparent',
                  flex: '0 0 auto',
                  minWidth: '165px',
                  visibility: periodStats.cancelCount > 0 ? 'visible' : 'hidden'
                }}>
                  <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>{periodStats.cancelAmount.toLocaleString()}</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: '400', fontSize: '12px' }}> / {periodStats.cancelCount}</span>
                </div>

                {/* 발송 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: periodStats.shippedCount > 0 ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                  border: periodStats.shippedCount > 0 ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid transparent',
                  flex: '0 0 auto',
                  minWidth: '165px',
                  visibility: periodStats.shippedCount > 0 ? 'visible' : 'hidden'
                }}>
                  <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>{periodStats.shippedAmount.toLocaleString()}</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: '400', fontSize: '12px' }}> / {periodStats.shippedCount}</span>
                </div>

                {/* 환불 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: periodStats.refundAmount > 0 ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                  border: periodStats.refundAmount > 0 ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid transparent',
                  flex: '0 0 auto',
                  minWidth: '132px',
                  visibility: periodStats.refundAmount > 0 ? 'visible' : 'hidden'
                }}>
                  <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>{periodStats.refundAmount.toLocaleString()}</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: '400', fontSize: '12px' }}> / {periodStats.refundCount}</span>
                </div>
              </div>

              {/* 다운로드 아이콘 영역 */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px' }}>
                {/* 엑셀 다운로드 */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={async () => {
                      if (!startDate || !endDate) {
                        alert('시작일과 종료일을 모두 선택해주세요.');
                        return;
                      }
                      if (startDate > endDate) {
                        alert('시작일은 종료일보다 이전이어야 합니다.');
                        return;
                      }
                      await downloadPeriodSettlementExcel(startDate, endDate, orders);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                      setHoveredTooltip('period-excel');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      setHoveredTooltip(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.15s ease',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                  {/* 툴팁 */}
                  {hoveredTooltip === 'period-excel' && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                      animation: 'fadeIn 0.15s ease-in-out'
                    }}>
                      엑셀 다운로드
                      {/* 화살표 */}
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid rgba(0, 0, 0, 0.9)'
                      }} />
                    </div>
                  )}
                </div>

                {/* 거래명세서 다운로드 */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={async () => {
                      if (!startDate || !endDate) {
                        alert('시작일과 종료일을 모두 선택해주세요.');
                        return;
                      }
                      if (startDate > endDate) {
                        alert('시작일은 종료일보다 이전이어야 합니다.');
                        return;
                      }

                      if (!companyInfo) {
                        alert('회사 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                        return;
                      }

                      const fullAddress = companyInfo.address_detail
                        ? `${companyInfo.address} ${companyInfo.address_detail}`
                        : companyInfo.address;

                      const buyerInfo = userInfo ? {
                        name: userInfo.name || '구매자명',
                        businessNumber: userInfo.business_number || '',
                        representative: userInfo.representative_name || '',
                        address: userInfo.company_address || '',
                        phone: userInfo.representative_phone || '',
                        email: userInfo.email || ''
                      } : {
                        name: '구매자명',
                        businessNumber: '',
                        representative: '',
                        address: '',
                        phone: '',
                        email: ''
                      };

                      const sellerInfo = {
                        name: companyInfo.company_name,
                        businessNumber: companyInfo.business_number,
                        representative: companyInfo.ceo_name,
                        address: fullAddress,
                        phone: companyInfo.phone,
                        email: companyInfo.email
                      };

                      await downloadPeriodStatementPDF(startDate, endDate, orders, buyerInfo, sellerInfo);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                      setHoveredTooltip('period-statement');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      setHoveredTooltip(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.15s ease',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </button>
                  {/* 툴팁 */}
                  {hoveredTooltip === 'period-statement' && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                      animation: 'fadeIn 0.15s ease-in-out'
                    }}>
                      PDF 다운로드
                      {/* 화살표 */}
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid rgba(0, 0, 0, 0.9)'
                      }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 안내문구 */}
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6'
        }}>
          {/* 범례 */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }} />
              <span style={{ fontSize: '12px' }}>발주확정</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }} />
              <span style={{ fontSize: '12px' }}>취소</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }} />
              <span style={{ fontSize: '12px' }}>발송완료</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }} />
              <span style={{ fontSize: '12px' }}>환불</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.1)', paddingTop: '12px' }}>
            ※ 통계데이터 거래명세서 금액이 실제 정산금액과 맞지 않은 경우 '셀러피드' 건의란에 오류 제보 부탁드립니다
          </div>
        </div>
      </div>
    </div>
  );
}
