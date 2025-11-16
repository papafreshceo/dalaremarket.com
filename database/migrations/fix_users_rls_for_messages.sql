-- =====================================================
-- users 테이블 RLS 설정 (메시지 시스템용)
-- =====================================================
-- 로그인한 사용자들이 서로의 프로필을 볼 수 있어야 합니다.

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view all authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- 새 정책: 인증된 사용자는 모든 사용자 프로필 조회 가능
CREATE POLICY "Users can view all authenticated users" ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 새 정책: 사용자는 자신의 데이터만 수정 가능
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- 새 정책: 새로운 사용자 생성 가능 (회원가입용)
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
