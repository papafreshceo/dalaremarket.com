# Supabase Auth Rate Limit 해결 방법

## 🚨 문제 상황
- **AuthApiError: Request rate limit reached**
- **AuthSessionMissingError: Auth session missing!**

## 🔧 해결 방법

### 1. **즉시 해결 (브라우저)**
```javascript
// 1. 브라우저 개발자 도구 콘솔 열기 (F12)
// 2. 다음 코드 실행:

// 모든 인증 데이터 삭제
localStorage.clear();
sessionStorage.clear();
document.cookie.split(';').forEach(c => {
  const name = c.split('=')[0].trim();
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
});

// 3. 브라우저 완전히 닫기
// 4. 5분 대기 (Rate limit 해제 대기)
// 5. 브라우저 다시 열고 접속
```

### 2. **코드 수정 내용**

#### SessionProvider 개선
- ✅ 중복 요청 방지 (`isRefreshing` 플래그)
- ✅ Rate limit 에러 감지 및 대기
- ✅ 디바운싱 적용 (포커스 이벤트)
- ✅ 주기적 체크 간격 증가 (5분 → 10분)
- ✅ 불필요한 의존성 제거 (무한 루프 방지)

#### AdminClientLayout 개선
- ✅ 세션 체크 최소화
- ✅ Rate limit 에러시 리다이렉트 방지
- ✅ 의존성 배열 최적화

### 3. **예방 조치**

#### .env.local 설정 (선택사항)
```env
# Supabase Rate Limiting 완화
NEXT_PUBLIC_SUPABASE_AUTH_REFRESH_THRESHOLD=600000  # 10분 (600초)
NEXT_PUBLIC_SUPABASE_AUTH_AUTO_REFRESH_INTERVAL=3600000  # 1시간
```

### 4. **Rate Limit 정보**

Supabase Free tier 제한:
- **인증 API**: 시간당 100회
- **세션 갱신**: 5분당 10회
- **소셜 로그인**: 시간당 30회

### 5. **문제 지속 시**

1. **Supabase Dashboard 확인**
   - https://app.supabase.com → 프로젝트 → Authentication → Logs
   - Rate limit 에러 확인

2. **임시 해결책**
   - 다른 브라우저 사용
   - 시크릿 모드 사용
   - VPN 사용 (IP 변경)

3. **영구 해결책**
   - Supabase Pro 플랜 업그레이드
   - Self-hosted Supabase 사용

## ✅ 수정 완료 사항

1. **SessionProvider.tsx**
   - 중복 요청 방지 로직 추가
   - Rate limit 감지 및 60초 대기
   - 디바운싱 및 최적화

2. **AdminClientLayout.tsx**
   - 무한 루프 방지
   - 의존성 최적화

3. **Platform Layout**
   - 로그인 상태 체크 최적화

## 🎯 테스트 방법

1. 브라우저 캐시 완전 삭제
2. 5분 대기
3. 서버 재시작: `npm run dev`
4. 천천히 로그인 테스트 (급하게 여러 번 시도 X)

## ⚠️ 주의사항

- 로그인/로그아웃을 짧은 시간에 반복하지 말 것
- 개발 중에는 세션 체크 주기를 늘릴 것
- 프로덕션에서는 캐싱 전략 적용 필요
