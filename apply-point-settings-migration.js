const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'database', 'migrations', 'tier_point_settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('티어 누적점수 설정 테이블 마이그레이션 실행 중...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`마이그레이션 실패: ${error}`);
    }

    console.log('✅ 마이그레이션 완료!');

    // 데이터 확인
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/tier_point_settings?setting_key=eq.default`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    const data = await checkResponse.json();
    console.log('\n저장된 설정:', JSON.stringify(data[0], null, 2));
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
  }
}

runMigration();
