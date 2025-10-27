import { createClient } from '@/lib/supabase/server';

/**
 * 서버사이드 옵션명 매핑 적용
 *
 * 사용자가 설정한 옵션명 매핑 규칙을 적용하여 마켓의 옵션명을 사이트 옵션명으로 변환
 * 예: "반시2.5kg (중)" → "반시2.5kg(중)" (공백 차이 보정)
 *
 * @param orders - 주문 데이터 배열 (option_name 필드 포함)
 * @param userId - 사용자 ID
 * @returns 옵션명이 매핑된 주문 배열
 */
export async function applyOptionMappingToOrdersServer(
  orders: any[],
  userId: string
): Promise<any[]> {
  try {
    const supabase = await createClient();

    // 사용자의 옵션명 매핑 설정 조회
    const { data: mappings, error } = await supabase
      .from('option_name_mappings')
      .select('user_option_name, site_option_name')
      .eq('seller_id', userId);

    // 매핑 설정이 없으면 원본 그대로 반환
    if (error || !mappings || mappings.length === 0) {
      return orders;
    }

    // 빠른 조회를 위한 매핑 맵 생성 (대소문자 무시, 공백 제거)
    const mappingMap = new Map<string, string>();
    mappings.forEach(mapping => {
      const key = mapping.user_option_name.trim().toLowerCase();
      mappingMap.set(key, mapping.site_option_name);
    });

    // 주문에 매핑 적용
    const mappedOrders = orders.map(order => {
      const originalOptionName = order.option_name || '';
      const key = originalOptionName.trim().toLowerCase();

      // 매핑 규칙이 있으면 변환
      if (mappingMap.has(key)) {
        return {
          ...order,
          option_name: mappingMap.get(key)!
        };
      }

      return order;
    });

    return mappedOrders;
  } catch (error) {
    console.error('[applyOptionMappingToOrdersServer] 오류:', error);
    return orders;
  }
}
