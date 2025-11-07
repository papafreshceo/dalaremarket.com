/**
 * 샘플 회원들을 랭킹 참여 상태로 설정 (PostgreSQL 직접 연결)
 */

const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.qxhpgjftkkcxdttgjkzj',
  password: 'Qhfmsxks12!@',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('샘플 회원들 랭킹 참여 상태로 설정 중...\n');

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 1. 샘플 회원들 조회
    const usersResult = await client.query(`
      SELECT id, email, name, role
      FROM users
      WHERE email ILIKE '%sample%' OR email ILIKE '%test%'
      ORDER BY email
    `);

    if (usersResult.rows.length === 0) {
      console.log('⚠️  샘플 회원이 없습니다.');
      await client.end();
      return;
    }

    console.log(`✅ ${usersResult.rows.length}명의 샘플 회원 발견:`);
    usersResult.rows.forEach(u => {
      console.log(`   - ${u.email} (${u.name || 'Unknown'})`);
    });

    console.log('\n랭킹 참여 상태로 업데이트 중...\n');

    // 2. 랭킹 참여 상태 업데이트
    const updateResult = await client.query(`
      INSERT INTO ranking_participation (seller_id, is_participating, show_score, show_sales_performance)
      SELECT
        id,
        true,
        true,
        true
      FROM users
      WHERE email ILIKE '%sample%' OR email ILIKE '%test%'
      ON CONFLICT (seller_id)
      DO UPDATE SET
        is_participating = true,
        show_score = true,
        show_sales_performance = true,
        updated_at = CURRENT_TIMESTAMP
    `);

    console.log(`✅ ${usersResult.rows.length}명 업데이트 완료\n`);

    // 3. 결과 확인
    const verifyResult = await client.query(`
      SELECT
        u.email,
        u.name,
        rp.is_participating,
        rp.show_score,
        rp.show_sales_performance
      FROM users u
      JOIN ranking_participation rp ON u.id = rp.seller_id
      WHERE u.email ILIKE '%sample%' OR u.email ILIKE '%test%'
      ORDER BY u.email
    `);

    console.log('현재 상태:');
    verifyResult.rows.forEach(r => {
      console.log(`   ✅ ${r.email}: 참여=${r.is_participating}, 점수공개=${r.show_score}, 실적공개=${r.show_sales_performance}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ 모든 작업 완료!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
