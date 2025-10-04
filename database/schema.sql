-- 달래마켓 데이터베이스 스키마
-- Version: 1.0.0
-- Date: 2024-01-03

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- users 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'employee', 'customer', 'vip_customer', 'partner')),
  approved BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- products 테이블
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  supplier_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT '개',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- orders 테이블
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  invoice_number TEXT,
  tracking_number TEXT,
  notes TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- order_items 테이블
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 원물 관리 시스템 테이블
-- ============================================

-- material_categories 테이블 (6단계 계층 구조)
-- Level 1: 대분류, Level 2: 중분류, Level 3: 소분류
-- Level 4: 세분류, Level 5: 품목, Level 6: 품종
CREATE TABLE IF NOT EXISTS material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 6),
  parent_id UUID REFERENCES material_categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- suppliers 테이블 (거래처)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  business_number TEXT,
  representative TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  supplier_type TEXT CHECK (supplier_type IN ('농가', '도매상', '직거래', '수입상', '기타')),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- raw_materials 테이블 (원물)
CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_code TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  category_level_1_id UUID REFERENCES material_categories(id),
  category_level_2_id UUID REFERENCES material_categories(id),
  category_level_3_id UUID REFERENCES material_categories(id),
  category_level_4_id UUID REFERENCES material_categories(id),
  category_level_5_id UUID REFERENCES material_categories(id),
  category_level_6_id UUID REFERENCES material_categories(id),
  category_1 TEXT,
  category_2 TEXT,
  category_3 TEXT,
  category_4 TEXT,
  category_5 TEXT,
  item_type TEXT,
  variety TEXT,
  standard_unit TEXT DEFAULT 'kg',
  supply_status TEXT DEFAULT '대기중' CHECK (supply_status IN ('대기중', '공급중', '일시중단', '품절', '시즌종료')),
  season TEXT CHECK (season IN ('봄', '여름', '가을', '겨울', '연중', NULL)),
  season_start_date DATE,
  season_peak_date DATE,
  season_end_date DATE,
  latest_price DECIMAL(10,2),
  unit_quantity DECIMAL(10,2),
  last_trade_date DATE,
  color_code TEXT,
  main_supplier_id UUID REFERENCES suppliers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- material_price_history 테이블 (원물 시세 이력)
CREATE TABLE IF NOT EXISTS material_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  price DECIMAL(10,2) NOT NULL,
  unit_quantity DECIMAL(10,2) DEFAULT 1,
  price_type TEXT DEFAULT 'PURCHASE' CHECK (price_type IN ('PURCHASE', 'MARKET', 'RETAIL')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================

-- 기존 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 원물 관리 인덱스
CREATE INDEX IF NOT EXISTS idx_material_categories_level ON material_categories(level);
CREATE INDEX IF NOT EXISTS idx_material_categories_parent_id ON material_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category_1 ON raw_materials(category_level_1_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category_2 ON raw_materials(category_level_2_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category_3 ON raw_materials(category_level_3_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_supplier ON raw_materials(main_supplier_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_status ON raw_materials(supply_status);
CREATE INDEX IF NOT EXISTS idx_material_price_material_id ON material_price_history(material_id);
CREATE INDEX IF NOT EXISTS idx_material_price_effective_date ON material_price_history(effective_date DESC);

-- ============================================
-- 3. RLS (Row Level Security) 설정
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 원물 관리 테이블 RLS
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_price_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. 함수 및 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 원물 관리 트리거
CREATE TRIGGER update_material_categories_updated_at BEFORE UPDATE ON material_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON raw_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 뷰(View) 생성
-- ============================================

-- 원물 전체 정보 뷰 (카테고리 6단계 + 거래처 + 최신시세)
CREATE OR REPLACE VIEW v_raw_materials_full AS
SELECT
  rm.*,
  c1.name as category_level_1,
  c2.name as category_level_2,
  c3.name as category_level_3,
  c4.name as category_level_4,
  c5.name as category_level_5,
  c6.name as category_level_6,
  s.name as supplier_name,
  s.phone as supplier_phone,
  (
    SELECT mph.price
    FROM material_price_history mph
    WHERE mph.material_id = rm.id
    ORDER BY mph.effective_date DESC, mph.created_at DESC
    LIMIT 1
  ) as latest_price,
  (
    SELECT mph.effective_date
    FROM material_price_history mph
    WHERE mph.material_id = rm.id
    ORDER BY mph.effective_date DESC, mph.created_at DESC
    LIMIT 1
  ) as latest_price_date
FROM raw_materials rm
LEFT JOIN material_categories c1 ON rm.category_level_1_id = c1.id
LEFT JOIN material_categories c2 ON rm.category_level_2_id = c2.id
LEFT JOIN material_categories c3 ON rm.category_level_3_id = c3.id
LEFT JOIN material_categories c4 ON rm.category_level_4_id = c4.id
LEFT JOIN material_categories c5 ON rm.category_level_5_id = c5.id
LEFT JOIN material_categories c6 ON rm.category_level_6_id = c6.id
LEFT JOIN suppliers s ON rm.main_supplier_id = s.id;