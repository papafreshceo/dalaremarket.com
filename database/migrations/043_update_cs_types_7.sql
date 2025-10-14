-- =====================================================
-- CS 유형 업데이트 (7개로 정리)
-- =====================================================
-- 작성일: 2025-10-14
-- 설명: CS 유형을 7개로 재정리 (사이트 환불 제거)
-- =====================================================

-- 1. 기존 데이터 삭제
DELETE FROM cs_types;

-- 2. 새로운 CS 유형 7개 삽입
INSERT INTO cs_types (code, name, description, display_order, is_active) VALUES
  ('exchange', '교환', '상품 교환 처리', 1, true),
  ('return', '반품', '상품 반품 처리', 2, true),
  ('full_refund', '전체환불', '전체 금액 환불', 3, true),
  ('partial_refund', '부분환불', '일부 금액 환불', 4, true),
  ('full_resend', '전체재발송', '전체 상품 재발송', 5, true),
  ('partial_resend', '부분재발송', '일부 상품 재발송', 6, true),
  ('other_action', '기타조치', '기타 고객 서비스 조치', 7, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'CS 유형 업데이트 완료 (7개)';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '1. 교환 (exchange)';
  RAISE NOTICE '2. 반품 (return)';
  RAISE NOTICE '3. 전체환불 (full_refund)';
  RAISE NOTICE '4. 부분환불 (partial_refund)';
  RAISE NOTICE '5. 전체재발송 (full_resend)';
  RAISE NOTICE '6. 부분재발송 (partial_resend)';
  RAISE NOTICE '7. 기타조치 (other_action)';
  RAISE NOTICE '=================================================';
END $$;
