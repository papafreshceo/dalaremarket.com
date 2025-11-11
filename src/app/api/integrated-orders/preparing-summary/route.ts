import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import { getOrganizationDataFilter } from '@/lib/organization-utils';

/**
 * GET /api/integrated-orders/preparing-summary
 * 상품준비중 주문의 옵션별 집계 조회
 * Security: 인증 필요, 조직 단위 필터링
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 접근 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const shippingStatus = searchParams.get('shippingStatus') || '상품준비중';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: '시작일과 종료일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 상품준비중 주문 조회 (조직 필터 적용)
    let query = supabase
      .from('integrated_orders')
      .select('option_name, quantity, final_payment_amount, vendor_name')
      .eq('shipping_status', shippingStatus)
      .gte('sheet_date', startDate)
      .lte('sheet_date', endDate);

    // 🔒 조직 필터: 같은 조직의 주문만 조회 (관리자 제외)
    if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin') {
      const organizationId = await getOrganizationDataFilter(auth.user.id);
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        // 조직이 없으면 본인이 등록한 주문만 조회
        query = query.eq('seller_id', auth.user.id);
      }
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('주문 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 옵션별 집계
    const summaryMap = new Map<string, {
      option_name: string;
      vendor_name: string;
      total_quantity: number;
      total_amount: number;
      order_count: number;
    }>();

    orders.forEach((order) => {
      const key = `${order.option_name}|${order.vendor_name || ''}`;

      // 숫자로 변환 (문자열로 저장되어 있을 수 있음)
      const paymentAmount = typeof order.final_payment_amount === 'string'
        ? parseFloat(order.final_payment_amount) || 0
        : order.final_payment_amount || 0;

      const quantity = typeof order.quantity === 'string'
        ? parseInt(order.quantity, 10) || 0
        : order.quantity || 0;

      if (summaryMap.has(key)) {
        const existing = summaryMap.get(key)!;
        existing.total_quantity += quantity;
        existing.total_amount += paymentAmount;
        existing.order_count += 1;
      } else {
        summaryMap.set(key, {
          option_name: order.option_name || '미지정',
          vendor_name: order.vendor_name || '',
          total_quantity: quantity,
          total_amount: paymentAmount,
          order_count: 1,
        });
      }
    });

    // Map을 배열로 변환하고 수량 많은 순으로 정렬
    const summary = Array.from(summaryMap.values()).sort(
      (a, b) => b.total_quantity - a.total_quantity
    );

    // 옵션상품 목록 추출
    const optionNames = [...new Set(orders.map(o => o.option_name).filter(Boolean))];

    // 옵션상품 및 원물 정보 조회
    const { data: optionProductsData, error: optionError } = await supabase
      .from('option_products')
      .select('id, option_name')
      .in('option_name', optionNames);

    if (optionError) {
      console.error('옵션상품 조회 오류:', optionError);
    }


    // 옵션상품 ID 목록
    const optionProductIds = optionProductsData?.map(op => op.id) || [];

    // 옵션상품으로 매핑
    const optionNameToId = new Map(
      optionProductsData?.map(op => [op.option_name, op.id]) || []
    );

    // option_product_materials에서 원물 링크 조회
    const { data: materialsLinksData, error: materialsLinksError } = await supabase
      .from('option_product_materials')
      .select('option_product_id, quantity, raw_material_id')
      .in('option_product_id', optionProductIds);

    if (materialsLinksError) {
      console.error('원물 링크 조회 오류:', materialsLinksError);
    }


    // 원물 ID 목록 추출
    const rawMaterialIds = [
      ...new Set(
        materialsLinksData
          ?.map(link => link.raw_material_id)
          .filter(Boolean) || []
      )
    ];

    // 원물 정보 조회
    const { data: rawMaterialsData, error: rawMaterialsError } = await supabase
      .from('raw_materials')
      .select('id, material_name, standard_unit, standard_quantity')
      .in('id', rawMaterialIds);

    if (rawMaterialsError) {
      console.error('원물 정보 조회 오류:', rawMaterialsError);
    }

    console.log('📦 원물 데이터:', rawMaterialsData?.map(rm => ({
      name: rm.material_name,
      standard_quantity: rm.standard_quantity
    })));

    // 원물 ID로 매핑
    const rawMaterialsById = new Map(
      rawMaterialsData?.map(rm => [rm.id, rm]) || []
    );

    // 옵션상품ID별 원물 정보 매핑
    const optionToMaterials = new Map<number, Array<{
      rawMaterial: { id: string; material_name: string; standard_unit: string; standard_quantity: number };
      quantity: number;
    }>>();

    materialsLinksData?.forEach((link: any) => {
      if (!optionToMaterials.has(link.option_product_id)) {
        optionToMaterials.set(link.option_product_id, []);
      }

      const rawMaterial = rawMaterialsById.get(link.raw_material_id);
      if (rawMaterial) {
        optionToMaterials.get(link.option_product_id)!.push({
          rawMaterial,
          quantity: typeof link.quantity === 'string'
            ? parseFloat(link.quantity) || 0
            : link.quantity || 0,
        });
      }
    });

    // 원물 집계
    const rawMaterialMap = new Map<string, {
      id: string;
      name: string;
      unit: string;
      total_usage: number;
      standard_quantity: number;
    }>();

    orders.forEach((order) => {
      const quantity = typeof order.quantity === 'string'
        ? parseInt(order.quantity, 10) || 0
        : order.quantity || 0;

      const optionProductId = optionNameToId.get(order.option_name);
      if (!optionProductId) return;

      const materials = optionToMaterials.get(optionProductId);
      if (!materials) return;

      materials.forEach(({ rawMaterial, quantity: materialQuantity }) => {
        const totalUsage = materialQuantity * quantity;

        if (rawMaterialMap.has(rawMaterial.id)) {
          const existing = rawMaterialMap.get(rawMaterial.id)!;
          existing.total_usage += totalUsage;
        } else {
          rawMaterialMap.set(rawMaterial.id, {
            id: rawMaterial.id,
            name: rawMaterial.material_name,
            unit: rawMaterial.standard_unit || 'kg',
            total_usage: totalUsage,
            standard_quantity: typeof rawMaterial.standard_quantity === 'string'
              ? parseFloat(rawMaterial.standard_quantity) || 0
              : rawMaterial.standard_quantity || 0,
          });
        }
      });
    });

    const rawMaterialSummary = Array.from(rawMaterialMap.values()).sort(
      (a, b) => b.total_usage - a.total_usage
    );

    return NextResponse.json({
      success: true,
      data: {
        orders: summary,
        rawMaterials: rawMaterialSummary,
      },
    });
  } catch (error: any) {
    console.error('GET /api/integrated-orders/preparing-summary 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
