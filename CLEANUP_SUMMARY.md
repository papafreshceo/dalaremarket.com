# 조직 단위 전환 후 정리 작업 요약

작성일: 2025-11-12

## 1. 삭제된 임시 스크립트 파일들

프로젝트 루트 디렉토리의 임시 테스트/디버깅 스크립트들을 삭제했습니다:

- `check-all-orgs.js`
- `check-contribution-points.js`
- `check-duplicate-owners.js`
- `check-my-organizations.js`
- `check-organization-data.js`
- `check-schema.js`
- `check-user-data.js`
- `delete-duplicate-subs.js`
- `delete-sub-orgs.sql`
- `find-user-by-org.js`
- `force-delete-subs.js`
- `fix-reward-data.js`
- `test-api-endpoints.js`
- `test-login-points.js`

## 2. 삭제된 임시 API 엔드포인트들

`src/app/api/` 디렉토리의 임시/테스트 API 엔드포인트들을 삭제했습니다:

- `apply-admin-to-member/` - 관리자 역할 변경 임시 API
- `apply-seller-codes/` - 셀러 코드 적용 임시 API
- `check-user-status/` - 사용자 상태 확인 테스트 API
- `fix-cascade/` - CASCADE 제약조건 수정 임시 API
- `fix-notification-invitation-ids/` - 알림 초대 ID 수정 임시 API
- `run-cash-migration/` - 캐시 마이그레이션 실행 임시 API
- `run-notifications-migration/` - 알림 마이그레이션 실행 임시 API
- `test-orgs/` - 조직 테스트 API

## 3. 제거된 디버그 로그

다음 API 파일들에서 디버그용 console.log 제거:

### `src/app/api/cash/route.ts`
- 사용자 ID 로그
- 조직 정보 로그
- 캐시 조회 결과 로그

### `src/app/api/credits/daily-refill/route.ts`
- 사용자 ID 로그
- 조직 정보 로그
- 크레딧 조회 결과 로그
- 리필 완료 로그

### `src/app/api/cash/claim-login/route.ts`
- 사용자 ID 로그
- 조직 정보 로그
- 오늘 날짜 로그
- 일일 보상 기록 로그
- 캐시 지급 상세 로그
- 캐시 업데이트 성공 로그
- 로그인 보상 지급 완료 로그

## 4. DB 마이그레이션 (실행 필요)

### `database/migrations/cleanup_user_individual_columns.sql`

users 테이블에서 조직 단위로 전환된 컬럼들을 제거합니다:

제거할 컬럼:
- `accumulated_points` - 기여점수 (organizations 테이블로 이동)
- `last_login_date` - 마지막 로그인 날짜 (organizations 테이블로 이동)
- `last_order_date` - 마지막 주문 날짜 (organizations 테이블로 이동)
- `last_comment_date` - 마지막 댓글 날짜 (organizations 테이블로 이동)

**⚠️ 주의**: 이 마이그레이션은 아직 실행하지 않았습니다. 데이터 백업 후 실행해주세요.

## 5. 현재 시스템 구조

### 조직 단위 관리:
- `organizations.accumulated_points` - 기여점수
- `organizations.last_login_date` - 마지막 로그인
- `organizations.last_order_date` - 마지막 주문
- `organizations.last_comment_date` - 마지막 댓글
- `user_cash.organization_id` - 캐시 (조직 단위)
- `user_credits.organization_id` - 크레딧 (조직 단위)

### 사용자 단위 관리 (유지):
- `user_daily_rewards.user_id` - 일일 보상 기록 (사용자별 중복 방지)

## 6. 날짜/시간 처리 수정

크레딧 리필 API의 KST 변환 오류 수정:
- **수정 전**: `9 * 60 * 60 * 60 * 1000` (잘못된 계산 - 약 22.5일)
- **수정 후**: `9 * 60 * 60 * 1000` (올바른 계산 - 9시간)

모든 날짜/시간은 UTC로 저장되며, KST로 변환하여 표시/처리합니다.

## 7. 남아있는 작업

1. **DB 마이그레이션 실행**: `cleanup_user_individual_columns.sql` 실행
2. **Admin 페이지 수정**: 기여점수를 조직 기준으로 표시하도록 수정 필요
   - `src/app/admin/members/page.tsx`
   - `src/app/admin/customers/components/RegularCustomersTab.tsx`
   - `src/app/admin/customers/components/MarketingCustomersTab.tsx`

## 8. 확인 사항

모든 캐시, 크레딧, 기여점수가 조직 단위로 정상 작동하는지 확인:
- ✅ 로그인 보상 (캐시)
- ✅ 일일 크레딧 리필
- ✅ 로그인 점수 (기여점수)
- ✅ UI 표시
