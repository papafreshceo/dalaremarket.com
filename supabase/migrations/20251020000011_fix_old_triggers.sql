-- 오래된 트리거 및 함수 제거 (raw_material_status 참조하는 것들)

-- 1. products_master 관련 오래된 트리거 모두 제거
DROP TRIGGER IF EXISTS trigger_validate_products_master_raw_material_status ON products_master;
DROP TRIGGER IF EXISTS trigger_validate_products_master_status ON products_master;
DROP FUNCTION IF EXISTS validate_products_master_raw_material_status();
DROP FUNCTION IF EXISTS validate_products_master_status();

-- 2. 현재 사용 중인 트리거만 남김 (supply_status 사용)
-- validate_products_master_supply_status 함수와 트리거는 20251020000007에서 이미 생성됨
