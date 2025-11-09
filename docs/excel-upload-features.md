# 엑셀 파일 업로드 기능 정리

## 개요
시스템 내 4가지 엑셀 파일 업로드 기능의 위치, 용도, 특징을 정리한 문서입니다.

---

## 1. 관리자 - 마켓파일 업로드 통합 (ExcelTab.tsx)

### 파일 위치
- `src/app/admin/order-integration/components/ExcelTab.tsx`

### 접근 경로
- 관리자 페이지 → 주문통합 → Excel 탭

### 용도
- **관리자 전용** 마켓 주문 파일 통합 도구
- 여러 마켓의 엑셀 파일을 업로드하여 하나로 통합 후 DB 저장

### 주요 특징
- ✅ **마켓 템플릿 DB 사용**: `market_templates` 테이블의 `header_row` 설정 사용
- ✅ **옵션 매핑 자동 적용**: `option_products` 테이블 기반 자동 매핑
- ✅ **중복 주문 처리**: 기존 주문과 비교하여 중복 제거
- ✅ **일괄 편집 기능**: 통합 전 데이터 일괄 수정 가능
- ✅ **암호화 파일 지원**: 비밀번호 입력 모달 제공
- ✅ **다중 포맷 지원**: XLS, XLSX, CSV
- ✅ **SheetJS 사용**: 구버전 XLS 파일도 지원

### 핵심 로직
```typescript
// 마켓별 헤더행 인식
const headerRowIndex = (template.header_row || 1);
const actualHeaderRowIndex = Math.max(0, headerRowIndex - 1);
const actualHeaderRow = allData[actualHeaderRowIndex];

// 필드 매핑 (field_4 ~ field_50)
const mappedRow: any = {};
for (let fieldIndex = 4; fieldIndex <= 50; fieldIndex++) {
  const fieldKey = `field_${fieldIndex}`;
  const targetColumn = template[fieldKey];
  // ...매핑 로직
}
```

### 파일 크기
- 약 2,228줄 (매우 복잡한 기능)

---

## 2. 플랫폼 - 마켓파일 업로드 통합 (SellerExcelTab.tsx)

### 파일 위치
- `src/app/platform/orders/components/SellerExcelTab.tsx`

### 접근 경로
- 플랫폼 → 발주서등록 → 마켓파일 업로드 탭

### 용도
- **플랫폼 셀러 전용** 마켓 주문 파일 업로드 및 DB 저장
- 각 마켓에서 다운받은 주문 파일을 업로드하여 시스템에 등록

### 주요 특징
- ✅ **마켓 템플릿 DB 사용**: `market_templates` 테이블의 `header_row` 설정 사용
- ✅ **옵션 매핑 자동 적용**: `option_products` 테이블 기반 자동 매핑
- ✅ **파일별 개별 저장**: 각 마켓 파일을 하나씩 업로드 후 저장
- ✅ **암호화 파일 지원**: 비밀번호 입력 모달 제공
- ✅ **다중 포맷 지원**: XLS, XLSX, CSV
- ✅ **SheetJS 사용**: 구버전 XLS 파일도 지원
- ✅ **템플릿 자동 감지**: 파일명과 헤더 기반 스코어링으로 마켓 자동 인식

### 핵심 로직
```typescript
// 마켓 템플릿 자동 감지
const detectedTemplate = detectMarketTemplate(
  file.name,
  actualHeaderRow,
  templates
);

// 헤더행 인식
const headerRowIndex = (template.header_row || 1);
const actualHeaderRowIndex = Math.max(0, headerRowIndex - 1);
const actualHeaderRow = allData[actualHeaderRowIndex];

// 필드 매핑 후 DB 저장
const orderData = {
  order_number: mappedRow.field_4,
  orderer: mappedRow.field_5,
  // ... 필드 매핑
  seller_id: user.id,
  market_name: template.market_name,
};
```

### 암호화 파일 감지 조건
```typescript
if (error.message && (
  error.message.includes('password') ||
  error.message.includes('encrypted') ||
  error.message.includes('Unsupported') ||
  error.message.includes('CFB') ||  // Compound File Binary (구 XLS, 암호화 XLSX)
  error.message.toLowerCase().includes('encryption')
))
```

---

## 3. 플랫폼 - 발주서 업로드 (page.tsx)

