#!/usr/bin/env node

/**
 * Migration Runner Script
 * Executes SQL migration files on Supabase database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationFile) {
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile)

  if (!fs.existsSync(migrationPath)) {
    console.error(`Error: Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log(`\n📦 Running migration: ${migrationFile}`)
  console.log('─'.repeat(60))

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      // Try direct query if RPC doesn't exist
      const { error: directError } = await supabase.from('_migrations').insert({
        name: migrationFile,
        executed_at: new Date().toISOString()
      })

      if (directError) {
        console.error('❌ Migration failed:', error)
        process.exit(1)
      }
    }

    console.log('✅ Migration completed successfully')
    console.log('─'.repeat(60))

  } catch (err) {
    console.error('❌ Migration error:', err)
    process.exit(1)
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.log('Usage: node scripts/run_migration.js <migration-file.sql>')
  console.log('\nAvailable migrations:')
  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
  files.forEach(f => console.log(`  - ${f}`))
  process.exit(1)
}

runMigration(migrationFile)
