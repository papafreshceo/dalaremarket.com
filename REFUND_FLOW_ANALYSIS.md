# 환불 로직 흐름 분석

## 📋 요약

**환불은 오직 관리자가 "환불완료" 버튼을 클릭할 때만 실행됩니다.**

- ❌ 취소요청 단계: 환불 없음
- ❌ 취소승인 단계: 환불 없음
- ✅ 환불완료 버튼: 환불 실행

---

## 🔄 전체 주문 취소 & 환불 흐름

```
조직(셀러) 취소 요청
    ↓
[취소요청] 상태
    ↓
관리자: "승인" 버튼 클릭
    ↓
[취소완료] 상태 (⚠️ 아직 환불 안됨!)
    ↓
관리자: "환불완료" 버튼 클릭
    ↓
✅ 캐시 환불 실행 (실제 환불 발생!)
    ↓
[환불완료] 상태
```

---

## 📍 각 단계별 상세 분석

### 1️⃣ 취소요청 단계 (`shipping_status: '취소요청'`)

**파일**: `src/app/admin/order-platform/page.tsx` (line 2040-2122)

**관리자 액션**:
- **승인 버튼** (line 2043-2081):
  ```typescript
  // 주문 상태만 변경
  shipping_status: '취소완료'
  canceled_at: new Date().toISOString()

  // ❌ 환불 API 호출 없음
  // ❌ 캐시 변동 없음
  ```

- **반려 버튼** (line 2082-2120):
  ```typescript
  // 주문 상태를 이전 단계로 복원
  shipping_status: '상품준비중'

  // ❌ 환불 없음
  ```

**결론**: 이 단계에서는 **환불이 전혀 일어나지 않습니다**.

---

### 2️⃣ 취소완료 단계 (`shipping_status: '취소완료'`)

**파일**: `src/app/admin/order-platform/page.tsx` (line 2123-2266)

**관리자 액션**:
- **환불완료 버튼** (line 2125-2264):

  **⚠️ 이것이 실제 환불이 일어나는 유일한 지점입니다!**

  ```typescript
  // 1. 캐시 환불 API 호출 (line 2148)
  POST /api/cash/refund
  {
    organizationId: order.organization_id,
    amount: cashUsed,  // 사용된 캐시 금액
    orderId: order.id,
    orderNumber: order.order_number
  }

  // 2. 환불 정산 기록 저장 (line 2181)
  POST /api/refund-settlements
  {
    orderId: order.id
  }

  // 3. 주문 상태 업데이트 (line 2206)
  shipping_status: '환불완료'
  refund_processed_at: new Date().toISOString()
  ```

**처리 순서**:
1. 중복 환불 체크 (`order.refund_processed_at` 확인)
2. 사용된 캐시가 있으면 `/api/cash/refund` 호출
3. 환불 정산 데이터 `/api/refund-settlements`에 저장
4. 주문 상태를 '환불완료'로 변경

**결론**: **오직 이 단계에서만 환불이 실행됩니다**.

---

### 3️⃣ 환불완료 단계 (`shipping_status: '환불완료'`)

**상태**: 환불 처리 완료
- `refund_processed_at` 타임스탬프가 기록됨
- 버튼 비활성화: "환불완료됨" (회색)
- 더 이상 액션 불가

---

## 🔐 중복 환불 방지 시스템 (3중 보안)

### Layer 1: UI 레벨 (즉시 차단)
```typescript
// 이미 환불완료된 주문인지 체크
if (order.refund_processed_at) {
  toast.error('이미 환불 처리된 주문입니다.');
  return;
}

// 버튼 비활성화
disabled={!!order.refund_processed_at}
```

### Layer 2: API 레벨 (서버 검증)
**파일**: `src/app/api/cash/refund/route.ts` (line 42-75)

```typescript
// refund_settlements 테이블에서 기존 환불 이력 조회
const { data: existingRefund } = await supabase
  .from('refund_settlements')
  .select('id, refund_processed_at, cash_refund_amount')
  .eq('order_id', orderId)
  .single();

if (existingRefund) {
  logger.warn('⚠️  중복 환불 시도 감지');
  return NextResponse.json({
    success: false,
    error: '이미 환불 처리된 주문입니다.',
    alreadyRefunded: true
  }, { status: 409 });  // 409 Conflict
}
```

