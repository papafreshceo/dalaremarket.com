-- 실시간 시세 테이블 생성
-- 실행: Supabase SQL Editor에서 이 파일의 내용을 복사하여 실행

CREATE TABLE IF NOT EXISTS realtime_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,

  -- 크롤링 데이터
  source VARCHAR(100) NOT NULL,  -- 출처: '가락시장', '농산물유통정보', '한국농수산식품유통공사' 등
  price DECIMAL(10,2) NOT NULL,  -- 현재 시세
  unit VARCHAR(50),              -- 단위 (kg, box 등)
  grade VARCHAR(50),             -- 등급 (상, 중, 하)

  -- 메타 정보
  crawled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  -- 크롤링 시각
  source_url TEXT,               -- 원본 URL
  is_active BOOLEAN DEFAULT true, -- 활성 여부 (가장 최신만 true)

  -- 인덱스
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_realtime_prices_material_id ON realtime_prices(material_id);
CREATE INDEX IF NOT EXISTS idx_realtime_prices_crawled_at ON realtime_prices(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_prices_is_active ON realtime_prices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_realtime_prices_source ON realtime_prices(source);

-- 복합 인덱스: 특정 원물의 최신 활성 시세 조회용
CREATE INDEX IF NOT EXISTS idx_realtime_prices_material_active
  ON realtime_prices(material_id, is_active, crawled_at DESC)
  WHERE is_active = true;

-- RLS 정책
ALTER TABLE realtime_prices ENABLE ROW LEVEL SECURITY;

-- 모든 사람이 조회 가능
CREATE POLICY "anyone_can_read_realtime_prices"
ON realtime_prices
FOR SELECT
TO public
USING (true);

-- 관리자만 삽입/수정/삭제 가능
CREATE POLICY "admin_all_realtime_prices"
ON realtime_prices
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role IN ('super_admin', 'admin', 'employee')
  )
);

-- 완료 확인
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'realtime_prices'
ORDER BY ordinal_position;
