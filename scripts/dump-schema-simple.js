const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://vbdbltdzmnixwkjzmqgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZGJsdGR6bW5peHdranptcWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MDY3NzMsImV4cCI6MjA1MjA4Mjc3M30.9RzXJvEe7cTH2eMiZH-1oaWoS8CZaVgTQcP4hTMm5yc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function dumpSchema() {
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
    'partner_types',
    'users'
  ]

  let output = '# Database Schema\n\n'
  output += `Generated: ${new Date().toISOString()}\n\n`

  for (const tableName of knownTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (!error && data !== null) {
        output += `## ${tableName}\n\n`
        if (data.length > 0) {
          const columns = Object.keys(data[0])
          const example = data[0]

          output += '| Column | Example Value | Type |\n'
          output += '|--------|---------------|------|\n'

          columns.forEach(col => {
            const val = example[col]
            const type = typeof val
            const displayVal = val === null ? 'null' :
                             typeof val === 'string' ? `"${val.substring(0, 30)}"` :
                             String(val).substring(0, 30)
            output += `| ${col} | ${displayVal} | ${type} |\n`
          })
        } else {
          output += '*Empty table*\n'
        }
        output += '\n'
        console.log(`✓ ${tableName}`)
      } else {
        output += `## ${tableName}\n\n*Table not accessible or does not exist*\n\n`
        console.log(`✗ ${tableName}`)
      }
    } catch (err) {
      output += `## ${tableName}\n\n*Error: ${err.message}*\n\n`
      console.log(`✗ ${tableName}: ${err.message}`)
    }
  }

  fs.writeFileSync('schema.md', output)
  console.log('\nSchema saved to schema.md')
}

dumpSchema()
