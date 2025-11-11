import { createClient } from '@/lib/supabase/client';

interface MappingResult {
  original: string;
  mapped: string;
  count: number;
  isUnmatched?: boolean;
}

interface ApplyMappingResult {
  orders: any[];
  mappingResults: MappingResult[];
  totalOrders: number;
  mappedOrders: number;
  unmatchedCount: number;
}

/**
 * 주문 목록에 옵션상품 매핑을 적용 (조직 단위)
 * @param orders - 원본 주문 목록
 * @param userId - 사용자 ID
 * @returns 매핑이 적용된 주문 목록과 변환 결과
 */
export async function applyOptionMapping(
  orders: any[],
  userId: string
): Promise<ApplyMappingResult> {
  try {
    const supabase = createClient();

    // 🔒 사용자의 조직 정보 가져오기
    const { data: userData } = await supabase
      .from('users')
      .select('primary_organization_id')
      .eq('id', userId)
      .single();

    if (!userData?.primary_organization_id) {
      console.warn('[applyOptionMapping] 조직 정보 없음:', userId);
      return {
        orders,
        mappingResults: [],
        totalOrders: orders.length,
        mappedOrders: 0,
        unmatchedCount: 0
      };
    }

    // 조직의 옵션상품 매핑 설정 가져오기
    const { data: mappings, error } = await supabase
      .from('option_name_mappings')
      .select('user_option_name, site_option_name')
      .eq('organization_id', userData.primary_organization_id);

    if (error) {
      console.error('옵션상품 매핑 조회 오류:', error);
      return {
        orders,
        mappingResults: [],
        totalOrders: orders.length,
        mappedOrders: 0,
        unmatchedCount: 0
      };
    }

    // 매핑이 없으면 원본 반환
    if (!mappings || mappings.length === 0) {
      return {
        orders,
        mappingResults: [],
        totalOrders: orders.length,
        mappedOrders: 0,
        unmatchedCount: 0
      };
    }

    // 매핑 맵 생성 (대소문자 무시, 공백 제거)
    const mappingMap = new Map<string, string>();
    mappings.forEach(mapping => {
      const key = mapping.user_option_name.trim().toLowerCase();
      mappingMap.set(key, mapping.site_option_name);
    });

    // 변환 통계
    const conversionStats = new Map<string, { original: string; mapped: string; count: number }>();
    let mappedCount = 0;

    // 주문에 매핑 적용
    const mappedOrders = orders.map(order => {
      const originalOptionName = order.optionName || '';
      const key = originalOptionName.trim().toLowerCase();

      if (mappingMap.has(key)) {
        const mappedOptionName = mappingMap.get(key)!;

        // 통계 업데이트
        const statsKey = `${originalOptionName}->${mappedOptionName}`;
        if (conversionStats.has(statsKey)) {
          const stat = conversionStats.get(statsKey)!;
          stat.count++;
        } else {
          conversionStats.set(statsKey, {
            original: originalOptionName,
            mapped: mappedOptionName,
            count: 1
          });
        }

        mappedCount++;

        return {
          ...order,
          optionName: mappedOptionName,
          _originalOptionName: originalOptionName,
          _mappingApplied: true
        };
      }

      return order;
    });

    // 변환 결과 배열로 변환
    const mappingResults = Array.from(conversionStats.values());

    return {
      orders: mappedOrders,
      mappingResults,
      totalOrders: orders.length,
      mappedOrders: mappedCount
    };
  } catch (error) {
    console.error('옵션상품 매핑 적용 오류:', error);
    return {
      orders,
      mappingResults: [],
      totalOrders: orders.length,
      mappedOrders: 0,
      unmatchedCount: 0
    };
  }
}
