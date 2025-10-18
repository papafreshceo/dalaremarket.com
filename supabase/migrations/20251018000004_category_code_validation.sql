-- 같은 품목(category_4)은 항상 같은 품목코드(category_4_code)를 가져야 함
-- 이를 보장하기 위한 트리거 추가

CREATE OR REPLACE FUNCTION validate_category_4_code()
RETURNS TRIGGER AS $$
DECLARE
  existing_code TEXT;
BEGIN
  -- category_4가 있고 expense_type이 '사입'인 경우만 체크
  IF NEW.category_4 IS NOT NULL
     AND NEW.category_4 != ''
     AND NEW.expense_type = '사입' THEN

    -- 동일한 품목의 기존 코드 조회
    SELECT category_4_code INTO existing_code
    FROM category_settings
    WHERE category_4 = NEW.category_4
      AND expense_type = '사입'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND category_4_code IS NOT NULL
    LIMIT 1;

    -- 기존 코드가 있으면
    IF existing_code IS NOT NULL THEN
      -- 새로 입력한 코드가 비어있으면 기존 코드 사용
      IF NEW.category_4_code IS NULL OR NEW.category_4_code = '' THEN
        NEW.category_4_code := existing_code;
        RAISE NOTICE '품목 "%" 의 기존 코드 "%"를 자동 적용했습니다.', NEW.category_4, existing_code;
      -- 새로 입력한 코드가 기존과 다르면 경고
      ELSIF NEW.category_4_code != existing_code THEN
        RAISE EXCEPTION '품목 "%"는 이미 코드 "%"를 사용 중입니다. 다른 코드 "%"를 사용할 수 없습니다.',
          NEW.category_4, existing_code, NEW.category_4_code;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (INSERT/UPDATE 전에 실행)
DROP TRIGGER IF EXISTS trg_validate_category_4_code ON category_settings;
CREATE TRIGGER trg_validate_category_4_code
BEFORE INSERT OR UPDATE ON category_settings
FOR EACH ROW
EXECUTE FUNCTION validate_category_4_code();

COMMENT ON FUNCTION validate_category_4_code() IS '같은 품목은 항상 동일한 품목코드를 사용하도록 검증';
