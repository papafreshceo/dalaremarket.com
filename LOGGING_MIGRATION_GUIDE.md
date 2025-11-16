# 로깅 마이그레이션 가이드

## 개요

프로덕션 환경에서 민감한 정보 노출을 방지하고 성능을 개선하기 위해 `console.log`를 전용 로거로 교체합니다.

---

## 1. Logger 사용법

### Import
```typescript
import logger from '@/lib/logger';
```

### 기본 사용

#### ❌ Before (console.log)
```typescript
console.log('주문 조회 성공');
console.log('주문 개수:', orders.length);
console.error('주문 조회 실패:', error);
```

#### ✅ After (logger)
```typescript
logger.info('주문 조회 성공', { count: orders.length });
logger.error('주문 조회 실패', error);
```

---

## 2. 로그 레벨별 사용

| 레벨 | 용도 | 프로덕션 출력 | 예시 |
|------|------|--------------|------|
| `debug()` | 디버깅용 상세 정보 | ❌ 출력 안됨 | API 요청/응답, 쿼리 상세 |
| `info()` | 일반 정보 | ❌ 출력 안됨 | 작업 성공, 진행 상황 |
| `warn()` | 경고 | ✅ 출력 | 잠재적 문제, 권장하지 않는 동작 |
| `error()` | 에러 | ✅ 출력 | 실패, 예외 처리 |

### debug() - 개발 환경 전용
```typescript
// ❌ Before
console.log('🔍 [GET /api/orders] 주문 조회');
console.log('  - 필터:', { startDate, endDate });
console.log('  - 결과:', orders);

// ✅ After
logger.debug('주문 조회', {
  filters: { startDate, endDate },
  resultCount: orders?.length
});
```

### info() - 성공 메시지
```typescript
// ❌ Before
console.log('✅ 주문 등록 성공:', data.length, '개');

// ✅ After
logger.info('주문 등록 성공', { count: data.length });
```

### warn() - 경고
```typescript
// ❌ Before
console.warn('⚠️  유효하지 않은 데이터');

// ✅ After
logger.warn('유효하지 않은 데이터', { reason: 'empty_array' });
```

### error() - 에러
```typescript
// ❌ Before
console.error('❌ 주문 삽입 오류:', error);
console.error('❌ 오류 상세:', JSON.stringify(error, null, 2));

// ✅ After
logger.error('주문 삽입 오류', error);
// 민감한 정보는 자동으로 마스킹됨
```

---

## 3. 특수 목적 로그

### API 요청/응답
```typescript
// ❌ Before
console.log(`[${request.method}] ${request.url}`);

// ✅ After
logger.apiRequest(request.method, request.url, { userId: user.id });
logger.apiResponse(request.method, request.url, 200, { count: data.length });
```

### 데이터베이스 쿼리
```typescript
// ❌ Before
console.log('DB 쿼리:', 'SELECT * FROM orders');

// ✅ After
logger.dbQuery('SELECT', 'orders', { filters: { status: 'pending' } });
```

### 보안 이벤트
```typescript
// ❌ Before
console.warn('인증 실패:', userId);

// ✅ After
logger.security('인증 실패', { attemptedAction: 'admin_access' });
// 프로덕션에서도 기록됨, 민감한 정보는 자동 마스킹
```

### 성능 측정
```typescript
// ❌ Before
const start = Date.now();
// ... 작업 ...
console.log('작업 시간:', Date.now() - start, 'ms');

// ✅ After
const endTimer = logger.startTimer('데이터 처리');
// ... 작업 ...
endTimer(); // 자동으로 시간 측정 및 로그
```

---

## 4. 민감한 정보 자동 마스킹

Logger는 다음 필드를 자동으로 마스킹합니다:

