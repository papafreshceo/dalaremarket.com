const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📝 site_settings 테이블 생성 마이그레이션 시작...');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'database', 'migrations', 'recreate_site_settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // SQL을 개별 명령으로 분리 (세미콜론 기준)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 총 ${statements.length}개의 SQL 명령 실행 예정`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] 실행 중...`);
      console.log(statement.substring(0, 100) + '...');

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        console.error(`❌ 오류 발생:`, error);
        // DROP 명령 실패는 무시 (테이블이 없을 수 있음)
        if (statement.trim().startsWith('DROP')) {
          console.log('⚠️  DROP 명령 실패 무시 (테이블이 존재하지 않을 수 있음)');
          continue;
        }
        throw error;
      }

      console.log('✅ 성공');
    }

    console.log('\n🎉 마이그레이션 완료!');

    // 결과 확인
    console.log('\n📋 site_settings 테이블 확인...');
    const { data: settings, error: selectError } = await supabase
      .from('site_settings')
      .select('*');

    if (selectError) {
      console.error('❌ 조회 오류:', selectError);
    } else {
      console.log('✅ site_settings 데이터:', JSON.stringify(settings, null, 2));
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

applyMigration();
