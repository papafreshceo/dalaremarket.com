-- =====================================================
-- 조직(Organization) 시스템 구축
-- =====================================================
-- 작성일: 2025-11-12
-- 설명: 회원사의 다수 담당자를 지원하는 조직 시스템
--       - 1개 조직(회사) = 여러 멤버(직원)
--       - 조직별 데이터 공유 (주문, 발주서, 캐시/크레딧)
--       - 역할 기반 권한 관리 (owner, admin, member)
-- =====================================================

-- 1. organizations 테이블 생성
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 조직 기본 정보
  name VARCHAR(200) NOT NULL, -- 조직명 (회사명)
  business_number VARCHAR(20), -- 사업자번호

  -- 조직 주소 및 연락처
  address TEXT, -- 회사 주소
  phone VARCHAR(20), -- 대표 전화번호
  fax VARCHAR(20), -- 팩스번호
  email VARCHAR(100), -- 대표 이메일

  -- 대표자 정보
  representative_name VARCHAR(100), -- 대표자명

  -- 정산 정보 (조직 단위로 관리)
  commission_rate DECIMAL(5,2) DEFAULT 0.00, -- 수수료율 (%)
  settlement_cycle VARCHAR(20) DEFAULT '월1회', -- 정산 주기
  bank_name VARCHAR(50), -- 은행명
  account_number VARCHAR(50), -- 계좌번호
  account_holder VARCHAR(100), -- 예금주
  tax_invoice_email VARCHAR(100), -- 전자계산서 수신 이메일

  -- 조직 소유자 (최초 생성자)
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 조직 설정
  is_active BOOLEAN DEFAULT true, -- 활성화 여부
  max_members INTEGER DEFAULT 10, -- 최대 멤버 수 (플랜별 제한)

  -- 메모 및 관리
  memo TEXT, -- 관리자 메모

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_business_number ON organizations(business_number);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

-- 코멘트
COMMENT ON TABLE organizations IS '조직(회사) 정보';
COMMENT ON COLUMN organizations.name IS '조직명 (회사명)';
COMMENT ON COLUMN organizations.business_number IS '사업자번호';
COMMENT ON COLUMN organizations.owner_id IS '조직 소유자 (최초 생성자)';
COMMENT ON COLUMN organizations.is_active IS '활성화 여부';
COMMENT ON COLUMN organizations.max_members IS '최대 멤버 수 (플랜별 제한)';

-- 2. organization_members 테이블 생성
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 관계
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 역할
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- owner, admin, member

  -- 멤버 상태
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, invited, suspended

  -- 초대 정보
  invited_by UUID REFERENCES users(id), -- 초대한 사람
  invited_at TIMESTAMPTZ, -- 초대 일시
  joined_at TIMESTAMPTZ, -- 가입 일시

  -- 권한 설정 (선택적, 역할별 기본 권한 외 개별 설정)
  can_manage_orders BOOLEAN DEFAULT true, -- 주문 관리 권한
  can_manage_products BOOLEAN DEFAULT true, -- 상품 관리 권한
  can_manage_members BOOLEAN DEFAULT false, -- 멤버 관리 권한 (admin만)
  can_view_financials BOOLEAN DEFAULT true, -- 재무 정보 조회 권한

  -- 메모
  memo TEXT, -- 관리자 메모

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약 조건: 한 사용자는 한 조직에 한 번만 소속
  CONSTRAINT unique_organization_user UNIQUE(organization_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status);

-- 코멘트
COMMENT ON TABLE organization_members IS '조직 멤버 정보';
COMMENT ON COLUMN organization_members.role IS '역할: owner(소유자), admin(관리자), member(일반 멤버)';
COMMENT ON COLUMN organization_members.status IS '상태: active(활성), invited(초대됨), suspended(정지)';
COMMENT ON COLUMN organization_members.invited_by IS '초대한 사람';
COMMENT ON COLUMN organization_members.can_manage_members IS '멤버 관리 권한 (초대, 삭제, 역할 변경)';

