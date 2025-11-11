/**
 * 모든 사용자 등급 일괄 업데이트 스크립트
 *
 * 매월 1일 한국시간(KST) 00:00에 실행하여 실적방식(3개월 누적) 기준으로
 * 모든 셀러의 등급을 재계산합니다.
 *
 * 기여점수방식은 실시간으로 업데이트되므로 이 스크립트에서는
 * 주로 실적방식 기준 강등을 처리합니다.
 *
 * Cron 설정 예시 (한국 시간 기준):
 * 0 0 1 * * cd /path/to/project && npx ts-node scripts/update-all-user-tiers.ts
 *
 * 수동 실행 방법:
 * npx ts-node scripts/update-all-user-tiers.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAllUserTiers() {
  console.log('\n🔄 모든 사용자 등급 업데이트 시작...\n');

  try {
    // 모든 셀러 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, tier')
      .eq('role', 'seller');

    if (usersError) {
      console.error('❌ 사용자 조회 실패:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  셀러 사용자가 없습니다.');
      return;
    }

    console.log(`📊 총 ${users.length}명의 셀러 등급 재계산 중...\n`);

    let upgradeCount = 0;
    let downgradeCount = 0;
    let noChangeCount = 0;
    let errorCount = 0;

    // 각 사용자의 등급 재계산
    for (const user of users) {
      try {
        const { data: result, error } = await supabase.rpc('calculate_and_update_user_tier', {
          p_user_id: user.id
        });

        if (error) {
          console.error(`   ❌ ${user.name} (${user.email}): 오류 -`, error.message);
          errorCount++;
          continue;
        }

        const resultStr = result as string;

        if (resultStr.startsWith('UPGRADED:')) {
          const [from, to] = resultStr.replace('UPGRADED:', '').split('->');
          console.log(`   ✅ ${user.name}: ${from} → ${to} (승급)`);
          upgradeCount++;
        } else if (resultStr.startsWith('DOWNGRADED:')) {
          const [from, to] = resultStr.replace('DOWNGRADED:', '').split('->');
          console.log(`   ⚠️  ${user.name}: ${from} → ${to} (강등)`);
          downgradeCount++;
        } else if (resultStr.startsWith('NO_CHANGE:')) {
          const tier = resultStr.replace('NO_CHANGE:', '');
          noChangeCount++;
          // 변경 없는 경우는 로그 생략
        } else {
          console.error(`   ❌ ${user.name}: 알 수 없는 결과 - ${resultStr}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`   ❌ ${user.name} (${user.email}): 처리 중 오류 -`, error);
        errorCount++;
      }
    }

    console.log('\n📊 업데이트 결과:');
    console.log(`   ✅ 승급: ${upgradeCount}명`);
    console.log(`   ⚠️  강등: ${downgradeCount}명`);
    console.log(`   ➖ 변경 없음: ${noChangeCount}명`);
    console.log(`   ❌ 오류: ${errorCount}명`);
    console.log(`\n✅ 총 ${users.length}명 처리 완료`);

  } catch (error) {
    console.error('\n❌ 스크립트 실행 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
updateAllUserTiers();
