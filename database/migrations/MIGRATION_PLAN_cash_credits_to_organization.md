# 캐시/크레딧 시스템 마이그레이션 계획
**작성일**: 2025-01-14
**목적**: 개인 단위 캐시/크레딧 시스템을 조직 단위로 전환

---

## 1. 데이터베이스 변경

### A. organization_cash 테이블
- **변경**: `user_id` → `organization_id` (기본키 변경)
- **현재**: user_id로 개인별 캐시 관리
- **변경 후**: organization_id로 조직별 캐시 관리

### B. organization_credits 테이블
- **변경**: `user_id` → `organization_id` (기본키 변경)
- **현재**: user_id로 개인별 크레딧 관리
- **변경 후**: organization_id로 조직별 크레딧 관리

### C. organization_cash_history 테이블
- **삭제**: `user_id` 컬럼 (불필요)
- **유지**: `organization_id`, `admin_id`
- **용도**: 관리자가 조직에 캐시를 지급/회수한 내역

### D. organization_credits_history 테이블
- **삭제**: `user_id` 컬럼 (불필요)
- **유지**: `organization_id`, `admin_id`
- **용도**: 관리자가 조직에 크레딧을 지급/회수한 내역

### E. organization_cash_transactions 테이블
- **변경**: 기본 조회 키를 `user_id` → `organization_id`로 변경
- **추가**: 사용한 멤버를 추적하기 위해 `used_by_user_id` 컬럼 추가 (nullable)
- **용도**: 조직의 캐시 사용 내역 (어떤 멤버가 사용했는지 추적)

### F. organization_credit_transactions 테이블
- **변경**: 기본 조회 키를 `user_id` → `organization_id`로 변경
- **추가**: 사용한 멤버를 추적하기 위해 `used_by_user_id` 컬럼 추가 (nullable)
- **용도**: 조직의 크레딧 사용 내역 (어떤 멤버가 사용했는지 추적)

---

## 2. API 변경

### A. 삭제할 API (개인 단위 API)
```
❌ /api/admin/users/[id]/cash/route.ts
❌ /api/admin/users/[id]/cash/history/route.ts
❌ /api/admin/users/[id]/credits/route.ts
❌ /api/admin/users/[id]/credits/history/route.ts
❌ /api/cash/route.ts (개인용)
❌ /api/credits/route.ts (개인용)
❌ /api/user/credits/route.ts
❌ /api/user/use-credits/route.ts
```

### B. 수정할 API (조직 단위로 변경)
```
✅ /api/cash/use/route.ts
   - user_id → organization_id 기반 조회
   - 사용자 추적: used_by_user_id에 user.id 저장

✅ /api/cash/transactions/route.ts
   - user_id → organization_id 기반 조회
   - 사용자의 primary_organization_id로 조회

✅ /api/cash/claim-login/route.ts
   - user_id → organization_id 기반 조회

✅ /api/cash/claim-activity/route.ts
   - user_id → organization_id 기반 조회

✅ /api/credits/daily-refill/route.ts
   - user_id → organization_id 기반 조회

✅ /api/credits/transactions/route.ts
   - user_id → organization_id 기반 조회
```

### C. 유지할 API (이미 조직 단위)
```
✅ /api/admin/organizations/[id]/cash/route.ts
✅ /api/admin/organizations/[id]/cash/history/route.ts
✅ /api/admin/organizations/[id]/credits/route.ts
✅ /api/admin/organizations/[id]/credits/history/route.ts
```

---

## 3. 마이그레이션 순서

### Step 1: 데이터베이스 스키마 변경
1. organization_cash_transactions에 organization_id, used_by_user_id 컬럼 추가
2. organization_credit_transactions에 organization_id, used_by_user_id 컬럼 추가
3. 기존 데이터 마이그레이션 (user_id → users.primary_organization_id)
4. organization_cash에서 user_id를 organization_id로 변경
5. organization_credits에서 user_id를 organization_id로 변경
6. organization_cash_history에서 user_id 컬럼 삭제
7. organization_credits_history에서 user_id 컬럼 삭제

### Step 2: API 코드 수정
1. 조직 기반 API 수정 (/api/cash/*, /api/credits/*)
2. 개인 단위 API 삭제 (/api/admin/users/[id]/cash/*, /api/user/credits/*)

### Step 3: 프론트엔드 수정
1. 개인 캐시/크레딧 UI 제거
2. 조직 캐시/크레딧 UI로 통합

---

## 4. 주의사항

- 기존 user_id 기반 데이터를 organization_id로 마이그레이션 필요
- users 테이블의 primary_organization_id가 모든 사용자에게 있는지 확인
- primary_organization_id가 없는 사용자는 자동 생성 필요
- RLS 정책도 organization 기반으로 변경 필요

---

## 5. 롤백 계획

- 모든 마이그레이션 SQL은 롤백 스크립트와 함께 작성
- 테스트 환경에서 먼저 검증
- 프로덕션 배포 전 백업 필수
