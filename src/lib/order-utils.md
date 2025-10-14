# 주문 정보 자동 매핑 유틸리티

옵션명을 기준으로 option_products 테이블에서 상품 정보를 자동으로 조회하여 주문 데이터에 추가하는 유틸리티 함수들입니다.

## 기능

모든 주문 등록 경로에서 옵션명만 있으면 자동으로 다음 정보를 추가합니다:
- `seller_supply_price` (셀러공급가)
- `출고`
- `송장`
- `벤더사`
- `발송지명`
- `발송지주소`
- `발송지연락처`
- `출고비용`

## 사용 방법

### 1. 단일 주문 매핑 (POST 요청)

```typescript
import { enrichOrderWithOptionInfo } from '@/lib/order-utils';

export async function POST(request: Request) {
  const body = await request.json();

  // 옵션 상품 정보 자동 매핑
  const orderDataWithInfo = await enrichOrderWithOptionInfo(body);

  // DB에 저장
  const { data, error } = await supabase
    .from('integrated_orders')
    .insert(orderDataWithInfo);

  return NextResponse.json({ success: true, data });
}
```

### 2. 여러 주문 일괄 매핑 (엑셀 업로드 등)

```typescript
import { enrichOrdersWithOptionInfo } from '@/lib/order-utils';

export async function POST(request: Request) {
  const body = await request.json();
  const { orders } = body; // 주문 배열

  // 모든 주문에 옵션 상품 정보 자동 매핑 (성능 최적화됨)
  const ordersWithInfo = await enrichOrdersWithOptionInfo(orders);

  // DB에 일괄 저장
  const { data, error } = await supabase
    .from('integrated_orders')
    .insert(ordersWithInfo);

  return NextResponse.json({ success: true, data });
}
```

### 3. 옵션 정보만 조회

```typescript
import { getOptionProductInfo } from '@/lib/order-utils';

// 특정 옵션명의 정보만 조회
const optionInfo = await getOptionProductInfo('상품명-옵션1');

console.log(optionInfo.seller_supply_price); // 10000
console.log(optionInfo.벤더사); // '벤더A'
```

### 4. 유효성 검사

```typescript
import { validateOrderData } from '@/lib/order-utils';

const validation = validateOrderData(orderData);

if (!validation.valid) {
  return NextResponse.json(
    { success: false, errors: validation.errors },
    { status: 400 }
  );
}
```

## 적용이 필요한 API 목록

다음 API들에 이 유틸리티를 적용해야 합니다:

### 1. 수동 주문 접수
```
src/app/api/integrated-orders/route.ts (POST)
```

### 2. CS 재발송 주문 접수
```
src/app/api/cs-records/route.ts (POST)
```

### 3. 추가 주문 등록
```
(해당 API 경로 확인 필요)
```

### 4. 플랫폼 셀러 주문
```
(해당 API 경로 확인 필요)
```

### 5. 모바일 주문 등록
```
(해당 API 경로 확인 필요)
```

## 성능 최적화

`enrichOrdersWithOptionInfo` 함수는 다음과 같이 최적화되어 있습니다:

1. **중복 제거**: 같은 옵션명은 한 번만 조회
2. **병렬 처리**: Promise.all로 여러 옵션 정보 동시 조회
3. **캐싱**: 조회한 정보를 Map에 저장하여 재사용

예시:
- 1000개 주문, 10개 고유 옵션명 → DB 조회 10번만 실행
- 기존 방식: 1000번 조회 필요

## 에러 처리

- 옵션명이 없거나 빈 문자열인 경우: 빈 객체 반환
- DB 조회 실패: 빈 객체 반환 (주문 등록은 계속 진행)
- 옵션 정보가 없는 경우: 빈 객체 반환

## 주의사항

1. **option_name 필드 필수**: 주문 데이터에 `option_name` 필드가 반드시 있어야 합니다
2. **기존 값 유지**: 주문 데이터에 이미 값이 있으면 덮어쓰지 않습니다
3. **선택적 매핑**: option_products 테이블에 정보가 없어도 주문 등록은 정상 진행됩니다

## 예시 코드

### Before (각 API마다 중복 코드)
```typescript
// API 1
const optionData = await supabase
  .from('option_products')
  .select('*')
  .eq('option_name', body.option_name)
  .single();

if (optionData.data) {
  body.seller_supply_price = optionData.data.seller_supply_price;
  body.벤더사 = optionData.data.벤더사;
  // ... 반복
}

// API 2 (같은 코드 반복)
// API 3 (같은 코드 반복)
```

### After (유틸리티 사용)
```typescript
// 모든 API에서 한 줄로 해결
const orderWithInfo = await enrichOrderWithOptionInfo(body);
```
