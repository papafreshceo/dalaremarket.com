/**
 * integrated_orders 테이블 데이터 검증 스크립트
 * - 실제 DB 데이터 구조 확인
 * - 날짜 필드 형식 확인
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDQxNDAsImV4cCI6MjA1ODI4MDE0MH0.wXUEJ4KY3Gg-fHb6lCvwKrGOvWrGJlC2hvStD0uDBrs';

async function checkIntegratedOrders() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📊 integrated_orders 테이블 검증 시작...\n');

  // 1. 전체 주문 수 확인
  const { data: allOrders, error: countError } = await supabase
    .from('integrated_orders')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ 주문 수 조회 실패:', countError.message);
    return;
  }

  console.log(`✅ 전체 주문 수: ${allOrders?.length || 0}건\n`);

  // 2. 샘플 데이터 3건 조회
  const { data: orders, error: selectError } = await supabase
    .from('integrated_orders')
    .select('id, order_number, option_name, shipping_status, created_at, seller_id, confirmed_at, shipped_date, canceled_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (selectError) {
    console.error('❌ 샘플 데이터 조회 실패:', selectError.message);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('⚠️ 주문 데이터가 없습니다.');
    return;
  }

  console.log(`✅ 샘플 주문 데이터 (최신 3건):\n`);

  orders.forEach((order, index) => {
    console.log(`[주문 ${index + 1}]`);
    console.log(`  - ID: ${order.id}`);
    console.log(`  - 주문번호: ${order.order_number}`);
    console.log(`  - 옵션명: ${order.option_name}`);
    console.log(`  - 발송상태: ${order.shipping_status}`);
    console.log(`  - 등록일시 (created_at): ${order.created_at}`);
    console.log(`  - 발주확정일시 (confirmed_at): ${order.confirmed_at || '미확정'}`);
    console.log(`  - 발송일 (shipped_date): ${order.shipped_date || '미발송'}`);
    console.log(`  - 취소일 (canceled_at): ${order.canceled_at || '미취소'}`);
    console.log(`  - seller_id: ${order.seller_id}`);

    // 날짜 형식 검증
    if (order.created_at) {
      const createdDate = new Date(order.created_at);
      console.log(`  - created_at 파싱: ${createdDate.toISOString()}`);
      console.log(`  - 한국 시간: ${new Date(createdDate.getTime() + 9*60*60*1000).toISOString()}`);
    }
    console.log('');
  });

  // 3. 날짜별 그룹화 확인
  console.log('📅 날짜별 주문 분포:\n');

  const { data: dateGroups, error: groupError } = await supabase
    .from('integrated_orders')
    .select('created_at')
    .order('created_at', { ascending: false });

  if (!groupError && dateGroups) {
    const dateCounts = new Map();

    dateGroups.forEach(order => {
      if (order.created_at) {
        const date = new Date(order.created_at);
        const koreaDate = new Date(date.getTime() + 9*60*60*1000);
        const dateKey = koreaDate.toISOString().split('T')[0];
        dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1);
      }
    });

    const sortedDates = Array.from(dateCounts.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10);

    sortedDates.forEach(([date, count]) => {
      console.log(`  ${date}: ${count}건`);
    });
  }

  // 4. 상태별 분포 확인
  console.log('\n📊 발송상태별 분포:\n');

  const statusCounts = new Map();
  orders.forEach(order => {
    const status = order.shipping_status || '상태없음';
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  statusCounts.forEach((count, status) => {
    console.log(`  ${status}: ${count}건`);
  });

  console.log('\n✅ 검증 완료!');
}

checkIntegratedOrders().catch(err => {
  console.error('💥 오류 발생:', err);
  process.exit(1);
});
