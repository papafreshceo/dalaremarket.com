const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 크레딧 시스템 마이그레이션 시작...\n');

  try {
    // 마이그레이션 SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20250102000000_create_user_credits.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    }

    console.log('✅ 크레딧 시스템 테이블 생성 완료');
    console.log('   - user_credits');
    console.log('   - user_credit_transactions');
    console.log('   - RLS 정책 설정 완료');
    console.log('\n✨ 마이그레이션이 성공적으로 완료되었습니다!');

  } catch (err) {
    console.error('❌ 예외 발생:', err);
    process.exit(1);
  }
}

applyMigration();
