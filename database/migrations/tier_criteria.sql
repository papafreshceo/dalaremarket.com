-- 티어 기준 설정 테이블
CREATE TABLE IF NOT EXISTS tier_criteria (
  id SERIAL PRIMARY KEY,
  tier TEXT NOT NULL UNIQUE,
  min_order_count INTEGER NOT NULL DEFAULT 0,
  min_total_sales NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discount_rate NUMERIC NOT NULL DEFAULT 0,
  consecutive_months_for_bonus INTEGER,
  bonus_tier_duration_months INTEGER DEFAULT 1
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tier_criteria_tier ON tier_criteria(tier);
CREATE INDEX IF NOT EXISTS idx_tier_criteria_active ON tier_criteria(is_active);

-- 코멘트
COMMENT ON TABLE tier_criteria IS '티어 등급 기준 설정 (매월 1일 직전달 실적 기준으로 판정)';
COMMENT ON COLUMN tier_criteria.tier IS '등급: LEGEND, ELITE, ADVANCE, STANDARD, LIGHT';
COMMENT ON COLUMN tier_criteria.min_order_count IS '최소 주문 건수 (AND 조건, 직전달 기준)';
COMMENT ON COLUMN tier_criteria.min_total_sales IS '최소 매출 금액 (AND 조건, 직전달 기준)';
COMMENT ON COLUMN tier_criteria.discount_rate IS '등급별 할인율 (%)';
COMMENT ON COLUMN tier_criteria.consecutive_months_for_bonus IS 'X개월 연속 유지 시 1단계 상위 등급 보너스 부여';
COMMENT ON COLUMN tier_criteria.bonus_tier_duration_months IS '보너스 등급 지속 기간 (개월)';

-- 기본 티어 기준 삽입 또는 업데이트
INSERT INTO tier_criteria (tier, min_order_count, min_total_sales, discount_rate, consecutive_months_for_bonus, bonus_tier_duration_months, description) VALUES
  ('LEGEND', 1000, 100000000, 2.5, 3, 1, '월 1000건 이상 + 1.0억 이상 (2.50% 할인)'),
  ('ELITE', 700, 70000000, 2.0, 3, 1, '월 700건 이상 + 7000만 이상 (2% 할인)'),
  ('ADVANCE', 400, 40000000, 1.5, 3, 1, '월 400건 이상 + 4000만 이상 (1.50% 할인)'),
  ('STANDARD', 100, 10000000, 1.0, 3, 1, '월 100건 이상 + 1000만 이상 (1% 할인)'),
  ('LIGHT', 1, 1, 0.5, NULL, 1, '월 1건 이상 + 1 이상 (0.50% 할인)')
ON CONFLICT (tier) DO UPDATE SET
  min_order_count = EXCLUDED.min_order_count,
  min_total_sales = EXCLUDED.min_total_sales,
  discount_rate = EXCLUDED.discount_rate,
  consecutive_months_for_bonus = EXCLUDED.consecutive_months_for_bonus,
  bonus_tier_duration_months = EXCLUDED.bonus_tier_duration_months,
  description = EXCLUDED.description;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_tier_criteria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_tier_criteria_updated_at ON tier_criteria;
CREATE TRIGGER trigger_tier_criteria_updated_at
  BEFORE UPDATE ON tier_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_criteria_updated_at();