### 파일 위치
- `src/app/platform/orders/page.tsx`

### 접근 경로
- 플랫폼 → 발주서등록 → 발주서 업로드 버튼

### 용도
- **지정된 양식**으로 발주서를 업로드하는 기능
- 고정된 양식 파일을 업로드하여 주문 등록

### 주요 특징
- ❌ **마켓 템플릿 DB 사용 안함**: 고정된 양식 사용
- ✅ **옵션 매핑 자동 적용**: `option_products` 테이블 기반 자동 매핑
- ✅ **지정 양식 사용**: 헤더가 항상 첫 번째 행(allData[0])
- ✅ **필수 컬럼 검증**: validateRequiredColumns 함수로 양식 검증
- ✅ **암호화 파일 지원**: 비밀번호 입력 모달 제공
- ✅ **다중 포맷 지원**: XLS, XLSX, CSV
- ✅ **SheetJS 사용**: 구버전 XLS 파일도 지원
- ✅ **매핑 결과 표시**: 옵션명 매핑 결과 모달로 확인 가능

### 핵심 로직
```typescript
// 고정된 헤더행 (항상 첫 번째 행)
const headers = allData[0] || [];

// 필수 컬럼 검증
const errors = validateRequiredColumns(jsonData);
if (errors.length > 0) {
  setValidationErrors(errors);
  setShowValidationModal(true);
  return;
}

// 옵션명 매핑 적용
const { orders: mappedOrders, mappingResults, totalOrders, mappedOrders: mappedCount } =
  await applyOptionMapping(ordersForValidation, user.id);

// DB 저장 (옵션 정보 자동 병합)
const response = await fetch('/api/platform-orders', {
  method: 'POST',
  body: JSON.stringify({ orders: validOrders })
});
```

### 관련 함수
- `handleFiles()`: 라인 632-839
- `handlePasswordSubmit()`: 라인 842-897
- `validateRequiredColumns()`: 별도 정의 필요 확인

### 필수 컬럼 (추정)
- 주문번호
- 주문자
- 주문자전화번호
- 수령인
- 수령인전화번호
- 주소
- 옵션명
- 수량

---

## 4. 플랫폼 - 업무도구 마켓파일 통합 (OrderIntegration.tsx)

### 파일 위치
- `src/components/tools/OrderIntegration.tsx`

### 접근 경로
- 플랫폼 → 업무도구 → 주문통합(Excel)

### 용도
- **파일만 통합하여 다운로드**하는 간단한 도구
- 여러 마켓 파일을 하나의 엑셀로 합쳐서 다운로드 (DB 저장 없음)

### 주요 특징
- ❌ **DB 저장 없음**: 파일만 통합하여 다운로드
- ❌ **옵션 매핑 없음**: 단순 파일 병합만 수행
- ❌ **마켓 템플릿 DB 사용 안함**: 업로드된 파일 그대로 병합
- ✅ **암호화 파일 지원**: 비밀번호 입력 모달 제공
- ✅ **다중 포맷 지원**: XLS, XLSX, CSV
- ✅ **SheetJS 사용**: 구버전 XLS 파일도 지원
- ✅ **여러 파일 동시 업로드**: 한 번에 여러 마켓 파일 선택 가능

### 핵심 로직
```typescript
// 파일 읽기만 수행 (매핑 없음)
const allData = XLSX.utils.sheet_to_json(worksheet, {
  header: 1,
  defval: '',
  raw: false
}) as any[][];

const headers = allData[0] || [];
const jsonData: any[] = [];

// 단순 JSON 변환
for (let i = 1; i < allData.length; i++) {
  const rowArray = allData[i];
  const rowData: any = {};
  headers.forEach((header: any, colIndex: number) => {
    if (header) {
      rowData[String(header)] = rowArray[colIndex] || '';
    }
  });
  jsonData.push(rowData);
}

// 통합 후 엑셀 다운로드
handleDownloadExcel(allFiles);
```

### 관련 함수
- `handleFileSelect()`: 라인 223-258 (파일 읽기)
- `handlePasswordSubmit()`: 라인 301-317 (암호 처리)
- `handleDownloadExcel()`: 통합 및 다운로드

---

## 공통 기술 스택

### 라이브러리
- **SheetJS (xlsx)**: 모든 기능에서 사용
  - XLS (구버전 Excel) 지원
  - XLSX (신버전 Excel) 지원
  - CSV 지원
  - 암호화 파일 감지 (복호화는 서버에서 처리)

