# Admin Order Platform - seller_id → organization_id 전환 가이드

## 변경 개요

Admin Order Platform 페이지를 개인(seller_id) 기반에서 조직(organization_id) 기반으로 전환합니다.

## 주요 변경 사항

### 1. Interface 변경

```typescript
// Before
interface Order {
  seller_id?: string;
  // ...
}

interface SellerStats {
  seller_id: string;
  seller_name: string;
  // ...
}

// After
interface Order {
  organization_id?: string;  // seller_id 대체
  // ...
}

interface OrganizationStats {
  organization_id: string;
  organization_name: string;
  // ...
}
```

### 2. State 변경

```typescript
// Before
const [sellerStats, setSellerStats] = useState<SellerStats[]>([]);
const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
const [sellerNames, setSellerNames] = useState<Map<string, string>>(new Map());
const [expandedSellers, setExpandedSellers] = useState<Set<string>>(new Set());

// After
const [organizationStats, setOrganizationStats] = useState<OrganizationStats[]>([]);
const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
const [organizationNames, setOrganizationNames] = useState<Map<string, string>>(new Map());
const [expandedOrganizations, setExpandedOrganizations] = useState<Set<string>>(new Set());
```

### 3. API 호출 변경

```typescript
// Before (라인 130)
const response = await fetch('/api/integrated-orders?onlyWithSeller=true&limit=10000');

// After
const response = await fetch('/api/integrated-orders?onlyWithOrganization=true&limit=10000');
```

### 4. 조직 정보 조회 변경

```typescript
// Before (라인 137-157)
const sellerIds = [...new Set(sellerOrders.map((o: Order) => o.seller_id).filter(Boolean))];
const { data: users } = await supabase
  .from('users')
  .select('id, company_name, name')
  .in('id', sellerIds);

// After
const organizationIds = [...new Set(orders.map((o: Order) => o.organization_id).filter(Boolean))];
const { data: organizations } = await supabase
  .from('organizations')
  .select('id, name')
  .in('id', organizationIds);
```

### 5. 통계 계산 함수 변경

```typescript
// Before (라인 174)
const calculateSellerStats = (orderData: Order[], nameMap?: Map<string, string>) => {
  const statsMap = new Map<string, SellerStats>();
  orderData.forEach((order) => {
    const sellerId = order.seller_id || '미지정';
    // ...
  });
};

// After
const calculateOrganizationStats = (orderData: Order[], nameMap?: Map<string, string>) => {
  const statsMap = new Map<string, OrganizationStats>();
  orderData.forEach((order) => {
    const organizationId = order.organization_id || '미지정';
    // ...
  });
};
```

### 6. 입금 확인 처리 변경

```typescript
// Before (라인 361)
const handlePaymentCheckToggle = async (sellerId: string, confirmedAt?: string) => {
  const sellerOrders = orders.filter(order => {
    const orderSellerId = order.seller_id || '미지정';
    return orderSellerId === sellerId && status === '발주서확정';
  });
  // ...
};

// After
const handlePaymentCheckToggle = async (organizationId: string, confirmedAt?: string) => {
  const organizationOrders = orders.filter(order => {
    const orderOrgId = order.organization_id;
    return orderOrgId === organizationId && status === '발주서확정';
  });
  // ...
};
```

### 7. 환불 처리 변경

```typescript
// Before (라인 570)
const handleRefundComplete = async (sellerId: string) => {
  const sellerRefundOrders = orders.filter(order => {
    const orderSellerId = order.seller_id || '미지정';
    return orderSellerId === sellerId && status === '취소요청';
  });
  // ...
};

// After
const handleRefundComplete = async (organizationId: string) => {
  const organizationRefundOrders = orders.filter(order => {
    const orderOrgId = order.organization_id;
    return orderOrgId === organizationId && status === '취소요청';
  });
  // ...
};
```

### 8. UI 텍스트 변경

- "셀러" → "조직" 또는 "셀러계정"
- "셀러별" → "조직별"
- "seller" → "organization"

## 변경되지 않는 부분

- 날짜 필터링 로직
- 상태 필터링 로직 (발주서확정, 결제완료 등)
- UI 레이아웃 구조
- 정산 금액 계산 로직

## 테스트 체크리스트

- [ ] 조직별 주문 목록 조회
- [ ] 조직별 통계 집계
- [ ] 입금 확인 처리 (조직 단위)
- [ ] 환불 처리 (조직 단위)
- [ ] 조직 이름 표시
- [ ] 필터링 및 검색
- [ ] 정산 내역 탭
- [ ] 랭킹 탭

## 주의사항

1. **API 변경 필요**: `/api/integrated-orders`에 `onlyWithOrganization` 파라미터 추가
2. **데이터베이스**: integrated_orders 테이블에 organization_id 컬럼 필수
3. **권한**: 관리자만 모든 조직 조회 가능, 일반 사용자는 자신의 조직만 조회
