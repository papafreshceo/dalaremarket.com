// UTC 타임스탬프 마이그레이션 스크립트
// 실행: node scripts/migrate-to-utc.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 읽기
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('🚀 UTC 타임스탬프 마이그레이션 시작...\n');

  try {
    // 1. integrated_orders 테이블 업데이트
    console.log('1️⃣  integrated_orders 테이블 마이그레이션 중...');

    const { data: orders, error: fetchError } = await supabase
      .from('integrated_orders')
      .select('id, created_at, updated_at, confirmed_at, payment_confirmed_at, cancel_requested_at, canceled_at, refund_processed_at')
      .limit(10000);

    if (fetchError) {
      console.error('❌ 주문 조회 오류:', fetchError);
      return;
    }

    console.log(`   📊 총 ${orders.length}개의 레코드를 변환합니다...`);

    // 배치 단위로 처리 (한 번에 100개씩)
    const batchSize = 100;
    let updatedCount = 0;

    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);

      const updates = batch.map(order => {
        const convertToUTC = (dateStr) => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          // 9시간 빼기 (한국 시간 -> UTC)
          date.setHours(date.getHours() - 9);
          return date.toISOString();
        };

        return {
          id: order.id,
          created_at: convertToUTC(order.created_at),
          updated_at: convertToUTC(order.updated_at),
          confirmed_at: convertToUTC(order.confirmed_at),
          payment_confirmed_at: convertToUTC(order.payment_confirmed_at),
          cancel_requested_at: convertToUTC(order.cancel_requested_at),
          canceled_at: convertToUTC(order.canceled_at),
          refund_processed_at: convertToUTC(order.refund_processed_at)
        };
      });

      // 개별 업데이트 수행
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('integrated_orders')
          .update({
            created_at: update.created_at,
            updated_at: update.updated_at,
            confirmed_at: update.confirmed_at,
            payment_confirmed_at: update.payment_confirmed_at,
            cancel_requested_at: update.cancel_requested_at,
            canceled_at: update.canceled_at,
            refund_processed_at: update.refund_processed_at
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`   ❌ ID ${update.id} 업데이트 오류:`, updateError);
        } else {
          updatedCount++;
        }
      }

      console.log(`   진행률: ${Math.min(i + batchSize, orders.length)}/${orders.length}`);
    }

    console.log(`✅ integrated_orders 마이그레이션 완료! (${updatedCount}개 업데이트)\n`);

    // 2. 결과 확인
    console.log('2️⃣  마이그레이션 결과 확인 중...');
    const { data: sampleOrders, error: sampleError } = await supabase
      .from('integrated_orders')
      .select('id, order_number, created_at, cancel_requested_at, shipping_status')
      .order('id', { ascending: false })
      .limit(5);

    if (!sampleError && sampleOrders) {
      console.log('\n📋 최근 주문 5건 샘플:');
      sampleOrders.forEach(order => {
        const createdDate = new Date(order.created_at);
        console.log(`   - ID: ${order.id} | 주문번호: ${order.order_number || 'N/A'}`);
        console.log(`     UTC: ${order.created_at}`);
        console.log(`     한국시간: ${createdDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
      });
    }

    console.log('\n✅ 모든 마이그레이션 완료!');
    console.log('\n📝 참고사항:');
    console.log('   - 이제 모든 타임스탬프는 UTC로 저장됩니다');
    console.log('   - 화면에는 자동으로 한국 시간으로 표시됩니다');
    console.log('   - 미국 등 다른 국가에서 접속해도 올바른 한국 시간으로 표시됩니다');

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    process.exit(1);
  }
}

migrate();
