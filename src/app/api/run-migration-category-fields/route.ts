import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {

    // SQL 실행을 위한 raw query
    const { data: result1, error: error1 } = await supabase
      .from('category_settings')
      .select('id')
      .limit(0);

    // 직접 ALTER TABLE을 실행할 수 없으므로, Supabase 대시보드에서 실행해야 합니다
    return NextResponse.json({
      success: false,
      message: 'Supabase 대시보드의 SQL Editor에서 다음 SQL을 실행해주세요:',
      sql: `
-- 발송기한 추가
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS shipping_deadline INTEGER;

-- 시즌 시작일 추가
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS season_start_date VARCHAR(5);

-- 시즌 종료일 추가
ALTER TABLE category_settings
ADD COLUMN IF NOT EXISTS season_end_date VARCHAR(5);

-- 컬럼 설명 추가
COMMENT ON COLUMN category_settings.shipping_deadline IS '발송기한 (일 단위)';
COMMENT ON COLUMN category_settings.season_start_date IS '시즌 시작일 (MM-DD 형식)';
COMMENT ON COLUMN category_settings.season_end_date IS '시즌 종료일 (MM-DD 형식)';
      `
    });

  } catch (error: any) {
    console.error('마이그레이션 실행 중 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
