# 옵션명 기반 주문 정보 자동 매핑 시스템 - 테스트 가이드

## 개요
플랫폼 셀러 주문 등록 시 옵션명을 기준으로 option_products 테이블에서 공급단가, 발송정보 등을 자동 조회하여 integrated_orders에 저장하는 시스템입니다.

## 적용된 주문 등록 경로 (총 5개)

### 1. 플랫폼 - 마켓파일 업로드
- **파일**: `src/app/platform/orders/components/SellerExcelTab.tsx`
- **라인**: 607 (seller_market_name), 571-596 (간소화된 저장 로직)
- **API**: `/api/platform-orders` (다건 처리)

### 2. 플랫폼 - 발주서 업로드
- **파일**: `src/app/platform/orders/page.tsx`
- **라인**: 457-482 (handleSaveValidatedOrders)
- **API**: `/api/platform-orders` (다건 처리)

### 3. 플랫폼 - 건별 등록
- **파일**: `src/app/platform/orders/modals/SingleOrderModal.tsx`
- **API**: `/api/platform-orders` (단건 처리)

### 4. 관리자 - 주문 통합 등록
- **파일**: `src/app/admin/order-integration/components/ExcelTab.tsx`
- **API**: `/api/integrated-orders/bulk`
- **특이사항**: 정산금액은 마켓별 수식 적용 (예: 상품금액*0.9415), 공급단가 기반 계산은 기존 값이 없을 때만

### 5. CS - 재발송 주문 등록
- **파일**: `src/app/admin/cs/reshipment/[id]/page.tsx`
- **API**: `/api/integrated-orders/bulk`

## 자동 매핑되는 필드

### option_products 테이블 → integrated_orders 테이블 매핑

| option_products 칼럼 | integrated_orders 칼럼 | 설명 |
|---------------------|----------------------|------|
| seller_supply_price | seller_supply_price | 셀러 공급단가 |
| shipping_entity | shipping_source | 출고 담당 (예: "달래팜", "아모레") |
| invoice_entity | invoice_issuer | 송장 발행 주체 |
| vendor_name | vendor_name | 벤더사명 |
| shipping_location_name | shipping_location_name | 발송지명 |
| shipping_location_address | shipping_location_address | 발송지 주소 |
| shipping_location_contact | shipping_location_contact | 발송지 연락처 |
| shipping_cost | shipping_cost | 출고 비용 |

### 자동 계산 필드
- **settlement_amount** (정산예정금액) = seller_supply_price × quantity
  - 플랫폼 주문: 항상 자동 계산 (기존 값이 없을 때)
  - 관리자 주문: 기존 값 우선 (마켓별 수식 보존)

## 핵심 로직 위치

### 서버 사이드 유틸리티
- **파일**: `src/lib/order-utils.ts`
- **함수**: `enrichOrdersWithOptionInfo()`
- **처리 흐름**:
  1. 중복 제거 후 옵션명 일괄 조회
  2. option_products에서 정보 조회 (영문 칼럼명 사용)
  3. Map 생성으로 빠른 조회 최적화
  4. 각 주문에 정보 매핑 (기존 값 있으면 유지)
  5. settlement_amount 자동 계산 (기존 값 없을 때만)

### API 엔드포인트
1. **`/api/platform-orders/route.ts`**
   - 플랫폼 셀러 전용 API
   - 마켓파일, 발주서, 건별 등록 모두 처리
   - enrichOrdersWithOptionInfo() 호출 (line 50)

2. **`/api/integrated-orders/bulk/route.ts`**
   - 관리자/CS 전용 API
   - enrichOrdersWithOptionInfo() 호출 (line 30)
   - 관리자 정산금액 수식 보존 로직 포함

## 테스트 시나리오

### 시나리오 1: 플랫폼 마켓파일 업로드
1. 플랫폼 오더 페이지 접속 (`/platform/orders`)
2. "마켓파일 업로드" 버튼 클릭
3. 쿠팡/11번가 등 마켓 엑셀 파일 업로드
4. "발주서로 등록" 클릭

**예상 결과**:
- ✅ seller_market_name에 마켓명 기록 (예: "쿠팡", "11번가")
- ✅ option_name으로 option_products 조회
- ✅ seller_supply_price, shipping_source 등 자동 채움
- ✅ settlement_amount = seller_supply_price × quantity
- ✅ UI 테이블에 공급단가, 정산예정금액 표시

