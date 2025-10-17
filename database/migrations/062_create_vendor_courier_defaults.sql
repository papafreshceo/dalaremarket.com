-- 062_create_vendor_courier_defaults.sql
-- 벤더사별 기본 택배사 설정 테이블 생성
-- 설명: 벤더사에서 보내는 엑셀 파일에 '택배사' 칼럼이 없을 경우 사용할 기본 택배사 설정

-- vendor_courier_defaults 테이블 생성
CREATE TABLE IF NOT EXISTS vendor_courier_defaults (
  id SERIAL PRIMARY KEY,
  vendor_name VARCHAR(255) NOT NULL UNIQUE,
  default_courier VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

COMMENT ON TABLE vendor_courier_defaults IS '벤더사별 기본 택배사 설정';
COMMENT ON COLUMN vendor_courier_defaults.vendor_name IS '벤더사명 (unique)';
COMMENT ON COLUMN vendor_courier_defaults.default_courier IS '기본 택배사명';
COMMENT ON COLUMN vendor_courier_defaults.created_at IS '생성일시 (UTC)';
COMMENT ON COLUMN vendor_courier_defaults.updated_at IS '수정일시 (UTC)';
COMMENT ON COLUMN vendor_courier_defaults.created_by IS '생성자';
COMMENT ON COLUMN vendor_courier_defaults.updated_by IS '수정자';

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_vendor_courier_defaults_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_courier_defaults_updated_at
  BEFORE UPDATE ON vendor_courier_defaults
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_courier_defaults_updated_at();

-- RLS 활성화
ALTER TABLE vendor_courier_defaults ENABLE ROW LEVEL SECURITY;

-- 관리자 권한 정책
CREATE POLICY "관리자는 모든 벤더 택배사 설정을 볼 수 있습니다"
  ON vendor_courier_defaults
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "관리자는 벤더 택배사 설정을 추가할 수 있습니다"
  ON vendor_courier_defaults
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "관리자는 벤더 택배사 설정을 수정할 수 있습니다"
  ON vendor_courier_defaults
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "관리자는 벤더 택배사 설정을 삭제할 수 있습니다"
  ON vendor_courier_defaults
  FOR DELETE
  TO authenticated
  USING (true);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'vendor_courier_defaults 테이블 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '용도: 벤더사별 기본 택배사 설정';
  RAISE NOTICE '택배사 우선순위: Excel 칼럼 > UI 선택 > 벤더 기본값 > 에러';
  RAISE NOTICE '=================================================';
END $$;
