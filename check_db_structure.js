const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDBStructure() {
  console.log('=== raw_materials 테이블 구조 확인 ===')
  const { data: rawMaterials, error: rmError } = await supabase
    .from('raw_materials')
    .select('*')
    .limit(1)

  if (rmError) {
    console.error('Error:', rmError)
  } else if (rawMaterials && rawMaterials[0]) {
    console.log('Columns:', Object.keys(rawMaterials[0]))
  }

  console.log('\n=== option_products 테이블 구조 확인 ===')
  const { data: optionProducts, error: opError } = await supabase
    .from('option_products')
    .select('*')
    .limit(1)

  if (opError) {
    console.error('Error:', opError)
  } else if (optionProducts && optionProducts[0]) {
    console.log('Columns:', Object.keys(optionProducts[0]))
  }

  console.log('\n=== material_price_history 테이블 구조 확인 ===')
  const { data: priceHistory, error: phError } = await supabase
    .from('material_price_history')
    .select('*')
    .limit(1)

  if (phError) {
    console.error('Error:', phError)
  } else if (priceHistory && priceHistory[0]) {
    console.log('Columns:', Object.keys(priceHistory[0]))
  }

  console.log('\n=== 트리거 확인 (RPC 호출) ===')
  const { data: triggers, error: tError } = await supabase
    .rpc('get_triggers_info')

  if (tError) {
    console.log('트리거 정보 조회 불가 (RPC 함수 없음)')
  } else {
    console.log('Triggers:', triggers)
  }
}

checkDBStructure()
