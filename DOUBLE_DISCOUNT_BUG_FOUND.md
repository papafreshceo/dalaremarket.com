# 🐛 티어 할인율 중복 적용 버그 발견!

## 문제 요약

**티어 할인율이 2번 적용되어 실제보다 더 큰 할인이 발생하고 있습니다.**

---

## 🔍 버그 발생 과정

### 1단계: 공급가 갱신 버튼 클릭

**파일**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 366-383)

```typescript
// 공급가 갱신 핸들러 내부
const newSupplyPrice = newUnitPrice * quantity;  // 원공급가 = 단가 × 수량

// ✅ 1차 할인 적용 (정상)
const discountAmount = Math.floor((newSupplyPrice * discountRate / 100) / 10) * 10;
const finalSupplyPrice = newSupplyPrice - discountAmount;

// DB에 할인 적용된 금액 저장
const { error: updateError } = await supabase
  .from('integrated_orders')
  .update({
    seller_supply_price: newUnitPrice.toString(),      // 원래 단가
    settlement_amount: finalSupplyPrice.toString(),   // ← 할인 적용된 금액!
    price_updated_at: now
  })
  .eq('id', order.id);
```

**예시**:
- 단가: 1,000원
- 수량: 10개
- 티어: VIP (할인율 5%)
- `newSupplyPrice` = 1,000 × 10 = **10,000원**
- `discountAmount` = 10,000 × 5% = **500원**
- `finalSupplyPrice` = 10,000 - 500 = **9,500원**
- **DB 저장**: `settlement_amount` = 9,500원 ✅ (1차 할인 적용됨)

---

### 2단계: UI에서 주문 요약 표시

**파일**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 2312-2334)

```typescript
// 주문건수 및 공급가 합계 계산
const orderSummary = useMemo(() => {
  const count = filteredOrders.length;

  // 원래 공급가 합계 (할인 전) ← ❌ 문제: 이미 할인된 금액인데 "할인 전"으로 착각!
  const totalSupplyPrice = filteredOrders.reduce((sum, order) => {
    const price = parseFloat(order.supplyPrice || '0');  // ← settlement_amount (이미 할인됨!)
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  // ❌ 2차 할인 적용 (버그!)
  const discountAmount = discountRate !== null && discountRate > 0
    ? Math.floor((totalSupplyPrice * discountRate / 100) / 10) * 10
    : 0;

  // 할인 후 공급가 = 원래 공급가 - 절사된 할인금액
  const discountedTotalSupplyPrice = totalSupplyPrice - discountAmount;  // ← 이중 할인!

  return {
    count,
    totalSupplyPrice,           // ← 실제로는 이미 할인된 금액
    discountAmount,             // ← 이미 할인된 금액에 또 할인율 적용!
    discountedTotalSupplyPrice  // ← 이중 할인된 금액
  };
}, [filteredOrders, discountRate]);
```

**예시 계속**:
- DB에서 가져온 `settlement_amount` = 9,500원 (이미 5% 할인됨)
- UI가 이를 "할인 전 금액"으로 착각: `totalSupplyPrice` = **9,500원**
- UI가 다시 할인 적용: `discountAmount` = 9,500 × 5% = **475원**
- UI 표시: "등급할인적용 -475원"
- 최종 표시 금액: 9,500 - 475 = **9,025원**

**실제 원래 금액**: 10,000원
**1차 할인 후 (정상)**: 9,500원
**2차 할인 후 (버그)**: 9,025원
**초과 할인액**: **475원** ❌

---

## 📊 버그의 영향

### 화면 표시

```
공급가 합계: 9,500원  ← 실제로는 이미 할인된 금액인데 "원래 금액"으로 표시
  ↓
등급할인적용 (VIP 5%): -475원  ← 이미 할인된 금액에 또 할인!
  ↓
할인 후 금액: 9,025원  ← 이중 할인된 잘못된 금액
```

