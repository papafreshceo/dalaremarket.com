const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDQxNDAsImV4cCI6MjA1ODI4MDE0MH0.wXUEJ4KY3Gg-fHb6lCvwKrGOvWrGJlC2hvStD0uDBrs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRankingSettings() {
  console.log('🔍 ranking_score_settings 테이블 확인 중...\n');

  const { data, error } = await supabase
    .from('ranking_score_settings')
    .select('*')
    .single();

  if (error) {
    console.error('❌ 오류:', error.message);
    console.error('상세:', error);

    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('\n⚠️  테이블이 존재하지 않습니다. 마이그레이션을 실행해야 합니다.');
    }
  } else {
    console.log('✅ 테이블이 존재하며 데이터가 있습니다:\n');
    console.log(JSON.stringify(data, null, 2));

    if (data.sales_per_point && data.orders_per_point) {
      console.log('\n✅ sales_per_point, orders_per_point 컬럼이 존재합니다.');
      console.log(`   - sales_per_point: ${data.sales_per_point}`);
      console.log(`   - orders_per_point: ${data.orders_per_point}`);
    } else {
      console.log('\n⚠️  필요한 컬럼이 없습니다.');
    }
  }
}

checkRankingSettings().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
