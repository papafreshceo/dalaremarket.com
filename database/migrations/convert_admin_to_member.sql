-- admin 역할을 member로 변경
-- organization_members 테이블의 admin을 member로 변경
UPDATE organization_members
SET role = 'member'
WHERE role = 'admin';

-- organization_invitations 테이블의 admin을 member로 변경
UPDATE organization_invitations
SET role = 'member'
WHERE role = 'admin';

-- 변경 결과 확인
SELECT
  'organization_members' as table_name,
  role,
  COUNT(*) as count
FROM organization_members
GROUP BY role

UNION ALL

SELECT
  'organization_invitations' as table_name,
  role,
  COUNT(*) as count
FROM organization_invitations
GROUP BY role;
