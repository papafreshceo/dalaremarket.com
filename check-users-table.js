const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://gowqhwjivikdlugstqux.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvd3Fod2ppdmlrZGx1Z3N0cXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0NzIxMTksImV4cCI6MjA0NzA0ODExOX0.WQJqRCPjSb5ZvfTfr0K3ZBqKDNYdThhYy4UWjJhPF80'
)

async function checkUsersTable() {
  console.log('Checking users table structure...\n')

  // 1. 사용자 목록 조회 (approved 컬럼 포함 여부 확인)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (usersError) {
    console.error('Error fetching users:', usersError)
  } else {
    console.log('Sample user data:')
    console.log(JSON.stringify(users[0], null, 2))
  }

  // 2. 승인되지 않은 사용자 찾기
  console.log('\n\nChecking for unapproved users...')
  const { data: unapprovedUsers, error: unapprovedError } = await supabase
    .from('users')
    .select('id, email, name, role, approved, created_at')
    .eq('approved', false)

  if (unapprovedError) {
    console.error('Error fetching unapproved users:', unapprovedError)
  } else {
    console.log(`Found ${unapprovedUsers?.length || 0} unapproved users:`)
    console.log(JSON.stringify(unapprovedUsers, null, 2))
  }

  // 3. 승인 업데이트 테스트 (실제로 업데이트하지 않고 쿼리만 시도)
  if (unapprovedUsers && unapprovedUsers.length > 0) {
    const testUserId = unapprovedUsers[0].id
    console.log(`\n\nTesting approval update for user: ${testUserId}`)

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', testUserId)
      .select()

    if (updateError) {
      console.error('Error updating user approval:', updateError)
      console.error('Error details:', JSON.stringify(updateError, null, 2))
    } else {
      console.log('Update successful!')
      console.log('Updated data:', JSON.stringify(updateData, null, 2))

      // 원복
      await supabase
        .from('users')
        .update({ approved: false })
        .eq('id', testUserId)
      console.log('Reverted approval status for testing')
    }
  }
}

checkUsersTable().then(() => {
  console.log('\n\nCheck complete!')
  process.exit(0)
}).catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
