// 주문 상태 확인 스크립트
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

async function checkOrders() {
  console.log('🔍 주문 상태 확인 중...\n');

  try {
    // 1. 전체 주문 조회
    const { data: allOrders, error: allError } = await supabase
      .from('integrated_orders')
      .select('id, order_number, shipping_status, seller_id, market_name, is_deleted')
      .eq('is_deleted', false)
      .order('id', { ascending: false })
      .limit(20);

    if (allError) {
      console.error('❌ 조회 오류:', allError);
      return;
    }

    console.log('📊 최근 주문 20건:');
    console.log('─'.repeat(100));
    allOrders.forEach(order => {
      console.log(`ID: ${order.id} | 주문번호: ${order.order_number || 'N/A'} | 상태: ${order.shipping_status || 'NULL'} | 셀러ID: ${order.seller_id ? 'O' : 'X'} | 마켓: ${order.market_name || 'N/A'}`);
    });

    // 2. 상태별 통계
    console.log('\n📈 상태별 통계:');
    console.log('─'.repeat(100));

    const statusCount = {};
    allOrders.forEach(order => {
      const status = order.shipping_status || 'NULL';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}건`);
    });

    // 3. seller_id가 있는 '발주서등록' 상태 주문 확인
    console.log('\n🎯 seller_id가 있는 발주서등록 상태 주문:');
    console.log('─'.repeat(100));

    const { data: registeredOrders, error: regError } = await supabase
      .from('integrated_orders')
      .select('id, order_number, shipping_status, seller_id, market_name')
      .eq('is_deleted', false)
      .eq('shipping_status', '발주서등록')
      .not('seller_id', 'is', null);

    if (regError) {
      console.error('❌ 조회 오류:', regError);
    } else if (registeredOrders.length === 0) {
      console.log('  ⚠️  발견된 주문 없음');
    } else {
      console.log(`  ✅ 총 ${registeredOrders.length}건 발견:`);
      registeredOrders.forEach(order => {
        console.log(`    - ID: ${order.id} | 주문번호: ${order.order_number} | 셀러ID: ${order.seller_id}`);
      });
    }

    // 4. seller_id가 있는 모든 주문 상태 확인
    console.log('\n📦 seller_id가 있는 주문들의 상태:');
    console.log('─'.repeat(100));

    const { data: sellerOrders, error: sellerError } = await supabase
      .from('integrated_orders')
      .select('id, order_number, shipping_status, seller_id, market_name')
      .eq('is_deleted', false)
      .not('seller_id', 'is', null)
      .limit(10);

    if (!sellerError && sellerOrders) {
      const sellerStatusCount = {};
      sellerOrders.forEach(order => {
        const status = order.shipping_status || 'NULL';
        sellerStatusCount[status] = (sellerStatusCount[status] || 0) + 1;
      });

      Object.entries(sellerStatusCount).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}건`);
      });
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkOrders();