### 암호화 파일 처리
- **클라이언트**: SheetJS로 암호화 감지 → 비밀번호 입력 모달 표시
- **서버**: `/api/decrypt-excel` API로 Python msoffcrypto-tool 사용하여 복호화
- **에러 처리**: 비밀번호 오류 시 모달 유지 (재입력 가능)

### 파일 재선택 기능
- 모든 file input에 onClick 이벤트로 value 초기화
```typescript
onClick={(e) => {
  // 같은 파일을 다시 선택할 수 있도록 value 초기화
  (e.target as HTMLInputElement).value = '';
}}
```

---

## 옵션 매핑 시스템

### 사용하는 기능
1. ✅ **관리자 - 마켓파일 통합** (ExcelTab.tsx)
2. ✅ **플랫폼 - 마켓파일 업로드** (SellerExcelTab.tsx)
3. ✅ **플랫폼 - 발주서 업로드** (page.tsx)

### 사용하지 않는 기능
4. ❌ **플랫폼 - 업무도구 마켓파일 통합** (OrderIntegration.tsx)

### 매핑 로직
```typescript
// 옵션명 기반 자동 매핑
const { data: optionProducts } = await supabase
  .from('option_products')
  .select('option_name, option_code, seller_supply_price, 출고, 송장, 벤더사, ...')
  .in('option_name', uniqueOptionNames);

// 매핑 적용
ordersForValidation.forEach(order => {
  const product = productMap.get(order.optionName.toLowerCase());
  if (product) {
    order.optionCode = product.option_code;
    order.sellerSupplyPrice = product.seller_supply_price;
    // 기타 필드 자동 병합
  }
});
```

### 자동 병합 필드 (option_products 테이블)
- `seller_supply_price`: 셀러 공급가
- `출고`: 출고 정보
- `송장`: 송장 정보
- `벤더사`: 벤더사 정보
- `발송지명`: 발송지 이름
- `발송지주소`: 발송지 주소
- `발송지연락처`: 발송지 연락처
- `출고비용`: 출고 비용

---

## 마켓 템플릿 시스템

### 사용하는 기능
1. ✅ **관리자 - 마켓파일 통합** (ExcelTab.tsx)
2. ✅ **플랫폼 - 마켓파일 업로드** (SellerExcelTab.tsx)

### 사용하지 않는 기능
3. ❌ **플랫폼 - 발주서 업로드** (page.tsx) - 지정된 양식 사용
4. ❌ **플랫폼 - 업무도구 마켓파일 통합** (OrderIntegration.tsx) - 단순 통합

### DB 테이블: market_templates

#### 주요 컬럼
- `market_name`: 마켓명 (스마트스토어, 쿠팡, 11번가 등)
- `header_row`: 헤더 시작 행 번호 (1부터 시작)
- `field_4` ~ `field_50`: 각 필드의 컬럼명 매핑
- `filename_pattern`: 파일명 패턴 (자동 감지용)

#### 헤더행 인식 로직
```typescript
// DB는 1부터 시작 (사용자 관점)
const headerRowIndex = template.header_row || 1;

// 배열은 0부터 시작 (개발자 관점)
const actualHeaderRowIndex = Math.max(0, headerRowIndex - 1);

// 실제 헤더 추출
const actualHeaderRow = allData[actualHeaderRowIndex];
```

#### 템플릿 자동 감지 (SellerExcelTab.tsx)
```typescript
function detectMarketTemplate(
  filename: string,
  headers: any[],
  templates: any[]
): any {
  let bestMatch = null;
  let highestScore = 0;

  templates.forEach(template => {
    let score = 0;

    // 파일명 매칭 (30점)
    if (template.filename_pattern &&
        filename.toLowerCase().includes(template.filename_pattern.toLowerCase())) {
      score += 30;
    }

    // 헤더 매칭 (필드당 2점)
    for (let i = 4; i <= 50; i++) {
      const fieldKey = `field_${i}`;
      const expectedColumn = template[fieldKey];
      if (expectedColumn && headers.includes(expectedColumn)) {
        score += 2;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = template;
    }
  });

  return bestMatch;
}
```

---

## DB 저장 API

