'use client';

import { Order } from '../types';
import { useMemo, useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from '@/lib/supabase/client';

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
  // 확장/축소된 월 상태 관리
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  // 툴팁 호버 상태 관리 (yearMonth + 'excel' or 'statement')
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  // 기본 회사 정보
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  // 로그인한 사용자 정보
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

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

  // UTC를 KST(한국시간, UTC+9)로 변환하여 날짜 추출
  const getKSTDate = (utcDateString: string): string => {
    const utcDate = new Date(utcDateString);
    // UTC+9 시간 추가
    const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
    return kstDate.toISOString().substring(0, 10); // YYYY-MM-DD
  };

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

  // 엑셀 다운로드 함수
  const downloadExcel = async (monthData: any) => {
    const [year, month] = monthData.yearMonth.split('-');

    // 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${year}년 ${month}월`);

    // 열 너비 설정
    worksheet.columns = [
      { width: 10 },  // 연번
      { width: 15 },  // 일자
      { width: 12 },  // 발주 건수
      { width: 18 },  // 발주 금액
      { width: 12 },  // 취소 건수
      { width: 18 },  // 취소 금액
      { width: 12 },  // 발송 건수
      { width: 18 },  // 발송 금액
      { width: 18 }   // 환불 금액
    ];

    let currentRow = 1;

    // 제목 (병합)
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = '거래명세서';
    titleCell.font = { size: 18, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(currentRow).height = 30;
    currentRow++;

    // 부제목 (병합)
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const subtitleCell = worksheet.getCell(`A${currentRow}`);
    subtitleCell.value = `${year}년 ${month}월`;
    subtitleCell.font = { size: 14, bold: true };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // 빈 줄
    currentRow++;

    // 월별 집계 섹션
    const summaryTitleCell = worksheet.getCell(`A${currentRow}`);
    summaryTitleCell.value = '월별 집계';
    summaryTitleCell.font = { size: 12, bold: true };
    currentRow++;

    // 월별 집계 헤더
    const summaryHeaderRow = worksheet.getRow(currentRow);
    summaryHeaderRow.values = ['구분', '건수', '금액'];
    summaryHeaderRow.height = 25;

    // 헤더 셀 개별 설정 (A, B, C 컬럼만)
    ['A', 'B', 'C'].forEach((col) => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    currentRow++;

    // 월별 집계 데이터
    const summaryData = [
      ['발주', monthData.confirmedCount, monthData.confirmedAmount],
      ['취소', monthData.cancelCount, monthData.cancelAmount],
      ['발송', monthData.shippedCount, monthData.shippedAmount],
      ['환불', '-', monthData.refundAmount],
    ];

    summaryData.forEach((rowData, index) => {
      const row = worksheet.getRow(currentRow);
      row.values = rowData;
      row.height = 20;

      // 각 셀 개별 설정
      ['A', 'B', 'C'].forEach((col) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // 짝수 행에 배경색 추가
        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
          };
        }

        // C 컬럼(금액)에 숫자 형식 적용
        if (col === 'C' && typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
      });

      currentRow++;
    });

    // 빈 줄
    currentRow++;

    // 일별 상세 섹션
    const detailTitleCell = worksheet.getCell(`A${currentRow}`);
    detailTitleCell.value = '일별 상세';
    detailTitleCell.font = { size: 12, bold: true };
    currentRow++;

    // 일별 상세 헤더
    const detailHeaderRow = worksheet.getRow(currentRow);
    detailHeaderRow.values = ['연번', '일자', '발주 건수', '발주 금액', '취소 건수', '취소 금액', '발송 건수', '발송 금액', '환불 금액'];
    detailHeaderRow.height = 25;

    // 헤더 셀 개별 설정 (A~I 컬럼)
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    currentRow++;

    // 일별 상세 데이터
    monthData.dailyData.forEach((day: any) => {
      const row = worksheet.getRow(currentRow);
      row.values = [
        day.no,
        day.date,
        day.confirmedCount || '',
        day.confirmedAmount || '',
        day.cancelCount || '',
        day.cancelAmount || '',
        day.shippedCount || '',
        day.shippedAmount || '',
        day.refundAmount || ''
      ];
      row.height = 18;

      // 각 셀 개별 설정
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { size: 10 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // 금액 컬럼(D, F, H, I)에 숫자 형식 적용
        if (['D', 'F', 'H', 'I'].includes(col) && typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
      });

      currentRow++;
    });

    // 파일 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `거래명세서_${year}년${month}월.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // PDF 거래명세서 다운로드 함수
  const downloadPDF = async (monthData: any) => {
    const [year, month] = monthData.yearMonth.split('-');

    try {
      // 해당 월에 발주확정된 주문 중에서 발송완료 상태인 주문만 필터링
      const shippedOrders = orders.filter(order => {
        // 1. 발송완료 상태가 아니면 제외
        if (order.status !== 'shipped') return false;

        // 2. 발주확정일이 없으면 제외
        if (!order.confirmedAt) return false;

        // 3. 발주확정일이 해당 월인지 확인
        const confirmedDate = getKSTDate(order.confirmedAt);
        const orderYearMonth = confirmedDate.substring(0, 7); // YYYY-MM
        return orderYearMonth === monthData.yearMonth;
      });

      if (shippedOrders.length === 0) {
        alert('해당 월에 발주확정되고 발송완료된 주문이 없습니다.');
        return;
      }

      // option_name으로 그룹핑하여 통계 집계
      const optionStats = new Map<string, {
        optionName: string;
        count: number;
        totalAmount: number;
      }>();

      shippedOrders.forEach(order => {
        const optionName = order.option_name || order.products;
        const amount = order.amount || 0;

        if (optionStats.has(optionName)) {
          const stats = optionStats.get(optionName)!;
          stats.count += 1;
          stats.totalAmount += amount;
        } else {
          optionStats.set(optionName, {
            optionName,
            count: 1,
            totalAmount: amount
          });
        }
      });

      // option_products 테이블에서 category_4 정보 가져오기
      const supabase = createClient();
      const optionNames = Array.from(optionStats.keys());

      const { data: optionProducts, error: optionError } = await supabase
        .from('option_products')
        .select('option_name, category_4')
        .in('option_name', optionNames);

      if (optionError) {
        console.error('옵션 상품 정보 조회 오류:', optionError);
      }

      // category_4 맵 생성
      const categoryMap = new Map<string, string>();
      if (optionProducts) {
        optionProducts.forEach((product: any) => {
          categoryMap.set(product.option_name, product.category_4 || '기타');
        });
      }

      // 거래명세서 품목 형식으로 변환
      const items = Array.from(optionStats.values())
        .map(stats => ({
          name: categoryMap.get(stats.optionName) || '기타',  // 품목: category_4
          spec: stats.optionName,                              // 규격: option_name
          quantity: 1,                                          // 수량: 1
          unit: '식',                                          // 단위: 식
          price: stats.totalAmount,                            // 단가: 금액 합계
          notes: `${stats.count}건`                            // 비고: 건수 + '건'
        }))
        // 가나다순 정렬: 1차 품목명, 2차 규격
        .sort((a, b) => {
          const nameCompare = a.name.localeCompare(b.name, 'ko');
          if (nameCompare !== 0) return nameCompare;
          return a.spec.localeCompare(b.spec, 'ko');
        });

      if (items.length === 0) {
        alert('해당 월에 거래 내역이 없습니다.');
        return;
      }

      // 해당 월의 시작일과 종료일 계산
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

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

      // API 호출
      const response = await fetch('/api/statements/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerInfo: {
            name: companyInfo.company_name,
            businessNumber: companyInfo.business_number,
            representative: companyInfo.ceo_name,
            address: fullAddress,
            phone: companyInfo.phone,
            email: companyInfo.email
          },
          buyerInfo: buyerInfo,
          items: items,
          notes: [
            `거래명세서 기간: ${startDate} ~ ${endDate}`,
            `문의사항은 ${companyInfo.phone} 또는 ${companyInfo.email}으로 연락 주시기 바랍니다.`
          ]
        })
      });

      if (response.ok) {
        // PDF 파일 다운로드
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `거래명세서_${year}년${month}월.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        alert(`PDF 생성 실패: ${error.error || '서버 오류'}`);
      }
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      {/* 정산 요약 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
          maxWidth: 'calc(100% - 200px)',
          margin: '0 auto 24px auto'
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

      {/* 월별 정산 아코디언 */}
      <div style={{ marginBottom: '24px', maxWidth: 'calc(100% - 200px)', margin: '0 auto 24px auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
          월별 정산 내역
        </h3>

        {/* 월별 아코디언 리스트 */}
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
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text)', minWidth: '100px', flexShrink: 0 }}>
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
                      background: month.confirmedCount > 0 ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      border: month.confirmedCount > 0 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                      flex: '0 0 auto',
                      minWidth: '150px',
                      visibility: month.confirmedCount > 0 ? 'visible' : 'hidden'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '500' }}>발주</span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: '600' }}>
                          {month.confirmedCount}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                        {month.confirmedAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* 취소 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: month.cancelCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                      border: month.cancelCount > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid transparent',
                      flex: '0 0 auto',
                      minWidth: '150px',
                      visibility: month.cancelCount > 0 ? 'visible' : 'hidden'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '500' }}>취소</span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: '600' }}>
                          {month.cancelCount}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                        {month.cancelAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* 발송 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: month.shippedCount > 0 ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      border: month.shippedCount > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                      flex: '0 0 auto',
                      minWidth: '150px',
                      visibility: month.shippedCount > 0 ? 'visible' : 'hidden'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>발송</span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: '600' }}>
                          {month.shippedCount}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                        {month.shippedAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* 환불 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: month.refundAmount > 0 ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                      border: month.refundAmount > 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent',
                      flex: '0 0 auto',
                      minWidth: '120px',
                      visibility: month.refundAmount > 0 ? 'visible' : 'hidden'
                    }}>
                      <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '500' }}>환불</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                        {month.refundAmount.toLocaleString()}
                      </span>
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
      </div>
    </div>
  );
}
