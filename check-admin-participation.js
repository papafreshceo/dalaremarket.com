/**
 * 관리자 계정의 ranking_participation 상태 확인 및 업데이트
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
  console.log('관리자 계정의 랭킹 참여 상태 확인 중...\n');

  try {
    // 1. 관리자 계정 조회
    const adminOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/users?select=id,email,name,role&or=(role.eq.admin,role.eq.super_admin)',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };
    const adminResult = await httpsRequest(adminOptions);

    for (const admin of adminResult.data) {
      console.log(`\n관리자: ${admin.email} (${admin.name})`);
      console.log('─'.repeat(50));

      // 현재 참여 설정 확인
      const checkOptions = {
        hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
        path: `/rest/v1/ranking_participation?select=*&user_id=eq.${admin.id}`,
        method: 'GET',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      };
      const checkResult = await httpsRequest(checkOptions);

      if (checkResult.data && checkResult.data.length > 0) {
        const part = checkResult.data[0];
        console.log(`현재 상태:`);
        console.log(`  - is_participating: ${part.is_participating}`);
        console.log(`  - show_score: ${part.show_score}`);
        console.log(`  - show_sales_performance: ${part.show_sales_performance}`);

        // false면 true로 업데이트
        if (!part.is_participating) {
          console.log('\n❌ 참여 안 함 → 참여로 변경 중...');

          const updateOptions = {
            hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
            path: `/rest/v1/ranking_participation?user_id=eq.${admin.id}`,
            method: 'PATCH',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json'
            }
          };

          const updateData = {
            is_participating: true,
            show_score: true,
            show_sales_performance: true,
            updated_at: new Date().toISOString()
          };

          const updateResult = await httpsRequest(updateOptions, updateData);

          if (updateResult.status >= 200 && updateResult.status < 300) {
            console.log('✅ 업데이트 완료!');
          } else {
            console.log('❌ 업데이트 실패:', updateResult.data);
          }
        } else {
          console.log('\n✅ 이미 참여 중입니다!');
        }
      } else {
        console.log('❌ ranking_participation 레코드 없음');
      }
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

main();
