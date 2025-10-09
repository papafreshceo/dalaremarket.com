-- 모든 거래처 일괄 삭제 스크립트

-- 1. 모든 원자재의 거래처 참조를 NULL로 변경
UPDATE raw_materials
SET main_supplier_id = NULL
WHERE main_supplier_id IS NOT NULL;

-- 2. 모든 거래처 삭제
DELETE FROM partners;
