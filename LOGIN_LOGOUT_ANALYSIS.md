# 달래마켓 로그인/로그아웃 전체 분석

## 📋 개요

달래마켓은 **관리자 화면**과 **플랫폼 화면** 두 가지 주요 화면으로 구성되어 있으며, 각각 독립적인 헤더와 인증 체크 로직을 가지고 있습니다.

---

## 🔐 인증 시스템 아키텍처

### 1. 기술 스택
- **인증 시스템**: Supabase Auth
- **세션 관리**: SSR 쿠키 기반 (Supabase SSR)
- **프레임워크**: Next.js 14 (App Router)
- **소셜 로그인**: 네이버, 카카오, 구글
- **알림**: OneSignal

### 2. 인증 흐름
```
사용자 → 로그인 시도 → Supabase Auth → 세션 생성 → 쿠키 저장 → 권한 확인 → 화면 렌더링
```

---

## 🖥️ 관리자 화면 (Admin)

### 파일 구조
```
src/app/admin/
├── layout.tsx (서버 컴포넌트 - 인증 체크)
├── admin-client-layout.tsx (클라이언트 컴포넌트 - UI)
└── 각종 관리자 페이지들
```

### 인증 플로우

#### 1. **서버 사이드 인증 체크** (`layout.tsx`)
```typescript
// 1. Supabase 인증 확인
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/auth/login');

// 2. 사용자 정보 및 승인 상태 확인
const { data: userData } = await supabase
  .from('users')
  .select('id, name, email, role, approved')
  .eq('id', user.id)
  .single();

// 3. 승인되지 않은 사용자 처리
if (!userData?.approved) {
  await supabase.auth.signOut();
  redirect('/auth/login?error=not-approved');
}

// 4. 관리자 권한 확인
const adminRoles = ['admin', 'employee', 'super_admin'];
if (!adminRoles.includes(userData.role)) {
  redirect('/');
}
```

#### 2. **관리자 헤더** (`admin-client-layout.tsx`)
- **사용자 정보 표시**: 이름, 이메일, 역할
- **알림**: 읽지 않은 알림 개수 표시 (60초마다 갱신)
- **빠른 액션**:
  - HTML 생성기
  - 달력 팝업
  - 플랫폼 화면 이동
  - 검색
  - 테마 토글
  - 로그아웃

#### 3. **3단 사이드바 시스템**
```
1단: 대카테고리 (운영, 상품, 주문 등)
2단: 중카테고리 (그룹)
3단: 세부 메뉴 아이템
```

---

## 🛒 플랫폼 화면 (Platform)

### 파일 구조
```
src/app/platform/
├── layout.tsx (클라이언트 컴포넌트)
└── 각종 플랫폼 페이지들

src/components/layout/
├── PlatformTopBar.tsx (플랫폼 헤더)
├── PlatformSidebar.tsx
└── MobileHeader.tsx
```

### 인증 특징

#### 1. **유연한 접근 권한**
- 로그인 없이도 기본적인 페이지 접근 가능
- 로그인 상태에 따라 UI 동적 변경

#### 2. **플랫폼 헤더** (`PlatformTopBar.tsx`)

**비로그인 상태:**
- 로고
- 로그인 버튼

**로그인 상태:**
```typescript
// 사용자 정보 가져오기
const { data: { user } } = await supabase.auth.getUser();

// 조직 정보 가져오기
const { data: orgData } = await supabase
  .from('organizations')
  .select('accumulated_points, tier, business_name, seller_code')
  .eq('id', userData.primary_organization_id)
  .single();
```

**표시 정보:**
- 주문 상태 배지 (등록, 확정, 준비중, 발송 등)
- 캐시 잔액 (30초마다 갱신)
- 크레딧 잔액
- 기여점수
- 티어 배지
- 관리자 화면 버튼 (권한이 있는 경우)
- 로그아웃 버튼

---

## 🔑 로그인 프로세스

### 1. **로그인 모달** (`AuthModal.tsx`)

#### 지원 로그인 방식:
1. **이메일/비밀번호 로그인**
2. **소셜 로그인** (네이버, 카카오, 구글)
3. **아이디 찾기** (SMS 인증)
4. **비밀번호 재설정**

