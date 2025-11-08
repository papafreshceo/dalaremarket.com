# 업무도구 개발 완전 가이드

## 목차
1. [개요](#개요)
2. [크레딧 과금 시스템](#크레딧-과금-시스템)
3. [관리자 설정](#관리자-설정)
4. [도구 개발 절차](#도구-개발-절차)
5. [모달 UI 디자인 가이드](#모달-ui-디자인-가이드)
6. [예제 코드](#예제-코드)

---

## 개요

업무도구는 크레딧 기반 과금 시스템을 사용하며, 관리자 페이지에서 유연하게 설정 가능합니다.

### 주요 파일
- **모달 컨테이너**: `src/components/tools/ToolModal.tsx`
- **참조 디자인**: `src/components/tools/MarginCalculator.tsx`
- **과금 훅**: `src/hooks/useCreditOnAction.ts`, `src/hooks/useHourlyCredit.ts`
- **관리자 페이지**: `src/app/admin/settings/tools/page.tsx`

---

## 크레딧 과금 시스템

### 1. 과금 방식 (3가지)

#### 1-1. 열 때 차감 (on_open)
모달을 열 때 1회만 차감됩니다.

```typescript
// 별도 훅 불필요 - ToolModal에서 자동 처리
```

#### 1-2. 버튼 클릭 시 차감 (on_action)
특정 버튼 클릭 시마다 차감됩니다.

```typescript
import { useCreditOnAction } from '@/hooks/useCreditOnAction';

export default function OrderIntegrationTool() {
  const { executeWithCredit, isProcessing } = useCreditOnAction('order-integration');

  const handleIntegrate = async () => {
    // 버튼 ID를 전달하여 해당 버튼의 크레딧 차감
    const canProceed = await executeWithCredit('integrate'); // 5 크레딧
    if (!canProceed) return;

    // 실제 통합 로직...
  };

  const handleDownload = async () => {
    const canProceed = await executeWithCredit('download'); // 1 크레딧
    if (!canProceed) return;

    // 다운로드 로직...
  };

  return (
    <>
      <button onClick={handleIntegrate} disabled={isProcessing}>
        통합하기
      </button>
      <button onClick={handleDownload} disabled={isProcessing}>
        엑셀 다운로드
      </button>
    </>
  );
}
```

#### 1-3. 시간당 차감 (hourly)
설정한 간격마다 반복 차감됩니다 (선결제 방식).

```typescript
import { useHourlyCredit } from '@/hooks/useHourlyCredit';

export default function MarginCalculatorTool({ onClose }: { onClose: () => void }) {
  // 60분마다 차감, 크레딧 부족 시 모달 자동 종료
  const { isActive, remainingMinutes } = useHourlyCredit('margin-calculator', 60, onClose);

  return (
    <div>
      {isActive && (
        <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '4px', fontSize: '12px' }}>
          ⏱️ 남은 시간: {remainingMinutes}분 (다음 차감까지)
        </div>
      )}
      {/* 도구 UI... */}
    </div>
  );
}
```

**작동 방식:**
1. 모달 열 때 첫 차감 (예: 5 크레딧)
2. 1시간 사용
3. 1시간 후 다시 차감 (다음 1시간분 선결제)
4. 크레딧 부족 시 알림 후 모달 자동 종료

---

## 관리자 설정

### 1. 관리자 페이지 접근
- URL: `/admin/settings/tools`
- 권한: `super_admin` 또는 `admin` 역할 필요

### 2. 설정 가능한 항목

#### 2-1. 기본 설정 (테이블에서 직접 수정)
- **순서**: 도구 표시 순서
- **과금방식**: 열 때 차감 / 버튼 클릭시 / 시간당
- **크레딧**: 차감할 크레딧 양 (버튼 클릭시는 버튼별 설정)
- **간격(분)**: 시간당 과금일 경우 차감 간격
- **프리미엄**: 프리미엄 도구 여부 (현재 미사용)
- **활성화**: 도구 활성화 여부

#### 2-2. 버튼별 크레딧 설정 (on_action인 경우)
"버튼 N개" 클릭 시 모달에서 설정:

| 버튼 ID | 버튼명 | 크레딧 |
|---------|--------|--------|
| integrate | 통합하기 | 5 |
| download | 엑셀 다운로드 | 1 |

**버튼 ID**: 코드에서 `executeWithCredit('여기')`에 넣는 값
**버튼명**: 거래 내역에 표시될 이름
**크레딧**: 해당 버튼 클릭 시 차감할 양

### 3. 저장 방법
1. 테이블에서 원하는 값 직접 수정
2. 우측 상단 "💾 변경사항 저장" 버튼 클릭
3. 모든 도구가 한 번에 저장됨

---

## 도구 개발 절차

### Step 1: 도구 컴포넌트 생성

```typescript
// src/components/tools/MyNewTool.tsx
'use client';

import { useState } from 'react';
import { useCreditOnAction } from '@/hooks/useCreditOnAction';

export default function MyNewTool() {
  const { executeWithCredit, isProcessing } = useCreditOnAction('my-new-tool');
  const [result, setResult] = useState('');

  const handleExecute = async () => {
    // 크레딧 차감 (버튼 ID: 'execute')
    const canProceed = await executeWithCredit('execute');
    if (!canProceed) return;

    // 실제 로직
    setResult('처리 완료!');
  };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
        새로운 도구
      </h3>

      <button
        onClick={handleExecute}
        disabled={isProcessing}
        style={{
          padding: '10px 20px',
          background: '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          opacity: isProcessing ? 0.6 : 1
        }}
      >
        {isProcessing ? '처리 중...' : '실행하기'}
      </button>

      {result && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '6px' }}>
          {result}
        </div>
      )}
    </div>
  );
}
```

### Step 2: tools_master 테이블에 도구 등록

```sql
INSERT INTO tools_master (
  id,
  name,
  description,
  category,
  credits_required,
  is_active,
  is_premium,
  icon_gradient,
  display_order,
  billing_type,
  action_buttons
) VALUES (
  'my-new-tool',
  '새로운 도구',
  '도구 설명',
  'essential',
  0, -- on_action이면 0
  true,
  false,
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  100,
  'on_action', -- 또는 'on_open', 'hourly'
  '[{"id": "execute", "label": "실행하기", "credits": 10}]'::jsonb
);
```

### Step 3: 관리자 페이지에서 설정
1. `/admin/settings/tools` 접속
2. 새로 추가된 도구 확인
3. 과금방식, 크레딧, 버튼 설정
4. 저장

### Step 4: 도구 페이지에 등록

도구가 자동으로 표시됩니다. (DB에서 자동 로드)

---

## 모달 UI 디자인 가이드

### 1. 모달 동작 원칙

#### 닫기 기능
모달창은 다음 방법으로만 닫을 수 있습니다:
- **ESC 키** 누르기
- **우측 상단 × 버튼** 클릭

**중요**: 배경(모달 밖) 클릭으로는 닫히지 않습니다.

#### 저장/불러오기 기능 (선택사항)
- **위치**: 모달 헤더의 타이틀 우측
- **UI 구성**:
  - 저장명 입력란 (150px)
  - 저장 버튼
  - 불러오기 드롭다운
  - 삭제 드롭다운

참조: `src/components/tools/MarginCalculator.tsx`의 `SaveLoadUI`

### 2. 레이아웃 구조

```
┌─────────────────────────────────────────────┐
│ 모달 헤더 (padding: 24px)                   │
│ - 타이틀 (fontSize: 24px, fontWeight: 600) │
│ - 저장/불러오기 UI (선택)                   │
│ - 닫기 버튼 (×)                             │
├─────────────────────────────────────────────┤
│ 본문 (padding: 24px)                        │
│ - 도구별 콘텐츠                             │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. 색상 팔레트

마켓별 색상 구분 시 사용:

```javascript
const marketColors = [
  { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }, // 파랑
  { bg: '#dcfce7', text: '#15803d', border: '#22c55e' }, // 녹색
  { bg: '#fed7aa', text: '#c2410c', border: '#f97316' }, // 주황
  { bg: '#e9d5ff', text: '#7c3aed', border: '#a855f7' }, // 보라
  { bg: '#fce7f3', text: '#be185d', border: '#ec4899' }, // 분홍
  { bg: '#ccfbf1', text: '#0f766e', border: '#14b8a6' }  // 청록
];
```

### 4. 버튼 스타일

#### 주요 실행 버튼
```css
{
  width: '100%',
  padding: '10px',
  background: '#10b981',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer'
}
```

#### 보조 버튼
```css
{
  padding: '4px 10px',
  background: '#f8f9fa',
  color: '#495057',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500'
}
```

### 5. 입력 필드

```css
{
  padding: '3px 8px',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  fontSize: '13px',
  outline: 'none'
}
```

### 6. 테이블 디자인

#### 공통 스타일
```css
{
  width: '100%',
  fontSize: '13px',
  fontVariantNumeric: 'tabular-nums'  /* 숫자 정렬 개선 */
}
```

#### 헤더
```css
{
  padding: '6px',
  background: '#f8f9fa',
  borderBottom: '2px solid #dee2e6',
  fontWeight: '600',
  fontSize: '13px',
  textAlign: 'center'
}
```

#### 데이터 행
```css
{
  padding: '4px 8px',
  borderBottom: '1px solid #f1f1f1'
}
```

#### 형광펜 효과 (중요 데이터 강조)
```css
{
  background: '#dbeafe', /* marketColors의 bg */
  padding: '2px 6px',
  borderRadius: '4px',
  fontWeight: '500'
}
```

### 7. 디자인 원칙

1. **간결성**: 불필요한 색상 제거, 깔끔한 레이아웃
2. **일관성**: 모든 요소에 동일한 패딩/높이 적용
3. **가독성**:
   - `tabular-nums`로 숫자 정렬 개선
   - 형광펜 효과로 중요 데이터 강조
4. **컴팩트함**:
   - 헤더/셀 padding 최소화
   - 입력란 높이 줄임
5. **색상 활용**:
   - 마켓/카테고리별 색상 구분
   - 형광펜 효과로 시각적 강조

---

## 예제 코드

### 예제 1: on_open (모달 열 때 차감)

```typescript
// src/components/tools/SimpleAnalyzer.tsx
'use client';

export default function SimpleAnalyzer() {
  // 별도 훅 불필요 - ToolModal에서 자동 처리

  return (
    <div style={{ padding: '24px' }}>
      <h3>분석 도구</h3>
      <p>이 도구는 열 때 한 번만 크레딧이 차감됩니다.</p>
    </div>
  );
}
```

**관리자 설정:**
- 과금방식: 열 때 차감
- 크레딧: 5

---

### 예제 2: on_action (버튼별 차감)

```typescript
// src/components/tools/DataProcessor.tsx
'use client';

import { useCreditOnAction } from '@/hooks/useCreditOnAction';

export default function DataProcessor() {
  const { executeWithCredit, isProcessing } = useCreditOnAction('data-processor');

  const handleProcess = async () => {
    const ok = await executeWithCredit('process'); // 버튼 ID: 'process'
    if (!ok) return;

    // 처리 로직...
  };

  const handleExport = async () => {
    const ok = await executeWithCredit('export'); // 버튼 ID: 'export'
    if (!ok) return;

    // 내보내기 로직...
  };

  return (
    <div style={{ padding: '24px' }}>
      <button onClick={handleProcess} disabled={isProcessing}>
        데이터 처리 (10 크레딧)
      </button>
      <button onClick={handleExport} disabled={isProcessing}>
        엑셀 내보내기 (2 크레딧)
      </button>
    </div>
  );
}
```

**관리자 설정:**
- 과금방식: 버튼 클릭시
- 버튼 설정:
  - ID: `process`, 명: `데이터 처리`, 크레딧: 10
  - ID: `export`, 명: `엑셀 내보내기`, 크레딧: 2

---

### 예제 3: hourly (시간당 차감)

```typescript
// src/components/tools/LiveMonitor.tsx
'use client';

import { useHourlyCredit } from '@/hooks/useHourlyCredit';

export default function LiveMonitor({ onClose }: { onClose: () => void }) {
  const { isActive, remainingMinutes } = useHourlyCredit('live-monitor', 30, onClose);

  return (
    <div style={{ padding: '24px' }}>
      {isActive && (
        <div style={{
          padding: '8px',
          background: '#fef3c7',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
          ⏱️ 남은 시간: {remainingMinutes}분 (다음 차감까지)
        </div>
      )}

      <h3>실시간 모니터링</h3>
      <p>30분마다 크레딧이 차감됩니다.</p>
    </div>
  );
}
```

**관리자 설정:**
- 과금방식: 시간당
- 크레딧: 5
- 간격(분): 30

---

## 체크리스트

### 개발 전
- [ ] 도구의 과금 방식 결정 (on_open / on_action / hourly)
- [ ] 버튼별 크레딧 설계 (on_action인 경우)
- [ ] 버튼 ID 정의 (영문 소문자, 하이픈 사용)

### 개발 중
- [ ] 적절한 훅 import (`useCreditOnAction` 또는 `useHourlyCredit`)
- [ ] `executeWithCredit`에 정확한 버튼 ID 전달
- [ ] `isProcessing` 상태로 중복 클릭 방지
- [ ] hourly의 경우 `onClose` 콜백 전달

### 배포 전
- [ ] `tools_master` 테이블에 도구 등록
- [ ] 관리자 페이지에서 과금 설정
- [ ] 버튼 ID와 코드가 일치하는지 확인
- [ ] 크레딧 차감 테스트

### UI 디자인
- [ ] 마진계산기 디자인 참조
- [ ] 색상 팔레트 사용 (일관성)
- [ ] padding/fontSize 가이드 준수
- [ ] 모달 닫기는 ESC/× 버튼만

---

## 문제 해결

### Q: 크레딧이 차감되지 않아요
- `tools_master`에 도구가 등록되어 있는지 확인
- `billing_type`이 올바른지 확인
- `action_buttons`에 버튼 ID가 정확히 등록되어 있는지 확인

### Q: 버튼 ID를 잘못 입력했어요
- 관리자 페이지에서 버튼 설정 수정
- 코드의 `executeWithCredit('여기')` 부분도 함께 수정

### Q: 시간당 과금이 작동하지 않아요
- `onClose` 콜백을 전달했는지 확인
- `billing_interval_minutes` 값 확인
- 브라우저 콘솔에서 에러 확인

### Q: 관리자 페이지에서 저장이 안 돼요 (500 에러)
- 데이터베이스에 컬럼이 추가되었는지 확인
- `database/migrations/add_billing_settings_to_tools.sql` 실행 필요
- Supabase SQL Editor에서 마이그레이션 실행

---

## 참고 자료

- **마진계산기 전체 코드**: `src/components/tools/MarginCalculator.tsx`
- **가격 시뮬레이터**: `src/components/tools/PriceSimulator.tsx`
- **옵션 가격 관리**: `src/components/tools/OptionPricing.tsx`
- **모달 컨테이너**: `src/components/tools/ToolModal.tsx`
