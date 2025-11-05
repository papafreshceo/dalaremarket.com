-- 티어 기준 설정 테이블
CREATE TABLE IF NOT EXISTS tier_criteria (
  id SERIAL PRIMARY KEY,
  tier TEXT NOT NULL UNIQUE, -- 'diamond', 'platinum', 'gold', 'silver', 'bronze'
  min_order_count INTEGER NOT NULL DEFAULT 0, -- 최소 주문 건수 (직전달 기준)
  min_total_sales NUMERIC NOT NULL DEFAULT 0, -- 최소 매출 금액 (직전달 기준)
  discount_rate NUMERIC NOT NULL DEFAULT 0, -- 할인율 (%)
  consecutive_months_for_bonus INTEGER DEFAULT NULL, -- 연속 유지 시 보너스 등급 부여 기준 (개월)
  bonus_tier_duration_months INTEGER DEFAULT 1, -- 보너스 등급 지속 기간 (개월)
  description TEXT, -- 설명
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 테이블에 새 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE tier_criteria ADD COLUMN IF NOT EXISTS discount_rate NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE tier_criteria ADD COLUMN IF NOT EXISTS consecutive_months_for_bonus INTEGER DEFAULT NULL;
ALTER TABLE tier_criteria ADD COLUMN IF NOT EXISTS bonus_tier_duration_months INTEGER DEFAULT 1;

-- 기존에 있던 period_months 컬럼 삭제 (더 이상 사용하지 않음)
ALTER TABLE tier_criteria DROP COLUMN IF EXISTS period_months;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tier_criteria_tier ON tier_criteria(tier);
CREATE INDEX IF NOT EXISTS idx_tier_criteria_active ON tier_criteria(is_active);

-- 코멘트
COMMENT ON TABLE tier_criteria IS '티어 등급 기준 설정 (매월 1일 직전달 실적 기준으로 판정)';
COMMENT ON COLUMN tier_criteria.tier IS '등급: diamond, platinum, gold, silver, bronze';
COMMENT ON COLUMN tier_criteria.min_order_count IS '최소 주문 건수 (AND 조건, 직전달 기준)';
COMMENT ON COLUMN tier_criteria.min_total_sales IS '최소 매출 금액 (AND 조건, 직전달 기준)';
COMMENT ON COLUMN tier_criteria.discount_rate IS '등급별 할인율 (%)';
COMMENT ON COLUMN tier_criteria.consecutive_months_for_bonus IS 'X개월 연속 유지 시 1단계 상위 등급 보너스 부여';
COMMENT ON COLUMN tier_criteria.bonus_tier_duration_months IS '보너스 등급 지속 기간 (개월)';

-- 기본 티어 기준 삽입 또는 업데이트
INSERT INTO tier_criteria (tier, min_order_count, min_total_sales, discount_rate, consecutive_months_for_bonus, bonus_tier_duration_months, description) VALUES
  ('diamond', 500, 50000000, 10.0, 3, 1, '월 500건 이상 + 5천만원 이상 (10% 할인)'),
  ('platinum', 300, 30000000, 7.5, 3, 1, '월 300건 이상 + 3천만원 이상 (7.5% 할인)'),
  ('gold', 150, 15000000, 5.0, 3, 1, '월 150건 이상 + 1천5백만원 이상 (5% 할인)'),
  ('silver', 50, 5000000, 3.0, 3, 1, '월 50건 이상 + 5백만원 이상 (3% 할인)'),
  ('bronze', 1, 1, 0, NULL, 1, '월 1건 이상 (할인 없음)')
ON CONFLICT (tier) DO UPDATE SET
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