### 시나리오 2: 플랫폼 발주서 업로드
1. 플랫폼 오더 페이지 접속
2. "발주서 업로드" 버튼 클릭
3. 발주서 엑셀 파일 업로드 (옵션명 칼럼 필수)
4. 옵션명 검증 완료 후 "건별 등록" 또는 "일괄 등록"

**예상 결과**:
- ✅ 옵션명 검증 모달 정상 작동
- ✅ 미등록 옵션 감지 (빨간색 표시)
- ✅ 등록된 옵션은 option_products 정보 자동 매핑
- ✅ DB에 모든 필드 정상 기록

### 시나리오 3: 옵션명 미등록 케이스
1. option_products에 없는 옵션명으로 주문 업로드
2. 옵션명 검증 모달 확인

**예상 결과**:
- ✅ 미등록 옵션 목록 표시
- ✅ 경고 메시지 표시
- ✅ 그래도 저장 시 빈 값으로 저장 (에러 발생 안함)

### 시나리오 4: 관리자 주문 통합 등록
1. 관리자 주문 통합 페이지 접속
2. 마켓 선택 (예: 쿠팡)
3. 엑셀 파일 업로드
4. 통합 등록

**예상 결과**:
- ✅ 마켓별 정산금액 수식 적용 (예: "상품금액*0.9415")
- ✅ option_products 정보는 빈 필드에만 채움
- ✅ 기존 정산금액이 있으면 덮어쓰지 않음

## 디버깅 로그 확인

서버 콘솔에서 다음 로그를 확인할 수 있습니다:

```
[enrichOrdersWithOptionInfo] 조회할 옵션명: ["옵션1", "옵션2", ...]
[enrichOrdersWithOptionInfo] 조회된 옵션 상품: [...]
[enrichOrdersWithOptionInfo] 옵션명 "xxx" → optionInfo: {...}
[enrichOrdersWithOptionInfo] 최종 결과: {...}
```

## 주요 변경사항 요약

### 2025-10-28 변경사항
1. **마이그레이션 063**: seller_market_name 칼럼 추가
2. **order-utils.ts**: 영문 칼럼명으로 수정
   - ❌ 출고, 송장, 벤더사 (한글 칼럼 - Migration 050에서 제거됨)
   - ✅ shipping_entity, invoice_entity, vendor_name (영문 칼럼 사용)
3. **SellerExcelTab.tsx**: 클라이언트 사이드 조회 제거, 서버 enrichment로 통일
4. **page.tsx (발주서)**: 검증용 조회는 유지, 저장용 조회는 서버로 이관
5. **조건부 필드 채움 로직**: 기존 값 있으면 유지, 없으면 option_products로 채움

## 성능 최적화

### 대량 주문 처리 최적화
- **중복 제거**: 동일 옵션명은 한 번만 조회
- **일괄 조회**: `.in()` 사용하여 한 번의 쿼리로 모든 옵션 조회
- **Map 캐싱**: 조회 결과를 Map으로 변환하여 O(1) 조회 성능

### 예시
- 100개 주문, 10개 고유 옵션명 → DB 쿼리 1회 (10개 옵션만 조회)
- Map 조회: 100번 반복하지만 각 조회는 O(1)

## 문제 해결 이력

### 문제 1: 옵션명 검증 모달 작동 안함
- **원인**: 클라이언트 사이드 option_products 조회 완전 제거
- **해결**: 검증용 조회는 클라이언트에 유지, 저장용은 서버 처리

### 문제 2: seller_supply_price, settlement_amount DB 기록 안됨
- **원인**: 기존 값 체크 로직이 너무 보수적 (undefined도 "기존 값"으로 인식)
- **해결**: undefined/null/빈 문자열일 때만 optionInfo로 채우도록 수정

### 문제 3: 관리자 정산금액 덮어쓰기 문제
- **원인**: enrichOrdersWithOptionInfo가 무조건 계산
- **해결**: settlement_amount는 기존 값이 없을 때만 계산

### 문제 4: "column option_products.출고 does not exist" 에러
- **원인**: Migration 050에서 한글 칼럼 제거했는데 코드는 한글 칼럼 사용
- **해결**: 영문 칼럼명으로 변경 (shipping_entity, invoice_entity 등)

## 다음 단계

1. ✅ 서버 정상 기동 확인 (포트 3004)
2. ⏳ 실제 데이터로 테스트
3. ⏳ 디버그 로그 제거 (order-utils.ts의 console.log)
4. ⏳ 프로덕션 배포 전 최종 검증

---

**작성일**: 2025-10-28
**작성자**: Claude Code
**버전**: 1.0
