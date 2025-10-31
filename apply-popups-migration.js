const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase 설정
const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.oCIuRNHLi4OMZ5bVLPY7wz8Jm9uHlRg-ZmL0EbdJ6sE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('팝업 테이블 마이그레이션 적용 중...')

    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251101000001_create_popups_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    })

    if (error) {
      console.error('마이그레이션 적용 실패:', error)
      process.exit(1)
    }

    console.log('✅ 팝업 테이블 마이그레이션이 성공적으로 적용되었습니다!')

    // 테이블 확인
    const { data: tables, error: checkError } = await supabase
      .from('popups')
      .select('*')
      .limit(0)

    if (checkError) {
      console.error('테이블 확인 실패:', checkError)
    } else {
      console.log('✅ popups 테이블이 정상적으로 생성되었습니다!')
    }

  } catch (error) {
    console.error('오류 발생:', error)
    process.exit(1)
  }
}

applyMigration()