-- 3. organization_invitations 테이블 생성 (초대 관리)
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 관계
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 초대한 사람

  -- 초대 정보
  email VARCHAR(100) NOT NULL, -- 초대할 이메일
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- 부여할 역할

  -- 초대 토큰 (이메일 링크용)
  token VARCHAR(100) UNIQUE NOT NULL,

  -- 초대 상태
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, expired, cancelled

  -- 만료 시간
  expires_at TIMESTAMPTZ NOT NULL, -- 초대 만료 시간 (기본 7일)

  -- 응답 정보
  accepted_at TIMESTAMPTZ, -- 수락 일시
  accepted_by UUID REFERENCES users(id), -- 수락한 사용자 (이메일로 가입한 경우)

  -- 메시지
  message TEXT, -- 초대 메시지

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_status ON organization_invitations(status);

-- 코멘트
COMMENT ON TABLE organization_invitations IS '조직 멤버 초대 정보';
COMMENT ON COLUMN organization_invitations.token IS '초대 토큰 (이메일 링크용, UUID)';
COMMENT ON COLUMN organization_invitations.status IS '상태: pending(대기), accepted(수락), expired(만료), cancelled(취소)';
COMMENT ON COLUMN organization_invitations.expires_at IS '초대 만료 시간 (기본 7일)';

-- 4. users 테이블에 조직 관련 필드 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS primary_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_primary_organization_id ON users(primary_organization_id);

COMMENT ON COLUMN users.primary_organization_id IS '주 소속 조직 (여러 조직에 속할 수 있지만 기본은 1개)';

-- 5. integrated_orders 테이블에 조직 필드 추가
ALTER TABLE integrated_orders
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_integrated_orders_organization_id ON integrated_orders(organization_id);

COMMENT ON COLUMN integrated_orders.organization_id IS '주문이 속한 조직 (셀러 조직)';

-- 6. platform_orders 테이블에 조직 필드 추가 (있다면)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_orders') THEN
    ALTER TABLE platform_orders
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_platform_orders_organization_id ON platform_orders(organization_id);

    COMMENT ON COLUMN platform_orders.organization_id IS '주문이 속한 조직 (셀러 조직)';
  END IF;
END $$;

-- 7. user_cash 테이블에 조직 필드 추가 (조직 단위 캐시 관리)
ALTER TABLE user_cash
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_cash_organization_id ON user_cash(organization_id);

COMMENT ON COLUMN user_cash.organization_id IS '조직 단위 캐시 (NULL이면 개인 캐시)';

-- 8. user_cash_history 테이블에 조직 필드 추가
ALTER TABLE user_cash_history
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_cash_history_organization_id ON user_cash_history(organization_id);

-- 9. user_credits 테이블에 조직 필드 추가 (조직 단위 크레딧 관리)
ALTER TABLE user_credits
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_credits_organization_id ON user_credits(organization_id);

COMMENT ON COLUMN user_credits.organization_id IS '조직 단위 크레딧 (NULL이면 개인 크레딧)';

-- 10. user_credits_history 테이블에 조직 필드 추가
ALTER TABLE user_credits_history
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_credits_history_organization_id ON user_credits_history(organization_id);

-- 11. 자동 updated_at 업데이트 트리거
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON organizations;
CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

DROP TRIGGER IF EXISTS trigger_organization_members_updated_at ON organization_members;
CREATE TRIGGER trigger_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

DROP TRIGGER IF EXISTS trigger_organization_invitations_updated_at ON organization_invitations;
CREATE TRIGGER trigger_organization_invitations_updated_at
  BEFORE UPDATE ON organization_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- 12. RLS (Row Level Security) 정책 설정
-- 조직 정보는 해당 조직 멤버만 조회 가능
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "조직 멤버는 자신의 조직 정보 조회 가능" ON organizations;
CREATE POLICY "조직 멤버는 자신의 조직 정보 조회 가능"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "조직 소유자는 자신의 조직 정보 수정 가능" ON organizations;
CREATE POLICY "조직 소유자는 자신의 조직 정보 수정 가능"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- 조직 멤버 정보는 같은 조직 멤버만 조회 가능
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "조직 멤버는 같은 조직의 멤버 정보 조회 가능" ON organization_members;
CREATE POLICY "조직 멤버는 같은 조직의 멤버 정보 조회 가능"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "조직 관리자는 멤버 관리 가능" ON organization_members;
CREATE POLICY "조직 관리자는 멤버 관리 가능"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
        AND can_manage_members = true
    )
  );

