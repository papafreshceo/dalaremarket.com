import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Check option_products with category_4 = '신비' or '신선'
  const { data: sinbi } = await supabase
    .from('option_products')
    .select('id, option_name, category_4')
    .eq('category_4', '신비')

  const { data: sinsun } = await supabase
    .from('option_products')
    .select('id, option_name, category_4')
    .eq('category_4', '신선')

  // Get all unique category_4 values from option_products
  const { data: allProducts } = await supabase
    .from('option_products')
    .select('category_4')

  const uniqueCategories = [...new Set(allProducts?.map(p => p.category_4).filter(Boolean))]

  // Check if any products contain '신비' or '신선' in option_name
  const { data: sinbiInName } = await supabase
    .from('option_products')
    .select('id, option_name, category_4')
    .ilike('option_name', '%신비%')

  const { data: sinsunInName } = await supabase
    .from('option_products')
    .select('id, option_name, category_4')
    .ilike('option_name', '%신선%')

  return NextResponse.json({
    sinbi_count: sinbi?.length || 0,
    sinbi_products: sinbi,
    sinsun_count: sinsun?.length || 0,
    sinsun_products: sinsun,
    products_with_sinbi_in_name: sinbiInName,
    products_with_sinsun_in_name: sinsunInName,
    total_unique_categories: uniqueCategories.length,
    sample_categories: uniqueCategories.slice(0, 20)
  })
}
