import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Check category_settings for "반시"
  const { data: categories, error: catError } = await supabase
    .from('category_settings')
    .select('id, category_4, category_4_code, raw_material_status, seller_supply, is_active')
    .ilike('category_4', '%반시%')
    .eq('is_active', true)

  // Check option_products with "반시1kg (꼬마)"
  const { data: options, error: optError } = await supabase
    .from('option_products')
    .select('id, option_code, option_name, category_4, is_seller_supply')
    .ilike('option_name', '%반시1kg%꼬마%')

  // Check all categories with seller_supply data (without filters to see all data)
  const { data: allCats, error: allError } = await supabase
    .from('category_settings')
    .select('category_4, raw_material_status, seller_supply, is_active')
    .order('category_4')
    .limit(20)

  // Also check total count
  const { count, error: countError } = await supabase
    .from('category_settings')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    bansi_categories: { data: categories, error: catError },
    option_products: { data: options, error: optError },
    sample_categories: { data: allCats, error: allError },
    total_count: { count, error: countError }
  })
}
