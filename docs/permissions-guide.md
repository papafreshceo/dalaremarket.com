# 권한 관리 시스템 가이드

## 개요

달래마켓 관리자 시스템의 역할별 접근 권한 관리 기능입니다.

## 역할 종류

### 1. 최고관리자 (super_admin)
- 모든 페이지 접근 가능
- 모든 작업(생성/조회/수정/삭제) 가능
- 권한 설정 변경 가능

### 2. 관리자 (admin)
- 대부분의 페이지 접근 가능
- 설정 페이지는 조회만 가능
- 일부 삭제 권한 제한

### 3. 직원 (employee)
- 기본 업무 페이지만 접근 가능
- 주문, 구매, 재고 관리 가능
- 생성 및 삭제 권한 제한적

## 권한 설정 방법

### 1. 관리자 페이지 접속
```
/admin/settings/permissions
```

### 2. 역할 선택
- 최고관리자, 관리자, 직원 중 선택

### 3. 권한 설정
- **접근**: 페이지 접근 가능 여부
- **생성**: 새로운 데이터 생성 권한
- **조회**: 데이터 조회 권한
- **수정**: 기존 데이터 수정 권한
- **삭제**: 데이터 삭제 권한

### 4. 저장
- 변경사항 저장 시 즉시 모든 사용자에게 적용

## 코드에서 권한 사용하기

### 1. Hook을 사용한 권한 확인

```tsx
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const { canCreate, canUpdate, canDelete, loading } = usePermissions('/admin/products')

  if (loading) return <div>로딩 중...</div>

  return (
    <div>
      {canCreate && <button>새 상품 추가</button>}
      {canUpdate && <button>수정</button>}
      {canDelete && <button>삭제</button>}
    </div>
  )
}
```

### 2. PermissionGuard 컴포넌트

페이지 전체에 권한 체크 적용:

```tsx
import { PermissionGuard } from '@/components/auth/PermissionGuard'

export default function ProductsPage() {
  return (
    <PermissionGuard>
      <div>상품 관리 페이지 내용</div>
    </PermissionGuard>
  )
}
```

### 3. Can 컴포넌트

특정 작업에만 권한 체크:

```tsx
import { Can } from '@/components/auth/PermissionGuard'

function ProductList() {
  return (
    <div>
      <h1>상품 목록</h1>

      <Can action="create">
        <button>새 상품 추가</button>
      </Can>

      <Can action="delete">
        <button>선택 삭제</button>
      </Can>
    </div>
  )
}
```

### 4. RoleGuard 컴포넌트

역할 기반 렌더링:

```tsx
import { RoleGuard } from '@/components/auth/PermissionGuard'

function SettingsPage() {
  return (
    <div>
      <h1>설정</h1>

      <RoleGuard roles={['super_admin']}>
        <button>시스템 설정</button>
      </RoleGuard>

      <RoleGuard roles={['super_admin', 'admin']}>
        <button>일반 설정</button>
      </RoleGuard>
    </div>
  )
}
```

### 5. 서버 측 권한 확인

```tsx
import { checkUserPermissions, canCreate, canUpdate } from '@/lib/permissions'

// API 라우트에서
export async function POST(request: NextRequest) {
  const userId = 'user-id'

  if (!(await canCreate(userId, '/admin/products'))) {
    return NextResponse.json(
      { error: '권한이 없습니다.' },
      { status: 403 }
    )
  }

  // 작업 수행
}
```

## 데이터베이스 마이그레이션

### 마이그레이션 실행

```sql
-- database/migrations/057_create_permissions_system.sql 파일 참조
```

### 테이블 구조

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  page_path VARCHAR(200) NOT NULL,
  can_access BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, page_path)
);
```

## API 엔드포인트

### GET /api/permissions
역할별 권한 조회

```bash
GET /api/permissions?role=admin
```

### POST /api/permissions
권한 생성

```bash
POST /api/permissions
Content-Type: application/json

{
  "role": "admin",
  "page_path": "/admin/products",
  "can_access": true,
  "can_create": true,
  "can_read": true,
  "can_update": true,
  "can_delete": false
}
```

### PATCH /api/permissions
권한 수정

```bash
PATCH /api/permissions
Content-Type: application/json

{
  "id": "permission-id",
  "can_delete": true
}
```

### POST /api/permissions/bulk
권한 대량 업데이트

```bash
POST /api/permissions/bulk
Content-Type: application/json

{
  "role": "admin",
  "permissions": [...]
}
```

## 주의사항

1. **최고관리자 권한은 변경 불가**
   - super_admin 역할은 항상 모든 권한 보유

2. **접근 권한 우선**
   - 접근 권한이 없으면 다른 권한도 자동 비활성화

3. **권한 캐싱**
   - 클라이언트 측에서 5분간 권한 정보 캐싱
   - 즉시 반영이 필요한 경우 `clearPermissionsCache()` 호출

4. **실시간 적용**
   - 권한 변경 시 즉시 모든 사용자에게 적용
   - 사용자가 페이지를 새로고침하거나 재접속 시 반영

## 문제 해결

### 권한이 적용되지 않는 경우
1. 브라우저 캐시 삭제
2. 로그아웃 후 재로그인
3. 권한 캐시 초기화

```tsx
import { clearPermissionsCache } from '@/lib/permissions'

clearPermissionsCache()
```

### 데이터베이스 권한 확인

```sql
-- 특정 역할의 권한 조회
SELECT * FROM permissions WHERE role = 'admin';

-- 특정 페이지의 권한 조회
SELECT * FROM permissions WHERE page_path = '/admin/products';
```

## 추가 개발 사항

향후 추가할 수 있는 기능:
- 페이지별 세부 권한 (특정 기능만 제한)
- 사용자별 커스텀 권한
- 권한 그룹 기능
- 권한 변경 이력 추적
- 권한 템플릿 기능
