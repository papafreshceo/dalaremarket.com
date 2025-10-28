const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.TMMHgne8jglU_zEb_wc0LZ-Oe-vKvh5e-hDymw0LBCs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 마이그레이션 시작: seller_market_name 칼럼 추가');

    // SQL 파일 읽기
    const migrationPath = path.join(__dirname, 'database', 'migrations', '063_add_seller_market_name_to_integrated_orders.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 실행할 SQL:');
    console.log(sql);

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    }

    console.log('✅ 마이그레이션 성공!');
    console.log('📊 결과:', data);

    // 칼럼 추가 확인
    const { data: columns, error: checkError } = await supabase
      .from('integrated_orders')
      .select('seller_market_name')
      .limit(1);

    if (checkError) {
      console.error('⚠️ 칼럼 확인 중 오류:', checkError);
    } else {
      console.log('✅ seller_market_name 칼럼이 성공적으로 추가되었습니다!');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

runMigration();
