import { Order } from '@/app/platform/orders/types';

/**
 * KST 날짜 변환 헬퍼 함수
 */
function getKSTDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().split('T')[0];
}

/**
 * 주문 데이터를 거래명세서 품목 형식으로 변환
 */
interface StatementItem {
  name: string;
  spec: string;
  quantity: number;
  unit: string;
  price: number;
  supplyAmount: number;
  vat: number;
  notes?: string;
}

interface OptionStats {
  optionName: string;
  count: number;
  totalAmount: number;
}

/**
 * option_name으로 그룹핑하여 통계 집계
 */
async function aggregateOrdersByOption(orders: Order[]): Promise<StatementItem[]> {
  const optionStats = new Map<string, OptionStats>();
  let refundTotalAmount = 0;
  let refundCount = 0;

  // 환불 주문과 일반 주문 구분 처리
  orders.forEach(order => {
    if (order.status === 'refunded') {
      // 환불 주문: 별도 집계
      const refundAmount = order.refundAmount || order.amount || 0;
      refundTotalAmount += refundAmount;
      refundCount += 1;
    } else {
      // 일반 주문: option_name별 그룹핑
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
    }
  });

  // category_4 맵 생성 (기본값으로 초기화)
  const categoryMap = new Map<string, string>();

  // option_products 테이블에서 category_4 정보 가져오기 (타임아웃 적용)
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const optionNames = Array.from(optionStats.keys());

    // 옵션상품이 있을 때만 쿼리 실행
    if (optionNames.length > 0) {
      // 타임아웃을 위한 Promise.race 사용 (5초)
      const queryPromise = supabase
        .from('option_products')
        .select('option_name, category_4')
        .in('option_name', optionNames);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      const { data: optionProducts, error: optionError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (!optionError && optionProducts) {
        optionProducts.forEach((product: any) => {
          categoryMap.set(product.option_name, product.category_4 || '기타');
        });
      }
    }
  } catch (error) {
    // 타임아웃이나 에러 발생 시 기본값(옵션상품) 사용
  }

  // 거래명세서 품목 형식으로 변환
  const items = Array.from(optionStats.values())
    .map(stats => ({
      name: categoryMap.get(stats.optionName) || '기타',  // 품목: category_4
      spec: stats.optionName,                              // 규격: option_name
      quantity: 1,                                          // 수량: 1
      unit: '식',                                          // 단위: 식
      price: stats.totalAmount,                            // 단가: 금액 합계
      supplyAmount: stats.totalAmount,                     // 공급가액: 금액 합계
      vat: 0,                                              // 부가세: 0
      notes: `${stats.count}건`                            // 비고: 건수 + '건'
    }))
    // 가나다순 정렬: 1차 품목명, 2차 규격
    .sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name, 'ko');
      if (nameCompare !== 0) return nameCompare;
      return a.spec.localeCompare(b.spec, 'ko');
    });

  // 환불 항목이 있으면 마지막에 추가 (마이너스 금액)
  if (refundCount > 0) {
    items.push({
      name: '환불',
      spec: '환불처리',
      quantity: 1,
      unit: '식',
      price: -refundTotalAmount,
      supplyAmount: -refundTotalAmount,
      vat: 0,
      notes: `${refundCount}건`
    });
  }

  return items;
}

/**
 * 월별 거래명세서 PDF 다운로드
 *
 * @param year - 년도 (YYYY)
 * @param month - 월 (MM)
 * @param orders - 해당 월의 발송완료된 주문 목록
 * @param buyerInfo - 공급받는자 정보 (로그인한 회원 정보)
 * @param buyerSubAccountId - 구매 사업자의 서브계정 ID
 * @param sellerInfo - 공급자 정보 (회사 정보)
 */
