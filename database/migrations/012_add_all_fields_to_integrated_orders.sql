-- =====================================================
-- integrated_orders 테이블에 표준필드 43개 추가
-- =====================================================
-- 작성일: 2025-10-09
-- 설명: field_1 ~ field_43 컬럼을 integrated_orders에 추가
-- =====================================================

-- 기존 테이블 구조 유지하면서 field_X 컬럼 추가
ALTER TABLE integrated_orders
  ADD COLUMN IF NOT EXISTS field_1 TEXT,   -- 마켓명
  ADD COLUMN IF NOT EXISTS field_2 TEXT,   -- 연번
  ADD COLUMN IF NOT EXISTS field_3 TEXT,   -- 결제일
  ADD COLUMN IF NOT EXISTS field_4 TEXT,   -- 주문번호
  ADD COLUMN IF NOT EXISTS field_5 TEXT,   -- 주문자
  ADD COLUMN IF NOT EXISTS field_6 TEXT,   -- 주문자전화번호
  ADD COLUMN IF NOT EXISTS field_7 TEXT,   -- 수령인
  ADD COLUMN IF NOT EXISTS field_8 TEXT,   -- 수령인전화번호
  ADD COLUMN IF NOT EXISTS field_9 TEXT,   -- 주소
  ADD COLUMN IF NOT EXISTS field_10 TEXT,  -- 배송메세지
  ADD COLUMN IF NOT EXISTS field_11 TEXT,  -- 옵션명
  ADD COLUMN IF NOT EXISTS field_12 TEXT,  -- 수량
  ADD COLUMN IF NOT EXISTS field_13 TEXT,  -- 마켓 (중복)
  ADD COLUMN IF NOT EXISTS field_14 TEXT,  -- 확인
  ADD COLUMN IF NOT EXISTS field_15 TEXT,  -- 특이/요청사항
  ADD COLUMN IF NOT EXISTS field_16 TEXT,  -- 발송요청일
  ADD COLUMN IF NOT EXISTS field_17 TEXT,  -- 셀러
  ADD COLUMN IF NOT EXISTS field_18 TEXT,  -- 셀러공급가
  ADD COLUMN IF NOT EXISTS field_19 TEXT,  -- 출고처
  ADD COLUMN IF NOT EXISTS field_20 TEXT,  -- 송장주체
  ADD COLUMN IF NOT EXISTS field_21 TEXT,  -- 벤더사
  ADD COLUMN IF NOT EXISTS field_22 TEXT,  -- 발송지명
  ADD COLUMN IF NOT EXISTS field_23 TEXT,  -- 발송지주소
  ADD COLUMN IF NOT EXISTS field_24 TEXT,  -- 발송지연락처
  ADD COLUMN IF NOT EXISTS field_25 TEXT,  -- 출고비용
  ADD COLUMN IF NOT EXISTS field_26 TEXT,  -- 정산예정금액
  ADD COLUMN IF NOT EXISTS field_27 TEXT,  -- 정산대상금액
  ADD COLUMN IF NOT EXISTS field_28 TEXT,  -- 상품금액
  ADD COLUMN IF NOT EXISTS field_29 TEXT,  -- 최종결제금액
  ADD COLUMN IF NOT EXISTS field_30 TEXT,  -- 할인금액
  ADD COLUMN IF NOT EXISTS field_31 TEXT,  -- 마켓부담할인금액
  ADD COLUMN IF NOT EXISTS field_32 TEXT,  -- 판매자할인쿠폰할인
  ADD COLUMN IF NOT EXISTS field_33 TEXT,  -- 구매쿠폰적용금액
  ADD COLUMN IF NOT EXISTS field_34 TEXT,  -- 쿠폰할인금액
  ADD COLUMN IF NOT EXISTS field_35 TEXT,  -- 기타지원금할인금
  ADD COLUMN IF NOT EXISTS field_36 TEXT,  -- 수수료1
  ADD COLUMN IF NOT EXISTS field_37 TEXT,  -- 수수료2
  ADD COLUMN IF NOT EXISTS field_38 TEXT,  -- 판매아이디
  ADD COLUMN IF NOT EXISTS field_39 TEXT,  -- 분리배송 Y/N
  ADD COLUMN IF NOT EXISTS field_40 TEXT,  -- 택배비
  ADD COLUMN IF NOT EXISTS field_41 TEXT,  -- 발송일(송장입력일)
  ADD COLUMN IF NOT EXISTS field_42 TEXT,  -- 택배사
  ADD COLUMN IF NOT EXISTS field_43 TEXT;  -- 송장번호

