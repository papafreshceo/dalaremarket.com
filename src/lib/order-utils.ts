import { createClient } from '@/lib/supabase/server';

/**
 * 옵션 상품 정보 인터페이스
 * option_products의 영문 컬럼 → integrated_orders의 영문 컬럼 매핑
 */
export interface OptionProductInfo {
  seller_supply_price?: number | string;
  shipping_source?: string;          // option_products.shipping_entity → integrated_orders.shipping_source
  invoice_issuer?: string;           // option_products.invoice_entity → integrated_orders.invoice_issuer
  vendor_name?: string;              // option_products에서 벤더 정보 (있다면)
  shipping_location_name?: string;   // 발송지명
  shipping_location_address?: string; // 발송지주소
  shipping_location_contact?: string; // 발송지연락처
  shipping_cost?: number | string;   // 출고비용
  product_amount?: number;           // 공급가
  discount_amount?: number;          // 할인액
  cash_used?: number;                // 사용캐시
  final_deposit_amount?: number;     // 최종입금액
}

/**
 * 여러 주문 데이터에 옵션 상품 정보를 일괄 매핑
 *
 * 처리 흐름:
 * 1. 중복 옵션상품 제거 후 일괄 조회
 * 2. option_products 테이블에서 공급단가 및 발송 정보 조회
 * 3. 각 주문에 옵션 정보 매핑
 * 4. 정산금액(공급단가 × 수량) 자동 계산
 *
 * @param ordersData - 주문 데이터 배열 (option_name 필드 필수)
 * @returns 옵션 상품 정보가 추가된 주문 데이터 배열
 */
export async function enrichOrdersWithOptionInfo<T extends { option_name: string; quantity?: string | number }>(
  ordersData: T[]
): Promise<Array<T & OptionProductInfo & { settlement_amount?: number }>> {
  const supabase = await createClient();

  // 중복 제거: 동일 옵션상품은 한번만 조회
  const uniqueOptionNames = [...new Set(ordersData.map(order => order.option_name).filter(Boolean))];

  if (uniqueOptionNames.length === 0) {
    return ordersData as Array<T & OptionProductInfo & { settlement_amount?: number }>;
  }

  // option_products 테이블에서 옵션 정보 일괄 조회 (shipping_vendor와 JOIN)

  const { data: optionProducts, error } = await supabase
    .from('option_products')
    .select(`
      option_name,
      option_code,
      seller_supply_price,
      shipping_entity,
      invoice_entity,
      shipping_location_name,
      shipping_location_address,
      shipping_location_contact,
      shipping_cost,
      shipping_vendor:partners!shipping_vendor_id(name)
    `)
    .in('option_name', uniqueOptionNames);

  if (error) {
    console.error('[enrichOrdersWithOptionInfo] 옵션 상품 조회 실패:', error);
  }


  // 옵션상품별 정보 맵 생성 (빠른 조회를 위해)
  const optionInfoMap = new Map<string, OptionProductInfo>();
  if (optionProducts) {
    optionProducts.forEach((product: any) => {
      if (product.option_name) {
        optionInfoMap.set(product.option_name, {
          seller_supply_price: product.seller_supply_price,
          shipping_source: product.shipping_entity,      // shipping_entity → shipping_source
          invoice_issuer: product.invoice_entity,        // invoice_entity → invoice_issuer
          vendor_name: product.shipping_vendor?.name || null,  // JOIN으로 가져온 벤더명
          shipping_location_name: product.shipping_location_name,
          shipping_location_address: product.shipping_location_address,
          shipping_location_contact: product.shipping_location_contact,
          shipping_cost: product.shipping_cost
        });
      }
    });
  }

  // 각 주문에 옵션 정보 매핑 및 정산금액 계산
  return ordersData.map(order => {
    const optionInfo = optionInfoMap.get(order.option_name) || {};
    const orderAny = order as any;

    // 원공급가 = 공급단가 × 수량
    let product_amount: number | undefined;
    const supplyPrice = optionInfo.seller_supply_price;
    if (supplyPrice && order.quantity) {
      const unitPrice = typeof supplyPrice === 'string'
        ? parseFloat(supplyPrice)
        : supplyPrice;
      const qty = typeof order.quantity === 'string'
        ? parseInt(order.quantity)
        : order.quantity;

      if (!isNaN(unitPrice) && !isNaN(qty)) {
        product_amount = unitPrice * qty;
      }
    }

    // 결과 생성: 기존 값이 의미있는 값이면 유지, 없으면 optionInfo로 채움
    const result: any = { ...order };

    // optionInfo의 각 필드를 체크하면서 추가
    Object.keys(optionInfo).forEach(key => {
      const existingValue = orderAny[key];
      // 기존 값이 없거나(undefined/null), 빈 문자열이면 optionInfo 값으로 채움
      if (existingValue === undefined || existingValue === null || existingValue === '') {
        result[key] = optionInfo[key];
      }
      // 기존에 의미있는 값이 있으면 유지 (덮어쓰지 않음)
    });

    // product_amount: 기존 값이 없을 때만 계산된 값 사용
    const existingProductAmount = orderAny.product_amount;
    if (existingProductAmount === undefined || existingProductAmount === null) {
      if (product_amount !== undefined) {
        result.product_amount = product_amount;
      }
    }
    // 기존에 product_amount가 있으면 유지 (관리자가 계산한 값 보존)

    // 할인액, 사용캐시, 최종입금액 계산
    // 기존 값이 없으면 기본값(0) 또는 계산값 사용
    const finalProductAmount = result.product_amount || product_amount || 0;

    // discount_amount: 기존 값이 없으면 0으로 설정
    if (result.discount_amount === undefined || result.discount_amount === null) {
      result.discount_amount = 0;
    }

    // cash_used: 기존 값이 없으면 0으로 설정
    if (result.cash_used === undefined || result.cash_used === null) {
      result.cash_used = 0;
    }

    // final_deposit_amount: 기존 값이 없으면 계산
    // 최종입금액 = 공급가 - 할인액 - 사용캐시
    if (result.final_deposit_amount === undefined || result.final_deposit_amount === null) {
      const discountAmount = Number(result.discount_amount) || 0;
      const cashUsed = Number(result.cash_used) || 0;
      result.final_deposit_amount = Math.max(0, finalProductAmount - discountAmount - cashUsed);
    }

    return result;
  });
}

/**
 * 주문 데이터의 필수 필드 유효성 검사
 *
 * @param orderData - 검사할 주문 데이터
 * @returns 유효성 검사 결과 { valid: boolean, errors: string[] }
 */
export function validateOrderData(orderData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!orderData.option_name || orderData.option_name.trim() === '') {
    errors.push('옵션상품은 필수입니다.');
  }

  // 추가 유효성 검사 규칙을 여기에 추가 가능

  return {
    valid: errors.length === 0,
    errors
  };
}
