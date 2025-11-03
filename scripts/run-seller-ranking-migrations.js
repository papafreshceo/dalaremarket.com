/**
 * 셀러 랭킹 시스템 마이그레이션 실행 스크립트
 *
 * 실행 방법:
 * node scripts/run-seller-ranking-migrations.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 마이그레이션 파일 목록
const migrations = [
  'create_seller_performance_daily.sql',
  'create_seller_rankings.sql',
  'create_seller_badges.sql'
];

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'database', 'migrations', filename);

  console.log(`\n📄 실행 중: ${filename}`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ 실패: ${filename}`);
      console.error(error);
      return false;
    }

    console.log(`✅ 완료: ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ 파일 읽기 실패: ${filename}`);
    console.error(err);
    return false;
  }
}

async function main() {
  console.log('🚀 셀러 랭킹 시스템 마이그레이션 시작...\n');

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.log('\n⚠️  일부 마이그레이션이 실패했습니다.');
    console.log('Supabase Dashboard에서 직접 SQL을 실행해주세요:');
    console.log('https://supabase.com/dashboard/project/qxhpgjftkkcxdttgjkzj/sql/new');
    process.exit(1);
  } else {
    console.log('\n🎉 모든 마이그레이션이 성공적으로 완료되었습니다!');
  }
}

main().catch(err => {
  console.error('❌ 예상치 못한 오류:', err);
  process.exit(1);
});
