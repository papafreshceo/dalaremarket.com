const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// 샘플 판매자 프로필 이름 생성 함수
function generateSellerNames(count) {
  const prefixes = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전'];
  const suffixes = ['사장', '대리', '과장', '팀장', '부장', '이사', '본부장', '센터장', '마켓', '상회'];
  const names = [];

  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const number = Math.floor(i / (prefixes.length * suffixes.length)) + 1;

    if (number > 1) {
      names.push(`${prefix}${suffix}${number}`);
    } else {
      names.push(`${prefix}${suffix}`);
    }
  }

  return names;
}

// 회사명 생성 함수
function generateCompanyNames(count) {
  const prefixes = ['신선', '그린', '프레시', '청과', '농산물', '유기농', '친환경', '건강', '자연', '시골'];
  const suffixes = ['푸드', '마켓', '유통', '상회', '농장', '팜', '직송', '센터', '플러스', '코리아'];
  const companies = [];

  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const number = Math.floor(i / (prefixes.length * suffixes.length)) + 1;

    if (number > 1) {
      companies.push(`${prefix}${suffix}${number}`);
    } else {
      companies.push(`${prefix}${suffix}`);
    }
  }

  return companies;
}

const sellerNames = generateSellerNames(100);
const companyNames = generateCompanyNames(100);

// 티어 결정 함수 (절대 기준: 주문 건수 AND 매출 금액)
function getTier(orderCount, totalSales, tierCriteria) {
  // 티어 기준을 매출 금액 기준 내림차순으로 정렬 (높은 등급부터 체크)
  const sortedCriteria = [...tierCriteria].sort((a, b) => b.min_total_sales - a.min_total_sales);

  // 각 티어를 높은 등급부터 확인하여 조건을 만족하는 첫 번째 티어 반환
  for (const criteria of sortedCriteria) {
    // AND 조건: 주문 건수와 매출 금액을 모두 만족해야 함
    if (orderCount >= criteria.min_order_count && totalSales >= criteria.min_total_sales) {
      return criteria.tier;
    }
  }

  // 어떤 기준도 만족하지 못하면 bronze 반환
  return 'bronze';
}

// 랜덤 점수 생성 (정규분포 비슷하게)
function generateScore(min, max, peak) {
  const random1 = Math.random();
  const random2 = Math.random();
  const randomGaussian = (random1 + random2) / 2;
  return min + (max - min) * Math.pow(randomGaussian, peak);
}

