# UI 구현 광역 지침

## 🚫 절대 금지 사항

### 1. 전체 너비 사용 금지 (예외: 테이블, 그리드)
```tsx
// ❌ 절대 금지
<input style={{ width: '100%' }} />
<select style={{ width: '100%' }} />
<button style={{ width: '100%' }} />

// ✅ 올바른 방법
<input style={{ width: '200px' }} />
<select style={{ width: '150px' }} />
<button style={{ padding: '6px 12px' }} />

// ✅ 예외: 테이블은 전체 너비 허용
<table style={{ width: '100%' }} />
<div className="ag-theme-alpine" style={{ width: '100%' }} />
```

### 2. 큰 패딩/마진 금지
```tsx
// ❌ 절대 금지
padding: '20px 40px'
margin: '32px'
gap: '24px'

// ✅ 올바른 방법
padding: '6px 12px'
margin: '8px'
gap: '8px'
```

### 3. 큰 폰트 크기 금지
```tsx
// ❌ 절대 금지
fontSize: '16px'
fontSize: '18px'

// ✅ 올바른 방법
fontSize: '13px'
fontSize: '14px'
```

## ✅ 표준 크기

### 버튼
```tsx
<button style={{
  padding: '6px 12px',
  fontSize: '13px',
  borderRadius: '6px',
  // width 지정 금지! 내용만큼만
}}>
  저장
</button>
```

### 입력란
```tsx
// 짧은 입력 (이름, 코드 등)
<input style={{ width: '120px', fontSize: '13px', padding: '6px 8px' }} />

// 중간 입력 (이메일, 주소 등)
<input style={{ width: '200px', fontSize: '13px', padding: '6px 8px' }} />

// 긴 입력 (설명 등)
<input style={{ width: '300px', fontSize: '13px', padding: '6px 8px' }} />

// 절대로 width: '100%' 사용 금지!
```

### 드롭다운
```tsx
<select style={{
  width: '150px',  // 고정 너비
  fontSize: '13px',
  padding: '6px 8px'
}}>
```

### 카드/섹션
```tsx
<div style={{
  padding: '12px',      // 작게!
  borderRadius: '8px',
  gap: '8px'            // 작게!
}}>
```

## 📏 간격 기준

| 용도 | 크기 |
|------|------|
| 요소 간 간격 | `gap: 8px` |
| 섹션 간 간격 | `gap: 12px` |
| 카드 내부 패딩 | `padding: 12px` |
| 버튼 패딩 | `padding: 6px 12px` |
| 입력란 패딩 | `padding: 6px 8px` |

## 🎯 체크리스트

새 컴포넌트 만들기 전에 확인:

- [ ] width: '100%' 사용했는가? → ❌ 삭제
- [ ] className="w-full" 사용했는가? → ❌ 삭제
- [ ] padding이 20px 이상인가? → ❌ 12px 이하로
- [ ] gap이 16px 이상인가? → ❌ 8px~12px로
- [ ] fontSize가 15px 이상인가? → ❌ 13px~14px로
- [ ] 버튼이 block인가? → ❌ inline-flex로

## 💡 원칙

**"최소한의 공간만 사용하라"**

- 입력란: 입력될 내용 길이만큼만
- 버튼: 텍스트 + 약간의 여백만
- 드롭다운: 가장 긴 옵션 + 약간의 여백만
- 카드: 내용 + 최소 패딩만

## 🔥 위반 시

이 지침을 위반한 코드를 작성하면:
1. 즉시 수정 요청 받음
2. 사용자가 직접 수정해야 함
3. 시간 낭비

**처음부터 작게 만들어라!**
