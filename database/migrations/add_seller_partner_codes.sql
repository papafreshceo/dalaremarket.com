-- 셀러 코드와 파트너 코드 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS seller_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS partner_code VARCHAR(20) UNIQUE;

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_users_seller_code ON users(seller_code);
CREATE INDEX IF NOT EXISTS idx_users_partner_code ON users(partner_code);

-- 셀러 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_seller_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- S + 6자리 랜덤 숫자 (예: S123456)
    new_code := 'S' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- 중복 체크
    SELECT EXISTS(SELECT 1 FROM users WHERE seller_code = new_code) INTO code_exists;

    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 파트너 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_partner_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- P + 6자리 랜덤 숫자 (예: P123456)
    new_code := 'P' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- 중복 체크
    SELECT EXISTS(SELECT 1 FROM users WHERE partner_code = new_code) INTO code_exists;

    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 기존 셀러들에게 코드 할당
UPDATE users
SET seller_code = generate_seller_code()
WHERE role = 'seller' AND seller_code IS NULL;

-- 기존 파트너들에게 코드 할당
UPDATE users
SET partner_code = generate_partner_code()
WHERE role = 'partner' AND partner_code IS NULL;

COMMENT ON COLUMN users.seller_code IS '셀러 고유 코드 (예: S123456)';
COMMENT ON COLUMN users.partner_code IS '파트너 고유 코드 (예: P123456)';
