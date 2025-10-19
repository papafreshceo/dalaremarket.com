import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Simple query without filters
  const { data, error, count } = await supabase
    .from('category_settings')
    .select('*', { count: 'exact' })

  return NextResponse.json({
    count,
    error,
    sample: data?.slice(0, 5),
    has_seller_supply: data?.filter(d => d.seller_supply === true).length,
    has_category_4: data?.filter(d => d.category_4).length
  })
}
