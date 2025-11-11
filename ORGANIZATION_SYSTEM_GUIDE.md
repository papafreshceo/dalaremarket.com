# 조직(Organization) 시스템 가이드

## 개요

회원사의 다수 담당자를 지원하는 조직 시스템입니다. 신선푸드 대표와 직원들이 같은 계정(조직)에서 활동하며 주문, 발주서 등의 데이터를 공유할 수 있습니다.

## 주요 기능

### 1. 조직 구조
- **1개 조직(회사) = 여러 멤버(직원)**
- 각 멤버는 개별 계정을 가지지만 같은 조직의 데이터를 공유
- 조직 소유자/관리자/일반 멤버 등 역할 구분

### 2. 데이터 공유
같은 조직의 모든 멤버는 다음 데이터를 공유합니다:
- 주문 (integrated_orders)
- 발주서 (platform_orders)
- 캐시 (user_cash) - 선택적
- 크레딧 (user_credits) - 선택적
- 정산 정보

### 3. 역할 및 권한

#### Owner (소유자)
- 조직 생성자
- 모든 권한 보유
- 조직 설정 변경 가능
- 멤버 관리 가능

#### Admin (관리자)
- 멤버 관리 가능
- 모든 데이터 접근 가능
- 주문/상품 관리 가능
- 재무 정보 조회 가능

#### Member (일반 멤버)
- 주문 관리 가능
- 상품 관리 가능
- 재무 정보 조회 제한 (설정에 따라)
- 멤버 관리 불가

### 4. 멤버 초대 프로세스

```
1. 관리자가 직원 이메일로 초대 발송
   ↓
2. 직원이 이메일로 초대 링크 수신
   ↓
3. 직원이 초대 링크로 접속 후 회원가입/로그인
   ↓
4. 자동으로 조직 멤버로 추가됨
```

## 데이터베이스 스키마

### organizations (조직)
```sql
- id: UUID (PK)
- name: 조직명 (회사명)
- business_number: 사업자번호
- owner_id: 소유자 ID (users.id 참조)
- commission_rate: 수수료율
- settlement_cycle: 정산 주기
- is_active: 활성화 여부
- max_members: 최대 멤버 수
```

### organization_members (조직 멤버)
```sql
- id: UUID (PK)
- organization_id: 조직 ID
- user_id: 사용자 ID
- role: 역할 (owner, admin, member)
- status: 상태 (active, invited, suspended)
- can_manage_orders: 주문 관리 권한
- can_manage_products: 상품 관리 권한
- can_manage_members: 멤버 관리 권한
- can_view_financials: 재무 정보 조회 권한
```

### organization_invitations (초대)
```sql
- id: UUID (PK)
- organization_id: 조직 ID
- inviter_id: 초대한 사람 ID
- email: 초대할 이메일
- role: 부여할 역할
- token: 초대 토큰 (UUID)
- status: 상태 (pending, accepted, expired, cancelled)
- expires_at: 만료 시간 (기본 7일)
```

### 기존 테이블 수정
```sql
-- users 테이블
ALTER TABLE users
ADD COLUMN primary_organization_id UUID; -- 주 소속 조직

-- integrated_orders 테이블
ALTER TABLE integrated_orders
ADD COLUMN organization_id UUID; -- 주문이 속한 조직

-- platform_orders 테이블 (있다면)
ALTER TABLE platform_orders
ADD COLUMN organization_id UUID;

-- user_cash, user_credits 테이블 (조직 단위 관리 선택적)
ALTER TABLE user_cash
ADD COLUMN organization_id UUID;

ALTER TABLE user_credits
ADD COLUMN organization_id UUID;
```

## API 엔드포인트

### 조직 관리
```
GET    /api/organizations          # 내가 속한 조직 목록
POST   /api/organizations          # 새 조직 생성
PATCH  /api/organizations?id=xxx   # 조직 정보 수정
```

### 멤버 관리
```
GET    /api/organizations/members?organization_id=xxx  # 멤버 목록
PATCH  /api/organizations/members?organization_id=xxx  # 멤버 역할/권한 수정
DELETE /api/organizations/members?organization_id=xxx&member_id=xxx  # 멤버 제거
```

### 초대 관리
```
POST   /api/organizations/invite?organization_id=xxx  # 멤버 초대
GET    /api/organizations/invite?organization_id=xxx  # 초대 목록
DELETE /api/organizations/invite?invitation_id=xxx    # 초대 취소
```

### 초대 수락
```
GET    /api/organizations/join?token=xxx  # 초대 정보 조회
POST   /api/organizations/join            # 초대 수락 및 조직 가입
```

## 설치 및 마이그레이션

### 1. 마이그레이션 실행

```bash
# Supabase SQL Editor에서 실행
# database/migrations/add_organization_system.sql
```

