-- 시즌 날짜 필드를 date에서 text(MM-DD)로 변경
-- 기존 데이터가 있다면 월/일만 추출하여 변환

-- 1. 임시 컬럼 생성
ALTER TABLE raw_materials
  ADD COLUMN season_start_date_temp text,
  ADD COLUMN season_peak_date_temp text,
  ADD COLUMN season_end_date_temp text;

-- 2. 기존 데이터를 MM-DD 형식으로 변환하여 임시 컬럼에 저장
UPDATE raw_materials
SET
  season_start_date_temp = CASE
    WHEN season_start_date IS NOT NULL
    THEN TO_CHAR(season_start_date, 'MM-DD')
    ELSE NULL
  END,
  season_peak_date_temp = CASE
    WHEN season_peak_date IS NOT NULL
    THEN TO_CHAR(season_peak_date, 'MM-DD')
    ELSE NULL
  END,
  season_end_date_temp = CASE
    WHEN season_end_date IS NOT NULL
    THEN TO_CHAR(season_end_date, 'MM-DD')
    ELSE NULL
  END;

-- 3. 기존 컬럼 삭제
ALTER TABLE raw_materials
  DROP COLUMN season_start_date,
  DROP COLUMN season_peak_date,
  DROP COLUMN season_end_date;

-- 4. 임시 컬럼 이름을 원래 이름으로 변경
ALTER TABLE raw_materials
  RENAME COLUMN season_start_date_temp TO season_start_date;
ALTER TABLE raw_materials
  RENAME COLUMN season_peak_date_temp TO season_peak_date;
ALTER TABLE raw_materials
  RENAME COLUMN season_end_date_temp TO season_end_date;

-- 5. 코멘트 추가
COMMENT ON COLUMN raw_materials.season_start_date IS '시즌 시작일 (MM-DD 형식, 예: 03-15)';
COMMENT ON COLUMN raw_materials.season_peak_date IS '시즌 피크일 (MM-DD 형식, 예: 06-20)';
COMMENT ON COLUMN raw_materials.season_end_date IS '시즌 종료일 (MM-DD 형식, 예: 09-30)';
