# 취소 사유(Cancel Reason) 저장 분석

## 📋 요약

**결론**: ✅ 취소 사유는 DB에 정상적으로 저장되고 있습니다.

---

## 🗄️ 데이터베이스 스키마

### `integrated_orders` 테이블

**파일**: `database/migrations/016_add_soft_delete_and_cancel_flags.sql`

```sql
-- 취소 관련 칼럼
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS is_canceled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;  -- ✅ 취소 사유 저장 칼럼

COMMENT ON COLUMN integrated_orders.cancel_reason IS '취소 사유';
```

**칼럼 정보**:
- **이름**: `cancel_reason`
- **타입**: `TEXT` (길이 제한 없음)
- **용도**: 조직(셀러)이 취소 요청 시 입력한 사유 저장

---

## 💾 저장 로직

### 일괄 취소요청 핸들러

**파일**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 900-998)

**처리 흐름**:

1. **모달 표시** (line 907-915):
```typescript
// 취소 사유 입력 모달 표시
setModalState({
  type: 'prompt',
  title: '취소 사유 입력',
  message: '취소 사유를 입력해주세요:',
  inputValue: '',
  showInput: true,
  confirmText: '취소요청',
  cancelText: '취소',
  onConfirm: async () => {
    // ...
  }
});
```

2. **사유 입력 검증** (line 917-933):
```typescript
// DOM에서 직접 input 값 가져오기
const inputElement = document.getElementById('modal-prompt-input') as HTMLInputElement;
const inputValue = inputElement?.value?.trim() || '';

if (!inputValue) {
  // 입력이 없으면 경고 toast 표시
  toast.error('취소 사유를 입력해주세요.', {
    duration: 3000,
    position: 'top-center',
    style: {
      marginTop: 'calc(50vh - 50px)',
      fontSize: '14px',
      padding: '12px 24px',
    }
  });
  return;  // ❌ 사유 미입력 시 취소요청 차단
}
```

3. **DB 저장** (line 943-950):
```typescript
const { error } = await supabase
  .from('integrated_orders')
  .update({
    shipping_status: '취소요청',
    cancel_requested_at: getCurrentTimeUTC(),
    cancel_reason: inputValue  // ✅ 사유 저장
  })
  .in('id', selectedOrders);
```

**중요 사항**:
- ✅ 취소 사유는 **필수 입력** (입력하지 않으면 취소요청 불가)
- ✅ DB에 `cancel_reason` 칼럼으로 저장됨
- ✅ 선택한 모든 주문에 동일한 사유 저장

---

## 📊 조회 및 표시

### API 조회

**파일**: `src/app/api/platform-orders/route.ts` (line 147-150)

```typescript
const { data, error } = await supabase
  .from('integrated_orders')
  .select('*')  // ✅ 모든 칼럼 조회 (cancel_reason 포함)
  .eq('is_deleted', false)
  .eq('organization_id', organizationId)
```

### 프론트엔드 매핑

**파일**: `src/app/platform/orders/page.tsx` (line 607-642)

```typescript
// integrated_orders 데이터를 Order 타입으로 변환
const convertedOrders: Order[] = (data || []).map((order: any) => ({
  id: order.id,
  orderNo: order.order_number,
  // ... 기타 필드들
  cancelRequestedAt: order.cancel_requested_at,
  cancelledAt: order.canceled_at,
  cancelReason: order.cancel_reason,  // ✅ 취소 사유 매핑
  // ... 기타 필드들
}));
```

### UI 표시 - 취소완료 탭

**파일**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 1724-1758)

```typescript
if (filterStatus === 'cancelled') {
  // 취소완료 상태: 취소승인 -> 취소요청 -> 취소사유 순서
  const cols = [
    {
      key: 'cancelledAt',
      title: '취소승인',
      width: 160,
      readOnly: true,
      align: 'center' as const,
      renderer: dateRenderer
    },
    {
      key: 'accountName',
      title: '계정',
      width: 120,
      readOnly: true,
      align: 'center' as const,
      renderer: (value: any, row: Order) => (
        <span style={{ fontSize: '13px' }}>{getAccountName(row.subAccountId)}</span>
      )
    },
    {
      key: 'cancelRequestedAt',
      title: '취소요청',
      width: 160,
      readOnly: true,
      align: 'center' as const,
      renderer: dateRenderer
    },
    {
      key: 'cancelReason',      // ✅ 취소사유 칼럼
      title: '취소사유',
      readOnly: true,
      align: 'left' as const
    },
    // ... 기타 칼럼들
  ];
}
```

**표시 위치**:
- 조직 주문 페이지 → 발주서등록 탭 → 취소완료 필터
- 칼럼 순서: 취소승인일 → 계정 → 취소요청일 → **취소사유** → 발주번호 → ...

