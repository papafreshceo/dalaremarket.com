/**
 * InputTab 주문 등록 테스트
 * 옵션명 기준 자동 매핑 검증
 */

async function testOrderRegistration() {
  console.log('=== InputTab 주문 등록 자동 매핑 테스트 ===\n');

  // 1. 먼저 option_products에서 테스트용 옵션명 가져오기
  console.log('1. 테스트용 옵션 상품 조회...');
  const optionsResponse = await fetch('http://localhost:3000/api/option-products?limit=3');
  const optionsResult = await optionsResponse.json();

  if (!optionsResult.success || !optionsResult.data || optionsResult.data.length === 0) {
    console.error('❌ 옵션 상품이 없습니다. 먼저 옵션 상품을 등록해주세요.');
    return;
  }

  const testOption = optionsResult.data[0];
  console.log('✅ 테스트용 옵션 선택:');
  console.log('   옵션명:', testOption.option_name);
  console.log('   공급단가:', testOption.seller_supply_price);
  console.log('   출고처:', testOption.shipping_entity);
  console.log('   송장처:', testOption.invoice_entity);
  console.log('   벤더명:', testOption.vendor_name);
  console.log('   발송지명:', testOption.shipping_location_name);

  // 2. 주문 등록 요청 (InputTab에서 저장 버튼 클릭과 동일)
  console.log('\n2. 주문 등록 요청...');
  const orderData = {
    market_name: '전화주문',
    order_number: `TEST${Date.now()}`,
    buyer_name: '테스트구매자',
    buyer_phone: '010-1234-5678',
    recipient_name: '테스트수령인',
    recipient_phone: '010-9876-5432',
    recipient_address: '서울시 강남구 테스트로 123',
    option_name: testOption.option_name,  // 옵션명만 전달
    quantity: '2',  // 수량
    shipping_status: '접수',
    sheet_date: new Date().toISOString().split('T')[0],
    registered_by: 'test@example.com'
  };

  const registerResponse = await fetch('http://localhost:3000/api/integrated-orders/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orders: [orderData],
      skipDuplicateCheck: true  // 중복 체크 생략
    }),
  });

  const registerResult = await registerResponse.json();

  if (!registerResult.success) {
    console.error('❌ 주문 등록 실패:', registerResult.error);
    return;
  }

  console.log('✅ 주문 등록 성공!');
  console.log('   등록된 주문 수:', registerResult.newCount);

  if (registerResult.data && registerResult.data.length > 0) {
    const savedOrder = registerResult.data[0];
    console.log('\n3. 저장된 주문 데이터 확인:');
    console.log('   ID:', savedOrder.id);
    console.log('   주문번호:', savedOrder.order_number);
    console.log('   옵션명:', savedOrder.option_name);
    console.log('   수량:', savedOrder.quantity);
    console.log('\n   [자동 매핑된 필드]');
    console.log('   ✓ 공급단가:', savedOrder.seller_supply_price, '(원본:', testOption.seller_supply_price + ')');
    console.log('   ✓ 출고처:', savedOrder.shipping_source, '(원본:', testOption.shipping_entity + ')');
    console.log('   ✓ 송장처:', savedOrder.invoice_issuer, '(원본:', testOption.invoice_entity + ')');
    console.log('   ✓ 벤더명:', savedOrder.vendor_name, '(원본:', testOption.vendor_name + ')');
    console.log('   ✓ 발송지명:', savedOrder.shipping_location_name, '(원본:', testOption.shipping_location_name + ')');
    console.log('   ✓ 발송지주소:', savedOrder.shipping_location_address);
    console.log('   ✓ 발송지연락처:', savedOrder.shipping_location_contact);
    console.log('   ✓ 출고비용:', savedOrder.shipping_cost);
    console.log('   ✓ 정산금액:', savedOrder.settlement_amount, '(계산: 공급단가 × 수량 =', testOption.seller_supply_price, '×', orderData.quantity, '=', (testOption.seller_supply_price || 0) * 2 + ')');

    // 4. 검증
    console.log('\n4. 자동 매핑 검증:');
    let allPassed = true;

    if (savedOrder.seller_supply_price != testOption.seller_supply_price) {
      console.log('   ❌ 공급단가 매핑 실패');
      allPassed = false;
    } else {
      console.log('   ✅ 공급단가 매핑 성공');
    }

    if (savedOrder.shipping_source != testOption.shipping_entity) {
      console.log('   ❌ 출고처 매핑 실패');
      allPassed = false;
    } else {
      console.log('   ✅ 출고처 매핑 성공');
    }

    if (savedOrder.invoice_issuer != testOption.invoice_entity) {
      console.log('   ❌ 송장처 매핑 실패');
      allPassed = false;
    } else {
      console.log('   ✅ 송장처 매핑 성공');
    }

    if (savedOrder.vendor_name != testOption.vendor_name) {
      console.log('   ❌ 벤더명 매핑 실패');
      allPassed = false;
    } else {
      console.log('   ✅ 벤더명 매핑 성공');
    }

    if (savedOrder.shipping_location_name != testOption.shipping_location_name) {
      console.log('   ❌ 발송지명 매핑 실패');
      allPassed = false;
    } else {
      console.log('   ✅ 발송지명 매핑 성공');
    }

    const expectedSettlement = (testOption.seller_supply_price || 0) * parseInt(orderData.quantity);
    if (savedOrder.settlement_amount != expectedSettlement) {
      console.log('   ❌ 정산금액 계산 실패');
      allPassed = false;
    } else {
      console.log('   ✅ 정산금액 계산 성공');
    }

    if (allPassed) {
      console.log('\n🎉 모든 자동 매핑 테스트 통과!');
    } else {
      console.log('\n⚠️ 일부 매핑 실패. 위 로그를 확인하세요.');
    }

    // 5. 테스트 주문 삭제
    console.log('\n5. 테스트 주문 삭제...');
    const deleteResponse = await fetch(`http://localhost:3000/api/integrated-orders?id=${savedOrder.id}`, {
      method: 'DELETE',
    });
    const deleteResult = await deleteResponse.json();
    if (deleteResult.success) {
      console.log('✅ 테스트 주문 삭제 완료');
    }
  }
}

testOrderRegistration().catch(console.error);