### 실제 상황

```
원공급가: 10,000원
  ↓
1차 할인 (DB 저장): -500원 (5%)
  ↓
settlement_amount: 9,500원  ← 정상
  ↓
2차 할인 (UI 표시): -475원 (5%)  ← 버그!
  ↓
화면 표시: 9,025원  ← 실제보다 475원 더 할인
```

---

## 🔧 수정 방법

### 방법 1: UI에서 할인 표시 제거 (간단)

`settlement_amount`에 이미 할인이 적용되어 있으므로, UI에서 다시 할인을 계산하지 않음.

**수정 위치**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 2312-2334)

```typescript
const orderSummary = useMemo(() => {
  const count = filteredOrders.length;

  // settlement_amount는 이미 할인이 적용된 금액
  const discountedTotalSupplyPrice = filteredOrders.reduce((sum, order) => {
    const price = parseFloat(order.supplyPrice || '0');
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  return {
    count,
    totalSupplyPrice: discountedTotalSupplyPrice,     // 할인된 금액
    discountAmount: 0,                                // 할인 없음 (이미 적용됨)
    discountedTotalSupplyPrice                        // 할인된 금액
  };
}, [filteredOrders]);
```

**장점**: 간단, 빠름
**단점**: 화면에 할인 금액이 표시되지 않음

---

### 방법 2: 원공급가 별도 저장 (정확)

DB에 원공급가를 별도로 저장하고, UI에서 정확한 할인 금액 표시.

1. **DB 칼럼 추가**: `original_settlement_amount` (할인 전 금액)
2. **공급가 갱신 시 저장**:
```typescript
.update({
  seller_supply_price: newUnitPrice.toString(),
  original_settlement_amount: newSupplyPrice.toString(),  // 원공급가
  settlement_amount: finalSupplyPrice.toString(),         // 할인 후 공급가
  price_updated_at: now
})
```

3. **UI 계산**:
```typescript
const originalTotalSupplyPrice = filteredOrders.reduce((sum, order) => {
  const price = parseFloat(order.originalSettlementAmount || order.supplyPrice || '0');
  return sum + (isNaN(price) ? 0 : price);
}, 0);

const discountedTotalSupplyPrice = filteredOrders.reduce((sum, order) => {
  const price = parseFloat(order.supplyPrice || '0');
  return sum + (isNaN(price) ? 0 : price);
}, 0);

const discountAmount = originalTotalSupplyPrice - discountedTotalSupplyPrice;
```

**장점**: 정확한 할인 금액 표시 가능
**단점**: DB 마이그레이션 필요

---

### 방법 3: 할인 전 금액 역계산 (중간)

저장된 할인 후 금액에서 역으로 원금액을 계산.

```typescript
const discountedTotalSupplyPrice = filteredOrders.reduce((sum, order) => {
  const price = parseFloat(order.supplyPrice || '0');
  return sum + (isNaN(price) ? 0 : price);
}, 0);

// 역계산: 할인된금액 = 원금액 × (1 - 할인율)
// → 원금액 = 할인된금액 / (1 - 할인율)
const originalTotalSupplyPrice = discountRate > 0
  ? Math.round(discountedTotalSupplyPrice / (1 - discountRate / 100))
  : discountedTotalSupplyPrice;

const discountAmount = originalTotalSupplyPrice - discountedTotalSupplyPrice;
```

**장점**: DB 변경 불필요
**단점**: 반올림 오차 가능

---

## 💡 권장 사항

**방법 1 (UI에서 할인 표시 제거)** 또는 **방법 2 (원공급가 별도 저장)**을 추천합니다.

가장 간단한 방법 1로 먼저 수정하고, 나중에 필요하면 방법 2로 개선하는 것이 좋습니다.

---

*버그 발견 일시: 2025-01-19*
*심각도: 중간 - 화면 표시 오류, 실제 결제에는 영향 없음 (settlement_amount 사용)*
