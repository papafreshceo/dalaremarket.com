const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Supabase 프로젝트: ketdnqhxwqcgyltinjih
const pool = new Pool({
  host: 'db.ketdnqhxwqcgyltinjih.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Neoul12!',
  ssl: { rejectUnauthorized: false }
})

async function runMigration() {
  const client = await pool.connect()

  try {
    console.log('🚀 권한 시스템 마이그레이션 시작...')

    const sqlPath = path.join(__dirname, '../database/migrations/057_create_permissions_system.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    await client.query(sql)

    console.log('✅ 권한 시스템 마이그레이션 완료!')
  } catch (error) {
    console.error('❌ 마이그레이션 실행 오류:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
