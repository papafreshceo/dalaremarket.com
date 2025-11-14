/**
 * Supabase 설정 파일
 * 환경 변수에서 Supabase 클라이언트를 생성합니다.
 *
 * 사용 방법:
 * 1. 루트에 .env.local 파일 생성
 * 2. SUPABASE_SERVICE_ROLE_KEY 환경 변수 설정
 * 3. const { supabase } = require('./scripts/supabase-config') 로 import
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// .env.local 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다!')
  console.error('다음 환경 변수를 .env.local 파일에 설정해주세요:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('.env.local.example 파일을 참고하세요.')
  process.exit(1)
}

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

module.exports = {
  supabase,
  supabaseUrl,
  supabaseServiceKey
}
