// 기존 취소요청 날짜 데이터를 UTC로 수정하는 스크립트
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixTimestamps() {
  console.log('취소요청 날짜 데이터 수정 중...\n');

  // 타임존 정보가 없는 취소요청 데이터 조회
  const { data: orders, error: fetchError } = await supabase
    .from('integrated_orders')
    .select('id, cancel_requested_at, canceled_at')
    .not('cancel_requested_at', 'is', null);

  if (fetchError) {
    console.error('데이터 조회 오류:', fetchError);
    return;
  }

  console.log(`총 ${orders.length}개의 취소요청 데이터 발견\n`);

  for (const order of orders) {
    const updates = {};

    // cancel_requested_at 수정 (타임존 정보 없으면 Z 추가)
    if (order.cancel_requested_at && !order.cancel_requested_at.includes('+') && !order.cancel_requested_at.endsWith('Z')) {
      updates.cancel_requested_at = order.cancel_requested_at.replace(/(\.\d{3})$/, '$1Z');
      console.log(`ID ${order.id}:`);
      console.log(`  변경 전: ${order.cancel_requested_at}`);
      console.log(`  변경 후: ${updates.cancel_requested_at}`);
    }

    // canceled_at 수정
    if (order.canceled_at && !order.canceled_at.includes('+') && !order.canceled_at.endsWith('Z')) {
      updates.canceled_at = order.canceled_at.replace(/(\.\d{3})$/, '$1Z');
      console.log(`  canceled_at 변경 전: ${order.canceled_at}`);
      console.log(`  canceled_at 변경 후: ${updates.canceled_at}`);
    }

    // 업데이트 실행
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('integrated_orders')
        .update(updates)
        .eq('id', order.id);

      if (updateError) {
        console.error(`  업데이트 오류:`, updateError);
      } else {
        console.log(`  ✓ 업데이트 완료`);
      }
      console.log('');
    }
  }

  console.log('모든 데이터 수정 완료!');
}

fixTimestamps();