export async function downloadMonthlyStatementPDF(
  year: string,
  month: string,
  orders: Order[],
  buyerInfo: {
    name: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
    email?: string;
  },
  buyerSubAccountId: string,
  sellerInfo?: {
    name?: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
    email?: string;
  }
) {
  try {
    // 해당 월에 발주확정된 주문 중에서 발송완료 또는 환불 상태인 주문 필터링
    const yearMonth = `${year}-${month.padStart(2, '0')}`;
    const targetOrders = orders.filter(order => {
      // 1. 발송완료 또는 환불 상태가 아니면 제외
      if (order.status !== 'shipped' && order.status !== 'refunded') return false;

      // 2. 발주확정일이 없으면 제외
      if (!order.confirmedAt) return false;

      // 3. 발주확정일이 해당 월인지 확인
      const confirmedDate = getKSTDate(order.confirmedAt);
      const orderYearMonth = confirmedDate.substring(0, 7); // YYYY-MM
      return orderYearMonth === yearMonth;
    });

    if (targetOrders.length === 0) {
      alert('해당 월에 발주확정되고 발송완료/환불된 주문이 없습니다.');
      return;
    }

    // 옵션상품별로 집계
    const items = await aggregateOrdersByOption(targetOrders);

    // API 호출
    const response = await fetch('/api/statements/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerSubAccountId,
        buyerInfo,
        sellerInfo,
        items,
        notes: [
          `${year}년 ${month}월 정산내역입니다.`,
          `상기 금액을 아래 계좌로 입금하여 주시기 바랍니다.`,
          `문의사항: ${sellerInfo?.phone || '02-1234-5678'} 또는 ${sellerInfo?.email || 'contact@dalraemarket.com'}`
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'PDF 생성 실패');
    }

    // PDF 다운로드
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `거래명세서_${year}년${month}월.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('[downloadMonthlyStatementPDF] 오류:', error);
    alert('거래명세서 다운로드 중 오류가 발생했습니다.');
  }
}

/**
 * 기간별 거래명세서 PDF 다운로드
 *
 * @param startDate - 시작일 (YYYY-MM-DD)
 * @param endDate - 종료일 (YYYY-MM-DD)
 * @param orders - 전체 주문 목록
 * @param buyerInfo - 공급받는자 정보 (로그인한 회원 정보)
 * @param buyerSubAccountId - 구매 사업자의 서브계정 ID
 * @param sellerInfo - 공급자 정보 (회사 정보)
 */
export async function downloadPeriodStatementPDF(
  startDate: string,
  endDate: string,
  orders: Order[],
  buyerInfo: {
    name: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
    email?: string;
  },
  buyerSubAccountId: string,
  sellerInfo?: {
    name?: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
    email?: string;
  }
) {
  try {
    // 날짜 유효성 검증
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 모두 선택해주세요.');
      return;
    }

    if (startDate > endDate) {
      alert('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    // 기간 내 발주확정된 주문 중에서 발송완료 또는 환불 상태인 주문 필터링
    const shippedOrders = orders.filter(order => {
      // 1. 발송완료 또는 환불 상태가 아니면 제외
      if (order.status !== 'shipped' && order.status !== 'refunded') return false;

      // 2. 발주확정일이 없으면 제외
      if (!order.confirmedAt) return false;

      // 3. 발주확정일이 기간 내인지 확인
      const confirmedDate = getKSTDate(order.confirmedAt);
      return confirmedDate >= startDate && confirmedDate <= endDate;
    });

    if (shippedOrders.length === 0) {
      alert('해당 기간에 발주확정되고 발송완료/환불된 주문이 없습니다.');
      return;
    }

    // 옵션상품별로 집계
    const items = await aggregateOrdersByOption(shippedOrders);

    // API 호출
    const response = await fetch('/api/statements/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerSubAccountId,
        buyerInfo,
        sellerInfo,
        items,
        notes: [
          `${startDate} ~ ${endDate} 정산내역입니다.`,
          `상기 금액을 아래 계좌로 입금하여 주시기 바랍니다.`,
          `문의사항: ${sellerInfo?.phone || '02-1234-5678'} 또는 ${sellerInfo?.email || 'contact@dalraemarket.com'}`
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'PDF 생성 실패');
    }

    // PDF 다운로드
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `거래명세서_${startDate}_${endDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('[downloadPeriodStatementPDF] 오류:', error);
    alert('거래명세서 다운로드 중 오류가 발생했습니다.');
  }
}
