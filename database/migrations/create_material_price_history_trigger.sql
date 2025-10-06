-- ============================================
-- 시세 기록 시 원물 테이블 자동 업데이트 트리거
-- ============================================
-- material_price_history에 시세 기록 시
-- raw_materials.latest_price, last_transaction_date 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION update_raw_material_latest_price()
RETURNS TRIGGER AS $$
BEGIN
  -- raw_materials 테이블의 최근시세와 최근거래일 업데이트
  UPDATE raw_materials
  SET
    latest_price = NEW.price,
    last_trade_date = NEW.effective_date,
    updated_at = NOW()
  WHERE id = NEW.material_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_latest_price ON material_price_history;
CREATE TRIGGER trigger_update_latest_price
  AFTER INSERT ON material_price_history
  FOR EACH ROW
  EXECUTE FUNCTION update_raw_material_latest_price();

-- 완료
SELECT '✅ 시세 기록 시 원물 테이블 자동 업데이트 트리거 생성 완료!' as result;
SELECT '📊 이제 시세를 기록하면 raw_materials.latest_price가 자동으로 업데이트됩니다.' as info;
