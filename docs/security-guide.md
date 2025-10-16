# 보안 가이드: 프론트엔드 vs 백엔드 권한 체크

## ⚠️ 중요한 보안 개념

### 질문: 로컬 개발 폴더에 접근 권한이 있으면 뭐든 할 수 있나요?

**답변: 프론트엔드만 체크하면 그렇습니다!**

하지만 **백엔드에서도 권한을 체크**하면 안전합니다.

---

## 현재 시스템의 보안 레벨

### ❌ 프론트엔드만 체크 (위험)

```tsx
// 프론트엔드 (React 컴포넌트)
const { canDelete } = usePermissions('/admin/products')

{canDelete && <button onClick={deleteProduct}>삭제</button>}
```

**문제점:**
- 버튼만 안 보임
- 개발자 도구로 API 직접 호출 가능
- 코드 수정으로 우회 가능

```javascript
// 브라우저 콘솔에서 누구나 실행 가능
fetch('/api/products?id=123', { method: 'DELETE' })
// → 백엔드 체크 없으면 삭제됨! 🚨
```

---

### ✅ 백엔드도 체크 (안전)

```typescript
// API 라우트 (백엔드)
export const DELETE = withPermission(
  async (request, { user, userData }) => {
    // 여기 도달했다 = 권한 체크 통과!
    // 안전하게 삭제 수행
    await deleteProduct(id)
    return NextResponse.json({ success: true })
  },
  {
    requirePermission: {
      path: '/admin/products',
      action: 'delete'
    }
  }
)
```

**장점:**
- API 호출 시 서버에서 권한 재확인
- 프론트엔드 우회 불가능
- 데이터베이스 직접 접근도 보호

---

## 보안의 핵심 원칙

### 🎯 "클라이언트는 믿을 수 없다" (Never Trust the Client)

```
사용자 브라우저 (프론트엔드)
     ↓
    [권한 체크 1차] ← UI에서 버튼 숨김 (편의성)
     ↓
   API 호출
     ↓
서버 (백엔드)
     ↓
    [권한 체크 2차] ← 실제 보안 체크 (필수!)
     ↓
  데이터베이스
```

### 프론트엔드 권한 체크의 역할
✅ **사용자 경험 향상** (UX)
- 권한 없는 버튼 미리 숨김
- 불필요한 API 호출 방지
- 깔끔한 인터페이스

❌ **보안 목적이 아님!**
- 누구나 우회 가능
- 실제 보호 안 됨

### 백엔드 권한 체크의 역할
✅ **실제 보안 보호** (Security)
- 무조건 체크해야 함
- 우회 불가능
- 데이터 보호

---

## 실전 예시: 상품 삭제

### 😱 위험한 코드 (백엔드 체크 없음)

```typescript
// ❌ 나쁜 예: API 라우트 (route.ts)
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  // 권한 체크 없음! 누구나 삭제 가능 🚨
  await supabase.from('products').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
```

**공격 시나리오:**
```javascript
// 직원이 브라우저 콘솔에서 실행
fetch('/api/products?id=999', { method: 'DELETE' })
// → 삭제 권한 없어도 삭제됨! 💥
```

---

### 🛡️ 안전한 코드 (백엔드 체크 있음)

```typescript
// ✅ 좋은 예: API 라우트 (route.ts)
import { withPermission } from '@/lib/auth-middleware'

export const DELETE = withPermission(
  async (request: NextRequest, { user, userData }) => {
    const id = request.nextUrl.searchParams.get('id')

    // 권한 체크 통과한 사용자만 여기 도달!
    await supabase.from('products').delete().eq('id', id)

    // 로그 기록 (감사 추적)
    console.log(`${userData.name}(${userData.role})이 상품 ${id} 삭제`)

    return NextResponse.json({ success: true })
  },
  {
    requireAuth: true,
    requirePermission: {
      path: '/admin/products',
      action: 'delete'
    }
  }
)
```

**방어 결과:**
```javascript
// 직원이 브라우저 콘솔에서 실행
fetch('/api/products?id=999', { method: 'DELETE' })
// → Response:
// {
//   "success": false,
//   "error": "delete 권한이 없습니다.",
//   "action": "delete"
// }
```

---

## API 보안 체크리스트

모든 민감한 API에 적용해야 할 체크:

### 1. 인증 체크 (Authentication)
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json(
    { error: '로그인이 필요합니다' },
    { status: 401 }
  )
}
```

### 2. 승인 체크 (Approval)
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('approved')
  .eq('id', user.id)
  .single()

if (!userData.approved) {
  return NextResponse.json(
    { error: '승인되지 않은 사용자입니다' },
    { status: 403 }
  )
}
```

