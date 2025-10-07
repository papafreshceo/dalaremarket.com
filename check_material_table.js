const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
  console.log('=== option_product_materials 테이블 구조 확인 ===')
  const { data, error } = await supabase
    .from('option_product_materials')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
  } else if (data && data[0]) {
    console.log('Columns:', Object.keys(data[0]))
    console.log('\nSample data:', data[0])
  } else {
    console.log('No data in table')
  }

  // quantity 타입 확인
  const { data: sampleData } = await supabase
    .from('option_product_materials')
    .select('quantity')
    .limit(5)

  if (sampleData) {
    console.log('\n=== quantity 값 샘플 ===')
    sampleData.forEach((row, i) => {
      console.log(`${i+1}. quantity:`, row.quantity, typeof row.quantity)
    })
  }
}

checkTable()
