/**
 * 마켓 파일 업로드 흐름 테스트
 *
 * 이 스크립트는 다음을 테스트합니다:
 * 1. 옵션명 매핑이 올바르게 적용되는지
 * 2. 매핑 후 옵션 상품 정보가 조회되는지
 * 3. 공급단가가 올바르게 매핑되는지
 */

async function testMarketUploadFlow() {
  console.log('🧪 마켓 파일 업로드 흐름 테스트 시작\n');

  // 테스트 데이터: 마켓에서 업로드된 주문
  const testOrders = [
    {
      market_name: '쿠팡',
      seller_order_number: 'TEST001',
      option_name: '테스트옵션1',  // 이 옵션명이 매핑되어야 함
      quantity: '1',
      recipient_name: '홍길동',
      recipient_phone: '010-1234-5678',
      recipient_address: '서울시 강남구',
      sheet_date: '2025-10-26',
      payment_date: '2025-10-26',
      shipping_status: '발주서등록',
      is_deleted: false
    }
  ];

  console.log('📝 원본 주문 데이터:');
  console.log(JSON.stringify(testOrders[0], null, 2));
  console.log('');

  try {
    // API 호출
    const response = await fetch('http://localhost:3006/api/platform-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 실제로는 인증 토큰이 필요하지만 테스트용으로는 생략
      },
      body: JSON.stringify({ orders: testOrders })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ API 호출 성공');
      console.log('📊 응답 데이터:', JSON.stringify(result, null, 2));

      if (result.data && result.data[0]) {
        const savedOrder = result.data[0];
        console.log('\n📦 저장된 주문 정보:');
        console.log(`  옵션명: ${savedOrder.option_name}`);
        console.log(`  공급단가: ${savedOrder.seller_supply_price || '❌ 없음'}`);
        console.log(`  정산금액: ${savedOrder.settlement_amount || '❌ 없음'}`);
        console.log(`  출고: ${savedOrder.shipping_source || '❌ 없음'}`);
        console.log(`  송장: ${savedOrder.invoice_issuer || '❌ 없음'}`);
      }
    } else {
      console.error('❌ API 호출 실패:', result.error);
    }
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

// Node.js 환경에서 fetch 사용을 위한 설정
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch를 사용할 수 없습니다. 브라우저 콘솔에서 실행하세요.');
  console.log('\n브라우저 콘솔에서 다음 코드를 실행하세요:');
  console.log('-----------------------------------');
  console.log(testMarketUploadFlow.toString());
  console.log('testMarketUploadFlow();');
  console.log('-----------------------------------');
} else {
  testMarketUploadFlow();
}
