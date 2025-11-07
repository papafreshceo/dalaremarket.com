# 업무도구 모달창 디자인 가이드

## 개요
마진계산기 모달창을 기반으로 한 업무도구 UI 디자인 가이드입니다.

## 파일 위치
- 모달 컨테이너: `src/components/tools/ToolModal.tsx`
- 마진계산기 (참조 디자인): `src/components/tools/MarginCalculator.tsx`
- 저장/불러오기 UI 컴포넌트: `src/components/tools/MarginCalculator.tsx` (export된 `SaveLoadUI`)

## 저장/불러오기 기능
마진계산기는 사용자 설정을 로컬스토리지에 저장하고 불러올 수 있습니다.
- **위치**: 모달 헤더의 타이틀 우측
- **UI 구성**:
  - 저장명 입력란 (150px)
  - 저장 버튼
  - 불러오기 드롭다운 (저장된 설정이 있을 때만 표시)
  - 삭제 드롭다운 (저장된 설정이 있을 때만 표시)
- **저장 데이터**: mode, selectedCategory, marketFees, individualPrices, bulkTargetMargin, bulkTargetMarginAmount

## 모달 동작 원칙

### 닫기 기능
모달창은 다음 방법으로만 닫을 수 있습니다:
- **ESC 키** 누르기
- **우측 상단 × 버튼** 클릭

**중요**: 배경(모달 밖) 클릭으로는 닫히지 않습니다.
- 모달 배경 div에 `onClick` 이벤트를 추가하지 않음
- 사용자가 실수로 작업 중인 데이터를 잃지 않도록 보호

## 주요 디자인 원칙

### 1. 레이아웃 구조
```
- 모달 헤더 (padding: 24px, borderBottom: 1px solid #dee2e6)
  - 타이틀 (fontSize: 24px, fontWeight: 600)
  - 닫기 버튼 (× 아이콘, 우측 상단)
- 본문 (padding: 24px)
  - 도구별 콘텐츠
- 푸터 없음 (삭제됨)
```

### 2. 마켓별 수수료율 설정 영역
```css
{
  border: '1px solid #dee2e6',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '24px'
}
```

**레이아웃:**
- 타이틀 (왼쪽) + 마켓 추가 버튼 (타이틀 옆) + 마켓 입력란들 + 초기화 버튼 (오른쪽 끝)
- 한 줄로 배치 (flexWrap: 'wrap')

**마켓 입력란:**
- 마켓명 입력: width 100px, padding 3px 8px
- 수수료율 입력: width 60px, padding 3px 8px
- 삭제 버튼: padding 2px 6px

### 3. 테이블 디자인

#### 공통 스타일
```css
{
  width: '100%',
  fontSize: '13px',
  fontVariantNumeric: 'tabular-nums'  /* 숫자 정렬 개선 */
}
```

#### 헤더
- 1행 헤더 padding: '6px'
- 2행 헤더 padding: '6px', top: '28px' (sticky)
- 마켓명: 형광펜 효과 (background: color.bg, padding: '4px 8px', borderRadius: '4px', fontWeight: '600')

#### 데이터 행
- 셀 padding: '4px 8px' (판매가 입력 방식)
- 셀 padding: '8px' (마진율/마진액 방식)
- borderBottom: '1px solid #f1f1f1'

#### 특수 칼럼 스타일

**판매가 칼럼 (마진율/마진액 방식):**
```css
{
  fontSize: '12px',
  fontWeight: '500',
  /* 형광펜 효과 */
  background: color.bg,
  padding: '2px 6px',
  borderRadius: '4px'
}
```

**권장 판매가 칼럼:**
- 마진율 방식: borderRight: '2px solid #16a34a'
- 마진액 방식: borderRight: '2px solid #f59e0b'

### 4. 색상 팔레트 (marketColors)
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

### 5. 입력 필드

**기본 입력란:**
```css
{
  padding: '3px 8px',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  fontSize: '13px',
  outline: 'none'
}
```

**판매가 입력란 (테이블 내):**
```css
{
  padding: '3px 8px',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  fontSize: '13px',
  textAlign: 'right'
}
```

**스핀 버튼:**
```css
{
  width: '16px',
  height: '11px',
  padding: 0,
  border: '1px solid #dee2e6',
  borderRadius: '2px',
  background: '#f8f9fa',
  fontSize: '8px'
}
```

### 6. 테이블 컨테이너

**타이틀 영역:**
```css
{
  padding: '6px 16px',
  background: '#2563eb' (또는 #16a34a, #f59e0b),
  color: '#ffffff',
  cursor: 'pointer',
  minHeight: '32px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}
```

**아코디언 화살표:**
```css
{
  fontSize: '16px',
  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
  transition: 'transform 0.2s'
}
```

### 7. 버튼 스타일

**시뮬레이션 버튼:**
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

**마켓 추가 버튼:**
```css
{
  padding: '4px 10px',
  background: '#dc2626',
  fontSize: '12px',
  fontWeight: '500'
}
```

### 8. 디자인 원칙 요약

1. **간결성**: 불필요한 색상 제거, 깔끔한 레이아웃
2. **일관성**: 모든 테이블에 동일한 패딩/높이 적용
3. **가독성**:
   - tabular-nums로 숫자 정렬 개선
   - 형광펜 효과로 중요 데이터 강조
4. **컴팩트함**:
   - 헤더/셀 padding 최소화
   - 입력란 높이 줄임
5. **색상 활용**:
   - 마켓별 색상으로 구분
   - 형광펜 효과로 시각적 강조

## 적용 방법

다른 도구 개발 시:
1. `MarginCalculator.tsx`를 참조 디자인으로 사용
2. 위의 스타일 값들을 그대로 적용
3. `marketColors` 배열 재사용
4. 테이블 구조 및 padding 값 동일하게 유지

## 주의사항

- 테이블 데이터 영역에는 굵은 폰트 사용 금지 (판매가 제외)
- 모든 금액은 정수로 표시 (원 단위 제거)
- 퍼센트는 소수점 1자리까지 표시
- 셀 배경색 사용 금지 (형광펜 효과만 사용)