마이그레이션은 다음 작업을 수행합니다:
- 조직 관련 테이블 3개 생성
- 기존 테이블에 organization_id 컬럼 추가
- RLS 정책 설정
- **기존 사용자를 위한 개인 조직 자동 생성**
- 기존 주문에 조직 ID 자동 매핑

### 2. 자동 조직 생성 시스템

**모든 신규 회원에게 자동으로 조직이 생성됩니다:**

```
회원가입
  ↓
기본 조직 자동 생성
  - 조직명: "[이름]의 조직"
  - 예: "홍길동의 조직"
  ↓
마이페이지에서 회사 정보 입력 시
  - 조직명 자동 변경: "[이름]의 조직" → "신선푸드"
  - 사업자 정보 동기화
```

**조직명 우선순위:**
1. `company_name` (회사명) - 입력 시 자동 변경
2. `profile_name`의 조직 - 프로필명이 있으면
3. `name`의 조직 - 이름이 있으면
4. `email`의 조직 - 최후 수단

### 2. 환경 변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있는지 확인:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 사용 방법

### 조직 페이지 접속

```
/platform/organization
```

이 페이지에서:
- 현재 조직 정보 확인
- 조직 멤버 목록 조회
- 멤버 초대 (관리자만)
- 멤버 역할 변경 (관리자만)
- 발송된 초대 관리 (관리자만)

### 프로그래밍 방식 사용

#### 서버 컴포넌트에서 조직 정보 가져오기
```typescript
import { getUserOrganizationContext } from '@/lib/organization-utils'

const context = await getUserOrganizationContext(userId)
if (context) {
  console.log('조직:', context.organization)
  console.log('내 역할:', context.member.role)
  console.log('소유자 여부:', context.is_owner)
  console.log('관리자 여부:', context.is_admin)
}
```

#### 클라이언트 컴포넌트에서 사용
```typescript
import { getUserPrimaryOrganizationClient } from '@/lib/organization-utils'

const organization = await getUserPrimaryOrganizationClient(userId)
```

#### 권한 확인
```typescript
import {
  canManageMembers,
  canManageOrders,
  canViewFinancials,
} from '@/lib/organization-utils'

const canManage = await canManageMembers(organizationId, userId)
```

## 자동 적용되는 기능

### 1. 주문 조회 필터링
`/api/integrated-orders` GET 요청 시:
- 관리자: 모든 주문 조회
- 일반 사용자: 같은 조직의 주문만 조회
- 조직 없는 사용자: 본인 주문만 조회

### 2. 주문 등록 시 조직 ID 자동 설정
다음 API에서 자동으로 조직 ID가 설정됩니다:
- `POST /api/integrated-orders` (단건)
- `POST /api/integrated-orders/bulk` (대량)
- `POST /api/platform-orders` (플랫폼 주문)

### 3. 데이터 보안 (RLS)
- 조직 정보는 해당 조직 멤버만 조회 가능
- 멤버 정보는 같은 조직 멤버만 조회 가능
- 초대 정보는 조직 관리자만 조회/관리 가능

## 주의사항

### 1. 기존 사용자 마이그레이션
- 마이그레이션 실행 시 기존 partner/customer 역할 사용자에게 개인 조직이 자동 생성됩니다
- 기존 주문에 자동으로 조직 ID가 매핑됩니다

### 2. 캐시/크레딧 공유
- 기본적으로 캐시/크레딧은 개인 단위로 관리됩니다
- 조직 단위로 관리하려면 마이그레이션 파일의 주석 처리된 부분을 해제하세요

### 3. 멤버 제거
- 멤버 제거 시 실제로 삭제되지 않고 `status`가 `suspended`로 변경됩니다
- 제거된 멤버의 `primary_organization_id`는 초기화됩니다

### 4. 조직 소유자
- 소유자는 역할 변경 및 제거가 불가능합니다
- 소유자 권한 이전은 별도 기능으로 구현 필요 (향후 추가)

## 향후 개선 사항

### 1. 이메일 발송
현재는 초대 토큰만 생성하고 이메일은 발송하지 않습니다.
초대 링크를 복사하여 수동으로 전달해야 합니다.

향후 SendGrid, AWS SES 등을 연동하여 자동 이메일 발송 구현 예정.

### 2. 조직 소유자 이전
소유자가 다른 멤버에게 소유권을 이전하는 기능 추가 예정.

### 3. 멤버 활동 로그
각 멤버의 활동(주문 등록, 수정, 삭제 등)을 추적하는 로그 시스템 추가 예정.

### 4. 조직 플랜 관리
- 무료 플랜: 최대 3명
- 기본 플랜: 최대 10명
- 프로 플랜: 무제한

### 5. 조직 대시보드
조직 단위 통계 및 분석 대시보드 추가 예정.

## 문의

시스템 관련 문의사항은 개발팀에 문의해주세요.
