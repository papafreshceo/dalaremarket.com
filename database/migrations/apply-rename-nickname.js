const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔄 nickname 컬럼을 profile_name으로 변경 중...');

    // users 테이블의 nickname 컬럼을 profile_name으로 변경
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users RENAME COLUMN nickname TO profile_name;'
    });

    if (error) {
      // 이미 변경되었거나 컬럼이 없는 경우
      if (error.message.includes('does not exist') || error.message.includes('already exists')) {
        console.log('⚠️  컬럼이 이미 변경되었거나 존재하지 않습니다.');
      } else {
        throw error;
      }
    }

    console.log('✅ 마이그레이션 완료!');
    console.log('   - users.nickname → users.profile_name');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  }
}

applyMigration();
