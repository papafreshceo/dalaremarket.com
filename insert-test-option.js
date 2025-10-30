const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.BbFSQCAXmetre9qbLS9L-Cv6xYEaJ0a4aXOEBOVJq0c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestOption() {
  console.log('테스트 옵션 상품 삽입 중...\n');

  // 1. 먼저 partners 테이블에서 벤더 ID 조회
  const { data: vendors } = await supabase
    .from('partners')
    .select('id, name')
    .limit(1);

  let vendorId = null;
  if (vendors && vendors.length > 0) {
    vendorId = vendors[0].id;
    console.log('✅ 벤더 찾음:', vendors[0].name, '(ID:', vendorId + ')');
  } else {
    console.log('⚠️ 벤더가 없습니다. shipping_vendor_id는 NULL로 설정됩니다.');
  }

  // 2. 테스트 옵션 상품 삽입
  const testOption = {
    option_name: '테스트상품_자동매핑_' + Date.now(),
    option_code: 'TEST' + Date.now(),
    seller_supply_price: 15000,
    shipping_entity: '자사출고',
    invoice_entity: 'CJ대한통운',
    shipping_vendor_id: vendorId,
    shipping_location_name: '서울창고',
    shipping_location_address: '서울시 강남구 테스트로 123',
    shipping_location_contact: '02-1234-5678',
    shipping_cost: 3000,
    naver_paid_shipping_price: 20000,
    naver_free_shipping_price: 23000,
    status: '공급중'
  };

  const { data, error } = await supabase
    .from('option_products')
    .insert([testOption])
    .select();

  if (error) {
    console.error('❌ 삽입 실패:', error);
    return;
  }

  console.log('\n✅ 테스트 옵션 상품 삽입 성공!');
  console.log('   옵션명:', data[0].option_name);
  console.log('   공급단가:', data[0].seller_supply_price);
  console.log('   출고처:', data[0].shipping_entity);
  console.log('   송장처:', data[0].invoice_entity);
  console.log('   벤더ID:', data[0].shipping_vendor_id);
  console.log('   발송지명:', data[0].shipping_location_name);

  return data[0];
}

insertTestOption().catch(console.error);
