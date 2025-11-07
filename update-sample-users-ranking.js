/**
 * 샘플 회원들을 랭킹 참여 상태로 설정
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.l_1g7s-bcPoAbZtxm1vR7YlRuwGjCvdt-MoCE0wfWvI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('샘플 회원들 랭킹 참여 상태로 설정 중...\n');

  try {
    // 1. 샘플 회원들 조회 (이메일에 'sample' 포함 또는 role이 'seller'인 회원)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .or('email.ilike.%sample%,email.ilike.%test%');

    if (usersError) {
      console.error('❌ 샘플 회원 조회 실패:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  샘플 회원이 없습니다.');
      return;
    }

    console.log(`✅ ${users.length}명의 샘플 회원 발견:`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.name || 'Unknown'})`);
    });

    console.log('\n랭킹 참여 상태로 업데이트 중...\n');

    // 2. 각 샘플 회원의 ranking_participation 업데이트
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const { error: updateError } = await supabase
        .from('ranking_participation')
        .upsert({
          seller_id: user.id,
          is_participating: true,
          show_score: true,
          show_sales_performance: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'seller_id'
        });

      if (updateError) {
        console.error(`   ❌ ${user.email} 업데이트 실패:`, updateError.message);
        errorCount++;
      } else {
        console.log(`   ✅ ${user.email} 업데이트 완료`);
        successCount++;
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
