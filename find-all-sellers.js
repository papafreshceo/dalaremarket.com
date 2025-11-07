/**
 * 모든 셀러 회원 조회
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
  console.log('모든 회원 조회 중...\n');

  try {
    // 1. 전체 회원 수 조회
    const countOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/users?select=count',
      method: 'HEAD',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    };

    const countResult = await httpsRequest(countOptions);
    console.log('응답 헤더:', countResult);

    // 2. role별 회원 조회
    const rolesOptions = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/users?select=id,email,name,role&order=created_at.desc&limit=100',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const rolesResult = await httpsRequest(rolesOptions);

    if (rolesResult.status !== 200) {
      console.error('❌ 회원 조회 실패:', rolesResult.data);
      return;
    }

    const users = rolesResult.data;
    console.log(`\n총 ${users.length}명 조회됨\n`);

    // role별 집계
    const roleCount = {};
    users.forEach(u => {
      const role = u.role || 'null';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    console.log('Role별 분포:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}명`);
    });

    // 3. seller 회원들 상세 조회
    const sellers = users.filter(u => u.role === 'seller');
    console.log(`\n\nSeller 회원 목록 (${sellers.length}명):`);
    sellers.slice(0, 20).forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} (${u.name || 'Unknown'})`);
    });

    if (sellers.length > 20) {
      console.log(`  ... 외 ${sellers.length - 20}명`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