-- 초대 정보는 해당 조직 관리자만 조회 가능
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "조직 관리자는 초대 정보 조회 및 관리 가능" ON organization_invitations;
CREATE POLICY "조직 관리자는 초대 정보 조회 및 관리 가능"
  ON organization_invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
        AND can_manage_members = true
    )
  );

-- =====================================================
-- 초기 데이터: 기존 사용자를 위한 조직 자동 생성
-- =====================================================

-- 기존 partner/customer 역할 사용자들에게 개인 조직 생성
INSERT INTO organizations (
  name,
  business_number,
  address,
  phone,
  representative_name,
  commission_rate,
  settlement_cycle,
  bank_name,
  account_number,
  account_holder,
  tax_invoice_email,
  owner_id,
  is_active,
  memo
)
SELECT
  COALESCE(company_name, profile_name, email) AS name,
  business_number,
  company_address AS address,
  representative_phone AS phone,
  representative_name,
  COALESCE(commission_rate, 0.00) AS commission_rate,
  COALESCE(settlement_cycle, '월1회') AS settlement_cycle,
  bank_name,
  account_number,
  account_holder,
  tax_invoice_email,
  id AS owner_id,
  true AS is_active,
  '자동 생성된 조직 (기존 사용자)' AS memo
FROM users
WHERE role IN ('partner', 'customer')
  AND id NOT IN (SELECT owner_id FROM organizations);

-- 생성된 조직을 사용자의 primary_organization_id로 설정
UPDATE users
SET primary_organization_id = (
  SELECT id FROM organizations WHERE owner_id = users.id LIMIT 1
)
WHERE role IN ('partner', 'customer')
  AND primary_organization_id IS NULL;

-- 조직 소유자를 organization_members에 자동 추가
INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  status,
  joined_at,
  can_manage_orders,
  can_manage_products,
  can_manage_members,
  can_view_financials
)
SELECT
  o.id AS organization_id,
  o.owner_id AS user_id,
  'owner' AS role,
  'active' AS status,
  NOW() AS joined_at,
  true AS can_manage_orders,
  true AS can_manage_products,
  true AS can_manage_members,
  true AS can_view_financials
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members
  WHERE organization_id = o.id AND user_id = o.owner_id
);

-- 기존 주문에 조직 ID 매핑
UPDATE integrated_orders io
SET organization_id = (
  SELECT primary_organization_id
  FROM users
  WHERE id = io.seller_id
)
WHERE seller_id IS NOT NULL
  AND organization_id IS NULL;

-- 기존 캐시/크레딧에 조직 ID 매핑 (선택적)
-- 개인 단위 관리에서 조직 단위 관리로 전환하려면 아래 주석 해제
/*
UPDATE user_cash uc
SET organization_id = (
  SELECT primary_organization_id
  FROM users
  WHERE id = uc.user_id
)
WHERE organization_id IS NULL;

UPDATE user_credits ucr
SET organization_id = (
  SELECT primary_organization_id
  FROM users
  WHERE id = ucr.user_id
)
WHERE organization_id IS NULL;
*/

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
  v_org_count INTEGER;
  v_member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_org_count FROM organizations;
  SELECT COUNT(*) INTO v_member_count FROM organization_members;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '조직(Organization) 시스템 구축 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '생성된 조직 수: %', v_org_count;
  RAISE NOTICE '등록된 멤버 수: %', v_member_count;
  RAISE NOTICE '=================================================';
  RAISE NOTICE '주요 기능:';
  RAISE NOTICE '- 1개 조직(회사) = 여러 멤버(직원)';
  RAISE NOTICE '- 조직별 데이터 공유 (주문, 발주서, 캐시/크레딧)';
  RAISE NOTICE '- 역할 기반 권한 (owner, admin, member)';
  RAISE NOTICE '- 이메일 초대 시스템';
  RAISE NOTICE '- RLS 정책으로 데이터 보안';
  RAISE NOTICE '=================================================';
END $$;
