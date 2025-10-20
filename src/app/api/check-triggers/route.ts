import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Supabase의 PostgREST API를 직접 사용하여 정보 조회
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_table_info`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
        },
        body: JSON.stringify({ table_name: 'raw_materials' })
      }
    )

    if (!response.ok) {
      return NextResponse.json({
        message: 'RPC 함수 없음 - 데이터베이스에서 직접 확인 필요',
        suggestion: 'Supabase SQL Editor에서 다음 쿼리 실행:\n\nSELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = \'raw_materials\'::regclass;'
      })
    }

    const data = await response.json()

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      message: 'Supabase SQL Editor에서 직접 확인하세요',
      queries: {
        triggers: "SELECT tgname AS trigger_name, pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid = 'raw_materials'::regclass AND NOT tgisinternal;",
        constraints: "SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid = 'raw_materials'::regclass AND contype = 'c';"
      }
    }, { status: 200 })
  }
}
