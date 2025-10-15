// seller_order_number 칼럼 추가 마이그레이션
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('🚀 seller_order_number 칼럼 추가 시작...\n');

  try {
    // 1. 칼럼 추가 (Supabase는 직접 SQL 실행 필요)
    console.log('1️⃣  seller_order_number 칼럼 추가 중...');

    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE integrated_orders
        ADD COLUMN IF NOT EXISTS seller_order_number VARCHAR(255);
      `
    });

    if (addColumnError && !addColumnError.message.includes('already exists')) {
      console.error('❌ 칼럼 추가 오류:', addColumnError);
      console.log('\n⚠️  Supabase Dashboard에서 직접 실행하세요:');
      console.log('ALTER TABLE integrated_orders ADD COLUMN IF NOT EXISTS seller_order_number VARCHAR(255);');
      return;
    }

    console.log('✅ seller_order_number 칼럼 추가 완료\n');

    // 2. 기존 데이터 확인
    console.log('2️⃣  기존 데이터 확인 중...');
    const { data: orders, error: fetchError } = await supabase
      .from('integrated_orders')
      .select('id, order_number, seller_order_number, shipping_status')
      .in('shipping_status', ['발주서등록', '접수'])
      .limit(10);

    if (fetchError) {
      console.error('❌ 데이터 조회 오류:', fetchError);
      return;
    }

    console.log(`📊 발주서등록/접수 상태 주문: ${orders.length}건`);
    if (orders.length > 0) {
      console.log('샘플:');
      orders.slice(0, 3).forEach(o => {
        console.log(`  - ID: ${o.id} | order_number: ${o.order_number} | seller_order_number: ${o.seller_order_number || 'NULL'}`);
      });
    }

    console.log('\n✅ 마이그레이션 완료!');
    console.log('\n📝 참고사항:');
    console.log('   - seller_order_number: 셀러의 원본 주문번호');
    console.log('   - order_number: 발주확정 시 생성되는 시스템 발주번호');
    console.log('   - 발주서 업로드 시: seller_order_number에 저장');
    console.log('   - 발주확정 시: order_number에 발주번호 생성 및 저장');

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    process.exit(1);
  }
}

migrate();
