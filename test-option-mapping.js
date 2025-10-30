const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDQxNDAsImV4cCI6MjA1ODI4MDE0MH0.wXUEJ4KY3Gg-fHb6lCvwKrGOvWrGJlC2hvStD0uDBrs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOptionMapping() {
  console.log('=== 옵션 상품 정보 자동 매핑 테스트 ===\n');

  // 1. option_products 테이블 샘플 데이터 확인
  console.log('1. option_products 테이블 샘플 확인:');
  const { data: optionProducts, error: optError } = await supabase
    .from('option_products')
    .select('option_name, seller_supply_price, shipping_entity, invoice_entity, vendor_name, shipping_location_name, shipping_location_address, shipping_location_contact, shipping_cost')
    .limit(5);

  if (optError) {
    console.error('  ❌ 오류:', optError);
  } else {
    console.log(`  ✅ ${optionProducts?.length || 0}개 데이터 조회됨`);
    if (optionProducts && optionProducts.length > 0) {
      console.log('  샘플 데이터:');
      optionProducts.forEach((p, i) => {
        console.log(`  [${i+1}] 옵션명: ${p.option_name}`);
        console.log(`      공급단가: ${p.seller_supply_price || 'NULL'}`);
        console.log(`      출고처: ${p.shipping_entity || 'NULL'}`);
        console.log(`      송장처: ${p.invoice_entity || 'NULL'}`);
        console.log(`      벤더사: ${p.vendor_name || 'NULL'}`);
        console.log(`      발송지명: ${p.shipping_location_name || 'NULL'}`);
      });
    }
  }

  // 2. integrated_orders 최근 데이터 확인
  console.log('\n2. integrated_orders 최근 데이터 확인:');
  const { data: recentOrders, error: ordError } = await supabase
    .from('integrated_orders')
    .select('id, option_name, seller_supply_price, shipping_source, invoice_issuer, vendor_name, settlement_amount, quantity, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (ordError) {
    console.error('  ❌ 오류:', ordError);
  } else {
    console.log(`  ✅ ${recentOrders?.length || 0}개 주문 조회됨`);
    if (recentOrders && recentOrders.length > 0) {
      console.log('  최근 주문:');
      recentOrders.forEach((o, i) => {
        console.log(`  [${i+1}] ID: ${o.id} | 옵션명: ${o.option_name}`);
        console.log(`      공급단가: ${o.seller_supply_price || 'NULL'}`);
        console.log(`      출고처: ${o.shipping_source || 'NULL'}`);
        console.log(`      송장처: ${o.invoice_issuer || 'NULL'}`);
        console.log(`      벤더사: ${o.vendor_name || 'NULL'}`);
        console.log(`      정산금액: ${o.settlement_amount || 'NULL'} (수량: ${o.quantity})`);
        console.log(`      생성일: ${o.created_at}`);
      });
    }
  }

  // 3. 특정 옵션명으로 매핑 테스트
  console.log('\n3. 매핑 로직 테스트:');
  if (optionProducts && optionProducts.length > 0) {
    const testOptionName = optionProducts[0].option_name;
    console.log(`  테스트 옵션명: ${testOptionName}`);

    const { data: matchedOption } = await supabase
      .from('option_products')
      .select('*')
      .eq('option_name', testOptionName)
      .single();

    if (matchedOption) {
      console.log('  ✅ 매칭 성공:');
      console.log('    - seller_supply_price:', matchedOption.seller_supply_price);
      console.log('    - shipping_entity:', matchedOption.shipping_entity);
      console.log('    - invoice_entity:', matchedOption.invoice_entity);
      console.log('    - vendor_name:', matchedOption.vendor_name);
    } else {
      console.log('  ❌ 매칭 실패');
    }
  }

  // 4. integrated_orders 컬럼 존재 여부 확인
  console.log('\n4. integrated_orders 테이블 컬럼 확인:');
  const { data: columnTest, error: colError } = await supabase
    .from('integrated_orders')
    .select('seller_supply_price, shipping_source, invoice_issuer, vendor_name, shipping_location_name, shipping_location_address, shipping_location_contact, shipping_cost')
    .limit(1);

  if (colError) {
    console.error('  ❌ 컬럼 조회 오류:', colError.message);
    console.log('  → integrated_orders 테이블에 필요한 컬럼이 없을 수 있습니다!');
  } else {
    console.log('  ✅ 모든 필수 컬럼 존재');
  }
}

testOptionMapping().catch(console.error);
