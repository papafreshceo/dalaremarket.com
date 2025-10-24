const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixForeignKey() {
  console.log('🔧 cloudinary_images 외래키 수정 시작...');

  try {
    // 1. 기존 외래키 제약조건 삭제
    console.log('1. 기존 외래키 제약조건 삭제 중...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE cloudinary_images DROP CONSTRAINT IF EXISTS cloudinary_images_category_4_id_fkey;'
    });

    if (dropError && !dropError.message.includes('does not exist')) {
      console.error('외래키 삭제 오류:', dropError);
    } else {
      console.log('✅ 기존 외래키 제약조건 삭제 완료');
    }

    // 2. 새로운 외래키 제약조건 추가
    console.log('2. 새로운 외래키 제약조건 추가 중 (products_master 참조)...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE cloudinary_images
        ADD CONSTRAINT cloudinary_images_category_4_id_fkey
        FOREIGN KEY (category_4_id)
        REFERENCES products_master(id)
        ON DELETE SET NULL;
      `
    });

    if (addError) {
      console.error('외래키 추가 오류:', addError);
      throw addError;
    }
    console.log('✅ 새로운 외래키 제약조건 추가 완료');

    // 3. 인덱스 재생성
    console.log('3. 인덱스 재생성 중...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP INDEX IF EXISTS idx_cloudinary_images_category_4_id;
        CREATE INDEX idx_cloudinary_images_category_4_id ON cloudinary_images(category_4_id);
      `
    });

    if (indexError) {
      console.error('인덱스 생성 오류:', indexError);
    } else {
      console.log('✅ 인덱스 재생성 완료');
    }

    console.log('\n✅ cloudinary_images 외래키 수정 완료!');
    console.log('이제 category_4_id는 products_master.id를 참조합니다.');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

fixForeignKey();
