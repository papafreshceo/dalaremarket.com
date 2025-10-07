# 색상 시스템 가이드

달리아마켓의 통합 색상 시스템 사용 가이드입니다.

## 📋 목차

- [개요](#개요)
- [CSS 변수](#css-변수)
- [Tailwind 클래스](#tailwind-클래스)
- [라이트/다크 모드](#라이트다크-모드)
- [사용 예시](#사용-예시)
- [마이그레이션 가이드](#마이그레이션-가이드)

---

## 개요

프로젝트 전체의 색상을 CSS 변수로 통합하여 **라이트 모드와 다크 모드에서 일관성 있는 색상**을 제공합니다.

### 주요 색상 카테고리

1. **Primary (파란색)** - 메인 브랜드 컬러, 주요 버튼, 링크
2. **Success (초록색)** - 성공 상태, 완료, 승인
3. **Warning (주황색)** - 경고, 주의, 대기 상태
4. **Danger (빨간색)** - 에러, 삭제, 취소
5. **Gray (회색)** - 배경, 텍스트, 테두리

---

## CSS 변수

### 시맨틱 컬러 (권장)

용도별로 미리 매핑된 색상 변수입니다. **라이트/다크 모드가 자동으로 전환**됩니다.

```css
/* Primary */
--color-primary: 라이트: #2563eb, 다크: #60a5fa
--color-primary-hover: 라이트: #1d4ed8, 다크: #93c5fd

/* Success */
--color-success: 라이트: #16a34a, 다크: #4ade80
--color-success-hover: 라이트: #15803d, 다크: #86efac

/* Warning */
--color-warning: 라이트: #f59e0b, 다크: #fbbf24
--color-warning-hover: 라이트: #d97706, 다크: #fcd34d

/* Danger */
--color-danger: 라이트: #dc2626, 다크: #f87171
--color-danger-hover: 라이트: #b91c1c, 다크: #fca5a5

/* 배경 */
--color-background: 라이트: #ffffff, 다크: #1e1e1e
--color-background-secondary: 라이트: #f9fafb, 다크: #252526
--color-surface: 라이트: #ffffff, 다크: #2d2d30
--color-surface-hover: 라이트: #f9fafb, 다크: #3e3e42

/* 텍스트 */
--color-text: 라이트: #111827, 다크: #cccccc
--color-text-secondary: 라이트: #4b5563, 다크: #9c9c9c
--color-text-tertiary: 라이트: #6b7280, 다크: #6e6e6e
--color-text-disabled: 라이트: #9ca3af, 다크: #5a5a5a

/* 테두리 */
--color-border: 라이트: #e5e7eb, 다크: #3e3e42
--color-border-hover: 라이트: #d1d5db, 다크: #505050
--color-border-focus: 라이트: #3b82f6, 다크: #60a5fa
```

### 그라데이션 컬러 (선택적)

더 세밀한 제어가 필요한 경우 50~900 범위의 변수를 사용할 수 있습니다.

```css
/* Primary */
--color-primary-50 ~ --color-primary-900

/* Success */
--color-success-50 ~ --color-success-900

/* Warning */
--color-warning-50 ~ --color-warning-900

/* Danger */
--color-danger-50 ~ --color-danger-900

/* Gray */
--color-gray-50 ~ --color-gray-900
```

---

## Tailwind 클래스

### 기본 사용법

CSS 변수가 Tailwind 설정에 자동으로 매핑되어 있습니다.

```tsx
// ✅ 권장: 시맨틱 컬러 사용
<button className="bg-primary text-white hover:bg-primary-hover">
  저장
</button>

<div className="bg-success text-white">
  완료되었습니다
</div>

<p className="text-danger">
  오류가 발생했습니다
</p>

// ✅ 권장: 배경/텍스트/테두리
<div className="bg-background text-text border border-border">
  카드
</div>
```

### 그라데이션 사용

```tsx
// 50~900 범위의 색상
<div className="bg-primary-50">매우 연한 파란색</div>
<div className="bg-primary-500">중간 파란색</div>
<div className="bg-primary-900">매우 진한 파란색</div>

<span className="text-success-600">초록색 텍스트</span>
<div className="border-2 border-danger-500">빨간색 테두리</div>
```

---

## 라이트/다크 모드

### 자동 전환

시맨틱 컬러를 사용하면 **모드 전환이 자동**으로 이루어집니다.

```tsx
// ✅ 다크 모드 클래스 불필요
<button className="bg-primary text-white">
  버튼
</button>

// 라이트 모드: bg는 #2563eb
// 다크 모드: bg는 #60a5fa로 자동 전환
```

### 수동 조정이 필요한 경우

특정 모드에서만 다른 색상을 적용하려면 `dark:` 접두사를 사용합니다.

```tsx
// 라이트 모드: 파란색 배경
// 다크 모드: 초록색 배경 (예외적인 경우)
<div className="bg-primary dark:bg-success">
  특별한 영역
</div>
```

---

## 사용 예시

### 버튼

```tsx
// Primary 버튼
<button className="bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded">
  확인
</button>

// Success 버튼
<button className="bg-success text-white hover:bg-success-hover px-4 py-2 rounded">
  저장
</button>

// Danger 버튼
<button className="bg-danger text-white hover:bg-danger-hover px-4 py-2 rounded">
  삭제
</button>

// Outline 버튼
<button className="bg-transparent border-2 border-border text-text hover:bg-surface-hover px-4 py-2 rounded">
  취소
</button>
```

### 배지 (Badge)

```tsx
// Success 배지
<span className="bg-success-100 text-success-800 px-2 py-1 rounded-full text-xs">
  완료
</span>

// Warning 배지
<span className="bg-warning-100 text-warning-800 px-2 py-1 rounded-full text-xs">
  대기중
</span>

// Danger 배지
<span className="bg-danger-100 text-danger-800 px-2 py-1 rounded-full text-xs">
  취소
</span>
```

### 카드

```tsx
<div className="bg-surface border border-border rounded-lg p-4 hover:shadow-lg">
  <h3 className="text-text font-semibold">제목</h3>
  <p className="text-text-secondary mt-2">설명</p>
</div>
```

### 입력 필드

```tsx
<input
  className="bg-background border border-border text-text
             focus:border-border-focus focus:ring-2 focus:ring-primary-200
             px-3 py-2 rounded"
  type="text"
  placeholder="입력하세요"
/>
```

### 알림 (Toast/Alert)

```tsx
// Success 알림
<div className="bg-success-50 border-l-4 border-success text-success-800 p-4">
  <p>저장되었습니다!</p>
</div>

// Error 알림
<div className="bg-danger-50 border-l-4 border-danger text-danger-800 p-4">
  <p>오류가 발생했습니다.</p>
</div>

// Info 알림
<div className="bg-primary-50 border-l-4 border-primary text-primary-800 p-4">
  <p>정보: 새로운 업데이트가 있습니다.</p>
</div>
```

---

## 마이그레이션 가이드

### 기존 코드를 새 색상 시스템으로 변경하기

#### 1. HEX 코드 → CSS 변수

```tsx
// ❌ 변경 전
<button style={{ backgroundColor: '#10b981' }}>
  저장
</button>

// ✅ 변경 후
<button className="bg-success">
  저장
</button>
```

#### 2. 하드코딩된 다크 모드 → 자동 전환

```tsx
// ❌ 변경 전
<div className="bg-blue-600 dark:bg-blue-400">
  버튼
</div>

// ✅ 변경 후
<div className="bg-primary">
  버튼
</div>
```

#### 3. 인라인 스타일 → Tailwind 클래스

```tsx
// ❌ 변경 전
<div style={{
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  borderColor: '#2563eb'
}}>
  카드
</div>

// ✅ 변경 후
<div className="bg-primary text-white border border-primary-700">
  카드
</div>
```

#### 4. 색상별 변경 가이드

| 기존 색상 | 새 Tailwind 클래스 | 용도 |
|----------|-------------------|------|
| `#3b82f6`, `#2563eb` | `bg-primary` | Primary 버튼, 링크 |
| `#10b981`, `#059669` | `bg-success` | Success 버튼, 완료 상태 |
| `#ef4444`, `#dc2626` | `bg-danger` | Error, 삭제 버튼 |
| `#f59e0b`, `#fbbf24` | `bg-warning` | Warning, 경고 |
| `#ffffff` | `bg-background` | 페이지 배경 |
| `#f9fafb` | `bg-background-secondary` | 카드 배경 |
| `#111827` | `text-text` | 본문 텍스트 |
| `#6b7280` | `text-text-secondary` | 보조 텍스트 |
| `#e5e7eb` | `border-border` | 테두리 |

---

## 색상 선택 플로우차트

```
색상이 필요한가?
├─ 버튼/링크인가?
│  ├─ 주요 액션 → bg-primary
│  ├─ 성공/완료 → bg-success
│  ├─ 경고/주의 → bg-warning
│  └─ 삭제/에러 → bg-danger
│
├─ 배경인가?
│  ├─ 페이지 배경 → bg-background
│  ├─ 카드 배경 → bg-surface
│  └─ 호버 효과 → bg-surface-hover
│
├─ 텍스트인가?
│  ├─ 제목/본문 → text-text
│  ├─ 설명/라벨 → text-text-secondary
│  └─ 비활성화 → text-text-disabled
│
└─ 테두리인가?
   ├─ 기본 → border-border
   ├─ 호버 → border-border-hover
   └─ 포커스 → border-border-focus
```

---

## 주의사항

### ✅ DO (권장)

- CSS 변수 기반 Tailwind 클래스 사용
- 시맨틱 컬러 사용 (`bg-primary`, `bg-success` 등)
- 라이트/다크 모드 자동 전환 활용

### ❌ DON'T (지양)

- HEX 코드 직접 사용 (`#3b82f6`)
- 인라인 스타일로 색상 지정
- 불필요한 `dark:` 클래스 중복 사용

---

## 예외 사항

다음 경우에는 기존 Tailwind 기본 색상을 사용할 수 있습니다:

- **그라데이션 효과**: `from-blue-500 to-purple-500`
- **차트/그래프**: 고정된 색상이 필요한 데이터 시각화
- **브랜드 로고**: 항상 동일한 색상을 유지해야 하는 요소

---

## 문의

색상 시스템 관련 문의사항은 프로젝트 관리자에게 연락하세요.
