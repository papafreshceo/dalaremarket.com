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
    console.log('📝 마이그레이션 시작: 티어명 변경...\n');

    // 1. seller_rankings 테이블 업데이트
    console.log('1️⃣ seller_rankings 테이블 업데이트 중...');

    const tierMapping = {
      'diamond': 'LEGEND',
      'platinum': 'ELITE',
      'gold': 'ADVANCE',
      'silver': 'STANDARD',
      'bronze': 'LIGHT'
    };

    for (const [oldTier, newTier] of Object.entries(tierMapping)) {
      const { data, error, count } = await supabase
        .from('seller_rankings')
        .update({ tier: newTier })
        .eq('tier', oldTier)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ ${oldTier} → ${newTier} 업데이트 실패:`, error.message);
      } else {
        console.log(`✅ ${oldTier} → ${newTier}: ${count || 0}건 업데이트`);
      }
    }

    // 2. tier_criteria 테이블 업데이트 (있다면)
    console.log('\n2️⃣ tier_criteria 테이블 업데이트 중...');

    for (const [oldTier, newTier] of Object.entries(tierMapping)) {
      const { data, error, count } = await supabase
        .from('tier_criteria')
        .update({ tier: newTier })
        .eq('tier', oldTier)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`⚠️ tier_criteria.${oldTier} 업데이트 스킵 (테이블 없음 또는 에러)`);
      } else {
        console.log(`✅ ${oldTier} → ${newTier}: ${count || 0}건 업데이트`);
      }
    }

    // 결과 확인
    console.log('\n📊 결과 확인 중...\n');

    const { data: rankings, error: rankingsError } = await supabase
      .from('seller_rankings')
      .select('tier')
      .limit(100);

    if (rankingsError) {
      console.error('확인 중 오류:', rankingsError);
    } else {
      const tierCounts = rankings.reduce((acc, r) => {
        acc[r.tier] = (acc[r.tier] || 0) + 1;
        return acc;
      }, {});

      console.log('🎯 seller_rankings 티어 분포:');
      Object.entries(tierCounts).forEach(([tier, count]) => {
        console.log(`  - ${tier}: ${count}건`);
      });
    }

    // tier_criteria 확인
    const { data: criteria, error: criteriaError } = await supabase
      .from('tier_criteria')
      .select('tier, min_order_count, min_total_sales')
      .order('tier');

    if (criteriaError) {
      console.error('tier_criteria 확인 중 오류:', criteriaError);
    } else {
      console.log('\n🎯 tier_criteria 티어 목록:');
      criteria.forEach((c) => {
        console.log(`  - ${c.tier}: ${c.min_order_count}건 + ${c.min_total_sales}원`);
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
