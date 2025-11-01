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
 * 한국 시간(KST, UTC+9) 기준으로 날짜 생성
 */
export function generateSampleOrders(optionProducts: OptionProduct[]): SampleOrder[] {
  const orders: SampleOrder[] = [];

  // 한국 시간(KST) 기준 오늘 날짜
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const kstNow = new Date(now.getTime() + (kstOffset * 60 * 1000));
  const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());

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
    // 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (UTC 변환 없이)
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // 토요일(6)과 일요일(0)은 건너뛰기
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // 국공휴일은 건너뛰기
    if (isKoreanHoliday(currentDate)) {
      continue;
    }

    // 날짜별 주문 건수: 1~20건 랜덤
    const daysDiff = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const isToday = daysDiff === 0;
    const isThisWeek = daysDiff <= 7;
    const isThisMonth = daysDiff <= 30;

    // 하루 1~20건
    const ordersPerDay = Math.floor(Math.random() * 20) + 1;

    // 하루 발주금액 목표: 주문 건수에 비례하여 설정
    const dailyBudget = ordersPerDay * (Math.floor(Math.random() * 50000) + 50000); // 건당 5~10만원
    let usedBudget = 0;

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

      // 배송 상태: 날짜에 따라 다른 분포 (더 균등하고 자연스럽게)
      const statusRand = Math.random();
      let shippingStatus: string;
      let invoiceNumber: string | null;
      let shippingCompany: string | null;

      if (isToday) {
        // 오늘: 주로 발주서등록/확정, 가끔 빠른 처리도
        if (statusRand < 0.5) {
          shippingStatus = '발주서등록';
          invoiceNumber = null;
          shippingCompany = null;
        } else if (statusRand < 0.8) {
          shippingStatus = '발주서확정';
          invoiceNumber = null;
          shippingCompany = null;
        } else if (statusRand < 0.95) {
          shippingStatus = '상품준비중';
          invoiceNumber = null;
          shippingCompany = null;
        } else {
          // 5% - 당일 발송
          shippingStatus = '배송중';
          invoiceNumber = String(Math.floor(Math.random() * 900000000000) + 100000000000);
          shippingCompany = SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)];
        }
      } else if (isThisWeek) {
        // 이번주: 다양한 진행 단계
        if (statusRand < 0.15) {
          shippingStatus = '발주서확정';
          invoiceNumber = null;
          shippingCompany = null;
        } else if (statusRand < 0.35) {
          shippingStatus = '상품준비중';
          invoiceNumber = null;
          shippingCompany = null;
        } else if (statusRand < 0.7) {
          shippingStatus = '배송중';
          invoiceNumber = String(Math.floor(Math.random() * 900000000000) + 100000000000);
          shippingCompany = SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)];
        } else if (statusRand < 0.998) {
          shippingStatus = '배송완료';
          invoiceNumber = String(Math.floor(Math.random() * 900000000000) + 100000000000);
          shippingCompany = SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)];
        } else {
          // 0.2% - 취소 (매우 드물게)
          shippingStatus = '취소완료';
          invoiceNumber = null;
          shippingCompany = null;
        }
      } else if (isThisMonth) {
        // 이번달: 대부분 배송완료, 일부 진행중
        if (statusRand < 0.1) {
          shippingStatus = '배송중';
          invoiceNumber = String(Math.floor(Math.random() * 900000000000) + 100000000000);
          shippingCompany = SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)];
        } else if (statusRand < 0.997) {
          shippingStatus = '배송완료';
          invoiceNumber = String(Math.floor(Math.random() * 900000000000) + 100000000000);
          shippingCompany = SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)];
        } else if (statusRand < 0.999) {
          shippingStatus = '취소완료';
          invoiceNumber = null;
          shippingCompany = null;
        } else {
          shippingStatus = '환불완료';
          invoiceNumber = null;
          shippingCompany = null;
        }
      } else {
        // 이전: 모두 완료된 상태
        if (statusRand < 0.997) {
          shippingStatus = '배송완료';
          invoiceNumber = String(Math.floor(Math.random() * 900000000000) + 100000000000);
          shippingCompany = SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)];
        } else if (statusRand < 0.999) {
          shippingStatus = '취소완료';
          invoiceNumber = null;
          shippingCompany = null;
        } else {
          shippingStatus = '환불완료';
          invoiceNumber = null;
          shippingCompany = null;
        }
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
    // 한국 시간(KST)을 UTC로 변환하는 헬퍼 함수
    const kstToUTC = (dateStr: string, kstHour: number): string => {
      const [year, month, day] = dateStr.split('-').map(Number);
      // 한국 시간으로 Date 객체 생성
      const kstDate = new Date(year, month - 1, day, kstHour, 0, 0);
      // UTC로 변환 (KST - 9시간)
      const utcDate = new Date(kstDate.getTime() - (9 * 60 * 60 * 1000));
      return utcDate.toISOString();
    };

    const orderDateTime = kstToUTC(order.orderDate, 9); // KST 오전 9시

    // 발주확정일시: 발주서등록 상태만 null, 나머지는 모두 확정됨
    const confirmedDateTime = order.shippingStatus === '발주서등록'
      ? null
      : kstToUTC(order.orderDate, 10); // KST 오전 10시 확정

    const shippedDateTime = order.shippingStatus === '배송완료' || order.shippingStatus === '배송중'
      ? kstToUTC(order.orderDate, 14) // KST 오후 2시 발송
      : null;

    // 취소/환불 관련 필드
    const isCanceled = order.shippingStatus === '취소완료';
    const isRefunded = order.shippingStatus === '환불완료';
    const canceledDateTime = isCanceled || isRefunded
      ? kstToUTC(order.orderDate, 12) // KST 정오에 취소
      : null;
    const refundDateTime = isRefunded
      ? kstToUTC(order.orderDate, 16) // KST 오후 4시에 환불 처리
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
