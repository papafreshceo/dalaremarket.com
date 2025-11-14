# users 테이블 삭제된 컬럼 사용 코드 수정 가이드

## 작성일: 2025-01-14

## 배경
users 테이블에서 사업자 관련 컬럼 12개를 삭제했으나, 일부 코드에서 아직 해당 컬럼을 참조하고 있음.
이 파일은 추후 수정을 위한 상세 가이드입니다.

## 삭제된 컬럼 목록
```sql
-- database/migrations/remove_business_fields_from_users.sql 참조
- company_name
- company_id
- company_address
- commission_rate
- settlement_cycle
- account_number
- tax_invoice_email
- business_number
- representative_phone
- representative_name
- bank_name
- account_holder
```

---

## 🔴 우선순위 1: users 테이블 직접 조회 수정

### 1. SettlementTab.tsx (거래명세서 PDF 생성)

**파일:** `src/app/platform/orders/components/SettlementTab.tsx`
**라인:** 168-173

#### 현재 코드:
```typescript
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('name, email, business_number, company_address, representative_name, representative_phone')
  .eq('id', user.id)
  .single();
```

#### 수정 코드:
```typescript
const { data: userData, error: userError } = await supabase
  .from('users')
  .select(`
    name,
    email,
    organizations:primary_organization_id (
      business_number,
      business_address,
      representative_name,
      representative_phone
    )
  `)
  .eq('id', user.id)
  .single();
```

#### 사용부 수정 (라인 321-323, 1186-1188):
```typescript
// Before
representative: userInfo.representative_name || '',
address: userInfo.company_address || '',
phone: userInfo.representative_phone || '',

// After
representative: userInfo.organizations?.representative_name || '',
address: userInfo.organizations?.business_address || '',
phone: userInfo.organizations?.representative_phone || '',
```

#### TypeScript 인터페이스 수정 (라인 25-32):
```typescript
// Before
interface UserInfo {
  name: string;
  email: string;
  business_number?: string;
  company_address?: string;
  representative_name?: string;
  representative_phone?: string;
}

// After
interface UserInfo {
  name: string;
  email: string;
  organizations?: {
    business_number?: string;
    business_address?: string;
    representative_name?: string;
    representative_phone?: string;
  };
}
```

---

### 2. OrderRegistrationTab.tsx (발주서 등록)

**파일:** `src/app/platform/orders/components/OrderRegistrationTab.tsx`
**라인:** 304-314

#### 현재 코드:
```typescript
const { data: sellerData, error: sellerError } = await supabase
  .from('users')
  .select('bank_account, bank_name, account_holder, representative_name, representative_phone, manager_name, manager_phone')
  .eq('id', selectedSeller)
  .single();
```

#### 수정 코드:
```typescript
// 1. 먼저 user의 primary_organization_id 조회
const { data: userData } = await supabase
  .from('users')
  .select('primary_organization_id')
  .eq('id', selectedSeller)
  .single();

if (!userData?.primary_organization_id) {
  toast.error('판매자의 조직 정보가 없습니다.');
  return;
}

// 2. organizations 테이블에서 정보 조회
const { data: sellerData, error: sellerError } = await supabase
  .from('organizations')
  .select('bank_account, bank_name, account_holder, representative_name, representative_phone, manager_name, manager_phone')
  .eq('id', userData.primary_organization_id)
  .single();
```

#### 또는 JOIN 방식:
```typescript
const { data: result, error: sellerError } = await supabase
  .from('users')
  .select(`
    organizations:primary_organization_id (
      bank_account,
      bank_name,
      account_holder,
      representative_name,
      representative_phone,
      manager_name,
      manager_phone
    )
  `)
  .eq('id', selectedSeller)
  .single();

const sellerData = result?.organizations;
```

---

### 3. SellerInfoValidationModal.tsx (판매자 정보 검증)

**파일:** `src/app/platform/orders/modals/SellerInfoValidationModal.tsx`
**라인:** 46-55

#### 현재 코드:
```typescript
const { data, error } = await supabase
  .from('users')
  .select('bank_account, bank_name, account_holder, representative_name, representative_phone, manager_name, manager_phone')
  .eq('id', userId)
  .single();
```