### Layer 3: DB 레벨 (데이터 무결성)
**파일**: `database/migrations/081_add_unique_constraint_to_refund_settlements.sql`

```sql
ALTER TABLE refund_settlements
ADD CONSTRAINT refund_settlements_order_id_key UNIQUE (order_id);
```

→ 동일 order_id로 두 번째 환불 시도 시 PostgreSQL이 자동으로 차단

---

## 💡 핵심 포인트

1. **환불은 자동이 아닙니다**
   - 관리자가 수동으로 "환불완료" 버튼을 클릭해야 함
   - 취소승인 시 자동으로 환불되지 않음

2. **2단계 프로세스**
   - 1단계: 취소승인 (취소요청 → 취소완료)
   - 2단계: 환불처리 (취소완료 → 환불완료) ← 여기서 환불 발생

3. **캐시 환불 조건**
   - `cash_used > 0` 일 때만 환불 API 호출
   - `cash_used === 0` 이면 환불 API 생략하고 상태만 변경

4. **환불 대상**
   - 조직(Organization)의 캐시 잔액에 환불
   - `organization_cash` 테이블의 `balance` 증가
   - `organization_cash_transactions` 테이블에 거래 기록

---

## 🛠️ API 엔드포인트

### POST /api/cash/refund
- **용도**: 조직 캐시 환불 처리
- **권한**: 관리자만 (super_admin, admin, employee)
- **주요 로직**:
  - 중복 환불 체크
  - `organization_cash.balance` 증가
  - `organization_cash_transactions` 거래 기록 추가
- **파일**: `src/app/api/cash/refund/route.ts`

### POST /api/refund-settlements
- **용도**: 환불 정산 데이터 저장
- **테이블**: `refund_settlements`
- **제약조건**: `order_id` UNIQUE (중복 방지)
- **파일**: `src/app/api/refund-settlements/route.ts`

### PUT /api/integrated-orders/bulk
- **용도**: 주문 상태 일괄 업데이트
- **사용 케이스**:
  - 취소승인: `취소요청` → `취소완료`
  - 환불완료: `취소완료` → `환불완료`

---

## 📊 데이터베이스 테이블

### `integrated_orders`
```sql
id                    -- 주문 ID
shipping_status       -- 주문 상태 (취소요청/취소완료/환불완료)
cash_used            -- 사용된 캐시 금액
canceled_at          -- 취소 승인 시각
refund_processed_at  -- 환불 완료 시각
organization_id      -- 조직 ID
```

### `refund_settlements`
```sql
id                      -- 환불 ID
order_id               -- 주문 ID (UNIQUE)
cash_refund_amount     -- 환불된 캐시 금액
refund_processed_at    -- 환불 처리 시각
created_at             -- 레코드 생성 시각
```

### `organization_cash`
```sql
organization_id  -- 조직 ID (PK)
balance         -- 현재 캐시 잔액
```

### `organization_cash_transactions`
```sql
organization_id   -- 조직 ID
type             -- 거래 타입 ('refund')
amount           -- 거래 금액
balance_after    -- 거래 후 잔액
description      -- 거래 설명
transaction_by   -- 처리한 관리자 ID
created_at       -- 거래 시각
```

---

## ✅ 결론

**질문에 대한 답변:**

❌ **조직이 취소요청 단계에서 환불로직이 작동하는가?**
→ 아니오. 취소요청 단계에서는 환불이 일어나지 않습니다.

❌ **관리자가 취소승인 단계에서 환불이 일어나는가?**
→ 아니오. 취소승인은 단순히 `취소요청` → `취소완료` 상태 변경만 합니다.

✅ **환불이 일어나는 액션은?**
→ **관리자가 "환불완료" 버튼을 클릭할 때만** 환불이 실행됩니다.
→ 위치: `src/app/admin/order-platform/page.tsx` line 2123-2266

---

*분석 완료 일시: 2025-01-19*
*분석 대상 파일: src/app/admin/order-platform/page.tsx*
