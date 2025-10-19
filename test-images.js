const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qxhpgjftkkcxdttgjkzj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDQxNDAsImV4cCI6MjA1ODI4MDE0MH0.wXUEJ4KY3Gg-fHb6lCvwKrGOvWrGJlC2hvStD0uDBrs'
);

async function testImages() {
  console.log('=== Cloudinary 이미지 테스트 ===\n');

  // 1. 전체 이미지 수
  const { data: allImages, error: allError } = await supabase
    .from('cloudinary_images')
    .select('*');

  if (allError) {
    console.error('전체 이미지 조회 오류:', allError);
  } else {
    console.log('1. 전체 이미지 수:', allImages?.length || 0);
    if (allImages && allImages.length > 0) {
      console.log('   샘플:', allImages[0]);
    }
  }

  // 2. 대표이미지 수
  const { data: repImages, error: repError } = await supabase
    .from('cloudinary_images')
    .select('*')
    .eq('is_representative', true);

  if (repError) {
    console.error('대표이미지 조회 오류:', repError);
  } else {
    console.log('\n2. 대표이미지 수:', repImages?.length || 0);
    if (repImages && repImages.length > 0) {
      console.log('   옵션상품 대표이미지:', repImages.filter(i => i.option_product_id).length);
      console.log('   품목 대표이미지:', repImages.filter(i => i.category_4_id).length);
      console.log('   샘플:', repImages[0]);
    }
  }

  // 3. 품목별 이미지
  const { data: categoryImages, error: catError } = await supabase
    .from('cloudinary_images')
    .select('*')
    .not('category_4_id', 'is', null);

  if (catError) {
    console.error('품목별 이미지 조회 오류:', catError);
  } else {
    console.log('\n3. 품목별 이미지 수:', categoryImages?.length || 0);
    if (categoryImages && categoryImages.length > 0) {
      console.log('   샘플:', categoryImages[0]);
    }
  }
}

testImages();
