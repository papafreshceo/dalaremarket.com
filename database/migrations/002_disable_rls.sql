-- =====================================================
-- RLS (Row Level Security) 제거
-- =====================================================
-- 관리자 페이지는 페이지 레벨에서 인증 체크를 하므로
-- 테이블 레벨의 RLS는 불필요합니다.

ALTER TABLE integrated_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_mapping DISABLE ROW LEVEL SECURITY;
ALTER TABLE cs_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE regular_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_marketing_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_upload_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE courier_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_templates DISABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "관리자는 모든 주문 조회 가능" ON integrated_orders;
DROP POLICY IF EXISTS "관리자는 주문 생성 가능" ON integrated_orders;
DROP POLICY IF EXISTS "관리자는 주문 수정 가능" ON integrated_orders;
DROP POLICY IF EXISTS "관리자는 주문 삭제 가능" ON integrated_orders;

DROP POLICY IF EXISTS "관리자는 제품 매핑 조회 가능" ON product_mapping;
DROP POLICY IF EXISTS "관리자는 제품 매핑 관리 가능" ON product_mapping;

DROP POLICY IF EXISTS "관리자는 CS 기록 관리 가능" ON cs_records;
DROP POLICY IF EXISTS "관리자는 고객 정보 관리 가능" ON regular_customers;
DROP POLICY IF EXISTS "관리자는 마케팅 대상 관리 가능" ON sms_marketing_targets;
DROP POLICY IF EXISTS "관리자는 마켓 템플릿 관리 가능" ON market_upload_templates;
DROP POLICY IF EXISTS "관리자는 택배사 템플릿 관리 가능" ON courier_templates;
DROP POLICY IF EXISTS "관리자는 벤더사 템플릿 관리 가능" ON vendor_templates;
