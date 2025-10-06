// Supabase DB 스키마 조회 스크립트
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl ? '✓ Loaded' : '✗ Missing')
console.log('Service Key:', supabaseKey ? '✓ Loaded' : '✗ Missing')

const supabase = createClient(supabaseUrl, supabaseKey)

async function getTableSchema(tableName) {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: tableName })

  if (error) {
    // RPC 함수가 없으면 직접 쿼리
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position')

    if (colError) {
      console.error(`Error fetching ${tableName} schema:`, colError)
      return null
    }
    return columns
  }

  return data
}

async function getAllTables() {
  // PostgreSQL information_schema를 직접 쿼리
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `

  const { data, error } = await supabase.rpc('exec_sql', { query })

  if (error) {
    console.log('RPC method not available, using alternative method...')
    // 대안: 알려진 테이블들 수동으로 조회
    return [
      'raw_materials',
      'option_products',
      'option_product_materials',
      'material_price_history',
      'partners',
      'supply_status_settings'
    ]
  }

  return data
}

async function getTableColumns(tableName) {
  const query = `
    SELECT
      column_name,
      data_type,
      character_maximum_length,
      column_default,
      is_nullable,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '${tableName}'
    ORDER BY ordinal_position;
  `

  // Supabase에서는 직접 SQL을 실행할 수 없으므로
  // 데이터를 조회해서 스키마를 추론합니다
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)

  if (error) {
    console.error(`Error querying ${tableName}:`, error.message)
    return null
  }

  if (data && data.length > 0) {
    const row = data[0]
    return Object.keys(row).map(key => ({
      column_name: key,
      data_type: typeof row[key],
      sample_value: row[key]
    }))
  }

  // 빈 테이블이면 메타데이터만
  return []
}

async function main() {
  console.log('🔍 Fetching database schema...\n')

  const tables = await getAllTables()
  const schemaInfo = {}

  for (const tableName of tables) {
    console.log(`📋 Table: ${tableName}`)
    const columns = await getTableColumns(tableName)

    if (columns) {
      schemaInfo[tableName] = columns
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`)
      })
    }
    console.log('')
  }

  // 파일로 저장
  const output = {
    generated_at: new Date().toISOString(),
    tables: schemaInfo
  }

  fs.writeFileSync(
    'database/current_schema.json',
    JSON.stringify(output, null, 2)
  )

  console.log('✅ Schema saved to database/current_schema.json')
}

main().catch(console.error)
