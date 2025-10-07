const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMigration() {
  console.log('=== 마이그레이션 확인 ===')

  const { data, error } = await supabase
    .from('option_products')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (data && data[0]) {
    const columns = Object.keys(data[0])
    console.log('\n현재 option_products 테이블 칼럼:')
    console.log(columns)

    console.log('\n=== 확인 결과 ===')
    if (columns.includes('item_type')) {
      console.log('❌ item_type 칼럼이 아직 존재합니다. 마이그레이션이 실행되지 않았습니다.')
    } else {
      console.log('✅ item_type 칼럼이 제거되었습니다.')
    }

    if (columns.includes('variety')) {
      console.log('❌ variety 칼럼이 아직 존재합니다. 마이그레이션이 실행되지 않았습니다.')
    } else {
      console.log('✅ variety 칼럼이 제거되었습니다.')
    }
  }
}

verifyMigration()
