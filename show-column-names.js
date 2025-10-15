/**
 * 실제 DB 컬럼명 출력
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('📌 option_products 테이블의 실제 컬럼명:\n');

const { data } = await supabase.from('option_products').select('*').limit(1);

if (data && data.length > 0) {
  const columns = Object.keys(data[0]);

  console.log('출고/송장 관련 컬럼명:');
  columns.forEach(col => {
    if (col.includes('ship') || col.includes('invoice') ||
        col.includes('출고') || col.includes('송장') || col.includes('벤더')) {
      console.log(`  "${col}"`);
    }
  });

  console.log('\n발송지 관련 컬럼명:');
  columns.forEach(col => {
    if (col.includes('location') || col.includes('발송')) {
      console.log(`  "${col}"`);
    }
  });

  console.log('\n💡 설명:');
  console.log('   - 만약 "출고"라고 표시되면 → 컬럼명 자체가 한글입니다');
  console.log('   - 만약 "shipping_entity"라고 표시되면 → 컬럼명이 영문입니다\n');
}
