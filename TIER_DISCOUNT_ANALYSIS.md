# 티어 할인율 중복 적용 분석

## 📋 발견 사항

### 1. 티어 할인율 조회 로직

**파일**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 196-239)

```typescript
// 조직의 tier와 할인율 조회
useEffect(() => {
  const fetchDiscountRate = async () => {
    if (!organizationTier) {
      return;
    }

    const tier = organizationTier.toUpperCase();

    try {
      console.log('🔍 티어 할인율 조회 시작:', { tier });

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // tier_criteria에서 할인율 조회
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('tier_criteria')
        .select('discount_rate, description')
        .eq('tier', tier)
        .single();

      if (criteriaError || !criteriaData) {
        console.error('❌ 티어 할인율 조회 실패:', criteriaError);
        setDiscountRate(null);
        return;
      }

      const rate = Number(criteriaData.discount_rate) || 0;
      setDiscountRate(rate);
      console.log('✅ 티어 할인율 설정 완료:', { tier, rate, description: criteriaData.description });
    } catch (error) {
      console.error('티어 할인율 조회 오류:', error);
      setDiscountRate(null);
    }
  };

  fetchDiscountRate();
}, [organizationTier, organizationName]);
```

→ ✅ 티어 할인율을 조회해서 `discountRate` state에 저장

---

### 2. 초기 공급가 계산 (업로드 시)

**파일**: `src/lib/order-utils.ts` (line 89-103)

```typescript
// 정산금액 = 공급단가 × 수량
let settlement_amount: number | undefined;
const supplyPrice = optionInfo.seller_supply_price;
if (supplyPrice && order.quantity) {
  const unitPrice = typeof supplyPrice === 'string'
    ? parseFloat(supplyPrice)
    : supplyPrice;
  const qty = typeof order.quantity === 'string'
    ? parseInt(order.quantity)
    : order.quantity;

  if (!isNaN(unitPrice) && !isNaN(qty)) {
    settlement_amount = unitPrice * qty;  // ❌ 할인율 적용 안됨
  }
}
```

**결론**:
- 초기 업로드 시 `settlement_amount = 공급단가 × 수량`
- ❌ **티어 할인율이 적용되지 않음**

---

### 3. 최종 입금액 계산 (발주확정 시)

**파일**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 581-608)

```typescript
for (let i = 0; i < filteredOrders.length; i++) {
  const order = filteredOrders[i];
  const orderNo = generateOrderNumber(userEmail, i + 1);
  const supplyPrice = settlementMap.get(order.id) || 0;  // DB에서 가져온 settlement_amount
  const orderCashUsed = cashPerOrderList[i];
  const finalPaymentAmount = supplyPrice - orderCashUsed;  // 공급가 - 캐시

  const { error } = await supabase
    .from('integrated_orders')
    .update({
      shipping_status: '발주서확정',
      order_number: orderNo,
      confirmed_at: now,
      organization_id: organizationId,
      final_deposit_amount: Math.round(finalPaymentAmount), // settlement_amount - cash_used
      cash_used: orderCashUsed,
      depositor_name: finalDepositorName,
    })
    .eq('id', order.id);
}
```

**결론**:
- `final_deposit_amount = settlement_amount - cash_used`
- ❌ **티어 할인율이 적용되지 않음**

---

## 🔍 분석 결과

### 현재 시스템의 가격 계산 흐름

```
1. 업로드 시:
   settlement_amount = 공급단가 × 수량

2. 발주확정 시:
   final_deposit_amount = settlement_amount - 캐시사용액
```

### 문제점

**❌ 티어 할인율이 어디에도 적용되지 않음!**

현재 코드에서 티어 할인율(`discountRate`)을 조회는 하지만, 실제로 가격 계산에 사용하는 곳을 찾을 수 없습니다.

---

## 🤔 추가 확인 필요 사항

### 사용자님께 질문

1. **어디에서 티어 할인율이 2번 적용되는 것을 확인하셨나요?**
   - 발주서등록 탭의 테이블?
   - 관리자 페이지?
   - 정산 금액 계산 과정?
   - 최종 입금액?

2. **구체적인 예시를 주실 수 있나요?**
   - 공급단가: 1,000원
   - 수량: 10개
   - 티어: VIP (할인율 5%)
   - 예상 금액: ?
   - 실제 표시 금액: ?

3. **할인이 적용되는 단계는?**
   - 업로드 직후?
   - 공급가 갱신 버튼 클릭 후?
   - 발주확정 후?

---

## 💡 예상 가능한 시나리오

### 시나리오 1: 프론트엔드에서 할인 표시만

`discountRate`가 UI에서 할인된 금액을 **표시만** 하고 있을 가능성:
- settlement_amount: 10,000원 (원래 가격)
- 화면 표시: 9,500원 (할인 5% 적용)
- 실제 DB 저장: 10,000원

→ 이 경우 할인이 실제로는 적용 안됨

### 시나리오 2: 공급가 자체에 이미 할인 반영

`option_products.seller_supply_price`에 이미 티어별 할인가가 저장되어 있고,
거기에 또 할인율을 적용하면 이중 할인:
- seller_supply_price: 950원 (이미 5% 할인된 가격)
- settlement_amount: 950 × 수량
- 화면에서 다시 5% 할인 표시: 902.5원

### 시나리오 3: DB 트리거나 함수에서 적용

PostgreSQL 트리거나 함수에서 자동으로 할인을 적용하고 있을 가능성

---

## 🔧 다음 단계

정확한 분석을 위해 다음 정보가 필요합니다:

1. **스크린샷**: 할인이 2번 적용되는 화면
2. **주문 ID**: 문제가 있는 실제 주문의 ID
3. **DB 데이터**: 해당 주문의 실제 DB 값
   - `settlement_amount`
   - `final_deposit_amount`
   - `cash_used`
   - `seller_supply_price`

위 정보를 주시면 정확한 원인을 파악하고 수정하겠습니다.

---

*분석 일시: 2025-01-19*
*분석 대상: 티어 할인율 적용 로직*