#### 로그인 플로우:
```typescript
// 1. 이메일/비밀번호 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// 2. 승인 상태 확인
const { data: userData } = await supabase
  .from('users')
  .select('role, approved')
  .eq('id', data.user.id)
  .single();

if (!userData?.approved) {
  await supabase.auth.signOut();
  setError('계정이 아직 승인되지 않았습니다.');
  return;
}

// 3. 마지막 로그인 방식 업데이트
await supabase
  .from('users')
  .update({ last_login_provider: 'email' })
  .eq('id', data.user.id);

// 4. 페이지 새로고침 (서버 상태 갱신)
window.location.reload();
```

### 2. **소셜 로그인 특징**
- **최근 사용** 표시: 마지막으로 사용한 소셜 로그인 제공자 강조
- **자동 연동**: 같은 이메일로 가입된 계정 자동 연동

---

## 🚪 로그아웃 프로세스

### 통합 로그아웃 함수 (`logout.ts`)

#### 로그아웃 단계:
```typescript
export async function logout(router, redirectTo = '/platform') {
  // 1. OneSignal 로그아웃 (백그라운드)
  if (window.OneSignal) {
    await window.OneSignal.logout();
  }

  // 2. Player ID 비활성화 API 호출
  fetch('/api/notifications/player-id', {
    method: 'DELETE',
    headers,
  });

  // 3. 서버 쿠키 삭제
  await fetch('/api/auth/logout', {
    method: 'POST',
  });

  // 4. Supabase 로그아웃
  await supabase.auth.signOut();

  // 5. 로컬/세션 스토리지 정리
  localStorage.removeItem('ordersActiveTab');
  localStorage.removeItem('openChatWithUser');
  sessionStorage.clear();

  // 6. OneSignal IndexedDB 정리
  indexedDB.databases().then(databases => {
    for (const db of databases) {
      if (db.name?.includes('OneSignal')) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  // 7. 페이지 완전 초기화
  window.location.href = redirectTo;
}
```

---

## 🔄 미들웨어 (`middleware.ts`)

### 세션 관리
```typescript
export async function middleware(request: NextRequest) {
  // 1. Supabase 세션 갱신
  const response = await updateSession(request)
  
  // 2. 보안 헤더 추가
  response.headers.set('X-Robots-Tag', 'index, follow')
  
  // 3. API 캐시 방지
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0')
  }
  
  return response
}
```

---

## 🔒 보안 특징

### 1. **다층 인증 체크**
- 서버 컴포넌트에서 1차 체크
- 클라이언트에서 2차 체크
- API 호출 시 3차 체크

### 2. **승인 시스템**
- 신규 가입자는 `approved: false` 상태
- 관리자가 수동으로 승인 필요
- 미승인 사용자는 자동 로그아웃

### 3. **역할 기반 접근 제어 (RBAC)**
```typescript
const adminRoles = ['admin', 'employee', 'super_admin'];
const userRoles = ['user', 'buyer', 'seller'];
```

### 4. **세션 보안**
- HTTPOnly 쿠키 사용
- Secure 플래그 (HTTPS 환경)
- SameSite 설정
- CSRF 토큰 검증

---

## 📊 상태 관리

### 1. **Context Providers**
- `AdminAuthContext`: 관리자 인증 정보
- `UserBalanceContext`: 사용자 잔액 정보
- `ThemeContext`: 테마 설정
- `SidebarContext`: 사이드바 상태

### 2. **실시간 업데이트**
- 주문 상태: 30초마다 갱신
- 잔액 정보: 30초마다 갱신
- 알림 개수: 60초마다 갱신

---

## 🔧 개선 제안

### 1. **성능 최적화**
- 폴링 대신 WebSocket/SSE 사용 고려
- React Query 캐시 시간 최적화
- 불필요한 재렌더링 방지

### 2. **보안 강화**
- 2FA (이중 인증) 도입
- 세션 타임아웃 설정
- IP 기반 접근 제어

### 3. **UX 개선**
- 자동 로그인 유지 옵션
- 소셜 로그인 자동 연동 개선
- 로그인 실패 시 상세한 안내

### 4. **코드 구조**
- 인증 로직 중복 제거
- 공통 훅으로 통합 (`useAuth`)
- 에러 처리 표준화

---

## 📝 주의사항

1. **환경 변수 필수**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **브라우저 호환성**
   - IndexedDB 지원 필요 (OneSignal)
   - 쿠키 활성화 필수
   - JavaScript 활성화 필수

3. **모바일 대응**
   - 반응형 헤더
   - 모바일 전용 드로어 메뉴
   - 터치 제스처 지원