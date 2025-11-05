const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase URL에서 PostgreSQL 연결 정보 추출
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing Supabase URL');
  process.exit(1);
}

// Supabase URL 형식: https://[project-ref].supabase.co
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const connectionString = process.env.DATABASE_URL ||
  `postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`;

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 데이터베이스 연결 완료\n');

    console.log('🔄 display_nickname 컬럼 추가 중...');

    // seller_feed_posts 테이블에 display_nickname 컬럼 추가
    try {
      await client.query(`
        ALTER TABLE seller_feed_posts
        ADD COLUMN IF NOT EXISTS display_nickname VARCHAR(20);
      `);
      console.log('✅ seller_feed_posts.display_nickname 컬럼 추가 완료');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  seller_feed_posts.display_nickname 컬럼이 이미 존재합니다.');
      } else {
        throw error;
      }
    }

    // seller_feed_comments 테이블에 display_nickname 컬럼 추가
    try {
      await client.query(`
        ALTER TABLE seller_feed_comments
        ADD COLUMN IF NOT EXISTS display_nickname VARCHAR(20);
      `);
      console.log('✅ seller_feed_comments.display_nickname 컬럼 추가 완료');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  seller_feed_comments.display_nickname 컬럼이 이미 존재합니다.');
      } else {
        throw error;
      }
    }

    console.log('\n✅ 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
