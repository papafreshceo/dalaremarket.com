import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Service Role Key로 RLS 우회
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 모든 품목 마스터 조회
    const { data: productMasters, error } = await supabase
      .from('products_master')
      .select('id, category_4')
      .not('category_4', 'is', null)

    if (error || !productMasters) {
      console.error('Failed to fetch product masters:', error)
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    let totalRawMaterials = 0
    let totalOptionProducts = 0

    // 각 품목 마스터에 대해 매칭 실행
    for (const pm of productMasters) {
      // 원물 매칭
      const { data: rawMaterials } = await supabase
        .from('raw_materials')
        .select('id')
        .eq('category_4', pm.category_4)
        .is('product_master_id', null)

      if (rawMaterials && rawMaterials.length > 0) {
        for (const raw of rawMaterials) {
          const { error: rawError } = await supabase
            .from('raw_materials')
            .update({ product_master_id: pm.id })
            .eq('id', raw.id)

          if (!rawError) totalRawMaterials++
        }
      }

      // 옵션상품 매칭
      const { data: optionProducts } = await supabase
        .from('option_products')
        .select('id')
        .eq('category_4', pm.category_4)
        .is('product_master_id', null)

      if (optionProducts && optionProducts.length > 0) {
        for (const option of optionProducts) {
          const { error: optionError } = await supabase
            .from('option_products')
            .update({ product_master_id: pm.id })
            .eq('id', option.id)

          if (!optionError) totalOptionProducts++
        }
      }
    }

    console.log(`✅ 전체 매칭 완료: ${productMasters.length}개 품목, 원물 ${totalRawMaterials}개, 옵션상품 ${totalOptionProducts}개`)

    return NextResponse.json({
      success: true,
      productMastersCount: productMasters.length,
      totalRawMaterials,
      totalOptionProducts
    })
  } catch (error) {
    console.error('Matching error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
