require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const createTableSQL = `
-- 품목 마스터 테이블 생성
CREATE TABLE IF NOT EXISTS products_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_1 VARCHAR(100),
  category_2 VARCHAR(100),
  category_3 VARCHAR(100),
  category_4 VARCHAR(100),
  category_4_code VARCHAR(50),
  raw_material_status VARCHAR(50),
  shipping_deadline INTEGER,
  season_start_date VARCHAR(5),
  season_end_date VARCHAR(5),
  seller_supply BOOLEAN DEFAULT true,
  is_best BOOLEAN DEFAULT false,
  is_recommended BOOLEAN DEFAULT false,
  has_image BOOLEAN DEFAULT false,
  has_detail_page BOOLEAN DEFAULT false,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_category_combination UNIQUE (category_1, category_2, category_3, category_4)
);

CREATE INDEX IF NOT EXISTS idx_products_master_category_4 ON products_master(category_4);
CREATE INDEX IF NOT EXISTS idx_products_master_active ON products_master(is_active);
`

async function createTable() {
  console.log('products_master 테이블 생성 중...\n')
  console.log('Supabase SQL Editor에서 다음 파일을 실행해주세요:')
  console.log('supabase/migrations/20251020000003_create_products_master.sql\n')
  console.log('또는 Supabase Dashboard > SQL Editor에서 직접 실행하세요.')
}

createTable()
