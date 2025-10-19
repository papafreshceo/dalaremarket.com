const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qxhpgjftkkcxdttgjkzj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDQxNDAsImV4cCI6MjA1ODI4MDE0MH0.wXUEJ4KY3Gg-fHb6lCvwKrGOvWrGJlC2hvStD0uDBrs'
);

async function checkCategories() {
  console.log('=== cloudinary_images 전체 현황 ===');
  const { data: allImages, error: err1 } = await supabase
    .from('cloudinary_images')
    .select('category, category_4_id, is_representative, option_product_id');

  if (err1) {
    console.error('Error:', err1);
  } else {
    console.log('전체 이미지 수:', allImages?.length);

    // 카테고리별 그룹화
    const categoryGroups = {};
    allImages?.forEach(img => {
      const cat = img.category || 'NULL';
      if (!categoryGroups[cat]) {
        categoryGroups[cat] = { total: 0, representative: 0, with_option: 0, with_category_id: 0 };
      }
      categoryGroups[cat].total++;
      if (img.is_representative) categoryGroups[cat].representative++;
      if (img.option_product_id) categoryGroups[cat].with_option++;
      if (img.category_4_id) categoryGroups[cat].with_category_id++;
    });

    console.log('\n카테고리별 통계:');
    Object.entries(categoryGroups).forEach(([cat, stats]) => {
      console.log(`  ${cat}: 전체 ${stats.total}, 대표 ${stats.representative}, 옵션연결 ${stats.with_option}, category_4_id연결 ${stats.with_category_id}`);
    });
  }

  console.log('\n=== category_settings 품목 현황 (사입상품) ===');
  const { data: categorySettings, error: err2 } = await supabase
    .from('category_settings')
    .select('category_4, seller_supply')
    .eq('seller_supply', true)
    .eq('is_active', true)
    .order('category_4');

  if (err2) {
    console.error('Error:', err2);
  } else {
    console.log('사입 품목 수:', categorySettings?.length);
    console.log('처음 10개:', categorySettings?.slice(0, 10).map(c => c.category_4));
  }

  console.log('\n=== 옵션상품과 이미지 연결 확인 ===');
  const { data: optionProducts, error: err3 } = await supabase
    .from('option_products')
    .select('id, option_name, category_4')
    .limit(5);

  if (err3) {
    console.error('Error:', err3);
  } else {
    console.log('옵션상품 샘플 (처음 5개):');
    console.log(JSON.stringify(optionProducts, null, 2));
  }
}

checkCategories();
