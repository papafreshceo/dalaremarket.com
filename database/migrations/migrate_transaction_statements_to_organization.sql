-- =====================================================
-- transaction_statements 테이블을 서브계정 기반으로 마이그레이션
-- =====================================================
-- 작성일: 2025-01-16
-- 설명:
--   transaction_statements = 달래마켓이 서브계정 사업자에게 상품 판매한 거래내역서
--   - seller: 항상 우리 회사 (달래마켓)
--   - buyer: 각 서브계정 사업자들
--
--   변경사항:
--   - buyer_id (auth.users) → buyer_sub_account_id (sub_accounts)
--   - seller 정보는 고정값으로 유지
-- =====================================================

-- =====================================================
-- 1. 새 컬럼 추가 (buyer만)
-- =====================================================
DO $$
BEGIN
  -- buyer 서브계정 ID (상품 구매한 사업자)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_statements' AND column_name = 'buyer_sub_account_id'
  ) THEN
    ALTER TABLE transaction_statements
    ADD COLUMN buyer_sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL;

    RAISE NOTICE 'buyer_sub_account_id 컬럼 추가 완료';
  END IF;
END $$;

-- =====================================================
-- 2. 기존 데이터는 그대로 유지 (서브계정 기반으로만 동작)
-- =====================================================
DO $$
BEGIN
  -- 기존 seller_name, buyer_name 등의 데이터는 그대로 유지
  -- 새로운 거래명세서부터 서브계정/조직 기반으로 생성됨

  RAISE NOTICE '기존 데이터는 현재 상태 유지 (seller_name, buyer_name 등)';
  RAISE NOTICE '향후 거래명세서는 서브계정/조직 ID 기반으로 생성됩니다';
END $$;

-- =====================================================
-- 3. 기존 외래키 제약조건을 SET NULL로 변경
-- =====================================================
DO $$
BEGIN
  -- seller_id는 우리 회사이므로 삭제되지 않음 (그대로 유지)
  -- buyer_id 제약조건만 SET NULL로 변경 (auth.users 참조)
  ALTER TABLE transaction_statements
  DROP CONSTRAINT IF EXISTS transaction_statements_buyer_id_fkey;

  ALTER TABLE transaction_statements
  ADD CONSTRAINT transaction_statements_buyer_id_fkey
  FOREIGN KEY (buyer_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

  RAISE NOTICE 'buyer_id 외래키 SET NULL 설정 완료';
END $$;

-- =====================================================
-- 4. 트리거: 거래명세서 생성/수정 시 buyer 서브계정 정보 자동 입력
-- =====================================================
CREATE OR REPLACE FUNCTION auto_fill_transaction_statement_buyer_info()
RETURNS TRIGGER AS $$
BEGIN
  -- buyer 정보 자동 입력 (서브계정 정보)
  IF NEW.buyer_sub_account_id IS NOT NULL THEN
    -- 서브계정 정보 사용
    SELECT
      business_name,
      business_number,
      representative_name,
      address,
      phone,
      email
    INTO
      NEW.buyer_name,
      NEW.buyer_business_number,
      NEW.buyer_representative,
      NEW.buyer_address,
      NEW.buyer_phone,
      NEW.buyer_email
    FROM sub_accounts
    WHERE id = NEW.buyer_sub_account_id;
  END IF;

  -- seller 정보는 우리 회사 정보로 고정 (이미 테이블에 저장되어 있음)
  -- 필요시 여기서 seller 정보를 고정값으로 설정 가능

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS auto_fill_transaction_statement_buyer_info_trigger ON transaction_statements;

CREATE TRIGGER auto_fill_transaction_statement_buyer_info_trigger
  BEFORE INSERT OR UPDATE OF buyer_sub_account_id
  ON transaction_statements
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_transaction_statement_buyer_info();

-- =====================================================
-- 5. 인덱스 추가
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_statements_buyer_sub_account
ON transaction_statements(buyer_sub_account_id);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'transaction_statements 마이그레이션 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 거래내역서 구조:';
  RAISE NOTICE '  - Seller: 달래마켓 (우리 회사) - 고정';
  RAISE NOTICE '  - Buyer: 서브계정 사업자들 - 변동';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 새 컬럼:';
  RAISE NOTICE '  - buyer_sub_account_id (구매 사업자의 서브계정 ID)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 자동 입력 트리거:';
  RAISE NOTICE '  - buyer_sub_account_id 설정 시 → buyer 정보 자동 입력';
  RAISE NOTICE '  - 자동 입력 필드: buyer_name, buyer_business_number,';
  RAISE NOTICE '    buyer_representative, buyer_address, buyer_phone, buyer_email';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 기존 컬럼 (호환성 유지):';
  RAISE NOTICE '  - seller_id (우리 회사 - 유지)';
  RAISE NOTICE '  - buyer_id (ON DELETE SET NULL)';
  RAISE NOTICE '  - seller/buyer 스냅샷 필드 모두 보존';
  RAISE NOTICE '';
  RAISE NOTICE '📝 사용 예시:';
  RAISE NOTICE '  INSERT INTO transaction_statements (';
  RAISE NOTICE '    doc_number, buyer_sub_account_id, items, ...';
  RAISE NOTICE '  ) VALUES (';
  RAISE NOTICE '    ''DOC-001'', ''서브계정UUID'', ...';
  RAISE NOTICE '  );';
  RAISE NOTICE '  → buyer 정보 자동 입력됨!';
  RAISE NOTICE '========================================';
END $$;
