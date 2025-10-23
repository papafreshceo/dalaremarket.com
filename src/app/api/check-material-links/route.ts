import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 전체 매칭 개수 확인
    const { count } = await supabase
      .from('option_product_materials')
      .select('*', { count: 'exact', head: true })

    // 샘플 데이터 10개 조회
    const { data: links, error } = await supabase
      .from('option_product_materials')
      .select('id, option_product_id, raw_material_id, quantity, unit_price')
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const enrichedLinks = []
    for (const link of links || []) {
      const { data: option } = await supabase
        .from('option_products')
        .select('option_code, option_name')
        .eq('id', link.option_product_id)
        .single()

      const { data: material } = await supabase
        .from('raw_materials')
        .select('material_code, material_name')
        .eq('id', link.raw_material_id)
        .single()

      enrichedLinks.push({
        link_id: link.id,
        option_product: option ? `${option.option_code} - ${option.option_name}` : 'N/A',
        raw_material: material ? `${material.material_code} - ${material.material_name}` : 'N/A',
        quantity: link.quantity,
        unit_price: link.unit_price
      })
    }

    // 옵션상품별 매칭 통계
    const { data: allLinks } = await supabase
      .from('option_product_materials')
      .select('option_product_id')

    const grouped: Record<string, number> = {}
    allLinks?.forEach(link => {
      grouped[link.option_product_id] = (grouped[link.option_product_id] || 0) + 1
    })

    const stats = Object.values(grouped)
    const avgMaterials = stats.length > 0
      ? (stats.reduce((a, b) => a + b, 0) / stats.length).toFixed(2)
      : 0

    return NextResponse.json({
      total_links: count,
      matched_option_products: Object.keys(grouped).length,
      avg_materials_per_product: avgMaterials,
      max_materials: stats.length > 0 ? Math.max(...stats) : 0,
      min_materials: stats.length > 0 ? Math.min(...stats) : 0,
      sample_links: enrichedLinks
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