async function createRankingData() {
  try {
    console.log('🚀 셀러 랭킹 샘플 데이터 생성 시작...\n');

    // 티어 기준 조회
    console.log('📋 티어 기준 조회 중...');
    const { data: tierCriteria, error: criteriaError } = await supabase
      .from('tier_criteria')
      .select('*')
      .eq('is_active', true);

    if (criteriaError || !tierCriteria || tierCriteria.length === 0) {
      console.error('❌ 티어 기준 조회 실패:', criteriaError?.message);
      console.log('⚠️  기본 티어 기준을 사용합니다.');
      // 기본 티어 기준 사용
      const defaultCriteria = [
        { tier: 'diamond', min_order_count: 500, min_total_sales: 50000000 },
        { tier: 'platinum', min_order_count: 300, min_total_sales: 30000000 },
        { tier: 'gold', min_order_count: 150, min_total_sales: 15000000 },
        { tier: 'silver', min_order_count: 50, min_total_sales: 5000000 },
        { tier: 'bronze', min_order_count: 1, min_total_sales: 1 }
      ];
      var activeTierCriteria = defaultCriteria;
    } else {
      var activeTierCriteria = tierCriteria;
      console.log(`✅ ${tierCriteria.length}개의 티어 기준 로드 완료\n`);
    }

    // 기존 랭킹 데이터 삭제
    console.log('🗑️  기존 랭킹 데이터 삭제 중...');
    await supabase.from('seller_rankings').delete().neq('id', 0);
    console.log('✅ 기존 데이터 삭제 완료\n');

    // 기존 사용자 조회
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('❌ 사용자 조회 실패:', usersError.message);
      return;
    }

    console.log(`👥 ${existingUsers.length}명의 사용자 발견\n`);

    // 필요한 사용자 수
    const targetUserCount = 100;
    let sellerIds = [];

    if (existingUsers.length >= targetUserCount) {
      // 기존 사용자가 충분한 경우
      sellerIds = existingUsers.slice(0, targetUserCount).map(u => u.id);
      console.log(`✅ ${sellerIds.length}개의 기존 셀러 ID 사용\n`);
    } else {
      // 기존 사용자 활용
      sellerIds = existingUsers.map(u => u.id);

      // 부족한 사용자 생성
      const neededCount = targetUserCount - existingUsers.length;
      console.log(`👤 ${neededCount}명의 새 사용자 생성 중...\n`);

      for (let i = existingUsers.length; i < targetUserCount; i++) {
        const email = `seller${i}@dalreamarket.com`;
        const password = 'seller123456';

        try {
          // Supabase Auth를 통한 사용자 생성
          const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
              name: sellerNames[i],
              business_name: companyNames[i]
            }
          });

          if (signUpError) {
            console.error(`   ❌ ${sellerNames[i]} Auth 생성 실패:`, signUpError.message);
            continue;
          }

          if (authData.user) {
            // users 테이블에 레코드 생성
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: email,
                name: sellerNames[i],
                business_name: companyNames[i],
                role: 'customer',
                created_at: new Date().toISOString()
              });

            if (insertError) {
              console.error(`   ❌ ${sellerNames[i]} users 테이블 추가 실패:`, insertError.message);
            } else {
              sellerIds.push(authData.user.id);
              if ((i + 1) % 10 === 0) {
                console.log(`   ✅ ${i + 1}명 생성 완료...`);
              }
            }
          }
        } catch (error) {
          console.error(`   ❌ ${sellerNames[i]} 생성 중 오류:`, error.message);
        }
      }
      console.log(`\n✅ 총 ${sellerIds.length}개의 셀러 ID 준비 완료\n`);
    }

    const userCount = sellerIds.length;
    const actualSellerNames = sellerNames.slice(0, userCount);
    const actualCompanyNames = companyNames.slice(0, userCount);

    // 2025년 11월 월간 랭킹 생성
    const period = {
      type: 'monthly',
      start: '2025-11-01',
      end: '2025-11-30'
    };

    console.log(`📊 ${period.start} ~ ${period.end} 월간 랭킹 생성 중...\n`);

    const rankings = [];

    // 판매자 랭킹 데이터 생성
    for (let i = 0; i < userCount; i++) {
      // 점수 생성 (상위권일수록 높은 점수)
      const basePeakness = 1 - (i / userCount) * 0.5; // 0.5 ~ 1.0

      const salesScore = generateScore(40, 100, basePeakness);
      const orderCountScore = generateScore(40, 100, basePeakness);
      const confirmSpeedScore = generateScore(50, 100, basePeakness);
      const cancelRateScore = generateScore(50, 100, basePeakness);
      const dataQualityScore = generateScore(60, 100, basePeakness);

      // 가중치 적용한 총점 계산
      const totalScore =
        salesScore * 0.3 +
        orderCountScore * 0.2 +
        confirmSpeedScore * 0.2 +
        cancelRateScore * 0.2 +
        dataQualityScore * 0.1;

      // 실제 지표 값 계산
      const totalSales = Math.floor(salesScore * 1000000); // 최대 1억
      const orderCount = Math.floor(orderCountScore * 30); // 최대 3000건
      const avgConfirmHours = 24 - (confirmSpeedScore / 100) * 23; // 1~24시간
      const cancelRate = (100 - cancelRateScore) / 10; // 0~10%
      const dataQualityRate = dataQualityScore; // 60~100%

      // 전월 순위 (랜덤하게 생성)
      const prevRank = i + 1 + Math.floor(Math.random() * 5) - 2; // ±2 변동
      const rankChange = prevRank - (i + 1);

      rankings.push({
        seller_id: sellerIds[i],
        period_type: period.type,
        period_start: period.start,
        period_end: period.end,
        total_sales: totalSales,
        order_count: orderCount,
        avg_confirm_hours: avgConfirmHours,
        cancel_rate: cancelRate,
        data_quality_rate: dataQualityRate,
        sales_score: salesScore,
        order_count_score: orderCountScore,
        confirm_speed_score: confirmSpeedScore,
        cancel_rate_score: cancelRateScore,
        data_quality_score: dataQualityScore,
        total_score: totalScore,
        rank: 0, // 나중에 업데이트
        tier: getTier(orderCount, totalSales, activeTierCriteria), // 절대 기준으로 티어 결정
        prev_rank: prevRank > 0 ? prevRank : null,
        rank_change: rankChange !== 0 ? rankChange : null,
        seller_name: actualSellerNames[i],
        company_name: actualCompanyNames[i]
      });
    }

    // 총점 기준으로 정렬하고 순위 부여
    rankings.sort((a, b) => b.total_score - a.total_score);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    console.log('📝 랭킹 데이터 생성 결과:');
    console.log(`   총 ${rankings.length}명의 판매자`);
    console.log(`   - Diamond: ${rankings.filter(r => r.tier === 'diamond').length}명`);
    console.log(`   - Platinum: ${rankings.filter(r => r.tier === 'platinum').length}명`);
    console.log(`   - Gold: ${rankings.filter(r => r.tier === 'gold').length}명`);
    console.log(`   - Silver: ${rankings.filter(r => r.tier === 'silver').length}명`);
    console.log(`   - Bronze: ${rankings.filter(r => r.tier === 'bronze').length}명\n`);

    // users 테이블 업데이트 (name, company_name 설정)
    console.log('👥 사용자 정보 업데이트 중...');
    for (let i = 0; i < sellerIds.length; i++) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: actualSellerNames[i],
          business_name: actualCompanyNames[i]
        })
        .eq('id', sellerIds[i]);

      if (updateError) {
        console.error(`   ⚠️  ${actualSellerNames[i]} 정보 업데이트 실패:`, updateError.message);
      }
    }
    console.log('   ✅ 사용자 정보 업데이트 완료\n');

    // 데이터베이스에 저장
    console.log('💾 데이터베이스에 저장 중...');

    for (const ranking of rankings) {
      // seller_name과 company_name은 임시 필드이므로 제거
      const { seller_name, company_name, ...rankingData } = ranking;

      const { error: insertError } = await supabase
        .from('seller_rankings')
        .insert(rankingData);

      if (insertError) {
        console.error(`   ❌ ${seller_name} 랭킹 저장 실패:`, insertError.message);
      } else {
        const tierEmoji = {
          diamond: '◆',
          platinum: '◇',
          gold: '●',
          silver: '○',
          bronze: '▪'
        };
        console.log(`   ✅ #${ranking.rank} ${tierEmoji[ranking.tier]} ${seller_name} (${ranking.total_score.toFixed(1)}점)`);
      }
    }

    console.log('\n✅ 랭킹 샘플 데이터 생성 완료!');
    console.log(`📊 총 ${rankings.length}개의 랭킹 레코드가 생성되었습니다.\n`);

    // 생성된 데이터 요약
    console.log('📈 상위 3명:');
    rankings.slice(0, 3).forEach((r, i) => {
      console.log(`   ${i + 1}위: ${r.seller_name} (${r.total_score.toFixed(1)}점) - ${r.tier.toUpperCase()}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createRankingData();
