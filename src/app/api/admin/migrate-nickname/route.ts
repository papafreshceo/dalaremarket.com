import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // users 테이블에 nickname 컬럼 추가
    const { error: addColumnError } = await supabase.rpc('exec_raw_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'nickname'
          ) THEN
            ALTER TABLE users ADD COLUMN nickname TEXT;
            CREATE INDEX idx_users_nickname ON users(nickname);
          END IF;
        END $$;
      `
    });

    if (addColumnError) {
      console.error('컬럼 추가 오류:', addColumnError);

      // 대체 방법: 직접 SQL 실행 시도
      return NextResponse.json({
        success: false,
        error: '마이그레이션 실패',
        message: 'Supabase Dashboard에서 SQL Editor를 열고 다음을 실행해주세요:',
        sql: `
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
        `
      });
    }

    return NextResponse.json({
      success: true,
      message: 'nickname 컬럼이 추가되었습니다.',
    });

  } catch (error: any) {
    console.error('마이그레이션 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: error.message,
        message: 'Supabase Dashboard에서 SQL Editor를 열고 다음을 실행해주세요:',
        sql: `
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
        `
      },
      { status: 500 }
    );
  }
}
