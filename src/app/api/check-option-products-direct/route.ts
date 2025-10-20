import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Supabase REST API로 직접 조회 (RLS 우회)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/option_products?select=id,option_name,category_4,product_master_id&limit=10`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        }
      }
    )

    const data = await response.json()

    // 카운트 조회
    const countResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/option_products?select=count`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Prefer': 'count=exact'
        }
      }
    )

    const countHeader = countResponse.headers.get('content-range')

    return NextResponse.json({
      samples: data,
      count: countHeader,
      responseStatus: response.status,
      message: response.status === 200 ? 'Success' : 'Error'
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
