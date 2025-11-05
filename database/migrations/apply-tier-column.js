const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📝 마이그레이션 시작: users 테이블에 tier 칼럼 추가 및 데이터 채우기...\n');

    // 1. tier 칼럼 추가 (이미 있으면 무시됨)
    console.log('1️⃣ users 테이블에 tier 칼럼 추가 중...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT;'
    });

    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ 칼럼 추가 실패:', alterError);
      // 계속 진행 (이미 있을 수 있음)
    } else {
      console.log('✅ tier 칼럼 추가 완료 (또는 이미 존재)\n');
    }

    // 2. seller_rankings에서 최신 tier 가져오기
    console.log('2️⃣ seller_rankings에서 tier 조회 중...');
    const { data: rankings, error: rankingsError } = await supabase
      .from('seller_rankings')
      .select('seller_id, tier')
      .eq('period_type', 'monthly')
      .order('period_start', { ascending: false });

    if (rankingsError) throw rankingsError;

    // 각 seller의 최신 tier만 추출
    const tierMap = new Map();
    rankings.forEach(r => {
      if (!tierMap.has(r.seller_id)) {
        tierMap.set(r.seller_id, r.tier);
      }
    });

    console.log(`✅ ${tierMap.size}명의 tier 정보 수집 완료\n`);

    if (tierMap.size === 0) {
      console.log('⚠️ seller_rankings에 데이터가 없습니다.');
      console.log('✅ 칼럼 추가만 완료!');
      process.exit(0);
    }

    // 3. users 테이블 업데이트
    console.log('3️⃣ users 테이블에 tier 업데이트 중...');
    let updateCount = 0;
    let errorCount = 0;

    for (const [userId, tier] of tierMap.entries()) {
      const { error } = await supabase
        .from('users')
        .update({ tier })
        .eq('id', userId);

      if (error) {
        console.error(`❌ ${userId}: ${error.message}`);
        errorCount++;
      } else {
        updateCount++;
        if (updateCount % 10 === 0) {
          process.stdout.write(`\r  진행중... ${updateCount}/${tierMap.size}`);
        }
      }
    }

    console.log(`\n✅ ${updateCount}명 업데이트 완료 (실패: ${errorCount}명)\n`);

    console.log('📊 결과 확인 중...\n');

    // 결과 확인
    const { data, error } = await supabase
      .from('users')
      .select('id, name, tier')
      .not('tier', 'is', null)
      .limit(10);

    if (error) {
      console.error('확인 중 오류:', error);
    } else {
      console.log(`🎯 tier가 있는 사용자 샘플 ${data.length}명:`);
      data.forEach(u => {
        console.log(`  - ${u.name}: ${u.tier}`);
      });
    }

    console.log('\n✅ 마이그레이션 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

applyMigration();