#### 수정 코드:
```typescript
const { data: userData } = await supabase
  .from('users')
  .select(`
    organizations:primary_organization_id (
      bank_account,
      bank_name,
      account_holder,
      representative_name,
      representative_phone,
      manager_name,
      manager_phone
    )
  `)
  .eq('id', userId)
  .single();

const data = userData?.organizations;
```

---

### 4. integrated-orders API (통합주문 조회)

**파일:** `src/app/api/integrated-orders/route.ts`
**라인:** 137-145

#### 현재 코드:
```typescript
const { data: sellers, error: sellerError } = await supabase
  .from('users')
  .select('id, company_name, name, email')
  .in('id', sellerIds);
```

#### 수정 코드 (방법 1 - 서브쿼리):
```typescript
const { data: sellers, error: sellerError } = await supabase
  .from('users')
  .select(`
    id,
    name,
    email,
    organizations:primary_organization_id (
      business_name
    )
  `)
  .in('id', sellerIds);

// sellerMap 생성 시 수정
const sellerMap = new Map(
  sellers?.map(s => [
    s.id,
    s.organizations?.business_name || s.name || s.email
  ]) || []
);
```

#### 수정 코드 (방법 2 - 직접 조회):
```typescript
// 1. users에서 primary_organization_id 조회
const { data: users } = await supabase
  .from('users')
  .select('id, name, email, primary_organization_id')
  .in('id', sellerIds);

// 2. organizations에서 business_name 조회
const orgIds = users?.map(u => u.primary_organization_id).filter(Boolean) || [];
const { data: orgs } = await supabase
  .from('organizations')
  .select('id, business_name')
  .in('id', orgIds);

// 3. Map 생성
const orgMap = new Map(orgs?.map(o => [o.id, o.business_name]) || []);
const sellerMap = new Map(
  users?.map(u => [
    u.id,
    orgMap.get(u.primary_organization_id) || u.name || u.email
  ]) || []
);
```

---

## 🟡 우선순위 2: TypeScript 타입 정의 수정

### 5. admin/settings/users/page.tsx

**파일:** `src/app/admin/settings/users/page.tsx`
**라인:** 8-19

#### 현재 코드:
```typescript
interface User {
  id: string
  email: string
  name: string
  phone: string
  company_name: string  // ❌ 삭제된 컬럼
  role: string
  approved: boolean
  created_at: string
  seller_code?: string
  partner_code?: string
}
```

#### 수정 코드:
```typescript
interface User {
  id: string
  email: string
  name: string
  phone: string
  // company_name 제거 (organizations 테이블로 이동)
  role: string
  approved: boolean
  created_at: string
  seller_code?: string
  partner_code?: string
}
```

#### 필요시 organizations join:
```typescript
interface User {
  id: string
  email: string
  name: string
  phone: string
  role: string
  approved: boolean
  created_at: string
  seller_code?: string
  partner_code?: string
  organizations?: {
    business_name?: string
  }
}

// 조회 쿼리
const { data } = await supabase
  .from('users')
  .select(`
    *,
    organizations:primary_organization_id (
      business_name
    )
  `);
```

---

### 6. AdminRankingTab.tsx

**파일:** `src/app/admin/order-platform/components/AdminRankingTab.tsx`
**라인:** 28-31

#### 현재 코드:
```typescript
interface RankingData {
  seller_id: string;
  users: {
    name: string;
    company_name?: string;  // ❌ 삭제된 컬럼
  };
  // ...
}
```

#### 수정 방법:
1. API `/api/seller-rankings`가 이미 organizations 테이블을 사용하는지 확인
2. API 응답에 맞춰 타입 수정:

```typescript
interface RankingData {
  seller_id: string;
  users: {
    name: string;
  };
  organizations?: {
    business_name?: string;
  };
  // ...
}
```

3. 사용부 수정 (라인 294-297):
```typescript
// Before
<div style={{ fontSize: '13px', color: '#666' }}>
  {seller.users?.company_name || '-'}
</div>

// After
<div style={{ fontSize: '13px', color: '#666' }}>
  {seller.organizations?.business_name || '-'}
</div>
```

---

## 📝 수정 체크리스트

