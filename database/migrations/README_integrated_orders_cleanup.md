# integrated_orders 테이블 정리: 조직 기반 시스템 전환

## 개요

integrated_orders 테이블을 개인 사용자 기반에서 조직 기반 시스템으로 완전히 전환하기 위한 정리 작업입니다.

## 문제 분석

### 기존 컬럼 구조 (문제점)

| 컬럼 | 타입 | 원래 목적 | 실제 상태 | 문제 |
|------|------|-----------|-----------|------|
| **created_by** | UUID | 주문 등록자 추적 (audit) | ❌ 항상 NULL | Audit trail 없음 |
| **seller_id** | UUID | 개인 사용자 기반 필터 | 🟡 레거시 컬럼 | organization_id와 중복 |
| **organization_id** | UUID | 조직 기반 필터 | ✅ 정상 작동 | - |

### 컬럼 히스토리

1. **최초 설계** (014_recreate_integrated_orders_with_standard_names.sql)
   ```sql
   created_by UUID REFERENCES auth.users(id)  -- 등록자
   seller_name VARCHAR                         -- Excel 필드
   ```

2. **개인화 단계** (028_change_seller_name_to_seller_id.sql)
   ```sql
   seller_name → seller_id UUID  -- 개인 사용자 참조
   ```

3. **조직화 단계** (add_organization_system.sql)
   ```sql
   organization_id UUID  -- 조직 참조 (seller_id와 공존)
   ```

### 중복 및 불일치 문제

**문제 1: created_by 미사용**
- POST /api/integrated-orders → created_by 설정 안 함
- POST /api/integrated-orders/bulk → created_by 설정 안 함
- 결과: 누가 주문을 등록했는지 추적 불가

**문제 2: seller_id vs organization_id 중복**
- 모든 사용자는 1개 이상의 조직을 가짐 (autoCreateOrganizationFromUser)
- seller_id는 개인 사용자 시대의 레거시
- organization_id가 실제 데이터 필터링에 사용됨
- 결과: seller_id는 불필요한 컬럼

**문제 3: 조직 없는 사용자 대비 로직**
```typescript
// platform-orders/route.ts (불필요한 fallback)
if (organizationId) {
  query = query.eq('organization_id', organizationId);
} else {
  query = query.eq('seller_id', effectiveUserId);  // ← 실행되지 않는 코드
}
```
→ 모든 사용자가 조직을 가지므로 else 분기는 불필요

## 해결 방안

### 1. 마이그레이션 (cleanup_integrated_orders_columns.sql)

**단계별 작업**:

1. **데이터 보존**: seller_id → organization_id 마이그레이션
   ```sql
   UPDATE integrated_orders
   SET organization_id = (
     SELECT primary_organization_id FROM users WHERE users.id = seller_id
   )
   WHERE organization_id IS NULL AND seller_id IS NOT NULL;
   ```

2. **created_by 복구**: 기존 레코드에 owner 설정
   ```sql
   UPDATE integrated_orders
   SET created_by = (
     SELECT owner_id FROM organizations WHERE id = organization_id
   )
   WHERE created_by IS NULL;
   ```

3. **seller_id 제거**
   ```sql
   ALTER TABLE integrated_orders DROP COLUMN seller_id;
   ```

4. **제약조건 강화**
   ```sql
   ALTER TABLE integrated_orders
   ALTER COLUMN created_by SET NOT NULL,
   ALTER COLUMN organization_id SET NOT NULL;
   ```

### 2. API 수정

**수정된 파일**:

#### `/src/app/api/integrated-orders/route.ts`
```typescript
// ✅ created_by 설정 추가
body.created_by = auth.user.id;

// ✅ organization_id 자동 설정
if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin') {
  const organizationId = await getOrganizationDataFilter(auth.user.id);
  if (organizationId) {
    body.organization_id = organizationId;
  }
}
```

#### `/src/app/api/integrated-orders/bulk/route.ts`
```typescript
// ✅ 모든 주문에 created_by 설정
const ordersWithDate = orders.map((order) => {
  order.created_by = auth.user.id;  // ← 추가
  if (organizationId) {
    order.organization_id = organizationId;
  }
  return order;
});
```

#### `/src/app/api/platform-orders/route.ts`
```typescript
// ✅ seller_id fallback 제거
const organizationId = await getOrganizationDataFilter(effectiveUserId);

if (!organizationId) {
  return NextResponse.json(
    { success: false, error: '조직 정보를 찾을 수 없습니다.' },
    { status: 400 }
  );
}

let query = dbClient
  .from('integrated_orders')
  .select('*')
  .eq('is_deleted', false)
  .eq('organization_id', organizationId);  // ← seller_id 분기 제거
```

## 최종 데이터 모델

### 정리 후 컬럼 구조

