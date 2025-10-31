/**
 * 샘플 주문 데이터 생성
 * - 1년치 주문 데이터
 * - 하루 발주금액 100만원 이하
 * - 실제 사이트의 option_products 기반
 */

interface OptionProduct {
  id: string;
  option_name: string; // 옵션명
  seller_supply_price?: number | null; // 공급단가
}

interface SampleOrder {
  orderNumber: string;
  orderDate: string; // YYYY-MM-DD
  sellerMarketName: string;
  optionName: string;
  quantity: number;
  supplyPrice: number;
  shippingStatus: string;
  invoiceNumber: string | null;
  shippingCompany: string | null;
}

const MARKETS = ['쿠팡', '네이버', 'B2B', '자사몰'];
const SHIPPING_COMPANIES = ['CJ대한통운', '로젠택배', '한진택배', '우체국택배'];

/**
 * 한국 공휴일 체크 (양력 공휴일)
 */
function isKoreanHoliday(date: Date): boolean {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // 양력 공휴일
  const holidays = [
    { month: 1, day: 1 },    // 신정
    { month: 3, day: 1 },    // 삼일절
    { month: 5, day: 5 },    // 어린이날
    { month: 6, day: 6 },    // 현충일
    { month: 8, day: 15 },   // 광복절
    { month: 10, day: 3 },   // 개천절
    { month: 10, day: 9 },   // 한글날
    { month: 12, day: 25 },  // 성탄절
  ];

  // 양력 공휴일 체크
  if (holidays.some(h => h.month === month && h.day === day)) {
    return true;
  }

  // 음력 공휴일은 매년 다르므로 대략적인 기간으로 체크
  // 설날 연휴: 1월 말 ~ 2월 중순 (3일 연속)
  // 추석 연휴: 9월 중순 ~ 10월 초 (3일 연속)
  // 부처님오신날: 5월 중순

  // 간단하게 2024-2025년 기준 음력 공휴일 (샘플 데이터용)
  const year = date.getFullYear();
  const lunarHolidays2024 = [
    // 2024년 설날 연휴 (2월 9-12일)
    { year: 2024, month: 2, days: [9, 10, 11, 12] },
    // 2024년 부처님오신날 (5월 15일)
    { year: 2024, month: 5, days: [15] },
    // 2024년 추석 연휴 (9월 16-18일)
    { year: 2024, month: 9, days: [16, 17, 18] },
  ];

  const lunarHolidays2025 = [
    // 2025년 설날 연휴 (1월 28-30일)
    { year: 2025, month: 1, days: [28, 29, 30] },
    // 2025년 부처님오신날 (5월 5일)
    { year: 2025, month: 5, days: [5] },
    // 2025년 추석 연휴 (10월 5-8일)
    { year: 2025, month: 10, days: [5, 6, 7, 8] },
  ];

  const allLunarHolidays = [...lunarHolidays2024, ...lunarHolidays2025];

  for (const holiday of allLunarHolidays) {
    if (holiday.year === year && holiday.month === month && holiday.days.includes(day)) {
      return true;
    }
  }

  return false;
}

/**
 * 1년치 샘플 주문 데이터 생성
 */
