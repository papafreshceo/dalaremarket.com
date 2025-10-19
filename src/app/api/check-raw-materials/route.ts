import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Check raw_materials categories
  const { data: rawMaterials } = await supabase
    .from('raw_materials')
    .select('id, name, category_1, category_2, category_3, category_4, category_5')
    .limit(10)

  // Count raw_materials with category_4
  const { count: withCategory4 } = await supabase
    .from('raw_materials')
    .select('*', { count: 'exact', head: true })
    .not('category_4', 'is', null)

  // Total count
  const { count: total } = await supabase
    .from('raw_materials')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    total_raw_materials: total,
    with_category_4: withCategory4,
    sample: rawMaterials
  })
}
