require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 날짜 포맷 변환 함수
function formatSeasonDate(dateStr) {
  if (!dateStr) return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null

  // 이미 MM-DD 형식인지 확인
  if (/^\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // M-D 또는 MM-D 또는 M-DD 형식을 MM-DD로 변환
  const parts = trimmed.split('-')
  if (parts.length === 2) {
    const month = parts[0].padStart(2, '0')
    const day = parts[1].padStart(2, '0')
    return `${month}-${day}`
  }

  return trimmed
}

async function fixDates() {
  console.log('시즌 날짜 포맷 수정 시작...\n')

  // 1. category_settings 수정
  console.log('1. category_settings 테이블 수정 중...')
  const { data: categories, error: catError } = await supabase
    .from('category_settings')
    .select('id, season_start_date, season_end_date')

  if (catError) {
    console.error('카테고리 조회 실패:', catError)
    return
  }

  let catUpdated = 0
  for (const cat of categories) {
    const startFormatted = formatSeasonDate(cat.season_start_date)
    const endFormatted = formatSeasonDate(cat.season_end_date)

    if (startFormatted !== cat.season_start_date || endFormatted !== cat.season_end_date) {
      const { error } = await supabase
        .from('category_settings')
        .update({
          season_start_date: startFormatted,
          season_end_date: endFormatted
        })
        .eq('id', cat.id)

      if (!error) {
        console.log(`  수정: ${cat.season_start_date} -> ${startFormatted}, ${cat.season_end_date} -> ${endFormatted}`)
        catUpdated++
      }
    }
  }
  console.log(`category_settings: ${catUpdated}개 수정 완료\n`)

  // 2. raw_materials 수정
  console.log('2. raw_materials 테이블 수정 중...')
  const { data: rawMaterials, error: rawError } = await supabase
    .from('raw_materials')
    .select('id, season_start_date, season_end_date')

  if (rawError) {
    console.error('원물 조회 실패:', rawError)
    return
  }

  let rawUpdated = 0
  for (const raw of rawMaterials) {
    const startFormatted = formatSeasonDate(raw.season_start_date)
    const endFormatted = formatSeasonDate(raw.season_end_date)

    if (startFormatted !== raw.season_start_date || endFormatted !== raw.season_end_date) {
      const { error } = await supabase
        .from('raw_materials')
        .update({
          season_start_date: startFormatted,
          season_end_date: endFormatted
        })
        .eq('id', raw.id)

      if (!error) {
        console.log(`  수정: ${raw.season_start_date} -> ${startFormatted}, ${raw.season_end_date} -> ${endFormatted}`)
        rawUpdated++
      }
    }
  }
  console.log(`raw_materials: ${rawUpdated}개 수정 완료\n`)

  // 3. option_products 수정
  console.log('3. option_products 테이블 수정 중...')
  const { data: options, error: optError } = await supabase
    .from('option_products')
    .select('id, season_start_date, season_end_date')

  if (optError) {
    console.error('옵션상품 조회 실패:', optError)
    return
  }

  let optUpdated = 0
  for (const opt of options) {
    const startFormatted = formatSeasonDate(opt.season_start_date)
    const endFormatted = formatSeasonDate(opt.season_end_date)

    if (startFormatted !== opt.season_start_date || endFormatted !== opt.season_end_date) {
      const { error } = await supabase
        .from('option_products')
        .update({
          season_start_date: startFormatted,
          season_end_date: endFormatted
        })
        .eq('id', opt.id)

      if (!error) {
        console.log(`  수정: ${opt.season_start_date} -> ${startFormatted}, ${opt.season_end_date} -> ${endFormatted}`)
        optUpdated++
      }
    }
  }
  console.log(`option_products: ${optUpdated}개 수정 완료\n`)

  console.log('=== 모든 테이블 수정 완료 ===')
  console.log(`총 ${catUpdated + rawUpdated + optUpdated}개 레코드 수정됨`)
}

fixDates().catch(console.error)
