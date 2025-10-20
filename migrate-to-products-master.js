require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateToProductsMaster() {
  console.log('=== 품목 마스터 마이그레이션 시작 ===\n')

  try {
    // 1. category_settings에서 지출유형='사입'인 데이터 조회
    console.log('1. category_settings에서 사입 데이터 조회 중...')
    const { data: categories, error: fetchError } = await supabase
      .from('category_settings')
      .select('*')
      .eq('expense_type', '사입')

    if (fetchError) {
      console.error('데이터 조회 실패:', fetchError)
      return
    }

    console.log(`   총 ${categories.length}개 레코드 조회됨\n`)

    // 2. 중복 제거 (category_1 ~ category_4 조합 기준)
    console.log('2. 중복 제거 중...')
    const uniqueMap = new Map()

    categories.forEach(cat => {
      const key = `${cat.category_1 || ''}|${cat.category_2 || ''}|${cat.category_3 || ''}|${cat.category_4 || ''}`

      // 이미 존재하면 스킵 (첫 번째 것만 유지)
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          category_1: cat.category_1,
          category_2: cat.category_2,
          category_3: cat.category_3,
          category_4: cat.category_4,
          category_4_code: cat.category_4_code,
          raw_material_status: cat.raw_material_status,
          shipping_deadline: cat.shipping_deadline,
          season_start_date: cat.season_start_date,
          season_end_date: cat.season_end_date,
          seller_supply: cat.seller_supply !== null ? cat.seller_supply : true,
          is_best: cat.is_best || false,
          is_recommended: cat.is_recommended || false,
          has_image: cat.has_image || false,
          has_detail_page: cat.has_detail_page || false,
          notes: cat.notes,
          is_active: cat.is_active !== null ? cat.is_active : true
        })
      }
    })

    const uniqueProducts = Array.from(uniqueMap.values())
    console.log(`   중복 제거 후: ${uniqueProducts.length}개 (${categories.length - uniqueProducts.length}개 중복 제거됨)\n`)

    // 3. products_master 테이블이 존재하는지 확인
    console.log('3. products_master 테이블 확인 중...')
    const { error: tableCheckError } = await supabase
      .from('products_master')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.error('⚠️  products_master 테이블이 없습니다.')
      console.error('   먼저 마이그레이션 SQL을 실행해주세요:')
      console.error('   supabase/migrations/20251020000003_create_products_master.sql\n')
      return
    }

    // 4. products_master에 데이터 삽입
    console.log('4. products_master에 데이터 삽입 중...')
    let insertCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const product of uniqueProducts) {
      // 최소한 category_4(품목)는 있어야 함
      if (!product.category_4) {
        skipCount++
        continue
      }

      const { error: insertError } = await supabase
        .from('products_master')
        .insert([product])

      if (insertError) {
        // 중복 키 에러는 무시 (이미 존재하는 데이터)
        if (insertError.code === '23505') {
          console.log(`   스킵 (이미 존재): ${product.category_1}/${product.category_2}/${product.category_3}/${product.category_4}`)
          skipCount++
        } else {
          console.error(`   에러: ${insertError.message}`)
          errorCount++
        }
      } else {
        console.log(`   삽입 성공: ${product.category_1}/${product.category_2}/${product.category_3}/${product.category_4}`)
        insertCount++
      }
    }

    console.log('\n=== 마이그레이션 완료 ===')
    console.log(`총 처리: ${uniqueProducts.length}개`)
    console.log(`✅ 삽입 성공: ${insertCount}개`)
    console.log(`⏭️  스킵: ${skipCount}개`)
    console.log(`❌ 에러: ${errorCount}개`)

  } catch (error) {
    console.error('마이그레이션 중 오류:', error)
  }
}

migrateToProductsMaster()
