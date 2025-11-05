const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase 연결 정보 (transaction pooler 포트 사용)
const pool = new Pool({
  connectionString: 'postgresql://postgres.ketdnqhxwqcgyltinjih:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function applySellerfeedMigration() {
  console.log('🚀 셀러피드 마이그레이션 시작...\n');

  try {
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'seller_feed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 마이그레이션 실행
    console.log('📝 테이블 생성 중...');
    await pool.query(sql);

    console.log('✅ 셀러피드 마이그레이션 완료!\n');
    console.log('생성된 테이블:');
    console.log('  - seller_feed_posts (게시글)');
    console.log('  - seller_feed_tags (태그)');
    console.log('  - seller_feed_comments (댓글)');
    console.log('  - seller_feed_post_likes (게시글 좋아요)');
    console.log('  - seller_feed_comment_likes (댓글 좋아요)');
    console.log('\n생성된 함수:');
    console.log('  - increment_post_views() (조회수 증가)');
    console.log('  - get_post_likes_count() (게시글 좋아요 수)');
    console.log('  - get_comment_likes_count() (댓글 좋아요 수)');
    console.log('  - get_post_comments_count() (댓글 수)');

    // 테이블 확인
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'seller_feed%'
      ORDER BY table_name
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ 확인된 테이블:');
      result.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySellerfeedMigration();
