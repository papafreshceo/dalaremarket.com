-- platform_notices 테이블 RLS 정책 추가

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "관리자는 공지사항을 조회할 수 있습니다" ON platform_notices;
DROP POLICY IF EXISTS "관리자는 공지사항을 생성할 수 있습니다" ON platform_notices;
DROP POLICY IF EXISTS "관리자는 공지사항을 수정할 수 있습니다" ON platform_notices;
DROP POLICY IF EXISTS "관리자는 공지사항을 삭제할 수 있습니다" ON platform_notices;
DROP POLICY IF EXISTS "모든 사용자는 공개된 공지사항을 조회할 수 있습니다" ON platform_notices;

-- RLS 활성화
ALTER TABLE platform_notices ENABLE ROW LEVEL SECURITY;

-- 1. 관리자는 모든 공지사항을 조회할 수 있습니다
CREATE POLICY "관리자는 공지사항을 조회할 수 있습니다"
ON platform_notices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'employee')
  )
);

-- 2. 관리자는 공지사항을 생성할 수 있습니다
CREATE POLICY "관리자는 공지사항을 생성할 수 있습니다"
ON platform_notices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'employee')
  )
);

-- 3. 관리자는 공지사항을 수정할 수 있습니다
CREATE POLICY "관리자는 공지사항을 수정할 수 있습니다"
ON platform_notices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'employee')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'employee')
  )
);

-- 4. 관리자는 공지사항을 삭제할 수 있습니다
CREATE POLICY "관리자는 공지사항을 삭제할 수 있습니다"
ON platform_notices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin', 'employee')
  )
);

-- 5. 모든 사용자(인증된)는 공개된 공지사항을 조회할 수 있습니다
CREATE POLICY "모든 사용자는 공개된 공지사항을 조회할 수 있습니다"
ON platform_notices
FOR SELECT
TO authenticated
USING (published = true);
