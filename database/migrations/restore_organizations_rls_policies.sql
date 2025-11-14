-- =====================================================
-- organizations 테이블 RLS 정책 복원
-- =====================================================
-- 작성일: 2025-01-13
-- 설명: 컬럼 재정렬 후 삭제된 RLS 정책 재생성
-- =====================================================

-- RLS 활성화 확인
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "조직 멤버는 자신의 조직 조회 가능" ON organizations;
DROP POLICY IF EXISTS "조직 소유자는 자신의 조직 수정 가능" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;

-- 조직 조회 정책: 멤버는 자신이 속한 조직만 조회 가능
CREATE POLICY "Users can view their organization"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- 조직 수정 정책: 소유자만 자신의 조직 수정 가능
CREATE POLICY "Users can update their organization"
ON organizations FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 조직 삽입 정책: 본인 소유 조직만 생성 가능
CREATE POLICY "Users can insert their own organization"
ON organizations FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- 조직 삭제 정책: 소유자만 자신의 조직 삭제 가능
CREATE POLICY "Users can delete their own organization"
ON organizations FOR DELETE
USING (owner_id = auth.uid());

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ organizations 테이블 RLS 정책 복원 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '생성된 정책:';
  RAISE NOTICE '1. SELECT - 멤버는 자신이 속한 조직 조회 가능';
  RAISE NOTICE '2. UPDATE - 소유자만 자신의 조직 수정 가능';
  RAISE NOTICE '3. INSERT - 본인 소유 조직만 생성 가능';
  RAISE NOTICE '4. DELETE - 소유자만 자신의 조직 삭제 가능';
  RAISE NOTICE '=================================================';
END $$;
