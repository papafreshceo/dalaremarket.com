/**
 * 관리자 계정을 랭킹 참여 상태로 설정
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
  console.log('관리자 계정 랭킹 참여 설정 중...\n');

  try {
    // 1. 관리자 계정 조회
    console.log('1. 관리자 계정 조회:');
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

    if (!adminResult.data || adminResult.data.length === 0) {
      console.log('   ❌ 관리자 계정을 찾을 수 없습니다.');
      return;
    }

    console.log(`   ✅ ${adminResult.data.length}명의 관리자 발견:`);
    adminResult.data.forEach(u => {
      console.log(`      - ${u.email} (${u.name}) [${u.role}]`);
    });

    // 2. 각 관리자를 랭킹 참여 상태로 설정
    console.log('\n2. 랭킹 참여 상태로 설정 중...\n');

    for (const admin of adminResult.data) {
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
        user_id: admin.id,
        is_participating: true,
        show_score: true,
        show_sales_performance: true,
        updated_at: new Date().toISOString()
      };

      const updateResult = await httpsRequest(updateOptions, updateData);

      if (updateResult.status >= 200 && updateResult.status < 300) {
        console.log(`   ✅ ${admin.email} 설정 완료`);
      } else {
        console.log(`   ⚠️  ${admin.email}:`, updateResult.data);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ 관리자 계정 랭킹 참여 설정 완료!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

main();
