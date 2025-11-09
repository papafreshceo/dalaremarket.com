# 달래마켓 관리자 디자인 시스템

## 📋 목차
1. [페이지 레이아웃 구조](#페이지-레이아웃-구조)
2. [공통 컴포넌트 사용](#공통-컴포넌트-사용)
3. [컴포넌트 스타일 가이드](#컴포넌트-스타일-가이드)
4. [색상 시스템](#색상-시스템)
5. [타이포그래피](#타이포그래피)

---

## ⚠️ 중요: 공통 컴포넌트를 사용하세요!

### ❌ 절대 하지 마세요
```tsx
// 직접 스타일 하드코딩
<div className="bg-white shadow rounded-lg p-6">
  <input className="w-full px-3 py-2 border..." />
  <button className="px-4 py-2 bg-blue-600...">저장</button>
</div>
```

### ✅ 반드시 공통 컴포넌트 사용
```tsx
import { Button, Input, Card } from '@/components/ui'
import { PageLayout, PageSection, FormGrid } from '@/components/admin'

<PageLayout title="페이지 제목" description="설명">
  <PageSection>
    <FormGrid columns={2}>
      <Input label="필드명" />
    </FormGrid>
    <ActionBar>
      <Button variant="primary">저장</Button>
    </ActionBar>
  </PageSection>
</PageLayout>
```

---

## 공통 컴포넌트 사용

### 사용 가능한 컴포넌트

#### UI 컴포넌트 (`@/components/ui`)
- `Button` - 버튼
- `Card` - 카드
- `Input` - 입력 필드
- `Select` - 선택 박스
- `Badge` - 배지
- `DataTable` - 데이터 테이블
- `Modal` - 모달
- `Tabs` - 탭
- `DatePicker` - 날짜 선택

#### 관리자 컴포넌트 (`@/components/admin`)
- `PageLayout` - 페이지 레이아웃
- `PageSection` - 페이지 섹션
- `FormGrid` - 폼 그리드
- `ActionBar` - 액션 버튼 영역
- `InfoBanner` - 알림 배너

---

## 페이지 레이아웃 구조

### 기본 페이지 구조 (공통 컴포넌트 사용)
```tsx
import { Button, Input } from '@/components/ui'
import { PageLayout, PageSection, FormGrid, ActionBar } from '@/components/admin'

export default function PageName() {
  return (
    <PageLayout
      title="페이지 제목"
      description="페이지 설명"
      actions={<Button variant="primary">추가</Button>}
    >
      <PageSection title="섹션 제목">
        <FormGrid columns={2}>
          <Input label="필드 1" />
          <Input label="필드 2" />
        </FormGrid>

        <ActionBar position="right">
          <Button variant="outline">취소</Button>
          <Button variant="primary">저장</Button>
        </ActionBar>
      </PageSection>
    </PageLayout>
  )
}
```

---

## 컴포넌트 스타일 가이드

### 1. 페이지 헤더
```tsx
<div className="mb-6">
  <h1 className="text-2xl font-bold text-gray-900">페이지 제목</h1>
  <p className="mt-1 text-sm text-gray-600">페이지에 대한 간단한 설명을 여기에 작성합니다.</p>
</div>
```

### 2. 카드 컨테이너
```tsx
// 기본 카드
<div className="bg-white shadow rounded-lg overflow-hidden p-6">
  {/* 내용 */}
</div>

// 테이블 카드
<div className="bg-white shadow rounded-lg overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    {/* 테이블 내용 */}
  </table>
</div>
```

### 3. 버튼

#### 주요 버튼 (Primary)
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
  저장
</button>
```

#### 보조 버튼 (Secondary)
```tsx
<button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
  취소
</button>
```

#### 위험 버튼 (Danger)
```tsx
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
  삭제
</button>
```

#### 작은 버튼
```tsx
<button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
  작은 버튼
</button>
```

### 4. 필터/탭 버튼
```tsx
<button
  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
  }`}
>
  필터명
</button>
```

### 5. 입력 필드

#### 텍스트 입력
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    필드명
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="입력하세요"
  />
</div>
```

#### 선택 박스
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    선택 필드
  </label>
  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
    <option>옵션 1</option>
    <option>옵션 2</option>
  </select>
</div>
```

#### 텍스트 영역
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    설명
  </label>
  <textarea
    rows={4}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="내용을 입력하세요"
  />
</div>
```

### 6. 테이블

#### 기본 테이블
```tsx
<div className="bg-white shadow rounded-lg overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          컬럼명
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          데이터
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

#### 컴팩트 테이블 (높이 줄인 버전)
```tsx
<td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
  데이터
</td>
```

### 7. 알림 배너

#### 정보 (Info)
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div>
      <p className="text-sm font-medium text-blue-900">제목</p>
      <p className="text-sm text-blue-700 mt-1">설명 텍스트</p>
    </div>
  </div>
</div>
```

#### 경고 (Warning)
```tsx
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <div>
      <p className="text-sm font-medium text-yellow-900">주의사항</p>
      <p className="text-sm text-yellow-700 mt-1">경고 메시지</p>
    </div>
  </div>
</div>
```

#### 에러 (Error)
```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div>
      <p className="text-sm font-medium text-red-900">오류</p>
      <p className="text-sm text-red-700 mt-1">오류 메시지</p>
    </div>
  </div>
</div>
```

#### 성공 (Success)
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div>
      <p className="text-sm font-medium text-green-900">완료</p>
      <p className="text-sm text-green-700 mt-1">성공 메시지</p>
    </div>
  </div>
</div>
```

### 8. 배지 (Badge)

```tsx
// 성공
<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
  승인됨
</span>

// 대기
<span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
  대기중
</span>

// 위험
<span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
  거부됨
</span>

// 정보
<span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
  처리중
</span>

// 회색
<span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
  비활성
</span>
```

### 9. 로딩 상태
```tsx
{loading ? (
  <div className="p-6 text-center text-gray-500">로딩 중...</div>
) : (
  // 실제 컨텐츠
)}
```

### 10. 빈 상태
```tsx
{items.length === 0 ? (
  <div className="p-6 text-center text-gray-500">데이터가 없습니다.</div>
) : (
  // 실제 컨텐츠
)}
```

---

## 색상 시스템

### ⭐ CSS 변수 사용 (권장)

**절대 하드코딩된 색상을 사용하지 마세요!** 대신 `globals.css`에 정의된 CSS 변수를 사용하세요.

#### 배경 색상
```tsx
// ❌ 하드코딩
<button className="bg-blue-600 hover:bg-blue-700">

// ✅ CSS 변수 클래스 사용
<button className="bg-primary hover:bg-primary-hover">
<button className="bg-success hover:bg-success-hover">
<button className="bg-danger hover:bg-danger-hover">
<button className="bg-warning hover:bg-warning-hover">

// ✅ 직접 CSS 변수 사용
<div style={{ backgroundColor: 'var(--color-primary)' }}>
<div style={{ backgroundColor: 'var(--color-success)' }}>
```

#### 텍스트 색상
```tsx
<span className="text-primary">파란색 텍스트</span>
<span className="text-success">초록색 텍스트</span>
<span className="text-danger">빨간색 텍스트</span>
<span className="text-warning">노란색 텍스트</span>
```

#### 사용 가능한 CSS 변수
- `--color-primary` / `--color-primary-hover` (파란색)
- `--color-success` / `--color-success-hover` (초록색)
- `--color-danger` / `--color-danger-hover` (빨간색)
- `--color-warning` / `--color-warning-hover` (노란색)
- `--color-background` / `--color-background-secondary`
- `--color-text` / `--color-text-secondary` / `--color-text-tertiary`
- `--color-border` / `--color-border-hover`

### Tailwind 색상 (비권장)
CSS 변수를 사용할 수 없는 경우에만 사용:
- **Primary (파란색)**: `bg-blue-600`, `text-blue-600`
- **Success (초록색)**: `bg-green-600`, `text-green-600`
- **Warning (노란색)**: `bg-yellow-600`, `text-yellow-600`
- **Danger (빨간색)**: `bg-red-600`, `text-red-600`

### 배경 색상
- **흰색 카드**: `bg-white`
- **회색 배경**: `bg-gray-50`
- **강조 배경**: `bg-blue-50`

### 텍스트 색상
- **기본 텍스트**: `text-gray-900`
- **보조 텍스트**: `text-gray-600`
- **약한 텍스트**: `text-gray-500`

### 테두리 색상
- **기본 테두리**: `border-gray-300`
- **분할선**: `divide-gray-200`

---

## 타이포그래피

### 제목
- **페이지 제목**: `text-2xl font-bold text-gray-900`
- **섹션 제목**: `text-lg font-semibold text-gray-900`
- **서브 제목**: `text-base font-medium text-gray-900`

### 본문
- **기본 본문**: `text-sm text-gray-900`
- **설명 텍스트**: `text-sm text-gray-600`
- **작은 텍스트**: `text-xs text-gray-500`

### 라벨
- **폼 라벨**: `text-sm font-medium text-gray-700`
- **테이블 헤더**: `text-xs font-medium text-gray-500 uppercase`

---

## 반복 사용 패턴

### 1. 폼 레이아웃 (2열)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">필드 1</label>
    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">필드 2</label>
    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
  </div>
</div>
```

### 2. 액션 버튼 그룹
```tsx
<div className="flex justify-end gap-3">
  <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
    취소
  </button>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    저장
  </button>
</div>
```

### 3. 검색 바
```tsx
<div className="flex gap-2 mb-4">
  <input
    type="text"
    placeholder="검색..."
    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
  />
  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    검색
  </button>
</div>
```

---

## ❌ 피해야 할 패턴

### 나쁜 예시
```tsx
// ❌ 일관성 없는 간격
<div className="mb-2">
<div className="mb-8">

// ❌ 색상 일관성 없음
<button className="bg-purple-500">
<button className="bg-orange-400">

// ❌ 글자 크기 일관성 없음
<h1 className="text-3xl">
<h2 className="text-xl">

// ❌ 테두리 스타일 혼재
<div className="border-2">
<div className="border">
```

### 좋은 예시
```tsx
// ✅ 일관된 간격 (4, 6 단위 사용)
<div className="mb-4">
<div className="mb-6">

// ✅ 통일된 색상 팔레트
<button className="bg-blue-600">
<button className="bg-red-600">

// ✅ 일관된 글자 크기
<h1 className="text-2xl font-bold">
<h2 className="text-lg font-semibold">

// ✅ 통일된 테두리
<div className="border border-gray-300">
```

---

## 🎯 빠른 체크리스트

새 페이지를 만들 때 다음을 확인하세요:

- [ ] 페이지 헤더에 제목과 설명이 있는가?
- [ ] 카드는 `bg-white shadow rounded-lg`를 사용하는가?
- [ ] 버튼 색상이 시스템 색상(blue-600, red-600 등)을 따르는가?
- [ ] 간격이 일관적인가? (mb-4, mb-6, gap-3 등)
- [ ] 테이블 헤더가 `bg-gray-50`인가?
- [ ] 입력 필드에 focus 스타일이 있는가?
- [ ] 로딩/빈 상태가 처리되었는가?
- [ ] 반응형 디자인이 적용되었는가? (md:, lg: 등)

---

## 📚 참고 파일

잘 디자인된 페이지 예시:
- `src/app/admin/settings/permissions/page.tsx` - 권한 설정 (탭, 테이블, 버튼)
- `src/app/admin/settings/users/page.tsx` - 사용자 관리 (필터, 테이블)
- `src/app/admin/settings/page.tsx` - 설정 메인 (카드 그리드)
