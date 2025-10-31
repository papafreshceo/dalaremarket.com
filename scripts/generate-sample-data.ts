/**
 * 샘플 주문 데이터 JSON 생성 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/generate-sample-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface OptionProduct {
  id: string;
  option_name: string;
  seller_supply_price: number;
}

interface SampleOrder {
  orderNumber: string;
  orderDate: string;
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

// 일반적인 농산물 옵션 상품 (샘플용)
const SAMPLE_OPTION_PRODUCTS: OptionProduct[] = [
  // 사과류
  { id: 'sample-1', option_name: '후지사과 5kg', seller_supply_price: 25000 },
  { id: 'sample-2', option_name: '후지사과 10kg', seller_supply_price: 45000 },
  { id: 'sample-3', option_name: '홍로사과 5kg', seller_supply_price: 28000 },

  // 배류
  { id: 'sample-4', option_name: '신고배 5kg', seller_supply_price: 30000 },
  { id: 'sample-5', option_name: '신고배 10kg', seller_supply_price: 55000 },
  { id: 'sample-6', option_name: '황금배 5kg', seller_supply_price: 32000 },

  // 감귤류
  { id: 'sample-7', option_name: '한라봉 3kg', seller_supply_price: 25000 },
  { id: 'sample-8', option_name: '한라봉 5kg', seller_supply_price: 40000 },
  { id: 'sample-9', option_name: '천혜향 3kg', seller_supply_price: 27000 },
  { id: 'sample-10', option_name: '레드향 3kg', seller_supply_price: 26000 },

  // 딸기
  { id: 'sample-11', option_name: '설향딸기 500g', seller_supply_price: 12000 },
  { id: 'sample-12', option_name: '설향딸기 1kg', seller_supply_price: 22000 },
  { id: 'sample-13', option_name: '금실딸기 500g', seller_supply_price: 13000 },

  // 포도
  { id: 'sample-14', option_name: '샤인머스캣 2kg', seller_supply_price: 35000 },
  { id: 'sample-15', option_name: '샤인머스캣 5kg', seller_supply_price: 80000 },
  { id: 'sample-16', option_name: '캠벨포도 2kg', seller_supply_price: 15000 },

  // 복숭아
  { id: 'sample-17', option_name: '백도복숭아 5kg', seller_supply_price: 28000 },
  { id: 'sample-18', option_name: '황도복숭아 5kg', seller_supply_price: 26000 },

  // 수박
  { id: 'sample-19', option_name: '흑수박 1통', seller_supply_price: 18000 },
  { id: 'sample-20', option_name: '애플수박 1통', seller_supply_price: 16000 },

  // 참외/멜론
  { id: 'sample-21', option_name: '성주참외 5kg', seller_supply_price: 20000 },
  { id: 'sample-22', option_name: '머스크멜론 3kg', seller_supply_price: 30000 },

  // 채소류
  { id: 'sample-23', option_name: '청상추 1kg', seller_supply_price: 5000 },
  { id: 'sample-24', option_name: '배추 10kg', seller_supply_price: 12000 },
  { id: 'sample-25', option_name: '무 5kg', seller_supply_price: 8000 },
  { id: 'sample-26', option_name: '완숙토마토 3kg', seller_supply_price: 15000 },
  { id: 'sample-27', option_name: '파프리카 1kg', seller_supply_price: 8000 },

  // 견과류
  { id: 'sample-28', option_name: '국내산밤 1kg', seller_supply_price: 12000 },
  { id: 'sample-29', option_name: '건대추 500g', seller_supply_price: 15000 },
  { id: 'sample-30', option_name: '국내산호두 500g', seller_supply_price: 18000 },
];

/**
 * 한국 공휴일 체크
 */
function isKoreanHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 양력 공휴일
  const holidays = [
    { month: 1, day: 1 },
    { month: 3, day: 1 },
    { month: 5, day: 5 },
    { month: 6, day: 6 },
    { month: 8, day: 15 },
    { month: 10, day: 3 },
    { month: 10, day: 9 },
    { month: 12, day: 25 },
  ];

  if (holidays.some(h => h.month === month && h.day === day)) {
    return true;
  }

  // 음력 공휴일 (2024-2025)
  const year = date.getFullYear();
  const lunarHolidays2024 = [
    { year: 2024, month: 2, days: [9, 10, 11, 12] },
    { year: 2024, month: 5, days: [15] },
    { year: 2024, month: 9, days: [16, 17, 18] },
  ];

  const lunarHolidays2025 = [
    { year: 2025, month: 1, days: [28, 29, 30] },
    { year: 2025, month: 5, days: [5] },
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
function generateSampleOrders(): SampleOrder[] {
  const orders: SampleOrder[] = [];
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  let orderCounter = 1;

  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    const dateString = currentDate.toISOString().split('T')[0];

    // 주말 건너뛰기
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // 공휴일 건너뛰기
    if (isKoreanHoliday(currentDate)) {
      continue;
    }

    // 하루 발주금액: 50만원 ~ 100만원
    const dailyBudget = Math.floor(Math.random() * 500000) + 500000;
    let usedBudget = 0;

    // 하루 주문 개수: 3~8개
    const ordersPerDay = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < ordersPerDay && usedBudget < dailyBudget; i++) {
      const product = SAMPLE_OPTION_PRODUCTS[Math.floor(Math.random() * SAMPLE_OPTION_PRODUCTS.length)];
      const market = MARKETS[Math.floor(Math.random() * MARKETS.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const orderTotal = product.seller_supply_price * quantity;

      if (usedBudget + orderTotal > dailyBudget) {
        break;
      }

      usedBudget += orderTotal;

      // 일단 모두 배송완료로 생성 (나중에 상태 변경)
      orders.push({
        orderNumber: `SAMPLE-${dateString}-${String(orderCounter).padStart(4, '0')}`,
        orderDate: dateString,
        sellerMarketName: market,
        optionName: product.option_name,
        quantity,
        supplyPrice: product.seller_supply_price,
        shippingStatus: '배송완료',
        invoiceNumber: String(Math.floor(Math.random() * 900000000000) + 100000000000),
        shippingCompany: SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)],
      });

      orderCounter++;
    }
  }

  // 배송 상태 분배: 취소완료 32건, 환불완료 30건 고정
  const CANCELED_COUNT = 32;
  const REFUNDED_COUNT = 30;

  // 랜덤하게 섞기
  const shuffledOrders = orders.sort(() => Math.random() - 0.5);

  // 처음 32건을 취소완료로
  for (let i = 0; i < CANCELED_COUNT && i < shuffledOrders.length; i++) {
    shuffledOrders[i].shippingStatus = '취소완료';
    shuffledOrders[i].invoiceNumber = null;
    shuffledOrders[i].shippingCompany = null;
  }

  // 다음 30건을 환불완료로
  for (let i = CANCELED_COUNT; i < CANCELED_COUNT + REFUNDED_COUNT && i < shuffledOrders.length; i++) {
    shuffledOrders[i].shippingStatus = '환불완료';
    shuffledOrders[i].invoiceNumber = null;
    shuffledOrders[i].shippingCompany = null;
  }

  // 나머지 중 일부를 배송중, 배송대기로 변경
  const remainingStart = CANCELED_COUNT + REFUNDED_COUNT;
  const remainingCount = shuffledOrders.length - remainingStart;
  const shippingCount = Math.floor(remainingCount * 0.1); // 10% 배송중
  const waitingCount = Math.floor(remainingCount * 0.05); // 5% 배송대기

  for (let i = remainingStart; i < remainingStart + shippingCount; i++) {
    shuffledOrders[i].shippingStatus = '배송중';
  }

  for (let i = remainingStart + shippingCount; i < remainingStart + shippingCount + waitingCount; i++) {
    shuffledOrders[i].shippingStatus = '배송대기';
    shuffledOrders[i].invoiceNumber = null;
    shuffledOrders[i].shippingCompany = null;
  }

  // 날짜순으로 다시 정렬
  return shuffledOrders.sort((a, b) => a.orderDate.localeCompare(b.orderDate));
}

/**
 * 템플릿 형식으로 변환 (옵션명/공급단가 제외)
 */
function convertToTemplate(sampleOrders: SampleOrder[]) {
  const cancelReasons = [
    '고객 단순 변심',
    '배송 지연',
    '상품 품절',
    '주소 오류',
    '중복 주문',
  ];

  return sampleOrders.map(order => {
    const orderDateTime = order.orderDate + 'T09:00:00Z';
    const confirmedDateTime = order.orderDate + 'T10:00:00Z';
    const shippedDateTime = order.shippingStatus === '배송완료' || order.shippingStatus === '배송중'
      ? order.orderDate + 'T14:00:00Z'
      : null;

    const isCanceled = order.shippingStatus === '취소완료';
    const isRefunded = order.shippingStatus === '환불완료';
    const canceledDateTime = isCanceled || isRefunded
      ? order.orderDate + 'T12:00:00Z'
      : null;
    const refundDateTime = isRefunded
      ? order.orderDate + 'T16:00:00Z'
      : null;
    const cancelReason = isCanceled || isRefunded
      ? cancelReasons[Math.floor(Math.random() * cancelReasons.length)]
      : null;

    return {
      order_number: order.orderNumber,
      order_date: order.orderDate,
      seller_market_name: order.sellerMarketName,
      // option_name과 seller_supply_price는 API에서 실제 데이터로 채움
      quantity: order.quantity,
      shipping_status: order.shippingStatus,
      invoice_number: order.invoiceNumber,
      shipping_company: order.shippingCompany,
      courier_company: order.shippingCompany,
      tracking_number: order.invoiceNumber,
      created_at: orderDateTime,
      confirmed_at: confirmedDateTime,
      shipped_date: shippedDateTime,
      canceled_at: canceledDateTime,
      cancel_reason: cancelReason,
      refund_processed_at: refundDateTime,
      is_sample: true,
    };
  });
}

// 메인 실행
console.log('📊 샘플 주문 템플릿 생성 시작...');

const sampleOrders = generateSampleOrders();
const templateOrders = convertToTemplate(sampleOrders);

const outputPath = path.join(__dirname, '..', 'src', 'lib', 'sample-orders-template.json');

fs.writeFileSync(outputPath, JSON.stringify(templateOrders, null, 2), 'utf-8');

console.log(`✅ 샘플 데이터 템플릿 생성 완료: ${templateOrders.length}건`);
console.log(`📁 저장 위치: ${outputPath}`);
