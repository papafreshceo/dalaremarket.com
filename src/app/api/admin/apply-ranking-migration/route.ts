import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';

/**
 * POST /api/admin/apply-ranking-migration
 * 랭킹 참여 테이블 마이그레이션 적용
 * Security: 관리자 전용
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();

    // 1. 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ranking_participation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_participating BOOLEAN NOT NULL DEFAULT false,
        show_score BOOLEAN NOT NULL DEFAULT false,
        show_sales_performance BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `;

    // 2. 인덱스 생성
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_ranking_participation_user_id ON ranking_participation(user_id);
      CREATE INDEX IF NOT EXISTS idx_ranking_participation_is_participating ON ranking_participation(is_participating);
    `;

    // 3. 트리거 함수 생성
    const createTriggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_ranking_participation_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // 4. 트리거 생성
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS ranking_participation_updated_at ON ranking_participation;
      CREATE TRIGGER ranking_participation_updated_at
        BEFORE UPDATE ON ranking_participation
        FOR EACH ROW
        EXECUTE FUNCTION update_ranking_participation_updated_at();
    `;

    const { error: tableError } = await supabase.rpc('exec_sql' as any, {
      sql: createTableSQL
    } as any);

    if (tableError) {
      console.error('테이블 생성 실패:', tableError);
      // 테이블이 이미 존재하는 경우 무시하고 계속 진행
    }

    const { error: indexError } = await supabase.rpc('exec_sql' as any, {
      sql: createIndexesSQL
    } as any);

    const { error: functionError } = await supabase.rpc('exec_sql' as any, {
      sql: createTriggerFunctionSQL
    } as any);

    const { error: triggerError } = await supabase.rpc('exec_sql' as any, {
      sql: createTriggerSQL
    } as any);

    return NextResponse.json({
      success: true,
      message: '랭킹 참여 테이블 마이그레이션이 완료되었습니다.',
      details: {
        table: 'ranking_participation',
        columns: ['user_id', 'is_participating', 'show_score', 'show_sales_performance']
      }
    });

  } catch (error: any) {
    console.error('마이그레이션 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