### 3. 권한 체크 (Authorization)
```typescript
const permissions = await checkUserPermissions(user.id, '/admin/products')
if (!permissions.canDelete) {
  return NextResponse.json(
    { error: '삭제 권한이 없습니다' },
    { status: 403 }
  )
}
```

### 4. 소유권 체크 (Ownership)
```typescript
const product = await getProduct(productId)
if (product.owner_id !== user.id && userData.role !== 'admin') {
  return NextResponse.json(
    { error: '본인이 등록한 상품만 삭제할 수 있습니다' },
    { status: 403 }
  )
}
```

---

## 사용 방법

### 방법 1: withPermission 헬퍼 사용 (권장)

```typescript
import { withPermission } from '@/lib/auth-middleware'

export const DELETE = withPermission(
  async (request, { user, userData }) => {
    // 안전한 코드 작성
  },
  {
    requireAuth: true,
    requirePermission: {
      path: '/admin/products',
      action: 'delete'
    }
  }
)
```

### 방법 2: 수동 체크 (세밀한 제어)

```typescript
import { withAuth } from '@/lib/auth-middleware'
import { checkUserPermissions } from '@/lib/permissions'

export async function DELETE(request: NextRequest) {
  // 1. 인증 체크
  const authResult = await withAuth(request)
  if (!authResult.authorized) {
    return authResult.response
  }

  // 2. 커스텀 비즈니스 로직
  const productId = request.nextUrl.searchParams.get('id')
  const product = await getProduct(productId)

  // 3. 소유권 체크
  if (product.owner_id !== authResult.user.id) {
    const permissions = await checkUserPermissions(
      authResult.user.id,
      '/admin/products'
    )

    if (!permissions.canDelete) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }
  }

  // 4. 안전하게 삭제
  await deleteProduct(productId)
  return NextResponse.json({ success: true })
}
```

---

## 역할별 권한 체크

super_admin만 접근 가능한 API:

```typescript
export const POST = withPermission(
  async (request, { user, userData }) => {
    // 시스템 설정 변경 등 민감한 작업
  },
  {
    requireRole: 'super_admin' // 최고관리자만!
  }
)
```

admin 이상만 접근:

```typescript
export const POST = withPermission(
  async (request, { user, userData }) => {
    // 관리 작업
  },
  {
    requireRole: ['super_admin', 'admin'] // 배열로 여러 역할
  }
)
```

---

## 기존 API에 보안 추가하기

### Before (위험)
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  // 누구나 호출 가능! 🚨
  const result = await createOrder(body)
  return NextResponse.json({ success: true, data: result })
}
```

### After (안전)
```typescript
import { withPermission } from '@/lib/auth-middleware'

export const POST = withPermission(
  async (request, { user, userData }) => {
    const body = await request.json()
    // 권한 있는 사용자만 호출 가능! ✅
    const result = await createOrder({
      ...body,
      created_by: user.id, // 누가 만들었는지 기록
    })
    return NextResponse.json({ success: true, data: result })
  },
  {
    requireAuth: true,
    requirePermission: {
      path: '/admin/order-platform',
      action: 'create'
    }
  }
)
```

---

## 요약

| 항목 | 프론트엔드 체크 | 백엔드 체크 |
|------|----------------|-------------|
| **목적** | 사용자 편의성 (UX) | 실제 보안 (Security) |
| **우회 가능?** | ✅ 쉽게 우회 가능 | ❌ 우회 불가능 |
| **필수 여부** | 선택 (권장) | **필수!** |
| **구현 위치** | React 컴포넌트 | API 라우트 |
| **예시** | 버튼 숨김 | 권한 없으면 403 에러 |

## 핵심 원칙 🎯

1. **프론트엔드 체크는 UX 향상용** - 보안 아님!
2. **백엔드 체크는 필수** - 모든 API에 적용!
3. **절대 클라이언트를 믿지 말 것**
4. **중요한 작업은 항상 서버에서 재확인**

---

## 다음 단계

모든 기존 API 라우트에 보안 체크를 추가해야 합니다:

1. ✅ `src/app/api/permissions/route.ts` - 권한 API
2. ⚠️ `src/app/api/products/*` - 상품 API
3. ⚠️ `src/app/api/orders/*` - 주문 API
4. ⚠️ `src/app/api/partners/*` - 거래처 API
5. ⚠️ 기타 모든 데이터 수정 API

**작업량이 많으니 우선순위를 정해서 점진적으로 적용하세요!**