```typescript
// 자동 마스킹되는 필드
const sensitiveFields = [
  'password', 'token', 'secret', 'api_key',
  'email', 'phone', 'address', 'birth',
  'credit_card', 'bank_account', 'ssn',
  // ... 등
];

// ❌ Before - 민감한 정보 노출 위험
console.log('사용자 정보:', {
  name: '홍길동',
  email: 'hong@example.com',  // 노출됨!
  phone: '010-1234-5678',     // 노출됨!
  password: 'secret123'        // 노출됨!
});

// ✅ After - 자동 마스킹
logger.debug('사용자 정보', {
  name: '홍길동',
  email: '***REDACTED***',    // 자동 마스킹
  phone: '***REDACTED***',    // 자동 마스킹
  password: '***REDACTED***'  // 자동 마스킹
});
```

---

## 5. API 파일 마이그레이션 체크리스트

```typescript
// 1. logger import 추가
import logger from '@/lib/logger';

// 2. console.log 제거
export async function GET(request: NextRequest) {
  try {
    // ❌ console.log('API 호출');
    // ✅ logger.debug('API 호출');

    const { data, error } = await supabase.from('table').select();

    if (error) {
      // ❌ console.error('에러:', error);
      // ✅ logger.error('데이터 조회 실패', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ❌ console.log('성공:', data.length);
    // ✅ logger.info('데이터 조회 성공', { count: data.length });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    // ❌ console.error('API 오류:', error);
    // ✅ logger.error('API 오류', error as Error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
```

---

## 6. 변환 규칙 요약

| Before | After | 설명 |
|--------|-------|------|
| `console.log('msg')` | `logger.debug('msg')` | 개발 전용 |
| `console.log('msg', data)` | `logger.debug('msg', { data })` | 컨텍스트 추가 |
| `console.error('msg', error)` | `logger.error('msg', error)` | 에러 로깅 |
| `console.warn('msg')` | `logger.warn('msg')` | 경고 |
| `console.info('msg')` | `logger.info('msg')` | 정보 |

---

## 7. 주의사항

### ❌ 하지 말아야 할 것
```typescript
// 민감한 정보를 직접 로그에 포함하지 마세요
logger.error('로그인 실패', { password: userInput }); // ❌

// 프로덕션에서 불필요한 debug 로그
logger.debug('무거운 객체:', hugeObject); // ❌ (성능 저하)
```

### ✅ 해야 할 것
```typescript
// 필요한 정보만 로그
logger.error('로그인 실패', { reason: 'invalid_password' }); // ✅

// 프로덕션에서 필요한 정보는 warn/error 사용
logger.error('중요한 에러', error); // ✅ (프로덕션에서도 기록됨)
```

---

## 8. 빠른 찾기/바꾸기

VS Code에서 정규식 찾기/바꾸기 사용:

### 찾기 패턴
```regex
console\.(log|error|warn|info)\(
```

### 수동 확인 필요
- 각 로그가 적절한 레벨인지 확인
- 민감한 정보가 포함되어 있는지 확인
- 프로덕션에서 필요한 로그인지 확인

---

## 9. 테스트

로거가 정상 작동하는지 확인:

```typescript
// 개발 환경 (.env.local에 NODE_ENV=development)
logger.debug('테스트'); // ✅ 출력됨
logger.info('테스트');  // ✅ 출력됨
logger.warn('테스트');  // ✅ 출력됨
logger.error('테스트'); // ✅ 출력됨

// 프로덕션 환경 (NODE_ENV=production)
logger.debug('테스트'); // ❌ 출력 안됨
logger.info('테스트');  // ❌ 출력 안됨
logger.warn('테스트');  // ✅ 출력됨
logger.error('테스트'); // ✅ 출력됨
```

---

## 10. 완료된 파일

- [x] `src/lib/logger.ts` (로거 유틸리티)
- [x] `src/app/api/integrated-orders/route.ts`
- [x] `src/app/api/platform-seller-orders/route.ts`
- [ ] `src/app/api/platform-orders/route.ts`
- [ ] `src/app/api/integrated-orders/bulk/route.ts`
- [ ] ... (나머지 API 파일들)

---

## 참고

- Logger 소스코드: `src/lib/logger.ts`
- 환경별 로깅 레벨은 `NODE_ENV` 환경 변수로 자동 결정됩니다
- 추가 질문은 개발팀에 문의하세요
