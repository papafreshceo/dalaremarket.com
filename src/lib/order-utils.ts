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
 * 옵션명을 기준으로 option_products 테이블에서 상품 정보를 조회하여 반환
 *
 * @param optionName - 조회할 옵션명
 * @returns 옵션 상품 정보 객체 (없으면 빈 객체)
 */
export async function getOptionProductInfo(optionName: string): Promise<OptionProductInfo> {
  if (!optionName || optionName.trim() === '') {
    console.log('⚠️ [getOptionProductInfo] 옵션명이 비어있음');
    return {};
  }

  try {
    const supabase = await createClient();

    console.log(`🔍 [getOptionProductInfo] 옵션명 조회: "${optionName}"`);

    // 벤더 정보를 포함하여 조회 (shipping_vendor_id → partners 조인)
    const { data, error } = await supabase
      .from('option_products')
      .select(`
        seller_supply_price,
        shipping_entity,
        invoice_entity,
        shipping_location_name,
        shipping_location_address,
        shipping_location_contact,
        shipping_cost,
        shipping_vendor:partners!shipping_vendor_id(name)
      `)
      .eq('option_name', optionName.trim())
      .single();

    if (error) {
      // 데이터가 없는 경우는 에러로 처리하지 않음
      if (error.code === 'PGRST116') {
        console.log(`❌ [getOptionProductInfo] 옵션명 "${optionName}"에 해당하는 상품 정보가 없습니다.`);
        return {};
      }

      console.error('❌ [getOptionProductInfo] 옵션 상품 정보 조회 실패:', error);
      return {};
    }

    console.log(`✅ [getOptionProductInfo] 조회 성공:`, data);

    // null 값들을 제거하고 실제 값만 반환
    // option_products의 컬럼명 → integrated_orders의 컬럼명으로 매핑
    const result: OptionProductInfo = {};

    if (data?.seller_supply_price !== null && data?.seller_supply_price !== undefined) {
      result.seller_supply_price = data.seller_supply_price;
    }
    // shipping_entity → shipping_source로 매핑
    if (data?.shipping_entity) result.shipping_source = data.shipping_entity;
    // invoice_entity → invoice_issuer로 매핑
    if (data?.invoice_entity) result.invoice_issuer = data.invoice_entity;
    // shipping_vendor 조인 결과 → vendor_name으로 매핑
    if (data?.shipping_vendor?.name) result.vendor_name = data.shipping_vendor.name;
    if (data?.shipping_location_name) result.shipping_location_name = data.shipping_location_name;
    if (data?.shipping_location_address) result.shipping_location_address = data.shipping_location_address;
    if (data?.shipping_location_contact) result.shipping_location_contact = data.shipping_location_contact;
    if (data?.shipping_cost !== null && data?.shipping_cost !== undefined) {
      result.shipping_cost = data.shipping_cost;
    }

    console.log(`📦 [getOptionProductInfo] 최종 매핑 결과:`, result);
    return result;
  } catch (error) {
    console.error('getOptionProductInfo 오류:', error);
    return {};
  }
}

/**
 * 주문 데이터에 옵션 상품 정보를 자동으로 매핑
 *
 * @param orderData - 주문 데이터 (option_name 필드 필수)
 * @returns 옵션 상품 정보가 추가된 주문 데이터
 */
export async function enrichOrderWithOptionInfo<T extends { option_name: string }>(
  orderData: T
): Promise<T & OptionProductInfo> {
  const optionInfo = await getOptionProductInfo(orderData.option_name);

  return {
    ...orderData,
    ...optionInfo
  };
}

/**
 * 여러 주문 데이터에 옵션 상품 정보를 일괄 매핑
 *
 * @param ordersData - 주문 데이터 배열
 * @returns 옵션 상품 정보가 추가된 주문 데이터 배열
 */
export async function enrichOrdersWithOptionInfo<T extends { option_name: string }>(
  ordersData: T[]
): Promise<Array<T & OptionProductInfo>> {
  // 성능 최적화: 중복된 옵션명 제거하여 한번만 조회
  const uniqueOptionNames = [...new Set(ordersData.map(order => order.option_name))];

  // 옵션명별 정보를 미리 조회하여 캐시
  const optionInfoMap = new Map<string, OptionProductInfo>();

  await Promise.all(
    uniqueOptionNames.map(async (optionName) => {
      const info = await getOptionProductInfo(optionName);
      optionInfoMap.set(optionName, info);
    })
  );

  // 각 주문에 캐시된 정보 매핑
  return ordersData.map(order => ({
    ...order,
    ...optionInfoMap.get(order.option_name)
  }));
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
