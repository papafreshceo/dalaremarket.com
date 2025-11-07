/**
 * 샘플 회원들을 랭킹 참여 상태로 설정
 * Service Role Key 사용
 */

const https = require('https');

const SUPABASE_URL = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

function httpsRequest(options, data) {
  return new Promise((resolve, reject) => {
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('샘플 회원들 랭킹 참여 상태로 설정 중...\n');

  try {
    // 1. 샘플 회원들 조회
    console.log('1. 샘플 회원 조회 중...');
    const usersOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/users?or=(email.ilike.%25sample%25,email.ilike.%25test%25)&select=id,email,name,role&order=email',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const usersResult = await httpsRequest(usersOptions);

    if (usersResult.status !== 200) {
      console.error('❌ 샘플 회원 조회 실패:', usersResult.data);
      return;
    }

    const users = usersResult.data;

    if (!users || users.length === 0) {
      console.log('⚠️  샘플 회원이 없습니다.');
      return;
    }

    console.log(`✅ ${users.length}명의 샘플 회원 발견:`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.name || 'Unknown'})`);
    });

    // 2. 랭킹 참여 상태 업데이트
    console.log('\n2. 랭킹 참여 상태 업데이트 중...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const updateOptions = {
        hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
        path: '/rest/v1/ranking_participation',
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        }
      };

      const updateData = {
        user_id: user.id,
        is_participating: true,
        show_score: true,
        show_sales_performance: true,
        updated_at: new Date().toISOString()
      };

      const updateResult = await httpsRequest(updateOptions, updateData);

      if (updateResult.status >= 200 && updateResult.status < 300) {
        console.log(`   ✅ ${user.email} 업데이트 완료`);
        successCount++;
      } else {
        console.error(`   ❌ ${user.email} 업데이트 실패:`, updateResult.data);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ 완료: ${successCount}명 성공, ${errorCount}명 실패`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