### UI 표시 - 환불완료 탭

**파일**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 1854-1920)

취소사유는 환불완료 탭에도 동일하게 표시됩니다:
- 칼럼 순서: 환불일 → 환불금액 → 취소승인 → 취소요청 → **취소사유** → ...

---

## ⚠️ 발견된 이슈

### 단일 주문 취소 시 사유 미저장

**파일**: `src/app/platform/orders/components/OrderRegistrationTab.tsx` (line 862-898)

```typescript
// 취소요청 핸들러 (단일 주문용 - 현재 미사용)
const handleCancelRequest = async (orderId: number) => {
  showModal(
    'confirm',
    '취소 요청',
    '이 주문의 취소를 요청하시겠습니까?',
    async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { error } = await supabase
          .from('integrated_orders')
          .update({
            shipping_status: '취소요청',
            cancel_requested_at: getCurrentTimeUTC()
            // ❌ cancel_reason 없음!
          })
          .eq('id', orderId);

        // ... 에러 처리
      } catch (error) {
        // ... 에러 처리
      }
    }
  );
};
```

**문제점**:
- 이 함수는 **단일 주문 취소용**으로 정의되어 있음
- ❌ 취소 사유 입력 없이 바로 취소요청 처리
- ❌ `cancel_reason` 저장 안함

**현재 상태**:
- ✅ 이 함수는 **현재 UI에서 호출되지 않음** (미사용 코드)
- ✅ 실제로는 **일괄 취소요청 버튼**만 UI에 존재함
- ✅ 따라서 현재 시스템에서는 **모든 취소요청에 사유가 입력됨**

**UI 확인**:
```typescript
// 일괄 취소요청 버튼 (발주서확정, 상품준비중 단계)
// line 3274-3305
{(filterStatus === 'confirmed' || filterStatus === 'preparing') && (
  <div className="mb-3 flex justify-start">
    <button
      onClick={handleBatchCancelRequest}  // ✅ 일괄 취소만 가능
      disabled={selectedOrders.length === 0}
      // ... 스타일
    >
      취소요청 ({selectedOrders.length})
    </button>
  </div>
)}
```

→ **단일 주문 취소 버튼이 UI에 없음**
→ **체크박스 선택 후 일괄 취소요청 버튼만 존재**
→ **1개만 선택해도 일괄 취소 로직 사용 → 사유 필수 입력**

---

## 🔍 관리자 페이지에서의 취소사유

### 현재 상태: 미표시

**파일**: `src/app/admin/order-platform/page.tsx`

```bash
# cancel_reason 검색 결과
$ grep -n "cancel_reason" src/app/admin/order-platform/page.tsx
(결과 없음)
```

**발견 사항**:
- ❌ 관리자 주문 플랫폼 페이지에서 **취소사유 칼럼 없음**
- ❌ 취소요청/취소완료/환불완료 상태에서도 **사유 표시 안됨**
- ⚠️  관리자는 조직이 입력한 취소 사유를 볼 수 없음

**영향**:
- 관리자가 취소승인 시 **왜 취소하는지 모르는 상태**에서 승인/반려 결정
- 취소 사유 데이터는 DB에 저장되지만 **관리자 UI에서 활용 안됨**

---

## ✅ 정리

| 항목 | 상태 | 비고 |
|------|------|------|
| DB 칼럼 존재 | ✅ | `integrated_orders.cancel_reason` (TEXT) |
| 일괄 취소 시 저장 | ✅ | 필수 입력, DB에 저장됨 |
| 단일 취소 시 저장 | N/A | 단일 취소 버튼 없음 (미사용 코드) |
| 셀러 페이지 표시 | ✅ | 취소완료/환불완료 탭에 표시됨 |
| 관리자 페이지 표시 | ❌ | 관리자는 취소사유 볼 수 없음 |

---

## 💡 권장 사항

### 관리자 페이지에 취소사유 추가

관리자가 취소 승인/반려를 결정할 때 **취소 사유를 볼 수 있도록** 개선 필요:

**추가할 위치**: `src/app/admin/order-platform/page.tsx`

1. **취소요청 상태 테이블**에 "취소사유" 칼럼 추가
2. **취소완료/환불완료 상태 테이블**에도 "취소사유" 칼럼 추가
3. 주문 상세 정보에 취소사유 표시

**예상 효과**:
- 관리자가 취소 사유를 보고 승인/반려 결정 가능
- CS 응대 시 취소 이유 파악 용이
- 취소 패턴 분석 가능 (자주 발생하는 취소 사유 파악)

---

*분석 완료 일시: 2025-01-19*
*분석 대상: 취소 사유 저장 및 표시 로직*
