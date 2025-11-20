# useRequireAuth Hook 사용 가이드

## 개요

`useRequireAuth`는 보호된 페이지에서 사용자 인증을 확인하고 강제하는 React Hook입니다. 인증되지 않은 사용자는 자동으로 로그인 페이지로 리다이렉트됩니다.

## 주요 기능

- ✅ **자동 인증 확인**: 페이지 로드 시 사용자 인증 상태 확인
- ✅ **역할 기반 접근 제어**: 특정 역할을 가진 사용자만 접근 허용
- ✅ **승인 상태 확인**: 승인되지 않은 사용자 차단
- ✅ **실시간 감지**: 로그아웃/세션 만료 시 자동 리다이렉트
- ✅ **로딩 상태 제공**: 인증 확인 중 로딩 UI 표시 가능

## 기본 사용법

```tsx
'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function ProtectedPage() {
  const { user, loading, isAuthenticated } = useRequireAuth();

  // 로딩 중
  if (loading) {
    return <div>로딩 중...</div>;
  }

  // 인증되지 않음 (자동 리다이렉트 중)
  if (!isAuthenticated) {
    return null;
  }

  // 인증된 사용자만 볼 수 있는 컨텐츠
  return (
    <div>
      <h1>환영합니다, {user.email}!</h1>
      <p>이 페이지는 로그인한 사용자만 볼 수 있습니다.</p>
    </div>
  );
}
```

## 역할 기반 접근 제어

특정 역할을 가진 사용자만 접근할 수 있는 페이지:

```tsx
'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function AdminOnlyPage() {
  const { user, userRole, loading, isAuthenticated } = useRequireAuth({
    requiredRole: 'admin', // 'admin', 'super_admin', 'employee', 'user'
  });

  if (loading) return <div>로딩 중...</div>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <h1>관리자 전용 페이지</h1>
      <p>역할: {userRole}</p>
    </div>
  );
}
```

## 옵션

### `requiredRole`

- **타입**: `'admin' | 'super_admin' | 'employee' | 'user' | undefined`
- **기본값**: `undefined` (모든 역할 허용)
- **설명**: 특정 역할을 가진 사용자만 접근 허용

```tsx
useRequireAuth({ requiredRole: 'admin' });
```

### `requireApproved`

- **타입**: `boolean`
- **기본값**: `true`
- **설명**: 승인된 사용자만 접근 허용

```tsx
useRequireAuth({ requireApproved: true });
```

### `redirectTo`

- **타입**: `string`
- **기본값**: `'/platform?login=true'`
- **설명**: 인증 실패 시 리다이렉트할 경로

```tsx
useRequireAuth({ redirectTo: '/auth/login' });
```

## 반환값

### `user`

- **타입**: `User | null`
- **설명**: 현재 인증된 사용자 객체 (Supabase User)

### `userRole`

- **타입**: `string | null`
- **설명**: 사용자의 역할 (`'admin'`, `'employee'`, `'user'` 등)

### `loading`

- **타입**: `boolean`
- **설명**: 인증 상태 확인 중인지 여부

### `isAuthenticated`

- **타입**: `boolean`
- **설명**: 사용자가 인증되었는지 여부

## 고급 사용 예시

### 1. 조건부 렌더링

```tsx
const { user, userRole, loading, isAuthenticated } = useRequireAuth({
  requiredRole: 'admin'
});

if (loading) {
  return <LoadingSpinner />;
}

if (!isAuthenticated) {
  return null; // 리다이렉트 중
}

return (
  <div>
    {userRole === 'super_admin' && <SuperAdminPanel />}
    {userRole === 'admin' && <AdminPanel />}
    <RegularContent />
  </div>
);
```

### 2. 커스텀 로딩 UI

```tsx
const { user, loading } = useRequireAuth();

if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  );
}

// ... 나머지 컨텐츠
```

### 3. 사용자 정보 표시

```tsx
const { user, userRole } = useRequireAuth();

return (
  <div>
    <h1>프로필</h1>
    <p>이메일: {user?.email}</p>
    <p>역할: {userRole}</p>
  </div>
);
```

## 주의사항

1. **Client Component에서만 사용**: `'use client'` 지시어가 필요합니다.
2. **로딩 상태 확인 필수**: `loading`이 `false`가 될 때까지 대기해야 합니다.
3. **리다이렉트 중 렌더링 방지**: `!isAuthenticated`일 때 `null` 반환을 권장합니다.

## 보안 고려사항

- ✅ 서버 사이드 인증은 Middleware와 Server Component에서 처리됩니다.
- ✅ 이 Hook은 클라이언트 측 추가 보호 계층입니다.
- ✅ 민감한 API 호출은 서버 측에서 항상 인증을 재확인해야 합니다.
- ✅ RLS (Row Level Security) 정책으로 데이터베이스 레벨에서도 보호됩니다.

## 실시간 감지

Hook은 다음 이벤트를 자동으로 감지합니다:

- `SIGNED_OUT`: 로그아웃 시 자동 리다이렉트
- `TOKEN_REFRESHED`: 토큰 갱신 시 재검증
- `SIGNED_IN`: 로그인 시 재검증

## 예외 처리

인증 확인 중 오류가 발생하면 자동으로 로그인 페이지로 리다이렉트됩니다.

```tsx
// Hook 내부에서 자동 처리
try {
  // 인증 확인
} catch (error) {
  console.error('인증 확인 중 오류:', error);
  router.push(redirectTo); // 자동 리다이렉트
}
```

## 기존 인증 체계와의 비교

| 항목 | Middleware | Admin Layout | useRequireAuth Hook |
|------|-----------|--------------|---------------------|
| 실행 위치 | 서버 (요청 전) | 서버 (렌더링 전) | 클라이언트 (마운트 시) |
| 적용 범위 | 모든 경로 | /admin 경로 | 개별 페이지 |
| 역할 체크 | ✅ | ✅ | ✅ |
| 승인 체크 | ✅ | ✅ | ✅ |
| 실시간 감지 | ❌ | ❌ | ✅ |
| 로딩 상태 | ❌ | ❌ | ✅ |

## 권장 사용 시나리오

1. **필수 사용**: Client Component로 구현된 보호 페이지
2. **선택적 사용**: 추가 보안이 필요한 민감한 페이지
3. **권장하지 않음**: 이미 Server Component + Middleware로 충분히 보호된 페이지

## 문제 해결

### 무한 리다이렉트 루프

```tsx
// ❌ 잘못된 사용 (리다이렉트 경로가 현재 페이지)
useRequireAuth({ redirectTo: '/protected-page' }); // 현재 페이지가 /protected-page

// ✅ 올바른 사용
useRequireAuth({ redirectTo: '/auth/login' });
```

### Hook 호출 순서 오류

```tsx
// ❌ 조건부 Hook 호출
if (someCondition) {
  const { user } = useRequireAuth(); // 에러!
}

// ✅ 항상 최상위에서 호출
const { user } = useRequireAuth();
if (someCondition && user) {
  // ...
}
```

## 추가 리소스

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Next.js Middleware 문서](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [React Hooks 규칙](https://react.dev/reference/rules/rules-of-hooks)
