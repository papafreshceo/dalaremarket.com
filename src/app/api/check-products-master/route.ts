import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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

    // 품목 마스터의 category_4 값들 조회
    const { data: productsMaster, error } = await supabase
      .from('products_master')
      .select('id, category_4')
      .not('category_4', 'is', null)
      .order('category_4')

    return NextResponse.json({
      count: productsMaster?.length || 0,
      category4Values: productsMaster?.map(pm => pm.category_4) || [],
      details: productsMaster || [],
      error
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
