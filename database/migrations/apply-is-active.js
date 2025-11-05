const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres.qxhpgjftkkcxdttgjkzj:daLREa!!0901@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyMigration() {
  const client = await pool.connect();

  try {
    console.log('is_active 컬럼 마이그레이션 적용 중...');

    const sqlPath = path.join(__dirname, 'add_is_active_to_users.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);

    console.log('✅ is_active 컬럼이 성공적으로 추가되었습니다!');
    console.log('- users 테이블에 is_active BOOLEAN 컬럼 추가');
    console.log('- 기본값: true (활성화)');
    console.log('- 인덱스 생성 완료');

    // 확인 쿼리
    const result = await client.query(
      'SELECT id, email, is_active FROM users LIMIT 5'
    );

    console.log('\n샘플 데이터:');
    console.table(result.rows);

  } catch (err) {
    console.error('오류 발생:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
