const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function findTestData() {
  console.log('=== 시세 기록이 있는 원물 찾기 ===')
  const { data: priceRecords } = await supabase
    .from('material_price_history')
    .select('material_id, price, effective_date')
    .order('created_at', { ascending: false })
    .limit(5)

  if (priceRecords && priceRecords.length > 0) {
    console.log('최근 시세 기록:', priceRecords.length, '개')

    for (const record of priceRecords) {
      const { data: material } = await supabase
        .from('raw_materials')
        .select('material_name, latest_price')
        .eq('id', record.material_id)
        .single()

      console.log(`\n원물: ${material?.material_name}`)
      console.log(`  기록된 시세: ${record.price}원 (${record.effective_date})`)
      console.log(`  latest_price: ${material?.latest_price}원`)
      console.log(`  ✓ 트리거 작동 여부: ${material?.latest_price === record.price ? 'YES' : 'NO'}`)

      // 이 원물을 사용하는 옵션상품 찾기
      const { data: usedIn } = await supabase
        .from('option_product_materials')
        .select('option_product_id')
        .eq('raw_material_id', record.material_id)

      if (usedIn && usedIn.length > 0) {
        console.log(`  사용 중인 옵션상품: ${usedIn.length}개`)
      }
    }
  } else {
    console.log('시세 기록이 없습니다.')
  }

  console.log('\n=== 원물을 사용하는 옵션상품 찾기 ===')
  const { data: links } = await supabase
    .from('option_product_materials')
    .select('*')
    .limit(5)

  if (links && links.length > 0) {
    console.log('옵션상품-원물 연결:', links.length, '개')

    const { data: optionProduct } = await supabase
      .from('option_products')
      .select('option_code, option_name, raw_material_cost, total_cost, standard_quantity')
      .eq('id', links[0].option_product_id)
      .single()

    const { data: material } = await supabase
      .from('raw_materials')
      .select('material_name, latest_price')
      .eq('id', links[0].raw_material_id)
      .single()

    console.log(`\n옵션상품: ${optionProduct?.option_name}`)
    console.log(`  standard_quantity: ${optionProduct?.standard_quantity}`)
    console.log(`  raw_material_cost: ${optionProduct?.raw_material_cost}`)
    console.log(`  total_cost: ${optionProduct?.total_cost}`)
    console.log(`사용 원물: ${material?.material_name}`)
    console.log(`  latest_price: ${material?.latest_price}`)
  } else {
    console.log('옵션상품-원물 연결이 없습니다.')
  }
}

findTestData()
