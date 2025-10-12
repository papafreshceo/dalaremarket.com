require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    const sql = fs.readFileSync('database/migrations/036_add_performance_indexes.sql', 'utf8');

    console.log('🚀 성능 인덱스 마이그레이션 실행 중...\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    }

    console.log('✅ 마이그레이션 성공!');
    console.log('\n📊 생성된 인덱스:');
    console.log('  1. idx_integrated_orders_seller_id (셀러 주문 최적화)');
    console.log('  2. idx_integrated_orders_is_deleted (삭제 필터링)');
    console.log('  3. idx_integrated_orders_sheet_date_market (날짜+마켓)');
    console.log('  4. idx_integrated_orders_payment_date_market (결제일+마켓)');
    console.log('  5. idx_integrated_orders_sheet_date_status (날짜+상태)');
    console.log('  6. idx_integrated_orders_vendor_date (벤더+날짜)');
    console.log('  7. 텍스트 검색 인덱스 (주문번호, 수취인, 옵션명)');
    console.log('  8. idx_integrated_orders_payment_confirmed (입금확인)');
    console.log('  9. idx_integrated_orders_refund_processed (환불처리)');
    console.log('\n🚀 예상 성능 향상:');
    console.log('  - 서치탭: 2-5배 빠른 조회');
    console.log('  - 플랫폼주문: 10배 이상 빠른 조회');
    console.log('  - 검색: 3-4배 빠른 텍스트 검색');

  } catch (err) {
    console.error('❌ 오류:', err);
    process.exit(1);
  }
}

runMigration();
