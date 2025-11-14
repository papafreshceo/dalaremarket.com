const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://xjojtwawqpkgcufhirvk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqb2p0d2F3cXBrZ2N1ZmhpcnZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDQ0MDA1OCwiZXhwIjoyMDQ2MDE2MDU4fQ.zKa0sN_7qfN0LJcOa62-WJ-eOi-_5XC0hF8wutSaI'
);

async function runMigration() {
  try {
    console.log('관리자 조직 조회 RLS 정책 수정 시작...\n');

    // 기존 정책 삭제
    console.log('1. 기존 정책 삭제 중...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can view their organization" ON organizations;`
    });

    if (dropError) {
      console.error('정책 삭제 오류:', dropError);
    } else {
      console.log('✅ 기존 정책 삭제 완료\n');
    }

    // 새 정책 생성
    console.log('2. 새 정책 생성 중...');
    const newPolicySQL = `
CREATE POLICY "Users can view organizations"
ON organizations FOR SELECT
USING (
  -- 관리자 그룹(super_admin, admin, employee)은 모든 조직 조회 가능
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'employee')
  )
  OR
  -- 일반 유저는 자신이 속한 조직만 조회 가능
  id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);`;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: newPolicySQL
    });

    if (createError) {
      console.error('정책 생성 오류:', createError);
    } else {
      console.log('✅ 새 정책 생성 완료\n');
      console.log('📋 정책 내용:');
      console.log('- 관리자(super_admin, admin, employee): 모든 조직 조회 가능');
      console.log('- 일반 유저: 자신이 속한 조직만 조회 가능');
    }

    console.log('\n✅ RLS 정책 수정 완료!');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

runMigration();
