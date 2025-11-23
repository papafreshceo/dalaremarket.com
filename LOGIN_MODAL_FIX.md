# 로그인 모달 자동 닫힘 문제 해결 ✅

## 🔧 수정 내용

### 1. **AuthModal.tsx 수정**
로그인 성공 시 URL 파라미터를 정리한 후 페이지 이동:
```typescript
// 기존: window.location.reload() → URL 파라미터가 남아있음
// 수정: URL 파라미터 제거 후 이동

const url = new URL(window.location.href)
const redirect = url.searchParams.get('redirect')

// 로그인 관련 파라미터 제거
url.searchParams.delete('login')
url.searchParams.delete('error')
url.searchParams.delete('mode')
url.searchParams.delete('redirect')

// redirect가 있으면 해당 경로로, 없으면 현재 경로로
if (redirect) {
  window.location.href = redirect
} else {
  window.location.href = url.pathname + url.search
}
```

### 2. **platform/layout.tsx 수정**
로그인 상태일 때 자동으로 모달 닫기:
```typescript
useEffect(() => {
  const shouldShowLogin = searchParams?.get('login') === 'true'
  
  // 이미 로그인된 상태에서 login=true가 있으면 파라미터 정리
  if (user && shouldShowLogin) {
    const url = new URL(window.location.href)
    url.searchParams.delete('login')
    url.searchParams.delete('error')
    url.searchParams.delete('mode')
    url.searchParams.delete('redirect')
    router.replace(url.pathname + url.search)
    return
  }
  
  // 로그인되지 않은 상태에서만 모달 표시
  if (shouldShowLogin && !user) {
    setShowLoginModal(true)
  }
}, [searchParams, user, router])
```

### 3. **auth/callback/route.ts 수정**
소셜 로그인 콜백 후 URL 정리:
```typescript
// 로그인 성공 시 URL 파라미터 정리
const redirectUrl = new URL('/platform', requestUrl.origin)
redirectUrl.searchParams.delete('login')
redirectUrl.searchParams.delete('error')
redirectUrl.searchParams.delete('mode')
redirectUrl.searchParams.delete('redirect')
return NextResponse.redirect(redirectUrl)
```

### 4. **네이버 콜백 수정**
- 에러 시: `/platform?login=true&error=...`로 리다이렉트
- 성공 시: URL 파라미터 정리 후 이동

---

## ✅ 해결된 문제

1. **로그인 후 모달이 계속 표시되는 문제**
   - URL에 `?login=true`가 남아있어서 발생
   - 이제 로그인 성공 시 파라미터 자동 제거

2. **새로고침 시 다시 모달이 나타나는 문제**
   - 로그인 상태 체크 후 자동으로 파라미터 정리

3. **소셜 로그인 후 리다이렉트 문제**
   - 콜백 처리 시 URL 파라미터 정리

---

## 🎯 동작 방식

1. **로그인 시도**
   ```
   /platform?login=true → 모달 표시
   ```

2. **로그인 성공**
   ```
   → URL 파라미터 제거
   → /platform 또는 redirect 경로로 이동
   → 모달 자동 닫힘
   ```

3. **이미 로그인된 상태에서 ?login=true 접근**
   ```
   → 자동으로 파라미터 제거
   → 모달 표시하지 않음
   ```

---

## 📝 테스트 체크리스트

- [ ] 이메일 로그인 후 모달 자동 닫힘
- [ ] 소셜 로그인 후 모달 자동 닫힘
- [ ] 로그인 상태에서 `/platform?login=true` 접근 시 모달 표시 안됨
- [ ] 로그아웃 상태에서만 모달 표시
- [ ] 새로고침 후에도 정상 동작
- [ ] 관리자 페이지 리다이렉트 정상 작동