export function generateSampleOrders(optionProducts: OptionProduct[]): SampleOrder[] {
  const orders: SampleOrder[] = [];
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  let orderCounter = 1;

  // 옵션 상품이 없으면 빈 배열 반환
  if (optionProducts.length === 0) {
    console.warn('[generateSampleOrders] 옵션 상품이 없습니다.');
    return [];
  }

  // 1년치 날짜 순회
  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    const dateString = currentDate.toISOString().split('T')[0];

    // 토요일(6)과 일요일(0)은 건너뛰기
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // 국공휴일은 건너뛰기
    if (isKoreanHoliday(currentDate)) {
      continue;
    }

    // 하루 발주금액 목표: 50만원 ~ 100만원 사이 랜덤
    const dailyBudget = Math.floor(Math.random() * 500000) + 500000;
    let usedBudget = 0;

    // 하루에 생성할 주문 개수: 3~8개
    const ordersPerDay = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < ordersPerDay && usedBudget < dailyBudget; i++) {
      // 랜덤 옵션 상품 선택
      const product = optionProducts[Math.floor(Math.random() * optionProducts.length)];

      // 랜덤 마켓 선택
      const market = MARKETS[Math.floor(Math.random() * MARKETS.length)];

      // 공급가: 실제 seller_supply_price가 있으면 사용, 없으면 5,000원 ~ 50,000원 랜덤
      const supplyPrice = product.seller_supply_price && product.seller_supply_price > 0
        ? product.seller_supply_price
        : Math.floor(Math.random() * 45000 / 1000) * 1000 + 5000;

      // 수량: 1 ~ 5개
      const quantity = Math.floor(Math.random() * 5) + 1;

      const orderTotal = supplyPrice * quantity;

      // 예산 초과 방지
      if (usedBudget + orderTotal > dailyBudget) {
        break;
      }

      usedBudget += orderTotal;

      // 배송 상태: 70% 배송완료, 10% 배송중, 5% 배송대기, 10% 취소완료, 5% 환불완료
      const rand = Math.random();
      let shippingStatus: string;
      let invoiceNumber: string | null;
      let shippingCompany: string | null;

      if (rand < 0.7) {
        // 70% 배송완료
        shippingStatus = '배송완료';
        invoiceNumber = String(Math.floor(Math.random() * 900000000000) + 100000000000);
        shippingCompany = SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)];
      } else if (rand < 0.8) {
        // 10% 배송중
        shippingStatus = '배송중';
        invoiceNumber = String(Math.floor(Math.random() * 900000000000) + 100000000000);
        shippingCompany = SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)];
      } else if (rand < 0.85) {
        // 5% 배송대기
        shippingStatus = '배송대기';
        invoiceNumber = null;
        shippingCompany = null;
      } else if (rand < 0.95) {
        // 10% 취소완료
        shippingStatus = '취소완료';
        invoiceNumber = null;
        shippingCompany = null;
      } else {
        // 5% 환불완료
        shippingStatus = '환불완료';
        invoiceNumber = null;
        shippingCompany = null;
      }

      orders.push({
        orderNumber: `SAMPLE-${dateString}-${String(orderCounter).padStart(4, '0')}`,
        orderDate: dateString,
        sellerMarketName: market,
        optionName: product.option_name,
        quantity,
        supplyPrice,
        shippingStatus,
        invoiceNumber,
        shippingCompany,
      });

      orderCounter++;
    }
  }

  return orders;
}

/**
 * 샘플 데이터를 DB 주문 형식으로 변환
 */
export function convertSampleOrdersToDBFormat(sampleOrders: SampleOrder[], sellerId: string) {
  const cancelReasons = [
    '고객 단순 변심',
    '배송 지연',
    '상품 품절',
    '주소 오류',
    '중복 주문',
  ];

  return sampleOrders.map(order => {
    const orderDateTime = order.orderDate + 'T09:00:00Z'; // 오전 9시로 설정
    const confirmedDateTime = order.orderDate + 'T10:00:00Z'; // 1시간 후 확정
    const shippedDateTime = order.shippingStatus === '배송완료' || order.shippingStatus === '배송중'
      ? order.orderDate + 'T14:00:00Z' // 오후 2시 발송
      : null;

    // 취소/환불 관련 필드
    const isCanceled = order.shippingStatus === '취소완료';
    const isRefunded = order.shippingStatus === '환불완료';
    const canceledDateTime = isCanceled || isRefunded
      ? order.orderDate + 'T12:00:00Z' // 정오에 취소
      : null;
    const refundDateTime = isRefunded
      ? order.orderDate + 'T16:00:00Z' // 오후 4시에 환불 처리
      : null;
    const cancelReason = isCanceled || isRefunded
      ? cancelReasons[Math.floor(Math.random() * cancelReasons.length)]
      : null;

    return {
      order_number: order.orderNumber,
      order_date: order.orderDate,
      seller_market_name: order.sellerMarketName,
      option_name: order.optionName,
      quantity: order.quantity,
      seller_supply_price: order.supplyPrice, // 셀러 공급단가
      settlement_amount: order.supplyPrice * order.quantity, // 정산금액 (공급단가 × 수량)
      shipping_status: order.shippingStatus,
      invoice_number: order.invoiceNumber,
      shipping_company: order.shippingCompany,
      courier_company: order.shippingCompany, // 택배사 (courier_company도 설정)
      tracking_number: order.invoiceNumber, // 송장번호 (tracking_number도 설정)
      seller_id: sellerId, // 사용자 ID 추가
      created_at: orderDateTime,
      confirmed_at: confirmedDateTime, // 발주확정일시 (캘린더 표시용)
      shipped_date: shippedDateTime, // 발송일 (배송완료/배송중인 경우만)
      canceled_at: canceledDateTime, // 취소일
      cancel_reason: cancelReason, // 취소 사유
      refund_processed_at: refundDateTime, // 환불 처리일
      // 샘플 데이터 표시용 필드
      is_sample: true,
    };
  });
}
