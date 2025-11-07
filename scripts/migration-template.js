/**
 * 안전한 마이그레이션 스크립트 템플릿
 *
 * 사용법:
 * 1. 이 파일을 복사하여 새 마이그레이션 스크립트 생성
 * 2. runMigration() 함수 내부에 마이그레이션 로직 작성
 * 3. .env.local에 필요한 환경변수 설정
 * 4. node scripts/your-migration-script.js 실행
 *
 * 주의: 이 스크립트는 Git에 커밋하지 마세요!
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * 메인 마이그레이션 함수
 * 이 함수 내부에 마이그레이션 로직을 작성하세요
 */
async function runMigration() {
  try {
    console.log('🚀 Starting migration...\n');

    // 예제 1: SQL 파일 실행
    // const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'your-migration.sql');
    // const sql = fs.readFileSync(sqlPath, 'utf8');
    // const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    // 예제 2: 직접 쿼리 실행
    // const { data, error } = await supabase
    //   .from('your_table')
    //   .select('*')
    //   .limit(10);

    // 예제 3: RLS 정책 적용
    // const statements = [
    //   'ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;',
    //   'CREATE POLICY "policy_name" ON your_table FOR SELECT TO authenticated USING (true);'
    // ];
    //
    // for (const statement of statements) {
    //   console.log('Executing:', statement.substring(0, 100) + '...');
    //   const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
    //   if (error) throw error;
    // }

    console.log('✅ Migration completed successfully!\n');

    // 여기에 마이그레이션 로직 작성
    // ...

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// 마이그레이션 실행
console.log('📋 Migration Configuration:');
console.log('- Supabase URL:', supabaseUrl);
console.log('- Service Role Key:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
console.log('');

runMigration().then(() => {
  console.log('🎉 All done!');
  process.exit(0);
});
