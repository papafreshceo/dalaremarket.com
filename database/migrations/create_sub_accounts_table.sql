-- =====================================================
-- 서브 계정 (정산용 사업자 정보) 테이블 생성
-- =====================================================
-- 작성일: 2025-11-13
-- 설명:
--   - 메인 계정(organizations)은 1개 (캐시/크레딧/포인트/티어 관리)
--   - 서브 계정(sub_accounts)은 여러 개 (발주/정산용 사업자 정보)
--   - 모든 활동은 메인 계정에 귀속, 서브는 정산서 발행용
-- =====================================================

-- 1. sub_accounts 테이블 생성
CREATE TABLE IF NOT EXISTS sub_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- 사업자 정보
  business_name VARCHAR(255) NOT NULL,
  business_number VARCHAR(50) NOT NULL,
  representative_name VARCHAR(100),
  address TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  fax VARCHAR(20),

  -- 계좌 정보
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_holder VARCHAR(100),

  -- 메타 정보
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sub_accounts_organization_id
ON sub_accounts(organization_id);

CREATE INDEX IF NOT EXISTS idx_sub_accounts_business_number
ON sub_accounts(business_number);

CREATE INDEX IF NOT EXISTS idx_sub_accounts_is_active
ON sub_accounts(is_active);

-- 3. 트리거 생성 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_sub_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sub_accounts_updated_at
  BEFORE UPDATE ON sub_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_sub_accounts_updated_at();

-- 4. RLS (Row Level Security) 정책
ALTER TABLE sub_accounts ENABLE ROW LEVEL SECURITY;

-- 본인 조직의 서브 계정만 조회/수정 가능
CREATE POLICY "Users can view their organization's sub accounts"
  ON sub_accounts FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sub accounts for their organization"
  ON sub_accounts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's sub accounts"
  ON sub_accounts FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's sub accounts"
  ON sub_accounts FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ sub_accounts 테이블 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '구조:';
  RAISE NOTICE '- organizations: 메인 계정 (캐시/크레딧/포인트/티어)';
  RAISE NOTICE '- sub_accounts: 정산용 사업자 정보 (여러 개 가능)';
  RAISE NOTICE '=================================================';
END $$;
