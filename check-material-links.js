const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qxhpgjftkkcxdttgjkzj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDQxNDAsImV4cCI6MjA1ODI4MDE0MH0.wXUEJ4KY3Gg-fHb6lCvwKrGOvWrGJlC2hvStD0uDBrs'
);

async function checkLinks() {
  // 전체 매칭 개수 확인
  const { count } = await supabase
    .from('option_product_materials')
    .select('*', { count: 'exact', head: true });

  console.log('=== 옵션상품-원물 매칭 통계 ===');
  console.log('총 매칭 개수:', count);
  console.log('');

  // 샘플 데이터 10개 조회
  const { data: links, error } = await supabase
    .from('option_product_materials')
    .select('id, option_product_id, raw_material_id, quantity, unit_price')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== 샘플 매칭 데이터 ===');

  for (const link of links) {
    const { data: option } = await supabase
      .from('option_products')
      .select('option_code, option_name')
      .eq('id', link.option_product_id)
      .single();

    const { data: material } = await supabase
      .from('raw_materials')
      .select('material_code, material_name')
      .eq('id', link.raw_material_id)
      .single();

    console.log('');
    console.log('옵션상품:', option ? `${option.option_code} - ${option.option_name}` : 'N/A');
    console.log('원물:', material ? `${material.material_code} - ${material.material_name}` : 'N/A');
    console.log('사용량:', link.quantity);
    console.log('단가:', link.unit_price);
  }

  // 옵션상품별 매칭 통계
  const { data: allLinks } = await supabase
    .from('option_product_materials')
    .select('option_product_id');

  const grouped = {};
  allLinks?.forEach(link => {
    grouped[link.option_product_id] = (grouped[link.option_product_id] || 0) + 1;
  });

  const stats = Object.values(grouped);
  console.log('');
  console.log('=== 매칭 통계 ===');
  console.log('매칭된 옵션상품 개수:', Object.keys(grouped).length);
  console.log('옵션상품당 평균 원물 개수:', (stats.reduce((a, b) => a + b, 0) / stats.length).toFixed(2));
  console.log('최대 원물 개수:', Math.max(...stats));
  console.log('최소 원물 개수:', Math.min(...stats));
}

checkLinks();
