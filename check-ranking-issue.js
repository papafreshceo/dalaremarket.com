/**
 * 랭킹이 안 보이는 이유 확인
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
  console.log('랭킹 데이터 확인 중...\n');

  try {
    // 1. seller_rankings에 있는 seller_id 중 5개
    console.log('1. seller_rankings 데이터 샘플:');
    const rankOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/seller_rankings?select=seller_id,rank,total_score,period_type&period_type=eq.monthly&order=rank.asc&limit=5',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };
    const rankResult = await httpsRequest(rankOptions);
    console.log('   ', JSON.stringify(rankResult.data, null, 2));

    // 2. 해당 seller_id들이 users 테이블에 있는지 확인
    if (rankResult.data && rankResult.data.length > 0) {
      const sellerIds = rankResult.data.map(r => r.seller_id);
      console.log('\n2. 해당 seller_id가 users 테이블에 있는지 확인:');

      for (const sellerId of sellerIds) {
        const userOptions = {
          hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
          path: `/rest/v1/users?select=id,email,name&id=eq.${sellerId}`,
          method: 'GET',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        };
        const userResult = await httpsRequest(userOptions);

        if (userResult.data && userResult.data.length > 0) {
          console.log(`   ✅ ${sellerId.substring(0, 8)}... → ${userResult.data[0].email}`);
        } else {
          console.log(`   ❌ ${sellerId.substring(0, 8)}... → users 테이블에 없음!`);
        }
      }
    }

    // 3. users 조인 시도
    console.log('\n3. users 테이블 조인 시도:');
    const joinOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/seller_rankings?select=*,users!seller_rankings_seller_id_fkey(id,name,email)&period_type=eq.monthly&order=rank.asc&limit=5',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };
    const joinResult = await httpsRequest(joinOptions);

    if (joinResult.status === 200) {
      console.log(`   ✅ 조인 성공: ${joinResult.data.length}개 조회됨`);
      joinResult.data.forEach((r, i) => {
        console.log(`   ${i + 1}. Rank ${r.rank}, User: ${r.users ? r.users.email : 'NULL'}`);
      });
    } else {
      console.log('   ❌ 조인 실패:', joinResult.data);
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

main();
