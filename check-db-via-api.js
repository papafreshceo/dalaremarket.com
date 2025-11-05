async function checkSettings() {
  console.log('🔍 API를 통한 ranking_score_settings 확인 중...\n');

  try {
    const response = await fetch('http://localhost:3000/api/admin/ranking-score-settings');
    const data = await response.json();

    if (data.success) {
      console.log('✅ 테이블이 존재하며 데이터가 있습니다:\n');
      console.log(JSON.stringify(data.settings, null, 2));

      const s = data.settings;
      if (s.sales_per_point !== undefined && s.orders_per_point !== undefined) {
        console.log('\n✅ 필요한 컬럼이 모두 존재합니다.');
        console.log(`   - sales_per_point: ${s.sales_per_point} (${s.sales_per_point}원당 1점)`);
        console.log(`   - orders_per_point: ${s.orders_per_point} (1건당 ${s.orders_per_point}점)`);
        console.log(`   - weekly_consecutive_bonus: ${s.weekly_consecutive_bonus}`);
        console.log(`   - monthly_consecutive_bonus: ${s.monthly_consecutive_bonus}`);
        console.log('\n✅ DB 수정이 필요 없습니다. 모든 컬럼이 이미 존재합니다.');
      } else {
        console.log('\n⚠️  필요한 컬럼이 없습니다. 마이그레이션이 필요합니다.');
      }
    } else {
      console.log('❌ 오류:', data.error);
      console.log('\n⚠️  마이그레이션이 필요할 수 있습니다.');
    }
  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
  }
}

checkSettings();
