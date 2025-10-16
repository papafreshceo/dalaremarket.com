# 권한 관리 시스템

## 빠른 시작

### 1. 데이터베이스 마이그레이션 실행

Supabase SQL Editor에서 다음 파일을 실행하세요:
```
database/migrations/057_create_permissions_system.sql
```

또는 Node.js 스크립트 사용:
```bash
node scripts/run-permissions-migration.js
```

### 2. 권한 설정 페이지 접속

```
http://localhost:3000/admin/settings/permissions
```

### 3. 기본 사용법

```tsx
// 페이지에 권한 가드 적용
import { PermissionGuard } from '@/components/auth/PermissionGuard'

export default function MyPage() {
  return (
    <PermissionGuard>
      {/* 보호된 콘텐츠 */}
    </PermissionGuard>
  )
}

// 특정 작업에만 권한 적용
import { Can } from '@/components/auth/PermissionGuard'

<Can action="create">
  <button>생성</button>
</Can>

// Hook으로 권한 확인
import { usePermissions } from '@/hooks/usePermissions'

const { canCreate, canUpdate } = usePermissions('/admin/products')
```

## 주요 파일

### 데이터베이스
- `database/migrations/057_create_permissions_system.sql` - 권한 테이블 마이그레이션

### 타입 정의
- `src/types/permissions.ts` - 권한 관련 타입 정의

### API
- `src/app/api/permissions/route.ts` - 권한 CRUD API
- `src/app/api/permissions/bulk/route.ts` - 대량 업데이트 API

### 유틸리티
- `src/lib/permissions.ts` - 권한 체크 유틸리티 함수
- `src/hooks/usePermissions.ts` - 권한 체크 React Hook

### 컴포넌트
- `src/components/auth/PermissionGuard.tsx` - 권한 가드 컴포넌트

### UI
- `src/app/admin/settings/permissions/page.tsx` - 권한 설정 페이지

## 역할별 기본 권한

### 최고관리자 (super_admin)
✅ 모든 페이지 접근
✅ 모든 작업 가능
✅ 권한 설정 변경 가능

### 관리자 (admin)
✅ 대부분 페이지 접근
✅ 주문, 구매, 농가, 재고 관리
⚠️ 설정은 조회만 가능
❌ 일부 삭제 권한 제한

### 직원 (employee)
⚠️ 기본 업무 페이지만 접근
⚠️ 주문, 구매 처리 가능
❌ 생성, 삭제 권한 제한적

## 페이지별 권한

| 페이지 | 경로 | super_admin | admin | employee |
|--------|------|-------------|-------|----------|
| 대시보드 | `/admin/dashboard` | ✅ | ✅ | ✅ (조회만) |
| 상품관리 | `/admin/products` | ✅ | ✅ | ✅ (조회/수정) |
| 플랫폼주문 | `/admin/order-platform` | ✅ | ✅ | ✅ |
| 주문통합관리 | `/admin/order-integration` | ✅ | ✅ | ✅ |
| 구매관리 | `/admin/purchase` | ✅ | ✅ | ✅ |
| 농가관리 | `/admin/farms` | ✅ | ✅ | ❌ |
| 재고관리 | `/admin/inventory` | ✅ | ✅ | ✅ (조회/수정) |
| 고객관리 | `/admin/customers` | ✅ | ✅ | ✅ (조회만) |
| 거래처관리 | `/admin/partners` | ✅ | ✅ | ❌ |
| 지출관리 | `/admin/expense` | ✅ | ✅ | ❌ |
| 근로자관리 | `/admin/workers` | ✅ | ✅ | ❌ |
| 전자문서 | `/admin/documents` | ✅ | ✅ | ✅ (조회/생성) |
| 업무계획 | `/admin/planning` | ✅ | ✅ | ✅ |
| 설정 | `/admin/settings` | ✅ | ✅ (조회/수정) | ❌ |

## 사용 예시

### 예시 1: 페이지 전체 보호

```tsx
// src/app/admin/products/page.tsx
import { PermissionGuard } from '@/components/auth/PermissionGuard'

export default function ProductsPage() {
  return (
    <PermissionGuard>
      <h1>상품 관리</h1>
      {/* 페이지 콘텐츠 */}
    </PermissionGuard>
  )
}
```

### 예시 2: 버튼별 권한 제어

```tsx
import { Can } from '@/components/auth/PermissionGuard'

function ProductActions() {
  return (
    <div className="flex gap-2">
      <Can action="create">
        <button>새 상품 추가</button>
      </Can>

      <Can action="update">
        <button>수정</button>
      </Can>

      <Can action="delete">
        <button className="text-red-600">삭제</button>
      </Can>
    </div>
  )
}
```

### 예시 3: 조건부 렌더링

```tsx
import { usePermissions } from '@/hooks/usePermissions'

function ProductList() {
  const { canCreate, canDelete } = usePermissions('/admin/products')

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1>상품 목록</h1>
        {canCreate && (
          <button className="btn-primary">
            새 상품 추가
          </button>
        )}
      </div>

      <table>
        {/* 상품 목록 */}
        {canDelete && <th>삭제</th>}
      </table>
    </div>
  )
}
```

### 예시 4: API에서 권한 확인

```tsx
// src/app/api/products/route.ts
import { createClient } from '@/lib/supabase/server'
import { canCreate } from '@/lib/permissions'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    )
  }

  // 권한 확인
  if (!(await canCreate(user.id, '/admin/products'))) {
    return NextResponse.json(
      { error: '상품을 생성할 권한이 없습니다.' },
      { status: 403 }
    )
  }

  // 상품 생성 로직
  // ...
}
```

### 예시 5: 역할별 메뉴 표시

```tsx
import { RoleGuard } from '@/components/auth/PermissionGuard'

function SettingsMenu() {
  return (
    <nav>
      <RoleGuard roles={['super_admin', 'admin']}>
        <a href="/admin/settings/users">사용자 관리</a>
      </RoleGuard>

      <RoleGuard roles={['super_admin']}>
        <a href="/admin/settings/permissions">권한 설정</a>
      </RoleGuard>

      <a href="/admin/settings/profile">내 프로필</a>
    </nav>
  )
}
```

## 권한 캐싱

클라이언트 측에서 권한 정보를 5분간 캐싱합니다.

### 캐시 초기화

```tsx
import { clearPermissionsCache, clearUserPermissionsCache } from '@/lib/permissions'

// 모든 권한 캐시 초기화
clearPermissionsCache()

// 특정 사용자의 권한 캐시만 초기화
clearUserPermissionsCache(userId)
```

## 문제 해결

### Q: 권한을 변경했는데 적용이 안 됩니다.
A: 브라우저를 새로고침하거나, 로그아웃 후 재로그인하세요. 캐시가 5분간 유지됩니다.

### Q: 특정 사용자만 권한을 다르게 설정하고 싶습니다.
A: 현재는 역할 기반 권한만 지원합니다. 사용자별 권한은 향후 추가 예정입니다.

### Q: 페이지별이 아닌 기능별 권한을 설정하고 싶습니다.
A: 현재는 페이지 단위 권한을 지원합니다. 기능별 권한은 `Can` 컴포넌트로 구현하세요.

## 더 자세한 정보

자세한 사용법은 [권한 관리 가이드](./docs/permissions-guide.md)를 참조하세요.
