-- 품목 마스터 테이블 생성
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

-- ============================================
-- 1. item_master 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS item_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 품목 정보
  item_name VARCHAR(200) UNIQUE NOT NULL,  -- 품목명 (키값, 중복 불가)

  -- 카테고리 계층 구조
  category_1 VARCHAR(100),  -- 대분류
  category_2 VARCHAR(100),  -- 중분류
  category_3 VARCHAR(100),  -- 소분류
  category_4 VARCHAR(100),  -- 품목 (item_name과 동일하게 저장)

  -- 상태
  is_active BOOLEAN DEFAULT true,

  -- 메타 정보
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_item_master_item_name ON item_master(item_name);
CREATE INDEX IF NOT EXISTS idx_item_master_category_1 ON item_master(category_1);
CREATE INDEX IF NOT EXISTS idx_item_master_category_2 ON item_master(category_2);
CREATE INDEX IF NOT EXISTS idx_item_master_category_3 ON item_master(category_3);
CREATE INDEX IF NOT EXISTS idx_item_master_is_active ON item_master(is_active);

-- ============================================
-- 3. RLS 정책
-- ============================================
ALTER TABLE item_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_item_master"
ON item_master
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- ============================================
-- 4. 트리거: updated_at 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_item_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- category_4는 item_name과 동일하게 자동 설정
  NEW.category_4 = NEW.item_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_item_master_updated_at
BEFORE UPDATE ON item_master
FOR EACH ROW
EXECUTE FUNCTION update_item_master_updated_at();

-- ============================================
-- 5. 샘플 데이터 (선택사항)
-- ============================================
INSERT INTO item_master (item_name, category_1, category_2, category_3, notes) VALUES
('양파', '채소류', '양념채소', '구근채소', '일반 양파'),
('감자', '채소류', '서류', '감자류', '일반 감자'),
('사과', '과일류', '이과류', '사과류', '일반 사과')
ON CONFLICT (item_name) DO NOTHING;

-- ============================================
-- 6. 완료 확인
-- ============================================
SELECT 'item_master' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'item_master';

SELECT * FROM item_master ORDER BY created_at DESC LIMIT 5;
