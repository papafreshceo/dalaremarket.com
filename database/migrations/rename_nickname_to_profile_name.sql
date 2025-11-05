-- users 테이블의 nickname 컬럼을 profile_name으로 변경
ALTER TABLE users RENAME COLUMN nickname TO profile_name;

-- 인덱스가 있다면 함께 변경 (있는 경우에만)
-- DROP INDEX IF EXISTS idx_users_nickname;
-- CREATE INDEX idx_users_profile_name ON users(profile_name);

-- admin_nicknames 테이블은 그대로 유지 (관리자가 등록하는 "닉네임" 목록)
-- 이 테이블의 nickname은 "가상 닉네임"의 의미로 유지
