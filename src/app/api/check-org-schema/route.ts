import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 현재 사용자의 조직 정보를 모두 조회하여 어떤 컬럼이 있는지 확인
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json({
        error: error.message,
        details: error
      })
    }

    return NextResponse.json({
      success: true,
      columns: data ? Object.keys(data) : [],
      sample_data: data
    })
  } catch (error: any) {
    return NextResponse.json({
      error: '조회 실패',
      details: error.message
    }, { status: 500 })
  }
}
