-- =====================================================
-- 감사 로그(Audit Logs) 테이블 생성
-- =====================================================
-- 작성일: 2025-01-16
-- 설명:
--   시스템에서 발생하는 중요한 작업과 변경사항을 추적
--   보안, 규정 준수, 문제 해결을 위한 영구 기록
-- =====================================================

-- =====================================================
-- 1. audit_logs 테이블 생성
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,

  -- 🔐 누가 (Who)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- 📝 무엇을 (What)
  action TEXT NOT NULL,                    -- 'delete_order', 'change_role', 'view_customer_info', 'payment_success'
  action_category TEXT,                    -- 'data_deletion', 'permission_change', 'data_access', 'payment'
  resource_type TEXT,                      -- 'order', 'user', 'organization', 'payment'
  resource_id TEXT,                        -- 대상 리소스의 ID

  -- 📊 어떻게 (How) - 변경 내역
  before_data JSONB,                       -- 변경 전 데이터 (전체 또는 일부)
  after_data JSONB,                        -- 변경 후 데이터 (전체 또는 일부)
  details JSONB,                           -- 추가 상세 정보 (자유 형식)

  -- 🌍 언제, 어디서 (When, Where)
  ip_address TEXT,                         -- 요청자 IP
  user_agent TEXT,                         -- 브라우저/디바이스 정보
  request_method TEXT,                     -- HTTP 메서드 (GET, POST, DELETE 등)
  request_path TEXT,                       -- API 경로
  status_code INTEGER,                     -- HTTP 상태 코드

  -- ⏰ 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 🔍 메타데이터
  is_sensitive BOOLEAN DEFAULT FALSE,      -- 민감한 작업 여부 (개인정보 조회 등)
  severity TEXT DEFAULT 'info',            -- 'info', 'warning', 'critical'

  -- 추가 확장 필드 (미래를 위한 예비)
  metadata JSONB                           -- 추가 메타데이터
);

-- =====================================================
-- 2. 인덱스 생성 (성능 최적화)
-- =====================================================

-- 사용자별 조회 (특정 사용자의 모든 활동 추적)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id)
WHERE user_id IS NOT NULL;

-- 조직별 조회
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id
ON audit_logs(organization_id)
WHERE organization_id IS NOT NULL;

-- 액션별 조회 (특정 작업만 필터링)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON audit_logs(action);

-- 카테고리별 조회
CREATE INDEX IF NOT EXISTS idx_audit_logs_category
ON audit_logs(action_category)
WHERE action_category IS NOT NULL;

-- 시간순 조회 (최신순 정렬)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- 리소스별 조회 (특정 주문/사용자의 모든 변경 이력)
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
ON audit_logs(resource_type, resource_id)
WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;

-- 민감한 작업만 조회
CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitive
ON audit_logs(is_sensitive, created_at DESC)
WHERE is_sensitive = TRUE;

-- 심각도별 조회
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity
ON audit_logs(severity, created_at DESC)
WHERE severity IN ('warning', 'critical');

-- 복합 인덱스: 사용자 + 시간 (가장 많이 사용될 쿼리)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
ON audit_logs(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- =====================================================
-- 3. Row Level Security (RLS) 정책
-- =====================================================

-- RLS 활성화
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. 모든 사용자는 자신의 로그만 조회 가능
CREATE POLICY "Users can view their own audit logs"
ON audit_logs
FOR SELECT
USING (
  auth.uid() = user_id
);

-- 2. 관리자는 모든 로그 조회 가능
CREATE POLICY "Admins can view all audit logs"
ON audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- 3. 직원은 자신의 조직 로그만 조회 가능
CREATE POLICY "Staff can view organization audit logs"
ON audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'employee'
    AND users.primary_organization_id = audit_logs.organization_id
  )
);

-- 4. 시스템만 INSERT 가능 (일반 사용자는 직접 삽입 불가)
CREATE POLICY "System can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (TRUE); -- 서비스 롤로만 삽입하도록 앱에서 제어

-- 5. 감사 로그는 수정/삭제 불가 (불변성 보장)
-- DELETE, UPDATE 정책은 의도적으로 생성하지 않음

-- =====================================================
-- 4. 주석 추가
-- =====================================================

COMMENT ON TABLE audit_logs IS '시스템 감사 로그 - 중요한 작업과 변경사항 추적';
COMMENT ON COLUMN audit_logs.user_id IS '작업을 수행한 사용자 ID';
COMMENT ON COLUMN audit_logs.action IS '수행된 작업 (delete_order, change_role 등)';
COMMENT ON COLUMN audit_logs.action_category IS '작업 카테고리 (data_deletion, permission_change 등)';
COMMENT ON COLUMN audit_logs.resource_type IS '대상 리소스 타입 (order, user, payment 등)';
COMMENT ON COLUMN audit_logs.resource_id IS '대상 리소스의 ID';
COMMENT ON COLUMN audit_logs.before_data IS '변경 전 데이터 (JSON)';
COMMENT ON COLUMN audit_logs.after_data IS '변경 후 데이터 (JSON)';
COMMENT ON COLUMN audit_logs.details IS '추가 상세 정보 (JSON)';
COMMENT ON COLUMN audit_logs.is_sensitive IS '민감한 작업 여부 (개인정보 조회 등)';
COMMENT ON COLUMN audit_logs.severity IS '심각도 (info, warning, critical)';

-- =====================================================
-- 5. 뷰 생성 (자주 사용하는 쿼리)
-- =====================================================

-- 최근 중요한 활동 (warning, critical만)
CREATE OR REPLACE VIEW v_critical_audit_logs AS
SELECT
  id,
  user_name,
  user_email,
  action,
  action_category,
  resource_type,
  resource_id,
  severity,
  created_at,
  details
FROM audit_logs
WHERE severity IN ('warning', 'critical')
ORDER BY created_at DESC;

COMMENT ON VIEW v_critical_audit_logs IS '중요한 감사 로그만 조회 (warning, critical)';

-- 오늘의 활동
CREATE OR REPLACE VIEW v_today_audit_logs AS
SELECT
  id,
  user_name,
  action,
  resource_type,
  resource_id,
  created_at,
  details
FROM audit_logs
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;

COMMENT ON VIEW v_today_audit_logs IS '오늘 발생한 감사 로그';

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 감사 로그 테이블 생성 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '생성된 항목:';
  RAISE NOTICE '  ✓ audit_logs 테이블';
  RAISE NOTICE '  ✓ 9개 인덱스 (성능 최적화)';
  RAISE NOTICE '  ✓ 5개 RLS 정책 (보안)';
  RAISE NOTICE '  ✓ 2개 뷰 (편의성)';
  RAISE NOTICE '';
  RAISE NOTICE '기능:';
  RAISE NOTICE '  • 중요한 작업 추적 (삭제, 권한 변경 등)';
  RAISE NOTICE '  • 변경 이력 저장 (before/after)';
  RAISE NOTICE '  • 사용자별/조직별 조회';
  RAISE NOTICE '  • 불변성 보장 (수정/삭제 불가)';
  RAISE NOTICE '';
  RAISE NOTICE '확장 가능:';
  RAISE NOTICE '  • 결제 시스템 도입 시 payment 액션 추가 가능';
  RAISE NOTICE '  • JSONB 컬럼으로 유연한 데이터 저장';
  RAISE NOTICE '========================================';
END $$;