| 컬럼 | 타입 | 제약 | 목적 | 설정 시점 |
|------|------|------|------|-----------|
| **created_by** | UUID | NOT NULL | 주문 등록자 (audit trail) | API에서 auth.user.id |
| **organization_id** | UUID | NOT NULL | 조직 기반 필터링 | API에서 primary_organization_id |

### 컬럼 역할 명확화

- **created_by**: "누가 등록했는가?" (사용자 추적)
- **organization_id**: "어느 조직 데이터인가?" (데이터 권한)

### 예시 시나리오

**시나리오 1: 개인 사용자**
- 사용자: user_123
- 조직: org_456 (자동 생성된 1인 조직)
- 주문 등록 시:
  - created_by = user_123
  - organization_id = org_456

**시나리오 2: 조직 소속 사용자**
- 사용자: user_789
- 조직: org_abc (팀 조직, 멤버 5명)
- 주문 등록 시:
  - created_by = user_789 (실제 등록자)
  - organization_id = org_abc (조직 전체가 공유)
- 결과: 같은 조직의 다른 멤버도 주문 조회 가능

## 마이그레이션 실행 방법

### 1. 백업 (필수)
```bash
# integrated_orders 테이블 백업
psql -U postgres -d dalraemarket -c "\COPY integrated_orders TO 'backup_integrated_orders_$(date +%Y%m%d).csv' CSV HEADER"
```

### 2. 마이그레이션 실행
```bash
psql -U postgres -d dalraemarket -f database/migrations/cleanup_integrated_orders_columns.sql
```

### 3. 검증
```sql
-- created_by NULL 체크
SELECT COUNT(*) FROM integrated_orders WHERE created_by IS NULL;
-- 결과: 0 (모두 채워져야 함)

-- organization_id NULL 체크
SELECT COUNT(*) FROM integrated_orders WHERE organization_id IS NULL;
-- 결과: 0 (모두 채워져야 함)

-- seller_id 컬럼 존재 여부 (제거되어야 함)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'integrated_orders' AND column_name = 'seller_id';
-- 결과: 0 rows (컬럼이 제거되어야 함)
```

### 4. 애플리케이션 재배포
- API 변경사항 배포
- 정상 작동 확인

## 장점 및 효과

### Before (문제)
- ❌ created_by 항상 NULL → 등록자 추적 불가
- ❌ seller_id와 organization_id 중복 → 데이터 모델 혼란
- ❌ 불필요한 fallback 로직 → 코드 복잡도 증가

### After (해결)
- ✅ created_by 자동 설정 → 완전한 audit trail
- ✅ organization_id 단일 소스 → 명확한 데이터 모델
- ✅ 간결한 쿼리 로직 → 유지보수성 향상

### 코드 품질 향상
```typescript
// Before: 복잡한 fallback
if (organizationId) {
  query = query.eq('organization_id', organizationId);
} else {
  query = query.eq('seller_id', effectiveUserId);
}

// After: 단순하고 명확
if (!organizationId) {
  return NextResponse.json({ success: false, error: '조직 정보를 찾을 수 없습니다.' });
}
query = query.eq('organization_id', organizationId);
```

## 주의사항

1. **운영 중 마이그레이션 시**: 트래픽이 적은 시간대에 실행 권장
2. **롤백 계획**: 백업 파일로 복구 가능하도록 준비
3. **조직 없는 사용자**: autoCreateOrganizationFromUser가 모든 사용자에게 실행되었는지 확인
   ```sql
   -- 조직 없는 사용자 확인 (admin 제외)
   SELECT id, email, role
   FROM users
   WHERE primary_organization_id IS NULL
     AND role NOT IN ('admin', 'super_admin');
   -- 결과: 0 rows (모든 일반 사용자는 조직을 가져야 함)
   ```

## 관련 파일

### 마이그레이션
- `database/migrations/cleanup_integrated_orders_columns.sql` (신규)
- `database/migrations/014_recreate_integrated_orders_with_standard_names.sql` (참고)
- `database/migrations/028_change_seller_name_to_seller_id.sql` (참고)
- `database/migrations/add_organization_system.sql` (참고)

### API
- `src/app/api/integrated-orders/route.ts` (수정됨)
- `src/app/api/integrated-orders/bulk/route.ts` (수정됨)
- `src/app/api/platform-orders/route.ts` (수정됨)

### 유틸리티
- `src/lib/organization-utils.ts` (기존)
- `src/lib/auto-create-organization.ts` (기존)

## 결론

이 정리 작업을 통해 integrated_orders 테이블은:
1. **완전한 조직 기반 시스템**으로 전환
2. **명확한 audit trail** 확보 (created_by)
3. **불필요한 레거시 컬럼** 제거 (seller_id)
4. **일관된 데이터 모델** 구축

모든 주문은 조직에 속하며, 등록자도 명확히 추적되는 깨끗한 구조가 완성됩니다.
