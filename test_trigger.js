const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTrigger() {
  console.log('=== 1. 원물 1개 조회 (시세 확인) ===')
  const { data: materials } = await supabase
    .from('raw_materials')
    .select('id, material_name, latest_price')
    .limit(1)
    .single()

  if (!materials) {
    console.log('원물 데이터가 없습니다.')
    return
  }

  console.log('원물:', materials.material_name)
  console.log('현재 latest_price:', materials.latest_price)

  console.log('\n=== 2. 해당 원물을 사용하는 옵션상품 조회 ===')
  const { data: optionProductMaterials } = await supabase
    .from('option_product_materials')
    .select('option_product_id')
    .eq('raw_material_id', materials.id)
    .limit(1)

  if (optionProductMaterials && optionProductMaterials.length > 0) {
    const { data: optionProduct } = await supabase
      .from('option_products')
      .select('option_code, option_name, raw_material_cost, total_cost')
      .eq('id', optionProductMaterials[0].option_product_id)
      .single()

    console.log('옵션상품:', optionProduct?.option_name)
    console.log('현재 raw_material_cost:', optionProduct?.raw_material_cost)
    console.log('현재 total_cost:', optionProduct?.total_cost)
  } else {
    console.log('이 원물을 사용하는 옵션상품이 없습니다.')
  }

  console.log('\n=== 3. 시세기록 테이블에 최근 기록이 있는지 확인 ===')
  const { data: recentPrices } = await supabase
    .from('material_price_history')
    .select('*')
    .eq('material_id', materials.id)
    .order('created_at', { ascending: false })
    .limit(3)

  console.log('최근 시세 기록:', recentPrices?.length || 0, '개')
  if (recentPrices && recentPrices.length > 0) {
    recentPrices.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.effective_date} - ${p.price}원 (기록일: ${p.created_at})`)
    })
  }
}

testTrigger()
