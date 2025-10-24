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
      .select('id, category_4, supply_status')
      .not('category_4', 'is', null)

    if (error || !productMasters) {
      console.error('Failed to fetch product masters:', error)
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    let newRawMaterials = 0
    let newOptionProducts = 0
    let alreadyLinkedRawMaterials = 0
    let alreadyLinkedOptionProducts = 0

    // 각 품목 마스터에 대해 매칭 실행
    for (const pm of productMasters) {
      // 원물 매칭 - 미연결 항목
      const { data: rawMaterials } = await supabase
        .from('raw_materials')
        .select('id')
        .eq('category_4', pm.category_4)
        .is('product_master_id', null)

      if (rawMaterials && rawMaterials.length > 0) {
        for (const raw of rawMaterials) {
          const { error: rawError } = await supabase
            .from('raw_materials')
            .update({
              product_master_id: pm.id,
              supply_status: pm.supply_status
            })
            .eq('id', raw.id)

          if (!rawError) newRawMaterials++
        }
      }

      // 원물 매칭 - 이미 연결된 항목 카운트
      const { count: alreadyRawCount } = await supabase
        .from('raw_materials')
        .select('id', { count: 'exact', head: true })
        .eq('category_4', pm.category_4)
        .not('product_master_id', 'is', null)

      if (alreadyRawCount) alreadyLinkedRawMaterials += alreadyRawCount

      // 옵션상품 매칭 - 미연결 항목
      const { data: optionProducts, error: optionQueryError } = await supabase
        .from('option_products')
        .select('id')
        .eq('category_4', pm.category_4)
        .is('product_master_id', null)

      if (optionQueryError) {
        console.error(`옵션상품 조회 오류 (category_4: ${pm.category_4}):`, optionQueryError)
      }

      if (optionProducts && optionProducts.length > 0) {
        console.log(`품목 ${pm.category_4}: 매칭할 옵션상품 ${optionProducts.length}개 발견`)
        for (const option of optionProducts) {
          const { error: optionError } = await supabase
            .from('option_products')
            .update({ product_master_id: pm.id })
            .eq('id', option.id)

          if (!optionError) newOptionProducts++
        }
      }

      // 옵션상품 매칭 - 이미 연결된 항목 카운트
      const { count: alreadyOptionCount } = await supabase
        .from('option_products')
        .select('id', { count: 'exact', head: true })
        .eq('category_4', pm.category_4)
        .not('product_master_id', 'is', null)

      if (alreadyOptionCount) alreadyLinkedOptionProducts += alreadyOptionCount
    }

    console.log(`✅ 전체 매칭 완료: ${productMasters.length}개 품목, 원물 신규 ${newRawMaterials}개/기존 ${alreadyLinkedRawMaterials}개, 옵션상품 신규 ${newOptionProducts}개/기존 ${alreadyLinkedOptionProducts}개`)

    return NextResponse.json({
      success: true,
      productMastersCount: productMasters.length,
      newRawMaterials,
      newOptionProducts,
      alreadyLinkedRawMaterials,
      alreadyLinkedOptionProducts
    })
  } catch (error) {
    console.error('Matching error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
