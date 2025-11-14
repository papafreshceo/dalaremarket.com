/**
 * 샘플 주문 데이터 생성
 * - 1년치 주문 데이터
 * - 하루 발주금액 100만원 이하
 * - 실제 사이트의 option_products 기반
 * - 시드 기반 랜덤 생성으로 일관성 유지
 */

interface OptionProduct {
  id: string;
  option_name: string; // 옵션상품
  seller_supply_price?: number | null; // 공급단가
}

interface SampleOrder {
  orderNumber: string;
  orderDate: string; // YYYY-MM-DD
  sellerMarketName: string | null;
  optionName: string;
  quantity: number;
  supplyPrice: number;
  shippingStatus: string;
  invoiceNumber: string | null;
  shippingCompany: string | null;
}

const MARKETS = ['쿠팡', '네이버', '자사몰'];
const SHIPPING_COMPANIES = ['CJ대한통운', '로젠택배', '한진택배', '우체국택배'];

/**
 * 시드 기반 랜덤 생성기 (Mulberry32)
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

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
 * @param optionProducts - 옵션 상품 목록
 * @param organizationId - 조직 ID (시드값으로 사용하여 조직별로 다른 샘플 데이터 생성)
 */
export function generateSampleOrders(optionProducts: OptionProduct[], organizationId?: string): SampleOrder[] {
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
    return [];
  }

  // 🔑 organizationId를 숫자 시드로 변환 (UUID의 첫 8자리 해시)
  const orgSeed = organizationId
    ? parseInt(organizationId.replace(/-/g, '').substring(0, 8), 16)
    : 12345;

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

    // 🔑 날짜와 조직 ID를 조합하여 시드 생성 (조직별로 다른 데이터)
    const dateSeed = year * 10000 + (currentDate.getMonth() + 1) * 100 + currentDate.getDate();
    const combinedSeed = dateSeed + orgSeed; // 조직별로 고유한 시드
    const rng = new SeededRandom(combinedSeed);

    // 날짜별 주문 건수: 1~20건 (시드 기반)
    const daysDiff = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const isToday = daysDiff === 0;
    const isThisWeek = daysDiff <= 7;
    const isThisMonth = daysDiff <= 30;

    // 하루 1~20건
    const ordersPerDay = rng.nextInt(1, 20);

    // 하루 발주금액 목표: 주문 건수에 비례하여 설정
    const dailyBudget = ordersPerDay * (rng.nextInt(50000, 100000)); // 건당 5~10만원
    let usedBudget = 0;

    for (let i = 0; i < ordersPerDay && usedBudget < dailyBudget; i++) {
      // 랜덤 옵션 상품 선택 (시드 기반)
      const product = optionProducts[rng.nextInt(0, optionProducts.length - 1)];

      // 랜덤 마켓 선택 (20% 확률로 마켓 미지정, 시드 기반)
      const market = rng.next() < 0.2 ? null : MARKETS[rng.nextInt(0, MARKETS.length - 1)];

      // 공급가: 실제 seller_supply_price가 있으면 사용, 없으면 5,000원 ~ 50,000원 랜덤
      const supplyPrice = product.seller_supply_price && product.seller_supply_price > 0
        ? product.seller_supply_price
        : rng.nextInt(5, 50) * 1000;

      // 수량: 1 ~ 5개 (시드 기반)
      const quantity = rng.nextInt(1, 5);

      const orderTotal = supplyPrice * quantity;

      // 예산 초과 방지
      if (usedBudget + orderTotal > dailyBudget) {
        break;
      }

      usedBudget += orderTotal;

      // 배송 상태: 발주확정일로부터 경과 시간에 따라 자연스럽게 변화
      // 오늘 날짜와 발주확정일(currentDate)의 차이 계산
      const daysFromConfirm = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      const statusRand = rng.next();
      let shippingStatus: string;
      let invoiceNumber: string | null;
      let shippingCompany: string | null;

      if (daysFromConfirm >= 2) {
        // 발주확정 후 2일 이상 경과: 99% 발송완료, 0.5% 취소, 0.5% 환불
        if (statusRand < 0.99) {
          shippingStatus = '배송완료';
          invoiceNumber = String(rng.nextInt(100000000000, 999999999999));
          shippingCompany = SHIPPING_COMPANIES[rng.nextInt(0, SHIPPING_COMPANIES.length - 1)];
        } else if (statusRand < 0.995) {
          shippingStatus = '취소완료';
          invoiceNumber = null;
          shippingCompany = null;
        } else {
          shippingStatus = '환불완료';
          invoiceNumber = null;
          shippingCompany = null;
        }
      } else if (daysFromConfirm === 1) {
        // 발주확정 후 1일: 10% 발주서확정, 30% 상품준비중, 60% 배송완료
        if (statusRand < 0.10) {
          shippingStatus = '발주서확정';
          invoiceNumber = null;
          shippingCompany = null;
        } else if (statusRand < 0.40) {
          shippingStatus = '상품준비중';
          invoiceNumber = null;
          shippingCompany = null;
        } else {
          shippingStatus = '배송완료';
          invoiceNumber = String(rng.nextInt(100000000000, 999999999999));
          shippingCompany = SHIPPING_COMPANIES[rng.nextInt(0, SHIPPING_COMPANIES.length - 1)];
        }
      } else {
        // 발주확정 당일(0일): 30% 발주서등록, 50% 발주서확정, 20% 상품준비중
        if (statusRand < 0.30) {
          shippingStatus = '발주서등록';
          invoiceNumber = null;
          shippingCompany = null;
        } else if (statusRand < 0.80) {
          shippingStatus = '발주서확정';
          invoiceNumber = null;
          shippingCompany = null;
        } else {
          shippingStatus = '상품준비중';
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

    // order.orderDate를 발주확정일 기준으로 사용
    const confirmedDateTime = order.shippingStatus === '발주서등록'
      ? null
      : kstToUTC(order.orderDate, 10); // KST 오전 10시 확정

    // 등록일(created_at): 확정일보다 0~2일 전
    let orderDateTime: string;
    if (order.shippingStatus === '발주서등록') {
      // 발주서등록 상태: orderDate가 등록일
      orderDateTime = kstToUTC(order.orderDate, 9);
    } else {
      // 나머지 상태: 확정일보다 0~2일 전에 등록
      const daysBeforeConfirm = Math.floor(Math.random() * 3); // 0, 1, 2일 전
      const [year, month, day] = order.orderDate.split('-').map(Number);
      const confirmDate = new Date(year, month - 1, day);
      confirmDate.setDate(confirmDate.getDate() - daysBeforeConfirm);
      const regYear = confirmDate.getFullYear();
      const regMonth = String(confirmDate.getMonth() + 1).padStart(2, '0');
      const regDay = String(confirmDate.getDate()).padStart(2, '0');
      orderDateTime = kstToUTC(`${regYear}-${regMonth}-${regDay}`, 9);
    }

    // 발송일(shipped_date): 확정일보다 1~5일 후
    let shippedDateTime: string | null = null;
    if (order.shippingStatus === '배송완료') {
      const daysAfterConfirm = Math.floor(Math.random() * 5) + 1; // 1~5일 후
      const [year, month, day] = order.orderDate.split('-').map(Number);
      const confirmDate = new Date(year, month - 1, day);
      confirmDate.setDate(confirmDate.getDate() + daysAfterConfirm);
      const shipYear = confirmDate.getFullYear();
      const shipMonth = String(confirmDate.getMonth() + 1).padStart(2, '0');
      const shipDay = String(confirmDate.getDate()).padStart(2, '0');
      shippedDateTime = kstToUTC(`${shipYear}-${shipMonth}-${shipDay}`, 14);
    }

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
