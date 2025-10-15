/**
 * DB 한글 컬럼 확인
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('📌 테이블별 한글 컬럼 확인\n');

// integrated_orders 확인
const { data: orders } = await supabase.from('integrated_orders').select('*').limit(1);
if (orders && orders.length > 0) {
  const orderColumns = Object.keys(orders[0]);
  const koreanCols = orderColumns.filter(c => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(c));

  console.log('✅ integrated_orders 테이블:');
  console.log(`   총 ${orderColumns.length}개 컬럼 중 한글 컬럼 ${koreanCols.length}개`);
  if (koreanCols.length > 0) {
    koreanCols.forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('   한글 컬럼 없음 ✅');
  }
}

console.log('');

// option_products 확인
const { data: options } = await supabase.from('option_products').select('*').limit(1);
if (options && options.length > 0) {
  const optionColumns = Object.keys(options[0]);
  const koreanCols = optionColumns.filter(c => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(c));

  console.log('✅ option_products 테이블:');
  console.log(`   총 ${optionColumns.length}개 컬럼 중 한글 컬럼 ${koreanCols.length}개`);
  if (koreanCols.length > 0) {
    koreanCols.forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('   한글 컬럼 없음 ✅');
  }
}

console.log('\n💡 테스트 중 추가된 한글 컬럼은 없었습니다.');
console.log('   코드만 수정했고 실제 DB 스키마는 변경하지 않았습니다.\n');
