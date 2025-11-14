-- organization_members SELECT 정책 수정
-- 조직 소유자가 자신의 조직 멤버를 조회할 수 있도록 허용

DROP POLICY IF EXISTS "멤버 조회 허용" ON organization_members;

CREATE POLICY "멤버 조회 허용"
ON organization_members FOR SELECT
USING (
  -- 본인의 멤버 정보
  user_id = auth.uid()
  OR
  -- 같은 조직의 멤버
  organization_id IN (
    SELECT users.primary_organization_id
    FROM users
    WHERE users.id = auth.uid()
    AND users.primary_organization_id IS NOT NULL
  )
  OR
  -- 자신이 소유한 조직의 멤버
  organization_id IN (
    SELECT id
    FROM organizations
    WHERE owner_id = auth.uid()
  )
);
