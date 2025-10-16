# API 보안 체크리스트

## ✅ 완료된 API

### 1. Permissions API (권한 관리)
- [x] GET `/api/permissions` - 관리자 이상만 조회
- [x] POST `/api/permissions` - 최고관리자만 생성
- [x] PATCH `/api/permissions` - 최고관리자만 수정
- [x] DELETE `/api/permissions` - 최고관리자만 삭제
- [x] POST `/api/permissions/bulk` - 최고관리자만 대량 업데이트

**보안 수준**: 🔒🔒🔒 높음 (최고관리자 전용)

---

## ⚠️ 우선순위 높음 - 즉시 보안 추가 필요

### 2. 통합 주문 API (Integrated Orders)
**위험도**: 🔴 높음 - 고객 정보 및 주문 데이터 포함

```typescript
// src/app/api/integrated-orders/route.ts
import { requireAdmin } from '@/lib/api-security'

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authorized) return auth.error

  // 삭제 로직...
}
```

필요한 작업:
- [ ] GET - 인증 필수
- [ ] POST - 직원 이상
- [ ] PATCH - 직원 이상
- [ ] DELETE - 관리자 이상
- [ ] `/bulk` - 관리자 이상
- [ ] `/soft-delete` - 관리자 이상

---

### 3. CS 관리 API (CS Records)
**위험도**: 🔴 높음 - 고객 불만 및 환불 정보

필요한 작업:
- [ ] GET `/api/cs-records` - 직원 이상
- [ ] POST - 직원 이상
- [ ] PATCH - 직원 이상
- [ ] DELETE - 관리자 이상
- [ ] `/bulk` - 관리자 이상

---

### 4. 고객 정보 API (Regular Customers)
**위험도**: 🔴 높음 - 개인정보 포함

필요한 작업:
- [ ] GET `/api/regular-customers` - 직원 이상
- [ ] POST - 직원 이상
- [ ] PATCH - 직원 이상
- [ ] DELETE - 관리자 이상
- [ ] `/bulk` - 관리자 이상

---

## ⚠️ 우선순위 중간 - 가능한 빨리 추가

### 5. 설정 API들 (Settings)
**위험도**: 🟡 중간 - 시스템 설정 변경

- [ ] `/api/cs-types` - 관리자 이상
- [ ] `/api/courier-settings` - 관리자 이상
- [ ] `/api/courier-templates` - 관리자 이상
- [ ] `/api/market-invoice-templates` - 관리자 이상
- [ ] `/api/vendor-templates` - 관리자 이상
- [ ] `/api/mapping-settings` - 관리자 이상
- [ ] `/api/market-templates` - 관리자 이상

---

### 6. 상품 및 옵션 API
**위험도**: 🟡 중간 - 상품 데이터

- [ ] `/api/option-products` - 직원 이상
- [ ] `/api/product-mapping` - 직원 이상

---

## 📝 우선순위 낮음 - 시간 날 때 추가

### 7. 기타 조회 API
**위험도**: 🟢 낮음 - 읽기 전용

- [ ] `/api/markets` - 인증만 필요
- [ ] `/api/vendors` - 인증만 필요
- [ ] `/api/standard-fields` - 인증만 필요

---

### 8. 챗봇 API
- [ ] `/api/chatbot` - 누구나 접근 가능 (공개)

---

## 빠른 적용 가이드

### 패턴 1: 간단한 관리자 체크

```typescript
import { requireAdmin } from '@/lib/api-security'

export async function DELETE(request: NextRequest) {
  // 🔒 이 한 줄 추가!
  const auth = await requireAdmin(request)
  if (!auth.authorized) return auth.error

  // 기존 코드...
  const supabase = await createClient()
  // ...
}
```

### 패턴 2: HTTP 메서드별 다른 권한

```typescript
import { requireAuth, requireAdmin } from '@/lib/api-security'

export async function GET(request: NextRequest) {
  // GET은 인증만
  const auth = await requireAuth(request)
  if (!auth.authorized) return auth.error

  // 조회 로직...
}

export async function DELETE(request: NextRequest) {
  // DELETE는 관리자
  const auth = await requireAdmin(request)
  if (!auth.authorized) return auth.error

  // 삭제 로직...
}
```

### 패턴 3: 최고관리자 전용

```typescript
import { requireSuperAdmin, auditLog } from '@/lib/api-security'

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (!auth.authorized) return auth.error

  // 감사 로그 기록
  auditLog('SYSTEM_SETTING_CHANGED', auth.userData, {
    setting: 'important_config'
  })

  // 시스템 설정 변경...
}
```

---

## 작업 순서 (권장)

### Week 1: 긴급 (고객 데이터)
1. ✅ `/api/permissions` - 완료
2. ⏳ `/api/integrated-orders` - 진행 중
3. ⏳ `/api/cs-records`
4. ⏳ `/api/regular-customers`

### Week 2: 중요 (시스템 설정)
5. ⏳ 모든 설정 API (`/api/*-settings`, `/api/*-templates`)
6. ⏳ 상품 관련 API

### Week 3: 기타
7. ⏳ 조회 전용 API
8. ⏳ 테스트 및 검증

---

## 테스트 방법

### 1. 브라우저 콘솔에서 테스트

```javascript
// 로그아웃 상태에서 테스트
fetch('/api/integrated-orders', { method: 'DELETE' })
  .then(r => r.json())
  .then(console.log)
// 예상 결과: { "success": false, "error": "인증이 필요합니다." }

// 직원 계정으로 권한 없는 API 호출
fetch('/api/permissions', { method: 'DELETE' })
  .then(r => r.json())
  .then(console.log)
// 예상 결과: { "success": false, "error": "이 작업을 수행할 권한이 없습니다." }
```

### 2. 각 역할별 테스트

| API | 최고관리자 | 관리자 | 직원 | 비로그인 |
|-----|-----------|--------|------|---------|
| GET /api/permissions | ✅ | ✅ | ❌ | ❌ |
| POST /api/permissions | ✅ | ❌ | ❌ | ❌ |
| DELETE /api/integrated-orders | ✅ | ✅ | ❌ | ❌ |
| POST /api/integrated-orders | ✅ | ✅ | ✅ | ❌ |

---

## 현재 진행 상황

- ✅ 완료: 2개 API (permissions)
- ⏳ 진행중: 0개
- ❌ 미완료: ~30개

**예상 작업 시간**: 1-2일 (API당 5-10분)

---

## 자동화 스크립트 (선택사항)

모든 API에 기본 인증을 한 번에 추가하는 스크립트를 만들 수 있습니다:

```bash
# 모든 route.ts 파일 찾기
find src/app/api -name "route.ts" -type f
```

하지만 각 API마다 필요한 권한 수준이 다르므로, 수동으로 적용하는 것을 권장합니다.

---

## 체크리스트 확인

작업 완료 시 체크:
- [ ] 인증 체크 추가
- [ ] 적절한 역할 권한 설정
- [ ] 에러 메시지 확인
- [ ] 감사 로그 추가 (중요 작업)
- [ ] 테스트 완료
- [ ] 이 문서 업데이트

---

**다음 작업**: `/api/integrated-orders/route.ts` 보안 추가
