import { createClient } from '@/lib/supabase/server';

/**
 * 옵션 상품 정보 인터페이스
 */
export interface OptionProductInfo {
  seller_supply_price?: number | string;
  출고?: string;
  송장?: string;
  벤더사?: string;
  발송지명?: string;
  발송지주소?: string;
  발송지연락처?: string;
  출고비용?: number | string;
}

/**
 * 옵션명을 기준으로 option_products 테이블에서 상품 정보를 조회하여 반환
 *
 * @param optionName - 조회할 옵션명
 * @returns 옵션 상품 정보 객체 (없으면 빈 객체)
 */
export async function getOptionProductInfo(optionName: string): Promise<OptionProductInfo> {
  if (!optionName || optionName.trim() === '') {
    return {};
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('option_products')
      .select('seller_supply_price, 출고, 송장, 벤더사, 발송지명, 발송지주소, 발송지연락처, 출고비용')
      .eq('option_name', optionName.trim())
      .single();

    if (error) {
      // 데이터가 없는 경우는 에러로 처리하지 않음
      if (error.code === 'PGRST116') {
        console.log(`옵션명 "${optionName}"에 해당하는 상품 정보가 없습니다.`);
        return {};
      }

      console.error('옵션 상품 정보 조회 실패:', error);
      return {};
    }

    // null 값들을 제거하고 실제 값만 반환
    const result: OptionProductInfo = {};

    if (data?.seller_supply_price !== null && data?.seller_supply_price !== undefined) {
      result.seller_supply_price = data.seller_supply_price;
    }
    if (data?.출고) result.출고 = data.출고;
    if (data?.송장) result.송장 = data.송장;
    if (data?.벤더사) result.벤더사 = data.벤더사;
    if (data?.발송지명) result.발송지명 = data.발송지명;
    if (data?.발송지주소) result.발송지주소 = data.발송지주소;
    if (data?.발송지연락처) result.발송지연락처 = data.발송지연락처;
    if (data?.출고비용 !== null && data?.출고비용 !== undefined) {
      result.출고비용 = data.출고비용;
    }

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
