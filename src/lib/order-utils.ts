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
}

/**
 * 여러 주문 데이터에 옵션 상품 정보를 일괄 매핑
 *
 * 처리 흐름:
 * 1. 중복 옵션명 제거 후 일괄 조회
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

  // 중복 제거: 동일 옵션명은 한번만 조회
  const uniqueOptionNames = [...new Set(ordersData.map(order => order.option_name).filter(Boolean))];

  // option_products 테이블에서 옵션 정보 일괄 조회
  const { data: optionProducts, error } = await supabase
    .from('option_products')
    .select('option_name, option_code, seller_supply_price, shipping_entity, invoice_entity, shipping_location_name, shipping_location_address, shipping_location_contact, shipping_cost')
    .in('option_name', uniqueOptionNames);

  if (error) {
    console.error('[enrichOrdersWithOptionInfo] 옵션 상품 조회 실패:', error);
  }

  // 옵션명별 정보 맵 생성 (빠른 조회를 위해)
  const optionInfoMap = new Map<string, OptionProductInfo>();
  if (optionProducts) {
    optionProducts.forEach(product => {
      if (product.option_name) {
        optionInfoMap.set(product.option_name, {
          seller_supply_price: product.seller_supply_price,
          shipping_source: product.shipping_entity,        // 필드명 매핑
          invoice_issuer: product.invoice_entity,          // 필드명 매핑
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

    // 이미 클라이언트에서 값이 있으면 덮어쓰지 않음
    const hasExistingPrice = 'seller_supply_price' in order && order.seller_supply_price !== undefined && order.seller_supply_price !== null;
    const hasExistingSettlement = 'settlement_amount' in order && order.settlement_amount !== undefined && order.settlement_amount !== null;

    // 정산금액 = 공급단가 × 수량 (기존 값이 없을 때만 계산)
    let settlement_amount: number | undefined;
    if (!hasExistingSettlement && optionInfo.seller_supply_price && order.quantity) {
      const unitPrice = typeof optionInfo.seller_supply_price === 'string'
        ? parseFloat(optionInfo.seller_supply_price)
        : optionInfo.seller_supply_price;
      const qty = typeof order.quantity === 'string'
        ? parseInt(order.quantity)
        : order.quantity;

      if (!isNaN(unitPrice) && !isNaN(qty)) {
        settlement_amount = unitPrice * qty;
      }
    }

    return {
      ...order,
      // 기존 값이 없을 때만 optionInfo의 값 사용
      ...(hasExistingPrice ? {} : optionInfo),
      ...(settlement_amount !== undefined && { settlement_amount })
    };
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
    errors.push('옵션명은 필수입니다.');
  }

  // 추가 유효성 검사 규칙을 여기에 추가 가능

  return {
    valid: errors.length === 0,
    errors
  };
}
