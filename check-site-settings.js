const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    console.log('📋 site_settings 테이블 확인 중...\n');

    const { data, error, count } = await supabase
      .from('site_settings')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ 오류:', error.message);
      console.error('코드:', error.code);
      console.error('상세:', error.details);

      if (error.code === '42P01') {
        console.log('\n💡 site_settings 테이블이 존재하지 않습니다.');
        console.log('   Supabase 대시보드 SQL 편집기에서 다음을 실행하세요:');
        console.log('   https://supabase.com/dashboard/project/ketdnqhxwqcgyltinjih/sql/new');
      }
    } else {
      console.log('✅ site_settings 테이블 존재');
      console.log(`📊 레코드 수: ${count}`);
      console.log('\n데이터:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ 에러:', error);
  }
}

checkTable();
