# 옵션명 기반 주문 정보 자동 매핑 구현 완료

## 개요

모든 주문 등록 경로에서 `option_name`만 있으면 자동으로 옵션 상품 정보를 매핑하는 시스템을 구축했습니다.

## 구현 내용

### 1. 유틸리티 함수 생성 ✅

**파일**: `src/lib/order-utils.ts`

**제공 기능**:
- `getOptionProductInfo(optionName)` - 옵션명으로 상품 정보 조회
- `enrichOrderWithOptionInfo(orderData)` - 단일 주문에 정보 매핑
- `enrichOrdersWithOptionInfo(ordersData)` - 다수 주문에 일괄 매핑 (성능 최적화)
- `validateOrderData(orderData)` - 주문 데이터 유효성 검사

### 2. API 적용 완료 ✅

#### 적용된 API 목록:

1. **수동 주문 접수** (단건)
   - `src/app/api/integrated-orders/route.ts` (POST)
   - ✅ `enrichOrderWithOptionInfo()` 적용

2. **대량 주문 등록** (엑셀 업로드)
   - `src/app/api/integrated-orders/bulk/route.ts` (POST)
   - ✅ `enrichOrdersWithOptionInfo()` 적용 (성능 최적화됨)

3. **CS 재발송 주문 접수**
   - `src/app/api/cs-records/route.ts` (POST)
   - ✅ `enrichOrderWithOptionInfo()` 적용

4. **플랫폼 셀러 주문 접수** (단건/다건)
   - `src/app/api/platform-orders/route.ts` (POST) - ⭐ 새로 생성
   - ✅ `enrichOrderWithOptionInfo()` (단건), `enrichOrdersWithOptionInfo()` (다건) 적용
   - 클라이언트에서 이 API 호출:
     - ✅ `src/app/platform/orders/components/MobileRegistrationTab.tsx` (모바일 등록)
     - ✅ `src/app/platform/orders/page.tsx` (엑셀 업로드)

## 자동 매핑되는 정보

`option_products` 테이블에서 자동으로 가져오는 필드:
- ✅ `seller_supply_price` (셀러공급가)
- ✅ `출고`
- ✅ `송장`
- ✅ `벤더사`
- ✅ `발송지명`
- ✅ `발송지주소`
- ✅ `발송지연락처`
- ✅ `출고비용`

## 작동 방식

### Before (기존 방식)
```typescript
// 각 API마다 중복된 코드 작성
const { data: optionData } = await supabase
  .from('product_mapping')  // 또는 option_products
  .select('*')
  .eq('option_name', body.option_name)
  .single();

if (optionData) {
  body.seller_supply_price = optionData.seller_supply_price;
  body.벤더사 = optionData.벤더사;
  // ... 반복
}
```

### After (새로운 방식)
```typescript
// 한 줄로 해결
const orderDataWithInfo = await enrichOrderWithOptionInfo(body);
```

## 성능 최적화

### 대량 주문 처리 시:
- **기존**: 1000개 주문 → 1000번 DB 조회
- **현재**: 1000개 주문 (10개 고유 옵션) → 10번 DB 조회
- **방법**:
  - 중복 옵션명 제거
  - 병렬 처리 (Promise.all)
  - 결과 캐싱 (Map)

## 에러 처리

안전하게 설계되어 주문 등록에 영향을 주지 않습니다:

- ❌ 옵션명이 없는 경우 → 빈 객체 반환 (주문 등록 계속 진행)
- ❌ DB 조회 실패 → 빈 객체 반환 (주문 등록 계속 진행)
- ❌ 옵션 정보 없음 → 빈 객체 반환 (주문 등록 계속 진행)

## 모든 주문 경로 적용 완료 ✅

**총 5개 주문 등록 경로에 모두 적용 완료**:
- ✅ 관리자 수동 주문 접수
- ✅ 관리자 대량 주문 등록 (엑셀)
- ✅ CS 재발송 주문
- ✅ 플랫폼 셀러 모바일 주문
- ✅ 플랫폼 셀러 엑셀 업로드

## 테스트 방법

### 1. 수동 주문 접수 테스트
```bash
POST /api/integrated-orders
{
  "market_name": "테스트마켓",
  "order_number": "TEST001",
  "recipient_name": "홍길동",
  "option_name": "상품A-옵션1",  # option_products에 존재하는 옵션명
  "quantity": "1"
}
```

**확인사항**:
- `seller_supply_price`, `벤더사`, `발송지명` 등이 자동으로 채워졌는지 확인

### 2. 대량 주문 테스트
```bash
POST /api/integrated-orders/bulk
{
  "orders": [
    {
      "market_name": "테스트마켓",
      "order_number": "TEST001",
      "option_name": "상품A-옵션1",
      ...
    },
    {
      "market_name": "테스트마켓",
      "order_number": "TEST002",
      "option_name": "상품B-옵션2",
      ...
    }
  ]
}
```

**확인사항**:
- 모든 주문에 옵션 정보가 매핑되었는지 확인
- 성능 (100개 이상 주문 시에도 빠른지)

### 3. CS 재발송 테스트
```bash
POST /api/cs-records
{
  "receipt_date": "2025-01-15",
  "order_number": "TEST001",
  "option_name": "상품A-옵션1",
  ...
}
```

**확인사항**:
- CS 기록에도 옵션 정보가 매핑되었는지 확인

### 4. 플랫폼 셀러 주문 테스트 (단건 - 모바일)
```bash
POST /api/platform-orders
{
  "seller_id": "user-id",
  "order_number": "TEST001",
  "recipient_name": "홍길동",
  "option_name": "상품A-옵션1",
  "quantity": "1",
  ...
}
```

**확인사항**:
- 플랫폼 셀러 주문에도 옵션 정보가 자동 매핑되는지 확인

### 5. 플랫폼 셀러 주문 테스트 (다건 - 엑셀)
```bash
POST /api/platform-orders
{
  "orders": [
    { "option_name": "상품A-옵션1", ... },
    { "option_name": "상품B-옵션2", ... }
  ]
}
```

**확인사항**:
- 대량 주문도 성능 최적화되어 빠르게 처리되는지 확인

## 데이터 소스

**테이블**: `option_products`

이 테이블에 옵션명별 상품 정보가 저장되어 있어야 합니다.

**필수 컬럼**:
- `option_name` (PRIMARY KEY 또는 UNIQUE)
- `seller_supply_price`
- `출고`
- `송장`
- `벤더사`
- `발송지명`
- `발송지주소`
- `발송지연락처`
- `출고비용`

## 문서

- **사용 가이드**: `src/lib/order-utils.md`
- **소스 코드**: `src/lib/order-utils.ts`

## 주의사항

1. **option_name 필수**: 주문 데이터에 `option_name` 필드가 있어야 매핑이 작동합니다
2. **기존 값 유지**: 주문 데이터에 이미 값이 있으면 덮어쓰지 않습니다
3. **선택적 매핑**: option_products에 정보가 없어도 주문 등록은 정상 진행됩니다

## 향후 개선 사항

- [ ] Redis 캐싱 추가 (자주 조회되는 옵션 정보)
- [ ] 옵션 정보 변경 이력 추적
- [ ] 옵션 정보 일괄 수정 API
- [ ] 관리자 페이지에서 옵션 정보 편집 UI

---

**작성일**: 2025-01-15
**상태**: ✅ 구현 완료
