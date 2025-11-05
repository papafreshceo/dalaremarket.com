require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL 직접 연결
const connectionString = 'postgresql://postgres.ketdnqhxwqcgyltinjih:Ehddjs940112!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🚀 랭킹 참여 테이블 마이그레이션 시작...\n');

    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    const sqlPath = path.join(__dirname, 'create_ranking_participation.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 SQL 실행 중...');
    await client.query(sql);

    console.log('✅ 마이그레이션 성공!');
    console.log('\n📊 생성된 테이블: ranking_participation');
    console.log('   - user_id: 사용자 ID');
    console.log('   - is_participating: 랭킹 참여 여부');
    console.log('   - show_score: 점수 공개 여부');
    console.log('   - show_sales_performance: 판매실적 공개 여부\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
