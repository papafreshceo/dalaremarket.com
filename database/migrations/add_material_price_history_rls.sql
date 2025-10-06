-- ============================================
-- material_price_history 테이블 RLS 정책 추가
-- ============================================

-- RLS 활성화
ALTER TABLE material_price_history ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON material_price_history;

-- 인증된 사용자에게 모든 권한 부여
CREATE POLICY "Allow all for authenticated users"
  ON material_price_history FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 완료
SELECT '✅ material_price_history 테이블 RLS 정책 추가 완료!' as result;
