-- supply_status는 한글 값으로 자유롭게 입력 가능하도록 검증 트리거 제거
-- UI에서 드롭다운으로 관리

DROP TRIGGER IF EXISTS trigger_validate_products_master_supply_status ON products_master;
DROP FUNCTION IF EXISTS validate_products_master_supply_status();
