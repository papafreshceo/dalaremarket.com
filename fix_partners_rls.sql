-- partners 테이블 RLS 정책 확인 및 수정

-- 1. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON partners;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON partners;
DROP POLICY IF EXISTS "Enable read access for all users" ON partners;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON partners;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON partners;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON partners;

-- 2. RLS 활성화
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 3. 모든 작업 허용 정책 생성
CREATE POLICY "Enable all operations for authenticated users"
ON partners
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 또는 RLS를 완전히 비활성화하려면 (개발 환경에서만 권장):
-- ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
