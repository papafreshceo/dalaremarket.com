/**
 * 사용자 삭제 트리거 설정 스크립트
 *
 * 사용법: node scripts/setup-user-delete-trigger.js
 */

const { supabase, supabaseUrl, supabaseServiceKey } = require('./supabase-config')

async function setupUserDeleteTrigger() {
  try {
    console.log('Step 1: Creating trigger function...')

    const functionSQL = `
CREATE OR REPLACE FUNCTION auto_delete_user_related_data()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM organizations WHERE owner_id = OLD.id;
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

    const { error: error1 } = await supabase.rpc('exec_sql', { sql: functionSQL })

    if (error1) {
      console.error('Function creation error:', error1.message)
      // Try alternative method
      console.log('Trying alternative method...')
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: functionSQL })
      })

      if (!response.ok) {
        console.error('Alternative method also failed')
        console.error('Response:', await response.text())
        return
      }
    }

    console.log('Function created successfully')

    console.log('\nStep 2: Creating trigger...')

    const triggerSQL = `
DROP TRIGGER IF EXISTS trigger_auto_delete_user_data ON users;

CREATE TRIGGER trigger_auto_delete_user_data
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_delete_user_related_data();
`

    const { error: error2 } = await supabase.rpc('exec_sql', { sql: triggerSQL })

    if (error2) {
      console.error('Trigger creation error:', error2.message)
      return
    }

    console.log('Trigger created successfully')
    console.log('\nSetup complete!')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

setupUserDeleteTrigger()
