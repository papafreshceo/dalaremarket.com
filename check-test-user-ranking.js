/**
 * test@naver.com 계정의 랭킹 데이터 확인
 */

const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

function httpsRequest(options) {
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
    req.end();
  });
}

async function main() {
  console.log('test@naver.com 계정 확인 중...\n');

  try {
    // 1. test@naver.com의 user_id 조회
    console.log('1. test@naver.com 사용자 정보:');
    const userOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/users?select=id,email,name,role&email=eq.test@naver.com',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };
    const userResult = await httpsRequest(userOptions);

    if (!userResult.data || userResult.data.length === 0) {
      console.log('   ❌ test@naver.com 사용자를 찾을 수 없습니다.');
      return;
    }

    const user = userResult.data[0];
    console.log(`   ✅ ID: ${user.id}`);
    console.log(`   ✅ 이름: ${user.name}`);
    console.log(`   ✅ 역할: ${user.role}`);

    // 2. ranking_participation 확인
    console.log('\n2. 랭킹 참여 설정:');
    const partOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: `/rest/v1/ranking_participation?select=*&user_id=eq.${user.id}`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };
    const partResult = await httpsRequest(partOptions);

    if (partResult.data && partResult.data.length > 0) {
      const part = partResult.data[0];
      console.log(`   ✅ 참여: ${part.is_participating}`);
      console.log(`   ✅ 점수 공개: ${part.show_score}`);
      console.log(`   ✅ 실적 공개: ${part.show_sales_performance}`);
    } else {
      console.log('   ❌ 랭킹 참여 설정 없음');
    }

    // 3. seller_rankings 데이터 확인
    console.log('\n3. seller_rankings 데이터:');
    const rankOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: `/rest/v1/seller_rankings?select=period_type,period_start,rank,total_score&seller_id=eq.${user.id}&order=period_start.desc`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };
    const rankResult = await httpsRequest(rankOptions);

    if (rankResult.data && rankResult.data.length > 0) {
      console.log(`   ✅ ${rankResult.data.length}개의 랭킹 데이터 발견:`);
      rankResult.data.slice(0, 5).forEach(r => {
        console.log(`      - ${r.period_type} (${r.period_start}): ${r.rank}위, ${r.total_score}점`);
      });
    } else {
      console.log('   ❌ seller_rankings에 데이터 없음 ← 이게 문제!');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

main();
