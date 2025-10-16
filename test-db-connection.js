// Supabase 연결 및 테이블 확인 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 데이터베이스 연결 테스트...\n')

  // 1. permissions 테이블 확인
  console.log('1. permissions 테이블 조회 시도...')
  const { data: permData, error: permError } = await supabase
    .from('permissions')
    .select('*')
    .limit(1)

  if (permError) {
    console.log('❌ permissions 테이블 없음:', permError.message)
    console.log('힌트:', permError.hint)
  } else {
    console.log('✅ permissions 테이블 존재!')
    console.log('데이터:', permData)
  }

  console.log('\n2. 모든 테이블 목록 조회...')

  // RPC로 테이블 목록 조회
  const { data: tables, error: tablesError } = await supabase
    .rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    })

  if (tablesError) {
    console.log('⚠️ 테이블 목록 조회 실패')
  }

  console.log('\n📋 권장 조치:')
  console.log('1. Supabase Dashboard (https://supabase.com/dashboard) 접속')
  console.log('2. 프로젝트 선택 → SQL Editor')
  console.log('3. database/migrations/057_create_permissions_system_fixed.sql 실행')
  console.log('\n또는:')
  console.log('SQL Editor에서 아래 명령 실행:')
  console.log('-------------------------------------')
  console.log('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name LIKE \'%permission%\';')
  console.log('-------------------------------------')
}

checkDatabase()
