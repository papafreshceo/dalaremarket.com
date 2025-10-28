// enrichOrdersWithOptionInfo 함수 테스트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDQxNDAsImV4cCI6MjA1ODI4MDE0MH0.wXUEJ4KY3Gg-fHb6lCvwKrGOvWrGJlC2hvStD0uDBrs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('=== 1. option_products 테이블에서 데이터 조회 ===');
  const { data: optionProducts, error: optionError } = await supabase
    .from('option_products')
    .select('option_name, seller_supply_price, shipping_entity, invoice_entity, vendor_name, shipping_location_name')
    .limit(3);

  if (optionError) {
    console.error('❌ 조회 실패:', optionError);
    return;
  }

  console.log('✅ 조회 성공:', optionProducts);

  if (!optionProducts || optionProducts.length === 0) {
    console.log('❌ 옵션 상품 데이터가 없습니다.');
    return;
  }

  console.log('\n=== 2. 테스트 주문 데이터 생성 ===');
  const testOption = optionProducts[0];
  console.log('사용할 옵션:', testOption.option_name);

  const testOrder = {
    option_name: testOption.option_name,
    quantity: '2',
    recipient_name: '테스트',
    seller_market_name: '쿠팡'
  };

  console.log('테스트 주문:', testOrder);

  console.log('\n=== 3. enrichOrdersWithOptionInfo 함수 시뮬레이션 ===');

  // option_products에서 조회
  const { data: enrichData, error: enrichError } = await supabase
    .from('option_products')
    .select('option_name, seller_supply_price, shipping_entity, invoice_entity, vendor_name, shipping_location_name, shipping_location_address, shipping_location_contact, shipping_cost')
    .eq('option_name', testOption.option_name);

  if (enrichError) {
    console.error('❌ enrichment 조회 실패:', enrichError);
    return;
  }

  console.log('✅ enrichment 데이터:', enrichData);

  if (enrichData && enrichData.length > 0) {
    const optionInfo = enrichData[0];
    const enrichedOrder = {
      ...testOrder,
      seller_supply_price: optionInfo.seller_supply_price,
      shipping_source: optionInfo.shipping_entity,
      invoice_issuer: optionInfo.invoice_entity,
      vendor_name: optionInfo.vendor_name,
      shipping_location_name: optionInfo.shipping_location_name,
      shipping_location_address: optionInfo.shipping_location_address,
      shipping_location_contact: optionInfo.shipping_location_contact,
      shipping_cost: optionInfo.shipping_cost,
      settlement_amount: optionInfo.seller_supply_price ? optionInfo.seller_supply_price * parseInt(testOrder.quantity) : null
    };

    console.log('\n=== 4. Enrichment 결과 ===');
    console.log(JSON.stringify(enrichedOrder, null, 2));

    console.log('\n=== 5. 필드 확인 ===');
    console.log('shipping_source:', enrichedOrder.shipping_source);
    console.log('invoice_issuer:', enrichedOrder.invoice_issuer);
    console.log('vendor_name:', enrichedOrder.vendor_name);
    console.log('shipping_location_name:', enrichedOrder.shipping_location_name);
    console.log('settlement_amount:', enrichedOrder.settlement_amount);
  }
}

test().catch(console.error);
