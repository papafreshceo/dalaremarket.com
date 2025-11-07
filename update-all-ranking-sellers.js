/**
 * seller_rankings 테이블의 모든 셀러를 랭킹 참여 상태로 설정
 */

const https = require('https');

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
  console.log('seller_rankings의 모든 셀러를 랭킹 참여 상태로 설정 중...\n');

  try {
    // 1. seller_rankings에서 고유 seller_id 조회
    console.log('1. seller_rankings 테이블에서 셀러 조회 중...');
    const rankOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/seller_rankings?select=seller_id&limit=1000',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const rankResult = await httpsRequest(rankOptions);

    if (rankResult.status !== 200) {
      console.error('❌ seller_rankings 조회 실패:', rankResult.data);
      return;
    }

    // 고유 seller_id 추출
    const uniqueSellerIds = [...new Set(rankResult.data.map(r => r.seller_id))];
    console.log(`✅ ${uniqueSellerIds.length}명의 고유 셀러 발견\n`);

    // 2. 각 seller_id를 ranking_participation에 추가
    console.log('2. 랭킹 참여 상태 업데이트 중...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const sellerId of uniqueSellerIds) {
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
        user_id: sellerId,
        is_participating: true,
        show_score: true,
        show_sales_performance: true,
        updated_at: new Date().toISOString()
      };

      const updateResult = await httpsRequest(updateOptions, updateData);

      if (updateResult.status >= 200 && updateResult.status < 300) {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`   ✅ ${successCount}/${uniqueSellerIds.length} 완료...`);
        }
      } else {
        console.error(`   ❌ ${sellerId.substring(0, 8)}... 실패:`, updateResult.data);
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
