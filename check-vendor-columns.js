/**
 * 벤더사 컬럼 확인
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('📌 벤더사 관련 컬럼 확인\n');

// option_products
const { data: opt } = await supabase.from('option_products').select('*').limit(1);
if (opt && opt.length > 0) {
  const cols = Object.keys(opt[0]).filter(c => c.includes('vendor') || c.includes('벤더'));
  console.log('✅ option_products 벤더 컬럼:');
  cols.forEach(c => console.log(`   - ${c}`));
  if (cols.length === 0) console.log('   (없음)');
}

console.log('');

// integrated_orders
const { data: ord } = await supabase.from('integrated_orders').select('*').limit(1);
if (ord && ord.length > 0) {
  const cols = Object.keys(ord[0]).filter(c => c.includes('vendor') || c.includes('벤더'));
  console.log('✅ integrated_orders 벤더 컬럼:');
  cols.forEach(c => console.log(`   - ${c}`));
  if (cols.length === 0) console.log('   (없음)');
}

console.log('\n💡 두 테이블의 벤더 관련 컬럼명이 일치해야 매핑됩니다.');
