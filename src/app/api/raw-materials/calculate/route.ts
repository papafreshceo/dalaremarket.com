import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';

/**
 * POST /api/raw-materials/calculate
 * 옵션상품 목록과 수량을 받아서 필요한 원물 계산
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 접근 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const body = await request.json();
    const { options } = body; // [{ option_name, quantity }]

    if (!options || !Array.isArray(options)) {
      return NextResponse.json(
        { success: false, error: '옵션 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🔍 원물 계산 요청:', { optionCount: options.length });

    // 옵션상품 ID 조회 (option_code 포함)
    const optionNames = options.map(o => o.option_name);
    const { data: optionProductsData } = await supabase
      .from('option_products')
      .select('id, option_name, option_code')
      .in('option_name', optionNames);

    const optionNameToId = new Map(
      optionProductsData?.map(op => [op.option_name, op.id]) || []
    );

    const optionNameToCode = new Map(
      optionProductsData?.map(op => [op.option_name, op.option_code]) || []
    );

    // 옵션상품별 수량 맵 생성
    const optionQuantityMap = new Map(
      options.map(o => [o.option_name, o.quantity])
    );

    // 옵션상품 ID 목록
    const optionProductIds = optionProductsData?.map(op => op.id) || [];

    // 원물 매핑 조회
    const { data: materialsLinksData } = await supabase
      .from('option_product_materials')
      .select('option_product_id, quantity, raw_material_id')
      .in('option_product_id', optionProductIds);

    // 원물 ID 목록
    const rawMaterialIds = [
      ...new Set(materialsLinksData?.map(link => link.raw_material_id).filter(Boolean) || [])
    ];

    // 원물 정보 조회 (material_code 포함)
    const { data: rawMaterialsData } = await supabase
      .from('raw_materials')
      .select('id, material_name, material_code, standard_unit, standard_quantity')
      .in('id', rawMaterialIds);

    const rawMaterialsById = new Map(
      rawMaterialsData?.map(rm => [rm.id, rm]) || []
    );

    // 옵션상품ID별 원물 정보 매핑
    const optionToMaterials = new Map<number, Array<{
      rawMaterial: any;
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

    // 옵션별 집계 데이터
    const optionSummary: any[] = [];

    options.forEach(({ option_name, quantity }) => {
      const optionProductId = optionNameToId.get(option_name);
      const optionCode = optionNameToCode.get(option_name);

      optionSummary.push({
        option_name,
        option_code: optionCode || '',
        quantity,
        has_mapping: !!optionProductId && optionToMaterials.has(optionProductId)
      });

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
            code: rawMaterial.material_code || '',
            unit: rawMaterial.standard_unit || 'kg',
            total_usage: totalUsage,
            standard_quantity: typeof rawMaterial.standard_quantity === 'string'
              ? parseFloat(rawMaterial.standard_quantity) || 0
              : rawMaterial.standard_quantity || 0,
          });
        }
      });
    });

    // 원물을 원물코드 오름차순으로 정렬
    const rawMaterialSummary = Array.from(rawMaterialMap.values()).sort(
      (a, b) => {
        // 코드가 있으면 코드로 정렬, 없으면 이름으로 정렬
        if (a.code && b.code) {
          return a.code.localeCompare(b.code);
        }
        return a.name.localeCompare(b.name, 'ko-KR');
      }
    );

    // 옵션상품을 옵션코드 오름차순으로 정렬
    optionSummary.sort((a, b) => {
      // 코드가 있으면 코드로 정렬, 없으면 옵션명으로 정렬
      if (a.option_code && b.option_code) {
        return a.option_code.localeCompare(b.option_code);
      }
      return a.option_name.localeCompare(b.option_name, 'ko-KR');
    });

    const unmappedOptions = optionSummary
      .filter(o => !o.has_mapping)
      .map(o => o.option_name);

    const inputTotal = options.reduce((sum: number, o: any) => sum + Number(o.quantity || 0), 0);
    const outputTotal = optionSummary.reduce((sum: number, o: any) => sum + Number(o.quantity || 0), 0);

    console.log('📊 원물 계산 결과:', {
      optionCount: options.length,
      rawMaterialCount: rawMaterialSummary.length,
      unmappedCount: unmappedOptions.length,
      입력_총수량: inputTotal,
      출력_총수량: outputTotal,
      일치여부: inputTotal === outputTotal
    });

    return NextResponse.json({
      success: true,
      data: {
        options: optionSummary,
        rawMaterials: rawMaterialSummary,
        unmappedOptions,
      },
    });
  } catch (error: any) {
    console.error('POST /api/raw-materials/calculate 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
