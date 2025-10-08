const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local에서 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 Key가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(migrationFile) {
  try {
    console.log(`\n📝 마이그레이션 실행: ${migrationFile}`);

    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // SQL을 세미콜론으로 분리하여 개별 실행
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (!statement) continue;

      console.log(`  실행 중: ${statement.substring(0, 50)}...`);

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // RPC 함수가 없으면 직접 실행 시도
        console.log('  ⚠️  RPC 함수 없음, 직접 실행 시도...');

        // Supabase REST API를 통한 직접 실행은 불가능하므로
        // SQL 에디터에서 직접 실행하도록 안내
        console.log('  ℹ️  Supabase Dashboard의 SQL Editor에서 다음 파일을 실행해주세요:');
        console.log(`     ${migrationPath}`);
        console.log('\n📋 SQL 내용:\n');
        console.log(sql);
        return;
      }
    }

    console.log('✅ 마이그레이션 완료!');
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    throw error;
  }
}

async function main() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.log('사용법: node scripts/run-migration.js <migration-file>');
    console.log('예시: node scripts/run-migration.js create_integrated_orders.sql');

    // 사용 가능한 마이그레이션 파일 목록 표시
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

    console.log('\n사용 가능한 마이그레이션 파일:');
    files.forEach(file => console.log(`  - ${file}`));

    process.exit(1);
  }

  await runMigration(migrationFile);
}

main().catch(error => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});
