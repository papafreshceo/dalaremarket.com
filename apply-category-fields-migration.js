const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('=== category_settings 테이블에 필드 추가 시작 ===');

  try {
    // 1. shipping_deadline 컬럼 추가
    console.log('1. shipping_deadline 컬럼 추가...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE category_settings ADD COLUMN IF NOT EXISTS shipping_deadline INTEGER;`
    });
    if (error1) {
      console.error('shipping_deadline 추가 실패:', error1);
    } else {
      console.log('✓ shipping_deadline 컬럼 추가 완료');
    }

    // 2. season_start_date 컬럼 추가
    console.log('2. season_start_date 컬럼 추가...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE category_settings ADD COLUMN IF NOT EXISTS season_start_date VARCHAR(5);`
    });
    if (error2) {
      console.error('season_start_date 추가 실패:', error2);
    } else {
      console.log('✓ season_start_date 컬럼 추가 완료');
    }

    // 3. season_end_date 컬럼 추가
    console.log('3. season_end_date 컬럼 추가...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE category_settings ADD COLUMN IF NOT EXISTS season_end_date VARCHAR(5);`
    });
    if (error3) {
      console.error('season_end_date 추가 실패:', error3);
    } else {
      console.log('✓ season_end_date 컬럼 추가 완료');
    }

    // 4. 컬럼 확인
    console.log('\n4. 추가된 컬럼 확인...');
    const { data, error } = await supabase
      .from('category_settings')
      .select('id, category_4, shipping_deadline, season_start_date, season_end_date')
      .limit(1);

    if (error) {
      console.error('컬럼 확인 실패:', error);
    } else {
      console.log('✓ 컬럼 추가 확인 완료:', data);
    }

    console.log('\n=== 마이그레이션 완료 ===');
  } catch (error) {
    console.error('마이그레이션 실행 중 오류:', error);
  }
}

runMigration();
