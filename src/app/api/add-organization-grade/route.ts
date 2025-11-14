import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClientForRouteHandler()

    // Service role client로 실행
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminSupabase = createAdminClient()

    // 1. grade 컬럼 추가
    const { error: alterError } = await adminSupabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS grade VARCHAR(20) DEFAULT 'bronze';
      `
    })

    if (alterError && !alterError.message?.includes('already exists')) {
      console.error('컬럼 추가 오류:', alterError)
    }

    // 2. 기존 데이터 업데이트
    const { error: updateError } = await adminSupabase
      .from('organizations')
      .update({ grade: 'bronze' })
      .is('grade', null)

    if (updateError) {
      console.error('기본값 설정 오류:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'grade 컬럼이 추가되었습니다'
    })
  } catch (error) {
    console.error('마이그레이션 오류:', error)
    return NextResponse.json(
      { error: '마이그레이션 실패', details: error },
      { status: 500 }
    )
  }
}
