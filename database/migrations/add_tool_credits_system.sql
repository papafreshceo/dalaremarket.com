-- Create tools_master table for tool management
CREATE TABLE IF NOT EXISTS tools_master (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  credits_required INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  icon_gradient TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add credits column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1000;

-- Create user_credit_history table for tracking credit usage
CREATE TABLE IF NOT EXISTS user_credit_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id TEXT REFERENCES tools_master(id),
  credits_used INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'use', 'purchase', 'reward', 'refund'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tools_master_category ON tools_master(category);
CREATE INDEX IF NOT EXISTS idx_tools_master_active ON tools_master(is_active);
CREATE INDEX IF NOT EXISTS idx_user_credit_history_user_id ON user_credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_history_tool_id ON user_credit_history(tool_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_history_created_at ON user_credit_history(created_at);

-- Add comments
COMMENT ON TABLE tools_master IS '도구 마스터 데이터 (도구별 설정 정보)';
COMMENT ON COLUMN tools_master.credits_required IS '도구 사용에 필요한 크레딧';
COMMENT ON COLUMN users.credits IS '사용자 보유 크레딧';
COMMENT ON TABLE user_credit_history IS '사용자 크레딧 사용 이력';

-- Insert default tools data
INSERT INTO tools_master (id, name, description, category, credits_required, is_premium, icon_gradient, display_order)
VALUES
  ('margin-calculator', '마진계산기', '원가와 판매가를 입력하여 마진율을 자동 계산', 'essential', 1, false, 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 1),
  ('price-simulator', '판매가 시뮬레이터', '다양한 조건에서의 최적 판매가격을 시뮬레이션', 'essential', 2, false, 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 2),
  ('order-integration', '주문통합 (Excel)', '여러 채널의 주문을 하나의 엑셀로 통합 관리', 'data', 5, false, 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 3),
  ('option-pricing', '옵션가 세팅', '상품 옵션별 가격을 효율적으로 설정 및 관리', 'pricing', 3, false, 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 4),
  ('sales-analytics', '매출 분석', '기간별, 상품별 매출 현황을 시각화하여 분석', 'analytics', 10, true, 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', 5),
  ('customer-message', '고객 메시지', '고객에게 발송할 메시지 템플릿 관리', 'communication', 1, false, 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', 6),
  ('transaction-statement', '거래명세서 즉시 발급', '거래명세서를 즉시 생성하고 다운로드', 'essential', 2, false, 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', 7),
  ('inventory-tracker', '재고 추적', '실시간 재고 현황 모니터링', 'data', 5, false, 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', 8),
  ('product-name-optimizer', '상품명 최적화', 'SEO를 고려한 최적의 상품명 제안', 'analytics', 3, false, 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', 9),
  ('review-analyzer', '리뷰 분석', '고객 리뷰를 분석하여 인사이트 도출', 'analytics', 5, true, 'linear-gradient(135deg, #9890e3 0%, #b1f4cf 100%)', 10),
  ('category-rank-checker', '카테고리 순위 체커', '카테고리별 순위를 확인하고 추적', 'analytics', 5, true, 'linear-gradient(135deg, #ebc0fd 0%, #d9ded8 100%)', 11),
  ('trend-analysis', '트렌드 분석', '시장 트렌드를 분석하여 기회 포착', 'analytics', 10, true, 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)', 12),
  ('competitor-monitor', '경쟁사 모니터링', '경쟁사의 가격과 재고를 실시간 모니터링', 'analytics', 15, true, 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)', 13)
ON CONFLICT (id) DO NOTHING;

-- Function to use credits
CREATE OR REPLACE FUNCTION use_credits(
  p_user_id UUID,
  p_tool_id TEXT,
  p_credits INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_credits INTEGER;
  v_tool_name TEXT;
BEGIN
  -- Get current credits
  SELECT credits INTO v_current_credits
  FROM users
  WHERE id = p_user_id;

  -- Check if user has enough credits
  IF v_current_credits < p_credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'current_credits', v_current_credits,
      'required_credits', p_credits
    );
  END IF;

  -- Get tool name
  SELECT name INTO v_tool_name
  FROM tools_master
  WHERE id = p_tool_id;

  -- Deduct credits
  UPDATE users
  SET credits = credits - p_credits
  WHERE id = p_user_id;

  -- Record credit history
  INSERT INTO user_credit_history (
    user_id,
    tool_id,
    credits_used,
    credits_before,
    credits_after,
    transaction_type,
    description
  ) VALUES (
    p_user_id,
    p_tool_id,
    p_credits,
    v_current_credits,
    v_current_credits - p_credits,
    'use',
    v_tool_name || ' 도구 사용'
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_before', v_current_credits,
    'credits_after', v_current_credits - p_credits,
    'credits_used', p_credits
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION use_credits IS '크레딧 차감 및 사용 이력 기록';
