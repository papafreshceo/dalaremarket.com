#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=#]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

// Read migration file
const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_margin_calculation_fields.sql')
const sql = fs.readFileSync(migrationPath, 'utf8')

console.log('📦 Applying migration: add_margin_calculation_fields.sql')
console.log('─'.repeat(60))

// Execute SQL statements one by one
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'))

for (const statement of statements) {
  if (!statement) continue

  try {
    const { error } = await supabase.rpc('exec_sql', { query: statement })

    if (error) {
      console.error('❌ Error:', error.message)
      console.log('\nTrying direct execution...')

      // Direct execution using fetch
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ query: statement })
      })

      if (!response.ok) {
        console.error('❌ Failed to execute:', statement.substring(0, 100))
        continue
      }
    }

    console.log('✅', statement.substring(0, 60).replace(/\n/g, ' ') + '...')
  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

console.log('─'.repeat(60))
console.log('✅ Migration completed')
console.log('\nPlease verify in Supabase dashboard or run:')
console.log('SELECT column_name, data_type FROM information_schema.columns')
console.log("WHERE table_name = 'option_products' AND column_name IN ('target_margin_amount', 'margin_calculation_type');")