- [ ] **1. SettlementTab.tsx**
  - [ ] users 쿼리 수정 (라인 171)
  - [ ] UserInfo interface 수정 (라인 25-32)
  - [ ] 사용부 수정 (라인 321-323, 1186-1188)
  - [ ] 테스트: PDF 거래명세서 생성 확인

- [ ] **2. OrderRegistrationTab.tsx**
  - [ ] users 쿼리를 organizations 조회로 변경 (라인 307)
  - [ ] 테스트: 발주서 등록 시 판매자 정보 검증

- [ ] **3. SellerInfoValidationModal.tsx**
  - [ ] users 쿼리 수정 (라인 49)
  - [ ] 테스트: 판매자 정보 검증 모달 동작

- [ ] **4. integrated-orders API**
  - [ ] sellers 조회 로직 수정 (라인 140)
  - [ ] sellerMap 생성 로직 수정
  - [ ] 테스트: 통합주문 목록에서 seller 이름 표시 확인

- [ ] **5. admin/settings/users/page.tsx**
  - [ ] User interface에서 company_name 제거 (라인 13)
  - [ ] 필요시 organizations join 추가
  - [ ] 테스트: 관리자 사용자 관리 페이지

- [ ] **6. AdminRankingTab.tsx**
  - [ ] RankingData interface 수정 (라인 30)
  - [ ] 사용부 수정 (라인 294-297)
  - [ ] 테스트: 셀러 랭킹 표시 확인

---

## 🧪 테스트 시나리오

### 1. SettlementTab 테스트
1. 플랫폼 로그인
2. 주문 > 정산 탭 이동
3. PDF 거래명세서 생성 버튼 클릭
4. PDF에 대표자명, 주소, 전화번호가 올바르게 표시되는지 확인

### 2. OrderRegistrationTab 테스트
1. 플랫폼 로그인
2. 주문 > 발주 등록 탭 이동
3. 판매자 선택
4. "판매자 정보가 입력되지 않았습니다" 경고 없이 발주서 등록되는지 확인

### 3. integrated-orders API 테스트
1. 통합주문 페이지 접속
2. seller 컬럼에 조직명(business_name)이 올바르게 표시되는지 확인

---

## ⚠️ 주의사항

1. **primary_organization_id가 null인 경우 처리**
   - 일부 사용자는 조직이 없을 수 있음
   - `?.` optional chaining 사용 필수
   - 기본값 처리: `|| ''`, `|| '-'`

2. **organizations 테이블 컬럼명 확인**
   - `company_address` → `business_address`
   - `account_number` → `bank_account` (organizations 테이블에서는 bank_account 사용)

3. **RLS 정책 확인**
   - organizations 테이블 조회 시 RLS 정책 때문에 조회 안 될 수 있음
   - 필요시 `database/migrations/allow_admin_view_all_organizations.sql` 실행

4. **migration 순서**
   - 먼저 코드 수정 완료 후
   - `remove_business_fields_from_users.sql` 실행
   - 순서 바꾸면 즉시 에러 발생

---

## 📊 영향도 분석

| 파일 | 사용자 영향 | 에러 발생 시점 | 우선순위 |
|------|------------|----------------|----------|
| SettlementTab.tsx | 높음 (PDF 생성 실패) | PDF 생성 시 | 🔴 높음 |
| OrderRegistrationTab.tsx | 높음 (발주 불가) | 발주 등록 시 | 🔴 높음 |
| SellerInfoValidationModal.tsx | 중간 (검증 실패) | 발주 검증 시 | 🔴 높음 |
| integrated-orders API | 중간 (이름 표시 안 됨) | 목록 조회 시 | 🟡 중간 |
| users/page.tsx | 낮음 (타입 불일치) | 컴파일 타임 | 🟢 낮음 |
| AdminRankingTab.tsx | 낮음 (타입 불일치) | 컴파일 타임 | 🟢 낮음 |

---

## 🔗 관련 파일

- Migration SQL: `database/migrations/remove_business_fields_from_users.sql`
- 이미 수정 완료: `src/lib/auto-create-organization.ts`
- RLS 정책: `database/migrations/allow_admin_view_all_organizations.sql`

---

## 📅 수정 이력

- 2025-01-14: 초기 문서 작성
