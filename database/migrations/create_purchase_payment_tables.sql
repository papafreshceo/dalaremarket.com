-- 구매 및 지급 관리 테이블 생성
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- ============================================
-- 1. purchases 테이블 (구매 주문서)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 주문 정보
  purchase_number VARCHAR(50) UNIQUE NOT NULL,  -- 주문번호 (PO-2025-001)
  supplier_id UUID REFERENCES suppliers(id),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 금액 정보
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL DEFAULT 0,  -- 세금 포함 최종 금액

  -- 상태
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),

  -- 메타 정보
  notes TEXT,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. purchase_items 테이블 (구매 항목)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,

  -- 항목 정보
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('raw_material', 'supply', 'equipment', 'other')),
  material_id UUID REFERENCES raw_materials(id),  -- 원물인 경우

  -- 카테고리 (원물이 아닌 경우 사용)
  category_1 TEXT,
  category_2 TEXT,
  category_3 TEXT,
  category_4 TEXT,
  category_5 TEXT,

  -- 상품 정보
  item_name VARCHAR(200) NOT NULL,
  specification VARCHAR(200),  -- 규격
  unit VARCHAR(50) NOT NULL,   -- 단위 (kg, box, ea 등)

  -- 가격 정보
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,  -- quantity * unit_price

  -- 메타 정보
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. payments 테이블 (지급 관리)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,

  -- 지급 정보
  payment_term VARCHAR(50) CHECK (payment_term IN ('cash', 'credit', 'promissory_note', 'mixed')),  -- 결제조건
  payment_method VARCHAR(50) CHECK (payment_method IN ('bank_transfer', 'cash', 'card', 'check', 'other')),  -- 결제방법
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue')),  -- 결제여부

  -- 계좌 정보
  withdrawal_account VARCHAR(100),  -- 출금계좌

  -- 금액 정보
  payment_amount DECIMAL(12,2) NOT NULL,  -- 지급 금액
  unpaid_amount DECIMAL(12,2) DEFAULT 0,  -- 미지급 금액

  -- 일자 정보
  due_date DATE,  -- 지급예정일
  paid_date DATE,  -- 실제지급일

  -- 메타 정보
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 인덱스 생성
-- ============================================

-- purchases 인덱스
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- purchase_items 인덱스
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_material_id ON purchase_items(material_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_item_type ON purchase_items(item_type);

-- payments 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_paid_date ON payments(paid_date);

-- ============================================
-- 5. RLS 정책
-- ============================================

-- purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_purchases"
ON purchases
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- purchase_items
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_purchase_items"
ON purchase_items
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_payments"
ON payments
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- ============================================
-- 6. 트리거: 구매 항목 추가/수정 시 원물 시세 이력 자동 기록
-- ============================================

CREATE OR REPLACE FUNCTION record_material_price_from_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- 원물인 경우에만 시세 이력 기록
  IF NEW.item_type = 'raw_material' AND NEW.material_id IS NOT NULL THEN
    INSERT INTO material_price_history (
      material_id,
      supplier_id,
      price,
      unit_quantity,
      effective_date,
      price_type,
      notes,
      created_by
    )
    SELECT
      NEW.material_id,
      p.supplier_id,
      NEW.unit_price,
      NEW.quantity,
      p.purchase_date,
      'PURCHASE',
      '구매 주문번호: ' || p.purchase_number,
      p.created_by
    FROM purchases p
    WHERE p.id = NEW.purchase_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_material_price
AFTER INSERT OR UPDATE ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION record_material_price_from_purchase();

-- ============================================
-- 7. 완료 확인
-- ============================================

SELECT 'purchases' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'purchases'
UNION ALL
SELECT 'purchase_items', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'purchase_items'
UNION ALL
SELECT 'payments', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'payments';
