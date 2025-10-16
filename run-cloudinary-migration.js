const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase PostgreSQL 연결 정보 (Direct 연결)
const connectionString = 'postgresql://postgres.whburcvqojpgcczhpmfu:Ehgud12345@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🚀 Cloudinary 이미지 테이블 마이그레이션 시작...\n');

    await client.connect();
    console.log('✅ 데이터베이스 연결 완료\n');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '061_create_cloudinary_images_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 마이그레이션 실행 중...\n');

    // SQL 실행
    await client.query(sql);

    console.log('\n✨ 마이그레이션 완료!');
    console.log('\n📋 생성된 테이블:');
    console.log('  - cloudinary_images (이미지 메타데이터)');
    console.log('  - image_categories (카테고리)');
    console.log('  - image_download_logs (다운로드 로그)');
    console.log('\n🎉 이제 /admin/media 페이지에서 이미지를 업로드할 수 있습니다!');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