-- 코멘트 추가
COMMENT ON COLUMN integrated_orders.field_1 IS '마켓명';
COMMENT ON COLUMN integrated_orders.field_2 IS '연번';
COMMENT ON COLUMN integrated_orders.field_3 IS '결제일';
COMMENT ON COLUMN integrated_orders.field_4 IS '주문번호';
COMMENT ON COLUMN integrated_orders.field_5 IS '주문자';
COMMENT ON COLUMN integrated_orders.field_6 IS '주문자전화번호';
COMMENT ON COLUMN integrated_orders.field_7 IS '수령인';
COMMENT ON COLUMN integrated_orders.field_8 IS '수령인전화번호';
COMMENT ON COLUMN integrated_orders.field_9 IS '주소';
COMMENT ON COLUMN integrated_orders.field_10 IS '배송메세지';
COMMENT ON COLUMN integrated_orders.field_11 IS '옵션명';
COMMENT ON COLUMN integrated_orders.field_12 IS '수량';
COMMENT ON COLUMN integrated_orders.field_13 IS '마켓 (확인용)';
COMMENT ON COLUMN integrated_orders.field_14 IS '확인';
COMMENT ON COLUMN integrated_orders.field_15 IS '특이/요청사항';
COMMENT ON COLUMN integrated_orders.field_16 IS '발송요청일';
COMMENT ON COLUMN integrated_orders.field_17 IS '셀러';
COMMENT ON COLUMN integrated_orders.field_18 IS '셀러공급가';
COMMENT ON COLUMN integrated_orders.field_19 IS '출고처';
COMMENT ON COLUMN integrated_orders.field_20 IS '송장주체';
COMMENT ON COLUMN integrated_orders.field_21 IS '벤더사';
COMMENT ON COLUMN integrated_orders.field_22 IS '발송지명';
COMMENT ON COLUMN integrated_orders.field_23 IS '발송지주소';
COMMENT ON COLUMN integrated_orders.field_24 IS '발송지연락처';
COMMENT ON COLUMN integrated_orders.field_25 IS '출고비용';
COMMENT ON COLUMN integrated_orders.field_26 IS '정산예정금액';
COMMENT ON COLUMN integrated_orders.field_27 IS '정산대상금액';
COMMENT ON COLUMN integrated_orders.field_28 IS '상품금액';
COMMENT ON COLUMN integrated_orders.field_29 IS '최종결제금액';
COMMENT ON COLUMN integrated_orders.field_30 IS '할인금액';
COMMENT ON COLUMN integrated_orders.field_31 IS '마켓부담할인금액';
COMMENT ON COLUMN integrated_orders.field_32 IS '판매자할인쿠폰할인';
COMMENT ON COLUMN integrated_orders.field_33 IS '구매쿠폰적용금액';
COMMENT ON COLUMN integrated_orders.field_34 IS '쿠폰할인금액';
COMMENT ON COLUMN integrated_orders.field_35 IS '기타지원금할인금';
COMMENT ON COLUMN integrated_orders.field_36 IS '수수료1';
COMMENT ON COLUMN integrated_orders.field_37 IS '수수료2';
COMMENT ON COLUMN integrated_orders.field_38 IS '판매아이디';
COMMENT ON COLUMN integrated_orders.field_39 IS '분리배송 Y/N';
COMMENT ON COLUMN integrated_orders.field_40 IS '택배비';
COMMENT ON COLUMN integrated_orders.field_41 IS '발송일(송장입력일)';
COMMENT ON COLUMN integrated_orders.field_42 IS '택배사';
COMMENT ON COLUMN integrated_orders.field_43 IS '송장번호';

-- 인덱스 추가 (자주 검색되는 필드만)
CREATE INDEX IF NOT EXISTS idx_integrated_orders_field_1 ON integrated_orders(field_1);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_field_4 ON integrated_orders(field_4);
CREATE INDEX IF NOT EXISTS idx_integrated_orders_field_11 ON integrated_orders(field_11);

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'integrated_orders 테이블에 field_1~field_43 추가 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '총 43개 표준필드 컬럼이 추가되었습니다.';
  RAISE NOTICE '기존 데이터는 유지되며, 새로운 주문은 field_X 형식으로 저장됩니다.';
  RAISE NOTICE '=================================================';
END $$;
