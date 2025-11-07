/**
 * ranking_rewards_settings 테이블 생성
 */

const https = require('https');
const fs = require('fs');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

// SQL 파일 읽기
const sql = fs.readFileSync('database/migrations/create_ranking_rewards_settings.sql', 'utf8');

// SQL을 개별 구문으로 분리 (단순하게)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

function executeSql(sqlStatement) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sqlStatement });

    const options = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('ranking_rewards_settings 테이블 생성 중...\n');

  try {
    // CREATE TABLE 구문 실행
    const createTableSql = `
CREATE TABLE IF NOT EXISTS ranking_rewards_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL,
  rank INTEGER NOT NULL,
  reward_cash INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period_type, rank)
);
    `;

    console.log('1. 테이블 생성...');
    const result1 = await executeSql(createTableSql);
    console.log('   상태:', result1.status);

    // 인덱스 생성
    console.log('\n2. 인덱스 생성...');
    const indexSql = `CREATE INDEX IF NOT EXISTS idx_ranking_rewards_period ON ranking_rewards_settings(period_type, rank ASC);`;
    const result2 = await executeSql(indexSql);
    console.log('   상태:', result2.status);

    // 트리거 함수 생성
    console.log('\n3. 트리거 함수 생성...');
    const triggerFnSql = `
CREATE OR REPLACE FUNCTION update_ranking_rewards_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    `;
    const result3 = await executeSql(triggerFnSql);
    console.log('   상태:', result3.status);

    // 트리거 생성
    console.log('\n4. 트리거 생성...');
    const triggerSql = `
DROP TRIGGER IF EXISTS ranking_rewards_settings_updated_at ON ranking_rewards_settings;
CREATE TRIGGER ranking_rewards_settings_updated_at
  BEFORE UPDATE ON ranking_rewards_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ranking_rewards_settings_updated_at();
    `;
    const result4 = await executeSql(triggerSql);
    console.log('   상태:', result4.status);

    // 기본 데이터 삽입 (Supabase REST API 사용)
    console.log('\n5. 기본 보상 데이터 삽입...');

    const rewards = [
      { period_type: 'weekly', rank: 1, reward_cash: 100000 },
      { period_type: 'weekly', rank: 2, reward_cash: 50000 },
      { period_type: 'weekly', rank: 3, reward_cash: 30000 },
      { period_type: 'weekly', rank: 4, reward_cash: 20000 },
      { period_type: 'weekly', rank: 5, reward_cash: 10000 },
      { period_type: 'monthly', rank: 1, reward_cash: 500000 },
      { period_type: 'monthly', rank: 2, reward_cash: 300000 },
      { period_type: 'monthly', rank: 3, reward_cash: 200000 },
      { period_type: 'monthly', rank: 4, reward_cash: 150000 },
      { period_type: 'monthly', rank: 5, reward_cash: 100000 },
      { period_type: 'monthly', rank: 6, reward_cash: 80000 },
      { period_type: 'monthly', rank: 7, reward_cash: 60000 },
      { period_type: 'monthly', rank: 8, reward_cash: 50000 },
      { period_type: 'monthly', rank: 9, reward_cash: 40000 },
      { period_type: 'monthly', rank: 10, reward_cash: 30000 }
    ];

    for (const reward of rewards) {
      const postData = JSON.stringify(reward);
      const options = {
        hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
        path: '/rest/v1/ranking_rewards_settings',
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates'
        }
      };

      await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
    }

    console.log('   ✅ 15개의 기본 보상 설정 완료');

    console.log('\n' + '='.repeat(50));
    console.log('✅ ranking_rewards_settings 테이블 생성 완료!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

main();
