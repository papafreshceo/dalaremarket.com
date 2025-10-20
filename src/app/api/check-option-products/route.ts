import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Service Role Key로 RLS 우회
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. 옵션상품 샘플 조회 (category_4와 product_master_id 확인)
    const { data: samples, error: sampleError } = await supabase
      .from('option_products')
      .select('id, option_name, category_4, product_master_id')
      .limit(10)

    // 2. 통계
    const { count: total } = await supabase
      .from('option_products')
      .select('*', { count: 'exact', head: true })

    const { count: withCategory4 } = await supabase
      .from('option_products')
      .select('*', { count: 'exact', head: true })
      .not('category_4', 'is', null)

    const { count: withProductMasterId } = await supabase
      .from('option_products')
      .select('*', { count: 'exact', head: true })
      .not('product_master_id', 'is', null)

    const { count: nullProductMasterId } = await supabase
      .from('option_products')
      .select('*', { count: 'exact', head: true })
      .is('product_master_id', null)

    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      samples: samples || [],
      sampleError,
      statistics: {
        total,
        withCategory4,
        withProductMasterId,
        nullProductMasterId
      }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
