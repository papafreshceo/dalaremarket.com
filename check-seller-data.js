/**
 * 셀러 관련 테이블 데이터 확인
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

async function checkTable(tableName, selectFields = '*', limit = 10) {
  const options = {
    hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
    path: `/rest/v1/${tableName}?select=${selectFields}&limit=${limit}`,
    method: 'GET',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    }
  };

  return await httpsRequest(options);
}

async function main() {
  console.log('셀러 관련 테이블 데이터 확인 중...\n');

  try {
    // 1. seller_performance_daily
    console.log('1. seller_performance_daily 테이블:');
    const perfResult = await checkTable('seller_performance_daily', 'seller_id,date,total_sales,order_count', 5);
    if (perfResult.status === 200) {
      console.log(`   데이터 ${perfResult.data.length}개 발견`);
      perfResult.data.forEach(d => {
        console.log(`   - ${d.seller_id.substring(0, 8)}... (${d.date}): ${d.total_sales}원, ${d.order_count}건`);
      });
    } else {
      console.log('   ❌ 조회 실패:', perfResult.data);
    }

    // 2. seller_rankings
    console.log('\n2. seller_rankings 테이블:');
    const rankResult = await checkTable('seller_rankings', 'seller_id,period_type,rank,total_score', 5);
    if (rankResult.status === 200) {
      console.log(`   데이터 ${rankResult.data.length}개 발견`);
      rankResult.data.forEach(d => {
        console.log(`   - ${d.seller_id.substring(0, 8)}... (${d.period_type}): ${d.rank}위, ${d.total_score}점`);
      });
    } else {
      console.log('   ❌ 조회 실패:', rankResult.data);
    }

    // 3. ranking_participation
    console.log('\n3. ranking_participation 테이블:');
    const partResult = await checkTable('ranking_participation', 'user_id,is_participating', 100);
    if (partResult.status === 200) {
      console.log(`   데이터 ${partResult.data.length}개 발견`);
      const participating = partResult.data.filter(d => d.is_participating);
      console.log(`   참여 중: ${participating.length}명`);
      partResult.data.slice(0, 10).forEach(d => {
        console.log(`   - ${d.user_id.substring(0, 8)}...: ${d.is_participating ? '참여' : '미참여'}`);
      });
    } else {
      console.log('   ❌ 조회 실패:', partResult.data);
    }

    // 4. 고유한 seller_id 개수 확인
    console.log('\n4. seller_performance_daily의 고유 seller_id 개수:');
    const allPerfResult = await checkTable('seller_performance_daily', 'seller_id', 1000);
    if (allPerfResult.status === 200) {
      const uniqueSellers = new Set(allPerfResult.data.map(d => d.seller_id));
      console.log(`   고유 셀러: ${uniqueSellers.size}명`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
