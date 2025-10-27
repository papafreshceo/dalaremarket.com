# 상태별 토스트 사용 가이드

## 개요
각 주문 상태에 맞는 색상의 토스트 메시지를 표시하는 유틸리티 함수입니다.

## Import
```typescript
import { showStatusToast, showErrorToast } from '../utils/statusToast';
```

## 사용 방법

### 1. 발주서 등록 (파란색)
```typescript
showStatusToast('registered', '3개 파일 15건 통합 완료');
```

### 2. 발주서 확정 (보라색)
```typescript
showStatusToast('confirmed', '5건 발주 확정 완료');
```

### 3. 상품 준비중 (주황색)
```typescript
showStatusToast('preparing', '10건 상품 준비중으로 변경');
```

### 4. 발송 완료 (초록색)
```typescript
showStatusToast('shipped', '7건 발송 완료');
```

### 5. 취소 요청 (빨간색)
```typescript
showStatusToast('cancelRequested', '3건 취소 요청 완료');
```

### 6. 취소 완료 (회색)
```typescript
showStatusToast('cancelled', '2건 취소 완료');
```

### 7. 환불 완료 (초록색)
```typescript
showStatusToast('refunded', '1건 환불 완료');
```

### 8. 에러 메시지 (빨간색)
```typescript
showErrorToast('파일 업로드 중 오류가 발생했습니다.');
```

## 함수 파라미터

### showStatusToast
- `status`: 주문 상태 ('registered' | 'confirmed' | 'preparing' | 'shipped' | 'cancelRequested' | 'cancelled' | 'refunded')
- `message`: 표시할 메시지
- `duration`: 표시 시간 (ms, 기본값: 2000)

### showErrorToast
- `message`: 표시할 에러 메시지
- `duration`: 표시 시간 (ms, 기본값: 3000)

## 색상 매핑
각 상태는 상단 통계 카드와 동일한 색상을 사용합니다:

| 상태 | 색상 | 그라데이션 |
|------|------|-----------|
| registered (발주서등록) | 파란색 | #2563eb → #60a5fa |
| confirmed (발주서확정) | 보라색 | #7c3aed → #a78bfa |
| preparing (상품준비중) | 주황색 | #f59e0b → #fbbf24 |
| shipped (발송완료) | 초록색 | #10b981 → #34d399 |
| cancelRequested (취소요청) | 빨간색 | #ef4444 → #f87171 |
| cancelled (취소완료) | 회색 | #6b7280 → #9ca3af |
| refunded (환불완료) | 초록색 | #10b981 → #34d399 |

## 스타일 특징
- 반투명 배경 (opacity: 0.85)
- 블러 효과 (backdrop-filter: blur(10px))
- 부드러운 그림자
- 테두리 없음
- 상단 중앙 표시 (top-center)
