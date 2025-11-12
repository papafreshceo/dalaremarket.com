-- organization_daily_rewards 외래 키 수정
-- 기존: organization_id -> users (잘못됨)
-- 변경: organization_id -> organizations (올바름)

-- 1. 기존 잘못된 외래 키 제약 조건 삭제
ALTER TABLE organization_daily_rewards
DROP CONSTRAINT IF EXISTS user_daily_rewards_user_id_fkey;

-- 2. 존재하지 않는 organization_id를 가진 레코드 삭제
DELETE FROM organization_daily_rewards
WHERE organization_id NOT IN (SELECT id FROM organizations);

-- 3. 올바른 외래 키 제약 조건 추가
ALTER TABLE organization_daily_rewards
ADD CONSTRAINT organization_daily_rewards_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;
