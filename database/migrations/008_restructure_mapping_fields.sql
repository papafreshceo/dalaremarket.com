-- ===========================
-- 표준필드 매핑 테이블 구조 변경
-- ===========================
-- 기존: (market_name, standard_field, market_field) 구조
-- 신규: 1행은 표준필드명(한글), 2행부터는 각 마켓별 매핑값

-- 기존 테이블 백업
CREATE TABLE IF NOT EXISTS mapping_settings_standard_fields_backup AS
SELECT * FROM mapping_settings_standard_fields;

-- 기존 테이블 삭제
DROP TABLE IF EXISTS mapping_settings_standard_fields;

-- 새 테이블 생성 (43개 표준필드)
CREATE TABLE mapping_settings_standard_fields (
  id SERIAL PRIMARY KEY,
  market_name VARCHAR(50) NOT NULL UNIQUE, -- 마켓명 (첫 행은 '표준필드')
  field_1 VARCHAR(200), -- 마켓명
  field_2 VARCHAR(200), -- 연번
  field_3 VARCHAR(200), -- 결제일
  field_4 VARCHAR(200), -- 주문번호
  field_5 VARCHAR(200), -- 주문자
  field_6 VARCHAR(200), -- 주문자전화번호
  field_7 VARCHAR(200), -- 수령인
  field_8 VARCHAR(200), -- 수령인전화번호
  field_9 VARCHAR(200), -- 주소
  field_10 VARCHAR(200), -- 배송메세지
  field_11 VARCHAR(200), -- 옵션명
  field_12 VARCHAR(200), -- 수량
  field_13 VARCHAR(200), -- 마켓
  field_14 VARCHAR(200), -- 확인
  field_15 VARCHAR(200), -- 특이/요청사항
  field_16 VARCHAR(200), -- 발송요청일
  field_17 VARCHAR(200), -- 셀러
  field_18 VARCHAR(200), -- 셀러공급가
  field_19 VARCHAR(200), -- 출고처
  field_20 VARCHAR(200), -- 송장주체
  field_21 VARCHAR(200), -- 벤더사
  field_22 VARCHAR(200), -- 발송지명
  field_23 VARCHAR(200), -- 발송지주소
  field_24 VARCHAR(200), -- 발송지연락처
  field_25 VARCHAR(200), -- 출고비용
  field_26 VARCHAR(200), -- 정산예정금액
  field_27 VARCHAR(200), -- 정산대상금액
  field_28 VARCHAR(200), -- 상품금액
  field_29 VARCHAR(200), -- 최종결제금액
  field_30 VARCHAR(200), -- 할인금액
  field_31 VARCHAR(200), -- 마켓부담할인금액
  field_32 VARCHAR(200), -- 판매자할인쿠폰할인
  field_33 VARCHAR(200), -- 구매쿠폰적용금액
  field_34 VARCHAR(200), -- 쿠폰할인금액
  field_35 VARCHAR(200), -- 기타지원금할인금
  field_36 VARCHAR(200), -- 수수료1
  field_37 VARCHAR(200), -- 수수료2
  field_38 VARCHAR(200), -- 판매아이디
  field_39 VARCHAR(200), -- 분리배송 Y/N
  field_40 VARCHAR(200), -- 택배비
  field_41 VARCHAR(200), -- 발송일(송장입력일)
  field_42 VARCHAR(200), -- 택배사
  field_43 VARCHAR(200), -- 송장번호
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_mapping_fields_market ON mapping_settings_standard_fields(market_name);

-- 트리거
CREATE TRIGGER update_mapping_fields_updated_at
  BEFORE UPDATE ON mapping_settings_standard_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 첫 번째 행: 표준필드 한글명
INSERT INTO mapping_settings_standard_fields (
  market_name,
  field_1, field_2, field_3, field_4, field_5, field_6, field_7, field_8, field_9, field_10,
  field_11, field_12, field_13, field_14, field_15, field_16, field_17, field_18, field_19, field_20,
  field_21, field_22, field_23, field_24, field_25, field_26, field_27, field_28, field_29, field_30,
  field_31, field_32, field_33, field_34, field_35, field_36, field_37, field_38, field_39, field_40,
  field_41, field_42, field_43
) VALUES (
  '표준필드',
  '마켓명', '연번', '결제일', '주문번호', '주문자', '주문자전화번호', '수령인', '수령인전화번호', '주소', '배송메세지',
  '옵션명', '수량', '마켓', '확인', '특이/요청사항', '발송요청일', '셀러', '셀러공급가', '출고처', '송장주체',
  '벤더사', '발송지명', '발송지주소', '발송지연락처', '출고비용', '정산예정금액', '정산대상금액', '상품금액', '최종결제금액', '할인금액',
  '마켓부담할인금액', '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액', '기타지원금할인금', '수수료1', '수수료2', '판매아이디', '분리배송 Y/N', '택배비',
  '발송일(송장입력일)', '택배사', '송장번호'
);

-- 기존 데이터 마이그레이션
-- 각 마켓별로 행 생성
INSERT INTO mapping_settings_standard_fields (market_name)
SELECT DISTINCT market_name
FROM mapping_settings_standard_fields_backup
WHERE market_name != '표준필드'
ORDER BY market_name;

-- 스마트스토어 데이터 마이그레이션
UPDATE mapping_settings_standard_fields SET
  field_3 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'payment_date'),
  field_4 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'order_number'),
  field_5 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'buyer_name'),
  field_6 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'buyer_phone'),
  field_7 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'recipient_name'),
  field_8 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'recipient_phone'),
  field_9 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'recipient_address'),
  field_10 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'delivery_message'),
  field_11 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'option_name'),
  field_12 = (SELECT market_field FROM mapping_settings_standard_fields_backup WHERE market_name = '스마트스토어' AND standard_field = 'quantity')
WHERE market_name = '스마트스토어';

COMMENT ON TABLE mapping_settings_standard_fields IS '마켓별 표준필드 매핑 (1행: 표준필드명, 2행~: 마켓별 매핑값)';
COMMENT ON COLUMN mapping_settings_standard_fields.market_name IS '마켓명 (첫 행은 "표준필드")';
