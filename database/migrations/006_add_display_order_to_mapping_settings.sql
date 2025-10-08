-- ===========================
-- mapping_settings 테이블에 순서 컬럼 추가
-- ===========================

ALTER TABLE mapping_settings ADD COLUMN display_order INTEGER;

-- 기존 데이터에 순서 부여 (마켓명 순서대로)
UPDATE mapping_settings SET display_order = 1 WHERE market_name = '스마트스토어';
UPDATE mapping_settings SET display_order = 2 WHERE market_name = 'esm';
UPDATE mapping_settings SET display_order = 3 WHERE market_name = '토스';
UPDATE mapping_settings SET display_order = 4 WHERE market_name = '달래마켓';
UPDATE mapping_settings SET display_order = 5 WHERE market_name = '올웨이즈';
UPDATE mapping_settings SET display_order = 6 WHERE market_name = '쿠팡';
UPDATE mapping_settings SET display_order = 7 WHERE market_name = '11번가';
UPDATE mapping_settings SET display_order = 8 WHERE market_name = '카카오';
UPDATE mapping_settings SET display_order = 9 WHERE market_name = 'CS발송';
UPDATE mapping_settings SET display_order = 10 WHERE market_name = '전화주문';

-- 인덱스 추가
CREATE INDEX idx_mapping_settings_display_order ON mapping_settings(display_order);

COMMENT ON COLUMN mapping_settings.display_order IS '표시 순서 (정렬용)';
