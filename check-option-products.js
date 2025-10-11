// Check option_products table data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  console.log('🔍 Checking option_products table...\n')

  const { data, error, count } = await supabase
    .from('option_products')
    .select('*', { count: 'exact' })
    .limit(5)

  if (error) {
    console.error('❌ Error fetching option_products:', error)
  } else {
    console.log(`📊 option_products total rows: ${count}`)
    console.log(`📦 Sample data (first 5):`)
    console.log(JSON.stringify(data, null, 2))
  }

  // Check related tables
  console.log('\n🔍 Checking related tables...\n')

  const { data: materials, error: materialsError, count: materialsCount } = await supabase
    .from('option_product_materials')
    .select('*', { count: 'exact' })
    .limit(3)

  if (materialsError) {
    console.error('❌ Error fetching option_product_materials:', materialsError)
  } else {
    console.log(`📊 option_product_materials total rows: ${materialsCount}`)
  }

  const { data: rawMaterials, error: rawError, count: rawCount } = await supabase
    .from('raw_materials')
    .select('*', { count: 'exact' })
    .limit(3)

  if (rawError) {
    console.error('❌ Error fetching raw_materials:', rawError)
  } else {
    console.log(`📊 raw_materials total rows: ${rawCount}`)
  }
}

checkData()
