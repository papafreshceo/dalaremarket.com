-- 사입관리 테이블 생성
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- ============================================
-- 1. saiup_records 테이블 (사입관리)
-- ============================================
CREATE TABLE IF NOT EXISTS saiup_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- 날짜
  supplier_id UUID REFERENCES suppliers(id),  -- 거래처

  -- 카테고리 (5단계)
  category_1 TEXT,  -- 대분류
  category_2 TEXT,  -- 중분류
  category_3 TEXT,  -- 소분류
  category_4 TEXT,  -- 품목
  category_5 TEXT,  -- 품종

  -- 출하 정보
  shipper_name VARCHAR(200),  -- 출하자
  classification VARCHAR(100),  -- 구분

  -- 수량 및 금액
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,  -- 수량
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,  -- 단가
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,  -- 금액 (수량 × 단가)
  commission DECIMAL(12,2) DEFAULT 0,  -- 수수료
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,  -- 합계 (금액 + 수수료)

  -- 추가 정보
  task VARCHAR(200),  -- 작업
  taste VARCHAR(200),  -- 맛
  notes TEXT,  -- 비고

  -- 메타 정보
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_saiup_records_date ON saiup_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_saiup_records_supplier_id ON saiup_records(supplier_id);
CREATE INDEX IF NOT EXISTS idx_saiup_records_category_4 ON saiup_records(category_4);
CREATE INDEX IF NOT EXISTS idx_saiup_records_category_5 ON saiup_records(category_5);
CREATE INDEX IF NOT EXISTS idx_saiup_records_created_at ON saiup_records(created_at DESC);

-- ============================================
-- 3. RLS 정책
-- ============================================
ALTER TABLE saiup_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_saiup_records"
ON saiup_records
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- ============================================
-- 4. 트리거: 금액 자동 계산
-- ============================================
CREATE OR REPLACE FUNCTION calculate_saiup_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- 금액 = 수량 × 단가
  NEW.amount = NEW.quantity * NEW.unit_price;

  -- 합계 = 금액 + 수수료
  NEW.total_amount = NEW.amount + COALESCE(NEW.commission, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_saiup_amounts
BEFORE INSERT OR UPDATE ON saiup_records
FOR EACH ROW
EXECUTE FUNCTION calculate_saiup_amounts();

-- ============================================
-- 5. 완료 확인
-- ============================================
SELECT 'saiup_records' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'saiup_records';