### 관리자용
- **파일**: `src/app/api/admin/orders/route.ts` (추정)
- **엔드포인트**: `/api/admin/orders`
- **용도**: 관리자가 통합한 주문 저장

### 플랫폼 셀러용
- **파일**: `src/app/api/platform-orders/route.ts`
- **엔드포인트**: `/api/platform-orders`
- **용도**: 플랫폼 셀러가 업로드한 주문 저장
- **특징**: 옵션명 기반 자동 매핑 로직 포함

### 공통 로직
```typescript
// 옵션명으로 option_products 조회
const { data: optionProducts } = await supabase
  .from('option_products')
  .select('*')
  .in('option_name', uniqueOptionNames);

// 주문 데이터에 자동 병합
orders.forEach(order => {
  const product = productMap.get(order.optionName);
  if (product) {
    order.seller_supply_price = product.seller_supply_price;
    order.출고 = product.출고;
    // ... 기타 필드
  }
});

// DB 저장
await supabase.from('orders').insert(orders);
```

---

## 비밀번호 모달 컴포넌트

### 위치
- `src/app/platform/orders/modals/PasswordModal.tsx` (공통 사용)
- `src/components/admin/PasswordModal.tsx` (관리자용, 추정)

### 사용 위치
1. ExcelTab.tsx (관리자)
2. SellerExcelTab.tsx (플랫폼)
3. page.tsx (플랫폼 발주서)
4. OrderIntegration.tsx (업무도구)

### 복호화 API
- **엔드포인트**: `/api/decrypt-excel`
- **방식**: Python msoffcrypto-tool 사용
- **입력**: FormData (file, password)
- **출력**: 복호화된 파일의 Base64 데이터

---

## 주요 개선 이력

### 2025-01-09 개선사항
1. **ExcelJS → SheetJS 마이그레이션**
   - XLS (구버전) 파일 지원 추가
   - CSV 파일 지원 추가
   - 더 이상 파일 변환 불필요

2. **헤더행 인식 개선**
   - 하드코딩된 allData[0] → DB header_row 설정 사용
   - 마켓별로 다른 헤더 시작 행 대응

3. **암호화 파일 처리 개선**
   - CFB (Compound File Binary) 감지 조건 추가
   - 비밀번호 오류 시 모달 유지 (재입력 가능)
   - Toast 메시지로 사용자 피드백 개선

4. **파일 재선택 기능 추가**
   - onClick으로 input value 초기화
   - 같은 파일 다시 선택 가능

5. **Toast 알림 추가**
   - platform/tools/page.tsx에 Toaster 컴포넌트 추가

---

## 문제 해결 가이드

### Q1. "Can't find end of central directory" 에러
**원인**: ExcelJS는 XLSX만 지원, XLS 파일 업로드 시 발생
**해결**: SheetJS로 마이그레이션 완료 (모든 파일에 적용됨)

### Q2. 주문 개수가 0으로 표시됨
**원인**: 헤더행을 allData[0]으로 하드코딩, 실제 헤더가 다른 행에 있음
**해결**: DB header_row 설정 사용 (마켓파일 업로드만 해당)

### Q3. 비밀번호 오류 시 모달이 닫힘
**원인**: throw new Error()로 에러 발생 시 모달 닫힘
**해결**: toast.error() + return으로 변경, 모달 유지

### Q4. Toast 메시지가 안 뜸
**원인**: Toaster 컴포넌트 미추가
**해결**: page.tsx에 Toaster 컴포넌트 추가

### Q5. 같은 파일을 다시 선택할 수 없음
**원인**: input onChange는 value 변경 시만 발생
**해결**: onClick에서 value = '' 초기화

---

## 참고 사항

### 파일 포맷 우선순위
1. **XLSX**: 가장 일반적, 모든 기능 지원
2. **XLS**: 구버전 Excel, SheetJS로 지원
3. **CSV**: 텍스트 기반, 포맷팅 정보 없음

### 암호화 파일 제약
- 클라이언트에서 직접 복호화 불가
- 서버 API (/api/decrypt-excel) 필수
- Python 환경 필요 (msoffcrypto-tool)

### 성능 고려사항
- 대량 주문 처리 시 옵션 매핑 성능 최적화 필요
- 중복 제거, 병렬 처리, 캐싱 적용 권장

---

## 마지막 업데이트
2025-01-09 - 초기 문서 작성
