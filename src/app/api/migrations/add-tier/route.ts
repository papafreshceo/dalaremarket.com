import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminSupabase = createAdminClient()

    // organizations 테이블에 tier 컬럼 추가
    const { error: addColumnError } = await adminSupabase.rpc('exec_sql', {
      sql: `
        -- tier 컬럼 추가
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'organizations'
            AND column_name = 'tier'
          ) THEN
            ALTER TABLE organizations ADD COLUMN tier VARCHAR(20) DEFAULT 'bronze';
          END IF;
        END $$;

        -- 기존 데이터 업데이트
        UPDATE organizations SET tier = 'bronze' WHERE tier IS NULL;
      `
    })

    if (addColumnError) {
      console.error('SQL 실행 오류:', addColumnError)
      return NextResponse.json({ error: addColumnError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'tier 컬럼이 추가되었습니다'
    })
  } catch (error: any) {
    console.error('마이그레이션 오류:', error)
    return NextResponse.json({
      error: '마이그레이션 실패',
      details: error.message
    }, { status: 500 })
  }
}
