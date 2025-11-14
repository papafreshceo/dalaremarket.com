const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ufuahbppuftwkluodvkf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdWFoYnBwdWZ0d2tsdW9kdmtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODY1NTM1NSwiZXhwIjoyMDQ0MjMxMzU1fQ.YbkISty_MO7P8dm1YTEJyKLEqMXkPBW-_-Sih5Jic1k'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixTest2Member() {
  const userId = '433b4a97-1d16-47c3-8490-29341d9819d1'
  const orgId = '109602e2-e0ac-4eef-b548-7bd77a08c341'

  // 멤버 추가
  const { data, error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
      can_manage_members: true,
      can_manage_orders: true,
      can_manage_products: true,
      can_view_financials: true,
    })
    .select()

  if (error) {
    console.error('멤버 추가 실패:', error)
  } else {
    console.log('✅ 멤버 추가 성공:', data)
  }
}

fixTest2Member()
