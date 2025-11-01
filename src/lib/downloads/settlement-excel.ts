import ExcelJS from 'exceljs';
import { Order } from '@/app/platform/orders/types';

/**
 * 월별 정산내역서 엑셀 다운로드
 */
export async function downloadMonthlySettlementExcel(monthData: {
  yearMonth: string;
  confirmedCount: number;
  confirmedAmount: number;
  cancelCount: number;
  cancelAmount: number;
  shippedCount: number;
  shippedAmount: number;
  refundAmount: number;
  dailyData: Array<{
    no: number;
    date: string;
    confirmedCount: number;
    confirmedAmount: number;
    cancelCount: number;
    cancelAmount: number;
    shippedCount: number;
    shippedAmount: number;
    refundAmount: number;
  }>;
}) {
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
  titleCell.value = '정산내역서';
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
  monthData.dailyData.forEach((day) => {
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
  link.download = `정산내역서_${year}년${month}월.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * 기간별 정산내역서 엑셀 다운로드
 */
export async function downloadPeriodSettlementExcel(
  startDate: string,
  endDate: string,
  orders: Order[]
) {
  // KST 변환 함수
  const getKSTDate = (utcDateString: string): string => {
    const utcDate = new Date(utcDateString);
    const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
    return kstDate.toISOString().substring(0, 10);
  };

  // 기간 내 주문 필터링
  const filteredOrders = orders.filter(order => {
    if (!order.confirmedAt) return false;
    const confirmedDate = getKSTDate(order.confirmedAt);
    return confirmedDate >= startDate && confirmedDate <= endDate;
  });

  // 일별 데이터 집계
  const dailyMap = new Map<string, {
    no: number;
    date: string;
    confirmedCount: number;
    confirmedAmount: number;
    cancelCount: number;
    cancelAmount: number;
    shippedCount: number;
    shippedAmount: number;
    refundAmount: number;
  }>();

  filteredOrders.forEach(order => {
    const confirmedDate = getKSTDate(order.confirmedAt!);

    if (!dailyMap.has(confirmedDate)) {
      dailyMap.set(confirmedDate, {
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

    const dayData = dailyMap.get(confirmedDate)!;

    // 발주확정
    dayData.confirmedCount++;
    dayData.confirmedAmount += order.amount || 0;

    // 취소
    if (order.status === 'cancelled' || order.status === 'cancelRequested' || order.status === 'refunded') {
      dayData.cancelCount++;
      dayData.cancelAmount += order.amount || 0;
    }

    // 발송완료
    if (order.status === 'shipped') {
      dayData.shippedCount++;
      dayData.shippedAmount += order.amount || 0;
    }

    // 환불
    if (order.status === 'refunded') {
      const refundAmt = order.refundAmount || order.amount || 0;
      dayData.refundAmount += refundAmt;
    }
  });

  // 일별 데이터 배열로 변환 및 정렬
  const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  dailyData.forEach((day, index) => {
    day.no = index + 1;
  });

  // 전체 집계
  const totalData = {
    confirmedCount: dailyData.reduce((sum, day) => sum + day.confirmedCount, 0),
    confirmedAmount: dailyData.reduce((sum, day) => sum + day.confirmedAmount, 0),
    cancelCount: dailyData.reduce((sum, day) => sum + day.cancelCount, 0),
    cancelAmount: dailyData.reduce((sum, day) => sum + day.cancelAmount, 0),
    shippedCount: dailyData.reduce((sum, day) => sum + day.shippedCount, 0),
    shippedAmount: dailyData.reduce((sum, day) => sum + day.shippedAmount, 0),
    refundAmount: dailyData.reduce((sum, day) => sum + day.refundAmount, 0)
  };

  // 워크북 생성
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('정산내역서');

  // 열 너비 설정
  worksheet.columns = [
    { width: 10 },
    { width: 15 },
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 18 },
    { width: 18 }
  ];

  let currentRow = 1;

  // 제목
  worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = '정산내역서';
  titleCell.font = { size: 18, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 30;
  currentRow++;

  // 부제목 (기간)
  worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
  const subtitleCell = worksheet.getCell(`A${currentRow}`);
  subtitleCell.value = `${startDate} ~ ${endDate}`;
  subtitleCell.font = { size: 14, bold: true };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // 빈 줄
  currentRow++;

  // 전체 집계 섹션
  const summaryTitleCell = worksheet.getCell(`A${currentRow}`);
  summaryTitleCell.value = '전체 집계';
  summaryTitleCell.font = { size: 12, bold: true };
  currentRow++;

  // 전체 집계 헤더
  const summaryHeaderRow = worksheet.getRow(currentRow);
  summaryHeaderRow.values = ['구분', '건수', '금액'];
  summaryHeaderRow.height = 25;

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

  // 전체 집계 데이터
  const summaryData = [
    ['발주', totalData.confirmedCount, totalData.confirmedAmount],
    ['취소', totalData.cancelCount, totalData.cancelAmount],
    ['발송', totalData.shippedCount, totalData.shippedAmount],
    ['환불', '-', totalData.refundAmount],
  ];

  summaryData.forEach((rowData, index) => {
    const row = worksheet.getRow(currentRow);
    row.values = rowData;
    row.height = 20;

    ['A', 'B', 'C'].forEach((col) => {
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      if (index % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };
      }

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
  dailyData.forEach((day) => {
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
  link.download = `정산내역서_${startDate}_${endDate}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
