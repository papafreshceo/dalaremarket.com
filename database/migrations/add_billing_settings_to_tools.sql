-- tools_master 테이블에 과금 방식 설정 컬럼 추가

-- 과금 방식 타입 추가
ALTER TABLE tools_master
ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'on_open';
-- 'on_open': 모달 열 때 1회 차감 (기본)
-- 'on_action': 실행 버튼 클릭 시 차감 (주문통합, 상품명 최적화 등)
-- 'hourly': 시간당 차감 (마진계산기, 시뮬레이터 대안)

-- 시간당 차감일 경우 간격 (분 단위)
ALTER TABLE tools_master
ADD COLUMN IF NOT EXISTS billing_interval_minutes INTEGER DEFAULT 60;

-- 과금 방식 설명 (관리자 참고용)
ALTER TABLE tools_master
ADD COLUMN IF NOT EXISTS billing_description TEXT;

-- 실행 버튼 목록 (버튼별 크레딧 설정)
-- 예시: [{"id": "integrate", "label": "통합하기", "credits": 5}, {"id": "download", "label": "다운로드", "credits": 1}]
ALTER TABLE tools_master
ADD COLUMN IF NOT EXISTS action_buttons JSONB DEFAULT '[]';

-- 기존 도구들의 billing_type 설정
UPDATE tools_master SET billing_type = 'on_open', billing_description = '모달 열 때 1회 차감' WHERE id = 'margin-calculator';
UPDATE tools_master SET billing_type = 'on_open', billing_description = '모달 열 때 1회 차감' WHERE id = 'price-simulator';
UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '통합하기 버튼 클릭 시 차감',
  action_buttons = '[
    {"id": "integrate", "label": "통합하기", "credits": 5},
    {"id": "download", "label": "엑셀 다운로드", "credits": 1}
  ]'::jsonb
WHERE id = 'order-integration';
UPDATE tools_master SET billing_type = 'on_open', billing_description = '모달 열 때 1회 차감' WHERE id = 'option-pricing';
UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '분석 실행 시 차감',
  action_buttons = '[{"id": "analyze", "label": "분석 실행", "credits": 10}]'::jsonb
WHERE id = 'sales-analytics';

UPDATE tools_master SET billing_type = 'on_open', billing_description = '모달 열 때 1회 차감' WHERE id = 'customer-message';

UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '생성 버튼 클릭 시 차감',
  action_buttons = '[{"id": "generate", "label": "명세서 생성", "credits": 2}]'::jsonb
WHERE id = 'transaction-statement';

UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '추적 시작 시 차감',
  action_buttons = '[{"id": "start_tracking", "label": "추적 시작", "credits": 5}]'::jsonb
WHERE id = 'inventory-tracker';

UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '최적화 버튼 클릭 시 차감',
  action_buttons = '[{"id": "optimize", "label": "최적화", "credits": 3}]'::jsonb
WHERE id = 'product-name-optimizer';

UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '분석 실행 시 차감',
  action_buttons = '[{"id": "analyze", "label": "리뷰 분석", "credits": 5}]'::jsonb
WHERE id = 'review-analyzer';

UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '순위 확인 시 차감',
  action_buttons = '[{"id": "check_rank", "label": "순위 확인", "credits": 5}]'::jsonb
WHERE id = 'category-rank-checker';

UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '트렌드 분석 실행 시 차감',
  action_buttons = '[{"id": "analyze_trend", "label": "트렌드 분석", "credits": 10}]'::jsonb
WHERE id = 'trend-analysis';

UPDATE tools_master SET
  billing_type = 'on_action',
  billing_description = '모니터링 시작 시 차감',
  action_buttons = '[{"id": "start_monitoring", "label": "모니터링 시작", "credits": 15}]'::jsonb
WHERE id = 'competitor-monitor';

-- 확인
SELECT id, name, billing_type, credits_required, billing_interval_minutes, billing_description
FROM tools_master
ORDER BY display_order;
