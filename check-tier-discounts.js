const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDiscounts() {
  try {
    console.log('📋 tier_criteria 테이블 확인 중...\n');

    const { data, error } = await supabase
      .from('tier_criteria')
      .select('*')
      .order('discount_rate', { ascending: false });

    if (error) {
      console.error('❌ 오류:', error);
    } else {
      console.log('✅ tier_criteria 테이블 데이터:');
      console.table(data);

      console.log('\n🔍 TierBadge.tsx에 하드코딩된 값:');
      console.log('  light      : 0%');
      console.log('  standard   : 3%');
      console.log('  advance    : 5%');
      console.log('  elite      : 7%');
      console.log('  legend     : 10%');

      console.log('\n💡 매핑 확인:');
      console.log('  legend (10%)   ←→ diamond (DB)');
      console.log('  elite (7%)     ←→ platinum (DB)');
      console.log('  advance (5%)   ←→ gold (DB)');
      console.log('  standard (3%)  ←→ silver (DB)');
      console.log('  light (0%)     ←→ bronze (DB)');
    }
  } catch (error) {
    console.error('❌ 에러:', error);
  }
}

checkDiscounts();
