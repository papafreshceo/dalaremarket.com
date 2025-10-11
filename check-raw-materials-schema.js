// Check raw_materials table schema
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
  console.log('🔍 Checking raw_materials table schema...\n')

  // 샘플 데이터 가져오기
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('✅ Available columns:')
    Object.keys(data[0]).sort().forEach(col => {
      console.log(`  - ${col}`)
    })

    console.log('\n📊 Has season column:', 'season' in data[0] ? '✅ Yes' : '❌ No')
  } else {
    console.log('⚠️ No data found in raw_materials table')
  }
}

checkSchema()
