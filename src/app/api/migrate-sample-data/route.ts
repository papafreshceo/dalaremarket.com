import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/migrate-sample-data
 *
 * users 테이블에 show_sample_data 컬럼 추가 마이그레이션
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // show_sample_data 컬럼 추가
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- users 테이블에 show_sample_data 컬럼 추가
        ALTER TABLE users ADD COLUMN IF NOT EXISTS show_sample_data BOOLEAN DEFAULT true;

        -- 컬럼 설명 추가
        COMMENT ON COLUMN users.show_sample_data IS '샘플 데이터 표시 여부 (첫 주문 업로드 시 자동으로 false로 변경)';

        -- 기존 사용자는 false로 설정 (이미 주문 데이터가 있을 수 있음)
        UPDATE users SET show_sample_data = false WHERE show_sample_data IS NULL;
      `
    });

    if (alterError) {
      console.error('[migrate-sample-data] 마이그레이션 실패:', alterError);
      return NextResponse.json(
        { success: false, error: alterError.message },
        { status: 500 }
      );
    }

    console.log('[migrate-sample-data] 마이그레이션 완료');

    return NextResponse.json({
      success: true,
      message: 'show_sample_data 컬럼이 성공적으로 추가되었습니다.',
    });

  } catch (error: any) {
    console.error('POST /api/migrate-sample-data 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
