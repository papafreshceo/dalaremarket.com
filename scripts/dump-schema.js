const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://vbdbltdzmnixwkjzmqgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZGJsdGR6bW5peHdranptcWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MDY3NzMsImV4cCI6MjA1MjA4Mjc3M30.9RzXJvEe7cTH2eMiZH-1oaWoS8CZaVgTQcP4hTMm5yc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function dumpSchema() {
  try {
    // 모든 테이블 정보 가져오기
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `
      })

    if (tablesError) {
      console.error('Error:', tablesError)

      // 대안: 각 테이블별로 DESCRIBE
      const knownTables = [
        'raw_materials',
        'option_products',
        'option_product_materials',
        'item_master',
        'supply_statuses',
        'shipping_vendors',
        'invoice_entities',
        'market_commissions',
        'partners',
        'users'
      ]

      let output = '# Database Schema\n\n'

      for (const tableName of knownTables) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (!error && data) {
          output += `## ${tableName}\n\n`
          if (data.length > 0) {
            const columns = Object.keys(data[0])
            columns.forEach(col => {
              output += `- ${col}\n`
            })
          }
          output += '\n'
        }
      }

      fs.writeFileSync('schema.md', output)
      console.log('Schema saved to schema.md')
      return
    }

    // 테이블별로 그룹화
    const tableGroups = {}
    tables.forEach(row => {
      if (!tableGroups[row.table_name]) {
        tableGroups[row.table_name] = []
      }
      tableGroups[row.table_name].push(row)
    })

    // Markdown 형식으로 출력
    let output = '# Database Schema\n\n'
    for (const [tableName, columns] of Object.entries(tableGroups)) {
      output += `## ${tableName}\n\n`
      output += '| Column | Type | Nullable | Default |\n'
      output += '|--------|------|----------|--------|\n'
      columns.forEach(col => {
        output += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || '-'} |\n`
      })
      output += '\n'
    }

    fs.writeFileSync('schema.md', output)
    console.log('Schema saved to schema.md')

  } catch (error) {
    console.error('Error:', error)
  }
}

dumpSchema()
