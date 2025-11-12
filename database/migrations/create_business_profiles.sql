-- =====================================================
-- 사업자 정보 관리 시스템
-- =====================================================
-- 작성일: 2025-11-12
-- 설명:
--   - 한 조직이 여러 사업자번호를 관리할 수 있도록 지원
--   - 계정은 1개, 사업자 정보만 추가 가능
--   - 발주/정산 시 사업자 선택하여 사용
-- =====================================================

-- 1. 사업자 정보 테이블 생성
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 소속 조직
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- 사업자 정보
  business_name VARCHAR(255) NOT NULL,
  business_number VARCHAR(50),
  representative_name VARCHAR(100),
  business_address TEXT,
  business_phone VARCHAR(50),
  business_email VARCHAR(255),

  -- 정산 정보
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_holder VARCHAR(100),
  tax_invoice_email VARCHAR(255),

  -- 수수료 및 정산 주기
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  settlement_cycle VARCHAR(50) DEFAULT '월1회',

  -- 메모
  memo TEXT,

  -- 활성화 상태
  is_active BOOLEAN DEFAULT true,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약 조건
  CONSTRAINT unique_business_number_per_org UNIQUE(organization_id, business_number)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_business_profiles_org_id ON business_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_active ON business_profiles(is_active);

-- 3. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_profiles_updated_at ON business_profiles;
CREATE TRIGGER business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_business_profiles_updated_at();

-- 4. 코멘트 추가
COMMENT ON TABLE business_profiles IS '조직의 추가 사업자 정보 (발주/정산용)';
COMMENT ON COLUMN business_profiles.organization_id IS '소속 조직 ID';
COMMENT ON COLUMN business_profiles.business_name IS '사업자명 (상호)';
COMMENT ON COLUMN business_profiles.business_number IS '사업자등록번호';
COMMENT ON COLUMN business_profiles.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN business_profiles.settlement_cycle IS '정산 주기 (월1회, 월2회 등)';

-- 5. RLS 정책 설정
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- 조직 멤버는 자신의 조직 사업자 정보 조회 가능
CREATE POLICY "조직 멤버는 자신의 조직 사업자 정보 조회 가능"
  ON business_profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 조직 소유자/관리자는 사업자 정보 추가 가능
CREATE POLICY "조직 소유자/관리자는 사업자 정보 추가 가능"
  ON business_profiles FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
    )
  );

-- 조직 소유자/관리자는 사업자 정보 수정 가능
CREATE POLICY "조직 소유자/관리자는 사업자 정보 수정 가능"
  ON business_profiles FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
    )
  );

-- 조직 소유자만 사업자 정보 삭제 가능
CREATE POLICY "조직 소유자만 사업자 정보 삭제 가능"
  ON business_profiles FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = 'owner'
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 사업자 정보 관리 시스템 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- business_profiles 테이블 생성';
  RAISE NOTICE '- 한 조직이 여러 사업자 정보 관리 가능';
  RAISE NOTICE '- 발주/정산 시 사업자 선택하여 사용';
  RAISE NOTICE '- 메인 사업자는 organizations 테이블 정보 사용';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '사용 방법:';
  RAISE NOTICE '1. 기본 사업자: organizations 테이블의 정보 사용';
  RAISE NOTICE '2. 추가 사업자: business_profiles에 등록';
  RAISE NOTICE '3. 발주/정산 시: 사업자 선택 (기본 또는 추가)';
  RAISE NOTICE '4. 캐시/크레딧/점수: 항상 조직 단위로 관리';
  RAISE NOTICE '=================================================';
END $$;
